import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const css=readFileSync(new URL('../dist/styles.css',import.meta.url),'utf8');
test('record status owns a bounded line without forcing long names to overflow',()=>{
 const rule=css.match(/\.record-note #save-status\{([^}]+)\}/)?.[1];
 assert.ok(rule,'record-only selector must not change the family cloud status');
 for(const declaration of ['display:block','width:fit-content','max-width:100%','margin-top:6px','white-space:normal','overflow-wrap:anywhere'])assert.ok(rule.includes(declaration),declaration);
 assert.doesNotMatch(rule,/nowrap|overflow:hidden|text-overflow/);
});
