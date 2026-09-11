export const EXPORT_FONT='OilExportBold';
export const CUSTOM_FONT='OilChinese';
const customReady=new Map();
export async function ensureCustomFont(weights=[700]){
 if(typeof document==='undefined')return;
 await Promise.all([...new Set(weights)].map(weight=>{
 if(!customReady.has(weight))customReady.set(weight,(async()=>{let timer;try{
  const face=new FontFace(CUSTOM_FONT,`url("${new URL(`./fonts/oil-chinese-${weight}.ttf`,import.meta.url).href}")`,{weight:String(weight),style:'normal'});
  await Promise.race([face.load(),new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error('timeout')),60000);})]);
  document.fonts.add(face);await document.fonts.load(`${weight} 46px "${CUSTOM_FONT}"`,'中江黄鹿温江天府');
  if(face.status!=='loaded')throw Error('font not loaded');
 }catch(e){customReady.delete(weight);throw Error('完整中文字库未加载成功，请检查网络后重试。首次使用临时站需要加载字库。');}finally{clearTimeout(timer);}})());
 return customReady.get(weight);
 }));
}
let ready;
export async function ensureExportFont(){
  if(typeof document==='undefined')return;
  if(!document.fonts||typeof FontFace==='undefined')throw Error('当前浏览器无法加载导出字库，请使用较新的Chrome、Edge或Safari。');
  if(!ready)ready=(async()=>{
    let timer;
    try{
      const face=new FontFace(EXPORT_FONT,`url("${new URL('./fonts/oil-bold.ttf',import.meta.url).href}")`,{weight:'700',style:'normal'});
      await Promise.race([face.load(),new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error('粗体字库加载超时，请联网刷新后重试。')),20000);})]);
      document.fonts.add(face);
      await document.fonts.load(`700 46px "${EXPORT_FONT}"`,'泸渝高速合江服务区南/北泸州龙马潭安宁临港兆雅加油站');
      if(face.status!=='loaded')throw Error('粗体字库未就绪');
    }catch(error){ready=null;throw Error('粗体字库加载失败，请联网刷新网页后重试。');}
    finally{clearTimeout(timer);}
  })();
  return ready;
}
