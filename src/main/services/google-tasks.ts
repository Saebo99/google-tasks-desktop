import { google } from 'googleapis';
import type { OAuth2Client } from 'google-auth-library';
import type { GoogleAuthService } from './google-auth';
import type {
  NewTaskInput,
  TaskListSummary,
  TaskSummary
} from '@common/types/google';

export class GoogleTasksService {
  constructor(private readonly authService: GoogleAuthService) {}

  private getClient(): OAuth2Client {
    return this.authService.getAuthenticatedClient();
  }

  async listTaskLists(): Promise<TaskListSummary[]> {
    const client = this.getClient();
    const tasksApi = google.tasks({
      version: 'v1',
      auth: client
    });

    const response = await tasksApi.tasklists.list({
      maxResults: 100
    });

    return (
      response.data.items?.map((item) => ({
        id: item.id ?? '',
        title: item.title ?? 'Untitled list',
        updatedOn: item.updated ?? undefined
      })) ?? []
    );
  }

  async listTasks(taskListId: string): Promise<TaskSummary[]> {
    if (!taskListId) {
      throw new Error('A task list id is required to fetch tasks.');
    }

    const client = this.getClient();
    const tasksApi = google.tasks({
      version: 'v1',
      auth: client
    });

    const response = await tasksApi.tasks.list({
      tasklist: taskListId,
      showCompleted: true,
      maxResults: 100
    });

    return (
      response.data.items?.map((item) => ({
        id: item.id ?? '',
        title: item.title ?? 'Untitled task',
        status: (item.status as TaskSummary['status']) ?? 'needsAction',
        due: item.due ?? undefined,
        notes: item.notes ?? undefined,
        updatedOn: item.updated ?? undefined
      })) ?? []
    );
  }

  async createTask(taskListId: string, task: NewTaskInput): Promise<TaskSummary> {
    if (!taskListId) {
      throw new Error('A task list id is required to create tasks.');
    }

    if (!task.title) {
      throw new Error('Tasks require a title.');
    }

    const client = this.getClient();
    const tasksApi = google.tasks({
      version: 'v1',
      auth: client
    });

    const response = await tasksApi.tasks.insert({
      tasklist: taskListId,
      requestBody: {
        title: task.title,
        notes: task.notes,
        due: task.due
      }
    });

    const created = response.data;
    if (!created?.id) {
      throw new Error('The Google Tasks API did not return an id for the new task.');
    }

    return {
      id: created.id,
      title: created.title ?? task.title,
      status: (created.status as TaskSummary['status']) ?? 'needsAction',
      due: created.due ?? undefined,
      notes: created.notes ?? task.notes,
      updatedOn: created.updated ?? undefined
    };
  }
}
