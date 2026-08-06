import type { Logger } from 'pino';
import { eq } from 'drizzle-orm';
import { system } from '@nias/shared';
import { users, type Envelope } from '@nias/shared/server';
import { db } from '../db.js';
import { supabaseAdmin } from '../supabase.js';

export async function handleCreateUser(
  payload: system.CreateUserPayload,
  context?: { log?: Logger; userId?: string },
): Promise<Envelope<system.CreateUserResponse>> {
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
      const [newUser] = await tx.insert(users).values(userData).returning({
        id: users.id,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
        syncVersion: users.syncVersion,
      });

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

      const newUserResponse: system.CreateUserResponse = {
        id: newUser.id,
        createdAt: newUser.createdAt,
        updatedAt: newUser.updatedAt,
        syncVersion: newUser.syncVersion,
      };

      return {
        success: true,
        message: 'User created successfully',
        data: newUserResponse,
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

export async function handleUpdateUser(
  payload: system.UpdateUserPayload,
  context?: { log?: Logger; userId?: string },
): Promise<Envelope<system.UpdateUserResponse>> {
  const existingUser = await db.query.users.findFirst({
    where: eq(users.id, payload.id),
  });

  if (!existingUser) {
    context?.log?.warn(
      { scope: 'update-user', userId: payload.id },
      'Failed to update user: User not found',
    );
    return { success: false, message: 'User not found' };
  }

  if (payload.email && payload.email !== existingUser.email) {
    const emailConflictUser = await db.query.users.findFirst({
      where: eq(users.email, payload.email),
    });
    if (emailConflictUser) {
      context?.log?.warn(
        { scope: 'update-user', email: payload.email },
        'Failed to update user: User with this email already exists',
      );
      return { success: false, message: 'User with this email already exists' };
    }
  }

  if (payload.password && payload.email) {
    const { data, error } = await supabaseAdmin.auth.admin.updateUserById(payload.id, {
      password: payload.password,
      email: payload.email,
    });
    context?.log?.info(
      { scope: 'update-user', userId: payload.id },
      'User updated successfully in Supabase',
    );
    if (error) {
      context?.log?.error(
        { scope: 'update-user', error: error },
        'Failed to update user in Supabase',
      );
      return { success: false, message: 'Failed to update user in Supabase' };
    }
  } else if (payload.password) {
    const { data, error } = await supabaseAdmin.auth.admin.updateUserById(payload.id, {
      password: payload.password,
    });
    context?.log?.info(
      { scope: 'update-user', userId: payload.id },
      'User updated successfully in Supabase',
    );
    if (error) {
      context?.log?.error(
        { scope: 'update-user', error: error },
        'Failed to update user in Supabase',
      );
      return { success: false, message: 'Failed to update user in Supabase' };
    }
  } else if (payload.email) {
    const { data, error } = await supabaseAdmin.auth.admin.updateUserById(payload.id, {
      email: payload.email,
    });
    context?.log?.info(
      { scope: 'update-user', userId: payload.id },
      'User updated successfully in Supabase',
    );
    if (error) {
      context?.log?.error(
        { scope: 'update-user', error: error },
        'Failed to update user in Supabase',
      );
      return { success: false, message: 'Failed to update user in Supabase' };
    }
  }

  return await db.transaction(async (tx) => {
    try {
      const updatedUserData: any = {
        displayName: payload.displayName ?? existingUser.displayName,
        email: payload.email ?? existingUser.email,
        passwordHash: payload.passwordHash ?? existingUser.passwordHash,
        isManagedBy: payload.isManagedBy ?? existingUser.isManagedBy ?? null,
        isSynced: true,
      };
      const [updatedUser] = await tx
        .update(users)
        .set(updatedUserData)
        .where(eq(users.id, payload.id))
        .returning({
          id: users.id,
          updatedAt: users.updatedAt,
          syncVersion: users.syncVersion,
        });
      if (!updatedUser) {
        context?.log?.error(
          { scope: 'update-user', userId: payload.id },
          'Failed to retrieve updated user from the database',
        );
        throw new Error('Failed to retrieve updated user from the database');
      }

      context?.log?.info(
        { scope: 'update-user', userId: payload.id },
        'User updated successfully in the database',
      );

      const updatedUserResponse: system.UpdateUserResponse = {
        id: updatedUser.id,
        updatedAt: updatedUser.updatedAt,
        syncVersion: updatedUser.syncVersion,
      };

      return {
        success: true,
        message: 'User updated successfully',
        data: updatedUserResponse,
      };
    } catch (err) {
      context?.log?.error(
        { scope: 'update-user', error: err, userId: payload.id },
        'Failed to update user in the database',
      );
      return { success: false, message: 'Failed to update user in the database' };
    }
  });
}
