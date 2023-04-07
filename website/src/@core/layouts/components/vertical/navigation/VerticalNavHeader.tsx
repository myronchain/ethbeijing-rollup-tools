// ** React Import
import * as React from 'react'
import {ReactNode} from 'react'
// ** Next Import
import Link from 'next/link'

// ** MUI Imports
import Box, {BoxProps} from '@mui/material/Box'
import {styled, useTheme} from '@mui/material/styles'
import Typography, {TypographyProps} from '@mui/material/Typography'

// ** Type Import
import {Settings} from 'src/@core/context/settingsContext'

// ** Configs
import themeConfig from 'src/configs/themeConfig'

interface Props {
  hidden: boolean
  settings: Settings
  toggleNavVisibility: () => void
  saveSettings: (values: Settings) => void
  verticalNavMenuBranding?: (props?: any) => ReactNode
}

// ** Styled Components
const MenuHeaderWrapper = styled(Box)<BoxProps>(({theme}) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  paddingRight: theme.spacing(4.5),
  transition: 'padding .25s ease-in-out',
  minHeight: theme.mixins.toolbar.minHeight
}))

const HeaderTitle = styled(Typography)<TypographyProps>(({theme}) => ({
  fontWeight: 600,
  lineHeight: 'normal',
  textTransform: 'uppercase',
  color: theme.palette.text.primary,
  transition: 'opacity .25s ease-in-out, margin .25s ease-in-out'
}))

const StyledLink = styled('a')({
  display: 'flex',
  alignItems: 'center',
  textDecoration: 'none'
})

const VerticalNavHeader = (props: Props) => {
  // ** Props
  const {verticalNavMenuBranding: userVerticalNavMenuBranding} = props

  // ** Hooks
  const theme = useTheme()

  return (
    <MenuHeaderWrapper className='nav-header' sx={{pl: 6}}>
      {userVerticalNavMenuBranding ? (
        userVerticalNavMenuBranding(props)
      ) : (
        <Link href='/' passHref>
          <StyledLink>
            <img
              src="/g1g2.svg"
              alt="G1G2 Logo"
              width="72px"
              height="72px"
            >
            </img>
            <HeaderTitle variant='h4'
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
              {themeConfig.templateName}
            </HeaderTitle>
          </StyledLink>
        </Link>
      )}
    </MenuHeaderWrapper>
  )
}

export default VerticalNavHeader
