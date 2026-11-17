// Apply Android TV compatibility to a generated Capacitor Android project.
// Run AFTER npx cap add android / npx cap sync android, BEFORE Gradle build.
// Idempotent. Does not change mobile app screens, APIs, or database.
const fs=require('node:fs');
const path=require('node:path');
const zlib=require('node:zlib');
const root=path.resolve(__dirname,'..');
const manifest=path.join(root,'android/app/src/main/AndroidManifest.xml');
if(!fs.existsSync(manifest)) {console.error('AndroidManifest.xml not found: generate Android project first');process.exit(1);}
let xml=fs.readFileSync(manifest,'utf8');
if(!xml.includes('android.software.leanback')) xml=xml.replace(/<application\b/, '<uses-feature android:name="android.software.leanback" android:required="false" />\n    <uses-feature android:name="android.hardware.touchscreen" android:required="false" />\n    <application');
if(!xml.includes('android:banner=')) xml=xml.replace(/<application\b/, '<application android:banner="@drawable/tv_banner"');
if(!xml.includes('android.intent.category.LEANBACK_LAUNCHER')){
 const activityStart=xml.indexOf('<activity');
 const activityEnd=xml.indexOf('</activity>',activityStart);
 if(activityStart<0||activityEnd<0) throw Error('Cannot locate Android launcher activity');
 const insert='<intent-filter><action android:name="android.intent.action.MAIN" /><category android:name="android.intent.category.LEANBACK_LAUNCHER" /></intent-filter>';
 xml=xml.slice(0,activityEnd)+insert+xml.slice(activityEnd);
}
fs.writeFileSync(manifest,xml);
// Generate valid 320x180 PNG banner with pure Node built-ins (placeholder: replace with approved club branding).
const w=320,h=180,rows=[];
for(let y=0;y<h;y++){const row=Buffer.alloc(1+w*4);for(let x=0;x<w;x++){let p=1+x*4;row[p]=8;row[p+1]=27;row[p+2]=47;row[p+3]=255;const gold=(y>23&&y<30)||(y>150&&y<157);if(gold){row[p]=247;row[p+1]=201;row[p+2]=72;}}rows.push(row);}
const crcTable=Array.from({length:256},(_,n)=>{let c=n;for(let k=0;k<8;k++)c=c&1?0xedb88320^(c>>>1):c>>>1;return c>>>0;});
const crc=b=>{let c=0xffffffff;for(const v of b)c=crcTable[(c^v)&255]^(c>>>8);return (c^0xffffffff)>>>0;};
const chunk=(name,data)=>{const n=Buffer.from(name);const len=Buffer.alloc(4);len.writeUInt32BE(data.length);const check=Buffer.alloc(4);check.writeUInt32BE(crc(Buffer.concat([n,data])));return Buffer.concat([len,n,data,check]);};
const ihdr=Buffer.alloc(13);ihdr.writeUInt32BE(w,0);ihdr.writeUInt32BE(h,4);ihdr[8]=8;ihdr[9]=6;
const png=Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',ihdr),chunk('IDAT',zlib.deflateSync(Buffer.concat(rows))),chunk('IEND',Buffer.alloc(0))]);
const drawable=path.join(root,'android/app/src/main/res/drawable-nodpi');fs.mkdirSync(drawable,{recursive:true});fs.writeFileSync(path.join(drawable,'tv_banner.png'),png);
console.log('Android TV manifest and placeholder banner generated. Verify Play TV listing requirements before release.');
