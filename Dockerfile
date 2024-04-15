FROM postgres:16

RUN apt-get update && apt-get install -y --no-install-recommends \
    osmctools osm2pgrouting wget make postgresql-16-pgrouting postgresql-16-postgis-3
