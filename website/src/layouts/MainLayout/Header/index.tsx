import { Avatar, Box, Button, ButtonBase, useTheme } from '@mui/material';
import React from 'react';
import LogoSection from './LogoSection';
import ProfileSection from './ProfileSection';
import MenuIcon from '@mui/icons-material/Menu';
import { useAppDispatch } from '@core/app/store';
import { toggleDrawer } from '@core/features/customization/customizationSlice';

function Header() {
  const theme = useTheme();
  const dispatch = useAppDispatch();

  function handleLeftDrawerToggle() {
    dispatch(toggleDrawer());
  }

  return (
    <>
      <Box sx={{ width: 228, display: 'flex' }}>
        <Box component="span" sx={{ display: { xs: 'none', md: 'block' }, flexGrow: 1 }}>
          <LogoSection />
        </Box>

        <ButtonBase sx={{ borderRadius: '12px', overflow: 'hidden' }}>
          <Avatar
            variant="rounded"
            sx={{
              cursor: 'pointer',
              borderRadius: '8px',
              width: '34px',
              height: '34px',
              fontSize: '1.2rem',
              background: theme.palette.secondary.light,
              color: theme.palette.secondary.dark,
              transition: 'all .2s ease-in-out',
              '&:hover': {
                background: theme.palette.secondary.dark,
                color: theme.palette.secondary.light,
              },
            }}
            onClick={handleLeftDrawerToggle}
          >
            <MenuIcon />
          </Avatar>
        </ButtonBase>
      </Box>

      <Box sx={{ flexGrow: 1 }} />
      <ProfileSection />
    </>
  );
}

export default Header;
