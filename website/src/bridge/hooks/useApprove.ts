import { BigNumber, constants } from 'ethers'
import { useWeb3Context } from '@/bridge/contexts/Web3Context'
import { useApp } from '@/bridge/contexts/AppContext'
import { Token } from '@/bridge/sdk'
import Transaction from '@/bridge/models/Transaction'
import { toTokenDisplay } from '@/bridge/utils'
import { useTransactionReplacement } from './useTransactionReplacement'

const useApprove = token => {
  const { provider } = useWeb3Context()
  const { txConfirm } = useApp()
  const { waitForTransaction, addTransaction } = useTransactionReplacement()

  const checkApproval = async (amount: BigNumber, token: Token, spender: string) => {
    try {
      const signer = provider?.getSigner()
      if (!signer) {
        throw new Error('Wallet not connected')
      }

      if (token.isNativeToken) {
        return false
      }

      const approved = await token.allowance(spender)
      if (approved.gte(amount)) {
        return false
      }

      return true
    } catch (err: any) {
      return false
    }
  }

  const approve = async (amount: BigNumber, token: Token, spender: string) => {
    const signer = provider?.getSigner()
    if (!signer) {
      throw new Error('Wallet not connected')
    }

    if (token.isNativeToken) {
      return
    }

    const approved = await token.allowance(spender)
    if (approved.gte(amount)) {
      return
    }

    const formattedAmount = toTokenDisplay(amount, token.decimals)
    const tx = await txConfirm?.show({
      kind: 'approval',
      inputProps: {
        tagline: `Allow Hop to spend your ${token.symbol} on ${token.network.name}`,
        amount: token.symbol === 'USDT' ? undefined : formattedAmount,
        token: token.symbol,
      },
      onConfirm: async (approveAll: boolean) => {
        const approveAmount = approveAll ? constants.MaxUint256 : amount
        console.log('g1g2== approve', {
          token,
          spender,
          approveAmount
        })
        return token.approve(spender, approveAmount)
      },
    })

    if (tx?.hash) {
      addTransaction(
        new Transaction({
          hash: tx?.hash,
          srcNetwork: token.network,
          token,
        })
      )

      const res = await waitForTransaction(tx, { srcNetwork: token.network, token })
      if (res && 'replacementTx' in res) {
        return res.replacementTx
      }
    }

    return tx
  }

  return { approve, checkApproval }
}

export default useApprove
