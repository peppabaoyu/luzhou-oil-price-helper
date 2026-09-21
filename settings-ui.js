import {defaultRules} from './settings.js';
const rows=()=>document.getElementById('ruleRows');
function addRow(rule={name:'',delta:5,highlight:true,scope:'station'}){
 const card=document.createElement('div');card.className='station-rule';
 const label=(text,input)=>{const l=document.createElement('label');l.append(document.createTextNode(text),input);card.append(l);return input;};
 const name=document.createElement('input');name.type='text';name.value=rule.name;name.placeholder='填写完整站名（可留空）';name.className='station-name';label('站名',name);
 const delta=document.createElement('input');delta.type='number';delta.step='0.05';delta.value=(rule.delta/100).toFixed(2);delta.className='station-delta';label('结算价调整（元，正数涨价，负数降价，0不变）',delta);
 const presets=document.createElement('select');presets.setAttribute('aria-label','选择结算价涨跌金额');presets.add(new Option('不变','0'));for(const sign of [1,-1])for(let n=5;n<=100;n+=5)presets.add(new Option(`${sign>0?'增长':'下降'} ${(n/100).toFixed(2)} 元`,String(sign*n)));presets.add(new Option('其他金额（在下方输入）','custom'));presets.value=String(rule.delta);delta.before(presets);presets.onchange=()=>{if(presets.value!=='custom')delta.value=(Number(presets.value)/100).toFixed(2);};delta.oninput=()=>{const value=String(Math.round(Number(delta.value)*100));presets.value=[...presets.options].some(o=>o.value===value)?value:'custom';};
 const steps=document.createElement('div');steps.className='delta-buttons';for(const [text,change] of [['− 降0.05',-5],['不变',0],['＋ 涨0.05',5]]){const b=document.createElement('button');b.type='button';b.textContent=text;b.onclick=()=>{delta.value=(change?(Math.round(Number(delta.value||0)*100)+change)/100:0).toFixed(2);delta.oninput();};steps.append(b);}card.append(steps);
 const select=(cls,options,value)=>{const el=document.createElement('select');el.className=cls;for(const [v,t] of options)el.add(new Option(t,v));el.value=value;return el;};
 label('标红、加粗、放大并前置',select('station-highlight',[['yes','是'],['no','否']],rule.highlight?'yes':'no'));
 label('调价范围',select('station-scope',[['station','只改本站'],['band','整个价格栏']],rule.scope));
 rows().append(card);
}
export function initSettings(){const reset=()=>{document.getElementById('footerMode').value='replace';document.getElementById('footerText').value='';rows().replaceChildren();defaultRules().forEach(addRow);for(let i=0;i<3;i++)addRow();};reset();document.getElementById('addRule').onclick=()=>addRow();document.getElementById('resetRules').onclick=reset;}
export function setSettingsBusy(busy){document.getElementById('settingFields').disabled=busy;}
export function readSettings(){return [...rows().children].flatMap(card=>{const name=card.querySelector('.station-name').value.trim();if(!name)return [];const input=card.querySelector('.station-delta'),raw=Number(input.value),delta=Math.round(raw*100);if(input.value===''||!Number.isFinite(raw)||Math.abs(raw*100-delta)>1e-6||delta%5)throw Error('调价金额请按0.05元递增或递减，例如0、0.05、-0.10。');return [{name,delta,highlight:card.querySelector('.station-highlight').value==='yes',scope:card.querySelector('.station-scope').value}];});}

export function readFooterSettings(){return {mode:document.getElementById('footerMode').value,text:document.getElementById('footerText').value.trim()};}
