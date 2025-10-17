import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import EditIcon from '@mui/icons-material/Edit';
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
  onEdit?: (taskId: number) => void;
  variant: 'inProgress' | 'completed';
}

const TaskList = ({
  tasks,
  onToggle,
  onDelete,
  onEdit,
  variant,
}: TaskListProps) => {
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
            '& .task-action': {
              opacity: 0,
              transform: 'translateY(4px)',
              transition: 'opacity 0.2s ease, transform 0.2s ease',
            },
            ...(variant === 'completed'
              ? {
                  '& .task-action-icon': {
                    width: 0,
                    marginLeft: 0,
                    padding: 0,
                    opacity: 0,
                    overflow: 'hidden',
                    transform: 'translateY(4px)',
                    transition:
                      'opacity 0.2s ease, transform 0.2s ease, width 0.2s ease, margin 0.2s ease, padding 0.2s ease',
                  },
                }
              : {}),
            '&:hover': {
              borderColor: borderColorHover,
              transform: 'translateY(-1px)',
              '& .task-action': {
                opacity: 1,
                transform: 'translateY(0)',
              },
              ...(variant === 'completed'
                ? {
                    '& .task-action-icon': {
                      width: 36,
                      marginLeft: theme.spacing(1.5),
                      padding: theme.spacing(1),
                      opacity: 1,
                    },
                  }
                : {}),
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
                  ? { color: 'text.secondary' }
                  : undefined,
            }}
          />
          <Stack
            direction="row"
            spacing={variant === 'completed' ? 0 : 1.5}
            alignItems="center"
            sx={{ marginLeft: 'auto' }}
          >
            {variant === 'inProgress' ? (
              <Button
                size="small"
                variant="outlined"
                onClick={() => onToggle(task.id)}
                aria-label={`Mark ${task.title} as done`}
                className="task-action"
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
                label="COMPLETED"
                sx={{
                  borderColor,
                  color: isLight
                    ? 'rgba(17, 17, 24, 0.56)'
                    : alpha(theme.palette.common.white, 0.72),
                  backgroundColor: alpha(
                    theme.palette.text.primary,
                    isLight ? 0.04 : 0.12,
                  ),
                  flexShrink: 0,
                }}
                variant="outlined"
              />
            )}
            <IconButton
              edge="end"
              aria-label={`edit ${task.title}`}
              onClick={() => onEdit?.(task.id)}
              className="task-action task-action-icon"
              sx={{
                color: mutedIcon,
                '&:hover': {
                  color: isLight
                    ? 'rgba(17, 17, 24, 0.56)'
                    : alpha(theme.palette.common.white, 0.72),
                },
              }}
            >
              <EditIcon />
            </IconButton>
            <IconButton
              edge="end"
              aria-label={`delete ${task.title}`}
              onClick={() => onDelete(task.id)}
              className="task-action task-action-icon"
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
