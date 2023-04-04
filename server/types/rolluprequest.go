package types

import (
	"fmt"
	"os"
	"time"

	"gopkg.in/yaml.v2"
)

type L2FundWallets struct {
	WalletAddress string `firestore:"WalletAddress,omitempty" yaml:"WalletAddress"`
	AmountInWei   string `firestore:"AmountInWei,omitempty" yaml:"AmountInWei"`
}

// status of rollup draft
const (
	// 0 is default value, means not created
	Draft  = 1
	Sealed = 2
	//Building = 3
	Created    = 4
	Failed     = 5
	Processing = 6
)

type RollupRequestComponent struct {
	Target int `firestore:"Target,omitempty" yaml:"Target"`
}

type RollupRequest struct {
	Name           string `firestore:"Name,omitempty" yaml:"Name"`
	ChainId        int    `firestore:"ChainId,omitempty" yaml:"ChainId"`
	L1             string `firestore:"L1,omitempty" yaml:"L1"`
	ContractsOwner string `firestore:"ContractsOwner,omitempty" yaml:"ContractsOwner"`
	// fund wallets in genesis block
	L2FundWallets []L2FundWallets `firestore:"L2FundWallets,omitempty" yaml:"L2FundWallets"`
	BridgeEnabled bool            `firestore:"BridgeEnabled,omitempty" yaml:"BridgeEnabled"`
	Uid           string          `firestore:"Uid,omitempty" yaml:"Uid"`
	Status        int             `firestore:"Status,omitempty" yaml:"Status"`
	ProcessedBy   string          `firestore:"ProcessedBy,omitempty" yaml:"ProcessedBy"`

	// We use this to run proposer and prover on behalf of the user
	// shared by both L1 and L2
	// never give this to the user
	RollupSpecificFaucetPk      string `firestore:"RollupSpecificFaucetPk,omitempty"`
	RollupSpecificFaucetAddress string `firestore:"RollupSpecificFaucetAddress,omitempty"`

	BeneficiaryAddress string `firestore:"BeneficiaryAddress,omitempty"`

	InitialAt time.Time `firestore:"InitialAt,omitempty"`
	SealAt    time.Time `firestore:"SealAt,omitempty"`

	// last time we try to create rollup
	LastFailAt   time.Time                `firestore:"LastFailAt,omitempty"`
	RetryTimes   int                      `firestore:"RetryTimes,omitempty"`
	LastErrorMsg string                   `firestore:"LastErrorMsg,omitempty"`
	Components   []RollupRequestComponent `firestore:"Components,omitempty" yaml:"Components"`
}

func NewRollupRequestFromYaml(path string) (*RollupRequest, error) {
	cfg := &RollupRequest{}
	if path != "" {
		content, err := os.ReadFile(path)
		if err != nil {
			return nil, fmt.Errorf("failed to load config file, %w", err)
		}
		if err := yaml.Unmarshal(content, cfg); err != nil {
			return nil, fmt.Errorf("failed to parse config file, %w", err)
		}
	}
	return cfg, nil
}
