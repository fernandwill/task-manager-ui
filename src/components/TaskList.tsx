import {
  Checkbox,
  IconButton,
  List,
  ListItem,
  ListItemSecondaryAction,
  ListItemText,
  Typography,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import type { Task } from '../store/tasksStore';

interface TaskListProps {
  tasks: Task[];
  onToggle: (taskId: number) => void;
  onDelete: (taskId: number) => void;
}

const TaskList = ({ tasks, onToggle, onDelete }: TaskListProps) => {
  if (!tasks.length) {
    return (
      <Typography variant="body1" color="text.secondary" sx={{ mt: 2 }}>
        No tasks yet. Create a task to get started.
      </Typography>
    );
  }

  return (
    <List>
      {tasks.map((task) => (
        <ListItem
          key={task.id}
          disableGutters
          secondaryAction={
            <ListItemSecondaryAction>
              <IconButton
                edge="end"
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
