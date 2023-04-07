import Base from './Base'
import { BigNumber, Contract, Signer, ethers, providers } from 'ethers'
import { ERC20__factory } from '@/bridge/contracts'
import { TAmount } from './types'
import { TokenSymbol } from './constants'
import Network from '@/bridge/models/Network'

/**
 * Class reprensenting ERC20 Token
 * @namespace Token
 */
class Token extends Base {
  public readonly address: string
  public readonly decimals: number
  public readonly name: string
  public readonly image: string
  public readonly network: Network
  public readonly contract: Contract
  _symbol: TokenSymbol

  // TODO: clean up and remove unused parameters.
  /**
   * @desc Instantiates Token class.
   * @param {String} network - L1 network
   * @param {String} address - Token address.
   * @param {Number} decimals - Token decimals.
   * @param {String} symbol - Token symbol.
   * @param {String} name - Token name.
   * @param {Object} signer - Ethers signer.
   * @returns {Object} Token class instance.
   */
  constructor (
    network: Network,
    address: string,
    decimals: number,
    symbol: TokenSymbol,
    name: string,
    image: string,
    signer?: Signer | providers.Provider,
  ) {
    super(signer!)

    this.address = ethers.utils.getAddress(address)
    this.decimals = decimals
    this._symbol = symbol
    this.name = name
    this.image = image
    this.network = network
  }

  get symbol () {
    return this._symbol
  }

  /**
   * @desc Returns a token instance with signer connected. Used for adding or changing signer.
   * @param {Object} signer - Ethers `Signer` for signing transactions.
   * @returns {Object} New Token SDK instance with connected signer.
   */
  public connect (signer: Signer | providers.Provider) {
    return new Token(
      this.network,
      this.address,
      this.decimals,
      this._symbol,
      this.name,
      this.image,
      signer,
    )
  }

  /**
   * @desc Returns token allowance.
   * @param {String} spender - spender address.
   * @returns {Object} Ethers Transaction object.
   * @example
   *```js
   *import { Hop, Chain, Token } from '@hop-protocol/sdk'
   *
   *const bridge = hop.bridge(Token.USDC).connect(signer)
   *const spender = '0x90F8bf6A479f320ead074411a4B0e7944Ea8c9C1'
   *const allowance = bridge.allowance(Chain.Gnosis, spender)
   *```
   */
  public async allowance (spender: string, address?: string) {
    const tokenContract = await this.getErc20()
    address = address ?? await this.getSignerAddress()
    if (!address) {
      throw new Error('signer required')
    }
    return tokenContract.allowance(address, spender)
  }

  /**
   * @desc Returns token balance of signer.
   * @param {String} spender - spender address.
   * @returns {Object} Ethers Transaction object.
   * @example
   *```js
   *import { Hop, Chain, Token } from '@hop-protocol/sdk'
   *
   *const bridge = hop.bridge(Token.USDC).connect(signer)
   *const spender = '0x90F8bf6A479f320ead074411a4B0e7944Ea8c9C1'
   *const allowance = bridge.allowance(Chain.Gnosis, spender)
   *```
   */
  public async balanceOf (address?: string): Promise<BigNumber> {
    if (this.isNativeToken) {
      return this.getNativeTokenBalance(address)
    }
    address = address ?? await this.getSignerAddress()
    if (!address) {
      throw new Error('address is required')
    }
    const tokenContract = await this.getErc20()
    return tokenContract.balanceOf(address)
  }

  /**
   * @desc ERC20 token transfer
   * @param {String} recipient - recipient address.
   * @param {String} amount - Token amount.
   * @returns {Object} Ethers Transaction object.
   * @example
   *```js
   *import { Hop, Token } from '@hop-protocol/sdk'
   *
   *const bridge = hop.bridge(Token.USDC).connect(signer)
   *const recipient = '0x90F8bf6A479f320ead074411a4B0e7944Ea8c9C1'
   *const amount = '1000000000000000000'
   *const tx = await bridge.erc20Transfer(spender, amount)
   *```
   */
  public async transfer (recipient: string, amount: TAmount) {
    if (this.isNativeToken) {
      return (this.signer as Signer).sendTransaction({
        to: recipient,
        value: amount
      })
    }
    const tokenContract = await this.getErc20()
    return tokenContract.transfer(recipient, amount)
  }

  /**
   * @desc Approve address to spend tokens if not enough allowance .
   * @param {Object} chain - Chain model.
   * @param {String} spender - spender address.
   * @param {String} amount - amount allowed to spend.
   * @returns {Object} Ethers Transaction object.
   * @example
   *```js
   *import { Hop, Chain, Token } from '@hop-protocol/sdk'
   *
   *const bridge = hop.bridge(Token.USDC).connect(signer)
   *const spender = '0x90F8bf6A479f320ead074411a4B0e7944Ea8c9C1'
   *const amount = '1000000000000000000'
   *const tx = await bridge.approve(Chain.Gnosis, spender, amount)
   *```
   */
  public async approve (
    spender: string,
    amount: TAmount = ethers.constants.MaxUint256
  ) {
    const populatedTx = await this.populateApproveTx(spender, amount)
    const allowance = await this.allowance(spender)
    if (allowance.lt(BigNumber.from(amount))) {
      return this.signer.sendTransaction(populatedTx)
    }
  }

  public async populateApproveTx (
    spender: string,
    amount: TAmount = ethers.constants.MaxUint256
  ):Promise<any> {
    if (this.isNativeToken) {
      return
    }
    const tokenContract = await this.getErc20()
    return tokenContract.populateTransaction.approve(spender, amount)
  }

  /**
   * @desc Returns a token Ethers contract instance.
   * @param {Object} chain - Chain model.
   * @returns {Object} Ethers contract instance.
   */
  public async getErc20 () {
    const provider = await this.getSignerOrProvider(this.network)
    return ERC20__factory.connect(this.address, provider!)
  }

  // ToDo: Remove chainId. This is added to comply with the token model type
  get chainId () {
    throw new Error('chainId should not be accessed')
  }

  public eq (token: Token): boolean {
    return (
      this.symbol.toLowerCase() === token.symbol.toLowerCase() &&
      this.address.toLowerCase() === token.address.toLowerCase() &&
      this.network.eq(token.network)
    )
  }

  get isNativeToken () {
    return this._symbol === this.nativeTokenSymbol
  }

  get nativeTokenSymbol () {
    return this.network.nativeTokenSymbol
  }

  public async getNativeTokenBalance (address?: string): Promise<BigNumber> {
    address = address ?? await this.getSignerAddress()
    if (!address) {
      throw new Error('address is required')
    }
    return this.network.provider!.getBalance(address)
  }

  public async totalSupply (): Promise<BigNumber> {
    if (this.isNativeToken) {
      return BigNumber.from(0)
    }
    const tokenContract = await this.getErc20()
    return tokenContract.totalSupply()
  }

  static fromJSON (json: any): Token {
    return new Token(
      json.network,
      json.address,
      json.decimals,
      json.symbol,
      json.name,
      json.image
    )
  }

  toJSON () {
    return {
      address: this.address,
      decimals: this.decimals,
      name: this.name,
      image: this.image,
      network: this.network,
      symbol: this._symbol
    }
  }
}

export default Token
