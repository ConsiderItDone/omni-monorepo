FROM node:15.11.0-alpine3.10

# Create app directory
WORKDIR /app

RUN apk add --no-cache \
    python make g++ git ca-certificates

RUN npm install -g typescript ts-node
