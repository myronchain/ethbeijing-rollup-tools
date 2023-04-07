import { TokenSymbol } from '../constants'
import { ethers } from 'ethers'
import { tokens } from '@/bridge/config/core/tokens'

class Token {
  public readonly chainId: number
  public readonly address: string
  public readonly decimals: number
  public readonly symbol: TokenSymbol
  public readonly name: TokenSymbol

  static ETH = 'ETH'
  static USDC = 'USDC'
  static USDT = 'USDT'

  constructor (
    chainId: number | string,
    address: string,
    decimals: number,
    symbol: TokenSymbol,
    name: TokenSymbol
  ) {
    if (chainId) {
      this.chainId = Number(chainId)
    }
    if (address) {
      this.address = ethers.utils.getAddress(address)
    }
    if (symbol) {
      this.symbol = symbol
    }
    if (name) {
      this.name = name
    } else if (symbol) {
      this.name = symbol
    }
    if (decimals) {
      this.decimals = decimals
    }
    if (!decimals && symbol) {
      this.decimals = tokens[symbol]?.decimals
    }
  }

  get canonicalSymbol () {
    return this.symbol
  }
}

export default Token
