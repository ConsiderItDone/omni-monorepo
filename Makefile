## Build docker image
.PHONY: docker-build
docker-build:
	docker build -t nodle/app -f Dockerfile .