import React, {useEffect, useState} from 'react';
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
// import Delete from "mdi-material-ui/Delete";
import Delete from "mdi-material-ui/TrashCanOutline";
import IconButton from "@mui/material/IconButton";
import GenKeyDialog from "@/pages/create-rollup/genkeydialog";
import {genNewPk} from "@core/utils";
import {ethers} from "ethers";

function FundWallets({draft, setDraft}) {
  const [showDialog, setShowDialog] = useState(false);
  const [errors, setErrors] = useState([]);
  const [disableAccountCreation, setDisableAccountCreation] = useState(false);
  const [pk, setPk] = useState("");
  const inputs = draft.l2_wallets || []
  const setInputs = (newInputs) => {
    setDraft({...draft, l2_wallets: newInputs});
  }

  useEffect(() => {
    const inputs = draft.l2_wallets || []
    if (inputs.length >= 1) {
      setDisableAccountCreation(true)
    } else {
      setDisableAccountCreation(false)
    }
  }, [draft])

  const onGenNewL2Address = (index) => {
    const {privateKey, address} = genNewPk();
    const newInputs = [...inputs];
    newInputs[index] = {
      address: address,
      amount: "5000000000000000000"
    }
    setInputs(newInputs)
    setPk(privateKey)
    setShowDialog(true)
  }


  return (
    <>
      <Grid item xs={12}>
        <Typography variant='h6' sx={{fontWeight: 600}}>
          Config your L2 wallets
        </Typography>

        <Typography component={'li'} variant={'body2'} sx={
          {
            color: 'text.secondary',
          }
        }>
          In order to bootstrap the L2 network, you need to fund some L2 wallets with some ETH.
        </Typography>

        <Typography component={'li'} variant={'body2'} sx={
          {
            color: 'text.secondary',
          }
        }>
          The following wallets will be funded with specified amount of ETH during the initialization of the L2 network.
        </Typography>
      </Grid>

      {inputs.map((input, index) => (
        <Grid item xs={12} key={index}>
          <Grid container spacing={5}>
            <Grid item xs={9}>
              <TextField autoComplete='off' fullWidth label='l2 address' placeholder=''
                         value={input.address || ''}
                         onChange={(event) => {
                           const addr = event.target.value as string
                           const valid = ethers.utils.isAddress(addr)
                           const newInputs = [...inputs];
                           newInputs[index] = {...newInputs[index], address: event.target.value};
                           setInputs(newInputs);

                           // reset error
                           if (valid) {
                             const newErrors = [...errors];
                             newErrors[index * 2] = "";
                             setErrors(newErrors);
                           } else {
                             const newErrors = [...errors];
                             newErrors[index * 2] = "Invalid address";
                             setErrors(newErrors);
                           }
                         }}
              />

              {
                errors[index * 2] && (
                  <Typography variant={'body2'} sx={
                    {
                      color: 'error.main',
                    }
                  }>
                    {errors[index * 2]}
                  </Typography>
                )
              }
            </Grid>

            <Grid item xs={3}>
              <Button size={'small'} color={'primary'}
                      onClick={() => {
                        onGenNewL2Address(index)
                      }}>
                Generate One For Me
              </Button>
            </Grid>

            <Grid item xs={9}>
              <TextField autoComplete='off' disabled fullWidth label='amount in Wei'
                         value={input.amount || ""}
              />
            </Grid>

            <Grid item xs={3}>
              <IconButton size='small' aria-label='settings' className='card-more-options'
                          onClick={() => {
                            const newInputs = [...inputs];
                            newInputs.splice(index, 1);
                            setInputs(newInputs);
                          }}
                          sx={{color: 'text.secondary'}}>
                <Delete/>
              </IconButton>
            </Grid>
          </Grid>
        </Grid>
      ))}
      <Grid item xs={3}>
        <Button size={'small'} variant='contained' disabled={disableAccountCreation} onClick={() => setInputs([...inputs, {
          address: "",
          amount: "5000000000000000000"
        }])}>Add An L2 Address</Button>
      </Grid>

      <GenKeyDialog pk={pk} showDialog={showDialog} setShowDialog={setShowDialog}/>

    </>
  );
}

export default FundWallets;
