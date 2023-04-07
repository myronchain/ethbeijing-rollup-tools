import { addresses as baseAddresses } from '@/bridge/config/core/addresses'
import { HopAddresses } from './interfaces'

const MainNetworkId = 1

const addresses: HopAddresses = {
  tokens: baseAddresses.bridges,
}

let enabledTokens: string | string[] | undefined = process.env.REACT_APP_ENABLED_TOKENS
if (enabledTokens) {
  enabledTokens = enabledTokens.split(',').map(x => x.trim())
  const filteredAddresses: { [key: string]: any } = {}
  for (const enabledToken of enabledTokens) {
    if (addresses.tokens[enabledToken]) {
      filteredAddresses[enabledToken] = addresses.tokens[enabledToken]
    }
  }
  addresses.tokens = filteredAddresses
}

if (process.env.NODE_ENV !== 'test') {
  console.debug('Welcome 🐰')
  console.debug('ui version:', process.env.REACT_APP_GIT_SHA)
  console.debug('config addresses:', addresses.tokens)
}

const blocknativeDappid = process.env.REACT_APP_BNC_DAPP_ID

export {
  addresses,
  blocknativeDappid,
  MainNetworkId
}
