package util

import "os"

func IsRunningOnDocker() bool {
	// docker creates a .dockerenv file at the root
	// of the directory tree inside the container.
	// if this file exists then the viewer is running
	// from inside a container so return true

	if _, err := os.Stat("/.dockerenv"); err == nil {
		return true
	}

	return false
}

func IsRunningOnKubernetes() bool {
	// kubernetes creates a /var/run/secrets/kubernetes.io/serviceaccount
	// directory inside the container. if this directory exists then the
	// viewer is running inside a kubernetes pod so return true

	if _, err := os.Stat("/var/run/secrets/kubernetes.io/serviceaccount"); err == nil {
		return true
	}

	return false
}
