package maps

import (
	"sync"
)

type SafeMultiMap[K string | int | int32 | int64, VID string | int | int32 | int64, T any] struct {
	mu    sync.RWMutex
	items map[K]map[VID]T
}

func NewSafeMultiMap[K string | int | int32 | int64, VID string | int | int32 | int64, T any]() *SafeMultiMap[K, VID, T] {
	sm := &SafeMultiMap[K, VID, T]{
		mu:    sync.RWMutex{},
		items: make(map[K]map[VID]T),
	}

	return sm
}

func (sm *SafeMultiMap[K, VID, T]) Get(key K) (map[VID]T, bool) {
	sm.mu.RLock()
	defer sm.mu.RUnlock()

	value, ok := sm.items[key]
	return value, ok
}

// GetCopy
/**
 * Returns a copy of the map which will be safe to modify WARNING this is a shallow copy
 */
func (sm *SafeMultiMap[K, VID, T]) GetCopy(key K) (map[VID]T, bool) {
	sm.mu.RLock()
	defer sm.mu.RUnlock()

	original, ok := sm.items[key]
	if !ok {
		return nil, false
	}

	c := make(map[VID]T, len(original)) // Create a new map with the same size as original
	for k, value := range original {
		c[k] = value // Copy each key-value pair
	}
	return c, true
}

func (sm *SafeMultiMap[K, VID, T]) GetItem(key K, valueKey VID) (T, bool) {
	sm.mu.RLock()
	defer sm.mu.RUnlock()

	zeroValue := new(T)

	if _, ok := sm.items[key]; !ok {
		return *zeroValue, false
	}

	value, ok := sm.items[key][valueKey]
	return value, ok
}

func (sm *SafeMultiMap[K, VID, T]) GetSlice(key K) []T {
	sm.mu.RLock()
	defer sm.mu.RUnlock()

	if _, ok := sm.items[key]; !ok {
		return nil
	}

	var slice []T
	for _, value := range sm.items[key] {
		slice = append(slice, value)
	}
	return slice
}

func (sm *SafeMultiMap[K, VID, T]) Set(key K, valueID VID, value T) {
	sm.mu.Lock()
	defer sm.mu.Unlock()

	if _, ok := sm.items[key]; !ok {
		sm.items[key] = make(map[VID]T)
	}

	sm.items[key][valueID] = value
}

func (sm *SafeMultiMap[K, VID, T]) SetItems(items map[K]map[VID]T) {
	sm.mu.Lock()
	defer sm.mu.Unlock()

	sm.items = items
}

func (sm *SafeMultiMap[K, VID, T]) Contains(key K, valueID VID) bool {
	sm.mu.RLock()
	defer sm.mu.RUnlock()

	val, ok := sm.items[key]
	if !ok {
		return false
	}
	if _, ok := val[valueID]; !ok {
		return false
	}
	return true
}

func (sm *SafeMultiMap[K, VID, T]) Delete(key K, valueID VID) {
	sm.mu.Lock()
	defer sm.mu.Unlock()

	if _, ok := sm.items[key]; !ok {
		return
	}
	delete(sm.items[key], valueID)
}

func (sm *SafeMultiMap[K, VID, T]) DeleteMap(key K) {
	sm.mu.Lock()
	defer sm.mu.Unlock()
	delete(sm.items, key)
}

func (sm *SafeMultiMap[K, VID, T]) Len() int {
	sm.mu.RLock()
	defer sm.mu.RUnlock()

	return len(sm.items)
}

func (sm *SafeMultiMap[K, VID, T]) Map() map[K]map[VID]T {
	sm.mu.RLock()
	defer sm.mu.RUnlock()

	return sm.items
}

func (sm *SafeMultiMap[K, VID, T]) LenKey(key K) int {
	sm.mu.RLock()
	defer sm.mu.RUnlock()

	if _, ok := sm.items[key]; !ok {
		return 0
	}
	return len(sm.items[key])
}

func (sm *SafeMultiMap[K, VID, T]) Slice() []map[VID]T {
	sm.mu.RLock()
	defer sm.mu.RUnlock()

	var slice []map[VID]T
	for _, value := range sm.items {
		slice = append(slice, value)
	}
	return slice
}
