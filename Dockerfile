FROM node:14.4.0

RUN apt-get update \ 
    && apt-get install -y wget gnupg \ 
    && wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add - \ 
    && sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list' \ 
    && apt-get update \ 
    && apt-get install -y libxss1 google-chrome-unstable fonts-ipafont-gothic fonts-wqy-zenhei fonts-thai-tlwg fonts-kacst fonts-freefont-ttf \ 
    && rm -rf /var/lib/apt/lists/*


ADD https://github.com/Yelp/dumb-init/releases/download/v1.2.0/dumb-init_1.2.0_amd64 /usr/local/bin/dumb-init
RUN chmod +x /usr/local/bin/dumb-init

WORKDIR /usr/src/app
COPY package*.json ./

CMD ["google-chrome-unstable"]

RUN yarn
RUN yarn add puppeteer
COPY . .

EXPOSE 4000
ENTRYPOINT ["dumb-init", "--"]
CMD [ "yarn", "dev" ]