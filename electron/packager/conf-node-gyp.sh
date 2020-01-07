#!/bin/sh

npm install --global node-gyp@6.0.1

if [ "$OSTYPE" = "cygwin" ] || [ "$OSTYPE" = "msys" ]; then
    npm config set node_gyp "`npm prefix -g`\node_modules\node-gyp\bin\node-gyp.js"
else
    npm config set node_gyp "`npm prefix -g`/lib/node_modules/node-gyp/bin/node-gyp.js"
fi

echo "npm config get node_gyp -> `npm config get node_gyp`"
