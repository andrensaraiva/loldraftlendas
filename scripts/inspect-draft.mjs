import {chromium} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';
await mkdir('docs/screenshots',{recursive:true});
const browser=await chromium.launch({channel:'msedge'});
const metrics=[];
try {
 for(const [label,width,height] of [['desktop',1366,768],['mobile',390,844]]) {
  const page=await browser.newPage({viewport:{width,height}});
  await page.goto('http://127.0.0.1:5173');
  await page.getByRole('button',{name:'Começar draft'}).click();
  await page.locator('.player-card').first().waitFor();
  await page.waitForTimeout(600);
  await page.screenshot({path:`docs/screenshots/draft-before-${label}.png`,fullPage:true});
  metrics.push({label,...await page.evaluate(()=>({cardTop:document.querySelector('.player-card').getBoundingClientRect().top,cardHeight:document.querySelector('.player-card').getBoundingClientRect().height,pageHeight:document.documentElement.scrollHeight,overflow:document.documentElement.scrollWidth>innerWidth}))});
  await page.close();
 }
 const page=await browser.newPage({viewport:{width:1366,height:768}});
 await page.goto('https://7a0.com.br/en',{waitUntil:'domcontentloaded'});
 console.log('Reference home:',(await page.locator('body').innerText()).slice(0,1800));
 const play=page.getByRole('link',{name:/Play now/}).first();
 if(await play.count()){await play.click();await page.waitForTimeout(1000);console.log('Reference game:',(await page.locator('body').innerText()).slice(0,2200));}
} finally {await browser.close();}
await writeFile('docs/screenshots/before-metrics.json',JSON.stringify(metrics,null,2));
console.log(JSON.stringify(metrics));
