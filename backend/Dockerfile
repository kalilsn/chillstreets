FROM ghcr.io/astral-sh/uv:python3.13-alpine

# Copy the project into the image
COPY . /app
WORKDIR /app

# Sync the project into a new environment, asserting the lockfile is up to date
RUN uv sync --locked

ENTRYPOINT [ "/app/entrypoint.sh" ]

CMD [ "uv", "run", "manage.py", "runserver", "0.0.0.0:8000" ]