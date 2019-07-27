FROM node:10

ENV HOME=/usr/src/app
RUN mkdir -p $HOME

COPY package.json $HOME
COPY package-lock.json $HOME
COPY gulpfile.js $HOME

WORKDIR $HOME

CMD ["npm run dev"]
