package l2

import (
	"fmt"
	"os"
	"path"

	"github.com/g1g2-lab/automation/util"
	"gopkg.in/yaml.v2"
)

const (
	ExecutionRepoName = "g1g2-execution"
	ConsensusRepoName = "g1g2-consensus"
	ContractsRepoName = "g1g2-contracts"
)

var RequiredRepos []string = []string{
	ExecutionRepoName,
	ConsensusRepoName,
	ContractsRepoName,
}

type RepoConfig struct {
	Root  string `yaml:"root"`
	Repos []Repo `yaml:"repos"`
}

type Repo struct {
	RepoName string `yaml:"repo_name"`
	Path     string `yaml:"path"`
}

func (r Repo) GetRepoClonePath() string {
	if len(r.Path) == 0 {
		return r.RepoName
	}
	return r.Path
}

func (rc RepoConfig) ContractPath() string {
	repo, _ := rc.GetRepo(ContractsRepoName)
	return path.Join(rc.Root, repo.GetRepoClonePath())
}

func (rc RepoConfig) NodePath() string {
	repo, _ := rc.GetRepo(ExecutionRepoName)
	return path.Join(rc.Root, repo.GetRepoClonePath())
}

func (rc RepoConfig) ConsensusPath() string {
	repo, _ := rc.GetRepo(ConsensusRepoName)
	return path.Join(rc.Root, repo.GetRepoClonePath())
}

func (rc RepoConfig) GetRepo(repoAddr string) (*Repo, error) {
	for _, repo := range rc.Repos {
		if repo.RepoName == repoAddr {
			return &repo, nil
		}
	}
	return nil, fmt.Errorf("missing required repo: %s", repoAddr)
}

func (rc RepoConfig) Contains(repoAddr string) bool {
	for _, r := range rc.Repos {
		if r.RepoName == repoAddr {
			return true
		}
	}
	return false
}

func (rc RepoConfig) Validate() error {
	for _, r := range RequiredRepos {
		if !rc.Contains(r) {
			return fmt.Errorf("missing required repo: %s", r)
		}
	}
	return nil
}

func NewRepoConfig(path string) (*RepoConfig, error) {
	cfg := &RepoConfig{}

	if path != "" {
		content, err := os.ReadFile(path)
		if err != nil {
			return nil, fmt.Errorf("failed to load config file, %w", err)
		}
		if err := yaml.Unmarshal(content, cfg); err != nil {
			return nil, fmt.Errorf("failed to parse config file, %w", err)
		}
	}
	cfg.Root = util.ToAbsolutePath(cfg.Root)
	err := cfg.Validate()
	if err != nil {
		return nil, err
	}
	return cfg, nil
}
