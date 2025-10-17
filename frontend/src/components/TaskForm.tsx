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

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!formState.title.trim()) {
      return;
    }

    onSubmit({
      title: formState.title.trim(),
      description: formState.description.trim() || undefined,
    });
    setFormState(initialFormState);
  };

  return (
    <Box
      component="form"
      onSubmit={handleSubmit}
      sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}
    >
      <TextField
        label="Task title"
        value={formState.title}
        onChange={(event) =>
          setFormState((prev) => ({ ...prev, title: event.target.value }))
        }
        placeholder="e.g. Prepare sprint demo"
        required
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
