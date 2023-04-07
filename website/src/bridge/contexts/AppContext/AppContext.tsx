import React, { FC, useMemo, createContext, useContext, useState } from 'react'
import { Hop, HopBridge } from '@/bridge/sdk'
import { useWeb3Context } from '@/bridge/contexts/Web3Context'
import Token from '@/bridge/models/Token'
import Network from '@/bridge/models/Network'
import useTokens from '@/bridge/contexts/AppContext/useTokens'
import useBridges from '@/bridge/contexts/AppContext/useBridges'
import useTxHistory, { TxHistory } from '@/bridge/contexts/AppContext/useTxHistory'
import useEvents, { Events } from '@/bridge/contexts/AppContext/useEvents'
import useSettings, { Settings } from '@/bridge/contexts/AppContext/useSettings'
import { useAccountDetails, AccountDetails } from '@/bridge/contexts/AppContext/useAccountDetails'
import { useTxConfirm, TxConfirm } from '@/bridge/contexts/AppContext/useTxConfirm'
import { Theme, useTheme } from '@material-ui/core'


type AppContextProps = {
  sdk?: Hop
  bridges: HopBridge[]
  selectedBridge?: HopBridge
  setSelectedBridge: (bridge: HopBridge) => void
  setL1: (l1: Network) => void
  setL2: (l2: Network) => void
  l1?: Network,
  l2?: Network,
  networks: Network[]
  tokens: Token[]
  events: Events
  accountDetails: AccountDetails
  txHistory: TxHistory
  txConfirm: TxConfirm
  settings: Settings
  theme: Theme
}

const AppContext = createContext<AppContextProps | undefined>(undefined)

const AppContextProvider: FC = ({ children }) => {
  const { provider } = useWeb3Context()

  const [l1, setL1] = useState<Network | undefined>()
  const [l2, setL2] = useState<Network | undefined>()

  const sdk = useMemo(() => {
    if (l1 && l2) {
      return new Hop(l1, l2, provider?.getSigner())
    }
  }, [provider, l1, l2])

  const { bridges, selectedBridge, setSelectedBridge } = useBridges(sdk)

  const tokens = useTokens()
  const events = useEvents()
  const txHistory = useTxHistory()
  const accountDetails = useAccountDetails()
  const txConfirm = useTxConfirm()
  const settings = useSettings()
  const theme = useTheme()
  const networks: Network[] = []
  if (l1 && l2) {
    networks.push(l1)
    networks.push(l2)
  }

  return (
    <AppContext.Provider
      value={{
        sdk,
        bridges,
        selectedBridge,
        setSelectedBridge,
        setL1,
        setL2,
        l1,
        l2,
        networks,
        tokens,
        events,
        txHistory,
        accountDetails,
        txConfirm,
        settings,
        theme,
      }}
    >
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (ctx === undefined) {
    throw new Error('useApp must be used within AppProvider')
  }
  return ctx
}

export default AppContextProvider
