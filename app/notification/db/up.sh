#!/usr/bin/env bash
# DSN: pass as $1, or set the standard DB_* env vars (run-stack/spin-up
# export these from the per-worktree registry). Falls back to canonical
# localhost:5432 only when nothing's set.
: "${DB_HOST:=127.0.0.1}"
: "${DB_PORT:=5432}"
: "${DB_USER:=postgres}"
: "${DB_PASS:=password}"
: "${DB_NAME:=rpg}"
DEFAULT_DSN="postgres://${DB_USER}:${DB_PASS}@${DB_HOST}:${DB_PORT}/${DB_NAME}?sslmode=disable"
DSN=${1:-$DEFAULT_DSN}
RETRIES=3
DELAY=5

for ((i=1; i<=RETRIES; i++)); do
    echo "Attempt $i to run goose migration..."
    goose -table notification_db_version postgres "$DSN" up
    if [ $? -eq 0 ]; then
        echo "Migration successful on attempt $i."
        exit 0
    else
        echo "Migration failed on attempt $i."
    fi

    if [ $i -lt $RETRIES ]; then
        echo "Retrying in $DELAY seconds..."
        sleep $DELAY
    fi
done

echo "Migration failed after $RETRIES attempts."
exit 1
