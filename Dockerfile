FROM node:17-alpine

WORKDIR /work

COPY package* ./

RUN npm install

COPY ./src/ ./src/
COPY jest* ./
COPY tsconfig.json ./

RUN cd src && \
	npm run test:ci && \
	npm run build:ci

CMD sh