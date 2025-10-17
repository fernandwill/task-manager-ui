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
        <AssignmentTurnedInIcon color="primary" sx={{ fontSize: 48, opacity: 0.6 }} />
        <Typography variant="h6">You’re all caught up</Typography>
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
            border: `1px solid ${alpha(theme.palette.divider, 0.4)}`,
            backgroundColor: alpha(theme.palette.background.paper, 0.6),
            transition: 'all 0.2s ease',
            '&:hover': {
              boxShadow: `0 10px 30px ${alpha(theme.palette.primary.main, 0.08)}`,
              transform: 'translateY(-2px)',
            },
          }}
          secondaryAction={
            <ListItemSecondaryAction>
              <IconButton
                edge="end"
                color="error"
                aria-label={`delete ${task.title}`}
                onClick={() => onDelete(task.id)}
              >
                <DeleteIcon />
              </IconButton>
            </ListItemSecondaryAction>
          }
        >
          <Checkbox
            edge="start"
            color="primary"
            checked={task.completed}
            onChange={() => onToggle(task.id)}
            tabIndex={-1}
            inputProps={{ 'aria-labelledby': `task-${task.id}` }}
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
