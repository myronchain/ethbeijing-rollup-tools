import {Button, Dialog, DialogContent, DialogTitle, Grid, Typography} from '@mui/material'
import React, {ReactNode, useCallback, useState} from 'react'
import RollupLayout from '@/layouts/RollupLayout'
import Link from 'next/link'
import RollupExploreTable from '@/pages/rollup-explore/ExploreTable'
import ExecutionNodeTable from '@/pages/rollup-explore/ExecutionNodeTable'
import {useRouter} from 'next/router'
import ArrowLeft from 'mdi-material-ui/ArrowLeft'
import Stop from 'mdi-material-ui/Delete'
import Rollup from '@/interfaces/rollup'
import { GetRollupByName, DeleteRollup } from '@/http/rollup'
import DialogActions from "@mui/material/DialogActions";
import LoadingButton from '@mui/lab/LoadingButton'

export interface RollupState {
  blockNumber: number
  status: string
  statusCode: number
  id: number
}

function RollupExplorerPage() {
  const router = useRouter()
  const [err, setErr] = useState('')
  const [rollup, setRollup] = useState<Rollup| undefined>()
  const [showDialog, setShowDialog] = useState(false)
  const [loading, setLoading] = useState(false)

  React.useEffect(() => {
    const {name} = router.query
    const fetchData = async () => {
      const res = await GetRollupByName(name as string)
      if (res.ok) {
        const data = await res.json()
        if (!!data['data']) {
          console.log('Rollup data:', data['data'])
          setRollup(data['data'] as Rollup)
        }
      } else {
        if (res.status == 404) {
          setErr("Rollup not found")
        } else {
          setErr("Server error, please try again")
        }
      }
    }
    fetchData().catch(console.error)
  }, [router])

  const handleDeleteRollup = useCallback(async () => {
    if (!rollup) {
      return
    }
    setLoading(true)
    const res = await DeleteRollup(rollup.name)
    setLoading(false)
      if (res.ok) {
        const data = await res.json()
        if (!!data['data']) {
          // don't care
        }
        router.push("/rollup")
      }

  }, [rollup, router])

  return (
    <>
      <Grid container spacing={6} justifyContent={'space-between'}>
        <Grid item sx={{}}>
          <Link passHref href='/rollup'>
            <Button component='a' size={'small'} sx={{px: 5.5}}>
              {/*<DotsVertical/>*/}
              <ArrowLeft/>
              {/*Back To Dashboard*/}
            </Button>
          </Link>
        </Grid>

        <Grid item sx={{}}>
          <Button size={'small'}
                  onClick={(e) => {
                    setShowDialog(true)
                  }}
                  variant={'contained'} component='a' color={'error'} sx={{px: 5.5}}>
            <Stop/>
          </Button>
        </Grid>

        {!!err && (
          <Grid item xs={12}>
            <Typography variant='h5'>
              {err}
            </Typography>
          </Grid>
        )}

        <Grid item xs={12}>
          <ExecutionNodeTable rollup={rollup}/>
        </Grid>

        <Grid item xs={12}>
          <RollupExploreTable rollup={rollup}/>
        </Grid>
      </Grid>

      <Dialog open={!!showDialog} onClose={() => setErr('')}>
        <DialogTitle>
          Warning
        </DialogTitle>
        <DialogContent>
          <Typography variant='body2'>
            Are you sure you want to delete the rollup?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setShowDialog(false)
          }
          }>Cancel</Button>
          <LoadingButton
            color='primary'
            size='large'
            type='submit'
            sx={{ mr: 2 }}
            variant='contained'
            onClick={() => {
              handleDeleteRollup().then(r => {
                setShowDialog(false)
              })
            }}
            loading={loading}
          >
            Confirm
          </LoadingButton>
        </DialogActions>
      </Dialog>
    </>
  )
}

RollupExplorerPage.getLayout = (page: ReactNode) => {
  return (
    <RollupLayout hideLeft={true}>{page}</RollupLayout>
  )
}

export default RollupExplorerPage
