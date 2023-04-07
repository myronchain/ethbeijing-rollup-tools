// ** MUI Imports
import Card from '@mui/material/Card'
import Chip from '@mui/material/Chip'
import Table from '@mui/material/Table'
import TableRow from '@mui/material/TableRow'
import TableHead from '@mui/material/TableHead'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import Typography from '@mui/material/Typography'
import TableContainer from '@mui/material/TableContainer'

// ** Types Imports
import {ThemeColor} from 'src/@core/layouts/types'
import CardHeader from "@mui/material/CardHeader";
import {CardContent, InputAdornment, Link, TextField} from "@mui/material";
import {Magnify} from 'mdi-material-ui'
import Rollup, {RollupStatusEvent} from '@/interfaces/rollup'
import { ChangeEvent, useCallback, useState } from 'react'
import { getL1TxUrl, getL2BlockUrl } from '@/utils/rollup'

interface StatusObj {
  [key: string]: {
    color: ThemeColor
  }
}

const statusObj: StatusObj = {
  PROVED: {color: 'success'},
  FINALIZED: {color: 'info'},
}

interface RollupExploreTableProps {
  rollup?: Rollup
}

const fakeEvents: RollupStatusEvent[] =[
  {
    l1_chain_id: 10400,
    l2_chain_id: 10405,
    l2_block_number: 4,
    l2_block_hash: "0x12a78jfdf133podf",
    block_status: "FINALIZED",
    num_txs: 24,
    final_time: "2023/04/06 16:23:40",
    prove_time: "2023/04/06 16:33:40",
    l1_finalized_tx_hash: "0x12a78jfdf133podf",
    l1_block_number: "175",
    l1_proved_tx_hash: "0x12a78jfdf133podf",
    block_id: 4,
    prover: "0x12a78jfdf133podf",
  },
  {
    l1_chain_id: 10400,
    l2_chain_id: 10405,
    l2_block_number: 3,
    l2_block_hash: "0x12a78jfdf133podf",
    block_status: "FINALIZED",
    num_txs: 4,
    final_time: "2023/04/06 15:23:40",
    prove_time: "2023/04/06 15:33:40",
    l1_finalized_tx_hash: "0x12a78jfdf133podf",
    l1_block_number: "155",
    l1_proved_tx_hash: "0x12a78jfdf133podf",
    block_id: 3,
    prover: "0x12a78jfdf133podf",
  },
  {
    l1_chain_id: 10400,
    l2_chain_id: 10405,
    l2_block_number: 2,
    l2_block_hash: "0x12a78jfdf133podf",
    block_status: "PROVED",
    num_txs: 19,
    final_time: "2023/04/06 14:23:40",
    prove_time: "2023/04/06 14:33:40",
    l1_finalized_tx_hash: "0x12a78jfdf133podf",
    l1_block_number: "146",
    l1_proved_tx_hash: "0x12a78jfdf133podf",
    block_id: 2,
    prover: "0x12a78jfdf133podf",
  },
  {
    l1_chain_id: 10400,
    l2_chain_id: 10405,
    l2_block_number: 1,
    l2_block_hash: "0x12a78jfdf133podf",
    block_status: "PROVED",
    num_txs: 14,
    final_time: "2023/04/06 13:23:40",
    prove_time: "2023/04/06 13:33:40",
    l1_finalized_tx_hash: "0x12a78jfdf133podf",
    l1_block_number: "145",
    l1_proved_tx_hash: "0x12a78jfdf133podf",
    block_id: 1,
    prover: "0x12a78jfdf133podf",
  }
]

const RollupExploreTable = (props: RollupExploreTableProps) => {

  const [events, setEvents] = useState<RollupStatusEvent[]>(fakeEvents)
  const [searchId, setSearchId] = useState(0)

  const searchByBlockId = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    const blockId = Number(event.target.value)
    setSearchId(blockId || 0)
  }, [])

  return (
    <Card>
      <CardHeader title='Rollup Explorer' titleTypographyProps={{variant: 'h6'}}/>
      <CardContent>

        <TextField
          size='small'
          sx={{'& .MuiOutlinedInput-root': {borderRadius: 4}}}
          onChange={searchByBlockId}
          InputProps={{
            startAdornment: (
              <InputAdornment position='start'>
                <Magnify fontSize='small'/>
                <Typography variant="body2">Search BlockId</Typography>
              </InputAdornment>
            )
          }}
        />
        <TableContainer>
          <Table sx={{minWidth: 800}} aria-label='table in dashboard'>
            <TableHead>
              <TableRow>
                <TableCell>BlockId</TableCell>
                <TableCell>Time</TableCell>
                <TableCell>Transaction Count</TableCell>
                <TableCell>ProposedHash</TableCell>
                <TableCell>FinalizedHash</TableCell>
                <TableCell>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {events.map((event: RollupStatusEvent) => (
                <TableRow hover key={event.block_id} sx={{'&:last-of-type td, &:last-of-type th': {border: 0}}}>
                  <TableCell sx={{py: theme => `${theme.spacing(0.5)} !important`}}>
                    <Link sx={{display: 'flex', flexDirection: 'column'}} target={'_blank'} href={getL2BlockUrl(props.rollup?.name, event.l2_block_number)}>
                      {event.block_id}
                    </Link>
                  </TableCell>
                  <TableCell>{event.final_time}</TableCell>
                  <TableCell>{event.num_txs}</TableCell>
                  <TableCell>
                    <Link target={'_blank'} href={getL1TxUrl(event.l1_finalized_tx_hash)}>
                      {event.l1_finalized_tx_hash.substring(0, 16)}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Link target={'_blank'} href={getL1TxUrl(event.l1_proved_tx_hash)}>
                      {event.l1_proved_tx_hash.substring(0, 16)}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={event.block_status}
                      color={statusObj[event.block_status].color}
                      sx={{
                        height: 24,
                        fontSize: '0.75rem',
                        textTransform: 'capitalize',
                        '& .MuiChip-label': {fontWeight: 500}
                      }}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>
    </Card>

  )
}

export default RollupExploreTable
