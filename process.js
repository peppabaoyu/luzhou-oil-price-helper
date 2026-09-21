import {separateBandColors} from './band-colors.js';
import {defaultRules,applyRules,stationRule} from './settings.js';
import {recoverStations,missingRules} from './station-recovery.js';
import {TARGETS,adjustBands,detectBands,inkRows,cellsForBand,priceFromText,targetIndex,normalize} from './engine.js';
import {ensureExportFont,EXPORT_FONT,ensureCustomFont,CUSTOM_FONT} from './export-font.js';
import {inkCoverage} from './raster.js';
export async function processImage(source,worker,canvasFactory,progress=()=>{},rules=defaultRules(),resolveMissing,footer={mode:"replace",text:""}){
 const make=(w,h)=>canvasFactory(Math.ceil(w),Math.ceil(h)); const scale=Math.min(1564/source.width,Math.sqrt(12000000/(source.width*source.height)));const input=make(source.width*scale,source.height*scale);input.getContext('2d').drawImage(source,0,0,input.width,input.height);const image=input.getContext('2d').getImageData(0,0,input.width,input.height);const w=input.width;

 const regions=detectBands(image);if(regions.length<4)throw Error('未识别到彩色价格栏。当前版本适用于示例中的三列彩色表格。');
 const crop=(box,bw=false)=>{const c=make(box.w+20,box.h+20);const ctx=c.getContext('2d');ctx.fillStyle='white';ctx.fillRect(0,0,c.width,c.height);ctx.drawImage(input,box.x,box.y,box.w,box.h,10,10,box.w,box.h);if(bw){const d=ctx.getImageData(0,0,c.width,c.height);for(let i=0;i<d.data.length;i+=4){let v=Math.max(d.data[i],d.data[i+1],d.data[i+2])<135?0:255;d.data[i]=d.data[i+1]=d.data[i+2]=v;d.data[i+3]=255;}ctx.putImageData(d,0,0);}return c;};
 const read=async(c,blocks=false)=>{const r=await worker.recognize(c.toDataURL('image/png'),{},blocks?{text:true,blocks:true}:{text:true});return r.data;};
 await worker.setParameters({tessedit_pageseg_mode:'7',preserve_interword_spaces:'1'});
 const bands=[];let tailStart=null;for(let i=0;i<regions.length;i++){const region=regions[i];const rows=inkRows(image,region);if(!rows.length)throw Error('发现无法读取的彩色栏，请上传完整原图。');const last=rows.at(-1);progress(12+i/regions.length*28,'正在读取各栏价格…');const data=await read(crop({x:0,y:last.y-2,w,h:last.end-last.y+4},true));const p=priceFromText(data.text);if(!p){if(bands.length===0)throw Error('未能读清第一栏价格，请使用清晰的公司原图。');tailStart=region.y;break;}if(p.price<100||p.price>2000||p.discount<0||p.discount>500)throw Error('识别到异常价格，请更换清晰原图。');const stations=cellsForBand(image,region,rows);if(!stations.length)throw Error('未能分离站点与价格，请使用与示例相同格式的原图。');bands.push({...region,...p,stations});}
 if(bands.length<3||tailStart===null)throw Error('未识别到完整的价格表和底部说明，请上传完整原图。');
 // All listed tier prices must use the same posted-price anchor.
 const anchor=bands[0].price+bands[0].discount;if(bands.some(b=>b.price+b.discount!==anchor))throw Error('识别出的优惠与结算价不一致，已停止出图。请换一张清晰原图。');
 const stations=bands.flatMap(b=>b.stations.map(s=>{s.background=b.color;return s;}));const OCR_ROW=104;const sheet=make(1600,stations.length*OCR_ROW+20);const sctx=sheet.getContext('2d');sctx.fillStyle='white';sctx.fillRect(0,0,sheet.width,sheet.height);stations.forEach((s,i)=>{const c=crop(s.box,true);const scale=Math.min(70/c.height,1560/c.width);sctx.drawImage(c,20,10+i*OCR_ROW,c.width*scale,c.height*scale);});
 progress(45,'正在识别需要修改的站点…');await worker.setParameters({tessedit_pageseg_mode:'6'});const stationData=await read(sheet,true);const texts=stations.map(()=>[]);for(const block of stationData.blocks||[])for(const para of block.paragraphs||[])for(const line of para.lines||[]){const i=Math.floor(((line.bbox.y0+line.bbox.y1)/2-10)/OCR_ROW);if(i>=0&&i<stations.length)texts[i].push(line.text);}
 stations.forEach((s,i)=>{s.text=texts[i].join('');s.target=targetIndex(s.text);});
 for(const s of stations.filter(s=>s.target<0&&normalize(s.text).includes('龙马'))){const c=crop(s.box,true),large=make(c.width*2,c.height*2);large.getContext('2d').drawImage(c,0,0,large.width,large.height);await worker.setParameters({tessedit_pageseg_mode:'7'});const retry=await read(large);s.target=targetIndex(retry.text);if(s.target>=0)s.text=TARGETS[s.target];}
 await recoverStations(stations,rules,async(s,mode)=>{
  const b=s.box,pad=3,x=Math.max(0,b.x-pad),y=Math.max(0,b.y-pad),cw=Math.min(w-x,b.w+2*pad),ch=Math.min(input.height-y,b.h+2*pad),c=make(cw,ch),cx=c.getContext('2d');cx.drawImage(input,x,y,cw,ch,0,0,cw,ch);const data=cx.getImageData(0,0,cw,ch);
  for(let i=0;i<data.data.length;i+=4){const coverage=inkCoverage(data.data[i],data.data[i+1],data.data[i+2],s.background)/255;const value=mode?(coverage>.36?0:255):Math.round(255*(1-coverage));data.data[i]=data.data[i+1]=data.data[i+2]=value;data.data[i+3]=255;}cx.putImageData(data,0,0);
  const scale=Math.max(2,Math.min(4,80/ch)),large=make(cw*scale+40,ch*scale+40),lc=large.getContext('2d');lc.fillStyle='white';lc.fillRect(0,0,large.width,large.height);lc.drawImage(c,20,20,cw*scale,ch*scale);await worker.setParameters({tessedit_pageseg_mode:mode?'13':'7'});return (await read(large)).text;
 },progress);
 const unresolved=missingRules(stations,rules);
 if(unresolved.length&&resolveMissing){
  const choices=stations.map((s,index)=>({index,text:s.text,image:crop(s.box).toDataURL('image/png'),price:bands.find(b=>b.stations.includes(s)).price}));
  const assignments=await resolveMissing(unresolved,choices,rules,stations);
  const used=new Set(),usedRules=new Set();for(const a of assignments){if(!unresolved.some(r=>r.index===a.rule)||!Number.isInteger(a.station)||!stations[a.station]||used.has(a.station)||usedRules.has(a.rule)||stationRule(stations[a.station],rules)>=0)throw Error('站点选择无效，请重新处理。');used.add(a.station);usedRules.add(a.rule);stations[a.station].confirmedName=rules[a.rule].name;}
 }
 const result=applyRules(bands,rules);
 let footerRow=null,footerRegion=regions.at(-1),footerWarning='';
 if(footer.mode!=='keep'){
  progress(78,'正在定位底部说明…');const candidate=inkRows(image,footerRegion).at(-1);
  if(candidate&&candidate.y>=tailStart){await worker.setParameters({tessedit_pageseg_mode:'7'});const data=await read(crop({x:0,y:candidate.y-2,w,h:candidate.end-candidate.y+4},true));if(/挂牌|优惠/.test(normalize(data.text)))footerRow=candidate;}
  if(!footerRow)footerWarning='未能确认原图底部说明的位置，已保留原内容并在最下方添加新说明。';
 }
 const footerText=String(footer.text||'').trim()||`挂牌价格${anchor/100}以上的，挂牌价优惠4角5`;
 const footerLines=footerText.split(/\r?\n/).flatMap(line=>Array.from(line).join('').match(/.{1,34}/gu)||['']);
 progress(90,'正在重新排版…');const ratio=w/1564;const margin=8*ratio,rowHeight=52*ratio,font=38*ratio,focusFont=46*ratio,priceHeight=44*ratio;let y=bands[0].y;const layout=separateBandColors(result.groups).map(b=>{const first=b.stations[0];const longFirst=first?.highlight&&(first.target===0||(rules[first.rule]?.name.length||0)>12);const cells=b.stations.map((s,i)=>{const row=Math.floor(i/3),col=i%3;const widths=row===0&&longFirst?[.44,.28,.28]:[1/3,1/3,1/3];return {station:s,row,left:widths.slice(0,col).reduce((a,v)=>a+v,0),width:widths[col]};});const inlinePrice=cells.length===1&&!longFirst;const height=Math.ceil(cells.length/3)*rowHeight+(inlinePrice?0:priceHeight)+margin;return {...b,cells,inlinePrice,y:(y+=height)-height,height};});const tailHeight=(footer.mode==='keep'?input.height:footerRow?Math.max(tailStart,footerRow.y-4*ratio):input.height)-tailStart;const footerHeight=footer.mode==='keep'?0:footerLines.length*46*ratio+12*ratio;const exportScale=Math.max(1,Math.min(2,2560/w));const out=make(w*exportScale,(y+tailHeight+footerHeight)*exportScale);const ctx=out.getContext('2d');ctx.scale(exportScale,exportScale);ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';ctx.fillStyle='white';ctx.fillRect(0,0,w,y+tailHeight+footerHeight);ctx.drawImage(input,0,0,w,bands[0].y,0,0,w,bands[0].y);
 await ensureExportFont();if(footer.mode!=="keep"&&footer.text.trim())await ensureCustomFont([700]);
 const customStations=layout.flatMap(b=>b.stations).filter(s=>s.rule>=0&&s.target<0);if(customStations.length){progress(91,'正在加载临时站中文字库…');await ensureCustomFont(customStations.map(s=>s.highlight?700:400));}
 const drawFit=(text,x,y,max,size,bold=false,color='#111',align='center',family=EXPORT_FONT,weight=700)=>{ctx.fillStyle=color;ctx.textAlign=align;ctx.textBaseline='middle';ctx.font=`${weight} ${size}px "${family}"`;while(ctx.measureText(text).width>max&&size>12){size-=.5;ctx.font=`${weight} ${size}px "${family}"`;}ctx.fillText(text,x,y);};
 // Draw copied station glyphs over the new background to retain original spelling.
 const glyph=s=>{const b=s.box,pad=2,x=Math.max(0,b.x-pad),y=Math.max(0,b.y-pad),gw=Math.min(w-x,b.w+pad*2),gh=Math.min(input.height-y,b.h+pad*2),c=make(gw,gh),cx=c.getContext('2d');cx.drawImage(input,x,y,gw,gh,0,0,gw,gh);const pix=cx.getImageData(0,0,gw,gh);for(let i=0;i<pix.data.length;i+=4){const alpha=inkCoverage(pix.data[i],pix.data[i+1],pix.data[i+2],s.background);pix.data[i]=pix.data[i+1]=pix.data[i+2]=0;pix.data[i+3]=alpha;}cx.putImageData(pix,0,0);return c;};
 for(const b of layout){ctx.fillStyle=`rgb(${b.color.join(',')})`;ctx.fillRect(0,b.y,w,b.height);b.cells.forEach(({station:s,left,width,row})=>{const x=(left+width/2)*w,cy=b.y+margin/2+(row+.5)*rowHeight;if(s.highlight&&s.target>=0)drawFit(TARGETS[s.target],x,cy,width*w-30*ratio,focusFont,true,'#d00e16');else if(s.rule>=0&&s.target<0)drawFit(rules[s.rule].name,x,cy,width*w-30*ratio,s.highlight?focusFont:font,s.highlight,s.highlight?'#d00e16':'#111','center',CUSTOM_FONT,s.highlight?700:400);else{const c=glyph(s);const sc=Math.min(font/c.height,(width*w-30*ratio)/c.width);ctx.drawImage(c,x-c.width*sc/2,cy-c.height*sc/2,c.width*sc,c.height*sc);}});drawFit(`优惠${(b.discount/100).toFixed(2)}元，结算价${(b.price/100).toFixed(2)}`,b.inlinePrice?w*2/3:w/2,b.inlinePrice?b.y+margin/2+rowHeight/2:b.y+b.height-priceHeight/2,b.inlinePrice?w*2/3-30*ratio:w-30*ratio,35*ratio,true);}
 ctx.drawImage(input,0,tailStart,w,tailHeight,0,y,w,tailHeight);if(footer.mode!=='keep'){const footerY=y+tailHeight;ctx.fillStyle=`rgb(${footerRegion.color.join(',')})`;ctx.fillRect(0,footerY,w,footerHeight);footerLines.forEach((line,i)=>drawFit(line,w/2,footerY+(i+.5)*46*ratio+6*ratio,w-32*ratio,33*ratio,true,'#111','center',footer.text.trim()?CUSTOM_FONT:EXPORT_FONT));}

 progress(100,'处理完成');return {canvas:out,footerWarning,updates:result.updates,merged:result.merged,originalBandCount:bands.length,stationCount:stations.length,missing:result.missing,highlighted:result.highlighted};
}

