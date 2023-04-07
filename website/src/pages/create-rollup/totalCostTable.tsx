// ** React Imports
import React, {useEffect, useRef, useState} from 'react'

// ** MUI Imports
import Typography from "@mui/material/Typography";
import Grid from "@mui/material/Grid";

const TotalCostTable = () => {
  return (
    <>
      <Grid item xs={12}>
        <Typography variant='h6' sx={{fontWeight: 600}}>
          Your total cost breakdown: 0.1 ETH
        </Typography>
      </Grid>
    </>
  )
}

export default TotalCostTable
