import {
  Alert,
  Box,
  Button,
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
import { useColorMode } from './theme/AppThemeProvider';

const App = () => {
  const theme = useTheme();
  const { toggleMode } = useColorMode();
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

  const isLight = theme.palette.mode === 'light';
  const surfaceColor = isLight
    ? 'rgba(17, 17, 24, 0.04)'
    : alpha(theme.palette.common.white, 0.02);
  const borderSoft = isLight
    ? 'rgba(17, 17, 24, 0.08)'
    : alpha(theme.palette.common.white, 0.04);
  const borderStrong = isLight
    ? 'rgba(17, 17, 24, 0.12)'
    : alpha(theme.palette.common.white, 0.08);
  const gradientHighlight = isLight
    ? alpha(theme.palette.text.primary, 0.06)
    : alpha(theme.palette.common.white, 0.08);
  const gradientAmbient = isLight
    ? alpha(theme.palette.text.primary, 0.03)
    : alpha(theme.palette.common.white, 0.04);

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: `radial-gradient(circle at 20% -10%, ${gradientHighlight} 0%, transparent 55%), radial-gradient(circle at 80% 0%, ${gradientAmbient} 0%, transparent 45%), ${theme.palette.background.default}`,
        py: { xs: 6, md: 8 },
        px: { xs: 2, md: 0 },
      }}
    >
      <Container maxWidth="lg">
        <Stack spacing={5}>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              size="small"
              variant="outlined"
              onClick={toggleMode}
              aria-label="Toggle theme"
              sx={{
                borderColor: borderSoft,
                color: 'inherit',
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                '&:hover': { borderColor: borderStrong },
              }}
            >
              Toggle theme
            </Button>
          </Box>
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
                p: { xs: 3, md: 4 },
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                gap: 2.5,
                backgroundColor: surfaceColor,
                backdropFilter: 'blur(12px)',
                borderColor: borderSoft,
              }}
            >
              <Typography variant="h4" fontWeight={600}>
                Minimal noir productivity
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Streamline tasks in a focused workspace with muted tones and
                zero distractions.
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap">
                <Chip
                  label={`${stats.total} Total`}
                  variant="outlined"
                  sx={{ borderColor: borderStrong }}
                />
                <Chip
                  label={`${stats.completed} Completed`}
                  variant="outlined"
                  sx={{ borderColor: borderStrong }}
                />
                <Chip
                  label={`${stats.pending} Remaining`}
                  variant="outlined"
                  sx={{ borderColor: borderStrong }}
                />
              </Stack>
            </Paper>
            <Paper
              elevation={0}
              sx={{
                p: { xs: 3, md: 4 },
                height: '100%',
                backgroundColor: surfaceColor,
                borderColor: borderSoft,
                backdropFilter: 'blur(12px)',
              }}
            >
              <Typography
                variant="subtitle1"
                color="text.secondary"
                mb={1.5}
                sx={{ textTransform: 'uppercase', letterSpacing: '0.12em' }}
              >
                Quick add
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
              p: { xs: 3, md: 4 },
              borderColor: borderStrong,
              backgroundColor: surfaceColor,
              backdropFilter: 'blur(12px)',
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
