package base

import (
	"regexp"
	"strings"
)

var sqlVersionRegex = regexp.MustCompile(`^v\d+_\d+_\d+$`)

type ServiceName string

func (n ServiceName) String() string {
	return string(n)
}

type ServiceVersion string

func (v ServiceVersion) String() string {
	return string(v)
}

// SqlString returns the string representation of the ServiceVersion as v1_0_0
func (v ServiceVersion) SqlString() string {
	s := "v" + v.String()
	s = strings.ReplaceAll(s, ".", "_")
	// check it matches the regex
	if !sqlVersionRegex.MatchString(s) {
		panic("invalid ServiceVersion: " + v.String())
	}
	return s
}

type ServiceEnv string

func (e ServiceEnv) String() string {
	return string(e)
}

func (e ServiceEnv) IsDev() bool {
	return e == "dev"
}
