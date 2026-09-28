import {normalize,TARGETS} from './engine.js?v=20260929';
const key=s=>normalize(String(s).normalize('NFKC')).replace(/[“”‘’"'·、;；|]/g,'');
export function addStations(result,additions,anchor){
 const names=new Set(result.groups.flatMap(g=>g.stations.flatMap(s=>[s.text,s.confirmedName,TARGETS[s.target],...(s.ocrAlternatives||[])].filter(Boolean).map(key))));
 const groups=result.groups.map(g=>({...g,stations:[...g.stations]}));let joined=0;
 for(const [i,a] of additions.entries()){
  const name=String(a.name||'').trim(),n=key(name);
  if(!n||names.has(n))throw Error(`新增站“${name}”为空或已存在，请检查站名；修改原图已有站请使用上方调价设置。`);
  if(!Number.isInteger(a.price)||a.price<=0||a.price>anchor)throw Error(`新增站“${name}”的结算价须大于0，且不能高于挂牌价${(anchor/100).toFixed(2)}元。`);
  names.add(n);let group=groups.find(g=>g.price===a.price);
  if(group)joined++;else{group={price:a.price,discount:anchor-a.price,color:[226,239,218],stations:[]};groups.push(group);}
  group.stations.push({text:name,renderName:name,target:-1,rule:-1,added:true,highlight:!!a.highlight,priority:500+i});
 }
 groups.sort((a,b)=>a.price-b.price);for(const g of groups)g.stations.sort((a,b)=>Number(b.highlight)-Number(a.highlight)||(a.highlight?(a.priority??999)-(b.priority??999):0));
 return {...result,groups,added:additions.length,joined,highlighted:groups.flatMap(g=>g.stations).filter(s=>s.highlight).length};
}
