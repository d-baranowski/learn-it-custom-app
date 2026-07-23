package unix

import (
	"database/sql/driver"
	"encoding/xml"
	"fmt"
	"strconv"
	"time"

	jsoniter "github.com/json-iterator/go"
)

var (
	ErrTimestampNotSet = fmt.Errorf("timestamp not set")
)

type Timestamp struct {
	ms int64
}

func Now() Timestamp {
	return Timestamp{ms: time.Now().UnixMilli()}
}

func ZeroTimestamp() Timestamp {
	return Timestamp{ms: 0}
}

func NowInt64() int64 {
	return time.Now().UnixMilli()
}

func NowPtr() *Timestamp {
	return &Timestamp{ms: time.Now().UnixMilli()}
}

func GoTimeToTimestamp(t time.Time) Timestamp {
	return Timestamp{ms: t.UnixMilli()}
}

func IntToTimestamp(ms int) Timestamp {
	return Timestamp{ms: int64(ms)}
}

func Int64ToTimestamp(ms int64) Timestamp {
	return Timestamp{ms: ms}
}

func (ut Timestamp) TimestampToInt64() int64 {
	return ut.ms
}

func Int64ToTimestampErr(ms int64) (Timestamp, error) {
	if ms == 0 {
		return Timestamp{}, ErrTimestampNotSet
	}
	return Timestamp{ms: ms}, nil
}

func Int64PtrToTimestamp(ms *int64) *Timestamp {
	if ms == nil {
		return nil
	}
	ut := Timestamp{ms: *ms}
	return &ut
}

func (ut Timestamp) Add(ms int64) Timestamp {
	ut.ms += ms
	return ut
}

func (ut Timestamp) AddDuration(duration time.Duration) Timestamp {
	ut.ms += int64(duration / time.Millisecond)
	return ut
}

func (ut Timestamp) Sub(ts Timestamp) Timestamp {
	ut.ms -= ts.ms
	if ut.ms < 0 {
		ut.ms = 0
	}
	return ut
}

func (ut Timestamp) SubDuration(duration time.Duration) Timestamp {
	ut.ms -= int64(duration / time.Millisecond)
	if ut.ms < 0 {
		ut.ms = 0
	}
	return ut
}

func (ut Timestamp) Before(ts Timestamp) bool {
	return ut.ms < ts.ms
}

func (ut Timestamp) After(ts Timestamp) bool {
	return ut.ms > ts.ms
}

// In returns the number seconds when the timestamp will occur
// If the timestamp has already occurred, it will return 0
func (ut Timestamp) In() int {
	if ut.ms == 0 {
		return 0
	}
	return int(ut.ms - time.Now().UnixNano()/int64(time.Millisecond))
}

func (ut Timestamp) InDuration() time.Duration {
	if ut.ms == 0 {
		return 0
	}
	return time.Duration(ut.ms - time.Now().UnixNano()/int64(time.Millisecond))
}

func (ut Timestamp) Int64() int64 {
	return ut.ms
}

func (ut Timestamp) Int64Err() (int64, error) {
	if ut.ms == 0 {
		return 0, ErrTimestampNotSet
	}
	return ut.ms, nil
}

func (ut *Timestamp) Int64Ptr() *int64 {
	if ut == nil {
		return nil
	}
	if ut.ms == 0 {
		return nil
	}
	return &ut.ms
}

func (ut Timestamp) Seconds() int {
	return int(ut.ms / 1000)
}

func (ut Timestamp) Time() time.Time {
	if ut.ms == 0 {
		return time.Time{}
	}
	return time.Unix(0, ut.ms*int64(time.Millisecond))
}

func (ut Timestamp) Loc(loc *time.Location) time.Time {
	if ut.ms == 0 {
		return time.Time{}
	}
	return time.Unix(0, ut.ms*int64(time.Millisecond)).In(loc)
}

func (ut *Timestamp) LocTimestamp(loc *time.Location) Timestamp {
	if ut.ms == 0 {
		return Timestamp{ms: 0}
	}

	locTime := ut.Time().In(loc)

	return Timestamp{ms: locTime.UnixMilli()}
}

func (ut *Timestamp) Scan(value interface{}) error {
	if value == nil {
		return nil
	}
	switch v := value.(type) {
	case int64:
		ut.ms = v
		return nil
	default:
		return fmt.Errorf("cannot scan type %T into UnixTime", value)
	}
}

func (ut Timestamp) Value() (driver.Value, error) {
	// check if valid time or return nil
	if ut.ms == 0 {
		return nil, nil
	}
	return ut.ms, nil
}

func (ut Timestamp) MarshalJSON() ([]byte, error) {
	return jsoniter.Marshal(ut.ms)
}

func (ut *Timestamp) UnmarshalJSON(data []byte) error {
	var ms int64
	var err error

	var str string
	if err = jsoniter.Unmarshal(data, &str); err == nil {
		ms, err = strconv.ParseInt(str, 10, 64)
		if err != nil {
			return err
		}
	} else {
		if err = jsoniter.Unmarshal(data, &ms); err != nil {
			return err
		}
	}

	ut.ms = ms
	return nil
}

// MarshalXML implements the xml.Marshaler interface
func (ut Timestamp) MarshalXML(e *xml.Encoder, start xml.StartElement) error {
	return e.EncodeElement(ut.ms, start)
}

// UnmarshalXML implements the xml.Unmarshaler interface
func (ut *Timestamp) UnmarshalXML(d *xml.Decoder, start xml.StartElement) error {
	var v int64
	if err := d.DecodeElement(&v, &start); err != nil {
		return err
	}
	*ut = Int64ToTimestamp(v)
	return nil
}
