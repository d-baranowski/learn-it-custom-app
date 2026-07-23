package health

import "os"

func GetHostname() (string, error) {
	// get kubernetes pod name
	if podName, ok := os.LookupEnv("POD_NAME"); ok {
		return podName, nil
	}

	hostname, err := os.Hostname()
	if err != nil {
		return "", err
	}

	return hostname, nil
}
