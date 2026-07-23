package wal

import (
	"gopkg.in/yaml.v3"
	"io"
	"os"
)

type Filter struct {
	Tables map[string][]string
}

func NewFilter() *Filter {
	return &Filter{
		Tables: make(map[string][]string),
	}
}

func (f *Filter) Add(table, action string) {
	f.Tables[table] = append(f.Tables[table], action)
}

func (f *Filter) AddWithSchema(schema, table, action string) {
	table = schema + "." + table
	f.Tables[table] = append(f.Tables[table], action)
}

func (f *Filter) IsAllowed(table, action string) bool {
	if len(f.Tables) == 0 {
		return true
	}

	actions, ok := f.Tables[table]
	if !ok {
		return false
	}

	for _, a := range actions {
		if a == action {
			return true
		}
	}

	return false
}

func (f *Filter) IsEmpty() bool {
	return len(f.Tables) == 0
}

type TableActions map[string][]string

type Schema struct {
	Name   string       `yaml:"name"`
	Tables TableActions `yaml:"tables"`
}

type YAMLConfig struct {
	Schemas []Schema `yaml:"schema"`
}

func LoadFilterConfig(filePath string) (*Filter, error) {
	cwd, err := os.Getwd()
	if err != nil {
		return nil, err
	}

	path := cwd + "/" + filePath

	f, err := os.Open(path)
	if err != nil {
		return nil, err
	}

	data, err := io.ReadAll(f)
	if err != nil {
		return nil, err
	}

	var config YAMLConfig
	err = yaml.Unmarshal(data, &config)
	if err != nil {
		return nil, err
	}

	filter := NewFilter()

	filter.Tables = make(map[string][]string)
	for _, schema := range config.Schemas {
		for table, actions := range schema.Tables {
			qualifiedTableName := schema.Name + "." + table
			for _, action := range actions {
				if action == "ALL" {
					filter.Tables[qualifiedTableName] = []string{"INSERT", "UPDATE", "DELETE"}
					break
				} else {
					filter.Tables[qualifiedTableName] = append(filter.Tables[qualifiedTableName], action)
				}
			}
		}
	}

	return filter, nil
}
