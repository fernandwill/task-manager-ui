import { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Button,
  IconButton,
  Paper,
  Stack,
  Typography,
  alpha,
  useTheme,
} from '@mui/material';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { DragEndEvent } from '@dnd-kit/core';
import type { Task } from '../store/tasksStore';

interface TaskListProps {
  tasks: Task[];
  onToggle: (taskId: number) => void;
  onDelete: (taskId: number) => void;
  onEdit?: (taskId: number) => void;
  onReorder: (orderedIds: number[]) => Promise<void> | void;
  variant: 'inProgress' | 'completed';
}

const TaskList = ({
  tasks,
  onToggle,
  onDelete,
  onEdit,
  onReorder,
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
          {isInProgress ? "You're all caught up" : 'Nothing completed yet'}
        </Typography>
        <Typography variant="body2">
          {isInProgress
            ? 'Add a task to kick off your next milestone.'
            : 'Complete tasks to see them tracked here.'}
        </Typography>
      </Box>
    );
  }

  const [orderedTasks, setOrderedTasks] = useState(tasks);

  useEffect(() => {
    setOrderedTasks(tasks);
  }, [tasks]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = orderedTasks.findIndex(
      (task) => task.id.toString() === active.id,
    );
    const newIndex = orderedTasks.findIndex(
      (task) => task.id.toString() === over.id,
    );

    if (oldIndex === -1 || newIndex === -1) {
      return;
    }

    const newOrder = arrayMove(orderedTasks, oldIndex, newIndex);
    setOrderedTasks(newOrder);
    void onReorder(newOrder.map((task) => task.id));
  };

  const sortableItems = useMemo(
    () => orderedTasks.map((task) => task.id.toString()),
    [orderedTasks],
  );

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <SortableContext items={sortableItems}>
        <Box
          sx={{
            display: 'grid',
            gap: 2.4,
            gridTemplateColumns: {
              xs: '1fr',
              sm: 'repeat(2, minmax(0, 1fr))',
              lg: 'repeat(3, minmax(0, 1fr))',
            },
          }}
        >
          {orderedTasks.map((task) => (
            <SortableTaskCard
              key={task.id}
              task={task}
              variant={variant}
              surfaceColor={surfaceColor}
              borderColor={borderColor}
              borderColorHover={borderColorHover}
              mutedIcon={mutedIcon}
              onToggle={onToggle}
              onDelete={onDelete}
              onEdit={onEdit}
            />
          ))}
        </Box>
      </SortableContext>
    </DndContext>
  );
};

interface SortableTaskCardProps {
  task: Task;
  variant: 'inProgress' | 'completed';
  surfaceColor: string;
  borderColor: string;
  borderColorHover: string;
  mutedIcon: string;
  onToggle: (taskId: number) => void;
  onDelete: (taskId: number) => void;
  onEdit?: (taskId: number) => void;
}

const SortableTaskCard = ({
  task,
  variant,
  surfaceColor,
  borderColor,
  borderColorHover,
  mutedIcon,
  onToggle,
  onDelete,
  onEdit,
}: SortableTaskCardProps) => {
  const theme = useTheme();
  const isLight = theme.palette.mode === 'light';
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id.toString() });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    cursor: isDragging ? 'grabbing' : 'grab',
  } as const;

  return (
    <Paper
      ref={setNodeRef}
      elevation={0}
      style={style}
      {...attributes}
      {...listeners}
      sx={{
        p: 2.5,
        borderRadius: 3,
        border: `1px solid ${borderColor}`,
        backgroundColor: surfaceColor,
        backdropFilter: 'blur(12px)',
        display: 'flex',
        flexDirection: 'column',
        gap: 1.5,
        transition: 'border-color 0.2s ease, transform 0.2s ease',
        height: '100%',
        opacity: isDragging ? 0.85 : 1,
        boxShadow: isDragging
          ? `0 12px 24px ${alpha(
              theme.palette.primary.main,
              isLight ? 0.18 : 0.3,
            )}`
          : 'none',
        '&:hover': {
          borderColor: borderColorHover,
          transform: 'translateY(-6px)',
        },
      }}
    >
      <Stack spacing={1}>
        <Typography
          variant="subtitle1"
          fontWeight={600}
          color={variant === 'completed' ? 'text.secondary' : 'text.primary'}
          sx={{ overflowWrap: 'anywhere' }}
        >
          {task.title}
        </Typography>
        {task.description ? (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ overflowWrap: 'anywhere' }}
          >
            {task.description}
          </Typography>
        ) : null}
      </Stack>

      <Box sx={{ flexGrow: 1 }} />

      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Button
          size="small"
          variant="outlined"
          onClick={() => onToggle(task.id)}
          aria-label={
            variant === 'completed'
              ? `Mark ${task.title} as in progress`
              : `Mark ${task.title} as done`
          }
          sx={{
            borderColor: alpha(theme.palette.primary.main, 0.35),
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
          {variant === 'completed' ? 'Mark as In Progress' : 'Mark as Done'}
        </Button>
        <Stack direction="row" spacing={1}>
          <IconButton
            edge="end"
            aria-label={`edit ${task.title}`}
            onClick={() => onEdit?.(task.id)}
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
      </Stack>
    </Paper>
  );
};

export default TaskList;
