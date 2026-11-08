const { execFileSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const sites = [
  { url: 'https://ai-law-bot-nu.vercel.app/', name: 'project_tab_lawbot' },
  { url: 'https://ufi-omega.vercel.app/', name: 'project_tab_ufi' },
  { url: 'https://urban-brew-ten.vercel.app/', name: 'project_tab_brew' },
  { url: 'https://india-connect-hub.vercel.app/', name: 'project_tab_india' },
  { url: 'https://ai-resume-analyzer-dun-one.vercel.app/', name: 'project_tab_resume' }
];

const assetsDir = path.join(__dirname, '..', 'public', 'assets');

// Standard 1440x900 viewport (normal 100% zoom, non-zoomed-out layout) with 2x device scale for crystal-clear 4K retina rendering!
for (const s of sites) {
  const rawShot = path.join(assetsDir, `raw_${s.name}.png`);
  console.log('Capturing Crisp 2x Retina Standard Desktop Layout (Not Zoomed Out):', s.name, s.url);
  try {
    execFileSync(chromePath, [
      '--headless=new',
      `--screenshot=${rawShot}`,
      '--window-size=1440,900',
      '--force-device-scale-factor=2',
      '--virtual-time-budget=4000',
      '--disable-gpu',
      '--hide-scrollbars',
      s.url
    ], { timeout: 35000 });
    console.log('Saved raw:', rawShot, fs.statSync(rawShot).size);
  } catch (err) {
    console.error('Error capturing', s.name, err.message);
  }
}
