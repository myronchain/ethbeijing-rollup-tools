package util

import (
	"bufio"
	"crypto/ecdsa"
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"io/ioutil"
	"os"
	"path/filepath"
	"runtime"
	"strconv"
	"strings"
	"time"

	"github.com/bitfield/script"
	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/core"
	"github.com/ethereum/go-ethereum/core/rawdb"
	"github.com/ethereum/go-ethereum/crypto"
	"github.com/fatih/color"
	"github.com/inconshreveable/log15"
	"gopkg.in/yaml.v2"
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
	// Check if file already exists
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
	//white := color.New(color.FgHiWhite)
	//boldWhite := white.Add(color.BgRed)
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
	//white := color.New(color.FgHiWhite)
	//boldWhite := white.Add(color.BgRed)
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

func GetContainerIdFromName(name string) (string, error) {
	cid, err := ExecWrapper(fmt.Sprintf("docker ps -aqf \"name=%s\"", name)).String()
	if err != nil {
		return "", err
	}
	return strings.TrimSuffix(cid, "\n"), nil
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

func StopAndRemoveContainer(name string, remove bool) error {
	id, err := GetContainerIdFromName(name)
	if err != nil {
		return err
	}

	if id != "" {
		ExecWrapper(fmt.Sprintf("docker stop %s", id)).String()
		if remove {
			ExecWrapper(fmt.Sprintf("docker rm %s", id)).String()
		}
	}
	// delete again won't hurt
	ExecWrapper(fmt.Sprintf("docker rm %s", name)).String()

	id, err = GetContainerIdFromName(name)
	if err != nil {
		return err
	}
	if id != "" {
		return errors.New("can not delete " + name)
	}

	return nil
}

func GetK8sPodStatus(namespace string, pod string) (string, error) {
	cmd := fmt.Sprintf("kubectl get pods -n %s %s -o jsonpath=\"{.status.phase}\"", namespace, pod)
	return ExecWrapper(cmd).String()
}

func WaitK8sPodRunning(namespace string, pod string) error {
	for {
		status, _ := GetK8sPodStatus(namespace, pod)
		log15.Info("get k8s pod status", "s", status)
		if status == "Running" {
			return nil
		}
		time.Sleep(3 * time.Second)
	}
}

func WaitStatefulsetAvailable(namespace string, statefulset string) error {
	cmd := fmt.Sprintf("kubectl get statefulset -n %s %s -o jsonpath=\"{.status.availableReplicas}\"", namespace, statefulset)
	for {
		res, _ := ExecWrapper(cmd).String()
		intVar, _ := strconv.Atoi(res)
		log15.Info("k8s statefulset status", "namespace", namespace, "statefulset", statefulset, "available replicas", intVar)
		if intVar > 0 {
			return nil
		}
		time.Sleep(3 * time.Second)
	}
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

func GetK8sLocalhostIp() string {
	//if OS_Is_Macos() {
	// microk8s default host ip
	ip, err := InspectNodeIP()
	log15.Info("ip", "ip", ip, "err", err)
	if err != nil {
		//panic(err)
		return "not found"
	}
	return ip
	//}

	//return "localhost"
}

func TwistL1PublicUrlIfMacos(url string) string {
	//if !OS_Is_Macos() {
	//	return url
	//}
	macosVmIp := GetK8sLocalhostIp()
	url = strings.Replace(url, "127.0.0.1", macosVmIp, 1)
	url = strings.Replace(url, "localhost", macosVmIp, 1)
	return url
}

func OS_Is_Macos() bool {
	return runtime.GOOS == "darwin"
}

func InspectNodeIP() (string, error) {
	cmd := "kubectl get node -o jsonpath=\"{.items[].status.addresses[].address}\""
	return ExecWrapper(cmd).String()
}

func GetKubectlContext() (string, error) {
	cmd := "kubectl config current-context"
	s, err := ExecWrapper(cmd).String()
	if err != nil {
		return "", err
	}
	return strings.TrimSpace(s), nil
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

func WriteYamlTo(data interface{}, path string) error {
	// write values yaml
	file, err := os.OpenFile(path, os.O_RDWR|os.O_CREATE|os.O_TRUNC, 0600)
	if err != nil {
		return err
	}
	defer file.Close()

	enc := yaml.NewEncoder(file)
	err = enc.Encode(data)
	if err != nil {
		return err
	}
	return nil
}

func WaitingK8sDeploymentReady(namespace string, deploy string) {
	cmd := fmt.Sprintf("kubectl wait deployment -n %s %s --for condition=Available=True", namespace, deploy)
	ExecWrapper(cmd).Stdout()
}

func CreateGCPStaticIp(chainName string) (string, error) {
	return ExecWrapper(
		fmt.Sprintf("gcloud compute addresses create %s --region=us-central1", chainName),
	).String()
}

func QueryGCPStaticIp(chainName string) (string, error) {
	return ExecWrapper(
		fmt.Sprintf("gcloud compute addresses describe %s --region=us-central1", chainName),
	).Match("address:").Column(2).String()
}

func DeleteGCPStaticIp(chainName string) (string, error) {
	return ExecWrapper(
		fmt.Sprintf("gcloud compute addresses delete %s --region=us-central1", chainName),
	).String()
}

func CreateGCPDNSRecord(domain string, ip string) (string, error) {
	return ExecWrapper(
		fmt.Sprintf("gcloud dns record-sets create %s --zone='byor-public-zone' --type='A' --ttl='300' --rrdatas='%s'", domain, ip),
	).String()
}

func DeleteGCPDNSRecord(domain string) (string, error) {
	return ExecWrapper(
		fmt.Sprintf("gcloud dns record-sets delete %s --zone='byor-public-zone' --type='A'", domain),
	).String()
}

func ShowRunningEnv() {
	reader := bufio.NewReader(os.Stdin)
	nodeIp, err := InspectNodeIP()
	//if err != nil {
	//	panic(err)
	//	return
	//}

	context, err := GetKubectlContext()
	if err != nil {
		panic(err)
	}
	PrintImportantMsg("Running environment:")
	PrintImportantMsg("Node Ip: " + nodeIp)
	PrintImportantMsg("kubectl context: " + context)

	fmt.Print("Do you want to proceed? (yes/no): ")
	response, _ := reader.ReadString('\n')
	response = strings.TrimSpace(response)

	if response == "yes" {
		fmt.Println("Proceeding...")
	} else if response == "no" {
		fmt.Println("Aborting...")
		os.Exit(0)
	} else {
		fmt.Println("Invalid response, please enter 'yes' or 'no'.")
		os.Exit(0)
	}
}

func GenerateJwt() (string, error) {
	var secret [32]byte
	if _, err := rand.Read(secret[:]); err != nil {
		return "", err
	}
	str := hex.EncodeToString(secret[:])
	return str, nil
}

func IsValidAddress(address string, checksummed bool) bool {
	if !common.IsHexAddress(address) {
		return false
	}
	return !checksummed || common.HexToAddress(address).Hex() == address
}
