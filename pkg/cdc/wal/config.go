package wal

import "time"

type Config struct {
	FilterFile        string        `valid:"required" envconfig:"WAL_FILTER_FILE" default:"/app/filter.yaml"`
	OutputPlugin      string        `valid:"required" envconfig:"WAL_OUTPUT_PLUGIN" default:"pgoutput"`
	PublicationName   string        `valid:"required" envconfig:"WAL_PUBLICATION_NAME" default:"app"`
	SlotName          string        `valid:"required" envconfig:"WAL_SLOT_NAME" default:"app"`
	AckTimeout        time.Duration `valid:"required" envconfig:"WAL_ACK_TIMEOUT" default:"10s"`
	RefreshConnection time.Duration `valid:"required" envconfig:"WAL_REFRESH_CONNECTION" default:"10s"`
	HeartbeatInterval time.Duration `valid:"required" envconfig:"WAL_HEARTBEAT_INTERVAL" default:"10s"`
}

type OutputPlugin struct {
	PluginName string
	Arguments  []string
}
