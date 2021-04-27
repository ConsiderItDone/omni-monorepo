## Build docker image
.PHONY: docker-build-dev
docker-build-dev:
	docker build -f docker/dev/app/Dockerfile .

.PHONY: docker-build-prod
docker-build-prod:
	docker build -t nodle:prod -f docker/prod/Dockerfile .