#!/bin/sh

echo "Waiting for postgres..." >&2

while ! nc -z $POSTGRES_HOST $POSTGRES_PORT; do
    sleep 0.1
done

echo "PostgreSQL started" >&2

exec "$@"