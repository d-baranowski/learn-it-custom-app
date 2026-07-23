package logging

import (
	"context"
	"os"
	"path/filepath"
	"strings"
	"testing"

	"go.uber.org/fx"
	"go.uber.org/zap"
	"go.uber.org/zap/zapcore"
)

type fakeLifecycle struct{ hooks []fx.Hook }

func (f *fakeLifecycle) Append(h fx.Hook) { f.hooks = append(f.hooks, h) }

func (f *fakeLifecycle) runStops(t *testing.T) {
	t.Helper()
	for _, h := range f.hooks {
		if h.OnStop != nil {
			if err := h.OnStop(context.Background()); err != nil {
				t.Fatalf("OnStop returned error: %v", err)
			}
		}
	}
}

func TestWriteSyncerMirrorsToFile(t *testing.T) {
	path := filepath.Join(t.TempDir(), "core.log")
	lc := &fakeLifecycle{}

	ws, err := writeSyncer(&Config{Level: "debug", File: path}, lc)
	if err != nil {
		t.Fatalf("writeSyncer returned error: %v", err)
	}
	logger := zap.New(zapcore.NewCore(
		zapcore.NewConsoleEncoder(zap.NewDevelopmentEncoderConfig()),
		ws,
		zap.DebugLevel,
	))

	logger.Info("hello-file-log")
	_ = logger.Sync()
	lc.runStops(t)

	data, err := os.ReadFile(path)
	if err != nil {
		t.Fatalf("reading log file: %v", err)
	}
	if !strings.Contains(string(data), "hello-file-log") {
		t.Fatalf("log file missing message, got: %q", string(data))
	}
}

func TestWriteSyncerUnopenableFileErrors(t *testing.T) {
	lc := &fakeLifecycle{}

	// A file under a non-existent directory can't be opened. A configured
	// LOG_FILE that can't be written must fail loudly, not silently degrade.
	_, err := writeSyncer(&Config{File: filepath.Join(t.TempDir(), "missing-dir", "svc.log")}, lc)

	if err == nil {
		t.Fatal("expected an error for an unopenable LOG_FILE, got nil")
	}
	if len(lc.hooks) != 0 {
		t.Fatalf("expected no lifecycle hooks on open failure, got %d", len(lc.hooks))
	}
}

func TestWriteSyncerNoFileRegistersNoHook(t *testing.T) {
	lc := &fakeLifecycle{}

	if _, err := writeSyncer(&Config{}, lc); err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(lc.hooks) != 0 {
		t.Fatalf("expected no lifecycle hooks when LOG_FILE unset, got %d", len(lc.hooks))
	}
}

func TestZapProviderRejectsInvalidLevel(t *testing.T) {
	lc := &fakeLifecycle{}

	_, err := ZapProvider(lc, ZapProviderProps{Config: &Config{Level: "loud"}})
	if err == nil {
		t.Fatal("expected ZapProvider to reject an invalid LOG_LEVEL, got nil error")
	}
}

func TestZapProviderRejectsUnopenableFile(t *testing.T) {
	lc := &fakeLifecycle{}

	_, err := ZapProvider(lc, ZapProviderProps{
		Config: &Config{Level: "info", File: filepath.Join(t.TempDir(), "missing-dir", "svc.log")},
	})
	if err == nil {
		t.Fatal("expected ZapProvider to fail when LOG_FILE can't be opened, got nil error")
	}
}
