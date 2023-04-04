package l2

import (
	"fmt"
	"os"

	"github.com/g1g2-lab/automation/util"
	"gopkg.in/yaml.v2"
)

var (
	KubectlContextMicrok8s = "microk8s"
	KubectlContextGke      = "gke"
)

type G1G2Admin struct {
	// L1 faucet pk
	L1AdminPK             string `yaml:"l1_admin_pk"`
	GitHubPrivateKeyId    string `yaml:"github_private_key_path"`
	RollupAdminPremintWei string `yaml:"rollup_admin_l2_premint_wei"`
	FirebaseConfigFile    string `yaml:"firebase_config_file"`
}

type DockerImageConfig struct {
	ExecutionBase string `yaml:"execution_base"`
	ConsensusBase string `yaml:"consensus_base"`
}

type NodeConfig struct {
	BasePort int `yaml:"base_port"`
	Replicas int `yaml:"replicas"`
}

type L2Config struct {
	// gke / microk8s
	KubectlContext    string            `yaml:"kubectl_context"`
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
	// convert relative path to absolutely path
	cfg.G1G2Admin.FirebaseConfigFile = util.ToAbsolutePath(cfg.G1G2Admin.FirebaseConfigFile)
	return cfg, nil
}

func (c *L2Config) SetKubeContext(context string) {
	switch context {
	case KubectlContextMicrok8s:
		c.KubectlContext = KubectlContextMicrok8s
	case KubectlContextGke:
		c.KubectlContext = KubectlContextGke
	default:
		panic("kube context not supported")
	}
}

func (c *L2Config) Validate() {
	switch c.KubectlContext {
	case KubectlContextMicrok8s:
	case KubectlContextGke:
		return
	default:
		panic("kube context not supported")
	}
}

func (c *L2Config) IsKubeContextEqualMicrok8s() bool {
	c.Validate()
	return c.KubectlContext == KubectlContextMicrok8s
}

func (c *L2Config) IsKubeContextEqualGke() bool {
	c.Validate()
	return c.KubectlContext == KubectlContextGke
}
