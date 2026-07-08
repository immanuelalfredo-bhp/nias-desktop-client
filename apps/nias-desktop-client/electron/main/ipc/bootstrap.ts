import { ipcMain } from 'electron';
import {
  auth,
  common,
  hashPassword,
  handleResponse,
  isSuccess,
  logger,
  slugify,
  type Envelope,
} from '@nias/shared';
import { SYNC_SERVER_URL } from '../config.js';

export function registerBootstrapIpcHandlers(): void {
  ipcMain.handle(
    'bootstrap:status',
    async (_event, bootstrapSecret: string): Promise<Envelope<auth.StatusResponse>> => {
      try {
        const response = await fetch(`${SYNC_SERVER_URL}/api/bootstrap/status`, {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            'bootstrap-secret': bootstrapSecret,
          },
        });

        const data = await handleResponse(response, auth.StatusResponseSchema, 'bootstrap');
        if (!isSuccess(data)) {
          return { success: false, message: 'Bootstrap status check failed' };
        }

        logger.info(
          { scope: 'bootstrap', isEmpty: data.isEmpty },
          'Bootstrap status check succeeded',
        );
        return {
          success: true,
          message: 'Bootstrap status check succeeded',
          data: { isEmpty: data.isEmpty },
        };
      } catch (err) {
        logger.error({ scope: 'bootstrap', error: err }, 'Bootstrap status check failed');
        return { success: false, message: 'Bootstrap status check failed' };
      }
    },
  );

  ipcMain.handle(
    'bootstrap:execute',
    async (
      _event,
      bootstrapSecret: string,
      payload: auth.BootstrapPayload,
    ): Promise<common.SuccessResponse> => {
      try {
        const bootstrapPayload = auth.BootstrapPayloadSchema.parse(payload);
        const passwordHash = await hashPassword(bootstrapPayload.password);

        const response = await fetch(`${SYNC_SERVER_URL}/api/bootstrap/execute`, {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            'bootstrap-secret': bootstrapSecret,
          },
          body: JSON.stringify({
            username: slugify(bootstrapPayload.username),
            displayName: bootstrapPayload.displayName,
            email: bootstrapPayload.email,
            password: bootstrapPayload.password,
            passwordHash,
          }),
        });

        const data = await handleResponse(response, common.EntityIdSchema, 'bootstrap');
        if (!isSuccess(data)) {
          return data;
        }

        logger.info({ scope: 'bootstrap', userId: data.id }, 'Bootstrap executed successfully');
        return { success: true, message: 'Bootstrap completed successfully' };
      } catch (error) {
        logger.error({ scope: 'bootstrap', error }, 'Bootstrap execution failed');
        return {
          success: false,
          message: 'Bootstrap execution failed. Please check the logs for more details.',
        };
      }
    },
  );
}
