import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Typography,
  alpha,
  useTheme,
} from '@mui/material';
import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import type { Task } from '../store/tasksStore';

interface EditTaskDialogProps {
  open: boolean;
  task: Task | null;
  onClose: () => void;
  onSubmit: (payload: { title: string; description?: string }) => void;
  isSubmitting?: boolean;
}

const EditTaskDialog = ({
  open,
  task,
  onClose,
  onSubmit,
  isSubmitting = false,
}: EditTaskDialogProps) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [titleError, setTitleError] = useState<string | null>(null);
  const theme = useTheme();

  const inputBackground =
    theme.palette.mode === 'light'
      ? 'rgba(17, 17, 24, 0.04)'
      : alpha(theme.palette.common.white, 0.04);

  useEffect(() => {
    if (!open) {
      return;
    }

    setTitle(task?.title ?? '');
    setDescription(task?.description ?? '');
    setTitleError(null);
  }, [task, open]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedTitle = title.trim();

    if (!trimmedTitle) {
      setTitleError('Title is required');
      return;
    }

    onSubmit({
      title: trimmedTitle,
      description: description.trim() || undefined,
    });
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Edit Task</DialogTitle>
      <Box component="form" onSubmit={handleSubmit} noValidate>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          <Typography variant="body2" color="text.secondary">
            Update the details below to keep your task aligned with its current
            status.
          </Typography>
          <TextField
            label="Task title"
            value={title}
            onChange={(event) => {
              const { value } = event.target;
              setTitle(value);
              if (titleError && value.trim()) {
                setTitleError(null);
              }
            }}
            placeholder="e.g. Prepare sprint demo"
            required
            error={Boolean(titleError)}
            helperText={titleError ?? undefined}
            variant="filled"
            autoFocus
            InputProps={{
              disableUnderline: true,
              sx: {
                backgroundColor: inputBackground,
                borderRadius: 2,
                '&:hover': {
                  backgroundColor:
                    theme.palette.mode === 'light'
                      ? 'rgba(17, 17, 24, 0.08)'
                      : alpha(theme.palette.common.white, 0.08),
                },
              },
            }}
            InputLabelProps={{
              sx: { textTransform: 'uppercase', letterSpacing: '0.08em' },
            }}
          />
          <TextField
            label="Description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            multiline
            minRows={3}
            placeholder="Add context, resources, or acceptance criteria"
            variant="filled"
            InputProps={{
              disableUnderline: true,
              sx: {
                backgroundColor: inputBackground,
                borderRadius: 2,
                '&:hover': {
                  backgroundColor:
                    theme.palette.mode === 'light'
                      ? 'rgba(17, 17, 24, 0.08)'
                      : alpha(theme.palette.common.white, 0.08),
                },
              },
            }}
            InputLabelProps={{
              sx: { textTransform: 'uppercase', letterSpacing: '0.08em' },
            }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={onClose} disabled={isSubmitting} variant="outlined">
            Cancel
          </Button>
          <Button type="submit" variant="contained" disabled={isSubmitting}>
            Save changes
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
};

export default EditTaskDialog;
