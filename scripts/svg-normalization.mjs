// Lexical XML attribute normalization only. Text, comments, CDATA and declarations remain byte-identical.
const identifierAttributes=new Set(['id','aria-labelledby','aria-describedby','clip-path','fill','stroke','href','xlink:href']);
export const NORMALIZATION='xml-tag-identifier-attributes-numeric-or-literal-ID-v2';
export function normalizePreparedSvg(svg){
 let out='',position=0;
 while(position<svg.length){
  const open=svg.indexOf('<',position);if(open<0)return out+svg.slice(position);out+=svg.slice(position,open);
  let end;
  for(const [prefix,suffix]of [['<!--','-->'],['<![CDATA[',']]>'],['<?','?>']])if(svg.startsWith(prefix,open)){end=svg.indexOf(suffix,open+prefix.length);if(end<0)throw Error('Unterminated XML non-attribute content');end+=suffix.length;break;}
  if(end!==undefined){out+=svg.slice(open,end);position=end;continue;}
  // Declarations, including quoted/internal-subset DOCTYPE contents, are never rewritten.
  if(svg.startsWith('<!',open)){let quote=null,depth=0,i=open+2;for(;i<svg.length;i++){const c=svg[i];if(quote){if(c===quote)quote=null;}else if(c==='"'||c==="'")quote=c;else if(c==='[')depth++;else if(c===']')depth--;else if(c==='>'&&depth===0)break;}if(i===svg.length)throw Error('Unterminated XML declaration');out+=svg.slice(open,i+1);position=i+1;continue;}
  let i=open+1,closing=false;if(svg[i]==='/'){closing=true;i++;}const name=/^[A-Za-z_][A-Za-z0-9_.:-]*/.exec(svg.slice(i));if(!name)throw Error('Invalid XML element start');i+=name[0].length;out+=svg.slice(open,i);
  while(i<svg.length){
   const start=i;while(/\s/.test(svg[i]||'')&&i<svg.length)i++;out+=svg.slice(start,i);
   if(svg[i]==='>'){out+='>';i++;break;}if(svg.startsWith('/>',i)&&!closing){out+='/>';i+=2;break;}
   if(closing)throw Error('Closing XML element has attributes');
   const attr=/^[A-Za-z_][A-Za-z0-9_.:-]*/.exec(svg.slice(i));if(!attr||i===start)throw Error('Invalid XML attribute boundary');const a=i;i+=attr[0].length;while(/\s/.test(svg[i]||'')&&i<svg.length)i++;if(svg[i++]!=='=')throw Error('Invalid XML attribute assignment');while(/\s/.test(svg[i]||'')&&i<svg.length)i++;const quote=svg[i++];if(quote!=='"'&&quote!=="'")throw Error('Unquoted XML attribute');const begin=i,finish=svg.indexOf(quote,i);if(finish<0)throw Error('Unterminated XML attribute');let value=svg.slice(begin,finish);if(value.includes('<'))throw Error('Invalid raw angle bracket in XML attribute');if(identifierAttributes.has(attr[0]))value=value.replace(/science-diagram-\d+-\d+-(?:\d+|ID)(?=[^A-Za-z0-9_]|$)/g,'science-diagram-ID');out+=svg.slice(a,begin)+value+quote;i=finish+1;
  }
  if(i>=svg.length&&svg[i-1]!=='>')throw Error('Unterminated XML tag');position=i;
 }
 return out;
}
