export type Bridges = {
  [tokenSymbol: string]: Partial<{
    ethereum: {
      l1CanonicalToken: string
    }
    g1g2: {
      l2CanonicalToken: string
    },
  }>
}
