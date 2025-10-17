import { useState } from 'react';
import type { FormEvent } from 'react';
import { Box, Button, TextField, alpha, useTheme } from '@mui/material';

interface TaskFormProps {
  onSubmit: (payload: { title: string; description?: string }) => void;
  isSubmitting?: boolean;
  autoFocusTitle?: boolean;
}

const initialFormState = {
  title: '',
  description: '',
};

const TaskForm = ({
  onSubmit,
  isSubmitting = false,
  autoFocusTitle = false,
}: TaskFormProps) => {
  const [formState, setFormState] = useState(initialFormState);
  const [titleError, setTitleError] = useState<string | null>(null);
  const theme = useTheme();

  const inputBackground =
    theme.palette.mode === 'light'
      ? 'rgba(17, 17, 24, 0.04)'
      : alpha(theme.palette.common.white, 0.04);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedTitle = formState.title.trim();
    if (!trimmedTitle) {
      setTitleError('Title is required');
      return;
    }

    onSubmit({
      title: trimmedTitle,
      description: formState.description.trim() || undefined,
    });
    setFormState(initialFormState);
    setTitleError(null);
  };

  return (
    <Box
      component="form"
      noValidate
      onSubmit={handleSubmit}
      sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}
    >
      <TextField
        label="Task title"
        value={formState.title}
        onChange={(event) => {
          const { value } = event.target;
          setFormState((prev) => ({ ...prev, title: value }));
          if (titleError && value.trim()) {
            setTitleError(null);
          }
        }}
        placeholder="e.g. Prepare sprint demo"
        required
        error={Boolean(titleError)}
        helperText={titleError ?? undefined}
        variant="filled"
        autoFocus={autoFocusTitle}
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
        InputLabelProps={{ sx: { textTransform: 'uppercase', letterSpacing: '0.08em' } }}
      />
      <TextField
        label="Description"
        value={formState.description}
        onChange={(event) =>
          setFormState((prev) => ({ ...prev, description: event.target.value }))
        }
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
        InputLabelProps={{ sx: { textTransform: 'uppercase', letterSpacing: '0.08em' } }}
      />
      <Button
        type="submit"
        variant="contained"
        size="large"
        disabled={isSubmitting}
        sx={{ alignSelf: { xs: 'stretch', sm: 'flex-start' } }}
      >
        Create Task
      </Button>
    </Box>
  );
};

export default TaskForm;
