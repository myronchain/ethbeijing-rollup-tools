import React, { useMemo } from 'react'
import { Div, Flex } from '@/bridge/components/ui'
import RightArrow from '@material-ui/icons/ArrowRightAlt'
import { TransactionStatus, useTxStatusStyles } from '@/bridge/components/Transaction'

function TxStatusTracker({ tx, completed, destCompleted, confirmations, networkConfirmations }) {
  const styles = useTxStatusStyles()
  const network = useMemo(() => tx.srcNetwork, [tx])

  return (
    <Div mb={4}>
      {/*TODO(edward) hide dest transaction status temporarily*/}
      {false && (
        <Flex justifyAround alignCenter>
          {network && (
            <Flex column alignCenter textAlign="center" width="5em">
              {/* <Icon src={network?.imageUrl} /> */}
              {/* <Div>{network.name}</Div> */}
              <Div mt={2}>Source</Div>
            </Flex>
          )}
          {tx.destNetworkName !== tx.networkName && (
            <Flex column alignCenter textAlign="center" width="5em">
              {/* <Icon src={destNetwork?.imageUrl} /> */}
              {/* <Div>{destNetwork?.name}</Div> */}
              <Div mt={2}>Destination</Div>
            </Flex>
          )}
        </Flex>
      )
      }

      <Flex justifyContent="space-evenly" alignCenter mt={3}>
        <TransactionStatus
          txConfirmed={completed}
          link={tx.explorerLink}
          srcNetwork={tx.srcNetwork}
          destNetwork={tx.destNetwork}
          styles={styles}
          confirmations={confirmations}
          networkWaitConfirmations={networkConfirmations}
        />

        {/*TODO(edward) hide dest transaction status temporarily*/}
        {false && tx.destNetworkName !== tx.networkName && (
          <>
            <div>
              <RightArrow fontSize="large" color="primary" />
            </div>
            <TransactionStatus
              srcConfirmed={completed}
              txConfirmed={destCompleted}
              link={tx.destExplorerLink}
              srcNetwork={tx.srcNetwork}
              destNetwork={tx.destNetwork}
              destTx
              styles={styles}
            />
          </>
        )}
      </Flex>
    </Div>
  )
}

export default TxStatusTracker
