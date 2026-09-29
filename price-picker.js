import {validPrice} from './price-reader.js?v=20260929-gap';
export function confirmPrice({image,suggestion,allowTail=false,anchor=null,index}){
 return new Promise((resolve,reject)=>{
  const panel=document.createElement('section');panel.className='panel station-picker station-rule';
  const h=document.createElement('h2');h.textContent=`请核对第${index+1}个颜色栏的原价`;panel.append(h);
  const intro=document.createElement('p');intro.textContent='已尝试增强和重读。请对照下图输入修改前的结算价和优惠金额，无需重新上传图片。';panel.append(intro);
  const img=document.createElement('img');img.src=image;img.alt='需要核对的原图价格栏';img.style.cssText='width:100%;height:auto';panel.append(img);
  const input=(title,value)=>{const label=document.createElement('label');label.textContent=title;const el=document.createElement('input');el.type='number';el.step='0.01';el.inputMode='decimal';el.value=value==null?'':(value/100).toFixed(2);label.append(el);panel.append(label);return el;};
  const price=input('原结算价（元/升）',suggestion?.price),discount=input('原优惠金额（元/升）',suggestion?.discount);
  if(anchor!==null){const note=document.createElement('p');note.textContent=`与其他栏一致的挂牌价应为 ${(anchor/100).toFixed(2)} 元，结算价与优惠之和需与它一致。`;panel.append(note);}
  const error=document.createElement('p');error.setAttribute('role','alert');panel.append(error);
  const done=value=>{panel.remove();document.getElementById('progress').hidden=false;resolve(value);};
  const button=(label,fn,cls='secondary')=>{const b=document.createElement('button');b.type='button';b.textContent=label;b.className=cls;b.onclick=fn;panel.append(b);};
  button('确认原价，继续处理',()=>{const p={price:Math.round(Number(price.value)*100),discount:Math.round(Number(discount.value)*100)};if(!price.value||!discount.value||!validPrice(p)||Math.abs(Number(price.value)*100-p.price)>1e-6||Math.abs(Number(discount.value)*100-p.discount)>1e-6){error.textContent='请填写有效金额，最多两位小数。';return;}if(anchor!==null&&p.price+p.discount!==anchor){error.textContent='结算价加优惠金额与其他栏不一致，请核对。';return;}done(p);},'primary');
  if(allowTail)button('这里开始是其他品牌或底部说明，保留原图',()=>done({tail:true}));
  button('取消处理',()=>{panel.remove();reject(Error('已取消，可修改设置后重新选图。'));});
  document.getElementById('result').before(panel);document.getElementById('status').textContent='需要核对一处原价，请在下方填写后继续。';document.getElementById('progress').hidden=true;panel.scrollIntoView({block:'start'});
 });
}
