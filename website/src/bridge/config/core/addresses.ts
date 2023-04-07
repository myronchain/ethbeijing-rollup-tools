import { Bridges } from "./types"

type Addresses = {
  bridges: Bridges
}

export const addresses: Addresses = {
  bridges: {
    ETH: {
      ethereum: {
        l1CanonicalToken: '0x0000000000000000000000000000000000000000',
      },
      g1g2: {
        l2CanonicalToken: '0x0000000000000000000000000000000000000000',
      }
    },
    // TestUSDC: {
    //   ethereum: {
    //     // TODO(edward) get TestUSDC address from deploy outputs
    //     l1CanonicalToken: '0xe1cA192D1400143650E035B581f0B3a27914F7BE',
    //   },
    //   g1g2: {
    //     // TODO(edward) when TestUSDC is transferred from L1 to L2 the first time, the bridged TestUSDC will be deployed on L2.
    //     // You can call L2Escrow.l2Tokens(l1_TestUSDC_address) to get address of the bridged TestUSDC
    //     l2CanonicalToken: '0x1a193A0c93f5aaae14cF0B4Fd40618bB7D8335c7',
    //   }
    // }
  }
}
