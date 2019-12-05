FROM gitpod/workspace-full-vnc

USER root
RUN apt-get update -q --fix-missing && \
    apt-get install -y -q software-properties-common && \
    apt-get install -y -q --no-install-recommends \
    build-essential \
    libssl-dev \
    golang-go \
    libxkbfile-dev \
    libnss3-dev

RUN set -ex && \
    tmpdir=$(mktemp -d) && \
    curl -L -o $tmpdir/protoc.zip https://github.com/protocolbuffers/protobuf/releases/download/v3.6.1/protoc-3.6.1-linux-x86_64.zip && \
    mkdir -p /usr/lib/protoc && cd /usr/lib/protoc && unzip $tmpdir/protoc.zip && \
    chmod -R 755 /usr/lib/protoc/include/google && \
    ln -s /usr/lib/protoc/bin/* /usr/bin && \
    rm $tmpdir/protoc.zip
