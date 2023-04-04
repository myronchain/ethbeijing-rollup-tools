package templates

type SyncTempData struct {
	Instances              []SyncInstance
	ChainId                int
	ChainName              string
	DeploymentChainNameDir string
	L1Rollup               string
	L2Rollup               string
}

type SyncInstance struct {
	Common         ConsensusCommonTempData
	L2EngineApiUrl string
	ServiceName    string
}

type ConsensusCommonTempData struct {
	L1RpcUrl string
	L1WsUrl  string
	L2RpcUrl string
	L2WsUrl  string
}

type ConsensusTempData struct {
	ChainName string

	L1ContractDeployerPk string
	RollupStartupPriv    string

	ChainId                int
	ProposerPriv           string
	ProposeBeneficiary     string
	ProverPriv             string
	RelayL1Priv            string
	RelayL2Priv            string
	DeploymentChainNameDir string
	L1RpcUrl               string
	L1WsUrl                string
	L2RpcUrl               string
	L2WsUrl                string
	L2EngineApiUrl         string
	L1Rollup               string
	L2Rollup               string
	L1Bridge               string
	L2Bridge               string
	L1Escrow               string
	L2Escrow               string
	RelayDbUrl             string
	ConsensusBaseVersion   string
}
