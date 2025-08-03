import sys
import tempfile
from django.core.management.base import BaseCommand
from django.conf import settings
import requests
import os
import sh

from chillstreets.models import Edge


class Command(BaseCommand):
    help = """
        Downloads the latest osm data and imports it to the database,
        attempting to update any affected user routes
    """

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
        print("stripping tags from osm data")

        osmconvert = sh.Command("osmconvert")
        stripped_osm_file = tempfile.NamedTemporaryFile()
        osmconvert(osm_file.name, "--drop-author", "--drop-version",
                   "--out-osm", "-v", _out=stripped_osm_file, _err=sys.stderr)

        print("inserting osm data to postgres")
        osm2pgrouting_config = os.path.join(
            os.path.dirname(os.path.realpath(__file__)),
            "mapconfig_for_bicycles.xml"
        )
        osm2pgrouting = sh.Command("osm2pgrouting")
        osm2pgrouting(f=stripped_osm_file.name, c=osm2pgrouting_config,
                      prefix="chicago_", addnodes=True, tags=True, clean=True,
                      d=db["NAME"], U=db["USER"], W=db["PASSWORD"], h=db["HOST"], p=db["PORT"],
                      _out=sys.stdout, _err=sys.stderr)

        print("updating costs for counterflow lanes")
        Edge.fix_oneways()