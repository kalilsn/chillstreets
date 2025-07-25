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
from typing import Literal
from django.contrib import admin
from django.urls import path
from ninja import NinjaAPI, Schema


from chillstreets.models import UserRoute

api = NinjaAPI()

class RouteChanges(Schema):
    updated: dict[str, str]
    deleted: list[str]

@api.post("/routes", operation_id="saveRouteChanges")
def save(request, changes: RouteChanges):
    update_query = UserRoute.upsert_routes(changes.updated.items())
    delete_query = UserRoute.objects.filter(pk__in=changes.deleted).delete()
    return 200

class RouteGeometry(Schema):
    type: Literal["LineString"]
    coordinates: list[tuple[float,float]]

class Route(Schema):
    id: str
    geometry: str

@api.get("/routes", response=list[Route], operation_id="getRoutes")
def routes(request):
    routes = UserRoute.get_routes()
    return routes

@api.get("/health", operation_id="health")
async def health(request):
    return "👍"

urlpatterns = [
    path('admin/', admin.site.urls),
    path("api/", api.urls),
]

