FROM node:4.5
RUN mkdir /app
COPY ./dist/ /app
WORKDIR /app
RUN npm i --production
CMD node index.js
EXPOSE 3000
