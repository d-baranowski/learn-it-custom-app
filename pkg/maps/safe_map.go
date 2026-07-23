package maps

import (
	"sync"
)

type SafeMap[K int | int32 | int64 | string, T any] struct {
	mu    sync.RWMutex
	items map[K]T
}

func NewSafeMap[K int | int32 | int64 | string, T any]() *SafeMap[K, T] {
	sm := &SafeMap[K, T]{
		items: make(map[K]T),
	}

	return sm
}

func (sm *SafeMap[K, T]) Get(key K) (T, bool) {
	sm.mu.RLock()
	defer sm.mu.RUnlock()

	value, ok := sm.items[key]
	return value, ok
}

func (sm *SafeMap[K, T]) GetOrSet(key K, value T) (T, bool) {
	sm.mu.Lock()
	defer sm.mu.Unlock()

	existing, ok := sm.items[key]
	if ok {
		return existing, true
	}

	sm.items[key] = value

	return value, false
}

func (sm *SafeMap[K, T]) Has(key K) bool {
	sm.mu.RLock()
	defer sm.mu.RUnlock()

	_, ok := sm.items[key]
	return ok
}

func (sm *SafeMap[K, T]) Keys() []K {
	sm.mu.RLock()
	defer sm.mu.RUnlock()

	keys := make([]K, 0, len(sm.items))
	for k := range sm.items {
		keys = append(keys, k)
	}
	return keys
}

func (sm *SafeMap[K, T]) Pop(key K) (T, bool) {
	sm.mu.Lock()
	defer sm.mu.Unlock()

	value, ok := sm.items[key]
	delete(sm.items, key)
	return value, ok
}

func (sm *SafeMap[K, T]) Set(key K, value T) {
	sm.mu.Lock()
	defer sm.mu.Unlock()

	sm.items[key] = value
}

func (sm *SafeMap[K, T]) SetItems(items map[K]T) {
	sm.mu.Lock()
	defer sm.mu.Unlock()

	sm.items = items
}

func (sm *SafeMap[K, T]) Replace(key K, value T) bool {
	sm.mu.Lock()
	defer sm.mu.Unlock()

	_, ok := sm.items[key]
	sm.items[key] = value
	return ok
}

func (sm *SafeMap[K, T]) Delete(key K) {
	sm.mu.Lock()
	defer sm.mu.Unlock()

	delete(sm.items, key)
}

func (sm *SafeMap[K, T]) Clone() *SafeMap[K, T] {
	sm.mu.RLock()
	defer sm.mu.RUnlock()

	_m := NewSafeMap[K, T]()
	for k, v := range sm.items {
		_m.Set(k, v)
	}
	return _m
}

func (sm *SafeMap[K, T]) Len() int {
	sm.mu.RLock()
	defer sm.mu.RUnlock()

	return len(sm.items)
}

func (sm *SafeMap[K, T]) Map() map[K]T {
	sm.mu.RLock()
	defer sm.mu.RUnlock()

	//_m := make(map[K]T)
	//for k, v := range sm.items {
	//	_m[k] = v
	//}
	//return _m

	return sm.items
}

func (sm *SafeMap[K, T]) Slice() []T {
	sm.mu.RLock()
	defer sm.mu.RUnlock()

	entries := make([]T, 0, len(sm.items))
	for _, value := range sm.items {
		entries = append(entries, value)
	}
	return entries
}

func (sm *SafeMap[K, T]) RLock() {
	sm.mu.RLock()
}

func (sm *SafeMap[K, T]) RUnlock() {
	sm.mu.RUnlock()
}

func (sm *SafeMap[K, T]) Lock() {
	sm.mu.Lock()
}

func (sm *SafeMap[K, T]) Unlock() {
	sm.mu.Unlock()
}
