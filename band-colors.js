const PALETTE=[[142,169,219],[255,245,153],[226,239,218],[255,175,175],[179,223,238],[255,211,157]];
export const colorDistance=(a,b)=>Math.hypot(...a.map((v,i)=>v-b[i]));
export function separateBandColors(groups){
 let previous=null;
 return groups.map(g=>{let color=[...g.color];if(previous&&colorDistance(previous,color)<85)color=[...PALETTE.reduce((best,c)=>colorDistance(previous,c)>colorDistance(previous,best)?c:best)];previous=color;return {...g,color};});
}
