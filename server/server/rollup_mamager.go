package server

import (
	"context"

	"github.com/g1g2-lab/automation/l2"
	"github.com/g1g2-lab/automation/pkg/db"
	"github.com/g1g2-lab/automation/types"
)

type Manager struct {
	db  *db.LocalFileDatabase
	cfg *l2.L2Config
}

func NewRollupManager(db *db.LocalFileDatabase,
	cfg *l2.L2Config) *Manager {
	return &Manager{
		db,
		cfg,
	}
}

func (m *Manager) Db() *db.LocalFileDatabase {
	return m.db
}

func (m *Manager) CreateRollup(req *types.CreateRollupRequest) error {
	_, err := l2.CreateRollup(context.Background(),
		m.cfg,
		req,
		m.db)
	return err
}

func (m *Manager) DeleteRollup(
	name string,
) error {
	err := l2.StopRollupByName(context.Background(), m.cfg, name, m.Db())
	return err
}

func (m *Manager) RunRollup(
	chainId string,
) error {
	rollup, err := m.db.GetRollupById(chainId)
	if err != nil {
		return err
	}
	err = l2.RunRollup(m.cfg, rollup, m.db)
	return err
}
