FROM node:22-alpine as build
WORKDIR /app
COPY package*.json ./
RUN yarn install --frozen-lockfile
COPY . .
RUN yarn build

# Use nginx to serve static files
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html