// ** React Imports
import React, { ReactNode, useCallback, useEffect, useState } from 'react'

// ** MUI Imports
import Card from '@mui/material/Card'
import Grid from '@mui/material/Grid'
import ClearIcon from '@mui/icons-material/Clear'
import Button from '@mui/material/Button'
import LoadingButton from '@mui/lab/LoadingButton'
import Divider from '@mui/material/Divider'
import CardHeader from '@mui/material/CardHeader'
import Typography from '@mui/material/Typography'
import CardContent from '@mui/material/CardContent'
import CardActions from '@mui/material/CardActions'
import Select, { SelectChangeEvent } from '@mui/material/Select'
import RollupNameInput from '@/pages/create-rollup/rollupnameinput'
import InputLabel from '@mui/material/InputLabel'
import MenuItem from '@mui/material/MenuItem'
import FormControl from '@mui/material/FormControl'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogTitle from '@mui/material/DialogTitle'
import { CreateRollup } from '@/http/rollup'
import FundWallets from '@/pages/create-rollup/fundwallets'
import TotalCostTable from '@/pages/create-rollup/totalCostTable'
import InstanceConfig from '@/pages/create-rollup/instanceconfig'
import TextField from '@mui/material/TextField'
import { Box, CircularProgress, DialogContent, IconButton, InputAdornment, Link } from '@mui/material'
import { ethers } from 'ethers'
import { useRouter } from 'next/router'
import { genNewPk } from '@core/utils'
import GenKeyDialog from '@/pages/create-rollup/genkeydialog'
import Rollup, { defaultRollupReq, RollupRequest } from '@/interfaces/rollup'

const ByorForm = () => {
  // ** States
  const route = useRouter()
  const [finalConfirm, setFinalConfirm] = useState(false)
  const [beneError, setBeneError] = useState(false)
  const [loading, setLoading] = useState(false)
  const [rollupReq, setRollupReq] = useState<RollupRequest>(defaultRollupReq)
  const [showPkDialog, setShowPkDialog] = useState(false)
  const [rewardPk, setRewardPk] = useState('')

  const handleRewardAddrChange = event => {
    // check if beneficiary is valid
    const beneficiary = event.target.value as string
    console.log('beneficiary', beneficiary)
    const valid = ethers.utils.isAddress(beneficiary)
    setBeneError(!valid)
    setRollupReq(pre => ({ ...pre, beneficial: event.target.value as string }))
  }

  const onGenNewRewardAddress = () => {
    const { privateKey, address } = genNewPk()
    setRewardPk(privateKey)
    setRollupReq(pre => ({ ...pre, beneficial: address }))
    setShowPkDialog(true)
  }

  const handleRewardAddressClear = event => {
    setRollupReq(pre => ({ ...pre, beneficial: '' }))
  }

  const createRollup = useCallback(async () => {
    try {
      const response = await CreateRollup(rollupReq)
      if (!response.ok) {
        setFinalConfirm(true)
        setLoading(true)
      } else {
        setLoading(false)
        await route.push('/rollup')
      }
    } catch (error) {
      console.error(error)
      setFinalConfirm(true)
      setLoading(true)
    }
  }, [rollupReq, route])

  const onSubmit = useCallback(() => {
    setFinalConfirm(true)
  }, [])

  const onRollupNameChange = useCallback((name: string) => {
    setRollupReq(pre => ({ ...pre, name }))
  }, [])

  const handleConfirmDialog = () => {
    setFinalConfirm(false)
    setLoading(true)
    createRollup()
  }

  const handleCancelDialog = () => {
    setFinalConfirm(false)
  }

  return (
    <>
      <Card>
        <CardHeader title='Build Your Own Rollup' titleTypographyProps={{ variant: 'h6' }} />
        <Divider sx={{ margin: 0 }} />
        <form onSubmit={e => e.preventDefault()}>
          <CardContent>
            <Grid container spacing={5}>
              {/*basic*/}
              <Grid item xs={12}>
                <Typography variant='h6' sx={{ fontWeight: 600 }}>
                  Basic Info
                </Typography>
                <Typography component={'li'} variant='body2' sx={{ color: 'text.secondary' }}>
                  name must start with a letter, and only contain letters, numbers, and url safe characters, at least 6
                  characters.
                </Typography>
                <Typography component={'li'} variant='body2' sx={{ color: 'text.secondary' }}>
                  name will be part of the url that you can access your rollup. A good name will help you to find your
                  rollup easily.
                </Typography>
              </Grid>

              <Grid item xs={12} sm={12}>
                <RollupNameInput draftName={rollupReq.name} onChange={onRollupNameChange} />
              </Grid>

              <Grid item xs={12}>
                <Divider sx={{ marginBottom: 0 }} />
              </Grid>

              <Grid item xs={12}>
                <Typography variant='h6' sx={{ fontWeight: 600 }}>
                  Tokenomics
                </Typography>
                <Typography
                  component={'li'}
                  variant={'body2'}
                  sx={{
                    color: 'text.secondary'
                  }}
                >
                  see{' '}
                  <Link href='' target='_blank'>
                    here
                  </Link>{' '}
                  for more details about our tokenomics design.
                </Typography>

                <Typography
                  component={'li'}
                  variant={'body2'}
                  sx={{
                    color: 'text.secondary'
                  }}
                >
                  reward address is the address that will receive the fees. Create a new address if you don't have one.
                </Typography>

                <Typography
                  component={'li'}
                  variant={'body2'}
                  sx={{
                    color: 'text.secondary'
                  }}
                >
                  It's an address on L2.
                </Typography>

                <Typography
                  color={'error'}
                  component={'li'}
                  variant={'body2'}
                  sx={{
                    // color: 'error',
                    fontWeight: 600
                  }}
                >
                  IMPORTANT: reward address is the only way to withdraw your reward, please make sure you have the
                  private key of the address.
                </Typography>
              </Grid>

              <Grid item xs={9}>
                <TextField
                  autoComplete={'off'}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position='end'>
                        <IconButton onClick={handleRewardAddressClear} edge='end'>
                          <ClearIcon />
                        </IconButton>
                      </InputAdornment>
                    )
                  }}
                  fullWidth
                  label='rollup reward address'
                  placeholder=''
                  onChange={handleRewardAddrChange}
                  value={rollupReq.beneficial}
                  sx={{ mt: 0 }}
                />
                {
                  beneError && (
                    // <Grid item xs={12}>
                    <Typography color='error' component='div' sx={{}}>
                      invalid reward address
                    </Typography>
                  )
                  // </Grid>
                }
              </Grid>

              <Grid item xs={3}>
                <Button
                  size={'small'}
                  color={'primary'}
                  onClick={() => {
                    onGenNewRewardAddress()
                  }}
                >
                  Generate One For Me
                </Button>
              </Grid>

              <Grid item xs={12}>
                <Divider sx={{ marginBottom: 0 }} />
              </Grid>

              <FundWallets draft={rollupReq} setDraft={setRollupReq} />

              <Grid item xs={12}>
                <Divider sx={{ marginBottom: 0 }} />
              </Grid>

              <InstanceConfig/>

              <Grid item xs={12}>
                <Divider sx={{ marginBottom: 0 }} />
              </Grid>
              <TotalCostTable />
            </Grid>
          </CardContent>
          <Divider sx={{ margin: 0 }} />
          <Grid container alignItems='center' justifyContent='center'>
            <CardActions>
              <LoadingButton
                color='primary'
                size='large'
                type='submit'
                sx={{ mr: 2 }}
                variant='contained'
                onClick={onSubmit}
                loading={loading}
              >
                Launch Rollup
              </LoadingButton>
            </CardActions>
          </Grid>
        </form>
      </Card>

      <GenKeyDialog pk={rewardPk} showDialog={showPkDialog} setShowDialog={setShowPkDialog} />

      <Dialog open={!!finalConfirm} aria-labelledby='alert-dialog-title' aria-describedby='alert-dialog-description'>
        <DialogTitle id='alert-dialog-title'>Final Confirm</DialogTitle>
        <DialogContent>
          <Typography
            component={'li'}
            variant={'body2'}
            sx={{
              color: 'text.secondary'
            }}
          >
            Name :{rollupReq.name}
          </Typography>

          <Typography
            component={'li'}
            variant={'body2'}
            sx={{
              color: 'text.secondary'
            }}
          >
            ChainId :{rollupReq.chain_id}
          </Typography>

          {!!rollupReq.l2_wallets &&
            rollupReq.l2_wallets.map((w, i) => {
              return (
                <Typography
                  key={i}
                  component={'li'}
                  variant={'body2'}
                  sx={{
                    color: 'text.secondary'
                  }}
                >
                  Deposit {w.amount} Gwei to {w.address}
                </Typography>
              )
            })}

          <Typography
            component={'li'}
            variant={'body2'}
            sx={{
              color: 'text.secondary'
            }}
          >
            Reward Address :{rollupReq.beneficial}
          </Typography>
          <Typography
            component={'li'}
            variant={'body2'}
            sx={{
              color: 'text.secondary'
            }}
          >
            Bridge is enabled, you can transfer your assets between L1 and L2.
          </Typography>

          <Typography
            color={'error'}
            component={'li'}
            variant={'body2'}
            sx={
              {
                // color: 'text.secondary',
              }
            }
          >
            IMPORTANT: Once you launch the rollup, you can't change the name and chainId.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelDialog}>Go back, and edit</Button>
          <Button variant={'contained'} onClick={handleConfirmDialog}>
            LGTM, Launch it
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}

export default ByorForm
