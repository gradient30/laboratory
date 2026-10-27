import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const css=readFileSync(new URL('../dist/styles.css',import.meta.url),'utf8');
const luminance=hex=>{const v=hex.replace('#','').match(/../g).map(n=>parseInt(n,16)/255).map(n=>n<=.04045?n/12.92:((n+.055)/1.055)**2.4);return .2126*v[0]+.7152*v[1]+.0722*v[2]};
const contrast=(a,b)=>{const values=[luminance(a),luminance(b)].sort((a,b)=>b-a);return (values[0]+.05)/(values[1]+.05)};
const pairs={current:['#ffffff','#164db0'],viewed:['#164b31','#e1f5e9'],unviewed:['#704000','#fff0c2'],locked:['#475569','#edf0f4'],error:['#8b1f2c','#ffebee'],primary:['#ffffff','#126454'],secondary:['#20584e','#ffffff'],disabled:['#57616f','#e7ebef'],materials:['#ffffff','#824300'],learning:['#ffffff','#65409a'],toast:['#ffffff','#163e36']};
for(const [state,[foreground,background]] of Object.entries(pairs))test(`${state} text palette exceeds 4.5:1 contrast`,()=>{assert.ok(css.includes(foreground)||foreground==='#ffffff');assert.ok(css.includes(background)||background==='#ffffff');assert.ok(contrast(foreground,background)>=4.5,`${state}: ${contrast(foreground,background)}`)});
test('state colors retain visible shapes and textual state hooks',()=>{
 assert.match(css,/data-read-state=unviewed\][^{]*\{[^}]*dashed/);
 assert.match(css,/data-read-state=viewed\][^{]*\{[^}]*solid/);
 assert.match(css,/data-read-state=current\][^{]*\{[^}]*box-shadow/);
 for(const state of ['locked','preview','ready'])assert.ok(css.includes(`[data-state=${state}]`));
 for(const state of ['error','pending','saved'])assert.ok(css.includes(`[data-save-state=${state}]`));
 assert.match(css,/prefers-reduced-motion:reduce/);
});
