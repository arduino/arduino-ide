const fs = require('fs');
const path = require('path');
const expect = require('chai').expect;
const track = require('temp').track();
const unpack = require('../utils').unpack;
const testMe = require('../utils');
const sinon = require('sinon');

describe('utils', () => {

    describe('adjustArchiveStructure', () => {

        let consoleStub;

        beforeEach(() => {
            consoleStub = sinon.stub(console, 'log').value(() => { });
        });

        afterEach(() => {
            consoleStub.reset();
            track.cleanupSync();
        });

        it('should reject when not a zip file', async () => {
            try {
                const invalid = path.join(__dirname, 'resources', 'not-a-zip.dmg');
                await testMe.adjustArchiveStructure(invalid, track.mkdirSync());
                throw new Error('Expected a rejection');
            } catch (e) {
                expect(e).to.be.an.instanceOf(Error);
                expect(e.message).to.be.equal('Expected a ZIP file.');
            }
        });

        it('should reject when target directory does not exist', async () => {
            try {
                const zip = path.join(__dirname, 'resources', 'zip-with-base-folder.zip');
                await testMe.adjustArchiveStructure(zip, path.join(__dirname, 'some', 'missing', 'path'));
                throw new Error('Expected a rejection');
            } catch (e) {
                expect(e).to.be.an.instanceOf(Error);
                expect(e.message.endsWith('does not exist.')).to.be.true;
            }
        });

        it('should reject when target is a file', async () => {
            try {
                const zip = path.join(__dirname, 'resources', 'zip-with-base-folder.zip');
                await testMe.adjustArchiveStructure(zip, path.join(__filename));
                throw new Error('Expected a rejection');
            } catch (e) {
                expect(e).to.be.an.instanceOf(Error);
                expect(e.message.endsWith('is not a directory.')).to.be.true;
            }
        });

        it('should be a NOOP when the zip already has the desired base folder', async () => {
            const zip = path.join(__dirname, 'resources', 'zip-with-base-folder.zip');
            const actual = await testMe.adjustArchiveStructure(zip, track.mkdirSync());
            expect(actual).to.be.equal(zip);
        });

        it('should handle whitespace in file path gracefully', async () => {
            const zip = path.join(__dirname, 'resources', 'zip with whitespace.zip');
            const out = track.mkdirSync();
            const actual = await testMe.adjustArchiveStructure(zip, out, true);
            expect(actual).to.be.equal(path.join(out, 'zip with whitespace.zip'));
            console.log(actual);
            expect(fs.existsSync(actual)).to.be.true;

            const verifyOut = track.mkdirSync();
            await unpack(actual, verifyOut);

            const root = path.join(verifyOut, 'zip with whitespace');
            expect(fs.existsSync(root)).to.be.true;
            expect(fs.lstatSync(root).isDirectory()).to.be.true;
            const subs = fs.readdirSync(root);
            expect(subs).to.have.lengthOf(3);
            expect(subs.sort()).to.be.deep.equal(['a.txt', 'b.txt', 'foo']);
        });

        it('should keep the symlinks after ZIP adjustments', async function () {
            if (process.platform === 'win32') {
                this.skip();
            }
            const zip = path.join(__dirname, 'resources', 'zip-with-symlink.zip');
            const out = track.mkdirSync();
            const actual = await testMe.adjustArchiveStructure(zip, out, true);
            expect(actual).to.be.equal(path.join(out, 'zip-with-symlink.zip'));
            console.log(actual);
            expect(fs.existsSync(actual)).to.be.true;

            const verifyOut = track.mkdirSync();
            await unpack(actual, verifyOut);
            expect(fs.lstatSync(path.join(verifyOut, 'zip-with-symlink', 'folder', 'symlinked-sub')).isSymbolicLink()).to.be.true;
        });

        it('should adjust the archive structure if base folder is not present', async () => {
            const zip = path.join(__dirname, 'resources', 'zip-without-symlink.zip');
            const out = track.mkdirSync();
            const actual = await testMe.adjustArchiveStructure(zip, out, true);
            expect(actual).to.be.equal(path.join(out, 'zip-without-symlink.zip'));
            console.log(actual);
            expect(fs.existsSync(actual)).to.be.true;

            const verifyOut = track.mkdirSync();
            await unpack(actual, verifyOut);

            const root = path.join(verifyOut, 'zip-without-symlink');
            expect(fs.existsSync(root)).to.be.true;
            expect(fs.lstatSync(root).isDirectory()).to.be.true;
            const subs = fs.readdirSync(root);
            expect(subs).to.have.lengthOf(3);
            expect(subs.sort()).to.be.deep.equal(['a.txt', 'b.txt', 'foo']);
        });

    });

});
