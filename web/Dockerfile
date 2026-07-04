# Сборка витрины+кабинета (Vite) и упаковка в образ Caddy, который раздаёт SPA
# и проксирует API/вебхуки в backend. Контекст сборки — корень репозитория.
#   docker compose build caddy

FROM node:22-alpine AS build
WORKDIR /web
COPY web/package.json web/package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY web/ ./
RUN npm run build

FROM caddy:2-alpine
# Собранный SPA
COPY --from=build /web/dist /srv/app
# Виджет для сайтов клиник (раздаётся как /static/*)
COPY static /srv/static
COPY Caddyfile /etc/caddy/Caddyfile
