# Release Procedure

You will not need to create a new release yourself as the Arduino team takes care of this on a regular basis, but we are documenting the process here. Let's assume the current version is `0.1.3` and you want to release `0.2.0`.

 - Make sure the `main` state represents what you want to release and you're on `main`.
 - Prepare a release-candidate build on a branch:
```bash
git branch 0.2.0-rc \
&& git checkout 0.2.0-rc
```
 - Bump up the version number. It must be a valid [semver](https://semver.org/) and must be greater than the current one:
```bash
yarn update:version 0.2.0
```
 - This should generate multiple outgoing changes with the version update.
 - Commit your changes and push to the remote:
```bash
git add . \
&& git commit -s -m "Updated versions to 0.2.0" \
&& git push
```
 - Create the GH PR the workflow starts automatically.
 - Once you're happy with the RC, merge the changes to the `main`.
 - Create a tag and push it:
```bash
git tag -a 0.2.0 -m "0.2.0" \
&& git push origin 0.2.0
```
 - The release build starts automatically and uploads the artifacts with the changelog to the [release page](https://github.com/arduino/arduino-ide/releases).
 - If you do not want to release the `EXE` and `MSI` installers, wipe them manually.
 - If you do not like the generated changelog, modify it and update the GH release.
