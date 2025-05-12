FROM node:18 as build

# set working directory
WORKDIR /usr/src/app

# install app dependencies
COPY package.json package-lock.json ./

RUN npm ci

COPY . ./

ARG REACT_APP_API_URL
ENV REACT_APP_API_URL=$REACT_APP_API_URL

RUN npm run build

FROM nginx:1.23-alpine
COPY --from=build /usr/src/app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
