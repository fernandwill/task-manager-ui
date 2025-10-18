import { forwardRef } from 'react';
import type { SyntheticEvent } from 'react';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import CloseIcon from '@mui/icons-material/Close';
import {
  IconButton,
  Paper,
  Slide,
  Snackbar,
  Stack,
  Typography,
} from '@mui/material';
import type { SlideProps } from '@mui/material/Slide';
import type { SnackbarCloseReason } from '@mui/material/Snackbar';

export type SuccessToastProps = {
  open: boolean;
  message: string;
  onClose: () => void;
  autoHideDuration?: number;
};

const SlideTransition = forwardRef(function SlideTransition(
  props: SlideProps,
  ref: React.Ref<unknown>,
) {
  return <Slide {...props} direction="left" ref={ref} />;
});

const SuccessToast = ({
  open,
  message,
  onClose,
  autoHideDuration = 3000,
}: SuccessToastProps) => {
  const handleClose = (
    _event: Event | SyntheticEvent,
    reason?: SnackbarCloseReason,
  ) => {
    if (reason === 'clickaway') {
      return;
    }

    onClose();
  };

  return (
    <Snackbar
      open={open}
      onClose={handleClose}
      TransitionComponent={SlideTransition}
      anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      autoHideDuration={autoHideDuration}
    >
      <Paper
        elevation={8}
        sx={{
          px: 2.5,
          py: 2,
          borderRadius: 2,
          boxShadow: (theme) => theme.shadows[6],
          maxWidth: 360,
        }}
      >
        <Stack direction="row" spacing={1.5} alignItems="center">
          <CheckCircleOutlineIcon color="success" fontSize="medium" />
          <Typography variant="body2" sx={{ fontWeight: 600, flexGrow: 1 }}>
            {message}
          </Typography>
          <IconButton
            size="small"
            aria-label="Close"
            onClick={onClose}
            sx={{ color: 'text.secondary' }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </Stack>
      </Paper>
    </Snackbar>
  );
};

export default SuccessToast;
