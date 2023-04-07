import Base from './Base'
import Token from './Token'
import TokenModel from './models/Token'

import {
  L1Escrow__factory,
  L2Escrow__factory
} from '@/bridge/contracts'

import { BigNumber, Signer } from 'ethers'
import {
  TokenSymbol
} from './constants'
import { TAmount, TProvider, TToken } from './types'
import { tokens } from '@/bridge/config/core/tokens'
import { getAddress as checksumAddress } from 'ethers/lib/utils'
import Network from '@/bridge/models/Network'

type DepositETHInput = {
  destNetwork: Network
  srcNetwork: Network
  amount: TAmount
  relayFee: TAmount
  recipient?: string
}

type WithdrawETHInput = {
  destNetwork: Network
  srcNetwork: Network
  amount: TAmount
  relayFee: TAmount
  recipient?: string
}

/**
 * Class representing Hop bridge.
 * @namespace HopBridge
 */
class HopBridge extends Base {
  private tokenSymbol: TokenSymbol

  l1: Network
  l2: Network

  /**
   * @desc Instantiates Hop Bridge.
   * Returns a new Hop Bridge instance.
   * @param {String} network - L1 network
   * @param {Object} signer - Ethers `Signer` for signing transactions.
   * @param {Object} token - Token symbol or model
   * @param {Object} srcNetwork - Source network model
   * @param {Object} destNetwork - Destination network model
   * @returns {Object} HopBridge SDK instance.
   * @example
   *```js
   *import { HopBridge, Chain, Token } from '@hop-protocol/sdk'
   *import { Wallet } from 'ethers'
   *
   *const signer = new Wallet(privateKey)
   *const bridge = new HopBridge(signer, Token.USDC, Chain.Optimism, Chain.Gnosis)
   *```
   */
  constructor (
    l1: Network,
    l2: Network,
    signer: TProvider,
    token: TToken,
  ) {
    super(signer)

    this.l1 = l1
    this.l2 = l2
    if (token instanceof Token || token instanceof TokenModel) {
      this.tokenSymbol = token.symbol
    } else if (typeof token === 'string') {
      this.tokenSymbol = token
    }

    if (!token) {
      throw new Error('token is required')
    }

  }

  /**
   * @desc Returns hop bridge instance with signer connected. Used for adding or changing signer.
   * @param {Object} signer - Ethers `Signer` for signing transactions.
   * @returns {Object} New HopBridge SDK instance with connected signer.
   * @example
   *```js
   *import { Hop, Token } from '@hop-protocol/sdk'
   *import { Wallet } from 'ethers'
   *
   *const signer = new Wallet(privateKey)
   *let hop = new Hop()
   * // ...
   *const bridge = hop.bridge(Token.USDC).connect(signer)
   *```
   */
  public connect (signer: Signer) {
    return new HopBridge(
      this.l1,
      this.l2,
      signer,
      this.tokenSymbol
    )
  }

  public getL1Token () {
    return this.toCanonicalToken(this.tokenSymbol, this.l1)
  }

  public getCanonicalToken (network: Network) {
    return this.toCanonicalToken(this.tokenSymbol, network)
  }

  public toCanonicalToken (
    token: TToken,
    network: Network
  ) {
    token = this.toTokenModel(token)
    const { name, symbol, decimals, image } = tokens[
      token.canonicalSymbol
    ]

    let address
    // todo(eric): how to add other token????
    if (symbol === "ETH") {
      address = "0x0000000000000000000000000000000000000000"
    } else {
      if (network.isLayer1) {
        address = this.getL1CanonicalTokenAddress(token.symbol, network.slug)
      } else {
        address = this.getL2CanonicalTokenAddress(token.symbol, network.slug)
      }
    }
    return new Token(
      network,
      address,
      decimals,
      symbol as never,
      name,
      image,
      this.signer
    )
  }

  private async l1CrossChainChannelBalance (): Promise<BigNumber> {
    return this.l1.provider.getBalance(this.l1.bridgeAddress)
  }

  private async l2CrossChainChannelBalance (): Promise<BigNumber> {
    return this.l2.provider.getBalance(this.l2.bridgeAddress)
  }

  private async depositERC20 (tokenAddress: string, amount: TAmount, relayFee: TAmount, recipient?: string) {
    recipient = recipient ?? await this.getSignerAddress()
    const l1Escrow = await this.getL1Escrow(this.l1.provider)
    const populatedTx = await l1Escrow.populateTransaction.depositERC20To(tokenAddress, recipient!, amount, relayFee, [], {
      value: relayFee
    }) as any
    const canonicalToken = this.getCanonicalToken(this.l1)
    const balance = await canonicalToken.getNativeTokenBalance()
    const l2CrossChainChannelBalance = await this.l2CrossChainChannelBalance()
    if (balance.lt(relayFee)) {
      throw new Error('Insufficient balance')
    }
    if (l2CrossChainChannelBalance.lt(relayFee)) {
      throw new Error('L2 CrossChainChannel insufficient balance')
    }
    this.checkConnectedChain(this.signer, this.l1)
    console.log("g1g2==, depositERC20, sendTransaction...")
    const result = await this.signer.sendTransaction(populatedTx)
    console.log("g1g2==, depositERC20 result:", result)
    return result
  }

  private async withdrawERC20 (tokenAddress: string, amount: TAmount, relayFee: TAmount, recipient?: string) {
    recipient = recipient ?? await this.getSignerAddress()
    const l2Escrow = await this.getL2Escrow(this.l2.provider)
    const populatedTx = await l2Escrow.populateTransaction.withdrawERC20To(tokenAddress, recipient!, amount, relayFee, [], {
      value: relayFee
    }) as any
    const canonicalToken = this.getCanonicalToken(this.l2)
    const balance = await canonicalToken.getNativeTokenBalance()
    const l1CrossChainChannelBalance = await this.l1CrossChainChannelBalance()
    console.log("g1g2== withdrawERC20", {
      tokenAddress,
      amount,
      relayFee,
      recipient,
      src: this.l2,
      l2Escrow,
      populatedTx,
      canonicalToken,
      balance,
      l1CrossChainChannelBalance
    })
    if (balance.lt(relayFee)) {
      throw new Error("Insufficient balance")
    }
    if (l1CrossChainChannelBalance.lt(relayFee)) {
      throw new Error("L1 CrossChainChannel insufficient balance")
    }
    this.checkConnectedChain(this.signer, this.l2)
    console.log("g1g2== withdrawERC20 sendTransaction...")
    const result = await this.signer.sendTransaction(populatedTx)
    console.log('g1g2== withdrawERC20 result:', result)
    return result
  }

  public async depositETH (
    amount: TAmount,
    relayFee: TAmount,
    recipient?: string
  ) {
    const srcNetwork = this.l1
    const destNetwork = this.l2
    const input = {
      srcNetwork,
      destNetwork,
      amount,
      relayFee,
      recipient
    }
    const depositETHTx = await this.populateDepositETHTx(input)
    const canonicalToken = this.getCanonicalToken(srcNetwork)
    const balance = await canonicalToken.getNativeTokenBalance()
    const l2CrossChainChannelBalance = await this.l2CrossChainChannelBalance()
    const totalValue = BigNumber.from('0').add(amount).add(relayFee)
    if (balance.lt(totalValue)) {
      throw new Error('Insufficient balance')
    }
    if (l2CrossChainChannelBalance.lt(totalValue)) {
      throw new Error('L2 CrossChainChannel insufficient balance')
    }
    await this.checkConnectedChain(this.signer, srcNetwork)
    console.log('g1g2== depositETH sendTransaction...')
    const result = await this.signer.sendTransaction(depositETHTx)
    console.log('g1g2== depositETH result:', result)
    return result
  }

  public async withdrawETH (amount: TAmount, relayFee: TAmount, recipient?: string) {
    const srcNetwork = this.l2
    const destNetwork = this.l1
    const input = {
      srcNetwork,
      destNetwork,
      amount,
      relayFee,
      recipient
    }
    const withdrawETHTx = await this.populateWithdrawETHTx(input)
    const canonicalToken = this.getCanonicalToken(srcNetwork)
    const balance = await canonicalToken.getNativeTokenBalance()
    const l1CrossChainChannelBalance = await this.l1CrossChainChannelBalance()
    const totalValue = BigNumber.from('0').add(amount).add(relayFee)
    if (balance.lt(totalValue)) {
      throw new Error('Insufficient balance')
    }
    if (l1CrossChainChannelBalance.lt(totalValue)) {
      throw new Error('L1 CrossChainChannel insufficient balance')
    }
    this.checkConnectedChain(this.signer, srcNetwork)
    console.log('g1g2== withdrawETH, sendTransaction...')
    const result = await this.signer.sendTransaction(withdrawETHTx)
    console.log("g1g2== withdrawETH result:", result)
    return result
  }

  public async send (
    tokenAmount: TAmount,
    srcNetwork: Network,
    destNetwork: Network,
    recipient?: string,
  ) {
    recipient = recipient ?? await this.getSignerAddress()
    const canonicalToken = this.getCanonicalToken(srcNetwork)
    const isNativeToken = this.isNativeToken(srcNetwork)
    const isL1 = srcNetwork.isLayer1
    const relayFee = BigNumber.from('2' + '0'.repeat(16)) // 0.02 ethers // TODO hardcode relayfee?
    if (isL1) {
      if (isNativeToken) {
        return this.depositETH(tokenAmount, relayFee, recipient)
      } else {
        return this.depositERC20(canonicalToken.address, tokenAmount, relayFee, recipient)
      }
    } else {
      if (isNativeToken) {
        return this.withdrawETH(tokenAmount, relayFee, recipient)
      } else {
        return this.withdrawERC20(canonicalToken.address, tokenAmount, relayFee, recipient)
      }
    }
  }

  // ToDo: Docs
  public getTokenSymbol () {
    return this.tokenSymbol
  }

  // ToDo: Docs
  public getTokenImage () {
    return this.getL1Token()?.image
  }

  public async getL1Escrow (signer: TProvider = this.signer) {
    const l1EscrowAddress = this.l1.escrowAddress
    const provider = await this.getSignerOrProvider(this.l1, signer)
    return L1Escrow__factory.connect(l1EscrowAddress, provider!)
  }

  public async getL2Escrow (signer: TProvider = this.signer) {
    const l2EscrowAddress = this.l2.escrowAddress
    const provider = await this.getSignerOrProvider(this.l2, signer)
    return L2Escrow__factory.connect(l2EscrowAddress, provider)
  }

  private async populateDepositETHTx (input: DepositETHInput): Promise<any> {
    const {
      srcNetwork,
      amount,
      relayFee
    } = input
    let recipient = input.recipient
    if (!srcNetwork.isLayer1) {
      throw new Error('sourceChain must be L1')
    }
    recipient = recipient || await this.getSignerAddress()
    if (!recipient) {
      throw new Error('recipient is required')
    }
    recipient = checksumAddress(recipient)
    const l1Escrow = await this.getL1Escrow(srcNetwork.provider)

    return l1Escrow.populateTransaction.depositETHTo(recipient, amount, relayFee, [], {
      value: BigNumber.from(0).add(amount).add(relayFee)
    })
  }

  private async populateWithdrawETHTx (input: WithdrawETHInput): Promise<any> {
    const {
      srcNetwork,
      amount,
      relayFee
    } = input
    let recipient = input.recipient
    if (srcNetwork.isLayer1) {
      throw new Error('sourceChain must be L2')
    }
    recipient = recipient || await this.getSignerAddress()
    if (!recipient) {
      throw new Error('recipient is required')
    }
    recipient = checksumAddress(recipient)
    const l2Escrow = await this.getL2Escrow(srcNetwork.provider)

    return l2Escrow.populateTransaction.withdrawETHTo(recipient, amount, relayFee, [], {
      value: BigNumber.from(0).add(amount).add(relayFee)
    })
  }

  private async checkConnectedChain (signer: TProvider, network: Network) {
    const connectedChainId = await (signer as Signer)?.getChainId()
    if (connectedChainId !== network.networkId) {
      throw new Error('invalid connected chain ID. Make sure signer provider is connected to source chain network')
    }
  }

  isNativeToken (network: Network) {
    const token = this.getCanonicalToken(network)
    return token.isNativeToken
  }

  async getEthBalance (network: Network = this.l1, address?: string) {
    address = address ?? await this.getSignerAddress()
    if (!address) {
      throw new Error('address is required')
    }
    return network.provider.getBalance(address)
  }
}

export default HopBridge
