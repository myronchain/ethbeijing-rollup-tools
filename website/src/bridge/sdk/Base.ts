import memoize from 'fast-memoize'
import { Signer, providers } from 'ethers'
import { Token as TokenModel } from './models'
import { TProvider, TToken } from './types'
import { config } from './config'
import { tokens } from '@/bridge/config/core/tokens'
import Network from '@/bridge/models/Network';

/**
 * Class with base methods.
 * @namespace Base
 */
class Base {
  /** Network */
  public network: Network

  /** Ethers signer or provider */
  public signer: TProvider

  private addresses : Record<string, any>

  fees : { [token: string]: Record<string, number>}

  /**
   * @desc Instantiates Base class.
   * Returns a new Base class instance.
   * @param {TProvider} signer
   * @returns {Object} New Base class instance.
   */
  constructor (
    signer: TProvider,
  ) {
    if (signer) {
      this.signer = signer
    }
    this.addresses = config.addresses
  }

  /**
   * @desc Returns a Token instance.
   * @param {Object} - Token name or model.
   * @returns {Object} - Token model.
   */
  public toTokenModel (token: TToken) {
    if (typeof token === 'string') {
      const { name, decimals } = tokens[token]
      return new TokenModel(0, '', decimals, token, name)
    }

    return token
  }

  /**
   * @desc Returns the connected signer address.
   * @returns {String} Ethers signer address.
   * @example
   *```js
   *import { Hop } from '@hop-protocol/sdk'
   *
   *const hop = new Hop()
   *const address = await hop.getSignerAddress()
   *console.log(address)
   *```
   */
  public async getSignerAddress () {
    if (Signer.isSigner(this.signer)) {
      return this.signer.getAddress()
    }
  }

  /**
   * @desc Returns the connected signer if it's connected to the specified
   * chain id, otherwise it returns a regular provider for the specified chain.
   * @param {Object} chain - Chain name or model
   * @param {Object} signer - Ethers signer or provider
   * @returns {Object} Ethers signer or provider
   */
  public async getSignerOrProvider (
    network: Network,
    signer: TProvider = this.signer as Signer
  ) {
    if (Signer.isSigner(signer)) {
      if (signer.provider) {
        const connectedChainId = await signer.getChainId()
        if (connectedChainId !== network.networkId) {
          if (!signer.provider) {
            return (signer as Signer).connect(network.provider)
          }
          return network.provider
        }
        return signer
      } else {
        return network.provider
      }
    } else {
      return signer
    }
  }

  public getConfigAddresses (token: TToken, networkSlug: string) {
    token = this.toTokenModel(token)
    return this.addresses?.[token.canonicalSymbol]?.[networkSlug]
  }

  public getL1CanonicalTokenAddress (token: TToken, networkSlug: string) {
    return this.getConfigAddresses(token, networkSlug)?.l1CanonicalToken
  }

  public getL2CanonicalTokenAddress (token: TToken, networkSlug: string) {
    return this.getConfigAddresses(token, networkSlug)?.l2CanonicalToken
  }

  getSupportedAssets () {
    const supported : any = {}
    for (const token in this.addresses) {
      for (const chain in this.addresses[token]) {
        if (!supported[chain]) {
          supported[chain] = {}
        }
        supported[chain][token] = true
      }
    }
    return supported
  }
}

export default Base
