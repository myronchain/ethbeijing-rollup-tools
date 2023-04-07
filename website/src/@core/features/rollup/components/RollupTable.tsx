import React from 'react';
import {ThemeColor} from "@core/layouts/types";
import Grid from "@mui/material/Grid";
import Poll from "mdi-material-ui/Poll";
import ApexChartWrapper from 'src/@core/styles/libs/react-apexcharts'

import RollupCard from './rollupcard/card'
import Rollup from '@/interfaces/rollup'

// table data
function createData(name: string, description: string, network: string, rollupLink: string, key?: string) {
  return {name, description, network, rollupLink, key};
}

interface RowType {
  chain_id: number
  rollup_name: string
  status: string
  l1: string,
  // designation: string
}

interface StatusObj {
  [key: string]: {
    color: ThemeColor
  }
}

const rows: RowType[] = [
  {
    chain_id: 27,
    status: 'current',
    rollup_name: 'Sally Quinn',
    l1: 'private',
  },

  {
    chain_id: 27,
    status: 'current',
    rollup_name: 'Sally Quinn',
    l1: 'private',
  }
]

const statusObj: StatusObj = {
  applied: {color: 'info'},
  rejected: {color: 'error'},
  current: {color: 'primary'},
  resigned: {color: 'warning'},
  professional: {color: 'success'}
}

export interface RollupTableProps {
  rollups: Rollup[]
}

function RollupTable(props: RollupTableProps) {
  return (
    <ApexChartWrapper>
      {props.rollups.map((rollup) => (
        <Grid item xs={12} md={12} lg={12} key={rollup.chain_id}>
          <Grid container spacing={6}>
            <Grid item xs={12}>
              <RollupCard
                status={rollup.status}
                icon={<Poll/>}
                color='success'
                trendNumber='+42%'
                title={rollup.name}
                subtitle='Weekly Profit'
                rollup={rollup}
              />
            </Grid>
          </Grid>
        </Grid>
      ))}
    </ApexChartWrapper>
  );
}

export default RollupTable;
