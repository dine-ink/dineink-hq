import getColors from 'utils/getColors';

import BorderOutlined from '@ant-design/icons/BorderOutlined';
import CheckSquareFilled from '@ant-design/icons/CheckSquareFilled';
import MinusSquareFilled from '@ant-design/icons/MinusSquareFilled';

function getColorStyle({ color, theme }: { color: string; theme: any }) {
  const colors = getColors(theme, color);
  const { lighter, main, dark } = colors;

  return {
    '&:hover': {
      backgroundColor: lighter,
      '& .icon': {
        borderColor: main
      }
    },
    '&.Mui-focusVisible': {
      outline: `2px solid ${dark}`,
      outlineOffset: -4
    }
  };
}

function getSizeStyle(size: string) {
  switch (size) {
    case 'small':
      return { fontSize: 1.15 };
    case 'large':
      return { fontSize: 1.6 };
    case 'medium':
    default:
      return { fontSize: 1.35 };
  }
}

function checkboxStyle(size: string) {
  const sizes = getSizeStyle(size);

  return {
    '& .icon': {
      fontSize: `${sizes.fontSize}rem`
    }
  };
}

export default function Checkbox(theme: any) {
  const { palette } = theme;

  return {
    MuiCheckbox: {
      defaultProps: {
        className: 'size-small',
        icon: <BorderOutlined className="icon" />,
        checkedIcon: <CheckSquareFilled className="icon" />,
        indeterminateIcon: <MinusSquareFilled className="icon" />
      },
      styleOverrides: {
        root: {
          borderRadius: 0,
          color: palette.secondary[300],
          '&.size-small': {
            ...checkboxStyle('small')
          },
          '&.size-medium': {
            ...checkboxStyle('medium')
          },
          '&.size-large': {
            ...checkboxStyle('large')
          }
        },
        colorPrimary: getColorStyle({ color: 'primary', theme }),
        colorSecondary: getColorStyle({ color: 'secondary', theme }),
        colorSuccess: getColorStyle({ color: 'success', theme }),
        colorWarning: getColorStyle({ color: 'warning', theme }),
        colorInfo: getColorStyle({ color: 'info', theme }),
        colorError: getColorStyle({ color: 'error', theme })
      }
    }
  };
}
