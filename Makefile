.DEFAULT_GOAL: run

# Run Grafana with the Cloudflare plugin mounted.
run:
	docker run -i -p 3000:3000 -v $(shell pwd)/dist:/var/lib/grafana/plugins/cloudflare grafana/grafana

.PHONY: build
# (Re-)build the Cloudflare plugin.
build: clean
	grunt

.PHONY: get-deps
# Install the Node dependencies.
get-deps:
	npm install yarn
	yarn install
	yarn add grunt-cli

.PHONY: clean
# Remove the built plugin.
build: clean
	if [ -d dist ] ; then rm -r dist ; fi
