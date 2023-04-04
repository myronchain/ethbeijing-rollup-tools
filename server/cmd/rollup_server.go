package main

import (
	"context"
	"flag"
	"fmt"

	"github.com/g1g2-lab/automation/l2"
	"github.com/g1g2-lab/automation/pkg/db"
	"github.com/g1g2-lab/automation/pkg/http"
	"github.com/g1g2-lab/automation/rollup_server"
	"github.com/go-playground/validator"
	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"

	"github.com/peterbourgon/ff/v3/ffcli"
)

var (
	rollupFlagSet = flag.NewFlagSet("g1g2 rollup", flag.ExitOnError)
	rollupCommand = &ffcli.Command{
		Name:       "rollup",
		ShortUsage: "g1g2 rollup",
		ShortHelp:  "🌟run g1g2 rollup magr",
		LongHelp:   "",

		FlagSet: rollupFlagSet,
		Exec: func(ctx context.Context, args []string) error {
			return flag.ErrHelp
		},
		Subcommands: []*ffcli.Command{
			serverCommand,
		},
	}
)

var (
	serverFlagSet      = flag.NewFlagSet("g1g2 rollup server", flag.ExitOnError)
	portFlag           = serverFlagSet.Int("port", 8082, "server listen port")
	serverRepoFlag     = serverFlagSet.String("repo", "repo.yaml", "g1g2 repo configuration file")
	enablerollupCreate = serverFlagSet.Bool("create-loop", false, "")
	enablerollupRun    = serverFlagSet.Bool("run-loop", false, "")
	enablerollupStatus = serverFlagSet.Bool("status-loop", false, "")
	serverConfigFlag   = serverFlagSet.String("config", "rollup_server_prod.yaml", "g1g2 configuration file")
	serverCommand      = &ffcli.Command{
		Name:       "server",
		ShortUsage: "g1g2 rollup server",
		ShortHelp:  "run a g1g2 rollup by http request",
		LongHelp:   "",
		FlagSet:    serverFlagSet,
		Exec:       serverMain,
	}
)

func serverMain(ctx context.Context, args []string) error {

	l2Config, err := l2.NewL2ConfigFromFile(*serverConfigFlag)
	if err != nil {
		return err
	}

	// Echo instance
	e := echo.New()
	e.Validator = &http.CustomValidator{Validator: validator.New()}
	//
	//// Middleware
	e.Use(middleware.Logger())
	e.Use(middleware.Recover())
	e.Use(middleware.CORS())

	db := db.NewLocalDatabase(ctx, "build")
	defer db.Close()

	handler := rollup_server.NewRollupHandler(db, l2Config)
	handler.SetupRollupRouter(e, db)

	// Start server
	e.Logger.Fatal(e.Start(fmt.Sprintf(":%d", *portFlag)))
	return nil
}
