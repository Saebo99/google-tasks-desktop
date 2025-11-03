export interface AuthProfile {
  email: string;
  name: string;
  picture?: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  profile?: AuthProfile;
}

export interface TaskListSummary {
  id: string;
  title: string;
  updatedOn?: string;
}

export interface TaskSummary {
  id: string;
  title: string;
  status: 'needsAction' | 'completed';
  due?: string;
  notes?: string;
  updatedOn?: string;
}

export interface NewTaskInput {
  title: string;
  notes?: string;
  due?: string;
}
