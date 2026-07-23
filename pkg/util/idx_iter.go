package util

import (
	"fmt"
	"strings"
)

type IdxIter struct {
	idx uint
	len uint
}

func (i IdxIter) Empty() bool {
	return i.len == 0
}

func (i IdxIter) Done() bool {
	return i.idx >= i.len
}

func (i *IdxIter) Next() {
	i.idx++
}

func (i *IdxIter) Reset() {
	i.idx = 0
}

func (i IdxIter) Idx() uint {
	return i.idx
}

func (i IdxIter) String() string {
	return fmt.Sprintf("%d/%d", i.idx, i.len)
}

func NewIdxIter(max uint) IdxIter {
	return IdxIter{idx: 0, len: max}
}

type IdxVectorIter []IdxIter

func (ii IdxVectorIter) Done() bool {
	last := len(ii) - 1
	return ii[last].Done()
}

func (ii IdxVectorIter) Next() {
	if len(ii) == 0 {
		return
	}
	last := len(ii) - 1
	for pos := range ii[:last] {
		ii[pos].Next()
		if ii[pos].Done() {
			ii[pos].Reset()
		} else {
			return
		}
	}
	ii[last].Next()
}

func (ii IdxVectorIter) String() string {
	var sb strings.Builder
	sb.WriteString("[")
	for _, i := range ii {
		sb.WriteString(i.String())
		sb.WriteString(",")
	}
	sb.WriteString("]")
	return sb.String()
}

func NewIdxVector(max ...uint) IdxVectorIter {
	res := make(IdxVectorIter, len(max))
	for pos := range res {
		res[pos].len = max[pos]
	}
	return res
}

func NewIdxVectorFromSlices[T any](slices [][]T) IdxVectorIter {
	max := make([]uint, len(slices))
	for pos := range slices {
		max[pos] = uint(len(slices[pos]))
	}
	return NewIdxVector(max...)
}

func Get[T any](slices [][]T, ii IdxVectorIter) []T {
	res := make([]T, len(ii))
	GetTo(slices, res, ii)
	return res
}

func GetTo[T any](slices [][]T, dst []T, ii IdxVectorIter) {
	for pos := range ii {
		if !ii[pos].Empty() {
			dst[pos] = slices[pos][ii[pos].Idx()]
		}
	}
}
