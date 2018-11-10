
#PORT=7600 npm start
./node_modules/.bin/pm2 start ./bin/www --watch --ignore-watch "node_modules"
./node_modules/.bin/pm2 logs www

