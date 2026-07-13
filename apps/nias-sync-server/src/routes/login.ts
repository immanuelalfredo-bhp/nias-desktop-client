import { asc, eq, inArray } from 'drizzle-orm';
import type { Logger } from 'pino';
import { auth } from '@nias/shared';
import { authUsers, users, verifyPassword, type Envelope } from '@nias/shared/server';
import { db } from '../db.js';
import { supabase } from '../supabase.js';

export async function syncLocalUsers(
  payload: auth.LoginSyncState,
  context?: { log?: Logger; userId?: string },
): Promise<Envelope<auth.LoginSyncDelta>> {
  try {
    if (payload.length === 0) {
      context?.log?.info({ scope: 'login' }, 'No local users to sync');
      return {
        success: true,
        message: 'No local users to sync',
        data: { changes: [], deletedUserIds: [] },
      };
    }

    const serverUsers = await db
      .select({
        id: users.id,
        email: users.email,
        passwordHash: users.passwordHash,
        syncVersion: users.syncVersion,
        jwtToken: authUsers.accessToken,
        jwtTokenExpiration: authUsers.expiresAt,
        deletedAt: users.deletedAt,
      })
      .from(users)
      .innerJoin(authUsers, eq(users.id, authUsers.id))
      .where(
        inArray(
          users.id,
          payload.map((item) => item.id),
        ),
      )
      .orderBy(asc(users.syncVersion));

    const changes: auth.LoginData[] = [];
    const deletedUserIds: string[] = [];

    // We use a Map for O(1) lookups during the iteration,
    // ensuring O(n) performance even with large local user lists.
    const versionMap = new Map(payload.map((item) => [item.id, item.syncVersion]));

    for (const user of serverUsers) {
      if (user.deletedAt !== null) {
        context?.log?.info({ scope: 'login', userId: user.id }, 'User marked as deleted on server');
        deletedUserIds.push(user.id);
        continue;
      }

      const localVersion = versionMap.get(user.id) ?? 0;

      if (user.syncVersion > localVersion) {
        context?.log?.info(
          { scope: 'login', userId: user.id, localVersion, serverVersion: user.syncVersion },
          'User has newer version on server, adding to changes',
        );
        changes.push({
          id: user.id,
          email: user.email,
          passwordHash: user.passwordHash,
          syncVersion: user.syncVersion,
          jwtToken: user.jwtToken,
          jwtTokenExpiration: user.jwtTokenExpiration.getTime(),
        });
      }
    }

    context?.log?.info(
      { scope: 'login', changesCount: changes.length, deletedCount: deletedUserIds.length },
      'Completed syncing local users',
    );

    return {
      success: true,
      message: 'Local users synced successfully',
      data: { changes, deletedUserIds },
    };
  } catch (error) {
    context?.log?.error({ scope: 'login', error }, 'Error syncing local users');
    return { success: false, message: 'Error syncing local users' };
  }
}

export async function initialLogin(
  payload: auth.LoginCredentials,
  context?: { log?: Logger; userId?: string },
): Promise<Envelope<auth.LoginData>> {
  const supabaseSession = await signIntoSupabase(payload, context);

  if (!supabaseSession?.success) {
    context?.log?.warn(
      { scope: 'login', email: payload.email },
      'Initial login failed: Supabase authentication failed',
    );
    return {
      success: false,
      message: 'Initial login failed: Supabase authentication failed',
    };
  }

  const { accessToken, expiresAt } = supabaseSession.data;

  const localUser = await fetchLocalUser(payload, context);

  if (!localUser?.success) {
    context?.log?.warn(
      { scope: 'login', email: payload.email },
      'Initial login failed: Local user verification failed',
    );
    return {
      success: false,
      message: 'Initial login failed: Local user verification failed',
    };
  }

  // We prefer the local database for user metadata (roles, preferences)
  // while relying on Supabase for the primary auth token.
  return {
    success: true,
    message: 'Initial login successful',
    data: {
      ...localUser.data,
      jwtToken: accessToken,
      // Convert from JavaScript Date (milliseconds) to a standard Unix timestamp (milliseconds)
      // for consistency with the application's internal data format.
      jwtTokenExpiration: expiresAt.getTime(),
    },
  };
}

async function signIntoSupabase(
  payload: auth.LoginCredentials,
  context?: { log?: Logger; userId?: string },
): Promise<Envelope<auth.SupabaseSession> | null> {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: payload.email,
      password: payload.password,
    });

    if (error) {
      context?.log?.error({ scope: 'login', error }, 'Supabase sign-in failed');
      return null;
    }

    if (!data.session || !data.session.access_token || !data.session.expires_at) {
      context?.log?.error(
        { scope: 'login', data },
        'Supabase sign-in returned incomplete session data',
      );
      return null;
    }

    return {
      success: true,
      message: 'Supabase sign-in successful',
      data: {
        accessToken: data.session.access_token,
        // Supabase returns 'expires_at' in seconds (Unix timestamp),
        // but JavaScript's Date constructor expects milliseconds.
        expiresAt: new Date(data.session.expires_at * 1000),
      },
    };
  } catch (error) {
    context?.log?.error({ scope: 'login', error }, 'Error during Supabase sign-in');
    return null;
  }
}

async function fetchLocalUser(
  payload: auth.LoginCredentials,
  context?: { log?: Logger; userId?: string },
): Promise<Envelope<auth.LoginData> | null> {
  try {
    const user = await db
      .select({
        id: users.id,
        email: users.email,
        passwordHash: users.passwordHash,
        syncVersion: users.syncVersion,
      })
      .from(users)
      .where(eq(users.email, payload.email))
      .limit(1)
      // Drizzle returns an array, so we explicitly extract the first
      // match to treat the result as a single record.
      .then((rows) => rows[0] ?? null);

    if (user) {
      const isPasswordValid = await verifyPassword(user.passwordHash, payload.password);

      if (!isPasswordValid) {
        context?.log?.warn(
          { scope: 'login', email: user.email },
          'Password verification failed for local user',
        );
        return { success: false, message: 'Invalid credentials' };
      }
    } else {
      context?.log?.info({ scope: 'login', email: payload.email }, 'Local user not found');
      return { success: false, message: 'Local user not found' };
    }

    const session = await supabase.auth.getSession();

    if (!session.data.session) {
      context?.log?.error(
        { scope: 'login', email: user.email },
        'Supabase session retrieval failed after local user verification',
      );
      return { success: false, message: 'Supabase session retrieval failed' };
    }

    const jwtToken = session.data.session.access_token;
    const jwtTokenExpiration = new Date(session.data.session.expires_at! * 1000);

    const normalizedUser = {
      ...user,
      jwtToken,
      jwtTokenExpiration: jwtTokenExpiration.getTime(), // Converts Date to Unix timestamp (ms)
    };

    context?.log?.info(
      { scope: 'login', userId: normalizedUser.id, email: normalizedUser.email },
      'Local user fetched successfully',
    );

    return { success: true, message: 'Local user fetched successfully', data: normalizedUser };
  } catch (error) {
    context?.log?.error({ scope: 'login', error }, 'Error fetching local user');
    return { success: false, message: 'Error fetching local user' };
  }
}
