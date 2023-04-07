// ** MUI Imports
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import Table from '@mui/material/Table'
import TableRow from '@mui/material/TableRow'
import TableHead from '@mui/material/TableHead'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import Typography from '@mui/material/Typography'
import TableContainer from '@mui/material/TableContainer'

// ** Types Imports
import {ThemeColor} from 'src/@core/layouts/types'
import CardHeader from '@mui/material/CardHeader'
import {CardContent} from '@mui/material'
import Rollup from '@/interfaces/rollup'

interface StatusObj {
  [key: string]: {
    color: ThemeColor
  }
}

const statusObj: StatusObj = {
  applied: {color: 'info'},
  rejected: {color: 'error'},
  current: {color: 'primary'},
  resigned: {color: 'warning'},
  professional: {color: 'success'}
}

const ExecutionNodeTable = (props: {rollup?: Rollup}) => {
  return (
    <Card>
      <CardHeader title='L2 Node' titleTypographyProps={{variant: 'h6'}}/>
      <CardContent>
        <TableContainer>
          <Table sx={{minWidth: 800}} aria-label='table in dashboard'>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>ChainId</TableCell>
                <TableCell>RpcUrl</TableCell>
                <TableCell>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              <TableRow hover sx={{'&:last-of-type td, &:last-of-type th': {border: 0}}}>
                <TableCell sx={{py: theme => `${theme.spacing(0.5)} !important`}}>
                  <Box sx={{display: 'flex', flexDirection: 'column'}}>
                    <Typography sx={{fontWeight: 500, fontSize: '0.875rem !important'}}>
                      {props.rollup?.name}
                    </Typography>
                    {/* <Typography variant='caption'>{row.designation}</Typography> */}
                  </Box>
                </TableCell>
                <TableCell>{props.rollup?.chain_id}</TableCell>
                <TableCell>{props.rollup?.rpc_url}</TableCell>
                <TableCell>{props.rollup?.status}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>
    </Card>
  )
}

export default ExecutionNodeTable
