import { AxiosError } from 'axios';
import { create } from 'zustand';
import apiClient from '../api/client';

export interface Task {
  id: number;
  title: string;
  description?: string;
  completed: boolean;
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

interface TasksState {
  tasks: Task[];
  isLoading: boolean;
  error: string | null;
  successMessage: string | null;
  fetchTasks: () => Promise<void>;
  createTask: (payload: Pick<Task, 'title' | 'description'>) => Promise<void>;
  toggleTaskCompletion: (taskId: number) => Promise<void>;
  updateTask: (
    taskId: number,
    payload: Pick<Task, 'title' | 'description'>,
  ) => Promise<boolean>;
  deleteTask: (taskId: number) => Promise<boolean>;
  clearSuccessMessage: () => void;
}

export const useTasksStore = create<TasksState>((set, get) => ({
  tasks: [],
  isLoading: false,
  error: null,
  successMessage: null,
  clearSuccessMessage() {
    set({ successMessage: null });
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

      set({ tasks: normalizedTasks });
    } catch (err) {
      set({ error: getErrorMessage(err) });
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
      set({
        tasks: [...get().tasks, data],
        successMessage: 'Task created successfully.',
      });
    } catch (err) {
      set({ error: getErrorMessage(err) });
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
      set({
        tasks: get().tasks.map((current) =>
          current.id === taskId ? data : current,
        ),
      });
    } catch (err) {
      set({ error: getErrorMessage(err) });
    } finally {
      set({ isLoading: false });
    }
  },

  async deleteTask(taskId) {
    set({ isLoading: true, error: null, successMessage: null });
    try {
      await apiClient.delete(`${TASKS_ENDPOINT}/${taskId}`);
      set({
        tasks: get().tasks.filter((task) => task.id !== taskId),
        successMessage: 'Task deleted successfully.',
      });
      return true;
    } catch (err) {
      set({ error: getErrorMessage(err) });
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
      set({
        tasks: get().tasks.map((current) =>
          current.id === taskId ? data : current,
        ),
        successMessage: 'Task updated successfully.',
      });
      return true;
    } catch (err) {
      set({ error: getErrorMessage(err) });
      return false;
    } finally {
      set({ isLoading: false });
    }
  },
}));
const TASKS_ENDPOINT = '/tasks';
