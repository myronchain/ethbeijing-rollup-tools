package main

import (
	"context"
	"flag"
	"fmt"
	"os"
	"os/signal"
	"sync"
	"syscall"
	"time"

	"github.com/g1g2-lab/automation/util"
	"github.com/peterbourgon/ff/v3/ffcli"
)

var (
	genTxsFlagSet = flag.NewFlagSet("gen-txs", flag.ExitOnError)
	genTxsCommand = &ffcli.Command{
		Name:       "gen-txs",
		ShortUsage: "",
		ShortHelp:  "🌟gen transactions for testing",
		LongHelp:   "",

		FlagSet: genTxsFlagSet,
		Exec:    genTxsMain,
	}
)

func genTxsMain(ctx context.Context, args []string) error {
	println("Gen transations start.")
	genTxsService, err := NewGenTransactionsService(ctx)
	if err != nil {
		return err
	}
	genTxsService.Start()
	defer func() {
		genTxsService.Stop()
	}()

	quitCh := getQuitCh()
	<-quitCh

	return nil
}

func getQuitCh() chan os.Signal {
	quitCh := make(chan os.Signal, 1)
	signal.Notify(quitCh, []os.Signal{
		os.Interrupt,
		os.Kill,
		syscall.SIGTERM,
		syscall.SIGQUIT,
	}...)
	return quitCh
}

type GenTransactionsService struct {
	wg            sync.WaitGroup
	genTxInterval time.Duration
	ctx           context.Context
	cancel        context.CancelFunc
}

func NewGenTransactionsService(ctx context.Context) (*GenTransactionsService, error) {
	context, cancel := context.WithCancel(ctx)
	interval := time.Second * 2

	return &GenTransactionsService{
		wg:            sync.WaitGroup{},
		genTxInterval: interval,
		ctx:           context,
		cancel:        cancel,
	}, nil
}

func (s *GenTransactionsService) Start() {
	s.wg.Add(1)
	go s.loopGenTx()
}

func (s *GenTransactionsService) Stop() {
	s.cancel()
	s.wg.Wait()
}

func (s *GenTransactionsService) loopGenTx() {
	ticker := time.NewTicker(s.genTxInterval)
	defer func() {
		ticker.Stop()
		s.wg.Done()
	}()

	for {
		select {
		case <-s.ctx.Done():
			println("loopGenTx return by ctx.Done()")
			return
		case <-ticker.C:
			if err := s.genL2Tx(); err != nil {
				println("Failed to gen tx", "error", err.Error())
			}
		}
	}
}

var (
	newPk  = ""
	newAdd = ""
)

func (s *GenTransactionsService) genL2Tx() error {
	if len(newPk) == 0 {
		newPk, newAdd = util.CreateAccount()
		_, err := util.ExecWrapper(
			fmt.Sprintf("cast send %s --value=10000000000000000 --private-key=dc4cf1bba6e4f415e5da84faa4d9981120f8cd1c8a5c956480aeae369325a59f --rpc-url=http://127.0.0.1:11545 --legacy", newAdd),
		).String()
		if err != nil {
			newPk = ""
			newAdd = ""
			println(err.Error())
		}
	} else {
		_, err := util.ExecWrapper(
			fmt.Sprintf("cast send %s --value=1 --private-key=%s --rpc-url=http://127.0.0.1:11545 --legacy", newAdd, newPk),
		).String()
		if err != nil {
			newPk = ""
			newAdd = ""
			println(err.Error())
		}
	}
	println("generate transaction to l2 success")
	return nil
}
