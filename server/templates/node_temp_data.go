package templates

type L2NodeTemplateData struct {
	ChainId                int
	ChainName              string
	DeploymentChainNameDir string
	BootnodeKeyHex         string
	BootnodeAddress        string
	Instances              []L2InstanceTemplateData
}

type L2InstanceTemplateData struct {
	L2HttpPort    int
	L2WsPort      int
	L2AuthRpcPort int
	ServiceName   string
}
