package wal

import (
	"github.com/google/uuid"
	"github.com/jackc/pglogrepl"
	jsoniter "github.com/json-iterator/go"
	"github.com/segmentio/ksuid"
	"go.uber.org/zap"
	"pkg/cdc/event"
	"pkg/decimal"
	"strconv"
	"strings"
	"time"
)

//type ActionKind string
//
//func (k ActionKind) string() string {
//	return string(k)
//}
//
//// kind of WAL message.
//const (
//	ActionKindInsert ActionKind = "INSERT"
//	ActionKindUpdate ActionKind = "UPDATE"
//	ActionKindDelete ActionKind = "DELETE"
//)

type ActionData struct {
	Schema     string
	Table      string
	Kind       event.CdcAction
	OldColumns []Column
	NewColumns []Column
}

type Column struct {
	name      string
	value     any
	valueType uint32
}

type Transaction struct {
	LSN        pglogrepl.LSN
	BeginTime  *time.Time
	CommitTime *time.Time
	Relations  map[uint32]*pglogrepl.RelationMessage
	Actions    []ActionData
}

func NewTransaction() *Transaction {
	return &Transaction{
		Relations: make(map[uint32]*pglogrepl.RelationMessage),
	}
}

func (c *Column) AssertValue(src []byte) {
	var (
		val any
		err error
	)

	if src == nil {
		c.value = nil
		return
	}

	strSrc := string(src)

	const (
		timestampLayout       = "2006-01-02 15:04:05"
		timestampWithTZLayout = "2006-01-02 15:04:05.999999999-07"
	)

	switch c.valueType {
	case BoolOID:
		val, err = strconv.ParseBool(strSrc)
	case Int2OID, Int4OID:
		val, err = strconv.Atoi(strSrc)
	case Int8OID:
		val, err = strconv.ParseInt(strSrc, 10, 64)
	case TextOID, BpCharOID, VarcharOID:
		val = strSrc
	case TextArrayOID:
		val = strings.Split(strSrc[1:len(strSrc)-1], ",")
	case CharArrayOID:
		val = strings.Split(strSrc[1:len(strSrc)-1], ",")
	case TimestampOID:
		val, err = time.Parse(timestampLayout, strSrc)
	case TimestamptzOID:
		val, err = time.ParseInLocation(timestampWithTZLayout, strSrc, time.UTC)
	case DateOID, TimeOID:
		val = strSrc
	case NumericOID:
		val, err = decimal.NewFromString(strSrc)
	case UUIDOID:
		val, err = uuid.Parse(strSrc)
	case JSONBOID:
		var m any
		if src[0] == '[' {
			m = make([]any, 0)
		} else {
			m = make(map[string]any)
		}
		err = jsoniter.Unmarshal(src, &m)
		val = m
	default:
		zap.L().Warn("unknown oid type", zap.Uint32("pgtype", c.valueType), zap.String("column_name", c.name))
		val = strSrc
	}

	if err != nil {
		zap.L().Error("column data parse error", zap.Uint32("pgtype", c.valueType), zap.String("column_name", c.name), zap.Error(err))
	}

	c.value = val
}

func (w *Transaction) Clear() {
	w.CommitTime = nil
	w.BeginTime = nil
	w.Actions = nil
}

// CreateActionData create action from WAL message data.
func (w *Transaction) CreateActionData(
	relationID uint32,
	old *pglogrepl.TupleData,
	new *pglogrepl.TupleData,
	kind event.CdcAction) (a ActionData, err error) {

	rel, ok := w.Relations[relationID]
	if !ok {
		return a, errRelationNotFound
	}

	a = ActionData{
		Schema: rel.Namespace,
		Table:  rel.RelationName,
		Kind:   kind,
	}

	var oldColumns []Column

	if old != nil {
		for num, row := range old.Columns {
			column := Column{
				name:      rel.Columns[num].Name,
				valueType: rel.Columns[num].DataType,
				//isKey:     rel.Columns[num].isKey,
			}
			column.AssertValue(row.Data)
			oldColumns = append(oldColumns, column)
		}
	}

	a.OldColumns = oldColumns

	if new == nil {
		return a, nil
	}

	var newColumns []Column
	for num, row := range new.Columns {
		column := Column{
			name:      rel.Columns[num].Name,
			valueType: rel.Columns[num].DataType,
			//isKey:     rel.Columns[num].isKey,
		}
		column.AssertValue(row.Data)
		newColumns = append(newColumns, column)
	}
	a.NewColumns = newColumns

	return a, nil
}

func (w *Transaction) CreateEventsWithFilter(tableMap map[string][]string) []Event {
	var events []Event

	for _, item := range w.Actions {
		oldData := make(map[string]any)
		for _, val := range item.OldColumns {
			oldData[val.name] = val.value
		}

		newData := make(map[string]any)
		for _, val := range item.NewColumns {
			newData[val.name] = val.value
		}

		e := Event{
			ID:        ksuid.New().String(),
			Schema:    item.Schema,
			Table:     item.Table,
			Action:    item.Kind,
			New:       newData,
			Old:       oldData,
			EventTime: *w.CommitTime,
		}

		actions, validTable := tableMap[item.Schema+"."+item.Table]

		validAction := inArray(actions, item.Kind.String())
		if validTable && validAction {
			events = append(events, e)
			continue
		}

		zap.L().Debug("wal-message was skipped by filter",
			zap.String("schema", item.Schema),
			zap.String("table", item.Table),
			zap.String("action", item.Kind.String()),
		)
	}

	return events
}

// inArray checks whether the value is in an array.
func inArray(arr []string, value string) bool {
	for _, v := range arr {
		if strings.EqualFold(v, value) {
			return true
		}
	}

	return false
}
