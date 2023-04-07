import {Outlet} from "react-router-dom";
import {styled} from "@mui/material/styles";
import Box, {BoxProps} from "@mui/material/Box";

const MinimalLayoutWrapper = styled(Box)<BoxProps>(({theme}) => ({
  height: '100vh',

  // For V1 Blank layout pages
  '& .content-center': {
    display: 'flex',
    minHeight: '100vh',
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing(5)
  },

  // For V2 Blank layout pages
  '& .content-right': {
    display: 'flex',
    minHeight: '100vh',
    overflowX: 'hidden',
    position: 'relative'
  }
}))


// ==============================|| MINIMAL LAYOUT ||============================== //

const MinimalLayout = () => (
  <MinimalLayoutWrapper className='layout-wrapper'>
    <Box className='app-content' sx={{minHeight: '100vh', overflowX: 'hidden', position: 'relative'}}>
      <Outlet/>
    </Box>
  </MinimalLayoutWrapper>
);

export default MinimalLayout;
