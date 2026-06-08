import getColors from 'utils/getColors';
import getShadow from 'utils/getShadow';

function getColor({ variant, theme }: { variant: string; theme: any }) {
  const colors = getColors(theme, variant);
  const { light } = colors;

  const shadows = getShadow(theme, `${variant}`);

  return {
    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: light },
    '&.Mui-focused': { boxShadow: shadows, '& .MuiOutlinedInput-notchedOutline': { border: '1px solid', borderColor: light } }
  };
}

export default function OutlinedInput(theme: any) {
  return {
    MuiOutlinedInput: {
      styleOverrides: {
        input: { padding: '10.5px 14px 10.5px 12px' },
        notchedOutline: { borderColor: theme.vars.palette.grey[300] },
        root: { ...getColor({ variant: 'primary', theme }), '&.Mui-error': { ...getColor({ variant: 'error', theme }) } },
        inputSizeSmall: { padding: '7.5px 8px 7.5px 12px' },
        inputMultiline: { padding: 0 },
        colorSecondary: getColor({ variant: 'secondary', theme }),
        colorError: getColor({ variant: 'error', theme }),
        colorWarning: getColor({ variant: 'warning', theme }),
        colorInfo: getColor({ variant: 'info', theme }),
        colorSuccess: getColor({ variant: 'success', theme })
      }
    }
  };
}
