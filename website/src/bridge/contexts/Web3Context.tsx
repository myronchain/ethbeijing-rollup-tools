import React, {createContext, FC, useCallback, useContext, useEffect, useMemo, useState,} from 'react'
import Onboard from 'bnc-onboard'
import {BigNumber, ethers} from 'ethers'
import Address from '@/bridge/models/Address'
import {blocknativeDappid} from '@/bridge/config'
import {MainNetworkId} from '@/bridge/config/addresses'
import logger from '@/bridge/logger'
import {WalletCheckInit, WalletSelectModuleOptions} from 'bnc-onboard/dist/src/interfaces'
import {loadState, saveState} from '@/bridge/utils/localStorage'
import Network from '../models/Network'

// TODO: modularize
type Props = {
  onboard: any
  provider: ethers.providers.Web3Provider | undefined
  address: Address | undefined
  balance?: BigNumber
  connectedNetworkId: string
  validConnectedNetworkId: boolean
  requestWallet: () => void
  disconnectWallet: () => void
  walletConnected: boolean
  walletName: string
  checkConnectedNetworkId: (networkId: number) => Promise<boolean>,
  switchNetwork: (network: Network) => Promise<boolean>,
}

const Web3Context = createContext<Props | undefined>(undefined)

// TODO: modularize
const walletSelectOptions: WalletSelectModuleOptions = {
  heading: 'Connect Wallet',
  description: '',
  // agreement: {
  //   version: '0.0.1'
  //   termsUrl: '', // optional
  //   privacyUrl: '', // optional
  // },
  wallets: [
    // preferred: shown at the top of the selection screen
    // label: override name
    // svg: string that overrides the icon
    // iconSrc: alternative to svg string (url source)
    // display: { desktop: true, mobile: true }
    {walletName: 'metamask', preferred: true, iconSrc: "/images/bridge/metamask.png"},
    // {
    //   walletName: 'walletConnect',
    //   label: 'Wallet Connect',
    //   preferred: true,
    //   rpc: {
    //     1: getRpcUrl(ChainSlug.Ethereum),
    //     42: getRpcUrl(ChainSlug.Ethereum),
    //     // 42161: getRpcUrl(ChainSlug.Arbitrum),
    //     // 421611: getRpcUrl(ChainSlug.Arbitrum),
    //     // 200: getRpcUrl(ChainSlug.Arbitrum),
    //     // 10: getRpcUrl(ChainSlug.Optimism),
    //     // 69: getRpcUrl(ChainSlug.Optimism),
    //     // 420: getRpcUrl(ChainSlug.Optimism),
    //     // 137: getRpcUrl(ChainSlug.Polygon),
    //     // 80001: getRpcUrl(ChainSlug.Polygon),
    //     23023: getRpcUrl(ChainSlug.Ethereum),
    //     1000001: getRpcUrl(ChainSlug.G1G2),
    //   },
    // },
    // {
    //   walletName: 'walletLink',
    //   preferred: true,
    //   rpcUrl: getRpcUrl(ChainSlug.Ethereum),
    //   appName: 'Hop',
    // },
  ],
}

// TODO: modularize
const walletChecks: WalletCheckInit[] = [
  {checkName: 'derivationPath'},
  {checkName: 'accounts'},
  {checkName: 'connect'},
  {checkName: 'network'},
  {checkName: 'balance'},
]

const Web3ContextProvider: FC = ({children}) => {
  // logger.debug('Web3ContextProvider render')
  const [provider, setProvider] = useState<ethers.providers.Web3Provider | undefined>()
  const [connectedNetworkId, setConnectedNetworkId] = useState<string>('')
  const [validConnectedNetworkId] = useState<boolean>(false)
  const [walletName, setWalletName] = useState<string>('')
  const [address, setAddress] = useState<Address | undefined>()
  const [balance, setBalance] = useState<BigNumber>()
  // const { isDarkMode } = useThemeMode()

  // walletSelect()
  // Displays the wallet select modal:
  // const walletSelected = await onboard.walletSelect()
  // returns a Promise that:
  // resolves with true if the user selected a wallet
  // resolves with false if the user exited from the wallet select modal

  // walletCheck()
  // Once a wallet is selected, you will want to make sure that the user's wallet is prepared and ready to transact by calling the walletCheck function:
  // const readyToTransact = await onboard.walletCheck()
  // returns a Promise that:
  // resolves with true if user is ready to transact
  // resolves with false if user exited before completing all wallet checks

  // walletReset()
  // You may want to reset all of Onboard's internal wallet state and also disconnect from any active SDK instances when a user logs out of your app. You can call the walletReset function to do this easily.
  // user wants to log out of session and the wallet state needs to be reset...
  // onboard.walletReset()
  // this method is synchronous and returns undefined

  // getState()
  // This function will give you the current state of the user:
  // const currentState = onboard.getState()
  // console.log(currentState)
  // {
  //    address: string
  //    network: number
  //    balance: string
  //    wallet: Wallet
  //    mobileDevice: boolean
  //    appNetworkId: number
  // }

  // You can update some configuration parameters by passing a config object in to the config function:
  // onboard.config({ darkMode: true, networkId: 4 })

  const cacheKey = 'selectedWallet'
  const onboard = useMemo(() => {
    logger.debug('init onboard with network ', MainNetworkId)
    const instance = Onboard({
      dappId: blocknativeDappid,
      networkId: Number(MainNetworkId),
      // darkMode: isDarkMode,
      // blockPollingInterval: 4000,
      hideBranding: true,
      // Callback functions that get called whenever the corresponding value changes
      subscriptions: {
        address: (address: string) => {
          logger.debug('wallet address:', address)
          if (address) {
            setAddress(Address.from(address))
          }
        },
        // ens: (ens: any) => {
        //   const { name, avatar, getText, contentHash } = ens
        //   console.log(`ens:`, ens)
        // },
        network: (connectedNetworkId: number) => {
          if (connectedNetworkId) {
            setConnectedNetworkId(connectedNetworkId.toString())
          } else {
            setConnectedNetworkId('')
          }
        },
        balance: bal => {
          if (bal) {
            setBalance(BigNumber.from(bal))
          }
        },
        wallet: async (wallet: any) => {
          try {
            const {provider, name, instance, type, connect, dashboard, icons} = wallet
            // provider - The JavaScript provider for interacting with the wallet
            // name - The wallet display name
            // instance - If the wallet type is 'sdk' then this is the initialized wallet instance
            // type - The wallet type 'hardware' | 'injected' | 'sdk'
            // connect - The function that initiates the wallet connection logic
            // dashboard - Some SDK wallets allow for opening to wallet dashboard
            // icons - [object] Image strings for the wallet icon { svg, src, srcset }

            logger.debug('wallet name:', wallet.name)
            if (provider) {
              saveState(cacheKey, name)
              const ethersProvider = new ethers.providers.Web3Provider(provider, 'any')
              if (provider.enable && !provider.isMetaMask) {
                // needed for WalletConnect and some wallets
                await provider.enable()
              } else {
                // note: this method may not be supported by all wallets
                try {
                  await ethersProvider.send('eth_requestAccounts', [])
                } catch (error) {
                  console.error(error)
                }
              }
              setProvider(ethersProvider)
              setWalletName(name)
              logger.debug('init provider and check network connected')
              // const network = await ethersProvider.getNetwork()
              // await checkConnectedNetworkId(Number(network.chainId))
            } else {
              setWalletName('')
              setProvider(undefined)
              setAddress(undefined)
            }
          } catch (err) {
            logger.error(err)
            setProvider(undefined)
            setAddress(undefined)
          }
        },
      },
      // Defines how the wallet select screen will render
      walletSelect: walletSelectOptions,
      // Used to check if the user is ready to transact
      walletCheck: walletChecks,
    })

    return instance
  }, [setProvider, setConnectedNetworkId])

  useEffect(() => {
    if (onboard) {
      const cachedWallet = loadState(cacheKey)
      if (cachedWallet != null) {
        onboard.walletSelect(cachedWallet)
      }
    }
  }, [onboard])

  // TODO: cleanup
  const requestWallet = () => {
    const _requestWallet = async () => {
      try {
        localStorage.clear()
        await onboard.walletReset()
        await onboard.walletSelect()
      } catch (err) {
        logger.error(err)
      }
    }

    _requestWallet()
  }

  // TODO: cleanup
  const disconnectWallet = () => {
    try {
      localStorage.clear()
      onboard.walletReset()
    } catch (error) {
      logger.error(error)
    }
  }

  // TODO: cleanup
  const walletConnected = !!address

  // TODO: cleanup
  const checkConnectedNetworkId = useCallback(
    async (networkId?: number): Promise<boolean> => {
      logger.debug('prepare if we can check connected network')
      if (!(networkId && provider)) return false

      const signerNetworkId = (await provider.getNetwork())?.chainId
      logger.info('checkConnectedNetworkId', networkId, signerNetworkId)

      // metamask current connected chain is the target chain, do nothing
      if (networkId.toString() === signerNetworkId?.toString()) {
        return true
      }

      onboard.config({networkId})
      if (onboard.getState().address) {
        try {
          // const wantNetworkName = networkIdToName(networkId) || 'local'
          // const isL1 = ['Mainnet', 'Ropsten', 'Rinkeby', 'Goerli'].includes(
          //   wantNetworkName
          // )

          // const wantNetwork = findNetworkBySlug(networkIdToSlug(networkId))
          // const isL1 = wantNetwork?.isLayer1 ?? false

          // if (isL1) {
          try {
            logger.debug('try switch chain to ', networkId)
            await provider?.send('wallet_switchEthereumChain', [
              {
                chainId: `0x${Number(networkId).toString(16)}`,
              },
            ])
          } catch (switchError) {
            // } else {
            const error = switchError as any
            if (error.code === 4902) {
              logger.debug('add chain for ', networkId)
              const nativeCurrency = {
                name: 'ether',
                symbol: 'ETH',
                decimals: 18
              }
              // TODO (eric)
              // const rpcObj = {
              //   chainId: `0x${Number(networkId).toString(16)}`,
              //   chainName: wantNetwork?.name,
              //   // rpcUrls: [getRpcUrl(networkIdToSlug(networkId.toString()))],
              //   rpcUrls: [wantNetwork?.rpcUrl],
              //   // blockExplorerUrls: [getBaseExplorerUrl(networkIdToSlug(networkId.toString()))],
              //   blockExplorerUrls: [wantNetwork?.explorerUrl],
              //   nativeCurrency,
              // }

              // await provider?.send('wallet_addEthereumChain', [rpcObj])
            }
          }
          // }
        } catch (err) {
          logger.error(err)
        }
      }
      const p = await provider.getNetwork()
      if (p.chainId === networkId) {
        return true
      }

      await onboard.walletCheck()

      return false
    },
    [provider, onboard]
  )

  const switchNetwork = useCallback(
    async (network?: Network): Promise<boolean> => {
      logger.debug('prepare if we can check connected network')
      if (!(network && provider)) return false

      const signerNetworkId = (await provider.getNetwork())?.chainId
      const networkId = network.networkId
      logger.debug('switchConnectedNetworkId', network, signerNetworkId)
      // metamask current connected chain is the target chain, do nothing
      if (networkId.toString() === signerNetworkId?.toString()) {
        return true
      }

      onboard.config({networkId})
      if (onboard.getState().address) {
        try {
          try {
            logger.debug('try switch chain to ', networkId)
            await provider?.send('wallet_switchEthereumChain', [
              {
                chainId: `0x${Number(networkId).toString(16)}`,
              },
            ])
          } catch (switchError) {
            const error = switchError as any
            if (error.code === 4902) {
              logger.debug('add chain for ', networkId)
              const nativeCurrency = {
                name: 'ether',
                symbol: 'ETH',
                decimals: 18
              }
              const rpcObj = {
                chainId: `0x${Number(networkId).toString(16)}`,
                chainName: network?.name,
                rpcUrls: [network?.rpcUrl],
                blockExplorerUrls: [network?.explorerUrl],
                nativeCurrency,
              }
              await provider?.send('wallet_addEthereumChain', [rpcObj])
            }
          }
        } catch (err) {
          logger.error(err)
        }
      }
      const p = await provider.getNetwork()
      if (p.chainId === networkId) {
        return true
      }

      await onboard.walletCheck()

      return false
    },
    [provider, onboard]
  )

  return (
    <Web3Context.Provider
      value={{
        onboard,
        provider,
        address,
        balance,
        walletConnected,
        connectedNetworkId,
        validConnectedNetworkId,
        requestWallet,
        disconnectWallet,
        walletName,
        checkConnectedNetworkId,
        switchNetwork,
      }}
    >
      {children}
    </Web3Context.Provider>
  )
}

export function useWeb3Context() {
  const ctx = useContext(Web3Context)
  if (ctx === undefined) {
    throw new Error('useApp must be used within Web3Provider')
  }
  return ctx
}

export default Web3ContextProvider
