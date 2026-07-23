package maps

import (
	"sync"
)

type SafeMapSlice[K int | int32 | int64 | string, T int | string] struct {
	mu    sync.RWMutex
	items map[K][]T
}

func NewSafeMapSlice[K int | int32 | int64 | string, T int | string]() *SafeMapSlice[K, T] {
	sm := &SafeMapSlice[K, T]{
		mu:    sync.RWMutex{},
		items: make(map[K][]T),
	}

	return sm
}

func (sm *SafeMapSlice[K, T]) Get(key K) ([]T, bool) {
	sm.mu.RLock()
	defer sm.mu.RUnlock()

	value, ok := sm.items[key]
	return value, ok
}

func (sm *SafeMapSlice[K, T]) Set(key K, values []T) {
	sm.mu.Lock()
	defer sm.mu.Unlock()

	sm.items[key] = values
}

func (sm *SafeMapSlice[K, T]) Append(key K, value T) {
	sm.mu.Lock()
	defer sm.mu.Unlock()
	if _, ok := sm.items[key]; !ok {
		sm.items[key] = make([]T, 0)
	}
	sm.items[key] = append(sm.items[key], value)
}

func (sm *SafeMapSlice[K, T]) Remove(key K, val T) {
	sm.mu.Lock()
	defer sm.mu.Unlock()

	if _, ok := sm.items[key]; !ok {
		return
	}

	for i, v := range sm.items[key] {
		if v == val {
			sm.items[key] = append(sm.items[key][:i], sm.items[key][i+1:]...)
			return
		}
	}
}

func (sm *SafeMapSlice[K, T]) Contains(key K, value T) bool {
	sm.mu.RLock()
	defer sm.mu.RUnlock()

	val, ok := sm.items[key]
	if !ok {
		return false
	}

	for _, v := range val {
		if v == value {
			return true
		}
	}

	return true
}

func (sm *SafeMapSlice[K, T]) Delete(key K) {
	sm.mu.Lock()
	defer sm.mu.Unlock()
	delete(sm.items, key)
}

func (sm *SafeMapSlice[K, T]) Len() int {
	sm.mu.RLock()
	defer sm.mu.RUnlock()

	return len(sm.items)
}

func (sm *SafeMapSlice[K, T]) LenKey(key K) int {
	sm.mu.RLock()
	defer sm.mu.RUnlock()

	if _, ok := sm.items[key]; !ok {
		return 0
	}
	return len(sm.items[key])
}
