import {buildRelease} from '../../../scripts/build-updater-release.mjs';
import {fileURLToPath} from 'node:url';
await buildRelease('pharmacy-toolbox', {out: fileURLToPath(new URL('../release/', import.meta.url)), notes: process.argv[2], zip: false, layout: 'flat'});
