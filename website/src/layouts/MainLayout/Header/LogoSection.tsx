import { Link } from 'react-router-dom';

// material-ui
import { ButtonBase } from '@mui/material';
// import logo from '@core/assets/images/g1g2.svg';

const LogoSection = () => (
  <ButtonBase disableRipple component={Link} to="/dashboard">
    {/*<img src={logo} className="logo react" alt="React logo" height={32} />*/}
  </ButtonBase>
);

export default LogoSection;
