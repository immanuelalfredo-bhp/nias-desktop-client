import { app, BrowserWindow } from 'electron';
import { logger } from '@nias/shared/server';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { initializeAuthDatabase } from './db/database.js';
import { registerBootstrapIpcHandlers, registerAuthIpcHandlers } from './ipc/local.js';

let mainWindow: BrowserWindow | null = null;

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function firstExistingPath(paths: string[]): string | undefined {
  return paths.find((candidate) => fs.existsSync(candidate));
}

function createMainWindow(): void {
  const preloadPath = firstExistingPath([
    path.join(__dirname, '../preload/index.js'),
    path.join(__dirname, './preload/index.js'),
  ]);

  const webPreferences: Electron.BrowserWindowConstructorOptions['webPreferences'] = {
    contextIsolation: true,
    nodeIntegration: false,
  };

  if (preloadPath) {
    webPreferences.preload = preloadPath;
    logger.info({scope: 'main'}, `Preload script found at ${preloadPath}`);
  } else {
    logger.error({scope: 'bootstrap'},
      'Preload script not found. Checked ../preload/index.js and ./preload/index.js');
  }

  mainWindow = new BrowserWindow({
    width: 1100,
    height: 720,
    webPreferences,
  });

  const htmlPath = firstExistingPath([
    path.join(__dirname, '../../dist/index.html'),
    path.join(__dirname, '../dist/index.html'),
  ]);

  if (!htmlPath) {
    logger.error({scope: 'bootstrap'},
      'Renderer build not found. Checked ../../dist/index.html and ../dist/index.html');
    void mainWindow.loadURL('data:text/html,<h1>Renderer build not found</h1><p>Run npm.cmd run build in apps/nias-desktop-client.</p>');
  } else {
    mainWindow.loadFile(htmlPath).catch((error) => {
      logger.error({scope: 'bootstrap', error}, 'Failed to load renderer HTML');
    });
  }

  mainWindow.webContents.on('did-fail-load', (_event, code, description, validatedURL) => {
    logger.error({scope: 'bootstrap', code, description, validatedURL}, 'Renderer failed to load');
  });

  mainWindow.webContents.on('console-message', (_event, level, message, line, sourceId) => {
    logger.error(
      { scope: 'renderer', level, message, line, sourceId },
      'Renderer console message',
    );
  });

  mainWindow.webContents.on('render-process-gone', (_event, details) => {
    logger.error({ scope: 'renderer', details }, 'Renderer process terminated');
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady()
  .then(() => {
    const authDb = initializeAuthDatabase();
    registerAuthIpcHandlers(authDb);
    if (authDb.main.count() === 0) {
      registerBootstrapIpcHandlers();
    }
    createMainWindow();

    app.on('activate', () => {
      
      if (BrowserWindow.getAllWindows().length === 0) {
        createMainWindow();
      }
    });
  })
  .catch(() => {
  app.quit();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  if (mainWindow) {
    mainWindow.removeAllListeners('close');
    mainWindow.close();
  }
});
