// ** MUI Imports
import Card from '@mui/material/Card'
import CardMedia from '@mui/material/CardMedia'
import Typography from '@mui/material/Typography'
import CardContent from '@mui/material/CardContent'
import Lottie from "lottie-react";
import secure from "@/utils/secure.json";

const FeatureSecurityCard = () => {
  return (
    <Card>
      {/*<CardMedia sx={{ height: '14.5625rem' }} image='/images/cards/secure.png' />*/}
      {/*<Box>*/}
      {/*  <Lottie animationData={secure}/>*/}
      {/*</Box>*/}

      <CardContent>
        <Typography variant='h6' sx={{ marginBottom: 2 }}>
          Secure
        </Typography>
        <Typography variant='body2'>
          We adopt a simple and small core protocol for rollup, which is pretty easy to reason about. We use go-ethereum as our execution layer, which maintains the same security implication as ethereum. Thanks to the awesome ZKP, our L1 finality is purely based on math, not relying on any game theory.
        </Typography>
      </CardContent>
    </Card>
  )
}

export default FeatureSecurityCard
