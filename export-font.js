export const EXPORT_FONT='OilExportBold';
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
