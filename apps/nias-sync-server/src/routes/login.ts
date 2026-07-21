import { asc, and, eq, isNull, inArray } from 'drizzle-orm';
import type { Logger } from 'pino';
import { local, server } from '@nias/shared';
import { users, verifyPassword, type Envelope } from '@nias/shared/server';
import { db } from '../db.js';
import { supabase } from '../supabase.js';

export async function syncLocalUsers(
  payload: local.UserSync,
  context?: { log?: Logger; userId?: string },
): Promise<Envelope<local.UserSyncDelta>> {
  try {
    if (payload.id.length === 0) {
      context?.log?.info({ scope: 'login' }, 'No local users to sync');
      return {
        success: true,
        message: 'No local users to sync',
        data: { upsert: [], delete: [] },
      };
    }

    const serverUser = await db
      .select({
        id: users.id,
        email: users.email,
        passwordHash: users.passwordHash,
        syncVersion: users.syncVersion,
        deletedAt: users.deletedAt,
      })
      .from(users)
      .where(inArray(users.id, payload.id))
      .orderBy(asc(users.id));

    const upsert: local.UserSyncDelta['upsert'] = [];
    const deletedId: string[] = [];

    const versionMap = new Map(payload.id.map((id, index) => [id, payload.syncVersion[index]]));

    for (const user of serverUser) {
      if (user.deletedAt !== null) {
        context?.log?.info({ scope: 'login', userId: user.id }, 'User marked as deleted on server');
        deletedId.push(user.id);
        continue;
      }

      const localVersion = versionMap.get(user.id) ?? 0;

      if (user.syncVersion > localVersion) {
        context?.log?.info(
          { scope: 'login', userId: user.id, localVersion, serverVersion: user.syncVersion },
          'User has newer version on server, adding to changes',
        );
        upsert.push({
          id: user.id,
          email: user.email,
          passwordHash: user.passwordHash,
          syncVersion: user.syncVersion,
        });
      }
    }

    return {
      success: true,
      message: 'Local users synced successfully',
      data: { upsert, delete: deletedId },
    };
  } catch (error) {
    context?.log?.error({ scope: 'login', error }, 'Error syncing local users');
    return { success: false, message: 'Error syncing local users' };
  }
}

export async function initialLogin(
  payload: local.Login,
  context?: { log?: Logger; userId?: string },
): Promise<Envelope<local.LoginResponse>> {
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

  const { accessToken, refreshToken, expiresAt } = supabaseSession.data;
  const user = await getUser(payload, context);

  if (!user?.success) {
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
      id: user.data.id,
      syncVersion: user.data.syncVersion,
      accessToken,
      refreshToken,
      expiresAt,
    },
  };
}

async function signIntoSupabase(
  payload: local.Login,
  context?: { log?: Logger; userId?: string },
): Promise<Envelope<server.Token> | null> {
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
        refreshToken: data.session.refresh_token,
        // Convert the expiration time from seconds to milliseconds and then to ISO string
        expiresAt: new Date(data.session.expires_at * 1000).toISOString(),
      },
    };
  } catch (error) {
    context?.log?.error({ scope: 'login', error }, 'Error during Supabase sign-in');
    return null;
  }
}

async function getUser(
  payload: local.Login,
  context?: { log?: Logger; userId?: string },
): Promise<Envelope<local.UserData> | null> {
  try {
    const user = await db
      .select({
        id: users.id,
        email: users.email,
        passwordHash: users.passwordHash,
        syncVersion: users.syncVersion,
      })
      .from(users)
      .where(and(eq(users.email, payload.email), isNull(users.deletedAt)))
      .limit(1)
      // Drizzle returns an array, so we explicitly extract the first
      // match to treat the result as a single record.
      .then((rows) => rows[0] ?? null);
    
    if (user) {
      const isPasswordValid = await verifyPassword(payload.password, user.passwordHash);

      if (!isPasswordValid) {
        context?.log?.warn(
          { scope: 'login', email: user.email },
          'Password verification failed for user',
        );
        return { success: false, message: 'Invalid credentials' };
      }
    } else {
      context?.log?.info({ scope: 'login', email: payload.email }, 'User not found');
      return { success: false, message: 'User not found' };
    }

    return {
      success: true,
      message: 'Supabase session retrieved successfully',
      data: {
        ...user
      },
    };
  } 
  catch (error) {
    context?.log?.error({ scope: 'login', error }, 'Error getting user');
    return { success: false, message: 'Error getting user' };
  }
}
