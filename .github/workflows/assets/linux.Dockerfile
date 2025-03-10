# The Arduino IDE Linux build workflow job runs in this container.
# syntax=docker/dockerfile:1

# See: https://hub.docker.com/_/ubuntu/tags
FROM ubuntu:18.10

# This is required in order to use the Ubuntu package repositories for EOL Ubuntu versions:
# https://help.ubuntu.com/community/EOLUpgrades#Update_sources.list
RUN \
  sed \
    --in-place \
    --regexp-extended \
    --expression='s/([a-z]{2}\.)?archive.ubuntu.com|security.ubuntu.com/old-releases.ubuntu.com/g' \
    "/etc/apt/sources.list"

RUN \
  apt-get \
    --yes \
    update

RUN \
  apt-get \
    --yes \
    install \
      "git"

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
# container.
RUN \
  apt-get \
    --yes \
    install \
      "python3.7-minimal=3.7.3-2~18.10"

# Install Theia's package dependencies
# These are pre-installed in the GitHub Actions hosted runner machines.
RUN \
  apt-get \
    --yes \
    install \
      "libsecret-1-dev=0.18.6-3" \
      "libx11-dev=2:1.6.7-1" \
      "libxkbfile-dev=1:1.0.9-2"

# Target python3 symlink to Python 3.7 installation. It would otherwise target version 3.6 due to the installation of
# the `python3` package as a transitive dependency.
RUN \
  ln \
    --symbolic \
    --force \
    "$(which python3.7)" \
    "/usr/bin/python3"
