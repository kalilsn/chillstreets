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
import asyncio
import json
from django.contrib import admin
from django.urls import path
from ninja import NinjaAPI, Schema
from django.core.serializers import serialize
from asgiref.sync import sync_to_async


from chillstreets.models import UserRoute

api = NinjaAPI()

class RouteChanges(Schema):
    updated: dict[str, str]
    deleted: list[str]

@api.post("/routes")
def save(request, changes: RouteChanges):
    print([{"id":featureId, "original_geometry":geometry} for featureId, geometry in changes.updated.items()])
    update_query = UserRoute.upsert_routes(changes.updated.items())
    delete_query = UserRoute.objects.filter(pk__in=changes.deleted).delete()
    return update_query

@api.get("/routes")
def routes(request):
    return UserRoute.get_routes()

@api.get("/snap")
async def snap(request, source: str, dest: str):
    # parse str to coordinates
    # query for route between source and destination
    # return ways
    return {}

@api.get("/health")
async def health(request):
    return "👍"

urlpatterns = [
    path('admin/', admin.site.urls),
    path("api/", api.urls),
]

