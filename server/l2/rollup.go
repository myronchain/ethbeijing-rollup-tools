package l2

import (
	"context"
	"fmt"
	"os"
	"path"
	"time"

	"github.com/g1g2-lab/automation/pkg/db"
	"github.com/g1g2-lab/automation/types"
	"github.com/g1g2-lab/automation/util"
	"github.com/inconshreveable/log15"
)

func CreateRollup(
	ctx context.Context,
	config *L2Config,
	request *types.CreateRollupRequest,
	db *db.LocalFileDatabase,
) (*types.Rollup, error) {

	builder, err := NewBuilder(ctx, config)
	if err != nil {
		return nil, err
	}

	rollup := rollupFromRequest(request)
	rollup.Step = types.RollupDeployOnL1
	rollup.Status = "deploy to l1"
	err = db.CreateRollup(rollup)
	if err != nil {
		return nil, err
	}

	err = createRollupImpl(rollup, builder, db, config)

	return rollup, err
}

func createRollupImpl(
	rollup *types.Rollup,
	builder *RollupBuilder,
	db *db.LocalFileDatabase,
	config *L2Config,
) error {
	// render node templates
	nodeBuildDir := path.Join(util.ToAbsolutePath(BuildDir), rollup.Name, "l2_geth")
	err := os.MkdirAll(nodeBuildDir, 0755)
	if err != nil {
		return err
	}
	// step1: deploy l1 rollup && generate l2 genesis
	err = DeployL1Rollup(rollup, builder, db, config.G1G2Admin)
	if err != nil {
		return err
	} else {
		rollup.Status = "deployed on L1 successfully"
		rollup.Step = types.BuildExecutionImage
		db.UpdateRollup(rollup)
	}

	err = builder.RenderNodeTemplates(rollup, db, nodeBuildDir)
	if err != nil {
		return err
	}

	//step2: build l2 docker image
	err = builder.BuildL2(nodeBuildDir, rollup)

	if err != nil {
		return err
	} else {
		rollup.Step = types.BuildSequencerImage
		db.UpdateRollup(rollup)
		if err != nil {
			return err
		}
	}

	// step3: build consensus
	consensusBuildDir := path.Join(util.ToAbsolutePath(BuildDir), rollup.Name, "consensus")
	err = os.MkdirAll(consensusBuildDir, 0755)
	if err != nil {
		return err
	}
	err = builder.RenderConsensusTemplates(rollup, consensusBuildDir)
	if err != nil {
		return err
	}

	// step4: render docker compose
	dockerDir := path.Join(util.ToAbsolutePath(BuildDir), rollup.Name)
	err = builder.RenderRollupTemplates(rollup, dockerDir)
	if err != nil {
		return err
	}
	return nil
}

func RunRollup(
	config *L2Config,
	rollup *types.Rollup,
	db *db.LocalFileDatabase,
) error {
	builder, err := NewBuilder(context.Background(), config)
	if err != nil {
		return err
	}
	rollupDir := path.Join(util.ToAbsolutePath(BuildDir), rollup.Name)
	builder.RunRollup(rollupDir)

	l2PubRpcUrl := fmt.Sprintf("http://127.0.0.1:%d", config.NodeConfig.BasePort)
	log15.Info("L2 info: ", "rpc", l2PubRpcUrl)

	// waiting l2 running
	waitingL2Running(l2PubRpcUrl)

	rollup.Step = types.Online
	rollup.RpcUrl = l2PubRpcUrl
	err = db.UpdateRollup(rollup)
	return err
}

func waitingL2Running(l2Rpc string) {
	for {
		genesisHash, err := util.ExecWrapper(fmt.Sprintf("cast block 0 hash --rpc-url=%s", l2Rpc)).String()
		if err != nil {
			log15.Info("get genesis hash error", "err", err)
			time.Sleep(time.Second * 5)
			continue
		}
		log15.Info("L2 is running...", "genesis hash", genesisHash)
		return
	}
}

func StopRollupByName(
	ctx context.Context,
	config *L2Config,
	rollupName string,
	db *db.LocalFileDatabase,
) error {
	builder, err := NewBuilder(ctx, config)
	if err != nil {
		return err
	}
	rollupDir := path.Join(util.ToAbsolutePath(BuildDir), rollupName)
	err = builder.StopRollup(rollupDir)
	if err != nil {
		return err
	}
	err = db.DeleteRollup(rollupName)
	return err
}

func rollupFromRequest(request *types.CreateRollupRequest) *types.Rollup {
	return &types.Rollup{
		Name:               request.Name,
		ChainId:            request.ChainId,
		L1:                 types.G1G2DockerDevL1,
		L2FundWallets:      request.L2FundWallets,
		BeneficiaryAddress: request.BeneficiaryAddress,
	}
}

func DeployL1Rollup(
	rollup *types.Rollup,
	builder *RollupBuilder,
	db *db.LocalFileDatabase,
	g1g2Admin G1G2Admin,
) error {
	err := builder.DeployL1Rollup(rollup, g1g2Admin)
	if err != nil {
		return err
	}

	l1ChainId := rollup.L1.ChainId
	l1ContractAddresses, err := db.GetRollupContracts(l1ChainId, rollup.ChainId)
	if err != nil {
		return err
	}
	rollup.L1Rollup = l1ContractAddresses.L1Proxies.L1Rollup
	rollup.L1Bridge = l1ContractAddresses.L1Proxies.CrossChainChannel
	rollup.L1Escrow = l1ContractAddresses.L1Proxies.L1Escrow
	rollup.L1AddressManager = l1ContractAddresses.L1Proxies.AddressManager

	rollup.L2Rollup = types.L2RollupAddr
	rollup.L2Bridge = types.L2BridgeAddr
	rollup.L2Escrow = types.L2EscrowAddr
	rollup.L2AddressManager = types.L2AddressManagerAddr

	rollup.CreatedAt = time.Now()
	err = db.UpdateRollup(rollup)
	return err
}
