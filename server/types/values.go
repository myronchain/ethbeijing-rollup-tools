package types

type RollupValues struct {
	RollupName string `yaml:"rollupName"`
	// Caddy      Caddy    `yaml:"caddy"`
	// Explorer   Explorer `yaml:"explorer"`
	// Faucet Faucet `yaml:"faucet"`
	// Postgres  Postgres `yaml:"postgres"`
	// Portal    Portal   `yaml:"portal"`
	// ToolImage string   `yaml:"toolImage"`
	// Diesel Diesel   `yaml:"diesel"`
	L1             L1Values             `yaml:"l1"`
	L2             L2Values             `yaml:"l2"`
	Gke            GkeValues            `yaml:"gke"`
	ResourceConfig ResourceConfigValues `yaml:"resourceConfig"`
}

type RollupConfig struct {
	Name string `yaml:"name"`
}

type Image struct {
	Registry         string `yaml:"registry"`
	PullPolicy       string `yaml:"pullPolicy"`
	Tag              string `yaml:"tag"`
	GcpDockerConfig  string `yaml:"gcpDockerConfig"`
	Dockerconfigjson string `yaml:"dockerconfigjson"`
}

type ImagePullSecrets struct {
	Name string `yaml:"name"`
}

type Explorer struct {
	Image string `yaml:"image"`
}

type Caddy struct {
	Image string `yaml:"image"`
}

type Postgres struct {
	Image           string `yaml:"image"`
	RelayDbPassword string `yaml:"relayDbPassword"`
	RelayDbPort     uint   `yaml:"relayDbPort"`
}

type Portal struct {
	GeneratorImage string `yaml:"generatorImage"`
	Port           uint   `yaml:"port"`
}

type KubectlClient struct {
	Image string `yaml:"image"`
}

type Diesel struct {
	Image string `yaml:"image"`
}

type TxGenerator struct {
	PrivateKey string `yaml:"privateKey"`
	Address    string `yaml:"address"`
}

type ContractDeployer struct {
	PrivateKey string `yaml:"privateKey"`
	Address    string `yaml:"address"`
}

type L1Values struct {
	ChainId        uint   `yaml:"chainId"`
	PublicRpcUrl   string `yaml:"publicRpcUrl"`
	InternalRpcUrl string `yaml:"internalRpcUrl"`
	PublicWsUrl    string `yaml:"publicWebsocketUrl"`
	InternalWsUrl  string `yaml:"internalWebsocketUrl"`
	ExplorerUrl    string `yaml:"explorerUrl"`
	UseInternalUrl bool   `yaml:"useInternalUrl"`
}

type Private struct {
	Enabled      bool    `yaml:"enabled"`
	Image        string  `yaml:"image"`
	ChainId      uint    `yaml:"chainId"`
	NetworkName  string  `yaml:"networkName"`
	Faucet       Faucet  `yaml:"faucet"`
	Genesis      Genesis `yaml:"genesis"`
	DataDir      string  `yaml:"dataDir"`
	HttpPort     uint    `yaml:"httpPort"`
	WsPort       uint    `yaml:"wsPort"`
	ExplorerPort uint    `yaml:"explorerPort"`
}

type Faucet struct {
	PublicUrl string `yaml:"publicUrl"`
}

type Genesis struct {
	CliquePeriod uint   `yaml:"cliquePeriod"`
	GasLimit     string `yaml:"gasLimit"`
	Timestamp    string `yaml:"timestamp"`
}

type L2Values struct {
	NodeImage          string   `yaml:"nodeImage"`
	Replicas           uint     `yaml:"replicas"`
	ConsensusImage     string   `yaml:"consensusImage"`
	ChainId            uint     `yaml:"chainId"`
	Proposer           Proposer `yaml:"proposer"`
	Prover             Prover   `yaml:"prover"`
	Relayer            Relayer  `yaml:"relayer"`
	BridgePremintEther uint     `yaml:"bridgePremintEther"`
	DataDir            string   `yaml:"dataDir"`
}

type RollupStartup struct {
	PrivateKey string `yaml:"privateKey"`
	Address    string `yaml:"address"`
	BalanceDec uint   `yaml:"balanceDec"`
}

type Proposer struct {
	PrivateKey  string `yaml:"privateKey"`
	Beneficiary string `yaml:"beneficiary"`
	Address     string `yaml:"address"`
	// Interval    uint   `yaml:"interval"`
}

type Prover struct {
	PrivateKey string `yaml:"privateKey"`
	Address    string `yaml:"address"`
}

type Relayer struct {
	L1PrivateKey string `yaml:"l1PrivateKey"`
	L1Address    string `yaml:"l1Address"`
	L2PrivateKey string `yaml:"l2PrivateKey"`
	L2Address    string `yaml:"l2Address"`
}

type Contract struct {
	Image string `yaml:"image"`
}

type GkeValues struct {
	Enabled  bool   `yaml:"enabled"`
	StaticIP string `yaml:"staticIP"`
}

type ResourceConfigValues struct {
	Enabled bool `yaml:"enabled"`
}
