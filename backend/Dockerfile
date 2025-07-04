FROM ghcr.io/astral-sh/uv:python3.13-bookworm

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    UV_LINK_MODE=copy \
    UV_PYTHON_DOWNLOADS=never \
    UV_PROJECT_ENVIRONMENT=/app/.venv

RUN apt update && apt-get install -y \
    binutils libproj-dev gdal-bin netcat-traditional

COPY pyproject.toml uv.lock /_lock/

RUN --mount=type=cache,target=/root/.cache \
    cd /_lock && \
    uv sync \
    --frozen \
    --no-install-project

# Copy the project into the image
COPY . .

# Sync the project into a new environment, asserting the lockfile is up to date
RUN uv sync --locked

ENTRYPOINT [ "/app/entrypoint.sh" ]

CMD [ "uv", "run", "manage.py", "runserver", "0.0.0.0:8000" ]