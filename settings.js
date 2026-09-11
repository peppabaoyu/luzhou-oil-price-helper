import {TARGETS,normalize,targetIndex} from './engine.js';
export const defaultRules=()=>TARGETS.map(name=>({name,delta:5,highlight:true,scope:'band'}));
const stationName=s=>normalize(s.normalize('NFKC')).replace(/[“”‘’"'·、;；|]/g,'');
export function matchRule(text,rules){
 const n=stationName(text),known=targetIndex(text);
 const ids=rules.flatMap((r,i)=>stationName(r.name)===n||(TARGETS.indexOf(r.name)>=0&&TARGETS.indexOf(r.name)===known)?[i]:[]);
 if(ids.length>1)throw Error('同一个站匹配到多条设置，请删除重复站名。');
 return ids[0]??-1;
}
export function stationRule(s,rules){
 if(s.confirmedName)return rules.findIndex(r=>stationName(r.name)===stationName(s.confirmedName));
 const ids=new Set([s.text,...(s.ocrAlternatives||[])].map(text=>matchRule(text,rules)).filter(i=>i>=0));
 if(ids.size>1)throw Error('同一个站出现不同的识别结果，请使用清晰原图或检查重复设置。');
 return [...ids][0]??-1;
}
export function applyRules(bands,rules){
 const names=new Set();for(const r of rules){const n=normalize(r.name);if(!n||names.has(n))throw Error('站名不能为空或重复。');names.add(n);if(!Number.isInteger(r.delta)||r.delta%5||!['band','station'].includes(r.scope))throw Error('调价设置无效。');}
 const counts=rules.map(()=>0),updates=[],pieces=[];
 for(const b of bands){
  const matched=b.stations.map(s=>({...s,rule:stationRule(s,rules)}));
  for(const s of matched)if(s.rule>=0)counts[s.rule]++;
  const bandRules=matched.filter(s=>s.rule>=0&&rules[s.rule].scope==='band').map(s=>rules[s.rule]);
  const deltas=new Set(bandRules.map(r=>r.delta));
  if(deltas.size>1)throw Error(`原结算价${(b.price/100).toFixed(2)}元栏有不同的整栏调价设置，请统一金额。`);
  const bandDelta=bandRules[0]?.delta??0;
  const byPrice=new Map();
  for(const s of matched){const rule=rules[s.rule];
   if(rule?.scope==='station'&&bandRules.length&&rule.delta!==bandDelta)throw Error(`“${rule.name}”的单站设置与所在栏的整栏设置冲突，请将该栏相关设置改为只改本站，或统一金额。`);
   const delta=rule?.scope==='station'?rule.delta:bandDelta,price=b.price+delta,discount=b.discount-delta;
   if(price<=0||discount<0)throw Error('调价后价格或优惠金额不合理，请检查设置。');
   s.highlight=!!rule?.highlight;s.priority=s.rule<0?999:s.rule;
   if(!byPrice.has(price))byPrice.set(price,{...b,price,discount,stations:[]});byPrice.get(price).stations.push(s);
  }
  for(const p of byPrice.values()){pieces.push(p);if(p.price!==b.price)updates.push({from:b.price,to:p.price,count:p.stations.length});}
 }
 if(counts.some(n=>n>1))throw Error(`“${rules[counts.findIndex(n=>n>1)].name}”匹配到多个站，请使用更完整的站名或更清晰的原图。`);
 const groups=new Map();for(const p of pieces){if(groups.has(p.price)){const g=groups.get(p.price);if(g.discount!==p.discount)throw Error('同价栏优惠不一致，无法合并。');g.stations.push(...p.stations);}else groups.set(p.price,{...p,stations:[...p.stations]});}
 const sorted=[...groups.values()].sort((a,b)=>a.price-b.price);for(const g of sorted)g.stations.sort((a,b)=>(a.highlight?a.priority:-0+999)-(b.highlight?b.priority:999));
 return {groups:sorted,updates,merged:pieces.length-sorted.length,missing:rules.filter((_,i)=>!counts[i]).map(r=>r.name),highlighted:sorted.flatMap(g=>g.stations).filter(s=>s.highlight).length};
}
