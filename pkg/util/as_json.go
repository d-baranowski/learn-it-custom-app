package util

import (
	"encoding/json"
	"fmt"
)

func AsJson(i interface{}) interface{} {
	if i == nil {
		return "nil"
	}

	jsonStr, err := json.Marshal(i)
	if err != nil {
		return fmt.Sprintf("%v+", i)
	}
	var result map[string]interface{}
	err = json.Unmarshal(jsonStr, &result)
	if err != nil {
		return fmt.Sprintf("%v+", i)
	}
	return result
}
