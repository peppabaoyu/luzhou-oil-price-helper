import {normalize} from './engine.js';
import {stationRule} from './settings.js';
export function missingRules(stations,rules){const found=new Set(stations.map(s=>stationRule(s,rules)));return rules.map((r,i)=>({...r,index:i})).filter(r=>!found.has(r.index));}
function distance(a,b){let row=Array.from({length:b.length+1},(_,i)=>i);for(let i=0;i<a.length;i++){const next=[i+1];for(let j=0;j<b.length;j++)next.push(Math.min(next[j]+1,row[j+1]+1,row[j]+(a[i]===b[j]?0:1)));row=next;}return row[b.length];}
export async function recoverStations(stations,rules,readSingle,progress=()=>{}){
 let missing=missingRules(stations,rules);if(!missing.length)return;
 const score=s=>Math.min(...missing.map(r=>distance(normalize(s.text),normalize(r.name))));
 const candidates=stations.filter(s=>stationRule(s,rules)<0).map(s=>({s,score:score(s)})).sort((a,b)=>a.score-b.score);
 // Similarity only prioritizes recognition. It never authorizes a price change.
 for(let mode=0;mode<2&&missing.length;mode++)for(let i=0;i<candidates.length&&missing.length;i++){
  const {s}=candidates[i];if(stationRule(s,rules)>=0)continue;
  progress(58+mode*8+i/Math.max(1,candidates.length)*8,'正在放大复核未识别的站名…');
  const text=await readSingle(s,mode);s.ocrAlternatives??=[];s.ocrAlternatives.push(text);
  missing=missingRules(stations,rules);
 }
}
