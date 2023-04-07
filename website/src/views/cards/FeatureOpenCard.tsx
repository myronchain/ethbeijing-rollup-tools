// ** MUI Imports
import Card from '@mui/material/Card'
import CardMedia from '@mui/material/CardMedia'
import Typography from '@mui/material/Typography'
import CardContent from '@mui/material/CardContent'
import Lottie from "lottie-react";
import open from "@/utils/open.json";

const FeatureOpenCard = () => {
  return (
    <Card>
      {/*<CardMedia sx={{height: '14.5625rem'}} image='/images/cards/open.png'/>*/}
      {/*<Box>*/}
      {/*  <Lottie animationData={open}/>*/}
      {/*</Box>*/}

      <CardContent>
        <Typography variant='h6' sx={{marginBottom: 2}}>
          Open
        </Typography>
        <Typography variant='body2'>
          Rollup on G1G2 is not our technology, it's yours. We carefully design each component to make sure that they
          can be run in a fully decentralized way, which means you could run the whole chain hosted by our cloud, or you
          could run on your own machine, or you could even mix them up. We are committed to open all the source code for
          transparency and future auditing.
        </Typography>
      </CardContent>
    </Card>
  )
}

export default FeatureOpenCard
