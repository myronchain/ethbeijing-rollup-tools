import React, { useMemo, FC, ChangeEvent } from 'react'
import { BigNumber } from 'ethers'
import { formatUnits } from 'ethers/lib/utils'
import Card from '@material-ui/core/Card'
import Typography from '@material-ui/core/Typography'
import Skeleton from '@material-ui/lab/Skeleton'
import { Token } from '@/bridge/sdk'
import LargeTextField from '@/bridge/components/LargeTextField'
import Network from '@/bridge/models/Network'
import { toTokenDisplay } from '@/bridge/utils'
import { useAmountSelectorCardStyles } from '@/bridge/hooks'
import { NetworkSelector } from '@/bridge/components/NetworkSelector'
import { Flex } from '@/bridge/components/ui'

type Props = {
  value?: string
  label: string
  token?: Token
  onChange?: (value: string) => void
  fromNetwork?: Network
  toNetwork?: Network
  selectedNetwork?: Network
  networkOptions: Network[]
  onNetworkChange?: (network?: Network) => void
  balance?: BigNumber
  loadingBalance?: boolean
  loadingValue?: boolean
  disableInput?: boolean
  setWarning?: (message: string) => void
}

const SendAmountSelectorCard: FC<Props> = props => {
  const {
    value = '',
    label,
    token,
    onChange,
    fromNetwork,
    selectedNetwork,
    toNetwork,
    onNetworkChange,
    balance,
    loadingBalance = false,
    loadingValue = false,
    disableInput = false,
    setWarning,
  } = props
  const styles = useAmountSelectorCardStyles()

  const balanceLabel = useMemo(() => {
    return toTokenDisplay(balance, token?.decimals)
  }, [balance, token?.decimals])

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { value } = event.target
    if (onChange) {
      onChange(value)
    }
  }

  const handleMaxClick = async () => {
    if (!(onChange && balance && token && fromNetwork)) {
      return
    }

    const nativeTokenMaxGasCost = BigNumber.from(0)

    if (token.isNativeToken) {
      if (!toNetwork && setWarning) {
        return setWarning('Please set a destination network to determine max value')
      }
    }

    let totalAmount = balance.sub(nativeTokenMaxGasCost)
    if (totalAmount.lt(0)) {
      totalAmount = BigNumber.from(0)
    }

    const maxValue = formatUnits(totalAmount, token.decimals)
    onChange(maxValue)
  }

  return (
    <Card className={styles.root}>
      <Flex fullWidth justifyBetween alignCenter mb={'0.8rem'}>
        <Typography variant="subtitle2" color="textSecondary">
          {label}
        </Typography>
        {loadingBalance ? (
          <Skeleton variant="text" width="10.0rem"></Skeleton>
        ) : balance ? (
          <div className={styles.balance}>
            {balance.gt(0) && !disableInput ? (
              <button
                className={styles.maxButton}
                onClick={handleMaxClick}
                title="Max amount you can send while still having enough to cover fees"
              >
                MAX
              </button>
            ) : null}
            <Typography variant="subtitle2" color="textSecondary" align="right">
              Balance: {balanceLabel}
            </Typography>
          </div>
        ) : null}
      </Flex>

      <Flex fullWidth justifyBetween alignCenter>
        <NetworkSelector network={selectedNetwork} setNetwork={onNetworkChange} />
        <LargeTextField
          value={value}
          onChange={handleInputChange}
          placeholder="0.0"
          units={token?.symbol}
          disabled={disableInput}
          loadingValue={loadingValue}
        />
      </Flex>
    </Card>
  )
}

export default SendAmountSelectorCard
