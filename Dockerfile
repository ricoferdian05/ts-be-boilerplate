FROM node:16-slim
WORKDIR /usr/src/app
COPY package*.json ./
COPY tsconfig*.json ./
RUN npm install
COPY . ./
RUN npm run build

## Stage two
FROM node:16-slim
ARG app_env=development
ARG project_id
WORKDIR /usr/src/app
COPY package*.json ./
ENV NODE_ENV=production
ENV APP_ENV=$app_env
ENV PROJECT_ID=$project_id
RUN npm install --only=production
COPY --from=0 /usr/src/app/build ./build

CMD [ "npm", "start" ]
