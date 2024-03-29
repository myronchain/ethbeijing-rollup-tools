package l2

import (
	"fmt"
	"os"

	"gopkg.in/yaml.v2"
)

type G1G2Admin struct {
	L1AdminPK             string `yaml:"l1_admin_pk"`
	RollupAdminPremintWei string `yaml:"rollup_admin_l2_premint_wei"`
}

type DockerImageConfig struct {
	ExecutionBase string `yaml:"execution_base"`
	ConsensusBase string `yaml:"consensus_base"`
}

type NodeConfig struct {
	BasePort int `yaml:"base_port"`
}

type L2Config struct {
	G1G2Admin         G1G2Admin         `yaml:"g1g2_admin"`
	DockerImageConfig DockerImageConfig `yaml:"docker_image"`
	NodeConfig        NodeConfig        `yaml:"node"`
}

func NewL2ConfigFromFile(path string) (*L2Config, error) {
	cfg := &L2Config{}
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
