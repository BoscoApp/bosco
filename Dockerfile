# syntax=docker/dockerfile:1
#
# Bosco ships as a single static site served by nginx — the guaranteed full-offline / self-hosted
# story (brief §5). The payload is plain HTML/JS/CSS, so the image content is architecture-agnostic
# and multi-arch (amd64 + arm64) is nearly free — only the nginx base differs per arch.
#
# Build stage uses node:24-slim (glibc) rather than alpine (musl) so the native prebuilt binaries
# for pagefind and sharp resolve without musl-specific packages.

# --- Build stage: produce the static site into /app/build ---
FROM node:24-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

# --- Serve stage: nginx serving the static output, zero config, zero internet ---
FROM nginx:alpine AS serve
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/build /usr/share/nginx/html
EXPOSE 80
# nginx:alpine's default entrypoint runs nginx in the foreground.
