import React, { ChangeEvent } from 'react'
import Tabs from '@material-ui/core/Tabs'
import Tab from '@material-ui/core/Tab'
import Network from '@/bridge/models/Network'
import { Theme, makeStyles } from '@material-ui/core/styles'

type HeaderProps = {
  deposit: boolean
  l1?: Network
  l2?: Network
  onChange?: (value: string) => void;
}

const useStyles = makeStyles((theme: Theme) => ({
  root: {
    fontSize: "1.5rem",
    fontWeight: 900,
  },
}))

const HeaderTabs = (props: HeaderProps): JSX.Element => {
  const styles = useStyles()

  const handleChange = (event: ChangeEvent<{}>, newValue: string) => {
    event.preventDefault();
    !!props.onChange && props.onChange(newValue)
  };

  const value = props.deposit ? "deposit" : "withdraw"
  return (
    <Tabs value={value} onChange={handleChange}>
      <Tab className={styles.root} label="Deposit" value="deposit" />
      <Tab className={styles.root} label="Withdraw" value="withdraw" />
    </Tabs>
  );
};


export default HeaderTabs;
