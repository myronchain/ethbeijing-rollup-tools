import React, { useCallback, useEffect, useState } from 'react'
import { makeStyles, Theme } from '@material-ui/core'
import Typography from '@material-ui/core/Typography'
import Box from '@material-ui/core/Box'
import AppBar from '@material-ui/core/AppBar'
import { useApp } from '@/bridge/contexts/AppContext'
import { useWeb3Context } from '@/bridge/contexts/Web3Context'
import HeaderTabs from '@/bridge/components/header/HeaderTabs'
import TxPill from '@/bridge/components/header/TxPill'
import WalletWarning from './WalletWarning'
import {
  fixedDecimals,
  toTokenDisplay,
} from '@/bridge/utils'
import Network from '@/bridge/models/Network'
import logger from '@/bridge/logger'
import { useInterval } from 'react-use'
import ConnectWalletButton from './ConnectWalletButton'
import IconButton from '@material-ui/core/IconButton'
import { Flex, Icon } from '../ui'
import { useThemeMode } from '@/bridge/theme/ThemeProvider'
import { StyledButton } from '../buttons/StyledButton'

const useStyles = makeStyles((theme: Theme) => ({
  appbar: {
    backgroundColor: theme.palette.background.default,
  },
  root: {
    display: 'flex',
    flexWrap: 'wrap',
    // minHeight: '8rem',
    padding: '0 4.2rem',
    [theme.breakpoints.down('sm')]: {
      // minHeight: '7rem',
      padding: '0 2rem',
    },
    [theme.breakpoints.down('xs')]: {
      flexDirection: 'column',
      paddingTop: '2rem',
      marginBottom: '4rem',
    },
    transition: 'all 0.15s ease-out',
  },
  g1g2Logo: {
    display: 'flex',
    alignItems: 'center',
    width: '4.1rem',
    [theme.breakpoints.down('sm')]: {
      width: '3.5rem',
    },
  },
  label: {
    fontSize: '1.5rem',
    display: 'flex',
    fontWeight: 'bold',
    alignItems: 'center',
    color: theme.palette.text.primary,
    opacity: '0.5',
  },
  walletPill: {
    margin: '0rem 1rem',
  },
  balancePill: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: '3rem',
    marginLeft: '1rem',
    padding: '1.2rem 2rem',
    boxShadow: ({ isDarkMode }: any) =>
      isDarkMode
        ? theme.boxShadow.inner
        : `rgba(255, 255, 255, 0.5) -3px -3px 6px inset, rgba(174, 174, 192, 0.16) 3px 3px 6px inset`,
    color: theme.palette.text.secondary,
    [theme.breakpoints.down('sm')]: {
      fontSize: '.8rem',
    },
    [theme.breakpoints.down('xs')]: {
      display: 'none',
    },
    transition: 'all 0.15s ease-out',
  },
  balance: {
    display: 'flex',
    alignContent: 'center',
    justifyContent: 'center',
    fontWeight: 'bold',
    fontSize: '1.5rem',
    whiteSpace: 'nowrap',
    [theme.breakpoints.down('sm')]: {
      fontSize: '1.2rem',
    },
  },
  image: {
    marginRight: '0.5rem',
    width: '16px',
    [theme.breakpoints.down('sm')]: {
      width: '12px',
    },
  },
}))

type HeaderProps = {
  deposit: boolean
  l1?: Network
  l2?: Network
  onTabChange?: (value: string) => void;
}

const Header = (props: HeaderProps) => {
  const { toggleMode, isDarkMode } = useThemeMode();
  const styles = useStyles({ isDarkMode });
  const { address, provider, connectedNetworkId, switchNetwork } = useWeb3Context();
  const { theme } = useApp();
  const [displayBalance, setDisplayBalance] = useState<string>("");
  const [connectedNetwork, setConnectedNetwork] = useState<Network | undefined>();

  const updateDisplayBalance = async () => {
    try {
      if (!(address && provider && connectedNetworkId)) {
        setDisplayBalance("");
        return;
      }
      const balance = await provider.getBalance(address.address);
      const formattedBalance = toTokenDisplay(balance, 18);
      let tokenSymbol: string;
      let network: Network;
      if (connectedNetworkId === props.l1?.networkId.toString()) {
        tokenSymbol = props.l1?.nativeTokenSymbol
        network = props.l1
      } else if (connectedNetworkId === props.l2?.networkId.toString()) {
        tokenSymbol = props.l2?.nativeTokenSymbol
        network = props.l2
      } else {
        logger.info(props)
        logger.error("network id not match" + "current connected:" + connectedNetworkId)
        setDisplayBalance("")
        return
      }
      const _displayBalance = `${fixedDecimals(formattedBalance, 3)} ${tokenSymbol}`;
      setDisplayBalance(_displayBalance);
      setConnectedNetwork(network);
    } catch (err) {
      logger.error(err);
      setDisplayBalance("");
    }
  };

  const switchConnectedChain = useCallback(async () => {
    try {
      if (!(props.l1 && props.l2)) return
      let targetNetwork = props.l1
      if (targetNetwork?.networkId.toString() === connectedNetworkId) {
        targetNetwork = props.l2
      }
      await switchNetwork(targetNetwork)
    } catch (err) {
      logger.error(err);
    }
  }, [props, connectedNetworkId, switchNetwork])

  useEffect(() => {
    if (connectedNetworkId === props.l1?.networkId.toString() ||
      connectedNetworkId === props.l2?.networkId.toString()) {
      return
    }
    const switchNetwork = async () => {
      try {
        await switchConnectedChain()
      } catch (error) {
        console.error(error)
      }
    }
    switchNetwork()
  }, [connectedNetworkId, props, switchConnectedChain]);

  useEffect(() => {
    if (address && provider && connectedNetworkId) {
      updateDisplayBalance();
    }
  }, [address, provider, connectedNetworkId]);

  useInterval(updateDisplayBalance, 5000);

  // const showBalance = !!displayBalance && !!connectedNetwork;
  const showBalance = !!connectedNetwork;
  const ThemeModeIcon = isDarkMode ? "/images/bridge/sun-icon.svg" : "/images/bridge/moon-icon.svg";

  const rightButton = (
    <Flex alignCenter justifyCenter mx={1} fontSize={[".8rem", "1rem"]}>
      {address ? <TxPill /> : <ConnectWalletButton mode={theme?.palette.type} />}
    </Flex>
  );

  return (
    <AppBar position="relative" className={styles.appbar}>
      <Box className={styles.root} display="flex" alignItems="center">
        <Box display="flex" flexDirection="row" flex={1} justifyContent="flex-start">
          <span className={styles.label}>
            {props.l2?.name.toUpperCase()}
          </span>
        </Box>

        <Box display="flex" flexDirection="row" flex={1} justifyContent="center" alignSelf="center">
          <HeaderTabs deposit={props.deposit} l1={props.l1} l2={props.l2} onChange={props.onTabChange}/>
        </Box>

        <Box
          display="flex"
          flexDirection="row"
          flex={1}
          justifyContent="flex-end"
          alignItems="center"
        >
          {/*<Flex alignCenter p={[1, 1]} mx={[2, 0]}>*/}
          {/*  <IconButton onClick={toggleMode}>*/}
          {/*    <Icon src={ThemeModeIcon} width={20} alt="Change theme" />*/}
          {/*  </IconButton>*/}
          {/*</Flex>*/}

          {showBalance && (
            <Flex
              justifyCenter
              alignCenter
              borderRadius={"3rem"}
              mx={1}
              p={"1.2rem 2rem"}
              boxShadow={
                isDarkMode && theme
                  ? theme.boxShadow.inner
                  : `rgba(255, 255, 255, 0.5) -3px -3px 6px inset, rgba(174, 174, 192, 0.16) 3px 3px 6px inset`
              }
              color="text.secondary"
              fontSize={[".8rem", "1rem"]}
              display={["none", "flex"]}
            >
              <div title="click to switch chain" onClick={switchConnectedChain} className={styles.balance}>
                {connectedNetwork?.name}
                <img className={styles.image} alt="" src={connectedNetwork?.imageUrl} />
                {displayBalance}
              </div>
            </Flex>
          )}

          {rightButton}

        </Box>
      </Box>
      <WalletWarning />
    </AppBar>
  );
};

export default Header;
