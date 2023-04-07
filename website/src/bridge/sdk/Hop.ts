import Network from '@/bridge/models/Network'
import Base from './Base'
import HopBridge from './HopBridge'
import { Token } from './models'
import { TProvider, TToken } from './types'

/**
 * Class reprensenting Hop
 * @namespace Hop
 */
class Hop extends Base {

  /** Token class */
  static Token = Token

  /** Token class */
  Token = Token

  l1: Network
  l2: Network

  /**
   * @desc Instantiates Hop SDK.
   * Returns a new Hop SDK instance.
   * @param {String} network - L1 network name (e.g. 'mainnet', 'goerli')
   * @param {Object} signer - Ethers `Signer` for signing transactions.
   * @returns {Object} New Hop SDK instance.
   * @example
   *```js
   *import { Hop } from '@hop-protocol/sdk'
   *
   *const hop = new Hop('mainnet')
   *```
   * @example
   *```js
   *import { Hop } from '@hop-protocol/sdk'
   *import { Wallet } from 'ethers'
   *
   *const signer = new Wallet(privateKey)
   *const hop = new Hop('mainnet', signer)
   *```
   */
  // eslint-disable-next-line no-useless-constructor
  constructor (
    l1: Network,
    l2: Network,
    signer?: TProvider,
  ) {
    super(signer!)
    this.l1 = l1
    this.l2 = l2
  }

  /**
   * @desc Returns a bridge set instance.
   * @param {Object} token - Token model or symbol of token of bridge to use.
   * @param {Object} sourceChain - Source chain model.
   * @param {Object} destinationChain - Destination chain model.
   * @returns {Object} A HopBridge instance.
   * @example
   *```js
   *import { Hop, Token } from '@hop-protocol/sdk'
   *
   *const hop = new Hop()
   *const bridge = hop.bridge(Token.USDC)
   *```
   */
  public bridge (token: TToken) {
    return new HopBridge(this.l1, this.l2, this.signer, token)
  }

  /**
   * @desc Returns hop instance with signer connected. Used for adding or changing signer.
   * @param {Object} signer - Ethers `Signer` for signing transactions.
   * @returns {Object} A new Hop SDK instance with connected Ethers Signer.
   * @example
   *```js
   *import { Hop } from '@hop-protocol/sdk'
   *import { Wallet } from 'ethers'
   *
   *const signer = new Wallet(privateKey)
   *let hop = new Hop()
   * // ...
   *hop = hop.connect(signer)
   *```
   */
  connect (signer: TProvider) {
    this.signer = signer
    return new Hop(this.l1, this.l2, signer)
  }
}

export default Hop
