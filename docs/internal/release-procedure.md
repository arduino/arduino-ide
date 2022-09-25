# Release Procedure

## Steps

The following are the steps to follow to make a release of Arduino IDE:

### 1. 🗺️ Merge localization sync PR

A pull request titled "**Update translation files**" is submitted periodically by the "**github-actions**" bot to pull in the localization data from [**Transifex**](https://www.transifex.com/arduino-1/ide2/dashboard/).

If there is an open PR, this must be merged before making the release.

It will be shown in these search results:

https://github.com/arduino/arduino-ide/pulls/app%2Fgithub-actions

### 2. 👀 Check version of packages

The [`version` field](https://docs.npmjs.com/cli/v8/configuring-npm/package-json#version) of the project's `package.json` metadata files received a patch version bump (e.g., `2.0.1` -> `2.0.2`) at the time of the previous release.

If this is a patch release, the current metadata values are correct and no action is needed.

The changes contained in this release might be considered to change the project's "API". If so, a patch version bump will not be appropriate and the version must be adjusted in compliance with the [**Semantic Versioning Specification**](https://semver.org/).

Follow the instructions for updating the version metadata [**here**](#update-version-metadata).

#### Examples

If the version number of the previous release was `2.0.1`:

- If this is considered a minor release (non-breaking changes to the "API"), the `version` values must be changed to `2.1.0`.
- If this is considered a major release (breaking changes to the "API"), the `version` values must be changed to `3.0.0`.

### 3. 🚢 Create the release on GitHub

Then, you need to **create and push the new tag** and wait for the release to appear on [the "**Releases**" page](https://github.com/arduino/arduino-ide/releases).

⚠ Doing this will create a new release and users who already have the IDE installed will be notified from the automatic updater that a new version is available. Do not push the tag if you don't want that.

```text
git checkout main
git pull
git tag -a <YOUR_VERSION> -m "<YOUR_VERSION>"
git push origin <YOUR_VERSION>
```

Pushing a tag will trigger a **GitHub Actions** workflow on the `main` branch. Check the "**Arduino IDE**" workflow and see that everything goes right. If the workflow succeeds, a new release will be created automatically and you should see it on the ["**Releases**"](https://github.com/arduino/arduino-ide/releases) page.

### 4. ⬆️ Bump version metadata of packages

In order for the version number of the tester and nightly builds to have correct precedence compared to the release version, the `version` field of the project's `package.json` files must be given a patch version bump (e.g., `2.0.1` -> `2.0.2`) **after** the creation of the release tag.

Follow the instructions for updating the version metadata [**here**](#update-version-metadata).

### 5. 📄 Create the changelog

**Create GitHub issues for the known issues** that we haven't solved in the current release:

https://github.com/arduino/arduino-ide/issues

From the ["**Releases**"](https://github.com/arduino/arduino-ide/releases) page, edit the release notes following the **Keep A Changelog** scheme:

https://keepachangelog.com/en/1.0.0/#how

Add a list of mentions of GitHub users who contributed to the release in any of the following ways (ask @per1234):

- Submitted a PR that was merged
- Made a valuable review of a PR
- Submitted an issue that was resolved
- Provided valuable assistance with the investigation of an issue that was resolved

Add a "**Known Issues**" section at the bottom of the changelog.

### 6. ✎ Update the "**Software**" Page

Open a PR on the [bcmi-labs/wiki-content](https://github.com/bcmi-labs/wiki-content) repository to update the links and texts.

ℹ️ If you don't have access to the repo, ask in the `#team_wedo` **Slack** channel.

**❗ Make sure all the links to the new IDE build are working.**<br />
If they aren't, there has probably been some issue with [the "**Arduino IDE**" workflow run](https://github.com/arduino/arduino-ide/actions/workflows/build.yml) triggered when pushing the tag during the "**Create the release on GitHub**" step of the release procedure.

Ask for a review of the PR and merge it.

Follow the ["**Production (subset of https://arduino.cc)**" instructions](https://github.com/bcmi-labs/wiki-content#production-subset-of-httpsarduinocc) in the `bcmi-labs/wiki-content` repository readme to deploy the updated "**Software**" page content.

When the deploy workflow is done, check if links on the "**Software**" page are working:

https://www.arduino.cc/en/software#future-version-of-the-arduino-ide

### 7. 😎 Brag about it

- Ask in the `#product_releases` **Slack** channel to write a post for the social media and, if needed, a blog post.
- Post a message on the forum (ask @per1234).<br />
  Example: https://forum.arduino.cc/t/arduino-ide-2-0-0-rc9-3-available-for-download/1028858/4
- Write a message in the `#general` **Slack** channel:
  > Hey **Arduino**s! Updates from the **Tooling Team** :hammer_and_wrench:
  >
  > Arduino IDE 2.0.0 Beta 12 is out! :doge: You can download it from the [Download Page](https://www.arduino.cc/en/software#experimental-software)
  > The highlights of this release are:
  >
  > - auto-installation of arduino:avr at first startup
  > - improvement of Serial Monitor performances
  > - Arduino CLI upgrade to 0.19.1
  > - Theia upgrade to 1.18.0
  > - some bugfixing
  >
  > To see the details, you can take a look at the [Changelog](https://github.com/arduino/arduino-ide/releases/tag/2.0.0-beta.12)
  > If you want to post about it on social media and you need more details feel free to ask us on #team_tooling! :wink:

## Operations

The following are detailed descriptions of operations performed during the release process:

<a id="update-version-metadata"></a>

### ⚙ Update version metadata of packages

You need to **set the new version in all the `package.json` files** across the app (`./package.json`, `./arduino-ide-extension/package.json`, and `./electron-app/package.json`), create a PR, and merge it on the `main` branch.

To do so, you can make use of the `update:version` script.

For example, if you want to update the version to `<YOUR_VERSION>`, you should run the following commands:

```text
git checkout main
git pull
git checkout -b version-<YOUR_VERSION>
yarn update:version <YOUR_VERSION>
git commit -am <YOUR_VERSION>
git push origin version-<YOUR_VERSION>
```

replacing `<YOUR_VERSION>` with the version you want. Then create a PR and merge it.
