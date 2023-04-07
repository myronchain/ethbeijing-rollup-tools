// ** React Imports
// ** MUI Imports

import {Slider} from '@mui/material';
import React from "react";
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";

const InstanceConfig = () => {
  const proposeNum = 1
  const syncNum = 1
  const proverNum = 1
  const setIntanceNum = () => {
    // todo (eric)
  }
  const handleSequencerChange = (event, newValue) => {
    setIntanceNum()
  };

  const handleExecutionNodeChange = (event, newValue) => {
    setIntanceNum()
  };

  const handleProverNodeChange = (event, newValue) => {
    setIntanceNum()
  };


  return (
    <>
      <Grid item xs={12}>
        <Typography variant='h6' sx={{fontWeight: 600}}>
          Config your Rollup Instance
        </Typography>
        <Typography component={'li'} variant='body2'>
          Currently, we only support one sequencer and one execution node, and one dummy prover node for FREE.
        </Typography>
        <Typography component={'li'} variant='body2'>
          Once we support sepolia network, you can deploy more than one sequencer and execution node from the dashboard.
        </Typography>
        <Typography component={'li'} variant='body2'>
          but you can run your own sequencer and execution node by following the instructions in the <a
          href={""}>documentation</a>
        </Typography>
      </Grid>

      <Grid item xs={6}>
        Number of transaction sequencers: <Typography component="span" color={"primary"}
                                                      variant={"h6"}>{proposeNum}</Typography>
      </Grid>

      <Grid item xs={6}>
        <Slider
          min={1}
          max={1}
          value={proposeNum}
          onChange={handleSequencerChange}
          aria-labelledby="continuous-slider"
        />
      </Grid>

      <Grid item xs={6}>
        Number of execution nodes:
        <Typography component="span" color={"primary"} variant={"h6"}>{syncNum}
        </Typography>
      </Grid>

      <Grid item xs={6}>
        <Slider
          min={1}
          max={1}
          value={syncNum}
          onChange={handleExecutionNodeChange}
          aria-labelledby="continuous-slider"
        />
      </Grid>

      <Grid item xs={6}>
        Number of prover nodes:
        <Typography component="span" color={"primary"} variant={"h6"}>{proverNum}
        </Typography>
      </Grid>

      <Grid item xs={6}>
        <Slider
          min={1}
          max={1}
          value={proverNum}
          onChange={handleProverNodeChange}
          aria-labelledby="continuous-slider"
        />
      </Grid>


    </>
  )
}

export default InstanceConfig
