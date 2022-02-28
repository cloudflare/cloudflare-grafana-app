# Contributing

## Building and Installing the Plugin

You will need [node + npm installed](https://nodejs.org/en/) to build the plugin.
The included `Makefile` makes the rest easy:

```sh
# Fetch all dependencies
make get-deps
# Build the plugin
make build
# Copy the plugin to your Grafana plugins directory
sudo rsync --recursive --delete dist/ /var/lib/grafana/plugins/cloudflare-app
```

Note: modern versions of Grafana do not load unsigned plugins by default. Be
sure to set `app_mode = development` in Grafana's configuration file (usually
`/etc/grafana/grafana.ini`) to allow the plugin to load.

## Running Locally via Docker

The `Makefile` can spin up a local Grafana instance with the Cloudflare DNS
plugin installed.
You will need [node + npm installed](https://nodejs.org/en/) for the
dependencies, as well as
[Docker](https://docs.docker.com/engine/installation/), in order to build the
plugin and run Grafana.

```sh
# Follow the instructions for building the plugin first.
# Run Grafana in Docker
make run
```

Visit `http://localhost:3000/` and use `admin:admin` (user:password) to log in.
Although we recommend installing the plugin and installing it into a permanent
Grafana installation, the Docker approach can be useful for quick testing or
debugging.
