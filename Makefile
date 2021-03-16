## Build docker image
.PHONY: docker-build-dev
docker-build-dev:
	docker build -f docker/dev/Dockerfile .

.PHONY: docker-build-prod
docker-build-prod:
	docker build -f docker/prod/Dockerfile .