import {
  Alert,
  Box,
  Chip,
  CircularProgress,
  Container,
  Paper,
  Stack,
  Typography,
  alpha,
  useTheme,
} from '@mui/material';
import { useEffect, useMemo } from 'react';
import ReportDownloadButton from './components/ReportDownloadButton';
import TaskForm from './components/TaskForm';
import TaskList from './components/TaskList';
import { useTasksStore } from './store/tasksStore';

const App = () => {
  const theme = useTheme();
  const tasks = useTasksStore((state) => state.tasks);
  const isLoading = useTasksStore((state) => state.isLoading);
  const error = useTasksStore((state) => state.error);
  const successMessage = useTasksStore((state) => state.successMessage);
  const fetchTasks = useTasksStore((state) => state.fetchTasks);
  const createTask = useTasksStore((state) => state.createTask);
  const toggleTaskCompletion = useTasksStore(
    (state) => state.toggleTaskCompletion,
  );
  const deleteTask = useTasksStore((state) => state.deleteTask);
  const clearSuccessMessage = useTasksStore(
    (state) => state.clearSuccessMessage,
  );

  useEffect(() => {
    void fetchTasks();
  }, [fetchTasks]);

  useEffect(() => {
    if (!successMessage) {
      return;
    }

    const timeout = window.setTimeout(() => {
      clearSuccessMessage();
    }, 4000);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [successMessage, clearSuccessMessage]);

  const stats = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter((task) => task.completed).length;
    const pending = total - completed;
    const completionRate = total ? Math.round((completed / total) * 100) : 0;

    return { total, completed, pending, completionRate };
  }, [tasks]);

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.12)} 0%, ${theme.palette.background.default} 30%, ${theme.palette.background.default} 100%)`,
        py: { xs: 6, md: 8 },
      }}
    >
      <Container maxWidth="lg">
        <Stack spacing={5}>
          <Box
            sx={{
              display: 'grid',
              gap: 3,
              gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' },
              alignItems: 'stretch',
            }}
          >
            <Paper
              elevation={0}
              sx={{
                p: 3,
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                gap: 2,
              }}
            >
              <Typography variant="h4">Build your perfect workflow</Typography>
              <Typography variant="body1" color="text.secondary">
                Stay on top of priorities, delegate with confidence, and ship on
                time with insights synced with your FastAPI backend.
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap">
                <Chip label={`${stats.total} Total`} color="primary" />
                <Chip
                  label={`${stats.completed} Completed`}
                  color="success"
                  variant="outlined"
                />
                <Chip
                  label={`${stats.pending} Remaining`}
                  color="secondary"
                  variant="outlined"
                />
              </Stack>
            </Paper>
            <Paper elevation={0} sx={{ p: 3, height: '100%' }}>
              <Typography variant="subtitle1" color="text.secondary" mb={1}>
                Quick Add
              </Typography>
              <TaskForm
                onSubmit={(payload) => void createTask(payload)}
                isSubmitting={isLoading}
              />
            </Paper>
          </Box>

          <Stack spacing={2}>
            {successMessage ? (
              <Alert
                severity="success"
                onClose={clearSuccessMessage}
                data-testid="success-alert"
              >
                {successMessage}
              </Alert>
            ) : null}
            {error ? <Alert severity="error">{error}</Alert> : null}
          </Stack>

          <Paper
            elevation={0}
            sx={{
              p: { xs: 2.5, md: 3.5 },
              border: `1px solid ${alpha(theme.palette.divider, 0.4)}`,
            }}
          >
            <Stack
              direction={{ xs: 'column', md: 'row' }}
              justifyContent="space-between"
              alignItems={{ xs: 'flex-start', md: 'center' }}
              spacing={2}
              mb={3}
            >
              <Box>
                <Typography variant="h5">Team Tasks</Typography>
                <Typography variant="body2" color="text.secondary">
                  {stats.total
                    ? `${stats.completionRate}% completed · ${stats.total} tasks`
                    : 'No tasks yet. Start by adding your first task.'}
                </Typography>
              </Box>
              <ReportDownloadButton tasks={tasks} />
            </Stack>

            {isLoading && !tasks.length ? (
              <Stack direction="row" spacing={2} alignItems="center">
                <CircularProgress size={20} />
                <Typography variant="body2" color="text.secondary">
                  Syncing tasks…
                </Typography>
              </Stack>
            ) : (
              <TaskList
                tasks={tasks}
                onToggle={(taskId) => void toggleTaskCompletion(taskId)}
                onDelete={(taskId) => void deleteTask(taskId)}
              />
            )}
          </Paper>
        </Stack>
      </Container>
    </Box>
  );
};

export default App;
