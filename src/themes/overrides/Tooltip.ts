export default function Tooltip(theme: any) {
  return {
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          color: theme.vars.palette.background.paper
        }
      }
    }
  };
}
