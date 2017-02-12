.PHONY: build
build: clean
	grunt

.PHONY: get-deps
get-deps:
	npm install yarn
	yarn install
	yarn add grunt-cli

.PHONY: run
run:
	docker run -i -p 3000:3000 -v $(shell pwd)/dist:/var/lib/grafana/plugins/cloudflare grafana/grafana

.PHONY: clean
clean:
	if [ -d dist ] ; then rm -r dist ; fi
