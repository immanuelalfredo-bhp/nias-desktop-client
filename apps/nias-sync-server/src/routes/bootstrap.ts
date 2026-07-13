import { count } from 'drizzle-orm';
import type { Logger } from 'pino';
import { type Request, type Response } from 'express';
import { auth, common } from '@nias/shared';
import { users, type Envelope } from '@nias/shared/server';
import { db } from '../db.js';
import { supabaseAdmin } from '../supabase.js';

export async function getBootstrapStatus(
  _req: Request,
  res: Response<Envelope<auth.StatusResponse>>,
): Promise<Response<Envelope<auth.StatusResponse>>> {
  const result = await db.select({ value: count() }).from(users);
  const userCount = result[0]?.value ?? 0;

  return res.json({
    success: true,
    message: 'Bootstrap status retrieved successfully',
    data: { isEmpty: userCount === 0 },
  });
}

export async function handleBootstrap(
  payload: auth.BootstrapPayload,
  context?: { log?: Logger; userId?: string },
): Promise<Envelope<common.EntityId>> {
  return await db.transaction(async (tx) => {
    const [existingUser] = await tx.select().from(users).limit(1);
    // Ensure we don't accidentally overwrite existing data; 
    // bootstrap is a one-time setup operation.
    if (existingUser) {
      return { success: false, message: 'System already bootstrapped' };
    }

    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: payload.email,
      password: payload.password,
      email_confirm: true,
    });

    if (authError) {
      context?.log?.error(
        { scope: 'bootstrap', error: authError },
        'Failed to create admin user in Supabase',
      );
      return {
        success: false,
        message: 'Failed to create admin user in Supabase',
      };
    }

    const adminData: typeof users.$inferInsert = {
      id: authData.user.id,
      displayName: payload.displayName || 'Admin',
      email: payload.email,
      passwordHash: payload.passwordHash,
      isManagedBy: null,
      isSynced: true,
      syncVersion: 0,
    };

    try {
      await tx.insert(users).values(adminData);
    } catch (dbError) {
      context?.log?.error(
        { scope: 'bootstrap', error: dbError },
        'Failed to insert admin user into the database',
      );
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      context?.log?.info(
        { scope: 'bootstrap', adminId: authData.user.id },
        'Rolled back Supabase admin user creation due to database error',
      );
      return {
        success: false,
        message: 'Failed to insert admin user into the database',
      };
    }

    context?.log?.info(
      { scope: 'bootstrap', adminId: authData.user.id },
      'System bootstrap completed successfully',
    );

    return {
      success: true,
      message: 'System bootstrapped successfully',
      data: { id: authData.user.id },
    };
  });
}
