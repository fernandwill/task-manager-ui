import { Alert, Snackbar } from '@mui/material';
import type { SyntheticEvent } from 'react';
import type { SnackbarCloseReason } from '@mui/material/Snackbar';

export type NetworkStatusToastProps = {
  status: 'online' | 'offline';
  message: string | null;
  tone?: 'success' | 'error';
  onClose: () => void;
};

const ONLINE_AUTO_HIDE_DURATION = 4000;
const FALLBACK_OFFLINE_MESSAGE =
  'Unable to reach the server. Some actions may be unavailable while offline.';

const NetworkStatusToast = ({
  status,
  message,
  onClose,
  tone = 'success',
}: NetworkStatusToastProps) => {
  const isOffline = status === 'offline';
  const open = isOffline || Boolean(message);
  const displayedMessage =
    message ?? (isOffline ? FALLBACK_OFFLINE_MESSAGE : '');
  const severity = isOffline ? 'error' : tone;

  const handleClose = (
    _event: Event | SyntheticEvent,
    reason?: SnackbarCloseReason,
  ) => {
    if (reason === 'clickaway' || isOffline) {
      return;
    }

    onClose();
  };

  return (
    <Snackbar
      open={open}
      anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      autoHideDuration={isOffline ? null : ONLINE_AUTO_HIDE_DURATION}
      onClose={handleClose}
    >
      <Alert
        severity={severity}
        variant="filled"
        sx={{
          minWidth: 320,
          alignItems: 'center',
          boxShadow: (theme) => theme.shadows[6],
        }}
      >
        {displayedMessage}
      </Alert>
    </Snackbar>
  );
};

export default NetworkStatusToast;
