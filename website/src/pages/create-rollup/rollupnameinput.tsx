// ** React Imports
import {useCallback, useEffect, useRef, useState} from 'react'

// ** MUI Imports
import TextField from '@mui/material/TextField'
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import {Button, Stack} from '@mui/material';
import Chip from "@mui/material/Chip";

import Copy from "mdi-material-ui/ContentCopy"
import {handleCopy} from "@core/utils";

export interface RollupNameInputProps {
  draftName: string
  onChange: (newValue: string) => void
}

interface PageState {
  showSpin?: boolean
  color?: string
  msg?: string
  valid?: boolean
}

const RollupNameInput = ({draftName, onChange}: RollupNameInputProps) => {
  const [rollupName, setRollupName] = useState(draftName);

  useEffect(() => {
    setRollupName(draftName)
  }, [draftName])

  const handleRollupNameChange = (event) => {
    onChange(event.target.value)
  };

  return (
    <>
        <Stack>
          <Box sx={{mb: 3, display: 'flex', alignItems: 'center'}}>
            <Typography color={'green'} sx={{mr: 2}}>Layer 2 rpc endpoint will be </Typography>

            <Chip
              autoCapitalize="off"
              color={"info"}
              label={`https://${rollupName}.eth.beijing`}
              sx={{
                height: 24,
                fontSize: '0.75rem',
                '& .MuiChip-label': {fontWeight: 500}
              }}
            />

            <Button size={"small"} onClick={() => {
              handleCopy("https://" + rollupName + ".eth.beijing")
            }}>
              <Copy/>
            </Button>

          </Box>
          <Box sx={{mb: 3, display: 'flex', alignItems: 'center'}}>
            <Typography color={"green"} sx={{mr: 2}}>Layer 2 websocket endpoint will
              be </Typography>

            <Chip
              autoCapitalize="off"
              color={"info"}
              label={`wss://${rollupName}.eth.beijing`}
              sx={{
                height: 24,
                fontSize: '0.75rem',
                '& .MuiChip-label': {fontWeight: 500}
              }}
            />

            <Button size={"small"} onClick={() => {
              handleCopy("wss://" + rollupName + ".eth.beijing")
            }}>
              <Copy/>
            </Button>
          </Box>
        </Stack>
      <TextField autoComplete={'off'} fullWidth label='Rollup Name'
                 placeholder='Name Of Your Rollup, this affects how you can acess your rollup' value={rollupName}
                 onChange={handleRollupNameChange}
                 sx={{mt: 0}}
      />
    </>
  )
}

export default RollupNameInput
