import { useQuery } from 'react-query'
import { Token } from '@/bridge/sdk'
import { Addressish } from '@/bridge/models/Address'

async function fetchBalance(token: Token, address: string) {
  return await token.balanceOf(address)
}

const useBalance = (token?: Token, address?: Addressish) => {
  const chainId = token instanceof Token ? token.network.networkId : undefined

  const queryKey = `balance:${chainId}:${token?.address}:${address?.toString()}`

  const { isLoading, isError, data, error } = useQuery(
    [queryKey, chainId, token?.address, address?.toString()],
    async () => {
      if (token && address) {
        return await fetchBalance(token, address.toString())
      }
    },
    {
      enabled: !!chainId && !!token?.address && !!address?.toString(),
      refetchInterval: 10e3,
    }
  )

  return { loading: isLoading, isError, balance: data, error }
}

export default useBalance
