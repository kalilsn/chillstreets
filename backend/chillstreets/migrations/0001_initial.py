# Generated by Django 5.2.4 on 2025-07-04 15:49

import django.contrib.gis.db.models.fields
import django.contrib.postgres.fields
import django.contrib.postgres.fields.hstore
from django.db import migrations, models
from django.contrib.postgres.operations import HStoreExtension, CreateExtension


class Migration(migrations.Migration):

    initial = True

    dependencies = [
    ]

    operations = [
        HStoreExtension(),
        CreateExtension('postgis'),
        CreateExtension('pgrouting'),
        migrations.CreateModel(
            name='Edge',
            fields=[
                ('gid', models.BigIntegerField(primary_key=True, serialize=False)),
                ('osm_id', models.BigIntegerField()),
                ('tag_id', models.IntegerField()),
                ('length', models.FloatField()),
                ('length_m', models.FloatField()),
                ('name', models.TextField()),
                ('source', models.BigIntegerField()),
                ('target', models.BigIntegerField()),
                ('source_osm', models.BigIntegerField()),
                ('target_osm', models.BigIntegerField()),
                ('cost', models.FloatField()),
                ('reverse_cost', models.FloatField()),
                ('cost_s', models.FloatField()),
                ('reverse_cost_s', models.FloatField()),
                ('rule', models.TextField()),
                ('one_way', models.IntegerField()),
                ('oneway', models.TextField()),
                ('x1', models.FloatField()),
                ('y1', models.FloatField()),
                ('x2', models.FloatField()),
                ('y2', models.FloatField()),
                ('maxspeed_forward', models.FloatField()),
                ('maxspeed_backward', models.FloatField()),
                ('priority', models.FloatField()),
                ('the_geom', django.contrib.gis.db.models.fields.LineStringField(srid=4326)),
            ],
            options={
                'db_table': 'chicago_ways',
                'managed': True,
            },
        ),
        migrations.CreateModel(
            name='Way',
            fields=[
                ('osm_id', models.BigIntegerField(primary_key=True, serialize=False)),
                ('members', django.contrib.postgres.fields.hstore.HStoreField()),
                ('tags', django.contrib.postgres.fields.hstore.HStoreField()),
                ('tag_name', models.TextField()),
                ('tag_value', models.TextField()),
                ('name', models.TextField()),
                ('the_geom', django.contrib.gis.db.models.fields.LineStringField(srid=4326)),
            ],
            options={
                'db_table': 'osm_ways',
                'managed': True,
            },
        ),
        migrations.CreateModel(
            name='MellowRoute',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('slug', models.SlugField()),
                ('name', models.CharField(max_length=150)),
                ('bounding_box', django.contrib.gis.db.models.fields.PolygonField(blank=True, null=True, srid=4326)),
                ('type', models.CharField(choices=[('route', 'Official bike route'), ('street', 'Mellow street'), ('path', 'Off-street bike path')], default='street', max_length=6)),
                ('ways', django.contrib.postgres.fields.ArrayField(base_field=models.BigIntegerField(), default=list, help_text='Select one or more streets on the map to mark them as mellow. Add or remove a street by clicking on it, or remove all streets by clicking the "Clear all" button.', size=None)),
            ],
            options={
                'unique_together': {('slug', 'type')},
            },
        ),
    ]
