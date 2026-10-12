/* Regenerate matching brand exports from the two editable SVG masters.
 * Requires Node.js and sharp. Run from any directory: node scripts/export-brand.cjs
 * Text in the wordmark master is outlined; no fonts are needed for the logos.
 */
const fs = require('node:fs');
const path = require('node:path');
const sharp = require('sharp');
const root = path.resolve(__dirname, '..');
const out = path.join(root, 'brand');
const ink = '#252723', paper = '#f7f6f2', muted = '#62655e';
const read = name => fs.readFileSync(path.join(out, name), 'utf8');
const mark = read('mark.svg').match(/<g[\s\S]*<\/g>/)[0];
const wordmark = read('wordmark.svg').match(/<path[^>]*\/>/)[0];
const wordWidth = 570.8, wordHeight = 72.5;
const paint = (shape, color) => shape.replaceAll(ink, color);
const placedMark = (x, y, height, color=ink) => `<g transform="translate(${x} ${y}) scale(${height/642})">${paint(mark,color)}</g>`;
const placedWord = (x, y, scale=1, color=ink) => `<g transform="translate(${x} ${y}) scale(${scale})">${paint(wordmark,color)}</g>`;
const rect = (w,h,color) => color ? `<rect width="${w}" height="${h}" fill="${color}"/>` : '';
const svg = (w,h,body,title) => `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-labelledby="title"><title id="title">${title}</title>${body}</svg>\n`;
const lockWidth = 160/642*504 + 44 + wordWidth;
const lockup = (x,y,scale,color=ink) => `<g transform="translate(${x} ${y}) scale(${scale})">${placedMark(0,0,160,color)}${placedWord(160/642*504+44,(160-wordHeight)/2,1,color)}</g>`;
const text = (x,y,size,content,color=ink,anchor='start') => `<text x="${x}" y="${y}" font-family="Helvetica Neue,Arial,sans-serif" font-size="${size}" font-weight="400" fill="${color}" text-anchor="${anchor}">${content}</text>`;
const exportsList = [];
async function save(name,w,h,body,title,png=true) {
  const source=svg(w,h,body,title);
  fs.writeFileSync(path.join(out,name+'.svg'),source);
  if(png) await sharp(Buffer.from(source)).png({compressionLevel:9}).toFile(path.join(out,name+'.png'));
  exportsList.push(name);
}
async function main(){
  await save('mark-reversed',504,642,paint(mark,paper),'Han River Data river mark — reversed',false);
  await save('logo-horizontal',Math.ceil(lockWidth),160,lockup(0,0,1),'Han River Data horizontal logo');
  await save('logo-horizontal-reversed',Math.ceil(lockWidth),160,lockup(0,0,1,paper),'Han River Data horizontal logo — reversed');
  for(const [name,background,foreground] of [['light',paper,ink],['dark',ink,paper],['transparent',null,ink],['transparent-reversed',null,paper]]){
    const square=rect(1024,1024,background)+placedMark((1024-650/642*504)/2,187,650,foreground);
    await save('logo-square-'+name,1024,1024,square,'Han River Data square logo — '+name);
    const scale=1.75;
    const banner=rect(2000,600,background)+lockup((2000-lockWidth*scale)/2,(600-160*scale)/2,scale,foreground);
    await save('logo-banner-'+name,2000,600,banner,'Han River Data banner logo — '+name);
  }
  for(const [name,background,foreground] of [['light',paper,ink],['dark',ink,paper]]){
    const scale=.98;
    const body=rect(1024,1024,background)+placedMark((1024-480/642*504)/2,160,480,foreground)+placedWord((1024-wordWidth*scale)/2,746,scale,foreground);
    await save('logo-stacked-'+name,1024,1024,body,'Han River Data stacked logo — '+name);
  }
  const social=rect(1200,630,paper)+lockup((1200-lockWidth*1.14)/2,192,1.14)+text(600,446,25,'high-quality data for frontier intelligence.',muted,'middle');
  await save('social-preview',1200,630,social,'Han River Data — high-quality data for frontier intelligence.');
  fs.copyFileSync(path.join(out,'social-preview.png'),path.join(root,'social-preview.png'));
  const favicon=svg(64,64,`<rect width="64" height="64" rx="10" fill="${paper}"/>`+placedMark((64-48/642*504)/2,8,48),'Han River Data');
  fs.writeFileSync(path.join(root,'favicon.svg'),favicon);
  for(const [file,size] of [['favicon-32.png',32],['icon-512.png',512],['apple-touch-icon.png',180]]){
    const source=size===32?Buffer.from(favicon):Buffer.from(read('logo-square-light.svg'));
    await sharp(source,{density:192}).resize(size,size).png({compressionLevel:9}).toFile(path.join(root,file));
  }
  const sizes=[16,32,48];
  const images=await Promise.all(sizes.map(size=>sharp(Buffer.from(favicon),{density:192}).resize(size,size).png().toBuffer()));
  const header=Buffer.alloc(6+16*sizes.length); header.writeUInt16LE(1,2); header.writeUInt16LE(sizes.length,4);
  let offset=header.length;
  images.forEach((buf,i)=>{const p=6+16*i;header[p]=sizes[i];header[p+1]=sizes[i];header.writeUInt16LE(1,p+4);header.writeUInt16LE(32,p+6);header.writeUInt32LE(buf.length,p+8);header.writeUInt32LE(offset,p+12);offset+=buf.length;});
  fs.writeFileSync(path.join(root,'favicon.ico'),Buffer.concat([header,...images]));
  let sheet=rect(1600,1240,paper)+text(80,92,30,'han river data / brand kit')+text(80,137,18,'river mark · square icons · horizontal logos',muted);
  sheet+=`<rect x="80" y="200" width="420" height="420" fill="${paper}" stroke="#dedfd7"/>`+placedMark(80+(420-275/642*504)/2,272,275);
  sheet+=`<rect x="540" y="200" width="420" height="420" fill="${ink}"/>`+placedMark(540+(420-275/642*504)/2,272,275,paper);
  sheet+=text(1016,244,19,'charcoal')+text(1016,274,19,ink,muted)+text(1016,342,19,'warm ivory')+text(1016,372,19,paper,muted)+text(1016,444,19,'lowercase. restrained.')+text(1016,474,19,'one mark, all formats.',muted);
  sheet+=text(80,670,18,'square / light',muted)+text(540,670,18,'square / dark',muted);
  sheet+=`<path d="M80 730H1520" stroke="#dedfd7"/>`+lockup((1600-lockWidth*1.45)/2,822,1.45)+text(80,1180,18,'banner / horizontal',muted);
  await save('brand-sheet',1600,1240,sheet,'Han River Data brand kit overview');
  console.log('Exported '+exportsList.length+' matching SVG / PNG assets and browser icons.');
}
main().catch(error=>{console.error(error);process.exit(1);});
