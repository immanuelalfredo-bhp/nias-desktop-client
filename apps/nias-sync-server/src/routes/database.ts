import { count } from 'drizzle-orm';
import type { Logger } from 'pino';
import { type Request, type Response } from 'express';
import { eq } from 'drizzle-orm';
import { system, sync } from '@nias/shared';
import { users, type Envelope } from '@nias/shared/server';
import { db } from '../db.js';
import { supabaseAdmin } from '../supabase.js';

export async function handleCreateUser(
  payload: system.CreateUser,
  context?: { log?: Logger; userId?: string },
): Promise<Envelope<sync.UserSyncVersion>> {
  const existingUser = await db.query.users.findFirst({
    where: eq(users.email, payload.email),
  });
  if (existingUser) {
    context?.log?.warn(
      { scope: 'create-user', email: payload.email },
      'Failed to create user: User with this email already exists',
    );
    return { success: false, message: 'User with this email already exists' };
  }
  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email: payload.email,
    password: payload.password,
    email_confirm: true,
  });

  if (error) {
    context?.log?.error(
      { scope: 'create-user', error: error },
      'Failed to create user in Supabase',
    );
    return { success: false, message: 'Failed to create user in Supabase' };
  }
  return await db.transaction(async (tx) => {
    try {
      const userData: typeof users.$inferInsert = {
        id: data.user.id,
        displayName: payload.displayName,
        email: payload.email,
        passwordHash: payload.passwordHash,
        isManagedBy: payload.isManagedBy ?? null,
        isSynced: true,
        syncVersion: 0,
      };
      const [newUser] = await tx
        .insert(users)
        .values(userData)
        .returning({ id: users.id, syncVersion: users.syncVersion });

      if (!newUser) {
        context?.log?.error(
          { scope: 'create-user', userId: data.user.id },
          'Failed to retrieve newly created user from the database',
        );
				throw new Error('Failed to retrieve newly created user from the database');
      }

      context?.log?.info(
        { scope: 'create-user', userId: data.user.id },
        'User created successfully in the database',
      );

      return {
        success: true,
        message: 'User created successfully',
        data: { userId: newUser.id, syncVersion: newUser.syncVersion },
      };
    } catch (err) {
      context?.log?.error(
        { scope: 'create-user', error: err, userId: data.user.id },
        'Failed to insert user into the database',
      );
      await supabaseAdmin.auth.admin.deleteUser(data.user.id);
      context?.log?.info(
        { scope: 'create-user', userId: data.user.id },
        'Rolled back Supabase user creation due to database error',
      );
      return { success: false, message: 'Failed to insert user into the database' };
    }
  });
}
