import {protocolAges,validateAgeProtocol} from '../dist/diagrams.js';
// Bounded integration coverage, not an assertion that every authored picture was browser-reviewed.
export function selectProtocolBrowserSample(activities){
 const complete=activities.filter(e=>e.ageProtocols&&protocolAges.every(age=>validateAgeProtocol(e.ageProtocols[age]).length===0));
 const selected=new Map();
 for(const category of new Set(complete.map(e=>e.category))){const group=complete.filter(e=>e.category===category).sort((a,b)=>a.id-b.id);for(const e of [group[0],group.at(-1)])selected.set(e.id,e);}
 return {activities:[...selected.values()].sort((a,b)=>a.id-b.id),completeActivities:complete.length,scope:'First and latest complete activity per subject; all four ages in each selected activity. Not full-year browser or pixel coverage.'};
}
