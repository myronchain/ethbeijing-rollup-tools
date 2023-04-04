package types

import (
	"encoding/json"
	"fmt"
	"os"
	"time"
)

// deploy step
const (
	// deploy step
	RollupInit          = 0
	RollupDeployOnL1    = 1
	BuildExecutionImage = 2
	BuildSequencerImage = 3
	WaitItOnline        = 4
	Online              = 5
)

type L2FundWallets struct {
	WalletAddress string `firestore:"WalletAddress,omitempty" yaml:"WalletAddress"`
	AmountInWei   string `firestore:"AmountInWei,omitempty" yaml:"AmountInWei"`
}

type CreateRollupRequest struct {
	Name          string          `json:"name" validate:"required"`
	ChainId       int             `json:"chain_id" validate:"required"`
	L2FundWallets []L2FundWallets `json:"l2_wallets,omitempty"`
}

type CreateRollupResponse struct {
}

var (
	RollupStatusInitializing       = "initializing"
	RollupStatusL2ImageDone        = "l2_img_done"
	RollupStatusL1RollupDeployDone = "l1_rollup_done"
	RollupStatusConsensusImageDone = "consensus_img_done"
	RollupStatusDeployed           = "deployed"
	RollupStatusRunning            = "running"
	RollupStatusStopped            = "stopped"
	RollupStatusError              = "error"
)

type Rollup struct {
	Name               string          `json:"name" validate:"required"`
	ChainId            int             `json:"chain_id" validate:"required"`
	RpcUrl             string          `json:"rpc_url" validate:"required"`
	L1Rollup           string          `json:"l1_rollup" validate:"required"`
	L2Rollup           string          `json:"l2_rollup" validate:"required"`
	L1Bridge           string          `json:"l1_bridge" validate:"required"`
	L2Bridge           string          `json:"l2_bridge" validate:"required"`
	L1Escrow           string          `json:"l1_escrow" validate:"required"`
	L2Escrow           string          `json:"l2_escrow" validate:"required"`
	L1AddressManager   string          `json:"l1_address_manager" validate:"required"`
	L2AddressManager   string          `json:"l2_address_manager" validate:"required"`
	ExecutionImage     string          `json:"execution_img" validate:"required"`
	ConsensusImage     string          `json:"consensus_img" validate:"required"`
	CreatedAt          time.Time       `json:"created_by_second" validate:"required"`
	L1                 L1Net           `json:"l1" validate:"required"`
	BeneficiaryAddress string          `json:"beneficiary_address"`
	Step               int             `json:"step"`
	Status             string          `json:"status"`
	L2FundWallets      []L2FundWallets `json:"l2_wallets,omitempty"`
}

func NewRollupFromFile(file string) (*Rollup, error) {
	cfg := &Rollup{}

	if file := file; file != "" {
		content, err := os.ReadFile(file)
		if err != nil {
			return nil, fmt.Errorf("failed to load config file, %w", err)
		}
		if err := json.Unmarshal(content, cfg); err != nil {
			return nil, fmt.Errorf("failed to parse config file, %w", err)
		}
	}
	return cfg, nil
}
