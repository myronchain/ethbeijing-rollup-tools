import React, {ChangeEvent, FC, useEffect, useMemo, useState} from 'react'
import {useLocation} from 'react-router-dom'
import Header from '@/bridge/components/header/Header'
import Button from '@/bridge/components/buttons/Button'
import SendIcon from '@material-ui/icons/Send'
import ArrowDownIcon from '@material-ui/icons/ArrowDownwardRounded'
import SendAmountSelectorCard from '@/bridge/SendAmountSelectorCard'
import Alert from '@/bridge/components/alert/Alert'
import TxStatusModal from '@/bridge/components/modal/TxStatusModal'
import {BigNumber} from 'ethers'
import Network from '@/bridge/models/Network'
import {useWeb3Context} from '@/bridge/contexts/Web3Context'
import {useApp} from '@/bridge/contexts/AppContext'
import logger from '@/bridge/logger'
import {findMatchingBridge, sanitizeNumericalString} from '@/bridge/utils'
import {amountToBN, formatError} from '@/bridge/utils/format'
import {useSendStyles} from '@/bridge/useSendStyles'
import SendHeader from '@/bridge/SendHeader'
import {Div, Flex} from '@/bridge/components/ui'
import useQueryParams from '@/bridge/hooks/useQueryParams'
import {useSendTransaction} from '@/bridge/useSendTransaction'
import {useApprove, useAssets, useAsyncMemo, useBalance, useSufficientBalance,} from '@/bridge/hooks'
import {ButtonsWrapper} from '@/bridge/components/buttons/ButtonsWrapper'
import useIsSmartContractWallet from '@/bridge/hooks/useIsSmartContractWallet'
import AccountDetails from '@/bridge/components/accountDetails'
import TxConfirm from '@/bridge/components/txConfirm'
import CustomRecipientDropdown from "../../bridge/CustomRecipientDropdown";
import Rollup, { L1Net, LocalL1 } from '@/interfaces/rollup'
import { useRouter } from 'next/router'
import { GetRollupByName } from '@/http/rollup'
import { rollupToL1Network, rollupToL2Network } from '@/utils/rollup'

const Send: FC = () => {
  const styles = useSendStyles()
  const {
    networks,
    txConfirm,
    txHistory,
    sdk,
    bridges,
    selectedBridge,
    setSelectedBridge,
    setL1,
    setL2,
    l1,
    l2,
    settings,
  } = useApp()

  const [deposit, setDeposit] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const {name} = router.query
    const fetchRollup = async () => {
      const rollupRes = await GetRollupByName(name as string)
      if (!rollupRes.ok) {
        console.error("get rollup error", rollupRes)
        return
      }
      const data = await rollupRes.json()
      if (!!data['data']) {
        const rollup = data['data'] as Rollup
        const l1 = LocalL1
        const l1Network = rollupToL1Network(rollup, l1)
        const l2Netowrk = rollupToL2Network(rollup)
        // console.log("l1 network", l1Network)
        // console.log("l2 network", l2Netowrk)
        const fromNetwork = deposit ? l1Network : l2Netowrk
        const toNetwork = deposit ? l2Netowrk : l1Network
        setFromNetwork(fromNetwork)
        setToNetwork(toNetwork)
        setL1(l1Network)
        setL2(l2Netowrk)
      }
    }
    fetchRollup()
    return () => {
      // cancel http request
      // context.cancle()
    }
  }, [deposit, setL1, setL2, router])

  const {checkConnectedNetworkId, address} = useWeb3Context()
  const [fromNetwork, setFromNetwork] = useState<Network | undefined>()
  const [toNetwork, setToNetwork] = useState<Network | undefined>()
  const [fromTokenAmount, setFromTokenAmount] = useState<string>()
  const [approving, setApproving] = useState<boolean>(false)
  const [warning, setWarning] = useState<any>(null)
  const [error, setError] = useState<string | null | undefined>(null)
  const [info, setInfo] = useState<string | null | undefined>(null)
  const [customRecipient, setCustomRecipient] = useState<string>()
  const isSmartContractWallet = useIsSmartContractWallet()

  // Reset error message when fromNetwork/toNetwork changes
  useEffect(() => {
    if (warning) {
      setWarning('')
    }
    if (error) {
      setError('')
    }
  }, [warning, error])

  // Get assets
  const {unsupportedAsset, sourceToken, destToken, placeholderToken} = useAssets(
    selectedBridge,
    fromNetwork,
    toNetwork
  )

  // Get token balances for both networks
  const {balance: fromBalance, loading: loadingFromBalance} = useBalance(sourceToken, address)
  const {balance: toBalance, loading: loadingToBalance} = useBalance(destToken, address)

  // Set fromToken -> BN
  const fromTokenAmountBN = useMemo<BigNumber | undefined>(() => {
    if (fromTokenAmount && sourceToken) {
      return amountToBN(fromTokenAmount, sourceToken.decimals)
    }
  }, [sourceToken, fromTokenAmount])

  const relayFee = BigNumber.from('2' + '0'.repeat(16))
  const {sufficientBalance, warning: sufficientBalanceWarning} = useSufficientBalance(
    sourceToken,
    fromTokenAmountBN,
    relayFee,
    fromBalance
  )

  // ==============================================================================================
  // Error and warning messages
  // ==============================================================================================

  // Set error message if asset is unsupported
  useEffect(() => {
    if (unsupportedAsset) {
      const {chain, tokenSymbol} = unsupportedAsset
      setError(`${tokenSymbol} is currently not supported on ${chain}`)
    } else if (error) {
      setError('')
    }
  }, [unsupportedAsset, error])

  useEffect(() => {
    let message = ''

    if (sufficientBalanceWarning) {
      message = sufficientBalanceWarning
    }

    setWarning(message)
  }, [
    sufficientBalanceWarning,
  ])

  // ==============================================================================================
  // Approve fromNetwork / fromToken
  // ==============================================================================================

  const {approve, checkApproval} = useApprove(sourceToken)

  const needsApproval = useAsyncMemo(async () => {
    try {
      if (!(fromNetwork && sourceToken && fromTokenAmount && sdk)) {
        return false
      }

      const parsedAmount = amountToBN(fromTokenAmount, sourceToken.decimals)
      const bridge = sdk.bridge(sourceToken.symbol)

      let spender: string
      if (fromNetwork.isLayer1) {
        const l1Escrow = await bridge.getL1Escrow()
        spender = l1Escrow.address
      } else {
        const l2Escrow = await bridge.getL2Escrow()
        spender = l2Escrow.address
      }

      return checkApproval(parsedAmount, sourceToken, spender)
    } catch (err: any) {
      logger.error(err)
      return false
    }
  }, [sdk, fromNetwork, sourceToken, fromTokenAmount, checkApproval])

  const approveFromToken = async () => {
    if (!fromNetwork) {
      throw new Error('No fromNetwork selected')
    }

    if (!sourceToken) {
      throw new Error('No from token selected')
    }

    if (!fromTokenAmount) {
      throw new Error('No amount to approve')
    }

    if (!sdk) {
      throw new Error("No sdk selected")
    }

    const networkId = Number(fromNetwork.networkId)
    const isNetworkConnected = await checkConnectedNetworkId(networkId)
    if (!isNetworkConnected) return

    const parsedAmount = amountToBN(fromTokenAmount, sourceToken.decimals)
    const bridge = sdk.bridge(sourceToken.symbol)

    let spender: string
    if (fromNetwork.isLayer1) {
      logger.debug('send from L1')
      const l1Escrow = await bridge.getL1Escrow()
      spender = l1Escrow.address
    } else {
      logger.debug('send from L2')
      const l2Escrow = await bridge.getL2Escrow()
      spender = l2Escrow.address
    }

    console.log('g1g2== approveFromToken', {
      parsedAmount,
      sourceToken,
      spender,
    })
    const tx = await approve(parsedAmount, sourceToken, spender)

    await tx?.wait()
  }

  const handleApprove = async () => {
    try {
      setError(null)
      setApproving(true)
      await approveFromToken()
    } catch (err: any) {
      if (!/cancelled/gi.test(err.message)) {
        setError(formatError(err, fromNetwork))
      }
      logger.error(err)
    }
    setApproving(false)
  }

  // ==============================================================================================
  // Send tokens
  // ==============================================================================================

  const {tx, setTx, send, sending} = useSendTransaction({
    customRecipient,
    fromNetwork,
    fromTokenAmount,
    sdk,
    setError,
    sourceToken,
    toNetwork,
    txConfirm,
    txHistory,
  })

  useEffect(() => {
    if (tx) {
      // clear from token input field
      setFromTokenAmount('')
    }
  }, [tx])

  // ==============================================================================================
  // User actions
  // - Bridge / Network selection
  // - Custom recipient input
  // ==============================================================================================

  // Change the bridge if user selects different token to send
  const handleBridgeChange = (event: ChangeEvent<{ value: unknown }>) => {
    const tokenSymbol = event.target.value as string
    const bridge = findMatchingBridge(bridges, tokenSymbol)
    if (bridge) {
      setSelectedBridge(bridge)
    }
  }

  // Specify custom recipient
  const handleCustomRecipientInput = (event: any) => {
    const value = event.target.value.trim()
    setCustomRecipient(value)
  }

  const onTabChange = (value: string) => {
    if (value == "deposit") {
      setDeposit(true)
    } else if (value == "withdraw") {
      setDeposit(false)
    } else {
      console.error("value not recognized")
    }
  }

  const approveButtonActive = needsApproval

  const sendButtonActive = useMemo(() => {
    return !!(
      !approveButtonActive &&
      !loadingToBalance &&
      fromTokenAmount &&
      sufficientBalance
    )
  }, [
    approveButtonActive,
    loadingToBalance,
    fromTokenAmount,
    sufficientBalance,
  ])

  return (
    <>
      <Header deposit={deposit} l1={l1} l2={l2} onTabChange={onTabChange}/>
      <AccountDetails/>

      <Div flexGrow={1}>
        <Div p={['2.2rem', '2rem']} flexGrow={1}>
          <Flex column alignCenter>
            <SendHeader
              styles={styles}
              bridges={bridges}
              deposit={deposit}
              selectedBridge={selectedBridge}
              handleBridgeChange={handleBridgeChange}
            />

            <SendAmountSelectorCard
              value={fromTokenAmount}
              token={sourceToken ?? placeholderToken}
              label={'From'}
              onChange={value => {
                if (!value) {
                  setFromTokenAmount('')
                  return
                }

                const amountIn = sanitizeNumericalString(value)
                setFromTokenAmount(amountIn)
              }}
              selectedNetwork={fromNetwork}
              networkOptions={networks}
              balance={fromBalance}
              loadingBalance={loadingFromBalance}
              toNetwork={toNetwork}
              fromNetwork={fromNetwork}
              setWarning={setWarning}
            />

            <Flex justifyCenter alignCenter my={1}>
              <ArrowDownIcon color="primary" className={styles.downArrow}/>
            </Flex>

            <SendAmountSelectorCard
              token={destToken ?? placeholderToken}
              label={'To'}
              selectedNetwork={toNetwork}
              networkOptions={networks}
              balance={toBalance}
              loadingBalance={loadingToBalance}
              loadingValue={false}
              disableInput
            />

            <CustomRecipientDropdown
              styles={styles}
              customRecipient={customRecipient}
              handleCustomRecipientInput={handleCustomRecipientInput}
              isOpen={isSmartContractWallet}
            />

            <div className={styles.smartContractWalletWarning}>
              <Alert severity="warning">
                {isSmartContractWallet
                  ? 'The connected account is detected to be a smart contract wallet. Please provide a custom recipient to proceed with this transaction.'
                  : ''}
              </Alert>
            </div>

            <Alert severity="error" onClose={() => setError(null)} text={error}/>
            {!error && <Alert severity="warning">{warning}</Alert>}

            <ButtonsWrapper>
              {!sendButtonActive && (
                <Div mb={[3]} fullWidth={approveButtonActive}>
                  <Button
                    className={styles.button}
                    large
                    highlighted={!!needsApproval}
                    disabled={!approveButtonActive}
                    onClick={handleApprove}
                    loading={approving}
                    fullWidth
                  >
                    Approve
                  </Button>
                </Div>
              )}
              <Div mb={[3]} fullWidth={sendButtonActive}>
                <Button
                  className={styles.button}
                  startIcon={sendButtonActive && <SendIcon/>}
                  onClick={send}
                  disabled={!sendButtonActive}
                  loading={sending}
                  large
                  fullWidth
                  highlighted
                >
                  Send
                </Button>
              </Div>
            </ButtonsWrapper>

            <Flex mt={1}>
              <Alert severity="info" onClose={() => setInfo(null)} text={info}/>
              {tx && <TxStatusModal onClose={() => setTx(null)} tx={tx}/>}
            </Flex>
          </Flex>
        </Div>
      </Div>

      <TxConfirm/>
    </>
  )
}

export default Send
