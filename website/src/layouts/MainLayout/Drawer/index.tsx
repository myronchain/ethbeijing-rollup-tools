import { List, ListItem, ListItemText, Box, Drawer, Toolbar, useTheme, useMediaQuery } from '@mui/material';
import React from 'react';
import Nav from './Nav';
import { useAppSelector } from '@core/app/store';

const NAV_WIDTH = 260;

function MainDrawer() {
  const theme = useTheme();
  const leftDrawerOpened = useAppSelector((state) => state.customization.opened);

  const matchUpMd = useMediaQuery(theme.breakpoints.up('md'));
  const container = window !== undefined ? () => window.document.body : undefined;
  return (
    <Box
      component="nav"
      sx={{ flexShrink: { md: 0 }, width: matchUpMd ? NAV_WIDTH : 'auto' }}
      aria-label="mailbox folders"
    >
      {/* <Box component="nav" sx={{ flexShrink: { lg: 0 }, width: { lg: NAV_WIDTH } }}> */}
      <Drawer
        container={container}
        open={leftDrawerOpened}
        anchor="left"
        variant="persistent"
        sx={{
          width: NAV_WIDTH,
          flexShrink: 0,
          [`& .MuiDrawer-paper`]: { width: NAV_WIDTH, boxSizing: 'border-box' },
        }}
        PaperProps={{
          sx: {
            px: '16px',
            boxSizing: 'border-box',
            width: NAV_WIDTH,
            bgcolor: 'background.default',
            borderRight: 'none',
          },
        }}
      >
        <Toolbar />
        <Nav />
      </Drawer>
    </Box>
  );
}

export default MainDrawer;
