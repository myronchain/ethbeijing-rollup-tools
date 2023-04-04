package types

import "errors"

type L1Net struct {
	// todo(cj):
	Name           string `yaml:"name" json:"name" validate:"required"`
	Local          bool   `json:"-"`
	ChainId        int    `yaml:"chain_id" json:"chain_id"`
	PublicRpcUrl   string `yaml:"public_rpc" json:"public_rpc"`
	PublicWsUrl    string `yaml:"public_ws" json:"public_ws"`
	InternalRpcUrl string `yaml:"internal_rpc" json:"internal_rpc"`
	InternalWsUrl  string `yaml:"internal_ws" json:"internal_ws"`
	ExplorerUrl    string `yaml:"explorer" json:"explorer"`
	KubeCtlContext string `json:"-"`
}

// name should be aligned with the name in the
// <website repo>/src/constants/index.ts
var (
	G1G2DevL1 = L1Net{
		Name:           "G1G2Dev",
		Local:          true,
		ChainId:        23023,
		PublicRpcUrl:   "http://127.0.0.1:30001",
		PublicWsUrl:    "ws://127.0.0.1:30002",
		InternalRpcUrl: "http://node-l1.g1g2-l1.svc.cluster.local:8545",
		InternalWsUrl:  "ws://node-l1.g1g2-l1.svc.cluster.local:8546",
		ExplorerUrl:    "http://localhost:31001",
		KubeCtlContext: "microk8s",
	}

	G1G2PrivateL1 = L1Net{
		Name:           "G1G2Alpha",
		Local:          false,
		ChainId:        23023,
		PublicRpcUrl:   "https://l1rpc.alpha.byor.cloud",
		PublicWsUrl:    "wss://l1ws.alpha.byor.cloud",
		InternalRpcUrl: "http://node-l1.g1g2.svc.cluster.local:8545",
		InternalWsUrl:  "ws://node-l1.g1g2.svc.cluster.local:8546",
		ExplorerUrl:    "https://l1explorer.alpha.byor.cloud",
		KubeCtlContext: "gke_g1g2-db990_us-central1_g1g2-test-cluster-1",
	}

	G1G2DockerDevL1 = L1Net{
		Name:           "G1G2DockerDev",
		Local:          true,
		ChainId:        23023,
		PublicRpcUrl:   "http://127.0.0.1:10545",
		PublicWsUrl:    "ws://127.0.0.1:10546",
		InternalRpcUrl: "http://host.docker.internal:10545",
		InternalWsUrl:  "ws://host.docker.internal:10546",
		ExplorerUrl:    "http://localhost:31001", // todo(cj)
		KubeCtlContext: "microk8s",               // todo(cj)
	}
)

var ErrL1NotFound = errors.New("l1 name not found")

func GetL1NetByName(name string) (L1Net, error) {
	switch name {
	case G1G2DevL1.Name:
		return G1G2DevL1, nil
	case G1G2PrivateL1.Name:
		return G1G2PrivateL1, nil
	case G1G2DockerDevL1.Name:
		return G1G2DockerDevL1, nil
	default:
		return L1Net{}, ErrL1NotFound
	}
}
