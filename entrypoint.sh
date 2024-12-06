#!/bin/bash
rm -rf /etc/nginx/sites-enabled/default
/usr/sbin/service nginx start
npm run start
