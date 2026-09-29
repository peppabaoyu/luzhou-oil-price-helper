// Use OCR only to locate the discount amount. The preceding text remains original pixels.
export function discountBox(data){
 const symbols=[];
 for(const b of data.blocks||[])for(const p of b.paragraphs||[])for(const l of p.lines||[])for(const w of l.words||[])for(const s of w.symbols||[])if(s.text?.trim())symbols.push(s);
 const text=symbols.map(s=>s.text).join(''),match=/优惠([0-9一二三四五六七八九零两十]+角[0-9一二三四五六七八九零两十]*分?)/.exec(text);
 if(!match)return null;
 let pos=0;const begin=match.index+2,end=begin+match[1].length,selected=[];
 for(const s of symbols){if(pos>=begin&&pos<end)selected.push(s.bbox);pos+=s.text.length;}
 if(!selected.length)return null;
 return {x0:Math.min(...selected.map(b=>b.x0)),x1:Math.max(...selected.map(b=>b.x1)),y0:Math.min(...selected.map(b=>b.y0)),y1:Math.max(...selected.map(b=>b.y1)),glyphCount:Array.from(match[1]).length,atEnd:end===text.length};
}
export function locateDiscountPixels(image,row,box){
 if(!box?.atEnd)return null;
 const {width:w,data}=image,runs=[];let start=-1;
 const ink=(x,y)=>{const p=(y*w+x)*4;return Math.max(data[p],data[p+1],data[p+2])<165;};
 for(let x=0;x<=w;x++){let active=false;if(x<w)for(let y=row.y;y<row.end;y++)if(ink(x,y)){active=true;break;}if(active&&start<0)start=x;if(!active&&start>=0){runs.push({start,end:x});start=-1;}}
 if(runs.length<box.glyphCount)return null;const suffix=runs.slice(-box.glyphCount),x=suffix[0].start,end=suffix.at(-1).end;
 if(Math.abs(x-(box.x0-10))>Math.max(20,(row.end-row.y)*.8))return null;
 let top=row.end,bottom=row.y;for(let xx=x;xx<end;xx++)for(let yy=row.y;yy<row.end;yy++)if(ink(xx,yy)){top=Math.min(top,yy);bottom=Math.max(bottom,yy+1);}
 return {x,y:top,w:end-x,h:bottom-top};
}
