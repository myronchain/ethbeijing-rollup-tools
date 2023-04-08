import * as React from 'react';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import Menu from '@mui/material/Menu';
import Container from '@mui/material/Container';
import Button from '@mui/material/Button';
import {Link} from "@mui/material";
import {useTheme} from "@mui/material/styles";
import {discordUrl} from "@/bridge/utils";

const pages = [
  {
    key: 'github',
    labelText: 'Github',
    url: 'https://github.com/g1g2-lab/ethbeijing'
  },
  {
    key: 'discord',
    labelText: 'Discord',
    url: discordUrl,
  },
  {
    key: 'start',
    labelText: 'start buidl',
    url: '/rollup'
  }
];

function HomePageAppBar() {
  const [anchorElNav, setAnchorElNav] = React.useState<null | HTMLElement>(null);
  const handleOpenNavMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorElNav(event.currentTarget);
  };

  const handleCloseNavMenu = () => {
    setAnchorElNav(null);
  };

  return (
    <AppBar position="static" color='transparent' elevation={0}>
      <Container maxWidth="xl">
        <Toolbar disableGutters>
          <Box sx={{width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
            <Box>
              <Box sx={{flexGrow: 1, display: {xs: 'flex', md: 'flex'}, alignItems: 'center'}}>

                <img
                  src="/g1g2.svg"
                  alt="G1G2 Logo"
                  width="72px"
                  height="72px"
                >
                </img>

                <Typography
                  variant="h4"
                  noWrap
                  component="a"
                  href="/"
                  sx={{
                    mr: 2,
                    mt: 2,
                    display: {xs: 'none', md: 'flex'},
                    fontFamily: 'oxanium',
                    fontWeight: 900,
                    letterSpacing: '.3rem',
                    color: 'primary',
                    textDecoration: 'none',
                  }}
                >
                  G1G2
                </Typography>
              </Box>

              <Box sx={{flexGrow: 1, display: {xs: 'flex', md: 'none'}}}>
                <IconButton
                  size="large"
                  aria-label="account of current user"
                  aria-controls="menu-appbar"
                  aria-haspopup="true"
                  onClick={handleOpenNavMenu}
                  color="inherit"
                >
                  {/*<MenuIcon />*/}
                </IconButton>
                <Menu
                  id="menu-appbar"
                  anchorEl={anchorElNav}
                  anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'left',
                  }}
                  keepMounted
                  transformOrigin={{
                    vertical: 'top',
                    horizontal: 'left',
                  }}
                  open={Boolean(anchorElNav)}
                  onClose={handleCloseNavMenu}
                  sx={{
                    display: {xs: 'block', md: 'none'},
                  }}
                >
                </Menu>
              </Box>
            </Box>
            <Box sx={{flexGrow: 0, display: {xs: 'none', md: 'flex'}}}>
              {pages.map((headerButton) => (
                <Link
                  key={headerButton.key}
                  target='_blank'
                  href={headerButton.url}
                  style={{textDecoration: 'none'}}>
                  <Button
                    key={headerButton.key}
                    variant='contained'
                    size={'small'}
                    sx={{
                      m: 1,
                      display: 'block',
                      fontWeight: 800,
                    }}
                  >
                    {headerButton.labelText}
                  </Button>
                </Link>
              ))}
            </Box>
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
}

export default HomePageAppBar;
