import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('desktopAPI', {
  ping: () => ipcRenderer.invoke('app:ping'),
  auth: {
    getState: () => ipcRenderer.invoke('auth:get-state'),
    signIn: () => ipcRenderer.invoke('auth:sign-in'),
    signOut: () => ipcRenderer.invoke('auth:sign-out')
  },
  tasks: {
    listTaskLists: () => ipcRenderer.invoke('tasks:list-task-lists'),
    listTasks: (taskListId: string) => ipcRenderer.invoke('tasks:list-tasks', taskListId),
    createTask: (taskListId: string, task: { title: string; notes?: string; due?: string }) =>
      ipcRenderer.invoke('tasks:create-task', { taskListId, task })
  }
});
