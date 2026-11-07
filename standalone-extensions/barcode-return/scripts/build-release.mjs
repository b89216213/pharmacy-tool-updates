import {buildRelease} from '../../../scripts/build-updater-release.mjs';
await buildRelease('barcode-return', {notes: process.argv[2]});
