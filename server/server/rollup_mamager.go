package server

import (
	"context"
	"fmt"
	"time"

	"github.com/g1g2-lab/automation/l2"
	"github.com/g1g2-lab/automation/pkg/db"
	"github.com/g1g2-lab/automation/types"
	"github.com/g1g2-lab/automation/util"
)

type Manager struct {
	db   *db.LocalFileDatabase
	cfg  *l2.L2Config
	jobs map[string]chan bool
}

func NewRollupManager(db *db.LocalFileDatabase,
	cfg *l2.L2Config) *Manager {
	return &Manager{
		db,
		cfg,
		map[string]chan bool{},
	}
}

func (m *Manager) Db() *db.LocalFileDatabase {
	return m.db
}

func (m *Manager) CreateRollup(req *types.CreateRollupRequest) error {
	rollup, err := l2.CreateRollup(context.Background(),
		m.cfg,
		req,
		m.db)
	if err != nil {
		return err
	}
	err = l2.RunRollup(m.cfg, rollup, m.db)
	if err != nil {
		return err
	}
	// err = m.runTxJobs(rollup)
	return err
}

func (m *Manager) DeleteRollup(
	name string,
) error {
	m.stopTxJobs(name)
	err := l2.StopRollupByName(context.Background(), m.cfg, name, m.Db())
	return err
}

func (m *Manager) runTxJobs(rollup *types.Rollup) error {
	quit, ok := m.jobs[rollup.Name]
	if ok {
		// already have a channel. stop it
		quit <- true
	}
	pk := m.cfg.G1G2Admin.L1AdminPK
	address, err := util.PrivateKeyToAddress(pk)
	if err != nil {
		return err
	}
	quit = make(chan bool)
	go func() {
		for {
			select {
			case <-quit:
				return
			default:
				time.Sleep(time.Second * 2)
				util.ExecWrapper(
					fmt.Sprintf("cast send %s --value=10 --private-key=%s --rpc-url=%s --legacy", address.String(), pk, rollup.RpcUrl),
				).Stdout()
			}
		}
	}()
	m.jobs[rollup.Name] = quit
	return nil
}

func (m *Manager) stopTxJobs(name string) {
	quit, ok := m.jobs[name]
	if ok {
		quit <- true
	}
}
