import React from 'react';
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
// import Delete from "mdi-material-ui/Delete";
import DialogTitle from "@mui/material/DialogTitle";
import DialogActions from "@mui/material/DialogActions";
import Dialog from "@mui/material/Dialog";
import {Box, DialogContent, Stack} from '@mui/material';
import {handleCopy} from "@core/utils";


function GenKeyDialog({showDialog, setShowDialog, pk}) {

  return (
    <>
      <Dialog
        open={!!showDialog}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">
          Private key
        </DialogTitle>
        <DialogContent>
          <Stack>
            <Box sx={{mr: 10, mb: 5, overflowWrap: "break-word"}}>
              {pk}
            </Box>

            <Button
              sx={{mb: 5}}
              variant={"contained"} size={"small"} onClick={() => {
              handleCopy(pk)
            }}>
              Copy the private key to clipboard
            </Button>

            <Box>

              <Typography
                component="ul" color={'error'} variant='body2' sx={{fontWeight: 600}}>
                <li>
                  IMPORTANT!!!:
                  Please save it in a safe place.
                </li>
                <li>
                  You can use it to withdraw your funds from L2.
                  You can also use it to transfer your funds to other L2 addresses.
                </li>
                <li>
                  You will not be able to recover it if you lose it.
                  We never store your private key.
                </li>
              </Typography>
            </Box>

          </Stack>

        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setShowDialog(false)
          }}>Close</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

export default GenKeyDialog;
