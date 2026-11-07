import {buildRelease} from './build-updater-release.mjs';
if (!['cart-labels-his', 'cloud-medication'].includes(process.argv[2])) throw Error('Unknown managed tool');
await buildRelease(process.argv[2], {notes: process.argv[3]});
