import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

const storeMocks = vi.hoisted(() => {
  const fetchTasksMock = vi.fn().mockResolvedValue(undefined);
  const createTaskMock = vi.fn().mockResolvedValue(undefined);
  const toggleTaskCompletionMock = vi.fn().mockResolvedValue(undefined);
  const deleteTaskMock = vi.fn().mockResolvedValue(undefined);

  type StoreState = {
    tasks: Array<{
      id: number;
      title: string;
      description?: string;
      completed: boolean;
    }>;
    isLoading: boolean;
    error: string | null;
    fetchTasks: typeof fetchTasksMock;
    createTask: typeof createTaskMock;
    toggleTaskCompletion: typeof toggleTaskCompletionMock;
    deleteTask: typeof deleteTaskMock;
  };

  const baseState = (): StoreState => ({
    tasks: [
      {
        id: 1,
        title: 'Plan sprint',
        description: 'Outline deliverables for next release',
        completed: false,
      },
      { id: 2, title: 'Review pull requests', completed: true },
    ],
    isLoading: false,
    error: null,
    fetchTasks: fetchTasksMock,
    createTask: createTaskMock,
    toggleTaskCompletion: toggleTaskCompletionMock,
    deleteTask: deleteTaskMock,
  });

  let state = baseState();

  const reset = (override: Partial<StoreState> = {}) => {
    state = {
      ...baseState(),
      ...override,
      fetchTasks: fetchTasksMock,
      createTask: createTaskMock,
      toggleTaskCompletion: toggleTaskCompletionMock,
      deleteTask: deleteTaskMock,
    };
  };

  const getState = () => state;

  return {
    fetchTasksMock,
    createTaskMock,
    toggleTaskCompletionMock,
    deleteTaskMock,
    reset,
    getState,
  };
});

vi.mock('./store/tasksStore', () => {
  storeMocks.reset();
  const useTasksStore = ((selector: (state: unknown) => unknown) =>
    selector(storeMocks.getState())) as {
    (selector: (state: unknown) => unknown): unknown;
    mocks?: typeof storeMocks;
  };

  (useTasksStore as { mocks: typeof storeMocks }).mocks = storeMocks;

  return { useTasksStore };
});

import App from './App';
import { useTasksStore } from './store/tasksStore';

type MockedStoreHook = typeof useTasksStore & {
  mocks: typeof storeMocks;
};

describe('App', () => {
  const store = useTasksStore as MockedStoreHook;

  beforeEach(() => {
    store.mocks.reset();
    vi.clearAllMocks();
  });

  it('renders tasks and triggers completion toggle', async () => {
    const user = userEvent.setup();
    render(<App />);

    expect(store.mocks.fetchTasksMock).toHaveBeenCalledTimes(1);
    expect(screen.getByText(/Plan sprint/i)).toBeInTheDocument();

    const checkbox = screen.getByRole('checkbox', { name: /Plan sprint/i });
    await user.click(checkbox);

    expect(store.mocks.toggleTaskCompletionMock).toHaveBeenCalledWith(1);
  });

  it('shows an error alert when the store reports an error', () => {
    store.mocks.reset({
      tasks: [],
      error: 'Unable to fetch tasks',
    });

    render(<App />);

    expect(screen.getByRole('alert')).toHaveTextContent(
      'Unable to fetch tasks',
    );
  });

  it('submits a new task via the creation form', async () => {
    const user = userEvent.setup();
    store.mocks.reset({ tasks: [] });

    render(<App />);

    await user.type(screen.getByLabelText(/Task title/i), '  Ship UI  ');
    await user.type(
      screen.getByLabelText(/Description/i),
      'Write release notes',
    );
    await user.click(screen.getByRole('button', { name: /Create Task/i }));

    await waitFor(() => {
      expect(store.mocks.createTaskMock).toHaveBeenCalledWith({
        title: 'Ship UI',
        description: 'Write release notes',
      });
    });

    expect(screen.getByLabelText(/Task title/i)).toHaveValue('');
  });
});
