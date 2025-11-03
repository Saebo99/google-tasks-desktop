import { app, BrowserWindow, ipcMain, shell } from 'electron';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { loadEnvironment } from './utils/load-env';
import { GoogleAuthService } from './services/google-auth';
import { GoogleTasksService } from './services/google-tasks';
import type { NewTaskInput } from '@common/types/google';

const rendererHtml = join(__dirname, '../renderer/index.html');

let authService: GoogleAuthService | null = null;
let tasksService: GoogleTasksService | null = null;

const resolvePreloadScript = () => {
  const preloadJs = join(__dirname, '../preload/index.js');
  if (existsSync(preloadJs)) {
    return preloadJs;
  }

  const preloadMjs = join(__dirname, '../preload/index.mjs');
  if (existsSync(preloadMjs)) {
    return preloadMjs;
  }

  throw new Error('Unable to locate preload bundle. Did the build step complete successfully?');
};

const registerIpcHandlers = () => {
  ipcMain.handle('app:ping', () => 'pong');

  ipcMain.handle('auth:get-state', () => {
    if (!authService) {
      throw new Error('Authentication service is unavailable.');
    }
    return authService.getAuthState();
  });

  ipcMain.handle('auth:sign-in', async () => {
    if (!authService) {
      throw new Error('Authentication service is unavailable.');
    }
    return authService.signIn();
  });

  ipcMain.handle('auth:sign-out', async () => {
    if (!authService) {
      throw new Error('Authentication service is unavailable.');
    }
    await authService.signOut();
  });

  ipcMain.handle('tasks:list-task-lists', () => {
    if (!tasksService) {
      throw new Error('Tasks service is unavailable.');
    }
    return tasksService.listTaskLists();
  });

  ipcMain.handle('tasks:list-tasks', (_event, taskListId: string) => {
    if (!tasksService) {
      throw new Error('Tasks service is unavailable.');
    }
    return tasksService.listTasks(taskListId);
  });

  ipcMain.handle('tasks:create-task', (_event, payload: { taskListId: string; task: NewTaskInput }) => {
    if (!tasksService) {
      throw new Error('Tasks service is unavailable.');
    }
    return tasksService.createTask(payload.taskListId, payload.task);
  });
};

function createWindow(): void {
  const preloadPath = resolvePreloadScript();

  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    title: 'Google Tasks Desktop',
    webPreferences: {
      preload: preloadPath,
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    void shell.openExternal(url);
    return { action: 'deny' };
  });

  const devServerURL = process.env.ELECTRON_RENDERER_URL;

  if (devServerURL) {
    void mainWindow.loadURL(devServerURL);
    if (!app.isPackaged) {
      mainWindow.webContents.openDevTools({ mode: 'detach' });
    }
  } else {
    void mainWindow.loadFile(rendererHtml);
  }
}

void app.whenReady().then(async () => {
  const envRoots = app.isPackaged
    ? [process.resourcesPath, join(app.getPath('userData'), 'config')]
    : [];
  loadEnvironment(envRoots);

  authService = new GoogleAuthService(app.getPath('userData'));
  await authService.initialize();

  tasksService = new GoogleTasksService(authService);

  registerIpcHandlers();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
