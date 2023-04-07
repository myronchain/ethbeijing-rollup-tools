// ** MUI Imports
import Box from '@mui/material/Box'
import Link from '@mui/material/Link'
import {Theme} from '@mui/material/styles'
import Typography from '@mui/material/Typography'
import useMediaQuery from '@mui/material/useMediaQuery'

const FooterContent = () => {
  // ** Var
  const hidden = useMediaQuery((theme: Theme) => theme.breakpoints.down('md'))

  return (
    <Box sx={{display: 'flex', flexWrap: 'wrap', alignItems: 'center'}}>
      <Typography sx={{mr: 2}}>
        {`© ${new Date().getFullYear()}, Made with `}
        <Box component='span' sx={{color: 'error.main'}}>
          ❤️
        </Box>
        {` by `}
        <Link target='_blank' href='https://g1g2.xyz/'>
          G1G2
        </Link>
      </Typography>

      <Typography>
        {`contact:`}
        <Link
          target='_blank'
          href='mailto:g1g2@g1g2.xyz'
        >
          g1g2@g1g2.xyz
        </Link>
      </Typography>
      {hidden ? null : (
        <Box sx={{display: 'flex', flexWrap: 'wrap', alignItems: 'center', '& :not(:last-child)': {mr: 4}}}>
          {/*<Link*/}
          {/*  target='_blank'*/}
          {/*  href='https://github.com/themeselection/materio-mui-react-nextjs-admin-template-free/blob/main/LICENSE'*/}
          {/*>*/}
          {/*  MIT License*/}
          {/*</Link>*/}
          {/*<Link target='_blank' href='https://themeselection.com/'>*/}
          {/*  More Themes*/}
          {/*</Link>*/}
          {/*<Link*/}
          {/*  target='_blank'*/}
          {/*  href='https://github.com/themeselection/materio-mui-react-nextjs-admin-template-free/blob/main/README.md'*/}
          {/*>*/}
          {/*  Documentation*/}
          {/*</Link>*/}
          {/*<Link*/}
          {/*  target='_blank'*/}
          {/*  href='mailto:g1g2@g1g2.xyz'*/}
          {/*>*/}
          {/*  g1g2@g1g2.xyz*/}
          {/*</Link>*/}
        </Box>
      )}
    </Box>
  )
}

export default FooterContent
