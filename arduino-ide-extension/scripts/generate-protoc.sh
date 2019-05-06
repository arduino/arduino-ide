#!/bin/bash

SCRIPT=`realpath -s $0`
SCRIPTPATH=`dirname $SCRIPT`
WORKDIR=/tmp/arduino-cli-protoc
echo "Working in $WORKDIR"

# this could be a Git submodule, but that feels to clunky for just building the protobuf stuff
mkdir -p $WORKDIR
pushd $WORKDIR
if [ ! -d arduino-cli ]; then
    git clone https://github.com/cmaglie/arduino-cli
    cd arduino-cli
    git checkout daemon
    cd -

    mkdir -p go/src/github.com/arduino
    ln -s $PWD/arduino-cli go/src/github.com/arduino
    export GOPATH=$PWD/go
    cd go/src/github.com/arduino/arduino-cli
    GOOS=linux go build -o arduino-cli.linux
    # GOOS=darwin go build -o arduino-cli.darwin
fi
popd

# make sure the output path exists
mkdir -p src/node/cli-protocol

export PATH=$PATH:$PWD/node_modules/.bin
# generate js codes via grpc-tools
grpc_tools_node_protoc \
--js_out=import_style=commonjs,binary:./src/node/cli-protocol \
--grpc_out=./src/node/cli-protocol \
--plugin=protoc-gen-grpc=`which grpc_tools_node_protoc_plugin` \
-I /usr/lib/protoc/include \
-I $WORKDIR/arduino-cli/rpc \
$WORKDIR/arduino-cli/rpc/*.proto

# generate d.ts codes
protoc \
--plugin=protoc-gen-ts=./node_modules/.bin/protoc-gen-ts \
--ts_out=./src/node/cli-protocol \
-I /usr/lib/protoc/include \
-I $WORKDIR/arduino-cli/rpc \
$WORKDIR/arduino-cli/rpc/*.proto
