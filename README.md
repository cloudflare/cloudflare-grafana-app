[Cloudflare](https://www.cloudflare.com) runs one of the largest authoritative
DNS networks.
Cloudflare DNS is truly global, with over 250 data centers in more than 100
countries, serving hundreds of billions of DNS queries per day, and growing.
More than 25 million Internet properties use Cloudflare DNS to make sure their
property is online and always available to anyone in the world.

The Cloudflare DNS Grafana App gives Cloudflare users a view of their DNS
traffic from Cloudflare's edge.
Monitor and explore DNS traffic by geography, latency, response code, query
type, and hostname.

## Deprecation Notice

**This app is deprecated.**

This app is deprecated and will no longer be updated after December 31, 2023.
Please consider using the [Cloudflare Dashboard][dashboard] or [DNS Analytics
API][api] instead.

[dashboard]: https://dash.cloudflare.com/?to=/:account/:zone/analytics/dns
[api]: https://developers.cloudflare.com/api/operations/dns-analytics-table

## Requirements

The Cloudflare App requires [Grafana](https://grafana.org) version 3.0 to 9.x
and a [Cloudflare account](https://www.cloudflare.com). Grafana 10 or later
versions are not supported.
There are no other external dependencies, accounts or configurations needed.

## Installation

[Cloudflare Grafana App](https://grafana.com/grafana/plugins/cloudflare-app/)
can be installed from grafana.com.

For other methods, please see
[CONTRIBUTING.md](https://github.com/cloudflare/cloudflare-grafana-app/blob/main/CONTRIBUTING.md).

## Features

Give your team a quick view into DNS traffic. This app provides instant
visibility into query rates and latencies, and Cloudflare's high frequency
monitoring service.

This app supports regular DNS zones as well as DNS Firewall clusters.

### Supported metrics

- Queries per second, broken down by dimensions and filters
- DNS latency monitoring

## Getting Help

### Documentation

- [Cloudflare API](https://api.cloudflare.com)
- [Cloudflare Knowledge Base](https://support.cloudflare.com/hc)

## License

Apache 2.0 licensed. See the LICENSE file for details.
