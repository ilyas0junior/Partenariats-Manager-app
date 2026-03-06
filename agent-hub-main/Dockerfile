ARG NODE_IMAGE=node:20-alpine
FROM ${NODE_IMAGE}
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci
COPY . .
EXPOSE 8080
# In Docker Compose, proxy target is the backend service hostname
ENV VITE_PROXY_TARGET=http://server:4000
CMD ["npm", "run", "dev"]
