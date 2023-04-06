package types

type L1Proxies struct {
	AddressManager    string `json:"AddressManager"`
	L1Rollup          string `json:"L1Rollup"`
	CrossChainChannel string `json:"CrossChainChannel"`
	L1Escrow          string `json:"L1Escrow"`
}

type L2Proxies struct {
	AddressManager    string `json:"AddressManager"`
	L2Rollup          string `json:"L2Rollup"`
	CrossChainChannel string `json:"CrossChainChannel"`
	L2Escrow          string `json:"L2Escrow"`
}

type RollupContracts struct {
	L1ChainId int       `json:"L1ChainId"`
	L2ChainId int       `json:"L2ChainId"`
	Version   int       `json:"Version"`
	L1Proxies L1Proxies `json:"L1Proxies"`
	L2Proxies L2Proxies `json:"L2Proxies"`
}
