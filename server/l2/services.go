package l2

import (
	"os"
	"time"

	"github.com/g1g2-lab/automation/util"
)

type HelperServices struct {
	repoConfig *RepoConfig
}

func NewHelperServices(repo *RepoConfig) *HelperServices {
	return &HelperServices{
		repoConfig: repo,
	}
}

func (r *HelperServices) ClearRelayDb() error {
	util.PrintStepLogo("CLEAR RELAY DB")
	consensusRepoPath := r.repoConfig.ConsensusPath()
	currentPath, err := os.Getwd()
	if err != nil {
		return err
	}
	err = os.Chdir(consensusRepoPath)
	if err != nil {
		return err
	}
	util.ExecWrapper("./scripts/clear_relay_db_data.sh").Stdout()
	util.ExecWrapper("docker compose -f docker-compose-relaydb.yml down -v").Stdout()
	return os.Chdir(currentPath)
}

func (r *HelperServices) StopRelayDb() error {
	util.PrintStepLogo("STOP RELAY DB")
	consensusRepoPath := r.repoConfig.ConsensusPath()
	currentPath, err := os.Getwd()
	if err != nil {
		return err
	}
	err = os.Chdir(consensusRepoPath)
	if err != nil {
		return err
	}
	util.ExecWrapper("docker compose -f docker-compose-relaydb.yml down").Stdout()
	return os.Chdir(currentPath)
}

func (r *HelperServices) StartRelayDb() error {
	util.PrintStepLogo("START RELAY DB")
	consensusRepoPath := r.repoConfig.ConsensusPath()
	currentPath, _ := os.Getwd()
	os.Chdir(consensusRepoPath)
	util.ExecWrapper("docker compose -f docker-compose-relaydb.yml up relay-db -d").Stdout()
	time.Sleep(15 * time.Second)
	util.ExecWrapper("diesel setup").Stdout()
	util.ExecWrapper("diesel migration run").Stdout()
	return os.Chdir(currentPath)
}
