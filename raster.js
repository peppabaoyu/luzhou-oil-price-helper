// Recover antialiased black ink from a colored background. The former hard
// cutoff discarded lightly covered edge pixels, breaking thin strokes.
export function inkCoverage(red,green,blue,background){
  const [r,g,b]=background,denom=r*r+g*g+b*b;
  if(!denom)return 0;
  const coverage=Math.max(0,Math.min(1,1-(red*r+green*g+blue*b)/denom));
  return Math.round(coverage*255);
}
