import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import TaskForm from './TaskForm';

describe('TaskForm', () => {
  const setup = () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    render(<TaskForm onSubmit={onSubmit} />);

    return { onSubmit, user };
  };

  it('shows helper text when submitting without a title', async () => {
    const { user, onSubmit } = setup();

    await user.click(screen.getByRole('button', { name: /Create Task/i }));

    expect(onSubmit).not.toHaveBeenCalled();
    expect(await screen.findByText(/Title is required/i)).toBeInTheDocument();
  });

  it('clears the error helper text after a successful submission', async () => {
    const { user, onSubmit } = setup();

    await user.click(screen.getByRole('button', { name: /Create Task/i }));
    expect(await screen.findByText(/Title is required/i)).toBeInTheDocument();

    await user.type(screen.getByLabelText(/Task title/i), '  Ship UI  ');
    await user.click(screen.getByRole('button', { name: /Create Task/i }));

    expect(onSubmit).toHaveBeenCalledWith({
      title: 'Ship UI',
      description: undefined,
    });

    await waitFor(() => {
      expect(screen.queryByText(/Title is required/i)).not.toBeInTheDocument();
    });
  });
});
