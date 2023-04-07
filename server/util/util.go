package util

import (
	"crypto/ecdsa"
	"encoding/json"
	"errors"
	"fmt"
	"io/ioutil"
	"log"
	"os"
	"path/filepath"
	"strings"

	"github.com/bitfield/script"
	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/common/hexutil"
	"github.com/ethereum/go-ethereum/core"
	"github.com/ethereum/go-ethereum/core/rawdb"
	"github.com/ethereum/go-ethereum/crypto"
	"github.com/fatih/color"
	"github.com/inconshreveable/log15"
)

type StepFunc func() error

func PanicOnError(step StepFunc) {
	err := step()
	if err != nil {
		log15.Crit("error", "error", err)
		panic(err)
	}
}

func DirExists(path string) bool {
	path = strings.TrimPrefix(path, "file://")
	info, err := os.Stat(path)
	if err != nil {
		return false
	}
	if info.IsDir() {
		return true
	} else {
		return false
	}
}

func PanicError(err error) {
	if err != nil {
		log15.Crit("error", "error", err)
		panic(err)
	}
}

func PrintImportantMsg(msg string) {
	white := color.New(color.FgHiWhite)
	boldWhite := white.Add(color.BgRed)
	boldWhite.Print("💖 " + msg + " 💖")
	println()
}

func PrintCmdMsg(cmd string) {
	wd, _ := os.Getwd()
	fmt.Print("🌟 " + cmd + " INNNNNN: " + wd + " 🌟")
	println()
}

func PrintCmdErrorMsg(msg string) {
	white := color.New(color.FgHiWhite)
	boldWhite := white.Add(color.BgRed)
	boldWhite.Print("😭 " + msg + " 😭")
	println()
}

func PrintStepLogo(msg string) {
	fmt.Print("✅ " + msg + " ✅")
	println()
}

func ExecWrapper(cmd string) *script.Pipe {
	PrintCmdMsg(cmd)
	return script.Exec(cmd)
}

func FileFromBase(basePath *string, pathRelativeToBase string) string {
	return filepath.Join(*basePath, pathRelativeToBase)
}

func ToAbsolutePath(path string) string {
	absPath, err := filepath.Abs(path)
	if err != nil {
		return ""
	}
	return absPath
}

func PrivateKeyToAddress(privateKey string) (common.Address, error) {
	privateKeyECDSA, err := crypto.ToECDSA(common.Hex2Bytes(privateKey))
	if err != nil {
		return common.Address{}, err
	}
	publicKey := privateKeyECDSA.Public()
	publicKeyECDSA, ok := publicKey.(*ecdsa.PublicKey)
	if !ok {
		return common.Address{}, errors.New("privateKeyToAddress error")
	}
	address := crypto.PubkeyToAddress(*publicKeyECDSA)
	return address, nil
}

func GenerateL2GenesisHash(genesisFilePath string) (string, error) {
	file, err := os.Open(genesisFilePath)
	if err != nil {
		log15.Error("Failed to read genesis file", "err", err)
		return "", err
	}
	defer file.Close()

	genesis := new(core.Genesis)
	if err := json.NewDecoder(file).Decode(genesis); err != nil {
		log15.Error("invalid genesis file:", "err", err)
		return "", err
	}
	db := rawdb.NewMemoryDatabase()
	_, hash, err := core.SetupGenesisBlock(db, genesis)
	return hash.String(), err
}

func WriteJSONTo(data interface{}, path string) error {
	bytes, err := json.MarshalIndent(data, "", " ")
	if err != nil {
		return err
	}
	return ioutil.WriteFile(path, bytes, 0644)
}

func ReadJSONTo(v any, path string) error {
	jsonFile, err := os.Open(path)
	if err != nil {
		return err
	}
	byteValue, err := ioutil.ReadAll(jsonFile)
	if err != nil {
		return err
	}
	return json.Unmarshal(byteValue, v)
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
