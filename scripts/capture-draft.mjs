import {chromium} from '@playwright/test';
import {writeFile} from 'node:fs/promises';
const b=await chromium.launch({channel:'msedge'});const metrics=[];
for(const [label,width,height] of [['desktop',1366,768],['mobile',390,844]]){
 const p=await b.newPage({viewport:{width,height}});await p.addInitScript(()=>{Math.random=()=>0;});await p.goto('http://127.0.0.1:5173');await p.getByRole('button',{name:'Começar draft'}).click();await p.waitForTimeout(700);
 await p.screenshot({path:`docs/screenshots/draft-after-${label}.png`,fullPage:true});
 metrics.push({label,...await p.evaluate(()=>({cardTop:document.querySelector('.player-card').getBoundingClientRect().top,cardHeight:document.querySelector('.player-card').getBoundingClientRect().height,pageHeight:document.documentElement.scrollHeight,overflow:document.documentElement.scrollWidth>innerWidth,cardCount:document.querySelectorAll('.player-card').length}))});await p.close();
}
await b.close();await writeFile('docs/screenshots/after-metrics.json',JSON.stringify(metrics,null,2));console.log(metrics);
