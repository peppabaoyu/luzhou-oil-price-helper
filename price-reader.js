import {priceFromText} from './engine.js?v=20260929-gap';
export const validPrice=p=>p&&Number.isInteger(p.price)&&Number.isInteger(p.discount)&&p.price>0&&p.price<=2000&&p.discount>=0&&p.discount<=1000;
// Retry only uncertain rows. A disagreeing result is left for confirmation.
export async function readPriceVariants(recognize){
 const results=[],texts=[];
 for(let mode=0;mode<3;mode++){
  const data=await recognize(mode);texts.push(data.text||'');const p=priceFromText(data.text||'');
  if(validPrice(p)){
   results.push(p);
   if(mode===0&&(data.confidence??0)>=80)return {value:p,texts};
   if(results.filter(q=>q.price===p.price&&q.discount===p.discount).length>=2)return {value:p,texts};
  }
 }
 return {value:null,suggestion:results[0]||null,texts};
}
