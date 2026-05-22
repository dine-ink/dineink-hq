import dayjs from 'dayjs';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import { DatePicker } from '@mui/x-date-pickers';

export default function DateFilter({ range, setRange }) {
  return (
    <Stack
      sx={{
        display: 'flex',
        flexDirection: 'row',
        gap: 2,
        alignItems: 'center'
      }}
    >
      {/* 🔴 Presets */}
      <Button onClick={() => setRange([dayjs(), dayjs()])}>
        Today
      </Button>

      <Button onClick={() => setRange([dayjs().subtract(6, 'day'), dayjs()])}>
        Last 7 Days
      </Button>

      {/* 📅 Start Date */}
      <DatePicker
        label="Start"
        value={range[0]}
        onChange={(val) => setRange([val, range[1]])}
      />

      {/* 📅 End Date */}
      <DatePicker
        label="End"
        value={range[1]}
        onChange={(val) => setRange([range[0], val])}
      />

    </Stack>
  );
}