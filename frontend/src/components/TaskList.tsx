import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import {
  Box,
  Checkbox,
  IconButton,
  List,
  ListItem,
  ListItemSecondaryAction,
  ListItemText,
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
}

const TaskList = ({ tasks, onToggle, onDelete }: TaskListProps) => {
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
          You’re all caught up
        </Typography>
        <Typography variant="body2">
          Add a task to kick off your next milestone.
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
            '&:hover': {
              borderColor: borderColorHover,
              transform: 'translateY(-1px)',
            },
          }}
          secondaryAction={
            <ListItemSecondaryAction>
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
            </ListItemSecondaryAction>
          }
        >
          <Checkbox
            edge="start"
            color="default"
            checked={task.completed}
            onChange={() => onToggle(task.id)}
            tabIndex={-1}
            inputProps={{ 'aria-labelledby': `task-${task.id}` }}
            sx={{
              color: mutedIcon,
              '&.Mui-checked': {
                color: theme.palette.primary.main,
              },
            }}
          />
          <ListItemText
            id={`task-${task.id}`}
            primary={task.title}
            secondary={task.description}
            primaryTypographyProps={{
              sx: task.completed
                ? { textDecoration: 'line-through', color: 'text.disabled' }
                : undefined,
            }}
          />
        </ListItem>
      ))}
    </List>
  );
};

export default TaskList;
