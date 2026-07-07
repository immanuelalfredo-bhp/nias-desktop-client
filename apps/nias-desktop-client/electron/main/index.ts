import { app, BrowserWindow } from 'electron';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { initializeAuthDatabase } from './db/database.js';
import { registerBootstrapIpcHandlers } from './ipc/bootstrap.js';
import { registerAuthIpcHandlers } from './ipc/auth.js';

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
  } else {
    console.warn('Preload bundle not found. electronAPI will be unavailable in renderer.');
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
    console.error('Renderer HTML not found. Checked dist/index.html in known output layouts.');
    void mainWindow.loadURL('data:text/html,<h1>Renderer build not found</h1><p>Run npm.cmd run build in apps/nias-desktop-client.</p>');
  } else {
    mainWindow.loadFile(htmlPath).catch((error) => {
      console.error('Failed to load renderer HTML:', error);
    });
  }

  mainWindow.webContents.on('did-fail-load', (_event, code, description, validatedURL) => {
    console.error('Renderer failed to load.', { code, description, validatedURL });
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady()
  .then(() => {
    const authDb = initializeAuthDatabase();
    registerAuthIpcHandlers(authDb);
    registerBootstrapIpcHandlers(authDb);
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
  // database?.close();
  // database = null;
});
