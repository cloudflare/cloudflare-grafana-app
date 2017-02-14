Powering over 38% of managed DNS domains, [Cloudflare](https://www.cloudflare.com) runs one of the largest authoritative DNS networks. Cloudflare DNS is truly global, with over 100 data centers in more than 50 countries, serving 86 billion DNS queries per day, and growing. More than 5.5 million Internet properties use Cloudflare DNS to make sure their property is online and always available to anyone in the world. 

The Cloudflare DNS Grafana App gives Cloudflare users a view of their DNS traffic from Cloudflare's edge. Monitor and explore DNS traffic by geography, latency, response code, query type and hostname.

## Requirements
The Cloudflare App requires [Grafana 3.0](https://grafana.org) (or higher) and a [Cloudflare account](https://www.cloudflare.com). There are no other external dependencies, accounts or configurations needed.

### Building & Installing the Plugin

You will need [node + npm installed](https://nodejs.org/en/) to build the plugin. The included `Makefile` makes the rest easy:

```sh
# Fetch all dependencies
make get-deps
# Build the plugin
make build
# Copy the plugin to your Grafana plugins directory
cp -R dist/* /var/lib/grafana/plugins/cloudflare
```

### Running Locally via Docker

The `Makefile` can spin up a local Grafana instance with the Cloudflare DNS plugin installed. You will need [node + npm installed](https://nodejs.org/en/) for the dependencies, as well as [Docker](https://docs.docker.com/engine/installation/), in order to build the plugin & run Grafana.

```sh
# Follow the instructions for building the plugin first.
# Run Grafana in Docker
make run
```

Visit `http://localhost:3000/` and use `admin:admin` (user:password) to log in. Although we recommend installing the plugin and installing it into a permanent Grafana installation, the Docker approach can be useful for quickly debugging or testing.

## Features
Give your team a quick view into DNS traffic. This app provides instant visibility into query rates and latencies, and Cloudflare's high frequency monitoring service.

### Supported metrics
- Queries per second, broken down by dimensions and filters
- DNS latency monitoring

## Getting Help

### Documentation
- [Cloudflare API](https://api.cloudflare.com)
- [Cloudflare Knowledge Base](https://support.cloudflare.com/hc)

### Feedback and Questions
We would love to hear what you think of this app and if you have any feature requests for future versions. Please submit any issues with the app on [Github](https://github.com/cloudflare/cloudflare-grafana-app/issues) or [contact us directly](https://www.cloudflare.com).

## License
Apache 2.0 licensed. See the LICENSE file for details.
