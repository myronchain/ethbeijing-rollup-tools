import { AppBar, Box, Toolbar, useTheme } from '@mui/material';
import { Outlet } from 'react-router-dom';
import Drawer from './Drawer';
import Header from './Header';
import { styled } from '@mui/material/styles';
import { useAppSelector } from '@core/app/store';
import { DrawerWidth } from '@core/app/constant';
const Main = styled('main', { shouldForwardProp: (prop) => prop != 'open' })<{ open: boolean }>(({ theme, open }) => ({
  backgroundColor: '#eef2f6',
  width: '100%',
  minHeight: 'calc(100vh - 88px)',
  flexGrow: 1,
  padding: '20px',
  marginTop: '88px',
  marginRight: '20px',
  borderRadius: `12px`,
  transition: theme.transitions.create('margin', {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  ...(!open && {
    marginLeft: -(DrawerWidth - 20),
    width: `calc(100% - ${DrawerWidth}px)`,
  }),
}));

function MainLayout() {
  const theme = useTheme();
  const leftDrawerOpend = useAppSelector((state) => state.customization.opened);

  return (
    <Box sx={{ display: 'flex', width: '100%' }}>
      <AppBar
        position="fixed"
        elevation={0}
        sx={{ bgcolor: theme.palette.background.default, zIndex: theme.zIndex.drawer + 1 }}
      >
        <Toolbar>
          <Header />
        </Toolbar>
      </AppBar>

      <Drawer />

      <Main open={leftDrawerOpend}>
        <Outlet />
      </Main>
      {/* <Box component="main" sx={{ width: '100%', flexGrow: 1, p: { xs: 2, sm: 3 } }}></Box> */}
    </Box>
  );
}

export default MainLayout;
