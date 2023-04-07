import { HopBridge } from '@/bridge/sdk'
import { useMemo } from 'react'
import logger from '@/bridge/logger'
import Network from '@/bridge/models/Network'

export function useAssets(selectedBridge?: HopBridge, network?: Network, toNetwork?: Network) {
  // Check if asset is supported by networks
  const unsupportedAsset = useMemo<any>(() => {
    if (!(selectedBridge && network)) {
      return null
    }
    const unsupportedAssets = {
    }
    const selectedTokenSymbol = selectedBridge?.getTokenSymbol()
    for (const chain in unsupportedAssets) {
      const tokenSymbols = unsupportedAssets[chain]
      for (const tokenSymbol of tokenSymbols) {
        const isUnsupported =
          selectedTokenSymbol === tokenSymbol &&
          [network?.slug, toNetwork?.slug].includes(chain.toLowerCase())
        if (isUnsupported) {
          return {
            chain,
            tokenSymbol,
          }
        }
      }
    }

    return null
  }, [selectedBridge, network, toNetwork])

  // Set source token
  const sourceToken = useMemo(() => {
    try {
      if (!network || !selectedBridge || unsupportedAsset?.chain) return
      return selectedBridge.getCanonicalToken(network)
    } catch (err) {
      logger.error(err)
    }
  }, [unsupportedAsset, selectedBridge, network])

  // Set destination token
  const destToken = useMemo(() => {
    try {
      if (!toNetwork || !selectedBridge || unsupportedAsset?.chain) return
      return selectedBridge.getCanonicalToken(toNetwork)
    } catch (err) {
      logger.error(err)
    }
  }, [unsupportedAsset, selectedBridge, toNetwork])

  // Set placeholder token
  const placeholderToken = useMemo(() => {
    if (!selectedBridge) return
    return selectedBridge.getL1Token()
  }, [selectedBridge])

  return {
    unsupportedAsset,
    sourceToken,
    destToken,
    placeholderToken,
  }
}