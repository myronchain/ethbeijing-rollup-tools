package types

type L1Net struct {
	Name           string `yaml:"name" json:"name" validate:"required"`
	ChainId        int    `yaml:"chain_id" json:"chain_id"`
	PublicRpcUrl   string `yaml:"public_rpc" json:"public_rpc"`
	PublicWsUrl    string `yaml:"public_ws" json:"public_ws"`
	InternalRpcUrl string `yaml:"internal_rpc" json:"internal_rpc"`
	InternalWsUrl  string `yaml:"internal_ws" json:"internal_ws"`
	ExplorerUrl    string `yaml:"explorer" json:"explorer"`
}

var (
	G1G2DockerDevL1 = L1Net{
		Name:           "G1G2DockerDev",
		ChainId:        10400,
		PublicRpcUrl:   "http://127.0.0.1:10545",
		PublicWsUrl:    "ws://127.0.0.1:10546",
		InternalRpcUrl: "http://host.docker.internal:10545",
		InternalWsUrl:  "ws://host.docker.internal:10546",
		ExplorerUrl:    "http://localhost:4001",
	}
)
