package util

import (
	"fmt"
	"strconv"
	"strings"
)

func GetPodOrdinalIndex() (int, error) {
	podName, err := GetHostname()
	if err != nil {
		return 0, err
	}

	// assuming the pod name format is <statefulset-name>-<ordinal-index>
	parts := strings.Split(podName, "-")
	if len(parts) == 0 {
		return 0, fmt.Errorf("failed to parse pod name")
	}

	podIndex := parts[len(parts)-1]

	return strconv.Atoi(podIndex)
}
