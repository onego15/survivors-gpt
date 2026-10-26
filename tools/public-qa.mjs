// End-to-end validation against the public URL, using only the real user interface.
import {createRequire} from 'node:module';import fs from 'node:fs/promises';import assert from 'node:assert/strict';
const require=createRequire(import.meta.url);let pw;try{pw=require('playwright')}catch{pw=require('C:/Users/onego/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright')}
const browser=await pw.chromium.launch({headless:true,...(process.platform==='win32'?{executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'}:{})});
const page=await browser.newPage({viewport:{width:1440,height:960}});const errors=[],responses=[];
page.on('pageerror',e=>errors.push(String(e)));page.on('response',r=>{responses.push({url:r.url(),status:r.status()});if(r.status()>=400)errors.push(`${r.status()} ${r.url()}`)});
const url=process.env.GAME_URL||'https://onego15.github.io/survivors-gpt/';const response=await page.goto(url);assert.equal(response.status(),200);await page.waitForTimeout(1200);assert.match(await page.title(),/LOOMFALL/);assert.equal(await page.evaluate(()=>window.__loom),undefined,'QA API is disabled in production');
await page.screenshot({path:'docs/public-title.png'});
await page.locator('[data-id="frost"]').click();assert.equal(await page.locator('[data-id="frost"]').getAttribute('aria-pressed'),'true');
await page.locator('#start').click();
let upgrades=0;
async function dismissUpgrades(){for(let n=0;n<5;n++){if(await page.locator('.upgrade-card').count()){await page.locator('.upgrade-card').first().click();upgrades++;await page.waitForTimeout(150)}else break}}
for(let cycle=0;cycle<3;cycle++){
  for(const key of ['KeyD','KeyS','KeyA','KeyW']){await dismissUpgrades();await page.keyboard.down(key);await page.waitForTimeout(850);await page.keyboard.up(key)}
  await dismissUpgrades();await page.keyboard.press('Space');await page.waitForTimeout(500);await dismissUpgrades();
}
const hud=await page.evaluate(()=>({time:document.getElementById('time').textContent,hp:document.getElementById('hp-text').textContent,level:document.getElementById('level').textContent,kills:document.getElementById('kills').textContent,weaves:document.getElementById('weaves').textContent,build:document.querySelectorAll('.build-chip').length,canvas:[document.querySelector('canvas').width,document.querySelector('canvas').height]}));
assert(Number(hud.kills)>0);assert(Number(hud.weaves)>0);assert(upgrades>0);assert(hud.build>0);
await page.screenshot({path:'docs/public-gameplay.png'});await page.keyboard.press('Escape');assert(await page.locator('#resume').isVisible());await page.locator('#resume').click();
await page.goto(url+'?test=1');assert.equal(await page.evaluate(()=>window.__loom),undefined,'Production cannot enable the local QA API');
await page.getByRole('button',{name:/記憶の織機/}).click();assert(await page.getByRole('heading',{name:'記憶の織機'}).isVisible());
assert.deepEqual(errors,[]);
const result={date:new Date().toISOString(),url,status:response.status(),hud,upgrades,checks:['public subpath','title image and modules load','start loadout selection','real keyboard movement','weave','XP and level-up','upgrade card choice','pause and resume','archive','QA API disabled'],errors,responses};
await fs.writeFile('docs/public-qa.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result,null,2));await browser.close();
