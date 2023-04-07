import * as React from 'react';
import Box from '@mui/material/Box';
import Stepper from '@mui/material/Stepper';
import Step from '@mui/material/Step';
import StepLabel from '@mui/material/StepLabel';
import Typography from '@mui/material/Typography';

const steps = [
  'Initializing environment',
  'Deploying rollup contract to l1',
  'Building execution docker image',
  'Building sequencer docker image',
  'Waiting for sequencer to be ready',
];

export interface RollupStepperProps {
  rollupId: number
  rollupName: string
  onFinished: () => void
}

export default function RollupStepper(props: RollupStepperProps) {
  const [activeStep, setActiveStep] = React.useState(0);
  const [error, setError] = React.useState('');

  React.useEffect(() => {
    if (activeStep == steps.length - 1) {
      props.onFinished()
    }
  }, [activeStep, props])

  React.useEffect(() => {
    // const docRef = doc(db, "rollup_status", props.rollupId.toString())
    // const unsubscribe = onSnapshot(docRef, (querySnapshot) => {
    //   const rollup = querySnapshot.data()
    //   if (!rollup) return
    //   console.log("rollup changed", rollup)
    //   if (!!rollup['ErrorMsg']) {
    //     setError(rollup['ErrorMsg'])
    //     //   props.onFinished()
    //     unsubscribe()
    //     return
    //   }
    //   const step: number = rollup['Step']
    //   // const status: string = rollup['Status']
    //   // const stepIndex = mapStatusToStepIndex(status)
    //   setActiveStep(step)
    // }, (err) => {
    //   console.error(err)
    // });
    // return () => {
    //   unsubscribe()
    // }
  }, [props])

  return (
    <Box sx={{width: '100%', alignItems: 'center', textAlign: "center"}}>
      <Typography variant='h6' sx={{fontWeight: 600, mb: 4}}>
        Creating rollup {props.rollupName}
      </Typography>
      <Stepper activeStep={activeStep} alternativeLabel sx={{
        mb: 4
      }}>
        {steps.map((label) => {
          return (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          );
        })}
      </Stepper>
      {/*{activeStep === steps.length - 1 && (*/}
      {/*  <React.Fragment>*/}
      {/*    <Typography variant='h6' sx={{fontWeight: 600, marginTop: 10}}>*/}
      {/*      Congratulations!! Your rollup is created successfully*/}
      {/*    </Typography>*/}
      {/*  </React.Fragment>*/}
      {/*)}*/}
      {!!error && (
        <React.Fragment>
          <Typography variant='h6' color='red' sx={{fontWeight: 600, marginTop: 10}}>
            Error: {error}
          </Typography>
        </React.Fragment>
      )}
    </Box>
  );
}
