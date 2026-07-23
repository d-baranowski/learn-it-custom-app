package logging

import (
	"context"
	"fmt"
	"io"
	"os"
	"reflect"
	"time"

	"github.com/fatih/color"

	"github.com/uptrace/bun"
)

type DebugQueryHook struct {
	enabled     bool
	noRowsErr   bool
	noTxDoneErr bool
	verbose     bool
	writer      io.Writer
}

var _ bun.QueryHook = (*DebugQueryHook)(nil)

func NewDebugQueryHook(noRowsErr, noTxDoneErr, verbose bool) *DebugQueryHook {
	h := &DebugQueryHook{
		enabled:     true,
		noRowsErr:   noRowsErr,
		noTxDoneErr: noTxDoneErr,
		verbose:     verbose,
		writer:      os.Stderr,
	}
	return h
}

func (h *DebugQueryHook) BeforeQuery(
	ctx context.Context, event *bun.QueryEvent,
) context.Context {
	return ctx
}

func (h *DebugQueryHook) AfterQuery(ctx context.Context, event *bun.QueryEvent) {
	if !h.enabled {
		return
	}

	switch true {
	case event.Err == nil && !h.verbose:
		return
	case IsNoRowsErr(event.Err) && !h.noRowsErr:
		return
	case IsTxDoneErr(event.Err) && !h.noTxDoneErr:
		return
	default:
	}

	now := time.Now()
	dur := now.Sub(event.StartTime)

	args := []interface{}{
		"[bun]",
		now.Format(" 15:04:05.000 "),
		formatOperation(event),
		fmt.Sprintf(" %10s ", dur.Round(time.Microsecond)),
		event.Query,
	}

	if event.Err != nil {
		typ := reflect.TypeOf(event.Err).String()
		args = append(args,
			"\t",
			color.New(color.BgRed).Sprintf(" %s ", typ+": "+event.Err.Error()),
		)
	}

	fmt.Fprintln(h.writer, args...)
}

func formatOperation(event *bun.QueryEvent) string {
	operation := event.Operation()
	return operationColor(operation).Sprintf(" %-16s ", operation)
}

func operationColor(operation string) *color.Color {
	switch operation {
	case "SELECT":
		return color.New(color.BgGreen, color.FgHiWhite)
	case "INSERT":
		return color.New(color.BgBlue, color.FgHiWhite)
	case "UPDATE":
		return color.New(color.BgYellow, color.FgHiBlack)
	case "DELETE":
		return color.New(color.BgMagenta, color.FgHiWhite)
	default:
		return color.New(color.BgWhite, color.FgHiBlack)
	}
}
