import { BigNumberish, Signer, providers } from 'ethers'
import { Token } from './models'
import { TokenSymbol } from './constants'

/** Token-ish type */
export type TToken = Token | TokenSymbol | string

/** Amount-ish type alias */
export type TAmount = BigNumberish

/** Signer-ish type */
export type TProvider = Signer | providers.Provider
