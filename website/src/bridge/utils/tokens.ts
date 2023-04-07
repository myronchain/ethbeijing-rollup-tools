import { TokenSymbol } from '@/bridge/sdk'
import { addresses } from '@/bridge/config'
import { tokens } from '@/bridge/config/core/tokens'

export function getTokenImage(tokenSymbol = 'ETH') {
  const token = tokens[tokenSymbol]
  if (!token) {
    throw new Error(`could not find token: ${tokenSymbol}`)
  }
  return token.image
}

export function getTokenDecimals(tokenSymbol: string) {
  const token = tokens[tokenSymbol]
  if (!token) {
    throw new Error(`could not find token: ${tokenSymbol}`)
  }
  return token.decimals
}
