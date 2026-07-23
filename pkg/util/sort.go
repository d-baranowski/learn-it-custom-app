package util

import "sort"

func SortIntSlice(arr []int) {
	sort.Slice(arr, func(i, j int) bool { return arr[i] < arr[j] })
}

func SortInt32Slice(arr []int32) {
	sort.Slice(arr, func(i, j int) bool { return arr[i] < arr[j] })
}
