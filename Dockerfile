FROM node:15.11.0-alpine3.10

# Create app directory
WORKDIR /app

RUN apk add --no-cache \
    make g++ git ca-certificates

RUN npm config set unsafe-perm true && npm install -g typescript ts-node

COPY package*.json ./

RUN npm ci

COPY . .

RUN npm run build:all

EXPOSE 3000

ENV NODE_ENV production

