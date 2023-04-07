import { List } from '@mui/material';
import menuItems from './menuItems';
import NavItem from './NavItem';

function Nav() {
  return (
    <List>
      {menuItems.map((menu) => (
        <NavItem key={menu.to} {...menu} />
      ))}
    </List>
  );
}

export default Nav;
