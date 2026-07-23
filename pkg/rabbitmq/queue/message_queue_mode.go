package queue

type MessageQueueMode int

const (
	MessageQueueModeConsume MessageQueueMode = iota
	MessageQueueModePublish
)
