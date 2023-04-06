package main

import (
	"context"
	"encoding/json"
	"flag"
	"fmt"
	"os"

	"github.com/ethereum/go-ethereum/core"
	"github.com/ethereum/go-ethereum/core/rawdb"
	"github.com/peterbourgon/ff/v3/ffcli"
)

var (
	genesisFlag     = flag.NewFlagSet("g1g2 genesis", flag.ExitOnError)
	genesisFileFlag = genesisFlag.String("file", "genesis.json", "genesis file")
	genesisCommand  = &ffcli.Command{
		Name:       "genesis",
		ShortUsage: "",
		ShortHelp:  "🌟",
		LongHelp:   "",

		FlagSet: genesisFlag,
		Exec:    GenerateL2GenesisHash,
	}
)

func GenerateL2GenesisHash(ctx context.Context, args []string) error {
	file, err := os.Open(*genesisFileFlag)
	if err != nil {
		fmt.Printf("Failed to read genesis file err: %s", err)
		return err
	}
	defer file.Close()

	genesis := new(core.Genesis)
	if err := json.NewDecoder(file).Decode(genesis); err != nil {
		fmt.Printf("invalid genesis file: err %s", err)
		return err
	}
	db := rawdb.NewMemoryDatabase()
	_, hash, err := core.SetupGenesisBlock(db, genesis)
	fmt.Print(hash.String())
	return err
}
