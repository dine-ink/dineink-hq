export default function ListItemButton(theme: any) {
  return {
    MuiListItemButton: {
      styleOverrides: {
        root: {
          '&.Mui-selected': {
            color: theme.vars.palette.primary.main,
            '& .MuiListItemIcon-root': {
              color: theme.vars.palette.primary.main
            }
          }
        }
      }
    }
  };
}
