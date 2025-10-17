import { Box, Stack, Typography, alpha, useTheme } from '@mui/material';

type TaskStatusPieChartProps = {
  completed: number;
  inProgress: number;
};

const TaskStatusPieChart = ({ completed, inProgress }: TaskStatusPieChartProps) => {
  const theme = useTheme();
  const total = completed + inProgress;
  const completedRatio = total ? completed / total : 0;
  const completedAngle = completedRatio * 360;
  const hasData = total > 0;

  const chartBackground = hasData
    ? `conic-gradient(${theme.palette.success.main} 0deg ${completedAngle}deg, ${theme.palette.warning.main} ${completedAngle}deg 360deg)`
    : alpha(theme.palette.text.secondary, 0.12);

  return (
    <Stack
      direction={{ xs: 'row', sm: 'column', md: 'row' }}
      spacing={2.5}
      alignItems={{ xs: 'center', sm: 'flex-start', md: 'center' }}
    >
      <Box
        sx={{
          width: 132,
          height: 132,
          flex: '0 0 auto',
          borderRadius: '50%',
          background: hasData ? chartBackground : undefined,
          backgroundColor: hasData ? undefined : chartBackground,
          display: 'grid',
          placeItems: 'center',
          position: 'relative',
          boxShadow: hasData
            ? `0 0 0 1px ${alpha(theme.palette.common.white, theme.palette.mode === 'light' ? 0.4 : 0.1)}`
            : `inset 0 0 0 1px ${alpha(theme.palette.text.secondary, 0.24)}`,
        }}
      >
        <Box
          sx={{
            width: 84,
            height: 84,
            borderRadius: '50%',
            backgroundColor:
              theme.palette.mode === 'light'
                ? alpha(theme.palette.common.white, 0.9)
                : alpha(theme.palette.common.black, 0.4),
            display: 'grid',
            placeItems: 'center',
            textAlign: 'center',
            px: 1,
          }}
        >
          {hasData ? (
            <Stack spacing={0.5}>
              <Typography variant="subtitle2" fontWeight={600}>
                {Math.round(completedRatio * 100)}%
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Complete
              </Typography>
            </Stack>
          ) : (
            <Typography variant="caption" color="text.secondary">
              No tasks yet
            </Typography>
          )}
        </Box>
      </Box>
      <Stack spacing={1.5} minWidth={160}>
        <Typography
          variant="subtitle2"
          color="text.secondary"
          sx={{ textTransform: 'uppercase', letterSpacing: '0.08em' }}
        >
          Status mix
        </Typography>
        <Stack spacing={1.25}>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Box
              sx={{
                width: 12,
                height: 12,
                borderRadius: '50%',
                backgroundColor: theme.palette.success.main,
              }}
            />
            <Typography variant="body2">
              Completed · {completed}
            </Typography>
          </Stack>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Box
              sx={{
                width: 12,
                height: 12,
                borderRadius: '50%',
                backgroundColor: theme.palette.warning.main,
              }}
            />
            <Typography variant="body2">
              In progress · {inProgress}
            </Typography>
          </Stack>
        </Stack>
      </Stack>
    </Stack>
  );
};

export default TaskStatusPieChart;
