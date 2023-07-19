// @ts-check

const transifex = require('./transifex');
const fetch = require('node-fetch');
const fs = require('fs');
const shell = require('shelljs');
const util = require('util');

const uploadSourceFile = async (organization, project, resource, filePath) => {
    const url = transifex.url('resource_strings_async_uploads');
    const data = {
        data: {
            attributes: {
                callback_url: null,
                content: fs.readFileSync(filePath).toString('base64'),
                content_encoding: 'base64'
            },
            relationships: {
                resource: {
                    data: {
                        id: util.format('o:%s:p:%s:r:%s', organization, project, resource),
                        type: 'resources'
                    }
                }
            },
            type: 'resource_strings_async_uploads'
        }
    };

    const headers = transifex.authHeader();
    headers['Content-Type'] = 'application/vnd.api+json';
    const json = await fetch(url, { method: 'POST', headers, body: JSON.stringify(data) })
        .catch(err => {
            shell.echo(err);
            shell.exit(1);
        })
        .then(res => res.json());

    return json['data']['id'];
};

const getSourceUploadStatus = async (uploadId) => {
    const url = transifex.url(util.format('resource_strings_async_uploads/%s', uploadId));
    // The download request status must be asked from time to time, if it's
    // still pending we try again using exponentional backoff starting from 2.5 seconds.
    let backoffMs = 2500;
    const headers = transifex.authHeader();
    while (true) {
        const json = await fetch(url, { headers })
            .catch(err => {
                shell.echo(err);
                shell.exit(1);
            })
            .then(res => res.json());

        const status = json['data']['attributes']['status'];
        if (status === 'succeeded') {
            return
        } else if (status === 'pending' || status === 'processing') {
            await new Promise(r => setTimeout(r, backoffMs));
            backoffMs = backoffMs * 2;
            // Retry the upload request status again
            continue
        } else if (status === 'failed') {
            const errors = [];
            json['data']['attributes']['errors'].forEach(err => {
                errors.push(util.format('%s: %s', err.code, err.details));
            });
            throw util.format('Download request failed: %s', errors.join(', '));
        }
        throw 'Download request failed in an unforeseen way';
    }
}

(async () => {
    const { organization, project, resource } = await transifex.credentials();
    const sourceFile = process.argv[2];
    if (!sourceFile) {
        shell.echo('Translation source file not specified');
        shell.exit(1);
    }

    const uploadId = await uploadSourceFile(organization, project, resource, sourceFile)
        .catch(err => {
            shell.echo(err);
            shell.exit(1);
        });

    await getSourceUploadStatus(uploadId)
        .catch(err => {
            shell.echo(err);
            shell.exit(1);
        });

    shell.echo("Translation source file uploaded");
})()