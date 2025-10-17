import { useState } from 'react';
import type { FormEvent } from 'react';
import { Box, Button, TextField } from '@mui/material';

interface TaskFormProps {
  onSubmit: (payload: { title: string; description?: string }) => void;
  isSubmitting?: boolean;
}

const initialFormState = {
  title: '',
  description: '',
};

const TaskForm = ({ onSubmit, isSubmitting = false }: TaskFormProps) => {
  const [formState, setFormState] = useState(initialFormState);
  const [titleError, setTitleError] = useState<string | null>(null);

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
      />
      <Button
        type="submit"
        variant="contained"
        size="large"
        disabled={isSubmitting}
      >
        Create Task
      </Button>
    </Box>
  );
};

export default TaskForm;
