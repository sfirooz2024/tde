FROM node:16

ENV TZ='America/New_York'
# Install dependencies
RUN apt-get update && apt-get install -y git \
    nginx \
    yum

WORKDIR /app
COPY package*.json ./
RUN npm install 
COPY ./ ./

ARG ENV

EXPOSE 80
ENV NODE_ENV=$ENV

COPY nginx.conf /etc/nginx/conf.d/nginx.conf
ADD entrypoint.sh /opt/entrypoint.sh
RUN chmod +x /opt/entrypoint.sh
ENTRYPOINT ["/opt/entrypoint.sh"]
