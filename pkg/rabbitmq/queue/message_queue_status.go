package queue

type MessageQueueStatus struct {
	Consumers  int
	Length     int
	Throughput int
}
