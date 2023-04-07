import React, { ChangeEvent } from 'react'
import Tabs from '@material-ui/core/Tabs'
import Tab from '@material-ui/core/Tab'
import Network from '@/bridge/models/Network'

type HeaderProps = {
  deposit: boolean
  l1?: Network
  l2?: Network
  onChange?: (value: string) => void;
}

const HeaderTabs = (props: HeaderProps): JSX.Element => {
  const handleChange = (event: ChangeEvent<{}>, newValue: string) => {
    if (newValue === "l1explorer") {
      window.open(props.l1?.explorerUrl, "_blank");
      return;
    }

    if (newValue === "l2explorer") {
      window.open(props.l2?.explorerUrl, "_blank");
      return;
    }
    event.preventDefault();
    !!props.onChange && props.onChange(newValue)
  };

  const value = props.deposit ? "deposit" : "withdraw"
  return (
    <Tabs value={value} onChange={handleChange}>
      <Tab label="Deposit" value="deposit" />
      <Tab label="Withdraw" value="withdraw" />
      {/*<Tab label="L1Explorer" value="l1explorer" />*/}
      {/*<Tab label="L2Explorer" value="l2explorer" />*/}
    </Tabs>
  );
};


export default HeaderTabs;
