FROM postgres:16

# Install build dependencies for pg_bigm
RUN apt-get update && apt-get install -y \
    build-essential \
    git \
    postgresql-server-dev-16 \
    libicu-dev \
    && rm -rf /var/lib/apt/lists/*

# Clone and build pg_bigm
RUN git clone https://github.com/pgbigm/pg_bigm.git /tmp/pg_bigm \
    && cd /tmp/pg_bigm \
    && make USE_PGXS=1 \
    && make USE_PGXS=1 install \
    && rm -rf /tmp/pg_bigm

# Clean up build dependencies to reduce image size
RUN apt-get purge -y build-essential git postgresql-server-dev-16 \
    && apt-get autoremove -y \
    && apt-get clean
