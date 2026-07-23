package tree

import (
	"fmt"
	"strings"
)

type Path struct {
	path     []string
	accuracy int
	wildcard bool
}

func NewTreePath(wildcard bool) *Path {
	return &Path{
		path:     []string{},
		accuracy: 0,
		wildcard: wildcard,
	}
}

func (p *Path) Add(s ...string) {
	for _, v := range s {
		if strings.TrimSpace(v) == "" {
			// todo: be aware of this
			p.add(nil)
			continue
		}
		p.add(&v)
	}
}

func (p *Path) AddInt(s ...int) {
	for _, i := range s {
		v := fmt.Sprintf("%d", i)
		p.add(&v)
	}
}

func (p *Path) AddInt32(s ...int32) {
	for _, i := range s {
		v := fmt.Sprintf("%d", i)
		p.add(&v)
	}
}

func (p *Path) AddInt64(s ...int64) {
	for _, i := range s {
		v := fmt.Sprintf("%d", i)
		p.add(&v)
	}
}

func (p *Path) AddMxc(s ...int) {
	for _, i := range s {
		if i == -1 {
			p.add(nil)
			continue
		}
		v := fmt.Sprintf("%d", i)
		p.add(&v)
		// add additional accuracy to ensure mcc/mnc win out
		// todo: danger will robinson
		p.accuracy += 5
	}
}

func (p *Path) AddOptional(s ...*string) {
	for _, v := range s {
		p.add(v)
	}
}

func (p *Path) add(s *string) {
	if s == nil {
		v := "-"
		if p.wildcard {
			v = Wildcard
		}
		p.path = append(p.path, v)
		return
	}
	if *s == "" {
		return
	}
	p.path = append(p.path, *s)
	p.accuracy++
}

func (p *Path) Accuracy() int {
	return p.accuracy
}

func (p *Path) IncrAccuracy() {
	p.accuracy++
}

func (p *Path) DecrAccuracy() {
	p.accuracy--
}

func (p *Path) Join(sep string) string {
	return strings.Join(p.path, sep)
}

func (p *Path) Path() []string {
	return p.path
}

func (p *Path) String() string {
	return "/" + p.Join("/")
}
