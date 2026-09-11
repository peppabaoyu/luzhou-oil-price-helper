export const EXPORT_FONT='OilExportBold';
export const CUSTOM_FONT='OilChinese';
const customReady=new Map();
export async function ensureCustomFont(weights=[700]){
 if(typeof document==='undefined')return;
 await Promise.all([...new Set(weights)].map(weight=>{
 if(!customReady.has(weight))customReady.set(weight,(async()=>{let timer;const controller=new AbortController();try{
  if(!document.fonts||typeof FontFace==='undefined')throw Error('当前浏览器不支持出图字库，请用手机自带浏览器打开。');
  timer=setTimeout(()=>controller.abort(),120000);
  const response=await fetch(new URL(`./fonts/oil-chinese-${weight}.woff2`,import.meta.url),{signal:controller.signal});
  if(!response.ok)throw Error(response.status===404?`网站缺少中文字库文件（${weight}），请上传修复包中的 fonts 文件夹。`:`中文字库下载失败（${response.status}），请稍后重试。`);
  const data=await response.arrayBuffer();
  clearTimeout(timer);
  const face=new FontFace(CUSTOM_FONT,data,{weight:String(weight),style:'normal'});
  await Promise.race([face.load(),new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error('手机解析字库超时，请关闭其他网页后重新选图。')),30000);})]);
  document.fonts.add(face);await document.fonts.load(`${weight} 46px "${CUSTOM_FONT}"`,'中江黄鹿温江天府');
  if(face.status!=='loaded')throw Error('font not loaded');
 }catch(e){customReady.delete(weight);if(e.name==='AbortError')throw Error('中文字库下载超过两分钟，请用手机自带浏览器打开后重新选图。');if(e instanceof TypeError)throw Error('中文字库下载中断，请重新选图；若仍失败，请在手机自带浏览器中打开。');throw e;}finally{clearTimeout(timer);}})());
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
