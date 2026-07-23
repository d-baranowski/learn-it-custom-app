#!/bin/bash

proto_dir="./proto"
gen_dir="./gen"

if [[ ! -d $proto_dir ]]; then
echo "error: directory $proto_dir does not exist."
exit 1
fi

symlinks=$(find "$proto_dir" -type l)

for symlink in $symlinks; do
symlink_name=$(basename "$symlink")

gen_file="$gen_dir/$symlink_name"

if [[ -e $gen_file ]]; then
rm -rf "$gen_file"
echo "cleaned $gen_file"
fi
done
