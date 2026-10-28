import sharp from 'sharp';
import {mkdir,copyFile,access,unlink} from 'node:fs/promises';
import path from 'node:path';

const originals='assets/originals';
await mkdir(originals,{recursive:true});
await mkdir('public/images',{recursive:true});
for(const name of ['editorial-hero','editorial-hero-mobile','coffee-bloom','brewer-still']){
 const original=path.join(originals,`${name}.png`);
  try{await access(original);}catch{await copyFile(`public/images/${name}.png`,original);}
 const sizes=name==='editorial-hero'?[960,1920]:name==='editorial-hero-mobile'?[480,960]:[640,1280];
 for(const width of sizes){
   await sharp(original).resize({width,withoutEnlargement:true}).webp({quality:83}).toFile(`public/images/${name}-${width}.webp`);
   await sharp(original).resize({width,withoutEnlargement:true}).avif({quality:58,effort:4}).toFile(`public/images/${name}-${width}.avif`);
 }
 try{await unlink(`public/images/${name}.png`);}catch(error){if(error.code!=='ENOENT')throw error;}
}
await sharp(`${originals}/coffee-bloom.png`).resize(48,48).png().toFile('public/icon.png');
for(const size of [180,192,512]){
  await sharp(`${originals}/coffee-bloom.png`).resize(size,size,{fit:'cover'}).png().toFile(`public/icon-${size}.png`);
}
for(const [name,source] of [['og-default','editorial-hero'],['og-coffee-bloom','coffee-bloom'],['og-brewer-still','brewer-still']]){
  await sharp(`${originals}/${source}.png`).resize(1200,630,{fit:'cover'}).jpeg({quality:84}).toFile(`public/images/${name}-1200x630.jpg`);
}
console.log('Prepared responsive WebP/AVIF photography, icons and Open Graph images.');
