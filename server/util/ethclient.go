package util

import (
	"context"
	"crypto/ecdsa"
	"fmt"
	"log"
	"math/big"
	"strings"

	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/common/hexutil"
	"github.com/ethereum/go-ethereum/crypto"
	"github.com/ethereum/go-ethereum/ethclient"
	"github.com/inconshreveable/log15"
)

func weiToEther(wei *big.Int) *big.Float {
	ether := new(big.Float)
	ether.SetString(wei.String())
	return ether.Quo(ether, big.NewFloat(1e18))
}

func GetChainInfo(rpcUrl string) (*big.Int, uint64, error) {
	client, err := ethclient.Dial(rpcUrl)
	if err != nil {
		fmt.Println("Failed to connect to the Ethereum client:", err)
		return nil, 0, err
	}

	chainId, err := client.ChainID(context.Background())
	if err != nil {
		return nil, 0, err
	}

	number, err := client.BlockNumber(context.Background())
	if err != nil {
		return nil, 0, err
	}

	return chainId, number, nil
}

func GetBalance(addressInStr string, rpcUrl string) int64 {
	client, err := ethclient.Dial(rpcUrl)
	if err != nil {
		fmt.Println("Failed to connect to the Ethereum client:", err)
	}

	address := common.HexToAddress(addressInStr) // Replace with your wallet address
	balance, err := client.BalanceAt(context.Background(), address, nil)
	if err != nil {
		fmt.Println("Failed to get balance for address:", err)
	}

	fmt.Println("Balance:", balance)                      // In wei
	fmt.Println("Balance in ether:", weiToEther(balance)) // In ether
	return balance.Int64()
}

func CreateAccount() (string, string) {
	// Generate a new private key
	privateKey, err := crypto.GenerateKey()
	if err != nil {
		log.Fatal(err)
	}

	privateKeyBytes := crypto.FromECDSA(privateKey)
	publicKey := privateKey.Public()
	publicKeyECDSA, ok := publicKey.(*ecdsa.PublicKey)
	if !ok {
		log.Fatal("cannot assert type: publicKey is not of type *ecdsa.PublicKey")
	}
	address := crypto.PubkeyToAddress(*publicKeyECDSA).Hex()
	pk := hexutil.Encode(privateKeyBytes)
	return strings.TrimPrefix(pk, "0x"), address
}

func FundAccount(l1FaucetPK string, address string, value string, rpc string) error {
	cmd := fmt.Sprintf("cast send %s --value=%s --private-key=%s --rpc-url=%s", address, value, l1FaucetPK, rpc)
	out, err := ExecWrapper(cmd).String()
	log15.Info("cast send ethers", "out", out, "err", err)
	return err
}
