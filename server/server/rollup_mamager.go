package server

import (
	"context"

	"github.com/g1g2-lab/automation/l2"
	"github.com/g1g2-lab/automation/pkg/db"
	"github.com/g1g2-lab/automation/types"
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
	return err
}

func (m *Manager) DeleteRollup(
	name string,
) error {
	err := l2.StopRollupByName(context.Background(), m.cfg, name, m.Db())
	return err
}
