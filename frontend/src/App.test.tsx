import { fireEvent, render, screen, waitFor } from '@testing-library/react';
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
  const clearSuccessMessageMock = vi.fn();

  type StoreState = {
    tasks: Array<{
      id: number;
      title: string;
      description?: string;
      completed: boolean;
    }>;
    isLoading: boolean;
    error: string | null;
    successMessage: string | null;
    fetchTasks: typeof fetchTasksMock;
    createTask: typeof createTaskMock;
    toggleTaskCompletion: typeof toggleTaskCompletionMock;
    deleteTask: typeof deleteTaskMock;
    clearSuccessMessage: typeof clearSuccessMessageMock;
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
    successMessage: null,
    fetchTasks: fetchTasksMock,
    createTask: createTaskMock,
    toggleTaskCompletion: toggleTaskCompletionMock,
    deleteTask: deleteTaskMock,
    clearSuccessMessage: clearSuccessMessageMock,
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
      clearSuccessMessage: clearSuccessMessageMock,
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
import AppThemeProvider from './theme/AppThemeProvider';
import { useTasksStore } from './store/tasksStore';

type MockedStoreHook = typeof useTasksStore & {
  mocks: typeof storeMocks;
};

describe('App', () => {
  const store = useTasksStore as MockedStoreHook;

  const renderApp = () =>
    render(
      <AppThemeProvider>
        <App />
      </AppThemeProvider>,
    );

  beforeEach(() => {
    store.mocks.reset();
    vi.clearAllMocks();
  });

  it('renders tasks and triggers completion toggle', async () => {
    const user = userEvent.setup();
    renderApp();

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

    renderApp();

    expect(screen.getByRole('alert')).toHaveTextContent(
      'Unable to fetch tasks',
    );
  });

  it('submits a new task via the creation form', async () => {
    store.mocks.reset({ tasks: [] });

    renderApp();

    const titleInput = screen.getByLabelText(
      /Task title/i,
    ) as HTMLInputElement;
    const descriptionInput = screen.getByLabelText(
      /Description/i,
    ) as HTMLTextAreaElement;

    fireEvent.change(titleInput, { target: { value: '  Ship UI  ' } });
    fireEvent.change(descriptionInput, {
      target: { value: 'Write release notes' },
    });

    fireEvent.click(screen.getByRole('button', { name: /Create Task/i }));

    expect(store.mocks.createTaskMock).toHaveBeenCalled();

    expect(store.mocks.createTaskMock).toHaveBeenCalledWith({
      title: 'Ship UI',
      description: 'Write release notes',
    });

    expect(screen.getByLabelText(/Task title/i)).toHaveValue('');
  });

  it('shows a success alert when task creation succeeds', async () => {
    const user = userEvent.setup();

    store.mocks.reset({ tasks: [] });

    const renderResult = renderApp();

    store.mocks.createTaskMock.mockImplementation(async () => {
      store.mocks.reset({
        tasks: [],
        successMessage: 'Task created successfully.',
      });

      renderResult.rerender(
        <AppThemeProvider>
          <App />
        </AppThemeProvider>,
      );
    });

    await user.type(screen.getByLabelText(/Task title/i), 'Ship UI');

    await user.click(screen.getByRole('button', { name: /Create Task/i }));

    await waitFor(() => {
      expect(
        screen.getByText(/Task created successfully\./i),
      ).toBeInTheDocument();
    });
  });

  it('toggles between light and dark modes', async () => {
    const user = userEvent.setup();

    renderApp();

    const toggleButton = screen.getByRole('button', { name: /toggle theme/i });
    expect(toggleButton).toBeInTheDocument();

    await user.click(toggleButton);

    await waitFor(() => {
      expect(window.localStorage.getItem('task-manager-ui-color-mode')).toBe(
        'dark',
      );
    });
  });
});
