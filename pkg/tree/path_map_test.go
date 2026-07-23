package tree

import (
	"github.com/segmentio/ksuid"
	"regexp"
	"testing"
)

type Binding struct {
	ID          string
	OwnerID     string
	SrcAddress  *string
	MessageText *regexp.Regexp
	Include     bool
}

type BindingResult struct {
	Include map[string]struct{}
	Exclude map[string]struct{}
}

func filter(srcAddress, message string, result *BindingResult) PathMapVisitorFunc {
	return func(val map[string]interface{}) error {
		for _, v := range val {
			b := v.(*Binding)

			if b.MessageText != nil {
				if !b.MessageText.MatchString(message) {
					continue
				}
			}

			if b.Include {
				// check if it's excluded
				if _, ok := result.Exclude[b.OwnerID]; !ok {
					result.Include[b.OwnerID] = struct{}{}
				}
			} else {
				result.Exclude[b.OwnerID] = struct{}{}

				// check if it's included
				if _, ok := result.Include[b.OwnerID]; ok {
					delete(result.Include, b.OwnerID)
				}
			}
		}

		return nil
	}
}

func TestPathMapGet(t *testing.T) {

	b1 := Binding{
		ID:          ksuid.New().String(),
		OwnerID:     "1",
		SrcAddress:  nil,
		MessageText: regexp.MustCompile("123"),
		Include:     true,
	}

	b2 := Binding{
		ID:          ksuid.New().String(),
		OwnerID:     "2",
		SrcAddress:  nil,
		MessageText: regexp.MustCompile("456"),
		Include:     true,
	}

	b3 := Binding{
		ID:          ksuid.New().String(),
		OwnerID:     "3",
		SrcAddress:  nil,
		MessageText: nil,
		Include:     false,
	}

	m := NewPathMapTree()
	m.Set([]string{"customerID", "connectionID", "providerID", "providerConnectionID", "123", "456"}, b1.ID, &b1)
	m.Set([]string{"*", "connectionID", "providerID", "providerConnectionID", "123", "456"}, b2.ID, &b2)
	m.Set([]string{"*", "*", "providerID", "providerConnectionID", "123", "456"}, b3.ID, &b3)

	path := []string{"customerID", "connectionID", "providerID", "providerConnectionID", "123", "456"}

	srcAddress := "FACEBOOK"
	message := "Your code is 123-456"

	var result = &BindingResult{
		Include: make(map[string]struct{}),
		Exclude: make(map[string]struct{}),
	}
	err := m.Visit(path, filter(srcAddress, message, result))
	if err != nil {
		t.Fatalf("unexpected error: %s", err)
	}

	// asset include contains 1 and 3 and exclude contains 3
	if _, ok := result.Include["1"]; !ok {
		t.Fatalf("unexpected result: %v", result)
	}
	if _, ok := result.Include["2"]; !ok {
		t.Fatalf("unexpected result: %v", result)
	}
	if _, ok := result.Exclude["3"]; !ok {
		t.Fatalf("unexpected result: %v", result)
	}

	m.Delete([]string{"customerID", "connectionID", "providerID", "providerConnectionID", "123", "456"}, b1.ID)

	result = &BindingResult{
		Include: make(map[string]struct{}),
		Exclude: make(map[string]struct{}),
	}
	err = m.Visit(path, filter(srcAddress, message, result))
	if err != nil {
		t.Fatalf("unexpected error: %s", err)
	}

	// asset include contains 2 and exclude contains 3
	if _, ok := result.Include["1"]; ok {
		t.Fatalf("unexpected result: %v", result)
	}
	if _, ok := result.Include["2"]; !ok {
		t.Fatalf("unexpected result: %v", result)
	}
	if _, ok := result.Exclude["3"]; !ok {
		t.Fatalf("unexpected result: %v", result)
	}
}
