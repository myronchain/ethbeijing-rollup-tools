// ** MUI Imports
import Card from '@mui/material/Card'
import CardMedia from '@mui/material/CardMedia'
import Typography from '@mui/material/Typography'
import CardContent from '@mui/material/CardContent'
import Lottie from "lottie-react";

const FeatureModularCard = () => {
  return (

    <Card>
      {/*<CardMedia sx={{ height: '14.5625rem' }} image='/images/cards/modular.png' />*/}
      {/*<Box>*/}
      {/*  <Lottie animationData={modular}/>*/}
      {/*</Box>*/}

      <CardContent>
        <Typography variant='h6' sx={{ marginBottom: 2 }}>
          Customizable
        </Typography>
        <Typography variant='body2'>
          We separate our system into several core components: rollup protocol, execution node, builder/proposer, prover, proof generator. Each component can be customized depending on use cases. Goodbye 👋 monolithic blockchain, and welcome 👏 to the world of App specific chain.
        </Typography>
      </CardContent>
    </Card>
  )
}

export default FeatureModularCard
