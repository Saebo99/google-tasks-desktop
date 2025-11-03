export {};

import type {
  AuthState,
  NewTaskInput,
  TaskListSummary,
  TaskSummary
} from '@common/types/google';

declare global {
  interface Window {
    desktopAPI?: {
      ping: () => Promise<string>;
      auth: {
        getState: () => Promise<AuthState>;
        signIn: () => Promise<AuthState>;
        signOut: () => Promise<void>;
      };
      tasks: {
        listTaskLists: () => Promise<TaskListSummary[]>;
        listTasks: (taskListId: string) => Promise<TaskSummary[]>;
        createTask: (taskListId: string, task: NewTaskInput) => Promise<TaskSummary>;
      };
    };
  }
}
