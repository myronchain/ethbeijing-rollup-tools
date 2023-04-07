package l2

import (
	"context"
	"encoding/json"
	"fmt"
	"os"
	"path"
	"text/template"

	"github.com/g1g2-lab/automation/pkg/db"
	"github.com/g1g2-lab/automation/templates"
	"github.com/g1g2-lab/automation/types"
	"github.com/g1g2-lab/automation/util"
	"github.com/inconshreveable/log15"
)

var (
	HttpHostnameInDockerPattern = "http://host.docker.internal:%d"
	WsHostnameInDockerPattern   = "ws://host.docker.internal:%d"

	BuildDir          = "build"
	TemplateFilesDir  = "templates/files"
	L2GenesisFileName = "l2_genesis.json"
	DockerRelayDBUrl  = "postgres://postgres:admin@host.docker.internal:5432/relay-db"
)

type RollupBuilder struct {
	ctx    context.Context
	config *L2Config
}

func NewBuilder(ctx context.Context, config *L2Config) (*RollupBuilder, error) {
	return &RollupBuilder{
		ctx,
		config,
	}, nil
}

func (i *RollupBuilder) ToContractRepoPath(filePath string) string {
	return path.Join(util.ToAbsolutePath("../contracts"), filePath)
}

func (i *RollupBuilder) DeployL1Rollup(
	rollup *types.Rollup,
	g1g2Admin G1G2Admin,
) error {
	util.PrintStepLogo("Deploy L1 contracts")
	contractRoot := i.ToContractRepoPath("packages/protocol")
	curr, _ := os.Getwd()
	defer os.Chdir(curr)
	err := os.Chdir(contractRoot)
	if err != nil {
		return err
	}
	_, err = util.ExecWrapper("yarn").Stdout()
	if err != nil {
		return err
	}
	cmd, err := i.getDeployRollupL1Cmd(rollup, g1g2Admin)
	if err != nil {
		return err
	}
	_, err = util.ExecWrapper(*cmd).Stdout()
	return err
}

// npx hardhat deploy_rollup_contracts
// --l1-rpc-url <l1RpcUrl>
// --l2-chain-id <l2ChainId>
// --rollup-version <rollupVersion>
// --l1-deployer-private-key <l1DeployerPrivateKey>
// --l2-deployer-address <l2DeployerAddress>
// --firebase-config <firebaseConfig>
// --l2-premint-accounts <l2PremintAccounts>
// --download-artifacts <downloadArtifacts>
func (i *RollupBuilder) getDeployRollupL1Cmd(
	rollup *types.Rollup,
	g1g2Admin G1G2Admin,
) (*string, error) {

	address, err := util.PrivateKeyToAddress(g1g2Admin.L1AdminPK)
	if err != nil {
		return nil, err
	}

	cmd := "npx hardhat deploy_rollup_contracts"
	cmd += fmt.Sprintf(" --l1-rpc-url %s", rollup.L1.PublicRpcUrl)
	cmd += fmt.Sprintf(" --l2-chain-id %d", rollup.ChainId)
	cmd += fmt.Sprintf(" --rollup-version %d", 1)
	cmd += fmt.Sprintf(" --l1-deployer-private-key %s", g1g2Admin.L1AdminPK)
	cmd += fmt.Sprintf(" --l2-deployer-address %s", address)

	l2PreMintAccounts := make(map[string]string)

	l2PreMintAccounts[address.String()] = g1g2Admin.RollupAdminPremintWei

	for _, w := range rollup.L2FundWallets {
		l2PreMintAccounts[w.WalletAddress] = w.AmountInWei
	}
	l2PremintAccountsJson, err := json.Marshal(l2PreMintAccounts)
	if err != nil {
		return nil, err
	}
	cmd += fmt.Sprintf(" --l2-premint-accounts '%s'", string(l2PremintAccountsJson))

	cmd += fmt.Sprintf(" --download-artifacts %t", true) //TODO(edward)
	return &cmd, nil
}

func (i *RollupBuilder) RenderNodeTemplates(
	rollup *types.Rollup,
	db *db.LocalFileDatabase,
	toDirPath string,
) error {
	util.PrintStepLogo("RENDER NODE TEMPLATES")
	initTmpl := path.Join(TemplateFilesDir, "l2_geth/init_l2_geth_tmpl.sh")
	data := templates.L2NodeTemplateData{
		ChainId:   rollup.ChainId,
		ChainName: rollup.Name,
	}
	templates.Render(initTmpl, toDirPath, data)

	err := i.WriteL2GenesisFile(rollup.L1.ChainId, rollup.ChainId, toDirPath)
	if err != nil {
		return err
	}
	return nil
}

func (i *RollupBuilder) WriteL2GenesisFile(l1ChainId, l2ChainId int, toDirPath string) error {
	util.PrintStepLogo("WRITE L2 GENESIS FILE")
	l2GenesisListFile := i.ToContractRepoPath("packages/protocol/deployments/l2_genesis.json")
	content, err := os.ReadFile(l2GenesisListFile)
	if err != nil {
		return err
	}
	var l2GenesisList []types.L2Genesis
	err = json.Unmarshal(content, &l2GenesisList)
	if err != nil {
		return err
	}
	for _, l2Genesis := range l2GenesisList {
		if l2Genesis.L1ChainId == l1ChainId && l2Genesis.L2ChainId == l2ChainId {
			err := util.WriteJSONTo(l2Genesis.Genesis, path.Join(toDirPath, L2GenesisFileName))
			if err != nil {
				return err
			}
			break
		}
	}
	return nil
}

func (i *RollupBuilder) RenderRollupTemplates(
	rollup *types.Rollup,
	toDirPath string,
) error {
	util.PrintStepLogo("RENDER ROLLUP TEMPLATES")
	dockerTmpl := path.Join(TemplateFilesDir, "rollup/docker-compose_tmpl.yaml")
	basePort := i.config.NodeConfig.BasePort
	rollupTempData := templates.RollupTempData{
		ChainName:     rollup.Name,
		L2HttpPort:    basePort,
		L2WsPort:      basePort + 1,
		L2AuthRpcPort: basePort + 2,
	}
	templates.Render(dockerTmpl, toDirPath, rollupTempData)
	return nil
}

func (i *RollupBuilder) RenderConsensusTemplates(
	rollup *types.Rollup,
	toDirPath string,
) error {
	util.PrintStepLogo("RENDER CONSENSUS TEMPLATES")
	prodDockerfileTmpl := path.Join(TemplateFilesDir, "consensus/Dockerfile_tmpl")

	consensusData := i.GenConsensusTemplateData(rollup)
	templates.Render(prodDockerfileTmpl, toDirPath, consensusData)

	return nil
}

func (i *RollupBuilder) GenConsensusTemplateData(
	rollup *types.Rollup,
) *templates.ConsensusTempData {
	l1Net := rollup.L1

	rollupAdminPk := i.config.G1G2Admin.L1AdminPK
	return &templates.ConsensusTempData{
		ChainId:              rollup.ChainId,
		ChainName:            rollup.Name,
		ProposeBeneficiary:   rollup.BeneficiaryAddress,
		L1WsUrl:              l1Net.InternalWsUrl,
		L1RpcUrl:             l1Net.InternalRpcUrl,
		L2Rollup:             types.L2RollupAddr,
		L2Bridge:             types.L2BridgeAddr,
		L2Escrow:             types.L2EscrowAddr,
		L1Rollup:             rollup.L1Rollup,
		L1Bridge:             rollup.L1Bridge,
		L1Escrow:             rollup.L1Escrow,
		L2RpcUrl:             fmt.Sprintf(HttpHostnameInDockerPattern, i.config.NodeConfig.BasePort),
		L2WsUrl:              fmt.Sprintf(WsHostnameInDockerPattern, i.config.NodeConfig.BasePort+1),
		L2EngineApiUrl:       fmt.Sprintf(HttpHostnameInDockerPattern, i.config.NodeConfig.BasePort+2),
		ProposerPriv:         rollupAdminPk,
		ProverPriv:           rollupAdminPk,
		RelayL1Priv:          rollupAdminPk,
		RelayL2Priv:          rollupAdminPk,
		RelayDbUrl:           DockerRelayDBUrl,
		ConsensusBaseVersion: i.config.DockerImageConfig.ConsensusBase,
	}
}

func (i *RollupBuilder) RunRollup(dir string) error {
	util.PrintStepLogo("RUN L2 NODE")
	os.Setenv("DOCKER_BUILDKIT", "1")
	curr, _ := os.Getwd()
	os.Chdir(dir)

	dockerCompose := path.Join(dir, "docker-compose.yaml")
	log15.Info("docker-compose", "path", dockerCompose)

	_, err := util.ExecWrapper(fmt.Sprintf("docker compose -f %s up -d --build", dockerCompose)).Stdout()
	if err != nil {
		log15.Info("L2", "error", err)
		return err
	}
	os.Chdir(curr)
	return nil
}

func (i *RollupBuilder) StopRollup(dir string) error {
	util.PrintStepLogo("STOP ROLLUP")
	os.Setenv("DOCKER_BUILDKIT", "1")

	curr, _ := os.Getwd()
	os.Chdir(dir)

	_, err := util.ExecWrapper("docker compose down -v").Stdout()
	if err != nil {
		log15.Info("G1G2", "error", err)
		return err
	}
	os.Chdir(curr)
	return nil
}

func (i *RollupBuilder) BuildL2(
	inDir string,
	rollup *types.Rollup,
) error {
	name := "Dockerfile"
	l2DockerFile := path.Join(inDir, name)
	err := i.renderL2DockerFile(l2DockerFile)
	return err
}

func (i *RollupBuilder) renderL2DockerFile(filePath string) error {
	tmpl, err := template.New("l2").Parse(templates.ExecutionClientTemplate)
	if err != nil {
		return err
	}
	file, err := os.OpenFile(filePath, os.O_RDWR|os.O_CREATE|os.O_TRUNC, 0600)
	if err != nil {
		return err
	}

	err = tmpl.Execute(file, map[string]string{
		"Version": i.config.DockerImageConfig.ExecutionBase,
	})
	return err
}
