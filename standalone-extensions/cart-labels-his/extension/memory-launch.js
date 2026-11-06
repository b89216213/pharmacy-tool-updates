import {TEST_MODE} from './build-config.js';
if(TEST_MODE){document.title='測試列印記憶';const n=document.createElement('p');n.textContent='院外測試版 · 僅顯示虛構病人的列印記憶';document.body.prepend(n);const s=document.createElement('script');s.src='memview.js';document.body.append(s);}else{await import('./managed-launch.js');}
