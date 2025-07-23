FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm cache clean --force && \
    npm install --legacy-peer-deps --verbose && \
    npm ls react-app-rewired

COPY . .

EXPOSE 3000

ENV CHOKIDAR_USEPOLLING=true
ENV WATCHPACK_POLLING=true
ENV FAST_REFRESH=true

CMD ["npm", "start"]
