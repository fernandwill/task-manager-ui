import { AxiosError } from 'axios';
import { create } from 'zustand';
import apiClient from '../api/client';

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

const NETWORK_RESTORED_MESSAGE = 'Network restored.';
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
    set({ isLoading: true, error: null, successMessage: null });
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

      set((state) => ({
        tasks: normalizedTasks,
        networkStatus: 'online',
        isNetworkError: false,
        networkMessage:
          state.networkStatus === 'offline' ? NETWORK_RESTORED_MESSAGE : null,
      }));
    } catch (err) {
      if (isAxiosNetworkError(err)) {
        set({
          error: getErrorMessage(err),
          networkStatus: 'offline',
          isNetworkError: true,
          networkMessage: getOfflineToastMessage(err),
        });
      } else {
        set({
          error: getErrorMessage(err),
          networkStatus: 'online',
          isNetworkError: false,
          networkMessage: null,
        });
      }
    } finally {
      set({ isLoading: false });
    }
  },

  async createTask(payload) {
    set({ isLoading: true, error: null, successMessage: null });
    try {
      const { data } = await apiClient.post<Task>(
        `${TASKS_ENDPOINT}/`,
        payload,
      );
      set((state) => ({
        tasks: [...state.tasks, data],
        successMessage: 'Task created successfully.',
        networkStatus: 'online',
        isNetworkError: false,
        networkMessage:
          state.networkStatus === 'offline' ? NETWORK_RESTORED_MESSAGE : null,
      }));
    } catch (err) {
      if (isAxiosNetworkError(err)) {
        set({
          error: getErrorMessage(err),
          networkStatus: 'offline',
          isNetworkError: true,
          networkMessage: getOfflineToastMessage(err),
        });
      } else {
        set({
          error: getErrorMessage(err),
          networkStatus: 'online',
          isNetworkError: false,
          networkMessage: null,
        });
      }
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

    set({ isLoading: true, error: null, successMessage: null });
    try {
      const { data } = await apiClient.patch<Task>(
        `${TASKS_ENDPOINT}/${taskId}`,
        {
          completed: !task.completed,
        },
      );
      set((state) => ({
        tasks: state.tasks.map((current) =>
          current.id === taskId ? data : current,
        ),
        networkStatus: 'online',
        isNetworkError: false,
        networkMessage:
          state.networkStatus === 'offline' ? NETWORK_RESTORED_MESSAGE : null,
      }));
    } catch (err) {
      if (isAxiosNetworkError(err)) {
        set({
          error: getErrorMessage(err),
          networkStatus: 'offline',
          isNetworkError: true,
          networkMessage: getOfflineToastMessage(err),
        });
      } else {
        set({
          error: getErrorMessage(err),
          networkStatus: 'online',
          isNetworkError: false,
          networkMessage: null,
        });
      }
    } finally {
      set({ isLoading: false });
    }
  },

  async deleteTask(taskId) {
    set({ isLoading: true, error: null, successMessage: null });
    try {
      await apiClient.delete(`${TASKS_ENDPOINT}/${taskId}`);
      set((state) => ({
        tasks: state.tasks.filter((task) => task.id !== taskId),
        successMessage: 'Task deleted successfully.',
        networkStatus: 'online',
        isNetworkError: false,
        networkMessage:
          state.networkStatus === 'offline' ? NETWORK_RESTORED_MESSAGE : null,
      }));
      return true;
    } catch (err) {
      if (isAxiosNetworkError(err)) {
        set({
          error: getErrorMessage(err),
          networkStatus: 'offline',
          isNetworkError: true,
          networkMessage: getOfflineToastMessage(err),
        });
      } else {
        set({
          error: getErrorMessage(err),
          networkStatus: 'online',
          isNetworkError: false,
          networkMessage: null,
        });
      }
      return false;
    } finally {
      set({ isLoading: false });
    }
  },

  async updateTask(taskId, payload) {
    set({ isLoading: true, error: null, successMessage: null });
    try {
      const { data } = await apiClient.patch<Task>(
        `${TASKS_ENDPOINT}/${taskId}`,
        payload,
      );
      set((state) => ({
        tasks: state.tasks.map((current) =>
          current.id === taskId ? data : current,
        ),
        successMessage: 'Task updated successfully.',
        networkStatus: 'online',
        isNetworkError: false,
        networkMessage:
          state.networkStatus === 'offline' ? NETWORK_RESTORED_MESSAGE : null,
      }));
      return true;
    } catch (err) {
      if (isAxiosNetworkError(err)) {
        set({
          error: getErrorMessage(err),
          networkStatus: 'offline',
          isNetworkError: true,
          networkMessage: getOfflineToastMessage(err),
        });
      } else {
        set({
          error: getErrorMessage(err),
          networkStatus: 'online',
          isNetworkError: false,
          networkMessage: null,
        });
      }
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
      set((state) => ({
        networkStatus: 'online',
        isNetworkError: false,
        networkMessage:
          state.networkStatus === 'offline' ? NETWORK_RESTORED_MESSAGE : null,
      }));
    } catch (err) {
      if (isAxiosNetworkError(err)) {
        set({
          tasks: previousTasks,
          error: getErrorMessage(err),
          networkStatus: 'offline',
          isNetworkError: true,
          networkMessage: getOfflineToastMessage(err),
        });
      } else {
        set({
          tasks: previousTasks,
          error: getErrorMessage(err),
          networkStatus: 'online',
          isNetworkError: false,
          networkMessage: null,
        });
      }
    }
  },
}));
const TASKS_ENDPOINT = '/tasks';
