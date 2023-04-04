package l2

import (
	"time"

	"github.com/g1g2-lab/automation/pkg/db"
	"github.com/g1g2-lab/automation/types"
)

func rollupFromRequest(request *types.CreateRollupRequest) *types.Rollup {
	return &types.Rollup{
		Name:          request.Name,
		ChainId:       request.ChainId,
		L1:            types.G1G2DockerDevL1,
		L2FundWallets: request.L2FundWallets,
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
