import { useMemo } from 'react'
import Token from '@/bridge/models/Token'
import { addresses } from '@/bridge/config'
import { tokens as bareTokens } from '@/bridge/config/core/tokens'
import { TokenSymbol } from '@/bridge/sdk'

const useTokens = () => {
  const tokens = useMemo<Token[]>(() => {
    return Object.keys(addresses.tokens).map(tokenSymbol => {
      const canonicalSymbol = tokenSymbol
      const tokenMeta = bareTokens[canonicalSymbol]
      const supportedNetworks = Object.keys(addresses.tokens[canonicalSymbol])
      return new Token({
        symbol: tokenMeta.symbol as TokenSymbol,
        tokenName: tokenMeta.name,
        decimals: tokenMeta.decimals,
        imageUrl: tokenMeta.image,
        supportedNetworks,
      })
    })
  }, [])

  return tokens
}

export default useTokens
