package main

import (
	"context"
	"flag"
	"fmt"
	"os"

	"github.com/g1g2-lab/automation/pkg/logging"
	"github.com/peterbourgon/ff/v3/ffcli"
)

var (
	rootFlagSet = flag.NewFlagSet("g1g2", flag.ExitOnError)

	rootCommand = &ffcli.Command{
		ShortUsage: "g1g2 [flags] <subcommand>",
		FlagSet:    rootFlagSet,
		Exec: func(ctx context.Context, args []string) error {
			return flag.ErrHelp
		},
		Subcommands: []*ffcli.Command{
			rollupCommand,
			genesisCommand,
		},
	}
)

func main() {
	logging.Init()
	var ctx = context.Background()
	if err := rootCommand.Parse(os.Args[1:]); err != nil {
		os.Exit(1)
	}

	if err := rootCommand.Run(ctx); err != nil {
		fmt.Printf("error: %s\n", err)
		os.Exit(1)
	}
}
