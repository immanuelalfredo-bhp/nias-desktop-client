import { type Request, type Response } from 'express';
import { count } from 'drizzle-orm';
import type { Logger } from 'pino';
import { auth, common } from '@nias/shared';
import { db } from '../db.js';
import { users } from '../schema/index.js';
import { supabaseAdmin } from '../supabase.js';

export async function getBootstrapStatus(_req: Request, res: Response) {
  const result = await db
    .select({ value: count() })
    .from(users);
  const userCount = result[0]?.value ?? 0;

  res.json({ success: true, isEmpty: userCount === 0 });
}

/**
 * Handles system bootstrap by creating the first admin user in Supabase and local DB.
 * JWT retrieval happens on first login, not during bootstrap.
 */
export async function handleBootstrap(
  payload: auth.BootstrapPayload,
  context?: { log?: Logger; userId?: string }
): Promise<auth.BootstrapResponse | common.SuccessResponse> {

  return await db.transaction(async (tx) => {

    const [existingUser] = await tx.select().from(users).limit(1);
    if (existingUser) {
      return { success: false, message: "System already bootstrapped" };
    }

    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: payload.email,
      password: payload.password,
      email_confirm: true,
    });

    if (authError) {
      context?.log?.error({ error: authError },
        'Failed to create admin user in Supabase');
      return { success: false, message: "Failed to create admin user in Supabase" };
    }

    const adminData: typeof users.$inferInsert = {
      id: authData.user.id,
      username: payload.username,
      passwordHash: payload.passwordHash,
      displayName: payload.displayName || 'Admin',
      email: payload.email,
      isManagedBy: null,
      isSynced: true,
      syncVersion: 1,
    };

    await tx.insert(users).values(adminData);

    context?.log?.info({ adminId: authData.user.id }, 
      'System bootstrap completed successfully');

    return {
      success: true,
      adminId: authData.user.id,
    };
  });
}