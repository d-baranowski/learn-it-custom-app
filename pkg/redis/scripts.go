package redis

import (
	"context"
	"crypto/sha1"
	"fmt"
	"github.com/redis/go-redis/v9"
)

type Scripts struct {
	scripts map[string]string
	sha1s   map[string]string
}

func NewScripts() *Scripts {
	return &Scripts{
		scripts: make(map[string]string),
		sha1s:   make(map[string]string),
	}
}

func (s *Scripts) Load(name string, script interface{}) error {
	var bytes []byte
	switch script.(type) {
	case []byte:
		s.scripts[name] = string(script.([]byte))
		bytes = script.([]byte)
	case string:
		s.scripts[name] = script.(string)
		bytes = []byte(script.(string))
	default:
		return fmt.Errorf("invalid script type")
	}

	h := sha1.New()
	h.Write(bytes)
	bs := h.Sum(nil)
	_sha1 := fmt.Sprintf("%x", bs)

	s.sha1s[name] = _sha1

	return nil
}

func (s *Scripts) Run(ctx context.Context, rdb redis.UniversalClient, name string, keys []string, args ...interface{}) (interface{}, error) {
	_sha1, ok := s.sha1s[name]
	if !ok {
		return nil, fmt.Errorf("script not found: %s", name)
	}

	result, err := rdb.EvalSha(ctx, _sha1, keys, args...).Result()
	if err != nil {
		// check if it's a NOSCRIPT error
		if err.Error() == "NOSCRIPT No matching script. Please use EVAL." {
			// load the script into Redis
			_, err = rdb.ScriptLoad(ctx, s.scripts[name]).Result()
			if err != nil {
				return nil, err
			}

			result, err = rdb.EvalSha(ctx, _sha1, keys, args...).Result()
			if err != nil {
				return nil, err
			}
		} else {
			return nil, err
		}
	}

	return result, nil
}

func (s *Scripts) GetScript(name string) (string, error) {
	if script, ok := s.scripts[name]; ok {
		return script, nil
	}

	return "", fmt.Errorf("script %s not found", name)
}

func (s *Scripts) GetSha1(name string) (string, error) {
	if _sha1, ok := s.sha1s[name]; ok {
		return _sha1, nil
	}

	return "", fmt.Errorf("script %s not found", name)
}
