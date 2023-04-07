import React, {ReactNode} from 'react';
import RollupLayout from "@/layouts/RollupLayout";
import ByorForm from "./create-form";
import Grid from "@mui/material/Grid";

function CreateRollupPage() {
  return (
    <>
      <Grid item xs={12}>
        <ByorForm />
      </Grid>
    </>
  );
}

CreateRollupPage.getLayout = (page: ReactNode) => {
  return (
    <RollupLayout>{page}</RollupLayout>
  )
}

export default CreateRollupPage;
