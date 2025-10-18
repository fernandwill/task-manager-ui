import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import dayjs from 'dayjs';

const storeMocks = vi.hoisted(() => {
  const fetchTasksMock = vi.fn().mockResolvedValue(undefined);
  const createTaskMock = vi.fn().mockResolvedValue(undefined);
  const toggleTaskCompletionMock = vi.fn().mockResolvedValue(undefined);
  const deleteTaskMock = vi.fn().mockResolvedValue(true);
  const updateTaskMock = vi.fn().mockResolvedValue(true);
  const clearSuccessMessageMock = vi.fn();
  const reorderTasksMock = vi.fn();

  type StoreState = {
    tasks: Array<{
      id: number;
      title: string;
      description?: string;
      completed: boolean;
      created_at: string;
      completed_at: string | null;
    }>;
    isLoading: boolean;
    error: string | null;
    successMessage: string | null;
    fetchTasks: typeof fetchTasksMock;
    createTask: typeof createTaskMock;
    toggleTaskCompletion: typeof toggleTaskCompletionMock;
    deleteTask: typeof deleteTaskMock;
    updateTask: typeof updateTaskMock;
    clearSuccessMessage: typeof clearSuccessMessageMock;
    reorderTasks: typeof reorderTasksMock;
  };

  const baseState = (): StoreState => ({
    tasks: [
      {
        id: 1,
        title: 'Plan sprint',
        description: 'Outline deliverables for next release',
        completed: false,
        created_at: '2024-01-10T14:30:00.000Z',
        completed_at: null,
      },
      {
        id: 2,
        title: 'Review pull requests',
        completed: true,
        created_at: '2024-01-08T09:15:00.000Z',
        completed_at: '2024-01-09T17:45:00.000Z',
      },
    ],
    isLoading: false,
    error: null,
    successMessage: null,
    fetchTasks: fetchTasksMock,
    createTask: createTaskMock,
    toggleTaskCompletion: toggleTaskCompletionMock,
    deleteTask: deleteTaskMock,
    updateTask: updateTaskMock,
    clearSuccessMessage: clearSuccessMessageMock,
    reorderTasks: reorderTasksMock,
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
      updateTask: updateTaskMock,
      clearSuccessMessage: clearSuccessMessageMock,
      reorderTasks: reorderTasksMock,
    };
  };

  const getState = () => state;

  return {
    fetchTasksMock,
    createTaskMock,
    toggleTaskCompletionMock,
    deleteTaskMock,
    updateTaskMock,
    reorderTasksMock,
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

const formatTimestamp = (isoString: string) =>
  dayjs(isoString).format('MMM D, YYYY h:mm A');

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
    expect(screen.getAllByText(/Plan sprint/i).length).toBeGreaterThan(0);

    expect(
      screen.getAllByText(/Outline deliverables for next release/i).length,
    ).toBeGreaterThan(0);
    const formattedCreated = formatTimestamp('2024-01-10T14:30:00.000Z');
    expect(
      screen.getByText(new RegExp(`Created on ${formattedCreated}`)),
    ).toBeInTheDocument();
    expect(screen.queryByText(/Completed on/i)).toBeNull();

    const markDoneButton = screen.getByRole('button', {
      name: /mark plan sprint as done/i,
    });
    await user.click(markDoneButton);

    expect(store.mocks.toggleTaskCompletionMock).toHaveBeenCalledWith(1);
  });

  it('toggles a completed task back to in progress', async () => {
    const user = userEvent.setup();
    renderApp();

    const completedTab = screen.getByRole('tab', {
      name: /completed \(1\)/i,
    });
    await user.click(completedTab);

    const formattedCompletedCreated = formatTimestamp('2024-01-08T09:15:00.000Z');
    const formattedCompleted = formatTimestamp('2024-01-09T17:45:00.000Z');
    expect(
      screen.getAllByText(new RegExp(`Completed on ${formattedCompleted}`)),
    ).toHaveLength(1);
    expect(
      screen.queryByText(new RegExp(`Created on ${formattedCompletedCreated}`)),
    ).toBeNull();

    const markInProgressButton = screen.getByRole('button', {
      name: /mark review pull requests as in progress/i,
    });
    await user.click(markInProgressButton);

    expect(store.mocks.toggleTaskCompletionMock).toHaveBeenCalledWith(2);
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

    fireEvent.click(screen.getByRole('button', { name: /Create Task/i }));

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

    await user.click(screen.getByRole('button', { name: /Create Task/i }));

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

    const toggleButton = screen.getByLabelText(/toggle theme/i);
    expect(toggleButton).toBeInTheDocument();

    await user.click(toggleButton);

    await waitFor(() => {
      expect(window.localStorage.getItem('task-manager-ui-color-mode')).toBe(
        'dark',
      );
    });
  });

  it('confirms before deleting a task', async () => {
    const user = userEvent.setup();

    renderApp();

    await user.click(screen.getByRole('button', { name: /delete plan sprint/i }));

    const dialog = screen.getByRole('dialog', { name: /delete task/i });
    expect(dialog).toBeInTheDocument();

    await user.click(within(dialog).getByRole('button', { name: /delete/i }));

    expect(store.mocks.deleteTaskMock).toHaveBeenCalledWith(1);

    await waitFor(() => {
      expect(
        screen.queryByRole('dialog', { name: /delete task/i }),
      ).not.toBeInTheDocument();
    });
  });

  it('allows editing a task', async () => {
    const user = userEvent.setup();

    renderApp();

    await user.click(screen.getByRole('button', { name: /edit plan sprint/i }));

    const dialog = screen.getByRole('dialog', { name: /edit task/i });
    const titleInput = within(dialog).getByLabelText(/task title/i);
    const descriptionInput = within(dialog).getByLabelText(/description/i);

    await user.clear(titleInput);
    await user.type(titleInput, 'Plan sprint v2');
    await user.clear(descriptionInput);
    await user.type(descriptionInput, 'Refine sprint goals');

    await user.click(within(dialog).getByRole('button', { name: /save changes/i }));
    await waitFor(() => {
      expect(store.mocks.updateTaskMock).toHaveBeenCalledWith(1, {
        title: 'Plan sprint v2',
        description: 'Refine sprint goals',
      });
    });

    expect(store.mocks.updateTaskMock).toHaveBeenCalledTimes(1);
    await waitFor(() => {
      expect(
        screen.queryByRole('dialog', { name: /edit task/i }),
      ).not.toBeInTheDocument();
    });
  }, 20000);

  it('shows how many in-progress tasks remain beyond the preview', () => {
    store.mocks.reset({
      tasks: [
        {
          id: 1,
          title: 'Plan sprint',
          completed: false,
          created_at: '2024-01-10T14:30:00.000Z',
          completed_at: null,
        },
        {
          id: 2,
          title: 'Draft documentation',
          completed: false,
          created_at: '2024-01-11T10:15:00.000Z',
          completed_at: null,
        },
        {
          id: 3,
          title: 'Review designs',
          completed: false,
          created_at: '2024-01-12T09:00:00.000Z',
          completed_at: null,
        },
        {
          id: 4,
          title: 'Sync with QA',
          completed: false,
          created_at: '2024-01-13T13:45:00.000Z',
          completed_at: null,
        },
        {
          id: 5,
          title: 'Prepare release notes',
          completed: false,
          created_at: '2024-01-14T08:20:00.000Z',
          completed_at: null,
        },
      ],
    });

    renderApp();

    expect(screen.getByText('2 more tasks...')).toBeInTheDocument();
  });

  it('hides the remaining task message when three or fewer tasks are in progress', () => {
    store.mocks.reset({
      tasks: [
        {
          id: 1,
          title: 'Plan sprint',
          completed: false,
          created_at: '2024-01-10T14:30:00.000Z',
          completed_at: null,
        },
        {
          id: 2,
          title: 'Draft documentation',
          completed: false,
          created_at: '2024-01-11T10:15:00.000Z',
          completed_at: null,
        },
        {
          id: 3,
          title: 'Review designs',
          completed: false,
          created_at: '2024-01-12T09:00:00.000Z',
          completed_at: null,
        },
      ],
    });

    renderApp();

    expect(screen.queryByText(/more task/i)).not.toBeInTheDocument();
  });

  it('shows a success dialog when a task update succeeds', async () => {
    store.mocks.reset({
      successMessage: 'Task updated successfully.',
    });

    renderApp();

    await waitFor(() => {
      expect(
        document.querySelector('[aria-labelledby="edit-task-success-title"]'),
      ).not.toBeNull();
    });
  });
});
