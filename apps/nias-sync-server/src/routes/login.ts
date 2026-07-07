import { asc, eq, inArray } from 'drizzle-orm';
import type { Logger } from 'pino';
import {
  auth,
  common,
  verifyPassword,
} from '@nias/shared';
import { db } from '../db.js';
import { authUsers, users } from '../schema/index.js';
import { supabase } from '../supabase.js';

export async function syncLocalUsers(
  payload: auth.LoginSyncState[],
  context?: { log?: Logger; userId?: string }
): Promise<auth.LoginSyncDelta | common.SuccessResponse> {
  try {
    if (payload.length === 0) {
			context?.log?.info('No local users to sync');
      return { success: true, changes: [], deletedUserIds: [] };
    }

    const serverUsers = await db
      .select({
        id: users.id,
        username: users.username,
				email: users.email,
        passwordHash: users.passwordHash,
        syncVersion: users.syncVersion,
				jwtToken: authUsers.accessToken,
				jwtTokenExpiration: authUsers.expiresAt,
        deletedAt: users.deletedAt,
      })
      .from(users)
			.innerJoin(authUsers, eq(users.id, authUsers.id))
      .where(inArray(users.id, payload.map((item) => item.id)))
      .orderBy(asc(users.syncVersion));

    const changes: auth.LoginData[] = [];
    const deletedUserIds: string[] = [];

    const versionMap = new Map(
      payload.map((item) => [item.id, item.syncVersion])
    );

    for (const user of serverUsers) {
      if (user.deletedAt !== null) {
				context?.log?.info({ userId: user.id }, 
					'User marked as deleted on server');
        deletedUserIds.push(user.id);
        continue;
      }

      const localVersion = versionMap.get(user.id) ?? 0;

      if (user.syncVersion > localVersion) {
				context?.log?.info({ userId: user.id, localVersion, serverVersion: user.syncVersion },
					'User has newer version on server, adding to changes');
        changes.push({
          success: true,
          id: user.id,
          username: user.username,
          email: user.email,
          passwordHash: user.passwordHash,
          syncVersion: user.syncVersion,
					jwtToken: user.jwtToken,
					jwtTokenExpiration: user.jwtTokenExpiration.getTime(),
        });
      }
    }

		context?.log?.info(
			{ changesCount: changes.length, deletedCount: deletedUserIds.length },
			'Completed syncing local users'
		);

    return { success: true, changes, deletedUserIds };
  } catch (error) {
		context?.log?.error({ error }, 'Error syncing local users');
		return { success: false, message: 'Error syncing local users' };
  }
}

export async function initialLogin(
	payload: auth.LoginCredentials,
	context?: { log?: Logger; userId?: string }
): Promise<auth.LoginData | common.SuccessResponse> {
  
	const supabaseSession = await signIntoSupabase(payload, context);

  if (!supabaseSession) {
    context?.log?.warn(
      { username: payload.username },
      'Initial login failed: Supabase authentication failed'
    );
    return { success: false, message: 'Initial login failed: Supabase authentication failed' };
  }

	const { accessToken, expiresAt } = supabaseSession;

	const localUser = await fetchLocalUser(payload, context);

  if (!localUser.success) {
    context?.log?.warn(
      { username: payload.username },
      'Initial login failed: local user not found or invalid credentials'
    );
    return { success: false, message: 'Initial login failed: local user not found or invalid credentials' };
  }

	return {
		...localUser,
		jwtToken: accessToken,
		jwtTokenExpiration: expiresAt.getTime(),
	};
}

async function signIntoSupabase(	
	payload: auth.LoginCredentials,
	context?: { log?: Logger; userId?: string }
) {
	try {
		const { data, error } = await supabase.auth.signInWithPassword({
			email: payload.email,
			password: payload.password,
		});

		if (error) {
			context?.log?.error({ error }, 'Supabase sign-in failed');
			throw new Error(`Supabase sign-in failed: ${error.message}`);
		}

		if (!data.session || !data.session.access_token || !data.session.expires_at) {
			context?.log?.error({ data }, 'Supabase sign-in returned incomplete session data');
			throw new Error('Supabase sign-in returned incomplete session data');
		}

		return {
			accessToken: data.session.access_token,
			expiresAt: new Date(data.session.expires_at * 1000), // Convert seconds to milliseconds
		};

	} catch (error) {
		context?.log?.error({ error }, 'Error during Supabase sign-in');
		throw new Error('Error during Supabase sign-in');
	}
}

async function fetchLocalUser(
  payload: auth.LoginCredentials,
  context?: { log?: Logger; userId?: string }
): Promise<auth.LoginData | common.SuccessResponse> {
  try {
    const user = await db
      .select({
        id: users.id,
        username: users.username,
				email: users.email,
        passwordHash: users.passwordHash,
        syncVersion: users.syncVersion,
				jwtToken: authUsers.accessToken,
				jwtTokenExpiration: authUsers.expiresAt,
      })
      .from(users)
			.innerJoin(authUsers, eq(users.id, authUsers.id))
      .where(eq(users.username, payload.username))
      .limit(1)
      .then(rows => rows[0] ?? null);
      
    if (user) {
      const isPasswordValid = await verifyPassword(user.passwordHash, payload.password);

      if (!isPasswordValid) {
        context?.log?.warn(
          { username: user.username },
          'Password verification failed for local user'
        );
        return { success: false, message: 'Invalid credentials' };
      }
    } else {
      context?.log?.info(
        { username: payload.username },
        'Local user not found'
      );
      return { success: false, message: 'Local user not found' };
    }

		const normalizedUser = {
			...user,
			jwtTokenExpiration: user.jwtTokenExpiration.getTime(), // Converts Date to Unix timestamp (ms)
		};

		context?.log?.info(
			{ userId: normalizedUser.id, username: normalizedUser.username },
			'Local user fetched successfully'
		);

    return { success: true, ...normalizedUser };
  } catch (error) {
    context?.log?.error({ error }, 'Error fetching local user');
		return { success: false, message: 'Error fetching local user' };
  }
}