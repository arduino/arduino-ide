# arduino-ide 2.0.0 for Raspberry Pi

These are instructions on compiling [arduino-ide 2](https://github.com/arduino/arduino-ide) for arm64 using self-hosted runners. Compiling can be done on raspberry pi os 64-bit or ubuntu arm64. The compiled binaries run on raspberry pi os 64-bit and ubuntu arm64.

Compiling is done using github actions, the same build process as on X86.

Because github does not offer linux arm64 runners, compilation is done using a self-hosted runner on a raspberry pi. 

Because github does not recommend running self-hosted runners on public repositories, the arduino-ide repository is forked first, and public PR are switched off on the fork.

For repeatability and security, compilation is done inside a docker.

## fork arduino-ide

Set up a copy of the arduino-ide github.

- in github, fork [arduino/arduino-ide](https://github.com/arduino/arduino-ide)
- patch your fork with the file _self_hosted_runner.patch_. The patch adds a new build target "self-hosted" to arduino-ide, next to the existing Windows, Ubuntu and MacOS.
- for cosmetics, set a tag to show the release name

```
git clone https://github.com/your_git_account/arduino-ide
cd arduino-ide
patch -p1 < docs/self-hosted-runner/self_hosted_runner.patch 
git add .github/workflows/build.yml
git add arduino-ide-extension/scripts/download-ls.js
git commit -m arm64
git push
git tag -a 2.0.0-rc8-arm64 -m self-hosted
git push --tags
```



## set up docker

For repeatability and security, the self-hosted runner runs in a docker image.

- in github, fork [myoung34/docker-github-actions-runner](https://github.com/myoung34/docker-github-actions-runner). This is a dockerfile for self-hosted runners. 
- patch your fork with the file _docker-github-actions-runner.patch_. The patch adds build dependencies - node, yarn, and libraries - to the docker image.

```
git clone https://github.com/your_git_account/docker-github-actions-runner
cd docker-github-actions-runner
patch -p1 < ../arduino-ide/docs/self-hosted-runner/docker-github-actions-runner.patch
git commit -m arduino-ide
git push
```

## configure self-hosted runner
Configure a new self-hosted runner.
On github.com, go to your fork of the arduino-ide.

- In _Settings -> Moderation options -> Code review limits_, enable  "Limit to users explicitly granted read or higher access"
- In _Settings -> General -> Code and Automation -> Actions -> Runners_, click on _New Self-Hosted Runner_, Linux, ARM64.

## set up raspberry pi

On the raspberry pi runner:

- Install Raspberry Pi OS 64-bit or ubuntu arm64.
- install docker using the [convenience script](https://docs.docker.com/engine/install/debian/#install-using-the-convenience-script).

Copy the shell script to run the local runner to the raspberry pi:

```
wget https://raw.githubusercontent.com/arduino/arduino-ide/main/docs/self-hosted-runner/docker-github-actions-runner.sh
chmod +x docker-github-actions-runner.sh
```

Edit `docker-github-actions-runner.sh`:

- ACCESS_TOKEN is your github personal access token.
- REPO_URL is the url of your fork of the arduino-ide
- RUNNER_URL is the url of your fork of docker-github-actions-runner
- WORK_DIR is a directory where the script may create files

This script will

- clone RUNNER_URL in WORK_DIR 
- create a docker image _self-hosted-runner_, if the image does not exist already
- run the docker image

Run the script to start the self-hosted runner:
```
./docker-github-actions-runner.sh
```
After installing some packages, a self-hosted runner starts up: 

```
--------------------------------------------------------------------------------
|        ____ _ _   _   _       _          _        _   _                      |
|       / ___(_) |_| | | |_   _| |__      / \   ___| |_(_) ___  _ __  ___      |
|      | |  _| | __| |_| | | | | '_ \    / _ \ / __| __| |/ _ \| '_ \/ __|     |
|      | |_| | | |_|  _  | |_| | |_) |  / ___ \ (__| |_| | (_) | | | \__ \     |
|       \____|_|\__|_| |_|\__,_|_.__/  /_/   \_\___|\__|_|\___/|_| |_|___/     |
|                                                                              |
|                       Self-hosted runner registration                        |
|                                                                              |
--------------------------------------------------------------------------------

# Authentication
```

Output should end with `Listening for Jobs`

## start the build

On github.com, go to your fork of the arduino-ide.

- In "Actions", under "Workflows" choose "Arduino IDE", click  "Enable Workflow".
- Click "Run workflow". Use workflow from "Tags: 2.0.0-rc8-arm64" (the tag created above)
- On the runner, output should be ``Running job: build (self-hosted)``. You can follow what happens in the build through the github web interface.

Build time is less than one hour on a raspberry pi 4b, 8gb ram.
```
√ Connected to GitHub

Current runner version: '2.294.0'
2022-06-23 13:07:35Z: Listening for Jobs
2022-06-23 13:09:38Z: Running job: build (self-hosted)
2022-06-23 13:54:14Z: Job build (self-hosted) completed with result: Succeeded
```

## download binaries

- After the run, arm64 binaries for raspberry pi are on github, in "Artifacts."
- On github.com, go to your fork of the arduino-ide. Under "All workflows - Showing runs from all workflows" click on "Arduino IDE". The binaries are under "Artifacts - Produced during runtime
":
``Linux_ARM64_app_image`` and
``Linux_ARM64_zip``. Click to download.
- When the build is completed and the binaries downloaded, stop the runner on the raspberry and delete your arduino-ide fork on github. It is no longer needed.

## note

Once created, the docker image _self-hosted-runner_ is used until it is removed.

If you modify one of the shell variables in `docker-github-actions-runner.sh`, remove the docker image to force a rebuild: 
``
docker rmi self-hosted-runner
``

not truncated.
