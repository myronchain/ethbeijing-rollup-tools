import React from 'react'
import Box from '@material-ui/core/Box'
import Typography from '@material-ui/core/Typography'
import Transaction from '@/bridge/models/Transaction'
import Modal from '@/bridge/components/modal'
import { useTxStatusStyles } from '../Transaction'
import TxStatusTracker from '@/bridge/components/Transaction/TxStatusTracker'
import Button from '@/bridge/components/buttons/Button'
import { useAddTokenToMetamask } from '@/bridge/hooks/useAddTokenToMetamask'
import { Div, Flex, Icon } from '../ui'
import { StyledButton } from '../buttons/StyledButton'
import { useTransactionStatus } from '@/bridge/hooks'

type Props = {
  tx: Transaction
  onClose?: () => void
}

function TxStatusModal(props: Props) {
  const styles = useTxStatusStyles()
  const { onClose, tx } = props
  const handleTxStatusClose = () => {
    if (onClose) {
      onClose()
    }
  }

  const timeEstimate = '5 minutes'

  const { completed, destCompleted, confirmations, networkConfirmations } = useTransactionStatus(
    tx,
    tx.srcNetwork
  )
  const { success, addTokenToDestNetwork } = useAddTokenToMetamask(tx.token, tx.destNetwork)

  // TODO: if no complaints after a week or so of this feature being live,
  // we can revert to using this and only display add-to-mm button if tx is completed
  // const showAddToMM =
  //   (completed && destCompleted) ||
  //   (completed && !tx.destNetworkName) ||
  //   (completed && tx.destNetworkName === tx.networkName)

  return (
    <Modal onClose={handleTxStatusClose}>
      <TxStatusTracker
        tx={tx}
        completed={completed}
        destCompleted={destCompleted}
        confirmations={confirmations}
        networkConfirmations={networkConfirmations}
      />

      <Box display="flex" alignItems="center" className={styles.txStatusInfo}>
        <Typography variant="body1">
          {tx && tx.token ? (
            <em>
              Your transfer will arrive at the destination around <strong>{timeEstimate}</strong>{' '}
              after your transaction is confirmed.
            </em>
          ) : (
            <em>This may take a few minutes</em>
          )}
        </Typography>

        {tx?.token?.symbol && (
          <Flex mt={2} justifyCenter>
            <StyledButton onClick={addTokenToDestNetwork}>
              {!success ? (
                <Flex alignCenter>
                  <Div mr={2}>Add {tx.token.symbol} to Metamask</Div>
                  <Icon width={20} src={"/images/bridge/metamask.png"} />
                </Flex>
              ) : (
                <Flex alignCenter>
                  <Div mr={2}>Added {tx.token.symbol}</Div>
                  <Icon.Circle width={0} stroke="green" />
                </Flex>
              )}
            </StyledButton>
          </Flex>
        )}

        <Button className={styles.txStatusCloseButton} onClick={handleTxStatusClose}>
          Close
        </Button>
      </Box>
    </Modal>
  )
}

export default TxStatusModal
