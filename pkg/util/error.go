package util

import "errors"

func ErrorIn(err error, errs ...error) bool {
	for _, e := range errs {
		if errors.Is(e, err) {
			return true
		}
	}
	return false
}
