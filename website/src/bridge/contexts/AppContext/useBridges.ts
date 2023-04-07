import { useMemo, useState, useEffect } from 'react'
import { Hop, HopBridge, TToken } from '@/bridge/sdk'
import { addresses } from '@/bridge/config'
import useQueryParams from '@/bridge/hooks/useQueryParams'
import { findMatchingBridge } from '@/bridge/utils'

const useBridges = (sdk?: Hop) => {
  const { queryParams, updateQueryParams, location } = useQueryParams()

  const bridges = useMemo(() => {
    if (!sdk) {
      return [] // TODO (eric)
    }
    // 'Addresses' has been configured by deploy env in src/config, which is a parameter of sdk
    return Object.keys(addresses.tokens).map(symbol => {
      return sdk.bridge(symbol as TToken)
    })
  }, [sdk])

  const queryParamBridge = useMemo(
    () => findMatchingBridge(bridges, queryParams.token as string),
    [bridges, queryParams]
  )

  const [selectedBridge, _setSelectedBridge] = useState<HopBridge>(queryParamBridge ?? bridges[0])

  const setSelectedBridge = (bridge: HopBridge) => {
    // if (!location.pathname.startsWith('/tx')) {
    //   updateQueryParams({
    //     token: bridge.getTokenSymbol(),
    //   })
    // }

    _setSelectedBridge(bridge)
  }

  useEffect(() => {
    if (!bridges.length) {
      return
    }

    const matchingBridge = findMatchingBridge(bridges, selectedBridge?.getTokenSymbol())

    if (matchingBridge) {
      setSelectedBridge(matchingBridge)
    } else {
      setSelectedBridge(bridges[0])
    }
  }, [selectedBridge, bridges])

  return { bridges, selectedBridge, setSelectedBridge }
}

export default useBridges
