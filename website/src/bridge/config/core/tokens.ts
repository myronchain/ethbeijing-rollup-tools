interface Token {
  symbol: string
  name: string
  decimals: number
  image: string
}

interface Tokens {
  [key: string]: Token
}

export const tokens: Tokens = {
  ETH: {
    symbol: 'ETH',
    name: 'Ethereum',
    decimals: 18,
    image: "/images/bridge/eth.svg"
  },
  TestUSDC: {
    symbol: 'TestUSDC',
    name: 'Test USD Coin',
    decimals: 18,
    image: "/images/bridge/usdc.svg"
  }
}
