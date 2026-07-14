FROM node:20-alpine AS build-env
COPY ./backend /app
WORKDIR /app
RUN npm ci
RUN npm run build

FROM node:20-alpine
COPY --from=build-env /app/dist /app/dist
COPY ./backend/package.json ./backend/package-lock.json /app/
WORKDIR /app
RUN npm ci --omit=dev
EXPOSE 3000
CMD ["npm", "run", "start"]
