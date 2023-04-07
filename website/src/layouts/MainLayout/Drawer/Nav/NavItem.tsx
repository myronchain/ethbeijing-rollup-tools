import { ListItemButton, ListItemIcon, ListItemText, SvgIcon } from '@mui/material';
import React, { forwardRef } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { SvgIconComponent } from '@mui/icons-material';
interface NavItemProps {
  title: string;
  to: string;
  icon: SvgIconComponent;
}
function NavItem({ title, to, icon }: NavItemProps) {
  const { pathname } = useLocation();
  const Icon = icon;

  const listItemProps = {
    component: forwardRef<HTMLAnchorElement>((props, ref) => <NavLink ref={ref} {...props} to={to} />),
  };

  return (
    <ListItemButton
      {...listItemProps}
      selected={to === pathname}
      sx={{
        borderRadius: `12px`,
        mb: 0.5,
        py: 1.25,
      }}
    >
      <ListItemIcon>
        <Icon />
      </ListItemIcon>
      <ListItemText primary={title} color="inherit" />
    </ListItemButton>
  );
}

export default NavItem;
