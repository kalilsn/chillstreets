# Chill Streets (Chicago)

## Quickstart

### Installing dependencies

Make sure you install the following first:
Docker
Node 24

The backend django app can be run in docker locally, but the frontend has to run directly on your machine.

To install the frontend dependencies, run `npm install` from the `frontend` directory.

### Starting the backend

To run the django server and postgres db, use the docker-compose file in the root.
`docker compose up -d` will start both in the background.

### Running the migrations

To run migrations, run `docker compose run backend uv run manage.py migrate`

### Importing osm data

To import osm data run `docker compose run backend uv run manage.py update_osm_data`

This requires a lot of memory and some patience. You may need to increase the resources allocated to docker while running it. I recommend letting docker use at least 16GB of memory while running this import. It usually takes around 20 minutes on my computer (macbook m1 pro chip).

### Running the frontend dev server
Make sure you've installed the dependencies as described above, then from the `frontend` directory, run `npm run dev` to serve it locally at http://localhost:5173/
