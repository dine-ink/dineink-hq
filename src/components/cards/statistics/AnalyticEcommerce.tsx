import {
  Chip,
  Grid,
  Stack,
  Typography,
  Box
} from '@mui/material';

import MainCard from '@/components/MainCard';
import RiseOutlined from '@ant-design/icons/RiseOutlined';
import FallOutlined from '@ant-design/icons/FallOutlined';

const iconSX = { fontSize: '0.75rem', color: 'white' };

export default function AnalyticEcommerce({
  title,
  count,
  percentage,
  isLoss = false,
  extra,
  color = 'primary'
}: any) {
  return (
    <MainCard contentSX={{ p: 2.5 }}>
      <Stack spacing={1}>
        {/* TITLE */}
        <Typography variant="subtitle2" color="text.secondary">
          {title}
        </Typography>

        {/* VALUE + CHIP */}
        <Grid container spacing={1} sx={{ alignItems: 'center' }}>
          <Grid>
            <Typography variant="h4">{count}</Typography>
          </Grid>
          <Grid>
            <Chip
              size="small"
              variant="filled"
              icon={
                isLoss ? (
                  <FallOutlined style={iconSX} />
                ) : (
                  <RiseOutlined style={iconSX} />
                )
              }
              label={`${percentage}%`}
              sx={{
                fontWeight: 600,
                color: '#fff',

                // 🔥 Brand logic
                backgroundColor: isLoss
                  ? 'gray' // softer red for loss
                  : 'var(--color-red-700)', // your main red
              }}
            />
          </Grid>
        </Grid>

        {/* EXTRA TEXT */}
        {extra !== undefined && (
          <Box>
            <Typography variant="caption" color="text.secondary">
              {isLoss ? 'You lost ' : 'You made an extra '}

              <Box
                component="span"
                sx={{
                  color: 'var(--color-red-700)', // your brand red
                  fontWeight: 600
                }}
              >
                {extra}
              </Box>{' '}

              {isLoss ? 'this period' : 'this period'}
            </Typography>
          </Box>
        )}
      </Stack>
    </MainCard>
  );
}