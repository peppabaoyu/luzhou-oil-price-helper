import {stationRule} from './settings.js';
export function pickMissingStations(missing,choices,rules,stations){
 return new Promise((resolve,reject)=>{
  const panel=document.createElement('section');panel.className='station-picker panel';panel.setAttribute('aria-label','核对未识别站名');
  const heading=document.createElement('h2');heading.textContent='请核对未识别的站名';panel.append(heading);
  const intro=document.createElement('p');intro.textContent='已放大复核，但以下站名仍未准确识别。如果图片里有这个站，点开并选择对应的原图文字；确实没有则保留“跳过”。';panel.append(intro);
  const available=choices.filter(c=>stationRule(stations[c.index],rules)<0),selected=new Map();
  for(const rule of missing){
   const detail=document.createElement('details'),summary=document.createElement('summary');summary.textContent=`${rule.name}：跳过（点此选择原图站名）`;detail.append(summary);
   const skip=document.createElement('button');skip.type='button';skip.textContent='图片没有此站，跳过';skip.onclick=()=>{selected.delete(rule.index);summary.textContent=`${rule.name}：跳过（点此选择原图站名）`;detail.open=false;};detail.append(skip);
   const grid=document.createElement('div');grid.className='station-choice-grid';
   for(const c of available){const button=document.createElement('button');button.type='button';button.className='station-choice';const img=document.createElement('img');img.src=c.image;img.alt=`原图站名，第${c.index+1}项`;const label=document.createElement('span');label.textContent=`原结算价 ${(c.price/100).toFixed(2)}元`;button.append(img,label);button.onclick=()=>{selected.set(rule.index,c.index);summary.replaceChildren(document.createTextNode(`${rule.name}：已选择 `));const thumb=img.cloneNode();thumb.className='chosen-station';summary.append(thumb);detail.open=false;};grid.append(button);}detail.append(grid);panel.append(detail);
  }
  const error=document.createElement('p');error.setAttribute('role','alert');panel.append(error);
  const finish=document.createElement('button');finish.type='button';finish.className='primary';finish.textContent='按以上选择继续出图';finish.onclick=()=>{if(new Set(selected.values()).size!==selected.size){error.textContent='同一个原图站不能用于两条设置，请重新选择。';return;}panel.remove();resolve([...selected].map(([rule,station])=>({rule,station})));};
  const cancel=document.createElement('button');cancel.type='button';cancel.className='secondary';cancel.textContent='取消，返回修改设置';cancel.onclick=()=>{panel.remove();reject(Error('已取消出图，可以修改设置后重新选图。'));};panel.append(finish,cancel);
  document.getElementById('result').before(panel);document.getElementById('status').textContent='需要核对站名，请在下方选择后继续。';document.getElementById('progress').hidden=true;panel.scrollIntoView({block:'start'});
 });
}
