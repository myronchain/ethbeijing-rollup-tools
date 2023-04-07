// ** MUI Imports
import {styled} from '@mui/material/styles'
import Box, {BoxProps} from '@mui/material/Box'

// ** Types
import HomePageAppBar from "./components/vertical/appBar/AppbarWithTab";
import Footer from "./components/shared-components/footer";

// Styled component for Blank Layout component
const HomePageLayoutWrapper = styled(Box)<BoxProps>(({theme}) => ({
  // height: '100vh',

  // For V1 Blank layout pages
  '& .content-center': {
    display: 'flex',
    // minHeight: '100vh',
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing(5)
  },

  // For V2 Blank layout pages
  '& .content-right': {
    display: 'flex',
    // minHeight: '100vh',
    overflowX: 'hidden',
    position: 'relative'
  },

  // background: "radial-gradient(circle at 25px 25px, #d9b99b 4%, #fff0db 0%), radial-gradient(circle at 75px 75px, lightgray 2%, white 0%)",
  // backgroundSize: "30px 30px",
}))

const HomePageLayout = ({children}) => {
  return (
    <HomePageLayoutWrapper className='layout-wrapper'>
      <HomePageAppBar/>
      {/*<Box className='app-content' sx={{minHeight: '100vh', overflowX: 'hidden', position: 'static'}}>*/}
        {/*{props.children}*/}
        {children}
        {/*<Outlet/>*/}
      {/*</Box>*/}

      <Footer settings={{contentWidth: "boxed", mode: "light", themeColor: "primary"}}
              saveSettings={() => {
                const i = 1
              }}></Footer>
    </HomePageLayoutWrapper>
  )
}

export default HomePageLayout
