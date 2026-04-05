# ---- Build Stage ----
FROM node:22-alpine AS build

WORKDIR /app

# Copy package files first (cache dependencies)
COPY package.json package-lock.json* ./

RUN npm install

# Copy source and build
COPY . .

# Build args for env variables needed at build time
ARG VITE_GITHUB_CLIENT_ID
ARG VITE_GOOGLE_CLIENT_ID

ENV NODE_OPTIONS="--max-old-space-size=2048"
RUN npm run build

# ---- Runtime Stage ----
FROM nginx:alpine

# Copy built files
COPY --from=build /app/dist /usr/share/nginx/html

# Copy nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
