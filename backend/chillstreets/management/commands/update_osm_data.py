import subprocess
import tempfile
from django.core.management.base import BaseCommand, CommandError
from django.conf import settings
import requests
import os 
from django.db import models

class Command(BaseCommand):
    help = """
        Downloads the latest osm data and imports it to the database,
        attempting to update any affected user routes
    """

    # def add_arguments(self, parser):
    #     parser.add_argument("poll_ids", nargs="+", type=int)

    def handle(self, *args, **options):
        db = settings.DATABASES['default']
        osm_file = tempfile.NamedTemporaryFile()
        url = "https://overpass-api.de/api/map?bbox=-87.8558,41.6229,-87.5085,42.0488"
        print("fetching osm data")
        with requests.get(url, stream=True) as r:
            r.raise_for_status()
            for chunk in r.iter_content(chunk_size=8192):
                osm_file.write(chunk)

        print("fetched osm data")
        print("stripping osm data")

        stripped_osm_file = tempfile.NamedTemporaryFile()
        subprocess.run(f"osmconvert {osm_file.name} --drop-author --drop-version --out-osm -o={stripped_osm_file.name}", shell=True, check=True, capture_output=True, encoding='utf-8')

        print("importing osm data to postgres")
        osm2pgrouting_config = os.path.join(os.path.dirname(os.path.realpath(__file__)), "mapconfig_for_bicycles.xml")

        try:
          subprocess.run((
            f"osm2pgrouting -f {stripped_osm_file.name} -c {osm2pgrouting_config} "
            f"--prefix chicago_ --addnodes --tags --clean -d {db["NAME"]} -U {db["USER"]} "
            f"-W {db["PASSWORD"]}"
        ), shell=True, check=True, encoding='utf-8')
        except subprocess.CalledProcessError as e:
            print(e.output)


        # Recalculate routes
        # We can add an additional geometry column to the user_routes table for old/new snapped geometry
        # After this process, we move new -> old, and update new. We can then use another table
        # with a fk to user_routes to store notices for the specific route anywhere we updated
        # the ways.
        #
        # If we keep the routes table with just original_geometry and snapped_geometry we can
        # calculate the equivalent ways as a materialized view ("osm_id", "user_route_id")
        # which we then refresh at this point. The materialized view is what's actually used for routing
