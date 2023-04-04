package l2

import (
	"context"
	"encoding/json"
	"fmt"
	"os"
	"path"
	"strconv"
	"text/template"

	"github.com/g1g2-lab/automation/pkg/db"
	"github.com/g1g2-lab/automation/templates"
	"github.com/g1g2-lab/automation/types"
	"github.com/g1g2-lab/automation/util"
	"github.com/inconshreveable/log15"
)

type pathFunc func(string) string

var (
	// defined hardhat.config.js
	L1HardhatNetworkNameForLocalDev string = "l1test"
	L2HardhatNetworkNameForLocalDev string = "l2test"
)

var (
	BootNodeKeyHexForDev     = "4a7137c699b2aae3ac810542bd0d66643e9714ea5692853b5eda9056e85647b3"
	BootNodeKeyAddressForDev = "0918f82121c5d22c28a9f73e486273cb303c83879a27824bc7fcabd6a9e7549bc6834ba269048af1bac622fb6d2f849e578b28f33e45c02235a3880dce6a6b6e"
)

var (
	HttpHostnameInDockerPattern = "http://host.docker.internal:%d"
	WsHostnameInDockerPattern   = "ws://host.docker.internal:%d"

	JwtSecretFile       = "jwtSecret"
	L1GethContainerName = "l1_geth"
	DeploymentsDirName  = "deployments"

	BuildDir          = "build"
	TemplateFilesDir  = "templates/files"
	HelmDeployDir     = "deploy"
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

func (i *RollupBuilder) SetConsensusEnv() error {
	os.Setenv("DOCKER_BUILDKIT", "1")
	home, err := os.UserHomeDir()
	if err != nil {
		return err
	}
	buf, err := os.ReadFile(fmt.Sprintf("%s/.ssh/%s", home, i.config.G1G2Admin.GitHubPrivateKeyId))
	if err != nil {
		return err
	}
	return os.Setenv("SSH_PRIVATE_KEY", string(buf))
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
	firebaseConfigFilePath := util.ToAbsolutePath(g1g2Admin.FirebaseConfigFile)
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
	cmd, err := i.getDeployRollupL1Cmd(rollup, g1g2Admin, firebaseConfigFilePath)
	if err != nil {
		return err
	}
	_, err = util.ExecWrapper(*cmd).Stdout()
	return err
}

func (i *RollupBuilder) ClearL1DeployData(g1g2Admin G1G2Admin, chainId int) error {
	util.PrintStepLogo("CLEAR L1 DEPLOY DATA")
	curDir, _ := os.Getwd()
	contractDir := i.ToContractRepoPath("packages/protocol")
	// firebaseConfigFilePath := util.ToAbsolutePath(g1g2Admin.FirebaseConfigFile)
	os.Chdir(contractDir)
	defer os.Chdir(curDir)
	// firebaseConfigJson, _ := i.firebaseConfigJson(firebaseConfigFilePath)
	// cmd := fmt.Sprintf("npx hardhat clear_deploy_data --clear-type l1 --l1-chain-id %d --firebase-config '%s'", chainId, firebaseConfigJson)
	// util.ExecWrapper(cmd).Stdout()
	return nil
}

func (i *RollupBuilder) ClearL2DeployData(g1g2Admin G1G2Admin, rollup *types.Rollup) error {
	util.PrintStepLogo("CLEAR CONTRACTS DATA")
	curDir, _ := os.Getwd()
	contractDir := i.ToContractRepoPath("packages/protocol")
	// firebaseConfigFilePath := util.ToAbsolutePath(g1g2Admin.FirebaseConfigFile)
	os.Chdir(contractDir)
	defer os.Chdir(curDir)
	// l1ChainId := rollup.L1.ChainId
	// l2ChainId := rollup.ChainId
	// firebaseConfigJson, _ := i.firebaseConfigJson(firebaseConfigFilePath)
	// cmd := fmt.Sprintf("npx hardhat clear_deploy_data --clear-type l2 --l1-chain-id %d --l2-chain-id %d --firebase-config '%s'", l1ChainId, l2ChainId, firebaseConfigJson)
	// util.ExecWrapper(cmd).Stdout()
	return nil
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
	firebaseConfigFiePath string,
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

	// firebaseConfigJson, err := i.firebaseConfigJson(firebaseConfigFiePath)
	// if err != nil {
	// 	return nil, err
	// }
	// cmd += fmt.Sprintf(" --firebase-config '%s'", firebaseConfigJson)

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
	dockerFileTmpl := path.Join(TemplateFilesDir, "l2_geth/Dockerfile_tmpl")
	dockerDevFileTmpl := path.Join(TemplateFilesDir, "l2_geth/Dockerfile_dev_tmpl")
	initTmpl := path.Join(TemplateFilesDir, "l2_geth/init_l2_geth_tmpl.sh")
	dockerComposeTmpl := path.Join(TemplateFilesDir, "l2_geth/docker-compose_tmpl.yaml")
	bootnodeTmpl := path.Join(TemplateFilesDir, "l2_geth/init_l2_bootnode_tmpl.sh")
	instances := []templates.L2InstanceTemplateData{}
	basePort := i.config.NodeConfig.BasePort

	for index := 0; index < i.config.NodeConfig.Replicas; index++ {
		d := templates.L2InstanceTemplateData{
			ServiceName:   rollup.Name + "-" + strconv.Itoa(index) + "-node",
			L2HttpPort:    basePort + index*3,
			L2WsPort:      basePort + index*3 + 1,
			L2AuthRpcPort: basePort + index*3 + 2,
		}
		instances = append(instances, d)
	}

	data := templates.L2NodeTemplateData{
		ChainId:                rollup.ChainId,
		ChainName:              rollup.Name,
		DeploymentChainNameDir: path.Join(DeploymentsDirName, rollup.Name),
		Instances:              instances,
		BootnodeKeyHex:         BootNodeKeyHexForDev,
		BootnodeAddress:        BootNodeKeyAddressForDev,
	}

	templates.Render(dockerFileTmpl, toDirPath, data)
	templates.Render(dockerDevFileTmpl, toDirPath, data)
	templates.Render(initTmpl, toDirPath, data)
	templates.Render(dockerComposeTmpl, toDirPath, data)
	templates.Render(bootnodeTmpl, toDirPath, data)
	return nil
}

func (i *RollupBuilder) RenderConsensusTemplates(
	rollup *types.Rollup,
	toDirPath string,
) error {
	util.PrintStepLogo("RENDER CONSENSUS TEMPLATES")
	dockerFileTmpl := path.Join(TemplateFilesDir, "consensus/Dockerfile_tmpl")
	prodDockerfileTmpl := path.Join(TemplateFilesDir, "consensus/Dockerfile_prod_tmpl")
	dockerComposeTmpl := path.Join(TemplateFilesDir, "consensus/docker-compose_tmpl.yaml")
	syncComposeTmpl := path.Join(TemplateFilesDir, "consensus/docker-compose-sync_tmpl.yaml")
	runTestTmpl := path.Join(TemplateFilesDir, "consensus/run_consensus_test_tmpl.sh")
	runConsensusTmpl := path.Join(TemplateFilesDir, "consensus/run_consensus_tmpl.sh")

	syncData, err := i.GenSyncTemplateData(rollup)
	if err != nil {
		return err
	}

	consensusData := i.GenConsensusTemplateData(rollup)
	// sync
	templates.Render(syncComposeTmpl, toDirPath, syncData)
	// TODO (eric) seperate propose/prove/relay
	templates.Render(dockerFileTmpl, toDirPath, consensusData)
	templates.Render(prodDockerfileTmpl, toDirPath, consensusData)
	templates.Render(dockerComposeTmpl, toDirPath, consensusData)
	templates.Render(runTestTmpl, toDirPath, consensusData)
	templates.Render(runConsensusTmpl, toDirPath, consensusData)

	return nil
}

func (i *RollupBuilder) GenConsensusTemplateData(
	rollup *types.Rollup,
) *templates.ConsensusTempData {
	l1Net := rollup.L1

	rollupAdminPk := i.config.G1G2Admin.L1AdminPK
	return &templates.ConsensusTempData{
		ChainId:                rollup.ChainId,
		ChainName:              rollup.Name,
		DeploymentChainNameDir: path.Join(DeploymentsDirName, rollup.Name),
		ProposeBeneficiary:     rollup.BeneficiaryAddress,
		L1WsUrl:                l1Net.InternalWsUrl,
		L1RpcUrl:               l1Net.InternalRpcUrl,
		// defined in contracts constants
		L2Rollup: types.L2RollupAddr,
		L2Bridge: types.L2BridgeAddr,
		L2Escrow: types.L2EscrowAddr,

		L1Rollup: rollup.L1Rollup,
		L1Bridge: rollup.L1Bridge,
		L1Escrow: rollup.L1Escrow,

		// test only. TODO (eric) deleted
		L1ContractDeployerPk: rollupAdminPk,
		RollupStartupPriv:    rollupAdminPk,

		L2RpcUrl:       fmt.Sprintf(HttpHostnameInDockerPattern, i.config.NodeConfig.BasePort),
		L2WsUrl:        fmt.Sprintf(WsHostnameInDockerPattern, i.config.NodeConfig.BasePort+1),
		L2EngineApiUrl: fmt.Sprintf(HttpHostnameInDockerPattern, i.config.NodeConfig.BasePort+2),

		ProposerPriv: rollupAdminPk,
		ProverPriv:   rollupAdminPk,
		RelayL1Priv:  rollupAdminPk,
		RelayL2Priv:  rollupAdminPk,
		RelayDbUrl:   DockerRelayDBUrl,

		ConsensusBaseVersion: i.config.DockerImageConfig.ConsensusBase,
	}
}

func (i *RollupBuilder) GenSyncTemplateData(
	rollup *types.Rollup,
) (*templates.SyncTempData, error) {
	instances := []templates.SyncInstance{}
	basePort := i.config.NodeConfig.BasePort

	l1 := rollup.L1
	for index := 0; index < i.config.NodeConfig.Replicas; index++ {

		l2Rpc := fmt.Sprintf(HttpHostnameInDockerPattern, basePort+index*3)
		l2Ws := fmt.Sprintf(WsHostnameInDockerPattern, basePort+index*3+1)
		l2Auth := fmt.Sprintf(HttpHostnameInDockerPattern, basePort+index*3+2)

		d := templates.SyncInstance{
			ServiceName:    "sync-" + strconv.Itoa(index),
			L2EngineApiUrl: l2Auth,
			Common: templates.ConsensusCommonTempData{
				L1RpcUrl: l1.InternalRpcUrl,
				L1WsUrl:  l1.InternalWsUrl,
				L2RpcUrl: l2Rpc,
				L2WsUrl:  l2Ws,
			},
		}
		instances = append(instances, d)
	}
	data := &templates.SyncTempData{
		ChainId:                rollup.ChainId,
		ChainName:              rollup.Name,
		DeploymentChainNameDir: path.Join(DeploymentsDirName, rollup.Name),
		Instances:              instances,
		L1Rollup:               rollup.L1Rollup,
		L2Rollup:               rollup.L2Rollup,
	}
	return data, nil
}

func (i *RollupBuilder) RunRollup(build bool, dir string) error {
	util.PrintStepLogo("RUN L2 NODE")
	os.Setenv("DOCKER_BUILDKIT", "1")

	rebuildFlag := ""
	if build {
		rebuildFlag = "--build"
	}
	curr, _ := os.Getwd()
	os.Chdir(dir)

	dockerCompose := path.Join(dir, "docker-compose.yaml")
	log15.Info("docker-compose", "path", dockerCompose)

	_, err := util.ExecWrapper(fmt.Sprintf("docker compose -f %s up -d %s", dockerCompose, rebuildFlag)).Stdout()
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

	_, err := util.ExecWrapper(fmt.Sprintf("docker compose down -v")).Stdout()
	if err != nil {
		log15.Info("G1G2", "error", err)
		return err
	}
	os.Chdir(curr)
	return nil
}

func (i *RollupBuilder) BuildL2(
	tag string,
	push bool,
	inDir string,
	rollup *types.Rollup,
) (string, error) {
	name := "Dockerfile.execution.release"
	l2DockerFile := path.Join(inDir, name)
	err := i.renderL2DockerFile(tag, l2DockerFile)
	if err != nil {
		return "", err
	}
	imageTag := i.l2DockerImageUrl(rollup.Name, tag)
	log15.Info("starting build l2 docker with tag", "tag", imageTag)
	_, err = util.ExecWrapper(
		fmt.Sprintf("%s -f %s -t %s %s", i.dockerBuildCmd(push), l2DockerFile, imageTag, inDir),
	).Stdout()

	if err != nil {
		return "", err
	}

	if i.config.IsKubeContextEqualMicrok8s() {
		if _, err = i.exportImgToMicroK8s(imageTag); err != nil {
			return "", err
		}
	}

	log15.Info("Build l2 docker image finished", "tag", imageTag)
	return imageTag, err
}

func (i *RollupBuilder) renderL2DockerFile(tag string, filePath string) error {
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

func (i *RollupBuilder) dockerBuildCmd(push bool) string {
	arg := ""

	if i.config.IsKubeContextEqualMicrok8s() {
		return "docker buildx build --builder RollupBuilder --load"
		//return "docker buildx build --load"
	} else {
		if push {
			arg = "--push"
		}
		return fmt.Sprintf("docker buildx build --builder RollupBuilder --output=type=registry,registry.insecure=false --platform linux/amd64,linux/arm64 %s", arg)
	}
}

func (i *RollupBuilder) BuildConsensus(
	tag string,
	push bool,
	db *db.LocalFileDatabase,
	inDir string,
	rollup *types.Rollup,
) (string, error) {
	consensusDockerFile := path.Join(inDir, "Dockerfile_prod")
	imageTag := i.consensusDockerImageUrl(rollup.Name, tag)
	log15.Info("starting build consensus docker image with", "tag", imageTag)
	_, err := util.ExecWrapper(
		fmt.Sprintf("%s -f %s -t %s %s", i.dockerBuildCmd(push), consensusDockerFile, imageTag, inDir),
	).Stdout()

	if err != nil {
		return "", err
	}
	if i.config.IsKubeContextEqualMicrok8s() {
		if _, err = i.exportImgToMicroK8s(imageTag); err != nil {
			return "", err
		}
	}
	return imageTag, err
}

func (i *RollupBuilder) InitGcloudWithCredientialFile(fileName string) error {
	_, err := util.ExecWrapper(
		fmt.Sprintf("gcloud auth activate-service-account --key-file %s", fileName)).Stdout()
	return err
}

func (i *RollupBuilder) l2DockerImageUrl(chainName, tag string) string {
	return i.toDockerImageUrl("execution-client", chainName, tag)
}

func (i *RollupBuilder) consensusDockerImageUrl(chainName, tag string) string {
	return i.toDockerImageUrl("consensus-client", chainName, tag)
}

func (i *RollupBuilder) toDockerImageUrl(name, chainName, tag string) string {
	// currently we use gcp g1g2-db990/common repository
	repoUrl := "common"
	return fmt.Sprintf("%s/%s:%s-%s", repoUrl, name, chainName, tag)
}

func (i *RollupBuilder) exportImgToMicroK8s(imageTag string) (string, error) {
	_, err := util.ExecWrapper("docker save " + imageTag + " -o tmp.tar").Stdout()
	if err != nil {
		return "", err
	}
	_, err = util.ExecWrapper("microk8s ctr image import tmp.tar").Stdout()
	if err != nil {
		return "", err
	}
	_, err = util.ExecWrapper("rm -rf tmp.tar").Stdout()
	if err != nil {
		return "", err
	}
	return "", nil
}
