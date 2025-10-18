import { AxiosError } from 'axios';
import { create, type StoreApi } from 'zustand';
import apiClient from '../api/client';
import {
  NETWORK_RESTORED_MESSAGE,
  TASK_CREATE_FAILURE_TOAST_MESSAGE,
  TASK_DELETE_FAILURE_TOAST_MESSAGE,
  TASK_UPDATE_FAILURE_TOAST_MESSAGE,
} from '../constants/toastMessages';

export interface Task {
  id: number;
  title: string;
  description?: string;
  completed: boolean;
  created_at: string;
  completed_at: string | null;
}

const getErrorMessage = (error: unknown) => {
  if (error instanceof AxiosError) {
    const message =
      error.response?.data?.detail ??
      error.response?.data?.message ??
      error.message;
    return Array.isArray(message) ? message.join(', ') : String(message);
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'Unexpected error. Please try again.';
};

const DEFAULT_OFFLINE_MESSAGE =
  'Unable to reach the server. Some actions may be unavailable while offline.';

const isAxiosNetworkError = (error: unknown): error is AxiosError => {
  if (!(error instanceof AxiosError)) {
    return false;
  }

  if (!error.response) {
    return true;
  }

  return error.code === AxiosError.ERR_NETWORK;
};

const getOfflineToastMessage = (error: unknown) => {
  const message = getErrorMessage(error);
  if (!message || message.toLowerCase() === 'network error') {
    return DEFAULT_OFFLINE_MESSAGE;
  }
  return message;
};

interface TasksState {
  tasks: Task[];
  isLoading: boolean;
  error: string | null;
  successMessage: string | null;
  networkStatus: 'online' | 'offline';
  networkMessage: string | null;
  isNetworkError: boolean;
  fetchTasks: () => Promise<void>;
  createTask: (payload: Pick<Task, 'title' | 'description'>) => Promise<void>;
  toggleTaskCompletion: (taskId: number) => Promise<void>;
  updateTask: (
    taskId: number,
    payload: Pick<Task, 'title' | 'description'>,
  ) => Promise<boolean>;
  deleteTask: (taskId: number) => Promise<boolean>;
  reorderTasks: (
    orderedIds: number[],
    variant: 'inProgress' | 'completed',
  ) => Promise<void>;
  clearSuccessMessage: () => void;
  clearNetworkMessage: () => void;
}

type SetState = StoreApi<TasksState>['setState'];

const startRequest = (set: SetState) => {
  set({ isLoading: true, error: null });
};

const markStoreOnline = (
  set: SetState,
  updater?: (state: TasksState) => Partial<TasksState>,
) => {
  set((state) => ({
    ...(updater ? updater(state) : {}),
    networkStatus: 'online',
    isNetworkError: false,
    networkMessage:
      state.networkStatus === 'offline' ? NETWORK_RESTORED_MESSAGE : null,
  }));
};

const handleRequestError = (
  set: SetState,
  error: unknown,
  {
    nonNetworkMessage = null,
    networkState,
    nonNetworkState,
  }: {
    nonNetworkMessage?: string | null;
    networkState?: Partial<TasksState>;
    nonNetworkState?: Partial<TasksState>;
  } = {},
) => {
  if (isAxiosNetworkError(error)) {
    set({
      ...networkState,
      error: getErrorMessage(error),
      networkStatus: 'offline',
      isNetworkError: true,
      networkMessage: getOfflineToastMessage(error),
    });
  } else {
    set({
      ...nonNetworkState,
      error: getErrorMessage(error),
      networkStatus: 'online',
      isNetworkError: false,
      networkMessage: nonNetworkMessage ?? null,
    });
  }
};

export const useTasksStore = create<TasksState>((set, get) => ({
  tasks: [],
  isLoading: false,
  error: null,
  successMessage: null,
  networkStatus: 'online',
  networkMessage: null,
  isNetworkError: false,
  clearSuccessMessage() {
    set({ successMessage: null });
  },
  clearNetworkMessage() {
    set({ networkMessage: null });
  },

  async fetchTasks() {
    startRequest(set);
    try {
      const { data } = await apiClient.get<
        Task[] | { tasks?: Task[]; items?: Task[] }
      >(
        `${TASKS_ENDPOINT}/`,
      );
      const normalizedTasks = Array.isArray(data)
        ? data
        : Array.isArray(data?.tasks)
        ? data.tasks
        : Array.isArray(data?.items)
        ? data.items
        : [];

      markStoreOnline(set, () => ({
        tasks: normalizedTasks,
      }));
    } catch (err) {
      handleRequestError(set, err);
    } finally {
      set({ isLoading: false });
    }
  },

  async createTask(payload) {
    startRequest(set);
    try {
      const { data } = await apiClient.post<Task>(
        `${TASKS_ENDPOINT}/`,
        payload,
      );
      markStoreOnline(set, (state) => ({
        tasks: [...state.tasks, data],
      }));
      set({ successMessage: 'Task created successfully.' });
    } catch (err) {
      handleRequestError(set, err, {
        nonNetworkMessage: TASK_CREATE_FAILURE_TOAST_MESSAGE,
      });
    } finally {
      set({ isLoading: false });
    }
  },

  async toggleTaskCompletion(taskId) {
    const { tasks } = get();
    const task = tasks.find((item) => item.id === taskId);
    if (!task) {
      set({ error: 'Task not found.' });
      return;
    }

    startRequest(set);
    try {
      const { data } = await apiClient.patch<Task>(
        `${TASKS_ENDPOINT}/${taskId}`,
        {
          completed: !task.completed,
        },
      );
      markStoreOnline(set, (state) => ({
        tasks: state.tasks.map((current) =>
          current.id === taskId ? data : current,
        ),
      }));
    } catch (err) {
      handleRequestError(set, err);
    } finally {
      set({ isLoading: false });
    }
  },

  async deleteTask(taskId) {
    startRequest(set);
    try {
      await apiClient.delete(`${TASKS_ENDPOINT}/${taskId}`);
      markStoreOnline(set, (state) => ({
        tasks: state.tasks.filter((task) => task.id !== taskId),
        successMessage: 'Task deleted successfully.',
      }));
      return true;
    } catch (err) {
      handleRequestError(set, err, {
        nonNetworkMessage: TASK_DELETE_FAILURE_TOAST_MESSAGE,
      });
      return false;
    } finally {
      set({ isLoading: false });
    }
  },

  async updateTask(taskId, payload) {
    startRequest(set);
    try {
      const { data } = await apiClient.patch<Task>(
        `${TASKS_ENDPOINT}/${taskId}`,
        payload,
      );
      markStoreOnline(set, (state) => ({
        tasks: state.tasks.map((current) =>
          current.id === taskId ? data : current,
        ),
        successMessage: 'Task updated successfully.',
      }));
      return true;
    } catch (err) {
      handleRequestError(set, err, {
        nonNetworkMessage: TASK_UPDATE_FAILURE_TOAST_MESSAGE,
      });
      return false;
    } finally {
      set({ isLoading: false });
    }
  },

  async reorderTasks(orderedIds, variant) {
    const previousTasks = get().tasks;
    const targetList =
      variant === 'completed'
        ? previousTasks.filter((task) => task.completed)
        : previousTasks.filter((task) => !task.completed);
    const otherList =
      variant === 'completed'
        ? previousTasks.filter((task) => !task.completed)
        : previousTasks.filter((task) => task.completed);

    const taskMap = new Map(targetList.map((task) => [task.id, task]));
    const reordered = orderedIds
      .map((taskId) => taskMap.get(taskId))
      .filter((task): task is Task => Boolean(task));

    const merged =
      variant === 'completed'
        ? [...otherList, ...reordered]
        : [...reordered, ...otherList];

    set({
      tasks: merged,
      error: null,
    });

    try {
      await apiClient.post(`${TASKS_ENDPOINT}/reorder`, {
        ids: merged.map((task) => task.id),
      });
      markStoreOnline(set);
    } catch (err) {
      handleRequestError(set, err, {
        networkState: { tasks: previousTasks },
        nonNetworkState: { tasks: previousTasks },
      });
    }
  },
}));
const TASKS_ENDPOINT = '/tasks';
