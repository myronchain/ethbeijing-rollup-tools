package db

import (
	"context"
	"io/ioutil"
	"log"
	"os"
	"path"

	"github.com/g1g2-lab/automation/types"
	"github.com/g1g2-lab/automation/util"
)

type LocalFileDatabase struct {
	dbRootDir string
}

func NewLocalDatabase(ctx context.Context, dir string) *LocalFileDatabase {
	dir = util.ToAbsolutePath(dir)
	return &LocalFileDatabase{
		dir,
	}
}

func (f *LocalFileDatabase) Close() error {
	err := os.RemoveAll(f.dbRootDir)
	if err != nil {
		log.Fatal(err)
	}
	return nil
}

func (f *LocalFileDatabase) rollupRootDir() string {
	return path.Join(f.dbRootDir, "rollups")
}

func (f *LocalFileDatabase) rollupPath(rid string) string {
	return path.Join(f.rollupRootDir(), rid+".json")
}

func (f *LocalFileDatabase) CreateRollup(rollup *types.Rollup) error {
	path := f.rollupPath(rollup.Name)
	err := util.WriteJSONTo(rollup, path)
	return err
}

func (f *LocalFileDatabase) GetRollupByName(name string) (*types.Rollup, error) {
	return f.GetRollupById(name)
}

func (f *LocalFileDatabase) GetRollupById(id string) (*types.Rollup, error) {
	path := f.rollupPath(id)
	rollup := &types.Rollup{}
	err := util.ReadJSONTo(rollup, path)
	return rollup, err
}

func (f *LocalFileDatabase) UpdateRollup(rollup *types.Rollup) error {
	path := f.rollupPath(rollup.Name)
	return util.WriteJSONTo(rollup, path)
}

func (f *LocalFileDatabase) DeleteRollup(name string) error {
	path := f.rollupPath(name)
	return os.Remove(path)
}

func (f *LocalFileDatabase) GetRollupContracts(l1ChainId, l2ChainId int) (*types.RollupContracts, error) {
	path := "./build/rollupcontracts.json"
	contracts := &types.RollupContracts{}
	err := util.ReadJSONTo(contracts, path)
	return contracts, err
}

func (f *LocalFileDatabase) GetRollups() ([]*types.Rollup, error) {
	files, err := ioutil.ReadDir(f.dbRootDir)
	if err != nil {
		log.Fatal(err)
	}
	rollups := []*types.Rollup{}
	for _, file := range files {
		path := path.Join(f.dbRootDir, file.Name())
		rollup := &types.Rollup{}
		util.ReadJSONTo(rollup, path)
		rollups = append(rollups, rollup)
	}
	return rollups, err
}
