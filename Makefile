.PHONY: all
all: pgrouting/chicago.table

pgrouting/chicago.table: pgrouting/chicago-filtered.osm
	cat pgrouting/migrations/*.sql | psql -1 -f - && \
	osm2pgrouting -f $< -c /usr/share/osm2pgrouting/mapconfig_for_bicycles.xml \
		--prefix chicago_ --addnodes --tags --clean -d "${PGDATABASE}" -U "${PGUSER}" \
		-W "${PGPASSWORD}" && \
	psql -c " \
		UPDATE chicago_ways SET one_way = 2, oneway = 'NO', reverse_cost = cost \
		FROM osm_ways \
		WHERE osm_ways.osm_id = chicago_ways.osm_id \
		AND osm_ways.tags @> 'oneway:bicycle => no'" && \
	touch $@


pgrouting/chicago-filtered.osm: pgrouting/chicago.osm
	osmconvert $< --drop-author --drop-version --out-osm -o="$@"


pgrouting/chicago.osm:
	wget --no-use-server-timestamps -O $@ https://overpass-api.de/api/map?bbox=-87.8558,41.6229,-87.5085,42.0488
