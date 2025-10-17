import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import {
  Box,
  Button,
  Chip,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Stack,
  Typography,
  alpha,
  useTheme,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import type { Task } from '../store/tasksStore';

interface TaskListProps {
  tasks: Task[];
  onToggle: (taskId: number) => void;
  onDelete: (taskId: number) => void;
  variant: 'inProgress' | 'completed';
}

const TaskList = ({ tasks, onToggle, onDelete, variant }: TaskListProps) => {
  const theme = useTheme();
  const isLight = theme.palette.mode === 'light';
  const surfaceColor = isLight
    ? 'rgba(17, 17, 24, 0.04)'
    : alpha(theme.palette.common.white, 0.02);
  const borderColor = isLight
    ? 'rgba(17, 17, 24, 0.08)'
    : alpha(theme.palette.common.white, 0.08);
  const borderColorHover = isLight
    ? 'rgba(17, 17, 24, 0.16)'
    : alpha(theme.palette.common.white, 0.16);
  const mutedIcon = isLight
    ? 'rgba(17, 17, 24, 0.32)'
    : alpha(theme.palette.common.white, 0.48);

  if (!tasks.length) {
    const isInProgress = variant === 'inProgress';
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 1,
          py: 6,
          textAlign: 'center',
          color: 'text.secondary',
        }}
      >
        <AssignmentTurnedInIcon sx={{ fontSize: 48, color: mutedIcon }} />
        <Typography variant="h6" fontWeight={500}>
          {isInProgress ? 'You’re all caught up' : 'Nothing completed yet'}
        </Typography>
        <Typography variant="body2">
          {isInProgress
            ? 'Add a task to kick off your next milestone.'
            : 'Complete tasks to see them tracked here.'}
        </Typography>
      </Box>
    );
  }

  return (
    <List disablePadding>
      {tasks.map((task) => (
        <ListItem
          key={task.id}
          disableGutters
          sx={{
            px: 2,
            py: 1.5,
            mb: 1.5,
            borderRadius: 2,
            border: `1px solid ${borderColor}`,
            backgroundColor: surfaceColor,
            backdropFilter: 'blur(8px)',
            transition: 'all 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            '&:hover': {
              borderColor: borderColorHover,
              transform: 'translateY(-1px)',
            },
          }}
        >
          <ListItemText
            id={`task-${task.id}`}
            primary={task.title}
            secondary={task.description}
            primaryTypographyProps={{
              sx:
                variant === 'completed'
                  ? { textDecoration: 'line-through', color: 'text.disabled' }
                  : undefined,
            }}
          />
          <Stack direction="row" spacing={1.5} alignItems="center">
            {variant === 'inProgress' ? (
              <Button
                size="small"
                variant="outlined"
                onClick={() => onToggle(task.id)}
                aria-label={`Mark ${task.title} as done`}
                sx={{
                  borderColor: borderColor,
                  color: theme.palette.text.primary,
                  '&:hover': {
                    borderColor: theme.palette.primary.main,
                    backgroundColor: alpha(
                      theme.palette.primary.main,
                      isLight ? 0.08 : 0.16,
                    ),
                  },
                }}
              >
                Mark as Done
              </Button>
            ) : (
              <Chip
                size="small"
                label="Completed"
                sx={{
                  borderColor,
                  color: isLight
                    ? 'rgba(17, 17, 24, 0.56)'
                    : alpha(theme.palette.common.white, 0.72),
                  backgroundColor: alpha(
                    theme.palette.text.primary,
                    isLight ? 0.04 : 0.12,
                  ),
                }}
                variant="outlined"
              />
            )}
            <IconButton
              edge="end"
              aria-label={`delete ${task.title}`}
              onClick={() => onDelete(task.id)}
              sx={{
                color: mutedIcon,
                '&:hover': {
                  color: isLight
                    ? 'rgba(17, 17, 24, 0.56)'
                    : alpha(theme.palette.common.white, 0.72),
                },
              }}
            >
              <DeleteIcon />
            </IconButton>
          </Stack>
        </ListItem>
      ))}
    </List>
  );
};

export default TaskList;
