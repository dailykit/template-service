FROM node:13-alpine
WORKDIR /usr/src/app
COPY package.json ./
RUN yarn

RUN apk add --nocache udev ttf-freefont chromium git
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD true
ENV CHROMIUM_PATH /usr/bin/chromium-browser

COPY . .
CMD ["yarn", "dev"]
