import { create } from 'zustand';
import apiClient from '../api/client';

export interface Task {
  id: number;
  title: string;
  description?: string;
  completed: boolean;
}

interface TasksState {
  tasks: Task[];
  isLoading: boolean;
  error: string | null;
  fetchTasks: () => Promise<void>;
  createTask: (payload: Pick<Task, 'title' | 'description'>) => Promise<void>;
  toggleTaskCompletion: (taskId: number) => Promise<void>;
  deleteTask: (taskId: number) => Promise<void>;
}

export const useTasksStore = create<TasksState>((set, get) => ({
  tasks: [],
  isLoading: false,
  error: null,

  async fetchTasks() {
    set({ isLoading: true, error: null });
    try {
      const { data } = await apiClient.get<Task[]>('/tasks');
      set({ tasks: data });
    } catch (err) {
      set({ error: 'Unable to fetch tasks. Please try again.' });
    } finally {
      set({ isLoading: false });
    }
  },

  async createTask(payload) {
    set({ isLoading: true, error: null });
    try {
      const { data } = await apiClient.post<Task>('/tasks', payload);
      set({ tasks: [...get().tasks, data] });
    } catch (err) {
      set({ error: 'Unable to create task. Please try again.' });
    } finally {
      set({ isLoading: false });
    }
  },

  async toggleTaskCompletion(taskId) {
    set({ isLoading: true, error: null });
    try {
      const { data } = await apiClient.patch<Task>(`/tasks/${taskId}/toggle`);
      set({
        tasks: get().tasks.map((task) =>
          task.id === taskId ? data : task,
        ),
      });
    } catch (err) {
      set({ error: 'Unable to update task. Please try again.' });
    } finally {
      set({ isLoading: false });
    }
  },

  async deleteTask(taskId) {
    set({ isLoading: true, error: null });
    try {
      await apiClient.delete(`/tasks/${taskId}`);
      set({ tasks: get().tasks.filter((task) => task.id !== taskId) });
    } catch (err) {
      set({ error: 'Unable to delete task. Please try again.' });
    } finally {
      set({ isLoading: false });
    }
  },
}));
