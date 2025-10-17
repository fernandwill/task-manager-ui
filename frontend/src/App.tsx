import { useEffect } from 'react';
import {
  Alert,
  Box,
  CircularProgress,
  Container,
  Stack,
  Typography,
} from '@mui/material';
import TaskForm from './components/TaskForm';
import TaskList from './components/TaskList';
import ReportDownloadButton from './components/ReportDownloadButton';
import { useTasksStore } from './store/tasksStore';

const App = () => {
  const tasks = useTasksStore((state) => state.tasks);
  const isLoading = useTasksStore((state) => state.isLoading);
  const error = useTasksStore((state) => state.error);
  const fetchTasks = useTasksStore((state) => state.fetchTasks);
  const createTask = useTasksStore((state) => state.createTask);
  const toggleTaskCompletion = useTasksStore(
    (state) => state.toggleTaskCompletion,
  );
  const deleteTask = useTasksStore((state) => state.deleteTask);

  useEffect(() => {
    void fetchTasks();
  }, [fetchTasks]);

  return (
    <Container maxWidth="md" sx={{ py: 6 }}>
      <Stack spacing={4}>
        <Box>
          <Typography variant="h3" component="h1" gutterBottom>
            Task Manager Dashboard
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Track tasks, manage progress, and export PDF reports backed by the
            FastAPI service.
          </Typography>
        </Box>

        {error ? <Alert severity="error">{error}</Alert> : null}

        <TaskForm onSubmit={(payload) => void createTask(payload)} isSubmitting={isLoading} />

        <Box>
          <Typography variant="h5" component="h2" gutterBottom>
            Tasks
          </Typography>
          {isLoading && !tasks.length ? (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                color: 'text.secondary',
              }}
            >
              <CircularProgress size={20} />
              <Typography variant="body2">Loading tasks…</Typography>
            </Box>
          ) : (
            <TaskList
              tasks={tasks}
              onToggle={(taskId) => void toggleTaskCompletion(taskId)}
              onDelete={(taskId) => void deleteTask(taskId)}
            />
          )}
        </Box>

        <ReportDownloadButton tasks={tasks} />
      </Stack>
    </Container>
  );
};

export default App;
