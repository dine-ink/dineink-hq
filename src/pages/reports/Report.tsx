import { useState } from "react";
import dayjs, { Dayjs } from "dayjs";
import Grid from "@mui/material/Grid";
import { Stack, Typography, Box, Button, Card } from "@mui/material";

import MainCard from "@/components/MainCard";
import ReportAreaChart from "@/sections/dashboard/default/ReportAreaChart";
import MonthlyBarChart from "@/sections/dashboard/default/MonthlyBarChart";
import OrdersTable from "@/sections/dashboard/default/OrdersTable";
import StatsStrip from "@/components/StatsStrip";
import BusinessStats from "@/components/common/BusinessStats";

export default function Reports() {

  const [preset, setPreset] = useState("today");

  const [range, setRange] = useState<[Dayjs | null, Dayjs | null]>([
    dayjs().startOf("day"),
    dayjs().endOf("day"),
  ]);
  const getRange = (type: string): [Dayjs | null, Dayjs | null] => {
    switch (type) {
      case "today": return [dayjs().startOf("day"), dayjs().endOf("day")];
      case "week": return [dayjs().subtract(6, "day"), dayjs().endOf("day")];
      case "month": return [dayjs().startOf("month"), dayjs().endOf("day")];
      case "quarter": return [dayjs().subtract(3, "month"), dayjs().endOf("day")];
      default: return [dayjs().startOf("day"), dayjs().endOf("day")];
    }
  };

  return (
    <Box sx={{ maxWidth: 1200, mx: "auto", pt:3 }}>
      {/* HEADER */}
      <Stack spacing={1} sx={{mb:3}} >
        <Typography variant="h4" sx={{fontWeight:700}}>
          Analytics Dashboard
        </Typography>
        <Typography color="text.secondary">
          Monitor your restaurant performance
        </Typography>
      </Stack>
      {/* FILTER */}
      <Card sx={{ p: 2, mb: 3, borderRadius: 3 }}>
        <Stack direction="row" sx={{gap:1}}>
          {["today", "week", "month", "quarter"].map((f) => (
            <Button
              key={f}
              onClick={() => {
                setPreset(f);
                setRange(getRange(f));
              }}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Button>
          ))}
        </Stack>
      </Card>
      {/* KPI */}
      <Grid container sx={{ mb: 3 }}>
        <Grid size={{ xs: 12 }}>
          <StatsStrip />
        </Grid>
      </Grid>
      {/* BUSINESS HEALTH */}
      <BusinessStats />
      {/* MAIN ANALYTICS */}
      <Grid container sx={{spacing:2, mb:3}}>
        <Grid size={{ xs: 12, md: 8 }}>
          <MainCard title="Revenue Trend">
            <ReportAreaChart range={range}/>
          </MainCard>
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <MainCard title="Orders Distribution">
            <MonthlyBarChart range={range}/>
          </MainCard>
        </Grid>
      </Grid>
      {/* INSIGHTS */}
      <Grid container sx={{spacing:2, mb:3}}>
        <Grid size={{ xs: 12, md: 4 }}>
          <MainCard title="Top Items">
            <Stack spacing={1}>
              <Row label="Paneer Burger" value="320" />
              <Row label="Chicken Burger" value="280" />
              <Row label="Fries" value="210" />
            </Stack>
          </MainCard>
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <MainCard title="Payment Split">
            <Stack spacing={1}>
              <Row label="UPI" value="60%" />
              <Row label="Cash" value="25%" />
              <Row label="Card" value="15%" />
            </Stack>
          </MainCard>
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <MainCard title="Live Orders">
            <Stack spacing={2}>
              <Order id="1023" amount="₹320" />
              <Order id="1024" amount="₹210" />
            </Stack>
          </MainCard>
        </Grid>
      </Grid>
      {/* TABLE */}
      <MainCard title="Recent Orders">
        <OrdersTable range={range}/>
      </MainCard>
    </Box>
  );
}

function Row({ label, value }: any) {
  return (
    <Stack direction="row" sx={{justifyContent:"space-between"}}>
      <Typography>{label}</Typography>
      <Typography sx={{fontWeight:600}}>{value}</Typography>
    </Stack>
  );
}

function Order({ id, amount }: any) {
  return (
    <Stack direction="row" sx={{justifyContent:"space-between"}}>
      <Typography sx={{fontWeight:600}}>Order #{id}</Typography>
      <Typography>{amount}</Typography>
    </Stack>
  );
}