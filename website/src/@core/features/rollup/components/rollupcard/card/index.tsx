// ** MUI Imports
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import IconButton from '@mui/material/IconButton'
import Typography from '@mui/material/Typography'
import CardContent from '@mui/material/CardContent'
import RollupType from '@/interfaces/rollup'

// ** Icons Imports
import DotsVertical from 'mdi-material-ui/DotsVertical'

// ** Types Imports
import CardHeader from "@mui/material/CardHeader";
import Grid from "@mui/material/Grid";
import {ThemeColor} from "@core/layouts/types";
import * as React from "react";
import {ReactElement, SyntheticEvent, useState} from "react";
// import TrendingUp from "mdi-material-ui/TrendingUp";
import Rollup from "mdi-material-ui/Rollupjs";
import Sync from "mdi-material-ui/Sync";
import Math from "mdi-material-ui/MathIntegralBox";
import Block from "mdi-material-ui/BlockHelper";

import {RollupCardProps} from "@core/features/rollup/components/rollupcard/types";
import {Avatar, Menu} from '@mui/material'
// import LogoutVariant from "mdi-material-ui/LogoutVariant";
import Detail from "mdi-material-ui/More";
import Delete from "mdi-material-ui/Delete";
import MenuItem from "@mui/material/MenuItem";
import {useRouter} from "next/router";

interface DataType {
  targetInstances: number
  title: string
  color: ThemeColor
  icon: ReactElement
}

const rollupData: DataType[] = [
  {
    targetInstances: 1,
    title: 'Sequencer',
    color: 'primary',
    icon: <Rollup sx={{fontSize: '1.75rem'}}/>
  },
  {
    targetInstances: 1,
    title: 'Executor',
    color: 'success',
    icon: <Sync sx={{fontSize: '1.75rem'}}/>
  },
  {
    targetInstances: 1,
    color: 'warning',
    title: 'Prover',
    icon: <Math sx={{fontSize: '1.75rem'}}/>
  },
  {
    targetInstances: 1,
    color: 'info',
    title: 'Latest Block Number',
    icon: <Block sx={{fontSize: '1.75rem'}}/>
  }
]

const renderStats = (rollup: RollupType, state: PageState) => {
  return rollupData.map((item: DataType, index: number) => (
    <Grid item xs={12} sm={3} key={index}>
      <Box key={index} sx={{display: 'flex', alignItems: 'center'}}>
        <Avatar
          variant='rounded'
          sx={{
            mr: 3,
            width: 44,
            height: 44,
            boxShadow: 3,
            color: 'common.white',
            backgroundColor: `info.main`
          }}
        >
          {item.icon}
        </Avatar>
        <Box sx={{display: 'flex', flexDirection: 'column'}}>
          <Typography variant='caption'>{item.title}</Typography>
          <Typography variant='h6'>{item.targetInstances}</Typography>
        </Box>
      </Box>
    </Grid>
  ))
}

interface PageState {
  blockNumber: number
  status: string
  statusCode: number
}

const RollupCard = (props: RollupCardProps) => {
  const [anchorEl, setAnchorEl] = useState<Element | null>(null)
  const router = useRouter()
  const [pageState, setPageState] = useState<PageState>({
    blockNumber: -1,
    statusCode: 0,
    status: ''
  })

  const handleDropdownOpen = (event: SyntheticEvent) => {
    setAnchorEl(event.currentTarget)
  }

  const handleDropdownClose = (url?: string) => {
    setAnchorEl(null)
  }

  const handleDetail = () => {
    router.push('/rollup-explore/' + props.rollup.name)
    setAnchorEl(null)
  }

  return (
    <Card sx={{mb: 0}}>
      <CardHeader
        title={props.title}
        action={
          <>
            <IconButton size='small' aria-label='settings' className='card-more-options'
                        onClick={handleDropdownOpen}
                        sx={{color: 'text.secondary'}}>
              <DotsVertical/>
            </IconButton>
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={() => handleDropdownClose()}
            >
              <MenuItem sx={{py: 2}} onClick={() => handleDetail()}>
                <Detail sx={{marginRight: 2, fontSize: '1.375rem', color: 'text.secondary'}}/>
                See Detail
              </MenuItem>
            </Menu>
          </>
        }
        subheader={
          <Typography variant='body2'>
            <Typography component='li' sx={{
              fontWeight: 600,
              color: 'success.main'
            }}>
              Status: Running 🎉
            </Typography>
            <Typography component='li' sx={{fontWeight: 600, color: 'text.primary'}}>
              Rollup to Local L1
            </Typography>{' '}
            <Typography component='li' sx={{fontWeight: 600, color: 'text.primary'}}>
              <a target={'_blank'} href={props.rollup.explorer} rel="noreferrer">L2
                block explorer
              </a>
            </Typography>
            <Typography component='li' sx={{fontWeight: 600, color: 'text.primary'}}>
              <a target={'_blank'} href={`/bridge/${props.rollup.chain_id}`} rel="noreferrer">Rollup
                Bridge</a>
            </Typography>
          </Typography>
        }
        titleTypographyProps={{
          sx: {
            mb: 2.5,
            lineHeight: '2rem !important',
            letterSpacing: '0.15px !important'
          }
        }}
      />
      <CardContent sx={{pt: theme => `${theme.spacing(3)} !important`}}>
        <Grid container spacing={[5, 0]}>
          {renderStats(props.rollup, pageState)}
        </Grid>
      </CardContent>
    </Card>
  )
}

export default RollupCard

RollupCard.defaultProps = {
  color: 'primary',
  trend: 'positive'
}
