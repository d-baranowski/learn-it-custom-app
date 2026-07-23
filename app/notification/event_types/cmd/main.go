package main

import (
	"flag"
	"log"
	"os"

	"app/notification/event_types/cataloggen"
)

func main() {
	outputPath := flag.String("output", "event_types.json", "path to notification event type catalog")
	sourcePath := flag.String("source", "notification_events", "path to notification event definition source package")
	flag.Parse()

	existing, err := os.ReadFile(*outputPath)
	if err != nil && !os.IsNotExist(err) {
		log.Fatalf("read existing event type catalog: %v", err)
	}

	currentSpecs, err := cataloggen.ParseNotificationEventTypeSpecs(existing)
	if err != nil {
		log.Fatalf("parse existing event type catalog: %v", err)
	}

	nextSpecs, err := cataloggen.GeneratedNotificationEventTypeSpecsFromSource(currentSpecs, *sourcePath)
	if err != nil {
		log.Fatalf("generate event type catalog: %v", err)
	}

	bytes, err := cataloggen.MarshalNotificationEventTypeSpecs(nextSpecs)
	if err != nil {
		log.Fatalf("marshal event type catalog: %v", err)
	}

	if err := os.WriteFile(*outputPath, append(bytes, '\n'), 0o644); err != nil {
		log.Fatalf("write event type catalog: %v", err)
	}
}
