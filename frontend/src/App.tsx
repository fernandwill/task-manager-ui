import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Paper,
  Stack,
  Tab,
  Tabs,
  Typography,
  alpha,
  useTheme,
} from '@mui/material';
import DarkModeOutlinedIcon from '@mui/icons-material/DarkModeOutlined';
import LightbulbOutlinedIcon from '@mui/icons-material/LightbulbOutlined';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import { useEffect, useMemo, useState } from 'react';
import type { SyntheticEvent } from 'react';
import ReportDownloadButton from './components/ReportDownloadButton';
import TaskForm from './components/TaskForm';
import TaskList from './components/TaskList';
import TaskStatusPieChart from './components/TaskStatusPieChart';
import { useTasksStore } from './store/tasksStore';
import { useColorMode } from './theme/AppThemeProvider';
import type { Task } from './store/tasksStore';
import EditTaskDialog from './components/EditTaskDialog';

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
  const updateTask = useTasksStore((state) => state.updateTask);
  const clearSuccessMessage = useTasksStore(
    (state) => state.clearSuccessMessage,
  );
  const reorderTasks = useTasksStore((state) => state.reorderTasks);
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);
  const [isEditSuccessOpen, setIsEditSuccessOpen] = useState(false);

  useEffect(() => {
    void fetchTasks();
  }, [fetchTasks]);

  useEffect(() => {
    if (!successMessage || successMessage === 'Task updated successfully.') {
      return;
    }

    const timeout = window.setTimeout(() => {
      clearSuccessMessage();
    }, 4000);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [successMessage, clearSuccessMessage]);

  useEffect(() => {
    if (successMessage === 'Task updated successfully.') {
      setIsEditSuccessOpen(true);
    }
  }, [successMessage]);

  useEffect(() => {
    if (!successMessage) {
      setIsEditSuccessOpen(false);
    }
  }, [successMessage]);

  const handleDeleteRequest = (taskId: number) => {
    const task = tasks.find((item) => item.id === taskId) ?? null;
    setTaskToDelete(task);
  };

  const handleConfirmDelete = async () => {
    if (!taskToDelete) {
      return;
    }

    const wasDeleted = await deleteTask(taskToDelete.id);
    if (wasDeleted) {
      setTaskToDelete(null);
    }
  };

  const handleEditRequest = (taskId: number) => {
    const task = tasks.find((item) => item.id === taskId) ?? null;
    setTaskToEdit(task);
  };

  const handleSubmitEdit = async (payload: {
    title: string;
    description?: string;
  }) => {
    if (!taskToEdit) {
      return;
    }

    const wasUpdated = await updateTask(taskToEdit.id, payload);
    if (wasUpdated) {
      setTaskToEdit(null);
    }
  };

  const handleCloseEditSuccess = () => {
    setIsEditSuccessOpen(false);
    clearSuccessMessage();
  };

  const stats = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter((task) => task.completed).length;
    const inProgress = total - completed;
    const completionRate = total ? Math.round((completed / total) * 100) : 0;

    return { total, completed, inProgress, completionRate };
  }, [tasks]);

  const inProgressTasks = useMemo(
    () => tasks.filter((task) => !task.completed),
    [tasks],
  );
  const completedTasks = useMemo(
    () => tasks.filter((task) => task.completed),
    [tasks],
  );

  type TaskTab = 'inProgress' | 'completed';
  const [activeTab, setActiveTab] = useState<TaskTab>('inProgress');

  const handleTabChange = (
    _: SyntheticEvent,
    newValue: TaskTab,
  ) => {
    setActiveTab(newValue);
  };

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
              variant="text"
              onClick={toggleMode}
              aria-label="Toggle theme"
              sx={{
                color: 'inherit',
                minWidth: 0,
                px: 1.5,
                '&:hover': {
                  backgroundColor: alpha(
                    theme.palette.text.primary,
                    isLight ? 0.06 : 0.14,
                  ),
                },
              }}
            >
              <Box
                sx={{
                  position: 'relative',
                  width: 24,
                  height: 24,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <LightbulbOutlinedIcon
                  sx={{
                    position: 'absolute',
                    inset: 0,
                    opacity: isLight ? 1 : 0,
                    transform: isLight
                      ? 'scale(1) rotate(0deg)'
                      : 'scale(0.6) rotate(-45deg)',
                    transition: 'opacity 0.3s ease, transform 0.3s ease',
                  }}
                />
                <DarkModeOutlinedIcon
                  sx={{
                    position: 'absolute',
                    inset: 0,
                    opacity: isLight ? 0 : 1,
                    transform: isLight
                      ? 'scale(0.6) rotate(45deg)'
                      : 'scale(1) rotate(0deg)',
                    transition: 'opacity 0.3s ease, transform 0.3s ease',
                  }}
                />
              </Box>
              <Typography
                component="span"
                sx={{
                  position: 'absolute',
                  width: 1,
                  height: 1,
                  padding: 0,
                  margin: -1,
                  overflow: 'hidden',
                  clip: 'rect(0, 0, 0, 0)',
                  border: 0,
                }}
              >
                Toggle theme
              </Typography>
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
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: { xs: 'center', md: 'flex-end' },
                }}
              >
                <TaskStatusPieChart
                  completed={stats.completed}
                  inProgress={stats.inProgress}
                />
              </Box>
            </Paper>
            <Paper
              elevation={0}
              sx={{
                p: { xs: 3, md: 4 },
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                gap: 2.5,
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
                CREATE YOUR TASK FOR THE DAY
              </Typography>
              <TaskForm
                onSubmit={(payload) => void createTask(payload)}
                isSubmitting={isLoading}
              />
            </Paper>
          </Box>

          <Stack spacing={2}>
            {successMessage &&
            successMessage !== 'Task updated successfully.' ? (
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
                <Typography variant="h5">Task List</Typography>
                <Typography variant="body2" color="text.secondary">
                  {stats.total
                    ? `${stats.completionRate}% completed · ${stats.total} tasks`
                    : 'No tasks yet. Start by adding your first task.'}
                </Typography>
              </Box>
              <ReportDownloadButton tasks={tasks} />
            </Stack>

            <Stack spacing={3}>
              <Tabs
                value={activeTab}
                onChange={handleTabChange}
                aria-label="Task progress tabs"
                sx={{
                  alignSelf: { xs: 'stretch', md: 'flex-start' },
                  '& .MuiTabs-indicator': {
                    backgroundColor: theme.palette.primary.main,
                  },
                }}
              >
                <Tab
                  label={`In progress (${inProgressTasks.length})`}
                  value="inProgress"
                  disableRipple
                  wrapped
                  sx={{ textTransform: 'none', fontWeight: 600 }}
                />
                <Tab
                  label={`Completed (${completedTasks.length})`}
                  value="completed"
                  disableRipple
                  wrapped
                  sx={{ textTransform: 'none', fontWeight: 600 }}
                />
              </Tabs>

              {isLoading && !tasks.length ? (
                <Stack direction="row" spacing={2} alignItems="center">
                  <CircularProgress size={20} />
                  <Typography variant="body2" color="text.secondary">
                    Syncing tasks…
                  </Typography>
                </Stack>
              ) : (
                <TaskList
                  tasks={
                    activeTab === 'inProgress'
                      ? inProgressTasks
                      : completedTasks
                  }
                  variant={activeTab}
                  onToggle={(taskId) => void toggleTaskCompletion(taskId)}
                  onDelete={handleDeleteRequest}
                  onEdit={handleEditRequest}
                  onReorder={(ids) => reorderTasks(ids, activeTab)}
                />
              )}
            </Stack>
          </Paper>
        </Stack>
      </Container>

      <Dialog
        open={Boolean(taskToDelete)}
        onClose={() => setTaskToDelete(null)}
        aria-labelledby="delete-task-dialog-title"
      >
        <DialogTitle id="delete-task-dialog-title">Delete task</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            Are you sure you want to delete ‘{taskToDelete?.title}’? This action
            cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setTaskToDelete(null)}
            disabled={isLoading}
            variant="outlined"
          >
            Cancel
          </Button>
          <Button
            onClick={() => void handleConfirmDelete()}
            color="error"
            variant="contained"
            disabled={isLoading}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      <EditTaskDialog
        open={Boolean(taskToEdit)}
        task={taskToEdit}
        onClose={() => setTaskToEdit(null)}
        onSubmit={handleSubmitEdit}
        isSubmitting={isLoading}
      />

      <Dialog
        open={isEditSuccessOpen}
        onClose={handleCloseEditSuccess}
        aria-labelledby="edit-task-success-title"
      >
        <DialogTitle id="edit-task-success-title">Task updated</DialogTitle>
        <DialogContent>
          <Stack direction="row" spacing={2} alignItems="center" mt={1}>
            <CheckCircleOutlineIcon color="success" />
            <Typography>
              {successMessage ?? 'Task updated successfully.'}
            </Typography>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseEditSuccess} autoFocus>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default App;
