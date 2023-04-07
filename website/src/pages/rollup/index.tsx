import MainCard from '@core/components/cards/MainCard';
import RollupTable from '@core/features/rollup/components/RollupTable';
import {
  Button,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Grid,
  Stack,
  Typography
} from '@mui/material';
import React, {ReactNode, useEffect, useState} from 'react';

import RollupLayout from "@/layouts/RollupLayout";
import Rollup from "@/interfaces/rollup"
import {GetRollups, GetRollupByName} from "@/http/rollup";
import Link from 'next/link';
import Box from "@mui/material/Box";
import RollupStepper from "@/pages/create-rollup/rollupstepper";
import {useRouter} from "next/router";

interface PageState {
  rollups?: Rollup[]
}

function RollupListPage() {
  const [pageState, setPageState] = useState({} as PageState);
  // init
  useEffect(() => {
    const initRequest = async () => {
      let rollups = [];
      try {
        const res = await GetRollups()
        if (res.ok) {
          const jsonRes = await res.json()
          if (!!jsonRes['data']) {
            rollups = jsonRes['data']
          }
        }
      } catch (error) {
        console.error(error)
      }

      setPageState({
        rollups: rollups
      })
    }
    initRequest().then(r => {
      //
    })
  }, [])

  return (
    <>
      {!!pageState.rollups?.length &&
        <MainCard
          title=""
          content={false}
        >
          <RollupTable rollups={pageState.rollups}/>
        </MainCard>
      }
      {!pageState.rollups?.length &&
        <MainCard
          title="No rollups"
          content={false}
        >
        </MainCard>
      }
    </>
  );
}

RollupListPage.getLayout = (page: ReactNode) => {
  return (
      <RollupLayout>{page}</RollupLayout>
  )
}


export default RollupListPage;
