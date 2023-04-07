import React, { useEffect } from 'react'
import Link from '@material-ui/core/Link'
import RightArrow from '@material-ui/icons/ArrowRightAlt'
import Transaction from '@/bridge/models/Transaction'
import { Flex } from '../ui'
import useTransactionStatus from '@/bridge/hooks/useTransactionStatus'
import TransactionStatus from './TransactionStatus'
import { isOlderThanOneHour } from '@/bridge/utils'

function TransactionRow({ tx, styles, rmTx }: { tx: Transaction; styles: any; rmTx: any }) {
  const {
    completed,
    destCompleted,
    confirmations,
    networkConfirmations,
    replaced,
  } = useTransactionStatus(tx, tx.srcNetwork)

  useEffect(() => {
    if (replaced) {
      if (isOlderThanOneHour(replaced.timestampMs)) {
        return rmTx(replaced)
      }
    }
  }, [replaced])

  return (
    <Flex justifyBetween mb=".5rem" alignCenter marginBottom="1rem" paddingBottom="1rem">
      <Flex flexDirection="column" alignItems="flex-start" width="50%">
        <div>
          <span className={styles.network}>{tx.srcNetwork.name}:</span>
          <Link href={tx.explorerLink} target="_blank" rel="noopener noreferrer">
            {tx.truncatedHash} ↗
          </Link>
        </div>
        <div>
          {tx.methodName && <small className={styles.methodName}>({tx.methodName})</small>}
        </div>
      </Flex>

      <Flex justifyContent="space-between" alignItems="center" width="50%">
        <TransactionStatus
          txConfirmed={completed}
          link={tx.explorerLink}
          srcNetwork={tx.srcNetwork}
          destNetwork={tx.destNetwork}
          styles={styles}
          showConfirmations
          confirmations={confirmations}
          networkWaitConfirmations={networkConfirmations}
        />

        {/*TODO(edward) hide dest transaction status temporarily */}
        {false && tx.destNetwork && (tx.srcNetwork !== tx.destNetwork) &&
        <>
          <div><RightArrow fontSize="large" color="primary" /></div>
          <TransactionStatus
            srcConfirmed={completed}
            txConfirmed={destCompleted}
            link={tx.destExplorerLink}
            srcNetwork={tx.srcNetwork}
            destNetwork={tx.destNetwork}
            destTx
            styles={styles}
          />
      </>}
      </Flex>
    </Flex>
  )
}

export default TransactionRow
