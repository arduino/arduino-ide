// @ts-check

const transifex = require('./transifex');
const util = require('util');
const shell = require('shelljs');
const fetch = require('node-fetch');
const download = require('download');

const getLanguages = async (organization, project) => {
    const url = transifex.url(
        util.format('projects/o:%s:p:%s/languages', organization, project)
    );
    const json = await fetch(url, { headers: transifex.authHeader() })
        .catch(err => {
            shell.echo(err);
            shell.exit(1);
        })
        .then(res => res.json());
    let languages = [];
    json['data'].forEach(e => {
        const languageCode = e['attributes']['code'];
        // Skip english since it's the one we generate
        if (languageCode === 'en') {
            return;
        }
        languages.push(languageCode);
    });
    return languages;
};

const requestTranslationDownload = async (relationships) => {
    let url = transifex.url('resource_translations_async_downloads');
    const data = {
        data: {
            relationships,
            type: 'resource_translations_async_downloads'
        }
    };
    const headers = transifex.authHeader();
    headers['Content-Type'] = 'application/vnd.api+json';
    const json = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(data)
    })
        .catch(err => {
            shell.echo(err);
            shell.exit(1);
        })
        .then(res => res.json());

    return json['data']['id'];
};

const getTranslationDownloadStatus = async (language, downloadRequestId) => {
    // The download request status must be asked from time to time, if it's
    // still pending we try again using exponential backoff starting from 2.5 seconds.
    let backoffMs = 2500;
    while (true) {
        const url = transifex.url(
            util.format('resource_translations_async_downloads/%s', downloadRequestId)
        );
        const options = {
            headers: transifex.authHeader(),
            redirect: 'manual'
        };
        const res = await fetch(url, options).catch(err => {
            shell.echo(err);
            shell.exit(1);
        });

        if (res.status === 303) {
            // When the file to download is ready we get redirected
            return {
                language,
                downloadUrl: res.headers.get('location')
            };
        }

        const json = await res.json();
        const downloadStatus = json['data']['attributes']['status'];
        if (downloadStatus == 'pending' || downloadStatus == 'processing') {
            await new Promise(r => setTimeout(r, backoffMs));
            backoffMs = backoffMs * 2;
            // Retry the download request status again
            continue;
        } else if (downloadStatus == 'failed') {
            const errors = [];
            json['data']['attributes']['errors'].forEach(err => {
                errors.push(util.format('%s: %s', err.code, err.details));
            });
            throw util.format('Download request failed: %s', errors.join(', '));
        }
        throw 'Download request failed in an unforeseen way';
    }
};

(async () => {
    const { organization, project, resource } = await transifex.credentials();
    const translationsDirectory = process.argv[2];
    if (!translationsDirectory) {
        shell.echo('Translations directory not specified');
        shell.exit(1);
    }

    const languages = await getLanguages(organization, project);
    shell.echo('translations found:', languages.join(', '));

    let downloadIds = [];
    for (const language of languages) {
        downloadIds.push({
            language,
            id: await requestTranslationDownload({
                language: {
                    data: {
                        id: util.format('l:%s', language),
                        type: 'languages'
                    }
                },
                resource: {
                    data: {
                        id: util.format('o:%s:p:%s:r:%s', organization, project, resource),
                        type: 'resources'
                    }
                }
            })
        });
    }

    const res = await Promise.all(
        downloadIds.map(d => getTranslationDownloadStatus(d['language'], d['id']))
    ).catch(err => {
        shell.echo(err);
        shell.exit(1);
    });

    await Promise.all(
        res.map(r => {
            return download(r['downloadUrl'], translationsDirectory, {
                filename: r['language'] + '.json'
            });
        })
    ).catch(err => {
        shell.echo(err);
        shell.exit(1);
    });

    shell.echo('Translation files downloaded.');
})();
