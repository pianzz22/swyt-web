FROM node:18.13.0 AS dev

WORKDIR /app

FROM dev AS build

COPY . .
RUN  npm i
ENV H5_PUBLIC_PATH /s/swyt-web



RUN npm run build:h5

FROM nginx:stable-alpine AS release

COPY --from=build /app/dist/ /usr/share/nginx/html/
COPY ./nginx/nginx.conf /etc/nginx/nginx.conf
