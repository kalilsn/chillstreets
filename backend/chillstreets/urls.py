"""
URL configuration for chillstreets project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.db import connection
from django.urls import path
from ninja import NinjaAPI
from ninja.errors import ValidationError

api = NinjaAPI()

@api.get("/snap")
async def snap(request, source: str, dest: str):
    # parse str to coordinates
    # query for route between source and destination
    # return ways
    return {}

@api.get("/health")
async def health(request):
    return "👍"

@api.get("/routes/{z}/{x}/{y}")
async def routes(request, z: int, x: int, y: int):
    if tile_err_msg := validate_tile(z, x, y):
        raise ValidationError(tile_err_msg)

    sql, params = get_tile_query(z, x, y)

    print(f"Running query with params {params}:")
    print(sql)

    with connection.cursor() as cursor:
        cursor.execute(sql, params)
        # TODO: Set content type header:
        # application/vnd.mapbox-vector-tile
        return cursor.fetchone()[0]

def validate_tile(z: int, x: int, y: int) -> str | None:
    min_size, max_size = 0, (2 ** (z - 1))
    size_err_msg = f"must be on the range [{min_size, max_size}] for zoom {z}"

    if not min_size <= x <= max_size:
        return f"x={x} {size_err_msg}"

    if not min_size <= y <= max_size:
        return f"y={y} {size_err_msg}"

def get_tile_query(z: int, x: int, y: int) -> tuple[str, dict]:
    # Width of world in EPSG:3857
    world_merc_max = 20037508.3427892
    world_merc_min = -1 * world_merc_max
    world_merc_size = world_merc_max - world_merc_min

    # World width in number of tiles
    world_tile_size = 2 ** z
    # Tile width in EPSG:3857
    tile_merc_size = world_merc_size / world_tile_size

    # Calculate geographic bounds from tile coordinates.
    # XYZ tile coordinates are in "image space" so origin is
    # top-left, not bottom right
    xmin = world_merc_min + tile_merc_size * x
    xmax = world_merc_min + tile_merc_size * (x + 1)
    ymin = world_merc_max - tile_merc_size * (y + 1)
    ymax = world_merc_max - tile_merc_size * y

    # Get SQL expression for bounds.
    # Densify the edges a little so the envelope can be
    # safely converted to other coordinate systems.
    densify_factor = 4
    seg_size = (xmax - xmin) / densify_factor

    sql = """
        WITH bounds AS (
            SELECT
                envelope.geom,
                envelope.geom::box2d AS b2d
            FROM (
                SELECT
                    ST_Segmentize(
                        ST_MakeEnvelope(
                            {xmin},
                            {ymin},
                            {xmax},
                            {ymax},
                            3857
                        ),
                        {seg_size}
                    ) AS geom
            ) AS envelope
        ),

        mvtgeom AS (
            SELECT
                ST_AsMVTGeom(
                    ST_Transform(routes.geom, 3857),
                    bounds.b2d
                ) AS geom,
                type
            FROM routes
            INNER JOIN bounds
                ON ST_Intersects(ST_Transform(routes.geom, 3857), bounds.geom))
        )

        SELECT ST_AsMVT(mvtgeom.*) FROM mvtgeom
    """

    params = {
        "xmin": xmin,
        "xmax": xmax,
        "ymin": ymin,
        "ymax": ymax,
    }

    return sql, params

urlpatterns = [
    path('admin/', admin.site.urls),
    path("api/", api.urls),
]

