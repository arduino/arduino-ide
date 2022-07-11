#!/bin/bash -x

# before use, modify:
# ACCESS_TOKEN is your github access token
# REPO_URL is the url of your fork of https://github.com/arduino/arduino-ide
# RUNNER_URL is the url of your fork of https://github.com/myoung34/docker-github-actions-runner
# WORK_DIR

WORK_DIR=~/src
ACCESS_TOKEN=ghp_YOUR_GITHUB_PERSONAL_ACCESS_TOKEN
REPO_URL=https://github.com/YOUR_GITHUB_ACCOUNT/arduino-ide
RUNNER_URL=https://github.com/arduino/docker-github-actions-runner

# check docker and git available

if ! command -v docker
then
  echo install docker
fi

if ! command -v git
then
  echo install git
fi

# check if docker image exists

if [ ! $(docker image inspect self-hosted-runner '--format=""') ]
then
  # build docker image

  if [ ! -d ${WORK_DIR} ]
  then
    mkdir -p ${WORK_DIR}
  fi

  DOCKER_DIR=${WORK_DIR}/docker-github-actions-runner

  if [ -d ${DOCKER_DIR} ]
  then
    echo ${DOCKER_DIR} already exists
    exit 0
  fi

  git clone ${RUNNER_URL} ${DOCKER_DIR}

  if [ ! -f ${DOCKER_DIR}/Dockerfile ]
  then
    echo no Dockerfile
    exit 0
  fi

  docker build ${DOCKER_DIR} --tag self-hosted-runner

  if [ ! $(docker image inspect self-hosted-runner '--format=""') ]
  then
    echo no docker image
    exit 0
  fi

fi

docker run --env "ACCESS_TOKEN=${ACCESS_TOKEN}" --env RUNNER_SCOPE=repo --env "REPO_URL=${REPO_URL}" --env RUNNER_NAME=arduino-ide-runner self-hosted-runner

#not truncated
