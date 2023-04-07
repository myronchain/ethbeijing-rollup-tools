import { useCallback, useState } from 'react'
import { Token } from '@/bridge/sdk'
import { useApp } from '@/bridge/contexts/AppContext'
import { useWeb3Context } from '@/bridge/contexts/Web3Context'
import { wait } from '@/bridge/utils'
import Network from '@/bridge/models/Network'

interface AddTokenToMetamask {
  addToken: (network: Network) => void
  addTokenToDestNetwork: () => void
  success?: boolean
}

export function useAddTokenToMetamask(
  token?: Token | null,
  destNetwork?: Network | null
): AddTokenToMetamask {
  const { sdk } = useApp()
  const { connectedNetworkId, provider } = useWeb3Context()
  const [success, setSuccess] = useState<boolean>(false)

  const addToken = useCallback(
    (network: Network) => {
      if (provider && token && sdk && destNetwork) {
        const { symbol, image, decimals } = token
        const params = {
          type: 'ERC20',
          options: {
            address: sdk.getL2CanonicalTokenAddress(symbol, network.name), // TODO
            symbol,
            decimals,
            image,
          },
        }

        provider
          .send('wallet_watchAsset', params as any)
          .then(() => setSuccess(true))
          .catch(() => setSuccess(false))
      } else {
        setSuccess(false)
      }
    },
    [token, provider, connectedNetworkId]
  )

  const addTokenToDestNetwork = useCallback(async () => {
    if (provider && token && destNetwork) {
      if (destNetwork.networkId !== token.network.networkId) {
        await provider.send('wallet_switchEthereumChain', [
          {
            chainId: `0x${Number(destNetwork.networkId).toString(16)}`,
          },
        ])
      }

      await wait(1500)
      await addToken(token.network)
    } else {
      setSuccess(false)
    }
  }, [provider, token, destNetwork])

  return { addToken, addTokenToDestNetwork, success }
}
