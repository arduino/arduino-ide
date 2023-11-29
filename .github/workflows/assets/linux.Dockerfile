# The Arduino IDE Linux build workflow job runs in this container.
# syntax=docker/dockerfile:1

FROM ubuntu:18.04

# See: https://unofficial-builds.nodejs.org/download/release/
ARG node_version="18.17.1"

RUN \
  apt-get \
    --yes \
    update

# This is required to get add-apt-repository
RUN \
  apt-get \
    --yes \
    install \
      "software-properties-common=0.96.24.32.22"

# Install Git
# The PPA is required to get a modern version of Git. The version in the Ubuntu 18.04 package repository is 2.17.1,
# while action/checkout@v3 requires 2.18 or higher.
RUN \
  add-apt-repository \
    --yes \
    "ppa:git-core/ppa" && \
  apt-get \
    --yes \
    update && \
  \
  apt-get \
    --yes \
    install \
      "git" && \
  \
  apt-get \
    --yes \
    purge \
      "software-properties-common"

# The repository path must be added to safe.directory, otherwise any Git operations on it would fail with a
# "dubious ownership" error. actions/checkout configures this, but it is not applied to containers.
RUN \
  git config \
    --add \
    --global \
    "safe.directory" "/__w/arduino-ide/arduino-ide"
ENV \
  GIT_CONFIG_GLOBAL="/root/.gitconfig"

# Install Python
# The Python installed by actions/setup-python has dependency on a higher version of glibc than available in the
# ubuntu:18.04 container.
RUN \
  apt-get \
    --yes \
    install \
      "python3.8-minimal=3.8.0-3ubuntu1~18.04.2" && \
  \
  ln \
    --symbolic \
    --force \
    "$(which python3.8)" \
    "/usr/bin/python3"

# Install Theia's package dependencies
# These are pre-installed in the GitHub Actions hosted runner machines.
RUN \
  apt-get \
    --yes \
    install \
      "libsecret-1-dev=0.18.6-1" \
      "libx11-dev=2:1.6.4-3ubuntu0.4" \
      "libxkbfile-dev=1:1.0.9-2"

# Install Node.js
# It is necessary to use the "unofficial" linux-x64-glibc-217 build because the official Node.js 18.x is dynamically
# linked against glibc 2.28, while Ubuntu 18.04 has glibc 2.27.
ARG node_installation_path="/tmp/node-installation"
ARG artifact_name="node-v${node_version}-linux-x64-glibc-217"
RUN \
  mkdir "$node_installation_path" && \
  cd "$node_installation_path" && \
  \
  apt-get \
    --yes \
    install \
      "wget=1.19.4-1ubuntu2.2" && \
  \
  archive_name="${artifact_name}.tar.xz" && \
  wget \
    "https://unofficial-builds.nodejs.org/download/release/v${node_version}/${archive_name}" && \
  \
  apt-get \
    --yes \
    purge \
      "wget" && \
  \
  tar \
    --file="$archive_name" \
    --extract && \
  rm "$archive_name"
ENV PATH="${PATH}:${node_installation_path}/${artifact_name}/bin"

# Install Yarn
# Yarn is pre-installed in the GitHub Actions hosted runner machines.
RUN \
  npm \
    install \
    --global \
      "yarn@1.22.19"
