import {buildRelease} from '../../../scripts/build-updater-release.mjs';
import {fileURLToPath} from 'node:url';
await buildRelease('patch-recovery', {out: fileURLToPath(new URL('../release/', import.meta.url)), notes: process.argv[2], zip: false});
