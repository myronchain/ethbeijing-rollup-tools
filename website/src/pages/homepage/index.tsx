// ** MUI Imports
import Grid from '@mui/material/Grid'

// ** Demo Components Imports
import {styled} from "@mui/material/styles";
import FeatureSecurityCard from "../../views/cards/FeatureSecurityCard";
import FeatureModularCard from "../../views/cards/FeatureModularCard";
import FeatureOpenCard from "../../views/cards/FeatureOpenCard";
import HeroCenter from './hero';

const ContentWrapper = styled('main')(({theme}) => ({
  flexGrow: 1,
  width: '100%',
  padding: theme.spacing(6),
  transition: 'padding .25s ease-in-out',
  [theme.breakpoints.down('sm')]: {
    paddingLeft: theme.spacing(4),
    paddingRight: theme.spacing(4)
  },
}))

const contentWidth = 'boxed'

const HomeContent = () => {
  return (

    <ContentWrapper
      className='layout-page-content'
      sx={{
        ...(contentWidth === 'boxed' && {
          mx: 'auto',
          '@media (min-width:1440px)': {maxWidth: 1440},
          '@media (min-width:1200px)': {maxWidth: '100%'}
        })
      }}
    >
      <HeroCenter/>

      <Grid container spacing={6} sx={{
        minHeight: "400px",
        mt: 0,
      }}>
        <Grid item xs={12} sm={6} md={4}>
          <FeatureSecurityCard/>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <FeatureModularCard/>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <FeatureOpenCard/>
        </Grid>
      </Grid>
    </ContentWrapper>
  )
}

export default HomeContent
