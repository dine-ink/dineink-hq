export default function ListItemIcon(theme: any) {
  return {
    MuiListItemIcon: {
      styleOverrides: {
        root: {
          minWidth: 24,
          color: theme.vars.palette.text.primary
        }
      }
    }
  };
}
