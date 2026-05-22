import { useState } from 'react';
import { IconButton, Menu, MenuItem } from '@mui/material';
import EllipsisOutlined from '@ant-design/icons/EllipsisOutlined';

type Props = {
  onExportCSV?: () => void;
  onExportExcel?: () => void;
  onPrint?: () => void;
};

export default function CardActionsMenu({
  onExportCSV,
  onExportExcel,
  onPrint
}: Props) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
    <>
      <IconButton onClick={handleOpen}>
        <EllipsisOutlined style={{ fontSize: '1.2rem' }} />
      </IconButton>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <MenuItem
          onClick={() => {
            onExportCSV?.();
            handleClose();
          }}
        >
          Export as CSV
        </MenuItem>

        <MenuItem
          onClick={() => {
            onExportExcel?.();
            handleClose();
          }}
        >
          Export as Excel
        </MenuItem>

        <MenuItem
          onClick={() => {
            onPrint?.();
            handleClose();
          }}
        >
          Print
        </MenuItem>
      </Menu>
    </>
  );
}