// Remove only large interior runs containing no visible foreground. Retain normal row gaps.
export function blankCuts(image){
 const {width:w,height:h,data}=image,runs=[];let start=-1;
 for(let y=0;y<h;y++){
  const ref=(y*w+Math.min(3,w-1))*4,bg=[data[ref],data[ref+1],data[ref+2]];let ink=0;
  for(let x=3;x<w-3;x++){const p=(y*w+x)*4;if(Math.max(...bg.map((v,k)=>Math.abs(data[p+k]-v)))>28&&++ink>Math.max(3,w*.002))break;}
  const blank=ink<=Math.max(3,w*.002);
  if(blank&&start<0)start=y;
  if(!blank&&start>=0){if(start>0&&y-start>=Math.max(80,w*.09))runs.push({start:start+3,end:y-3});start=-1;}
 }
 return runs;
}
export function compactBlankSpace(source,make){
 const cuts=blankCuts(source.getContext('2d').getImageData(0,0,source.width,source.height));
 const removed=cuts.reduce((n,c)=>n+c.end-c.start,0);if(!removed)return {canvas:source,removed:0};
 const canvas=make(source.width,source.height-removed),ctx=canvas.getContext('2d');let from=0,to=0;
 for(const cut of [...cuts,{start:source.height,end:source.height}]){const h=cut.start-from;if(h>0)ctx.drawImage(source,0,from,source.width,h,0,to,source.width,h);to+=h;from=cut.end;}
 return {canvas,removed};
}
