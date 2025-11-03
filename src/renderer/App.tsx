import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import type {
  AuthState,
  TaskListSummary,
  TaskSummary
} from '@common/types/google';

type AsyncStatus = 'idle' | 'loading' | 'error';

const bridgeUnavailableMessage =
  'Desktop bridge unavailable. Launch the Electron app with `npm run dev` (or the packaged build) so Google OAuth can run locally.';

const ensureDesktopBridge = () => {
  const api = window.desktopAPI;
  if (!api || !api.auth || !api.tasks) {
    throw new Error(bridgeUnavailableMessage);
  }
  return api;
};

const App = () => {
  const [authState, setAuthState] = useState<AuthState>({ isAuthenticated: false });
  const [taskLists, setTaskLists] = useState<TaskListSummary[]>([]);
  const [tasks, setTasks] = useState<TaskSummary[]>([]);
  const [selectedListId, setSelectedListId] = useState<string>('');
  const [status, setStatus] = useState<AsyncStatus>('idle');
  const [message, setMessage] = useState<string | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState<string>('');

  const isSignedIn = authState.isAuthenticated;

  const selectedList = useMemo(
    () => taskLists.find((list) => list.id === selectedListId),
    [selectedListId, taskLists]
  );

  const refreshAuthState = useCallback(async () => {
    const state = await ensureDesktopBridge().auth.getState();
    setAuthState(state);
    return state;
  }, []);

  const loadTaskLists = useCallback(
    async (defaultToFirst = true) => {
      const tasksBridge = ensureDesktopBridge().tasks;
      const lists = await tasksBridge.listTaskLists();
      setTaskLists(lists);

      if (defaultToFirst && lists.length > 0) {
        const first = lists[0];
        setSelectedListId(first.id);
        const fetchedTasks = await tasksBridge.listTasks(first.id);
        setTasks(fetchedTasks);
      } else if (lists.length === 0) {
        setTasks([]);
      }
    },
    []
  );

  const loadTasks = useCallback(async (taskListId: string) => {
    const fetchedTasks = await ensureDesktopBridge().tasks.listTasks(taskListId);
    setTasks(fetchedTasks);
  }, []);

  useEffect(() => {
    void refreshAuthState()
      .then((state) => {
        if (state.isAuthenticated) {
          setStatus('loading');
          return loadTaskLists().finally(() => setStatus('idle'));
        }
        setTaskLists([]);
        setTasks([]);
        return undefined;
      })
      .catch((error: unknown) => {
        console.error(error);
        setMessage(
          error instanceof Error ? error.message : 'Unable to determine authentication state.'
        );
      });
  }, [loadTaskLists, refreshAuthState]);

  const handleSignIn = async () => {
    setStatus('loading');
    setMessage(null);
    try {
      const state = await ensureDesktopBridge().auth.signIn();
      setAuthState(state);
      if (state.isAuthenticated) {
        await loadTaskLists();
      }
    } catch (error) {
      console.error(error);
      setMessage(
        error instanceof Error ? error.message : 'Google sign-in was unsuccessful. Try again.'
      );
    } finally {
      setStatus('idle');
    }
  };

  const handleSignOut = async () => {
    setStatus('loading');
    setMessage(null);
    try {
      await ensureDesktopBridge().auth.signOut();
      setAuthState({ isAuthenticated: false });
      setTaskLists([]);
      setTasks([]);
      setSelectedListId('');
    } catch (error) {
      console.error(error);
      setMessage(
        error instanceof Error ? error.message : 'Unable to sign out at the moment. Try again.'
      );
    } finally {
      setStatus('idle');
    }
  };

  const handleSelectList = async (taskListId: string) => {
    setSelectedListId(taskListId);
    setStatus('loading');
    try {
      await loadTasks(taskListId);
    } catch (error) {
      console.error(error);
      setMessage(
        error instanceof Error ? error.message : 'Unable to load tasks from Google Tasks.'
      );
    } finally {
      setStatus('idle');
    }
  };

  const handleCreateTask = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedListId || !newTaskTitle.trim()) {
      return;
    }

    setStatus('loading');
    setMessage(null);
    try {
      const created = await ensureDesktopBridge().tasks.createTask(selectedListId, {
        title: newTaskTitle.trim()
      });

      setNewTaskTitle('');
      setTasks((existing) => [created, ...existing]);
    } catch (error) {
      console.error(error);
      setMessage(error instanceof Error ? error.message : 'Unable to create task.');
    } finally {
      setStatus('idle');
    }
  };

  return (
    <main className="app-shell">
      <section className="card">
        <header className="card-header">
          <div>
            <h1>Google Tasks Desktop</h1>
            <p>
              Authenticate with Google, browse your task lists, and add new tasks. This flow is kept
              minimal so you can expand it to your needs.
            </p>
          </div>
          <div className="actions">
            {isSignedIn ? (
              <button
                className="secondary"
                onClick={() => {
                  void handleSignOut();
                }}
                disabled={status === 'loading'}
              >
                Sign out
              </button>
            ) : (
              <button
                onClick={() => {
                  void handleSignIn();
                }}
                disabled={status === 'loading'}
              >
                Sign in with Google
              </button>
            )}
          </div>
        </header>

        {message && <div className="alert">{message}</div>}

        {isSignedIn ? (
          <>
            <section className="panel">
              <div className="panel-header">
                <div>
                  <span className="panel-label">Signed in as</span>
                  <strong>{authState.profile?.email ?? 'Unknown account'}</strong>
                </div>
                <button
                  className="ghost"
                  onClick={() => {
                    setStatus('loading');
                    void loadTaskLists(false)
                      .catch((error: unknown) => {
                        console.error(error);
                        setMessage(
                          error instanceof Error
                            ? error.message
                            : 'Unable to refresh task lists from Google Tasks.'
                        );
                      })
                      .finally(() => setStatus('idle'));
                  }}
                  disabled={status === 'loading'}
                >
                  Refresh lists
                </button>
              </div>

              {taskLists.length === 0 ? (
                <p className="muted">
                  No task lists found. Create one in Google Tasks and press refresh.
                </p>
              ) : (
                <div className="list-selector">
                  <label htmlFor="task-list">Task list</label>
                  <select
                    id="task-list"
                    value={selectedListId}
                    onChange={(event) => {
                      void handleSelectList(event.target.value);
                    }}
                    disabled={status === 'loading'}
                  >
                    {taskLists.map((list) => (
                      <option key={list.id} value={list.id}>
                        {list.title}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </section>

            {selectedList && (
              <section className="panel">
                <h2>{selectedList.title}</h2>
                <form
                  className="task-form"
                  onSubmit={(event) => {
                    void handleCreateTask(event);
                  }}
                >
                  <input
                    type="text"
                    placeholder="Quick add task..."
                    value={newTaskTitle}
                    onChange={(event) => setNewTaskTitle(event.target.value)}
                    disabled={status === 'loading'}
                  />
                  <button
                    type="submit"
                    className="primary"
                    disabled={status === 'loading' || !newTaskTitle.trim()}
                  >
                    Add
                  </button>
                </form>
                <div className="task-list">
                  {status === 'loading' && tasks.length === 0 ? (
                    <p className="muted">Loading tasks…</p>
                  ) : tasks.length === 0 ? (
                    <p className="muted">No tasks yet. Add one above to get started.</p>
                  ) : (
                    tasks.map((task) => (
                      <article key={task.id} className={`task task-${task.status}`}>
                        <div>
                          <h3>{task.title}</h3>
                          {task.notes && <p>{task.notes}</p>}
                        </div>
                        <span className="task-status">
                          {task.status === 'completed' ? 'Completed' : 'Active'}
                        </span>
                      </article>
                    ))
                  )}
                </div>
              </section>
            )}
          </>
        ) : (
          <section className="panel">
            <h2>Connect your Google account</h2>
            <p className="muted">
              Click <strong>Sign in with Google</strong> to grant this desktop app access to your
              Tasks data. Credentials stay on your machine in the Electron user data directory so
              you can build on this foundation safely.
            </p>
          </section>
        )}
      </section>
    </main>
  );
};

export default App;
