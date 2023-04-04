package util

import (
	"fmt"
	"github.com/inconshreveable/log15"
	"os/exec"
)

func CheckCastAndDocker() error {
	_, err := exec.LookPath("cast")
	if err != nil {
		return err
	}

	_, err = exec.LookPath("docker")
	if err != nil {
		return err
	}

	return nil
}

func PrerequisiteCheck() error {
	_, err := exec.LookPath("cast")
	if err != nil {
		log15.Error("cast not found")
		return err
	}

	_, err = exec.LookPath("unzip")
	if err != nil {
		return err
	}

	_, err = exec.LookPath("docker")
	if err != nil {
		log15.Error("docker not found")
		return err
	}

	_, err = exec.LookPath("kubectl")
	if err != nil {
		log15.Error("kubectl not found")
		return err
	}

	_, err = exec.LookPath("gcloud")
	if err != nil {
		log15.Error("gcloud not found")
		return err
	}

	_, err = exec.LookPath("yarn")
	if err != nil {
		log15.Error("yarn not found")
		return err
	}

	_, err = ExecWrapper(fmt.Sprintf("docker ps")).String()
	if err != nil {
		log15.Error("docker ps error")
		return err
	}

	return nil
}
