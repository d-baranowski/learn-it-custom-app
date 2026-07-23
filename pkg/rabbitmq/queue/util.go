package queue

func getHeaderValue[T any](headers map[string]interface{}, key string) (T, bool) {
	var zero T

	value, ok := headers[key]
	if !ok {
		return zero, false
	}

	cast, ok := value.(T)
	if !ok {
		return zero, false
	}

	return cast, true
}
