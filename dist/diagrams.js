/* Hand-drawn procedural SVGs. Source: approved 30-day activity cards.
   All amounts are illustrative measuring labels, never fabricated observations. */
const C = {ink:'#18383A',teal:'#176F6B',mint:'#BDE0D2',coral:'#E98670',water:'#A9D8E3',paper:'#FFFDF6',cream:'#FAF4E8',yellow:'#EECB79',muted:'#6A7D78',purple:'#8668A7'};
const esc = v => String(v).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
const txt = (x,y,t,size=18,fill=C.ink,anchor='middle',weight=600) => `<text x="${x}" y="${y}" font-size="${size}" fill="${fill===C.coral?'#A74A36':fill}" text-anchor="${anchor}" font-weight="${weight}">${esc(t)}</text>`;
const rect = (x,y,w,h,fill=C.paper,r=10,stroke=C.ink,sw=2) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"/>`;
const circle = (x,y,r,fill=C.paper,stroke=C.ink,sw=2) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"/>`;
const ellipse = (x,y,rx,ry,fill=C.paper,stroke=C.ink,sw=2) => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"/>`;
const line = (x1,y1,x2,y2,color=C.ink,width=3,dash='') => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="${width}" stroke-linecap="round"${dash?` stroke-dasharray="${dash}"`:''}/>`;
const path = (d,fill='none',stroke=C.ink,sw=3,extra='') => `<path d="${d}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round" ${extra}/>`;
const poly = (points,fill=C.paper,stroke=C.ink,sw=2) => `<polygon points="${points}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}" stroke-linejoin="round"/>`;
function arrow(x1,y1,x2,y2,color=C.coral,width=3){ const a=Math.atan2(y2-y1,x2-x1),l=9;return line(x1,y1,x2,y2,color,width)+poly(`${x2},${y2} ${x2-l*Math.cos(a-.5)},${y2-l*Math.sin(a-.5)} ${x2-l*Math.cos(a+.5)},${y2-l*Math.sin(a+.5)}`,color,color,1); }
function badge(x,y,t,color=C.teal){if(color===C.coral)color='#A74A36';const w=String(t).length*18+24;return rect(x-w/2,y-20,w,30,color,15,color,0)+txt(x,y+2,t,18,'#fff');}
function cup(x,y,w,h,{liquid=C.water,level=.5,label='',sub=''}={}) {let z='';if(level>0){const top=y+h*(1-level);z+=poly(`${x+5},${top} ${x+w-5},${top} ${x+w-16},${y+h-5} ${x+16},${y+h-5}`,liquid,'none',0)+line(x+6,top,x+w-6,top,liquid,3);} z+=path(`M${x} ${y} L${x+12} ${y+h} Q${x+w/2} ${y+h+8} ${x+w-12} ${y+h} L${x+w} ${y}`,'none',C.ink,3)+ellipse(x+w/2,y,w/2,5,'none',C.muted,1.5);if(label) z+=txt(x+w/2,y+h+25,label,22);if(sub)z+=txt(x+w/2,y+h+47,sub,18,C.muted);return z;}
const spoon=(x,y,angle=0,color=C.ink)=>`<g transform="translate(${x} ${y}) rotate(${angle})">${line(0,0,0,48,color,5)}${ellipse(0,55,10,15,C.paper,color,2)}</g>`;
const leaf=(x,y,scale=1,rotation=0,color=C.teal)=>`<g transform="translate(${x} ${y}) rotate(${rotation}) scale(${scale})">${path('M0 0 Q-35 -25 0 -65 Q35 -25 0 0',color,C.ink,2)}${line(0,0,0,-51,C.paper,2)}${line(0,-25,-13,-36,C.paper,1)}${line(0,-35,12,-46,C.paper,1)}</g>`;
function drops(x,y,n=4,color=C.water){return Array.from({length:n},(_,i)=>{const dx=x+(i%4)*18,dy=y+Math.floor(i/4)*22;return path(`M${dx} ${dy} q-8 10 0 12 q8 -2 0 -12`,color,C.teal,1);}).join('');}
function grains(x,y,n=8,color=C.paper){return Array.from({length:n},(_,i)=>circle(x+(i%6)*8,y+Math.floor(i/6)*7,2.5,color,C.muted,.6)).join('');}
function book(x,y,w,h,color=C.teal){return rect(x,y,w,h,color,3,C.ink,2)+line(x+7,y+h*.5,x+w-8,y+h*.5,C.paper,2);}
function dim(x1,y1,x2,y2,t){return line(x1,y1,x2,y2,C.muted,1.5)+line(x1,y1-5,x1,y1+5,C.muted,1.5)+line(x2,y2-5,x2,y2+5,C.muted,1.5)+txt((x1+x2)/2,(y1+y2)/2-9,t,18,C.muted);}
const tray=(x=52,y=264,w=536)=>path(`M${x} ${y} l12 14 h${w-24} l12 -14`,'none',C.muted,2);
const clock=(x,y,label)=>circle(x,y,21,C.paper,C.teal,2)+line(x,y,x,y-12,C.teal,2)+line(x,y,x+9,y+5,C.teal,2)+txt(x,y+41,label,14,C.muted);
const eye=(x,y)=>path(`M${x-20} ${y} Q${x} ${y-21} ${x+20} ${y} Q${x} ${y+21} ${x-20} ${y}`,C.paper,C.ink,2)+circle(x,y,6,C.teal,C.teal,1);
const checkSheet=(x,y,rows)=>{let z=rect(x,y,130,116,C.paper,8,C.muted,1.5);rows.forEach((t,i)=>{z+=txt(x+10,y+25+i*30,t,14,C.ink,'start')+line(x+92,y+23+i*30,x+114,y+23+i*30,C.muted,1,'3 3');});return z;};
function renderEarly(day,s,young,advanced) {
  let a='',label='',note='图中变化仅为示意，以实际观察为准。';
  const coin=(x,y)=>ellipse(x,y,13,5,C.yellow,C.ink,1.5);
  const stack=(x,y)=>book(x,y,128,24,C.teal)+book(x-5,y+25,138,24,C.mint)+book(x+3,y+50,125,24,C.coral);
  const bowl=(x,y,w=150)=>ellipse(x+w/2,y,w/2,17,C.paper,C.ink,2)+path(`M${x} ${y} Q${x+20} ${y+70} ${x+w/2} ${y+68} Q${x+w-20} ${y+70} ${x+w} ${y}`,C.paper,C.ink,2);
  const sprout=(x,y,root=false)=>ellipse(x,y,8,11,C.mint,C.teal,1.5)+(root?path(`M${x} ${y+8} q-2 15 8 21 q5 6 2 11`,'none',C.teal,2):'');
  if(day===1){
    a=tray(55,265,530)+stack(90,190)+stack(420,190);
    if(s===0){a+=dim(220,174,420,174,'15厘米')+poly('120,92 240,92 265,132 145,132',C.paper)+poly('380,98 395,83 410,98 425,83 440,98 455,83 470,98 485,83 500,98 500,125 380,125',C.paper)+txt(190,155,'平纸',22)+txt(442,155,'风琴折纸',22);label='先摆书堆，再猜哪种桥更稳';note='书堆低矮稳定；两张同规格A4纸。';}
    if(s===1){a+=line(180,180,460,180,C.paper,13)+line(180,180,460,180,C.ink,2)+path('M155 132 l17 -16 17 16 17 -16 17 16 17 -16 17 16 17 -16 17 16 17 -16 17 16 17 -16 17 16',C.paper,C.ink,2)+txt(320,104,'褶宽约2厘米',22);label='平纸铺平；另一张折成风琴褶';note='折痕平行纸的长边，两端搭接长度相同。';}
    if(s===2){a+=path('M180 179 Q320 230 460 179','none',C.ink,4)+coin(320,200)+coin(320,193)+arrow(320,115,320,162)+badge(470,113,'成人放硬币')+txt(320,249,'明显下垂就停',22,C.coral);label='同一位置，一枚一枚轻放';note='先测平纸再测折纸；接触托盘也要立即停止。';}
    if(s===3){a=rect(65,100,510,184,C.paper,16,C.mint,2)+txt(200,135,'平纸',24)+txt(440,135,'折纸',24)+line(320,110,320,268,C.mint,2)+path('M110 180 Q200 224 290 180','none',C.ink,4)+path('M355 181 l17 -14 17 14 17 -14 17 14 17 -14 17 14 17 -14 17 14 17 -14','none',C.ink,3)+txt(200,255,'停止前：___ 枚',21)+txt(440,255,'停止前：___ 枚',21);label=young?'画一画：弯了，还是没弯？':'记录枚数，也记录桥的形状';note='不要压住桥头；空格由你的真实结果填写。';}
  }
  if(day===2){
    a=tray(52,290,536)+cup(120,125,130,116,{label:'搅拌',sub:'100毫升'})+cup(390,125,130,116,{label:'不搅拌',sub:'100毫升'});
    if(s===0){a+=txt(320,100,'同温的水',24);label='两杯水一样多，一杯搅、一杯不搅';note='每杯100毫升；放在同一托盘中。';}
    if(s===1){a+=spoon(171,84,-35)+spoon(441,84,-35)+grains(174,195,12)+grains(444,195,12)+txt(320,103,'各1平茶匙糖',22)+arrow(212,128,212,170)+arrow(482,128,482,170);label='尽量同时加糖，开始计时';note='同袋白砂糖；量匙约5毫升，粉末用平匙。';}
    if(s===2){a+=spoon(186,126,-13)+path('M160 162 q-20 -25 18 -28 q38 0 28 20','none',C.coral,3)+arrow(207,152,197,161)+grains(160,222,4)+grains(430,222,15)+txt(182,100,'约1圈/秒',22)+txt(454,100,'保持静止',22);label='轻轻搅，每30秒看看杯底';note='最多观察3分钟，不尝糖水。';}
    if(s===3){a=rect(90,110,460,170,C.paper,14,C.mint,2)+txt(190,145,'搅拌',23)+txt(437,145,'不搅拌',23)+txt(190,194,'___ 秒',25)+txt(437,194,'___ 秒',25)+line(320,126,320,224,C.mint,2)+txt(320,256,'还有糖粒？记“超过3分钟”',22);label='记录糖粒看不见的时间';note='不补编时间；“看不见”不表示糖不存在。';}
  }
  if(day===3){
    const plant=(wet=false)=>poly('112,227 228,227 214,276 126,276',C.coral)+line(170,226,170,149,C.teal,5)+leaf(171,201,.9,-39)+leaf(173,187,.9,37)+leaf(171,178,.9,0)+(wet?drops(127,116,6):'');
    const bag=(x)=>path(`M${x} 111 Q${x+58} 88 ${x+116} 111 L${x+109} 215 Q${x+58} 232 ${x+7} 215 Z`,'#E9F2ED88',C.muted,2);
    if(s===0){a=plant()+eye(378,151)+arrow(347,155,230,179)+txt(419,207,'叶面干燥',25)+txt(419,240,'不摘叶',23);label='先看叶片：干燥、完整、不摘下';note='成人确认植物无毒，盆土并非刚浇湿。';}
    if(s===1){a=plant()+bag(111)+bag(401)+line(135,219,204,219,C.coral,3)+line(426,219,492,219,C.coral,3)+txt(170,100,'叶片袋',23)+txt(458,260,'空袋参照',23)+badge(453,101,'成人系袋');label='罩住叶片，另准备一只空袋';note='袋口轻系，不勒茎；袋子始终远离脸部。';}
    if(s===2){a=plant()+bag(111)+bag(401)+txt(460,262,'相近空气量',21)+rect(270,105,92,72,C.yellow,12,'none',0)+line(287,128,343,128,C.paper,4)+line(287,150,329,150,C.paper,4)+txt(320,204,'同一明亮处',22)+txt(320,236,'无烈日',22);label='两袋放同一处，画下开始的样子';note='远离热源，袋内过热或叶片萎蔫立即结束。';}
    if(s===3){a=plant(true)+bag(111)+bag(401)+drops(429,166,2)+clock(321,144,'1小时 / 3小时')+txt(459,260,'空袋也可能有水滴',18)+badge(320,259,'观察后取袋');label='比较袋内水滴，然后由成人取下';note='水滴多少可能不同；不能说每一滴都来自叶子。';}
  }
  if(day===4){
    const heli=(x,y,ang=0)=>`<g transform="translate(${x} ${y}) rotate(${ang})">${poly('-5,0 -80,-30 -75,-55 4,-18',C.mint)}${poly('5,0 80,-30 75,-55 -4,-18',C.coral)}${rect(-10,-5,20,80,C.paper,2,C.ink,2)}${rect(-10,58,20,18,C.yellow,1,C.ink,2)}</g>`;
    if(s===0){a=rect(180,92,100,192,C.paper,1,C.ink,2)+line(230,92,230,152,C.coral,3,'6 5')+dim(180,81,280,81,'4厘米')+dim(305,92,305,284,'16厘米')+txt(430,139,'中线剪5厘米',23)+badge(430,194,'成人协助剪');label='剪纸条，再从短边中点剪开';note='约4×16厘米；不用回形针。';}
    if(s===1){a=heli(320,171)+arrow(229,123,214,89)+arrow(411,122,427,157)+txt(161,195,'向前折',23)+txt(483,195,'向后折',23)+arrow(355,245,355,222)+txt(473,259,'底端折2厘米',22);label='两片反向折，底端向上折';note='叶片近似直角；下方纸条沿长向折窄。';}
    if(s===2){a=heli(300,147,12)+arrow(303,224,303,270)+path('M247 190 C221 146 380 146 366 192','none',C.teal,3)+arrow(366,192,350,203)+line(90,282,550,282,C.muted,2)+txt(479,126,'肩高松手',23)+txt(479,162,'不向下推',23)+txt(150,250,'站在地面',21);label='轻轻放手，看看转不转';note='平地无风，不登椅、不靠窗、不朝脸释放。';}
    if(s===3){a=heli(190,160)+heli(444,160,0)+line(111,100,265,100,C.muted,1,'5 5')+path('M363 141 l79 -5 75 5','none',C.coral,5)+txt(190,273,'原折角 × 3次',22)+txt(444,273,'较小折角 × 3次',22);label='再做一架，只改变叶片折角';note=advanced?'保持同样大小、同样释放高度，再比较。':'观察两种折角的下降，不预先指定赢家。';}
  }
  if(day===5){
    const three=(colored)=>cup(83,134,120,112,{liquid:colored?C.purple:C.water,level:.62,label:'清水'})+cup(260,134,120,112,{liquid:colored?'#D99DAE':C.water,level:.62,label:'白醋'})+cup(437,134,120,112,{liquid:colored?'#8BBDB2':C.water,level:.62,label:'小苏打水'});
    if(s===0){a=bowl(83,175,170)+leaf(156,181,.72,-30,C.purple)+leaf(187,181,.75,40,C.purple)+arrow(280,199,344,199)+cup(397,143,125,102,{liquid:C.purple,level:.6,label:'完全冷却'})+txt(166,122,'约100毫升热水',22)+txt(166,153,'浸泡10分钟',22)+badge(459,101,'仅成人制备');label='成人浸泡、过滤，完全冷却再用';note='儿童只接触冷却后的甘蓝液。';}
    if(s===1){a=three(false)+txt(320,109,'三杯各10毫升',24)+badge(320,293,'先配小苏打水');label='清水、白醋、小苏打水分开装';note='小苏打水：1/4平茶匙小苏打＋50毫升水。';}
    if(s===2){a=three(true)+[143,320,497].map(x=>arrow(x,99,x,147)+txt(x,88,'＋10毫升',19,C.purple)).join('');label='每杯各加10毫升冷却甘蓝液';note='轻轻晃匀；清水杯作参照。';}
    if(s===3){a=rect(51,87,538,209,'#fff',8,'#E7E2D8',1)+three(true)+txt(320,110,'白纸背景',22)+[143,320,497].map((x,i)=>rect(x-28,283,56,12,[C.purple,'#D99DAE','#8BBDB2'][i],3,'none',0)).join('');label=young?'找颜色：相同，还是不同？':'画下三杯颜色，不由颜色猜精确pH';note='可能呈紫、粉红、蓝绿；实际颜色可能不同。';}
  }
  if(day===6){
    const boxes=(root=false)=>rect(69,130,213,134,C.paper,16,C.teal,2)+rect(358,130,213,134,C.paper,16,C.teal,2)+rect(81,142,189,109,s? '#E1F1EE':C.paper,10,'#DDD9CA',1)+rect(370,142,189,109,C.cream,10,'#DDD9CA',1)+Array.from({length:6},(_,i)=>sprout(119+(i%3)*55,170+Math.floor(i/3)*51,root&&i<4)+sprout(408+(i%3)*55,170+Math.floor(i/3)*51,false)).join('');
    a=boxes(s===3)+txt(175,289,'湿纸 · 6颗',23)+txt(464,289,'干纸 · 6颗',23);
    if(s===0){a+=txt(320,103,'每盒相同厨房纸：2层',22);label='12颗绿豆随机分两组，各6颗';note='成人拿种子；低龄只看、不接触散豆。';}
    if(s===1){a+=drops(137,99,3)+txt(186,102,'约2茶匙水',21)+txt(465,102,'不加水',23);label='湿纸湿润不积水，干纸不加水';note='种子分开放；盒子不盖紧。';}
    if(s===2){a+=txt(320,97,'同一室温、无烈日处',23)+badge(175,121,'湿纸干了再补水');label='每天同一时间看，干纸始终干燥';note='出现霉斑、异味或黏滑，成人装袋丢弃。';}
    if(s===3){a+=txt(320,103,'连续记录3–5天',23)+arrow(286,210,223,203);label='看到小根才算萌发，数出实际颗数';note='根的数量只是示意；不把实验豆芽当食物。';}
  }
  if(day===7){
    a=ellipse(320,260,235,38,'#EAE8D8','none',0)+poly('307,250 314,244 509,210 495,224','#99B3AA','none',0)+rect(307,117,14,133,C.teal,3,C.ink,2)+circle(314,251,6,C.coral,C.coral,1);
    if(s===0){a+=txt(150,129,'固定柱子',24)+arrow(194,146,298,181)+txt(465,111,'安全平坦处',23);label='找固定物体的清晰影子';note='不看太阳，不进入道路，不攀高。';}
    if(s>=1){a+=circle(500,218,7,C.coral,C.paper,1)+dim(326,274,500,241,'量影长')+txt(483,192,'时刻①',22);}
    if(s===1){a+=arrow(362,237,470,217);label='标底部、标尖端，写时间、量影长';note='同时画出方向箭头。';}
    if(s>=2){a+=poly('309,251 321,252 455,281 443,291','#B8CBC3','none',0)+circle(450,285,6,C.teal,C.paper,1)+line(314,251,450,285,C.teal,2,'5 4')+txt(505,290,'时刻②',20,C.teal);}
    if(s===2){a+=txt(450,111,'30–60分钟后',23);label='回到原处，标出新的影子尖端';note='使用同一个物体、同一个底部测量点。';}
    if(s===3){a+=txt(144,116,'长度变了吗？',23)+txt(144,151,'方向变了吗？',23);label='比较至少两次记录，不补画看不见的影子';note='云遮太阳时记“影子不清”；不推断全天趋势。';}
  }
  if(day===8){
    let level=s===0?.48:.68;
    a=tray()+cup(224,105,192,151,{level,liquid:C.water});
    if(s===0){a+=txt(320,208,'水 50毫升',25)+txt(493,145,'可加1滴色素',20);label='先加水，看清水面的位置';note='透明塑料杯放在托盘内。';}
    if(s===1||s===3){a+=poly('231,153 409,153 407,184 233,184',C.yellow,'none',0)+line(232,184,408,184,C.ink,1)+txt(320,176,'油 20毫升',23)+txt(320,222,'水 50毫升',23);}
    if(s===1){a+=arrow(452,98,403,142)+txt(521,93,'沿杯壁慢加',20);label='加入油，猜猜哪层在上';note='先画下层次，不入口。';}
    if(s===2){a+=spoon(317,91,-8)+Array.from({length:13},(_,i)=>circle(255+(i%5)*30,170+Math.floor(i/5)*27,5+(i%3)*2,C.yellow,'none',0)).join('')+path('M269 140 q-22 -24 45 -27 q67 3 52 26','none',C.coral,3)+arrow(366,139,354,149)+txt(503,187,'轻搅约10圈',23);label='轻轻搅拌，找分散的小液滴';note='不加盖、不密封摇晃。';}
    if(s===3){a+=clock(506,158,'静置5分钟');label='等一等，再画一次层次';note='油通常重新聚成上层；废油吸附后入垃圾。';}
  }
  if(day===9){
    const table=rect(68,171,295,30,'#D9C7AE',4,C.ink,2)+rect(96,201,20,85,'#D9C7AE',3,C.ink,2)+rect(320,201,20,85,'#D9C7AE',3,C.ink,2);
    if(s===0){a=table+book(124,126,174,36,C.teal)+rect(130,165,402,8,C.yellow,1,C.ink,2)+dim(363,230,532,230,'伸出12厘米')+badge(185,103,'成人压稳');label='成人用厚书和手，把尺子压稳';note='选无裂痕塑料尺，不用薄金属尺。';}
    if(s===1){a=table+book(124,126,174,36,C.teal)+path('M130 165 H362 Q450 165 531 180','none',C.yellow,9)+line(130,165,362,165,C.ink,2)+arrow(531,124,531,166)+path('M418 182 Q470 203 531 180','none',C.coral,2)+txt(476,108,'轻拨约1厘米',22);label='轻轻向下拨，再放开';note='脸远离尺端，不猛弹、不夹手。';}
    if(s===2){a=table+book(124,126,174,36,C.teal)+rect(130,165,302,8,C.yellow,1,C.ink,2)+line(363,214,480,214,C.teal,7)+line(363,260,439,260,C.coral,7)+txt(515,219,'8厘米',23)+txt(485,266,'5厘米',23);label='换成8厘米、5厘米，拨法不变';note='保持同一把尺、相同压法和相近轻拨幅度。';}
    if(s===3){a=rect(64,100,512,180,C.paper,14,C.mint,2)+txt(163,135,'12厘米',24)+txt(320,135,'8厘米',24)+txt(477,135,'5厘米',24)+path('M100 195 q30 -35 60 0 t60 0','none',C.teal,3)+path('M267 195 q13 -35 26 0 t26 0 t26 0 t26 0','none',C.teal,3)+path('M428 195 q7 -35 14 0 t14 0 t14 0 t14 0 t14 0 t14 0 t14 0','none',C.teal,3)+txt(320,256,'每种长度重复3次',23);label='听高低，不把“更响”当“更高”';note='波形只是快慢示意，不是测得的频谱。';}
  }
  if(day===10){
    const apple=(x,y,tone)=>path(`M${x-37} ${y-5} Q${x-47} ${y+33} ${x} ${y+45} Q${x+47} ${y+33} ${x+37} ${y-5} Q${x} ${y+13} ${x-37} ${y-5}`,tone,C.coral,4)+line(x,y+7,x,y+31,'#C7A77D',2)+ellipse(x-7,y+20,3,5,C.ink,'none',0)+ellipse(x+7,y+20,3,5,C.ink,'none',0);
    a=[135,320,505].map((x,i)=>ellipse(x,216,76,37,C.paper,C.muted,2)+apple(x,180,s>=2?['#CBB18D','#D2BE9B','#EEE2B6'][i]:'#EEE2B6')+txt(x,283,['原样','水','柠檬汁'][i],23)).join('');
    if(s===0){a+=txt(320,109,'同一苹果 · 3片相近大小',23)+badge(320,144,'成人切片');label='成人现切苹果，三盘先标好';note='切片厚薄相近；所有样品不入口。';}
    if(s===1){a+=txt(135,128,'不添加',22)+txt(320,107,'1/2茶匙',22)+txt(505,107,'1/2茶匙',22)+drops(300,126,2)+drops(485,126,2,C.yellow)+arrow(320,156,320,180)+arrow(505,156,505,180);label='水和柠檬汁各涂半茶匙，原样不加';note='只涂切面；液体量相同。';}
    if(s===2){a+=txt(320,107,'同一处、同样光线',24)+txt(320,145,'立刻 → 20分钟 → 60分钟',22);label='按三个时点拍照，不晒太阳';note='颜色变化仅示意；柠檬汁不保证每次都更有效。';}
    if(s===3){a+=txt(320,103,'用同一色阶评分：0–3',24)+[0,1,2,3].map(i=>rect(220+i*51,124,44,29,['#EEE2B6','#DDCCA8','#C5AD88','#A78465'][i],4,'none',0)+txt(242+i*51,173,i,18)).join('');label=young?'找找哪片颜色不一样':'比较柠檬汁与水，再看原样参照';note='记录实际颜色；结束后丢弃样品。';}
  }
  if(!a) return null;
  if(advanced&&[2,3,5,6,10].includes(day)&&s===0) a+=badge(520,81,'控制条件相同');
  return {art:a,label,note};
}
/* Experiment-specific vector scenes, approved days 11–20. All counts shown are setup quantities, never invented observations. */
function middleClock(x,y,caption){return circle(x,y,23,C.paper)+line(x,y,x,y-13,C.ink,3)+line(x,y,x+11,y+6,C.coral,3)+txt(x,y+43,caption,15);}
function middleBug(x,y,scale=1){return `<g transform="translate(${x} ${y}) scale(${scale})">`+ellipse(0,0,8,13,C.coral)+circle(0,-15,5,C.ink)+line(-6,-6,-16,-12)+line(-7,0,-18,0)+line(-6,7,-15,14)+line(6,-6,16,-12)+line(7,0,18,0)+line(6,7,15,14)+line(0,-10,0,12,C.ink,1.5)+`</g>`;}
function middleGrass(x,y,scale=1){return `<g transform="translate(${x} ${y}) scale(${scale})">`+path('M0 14 Q-7 -13 -16 -15 M0 14 Q-2 -16 7 -27 M0 14 Q12 -12 22 -8','none',C.teal,3)+`</g>`;}
function middleRuler(x,y,w=260){let a=rect(x,y,w,28,C.yellow,4);for(let i=1;i<w/12;i++)a+=line(x+i*12,y,x+i*12,y+(i%5===0?15:8),C.ink,1.4);return a;}
function middleFoil(x,y,w,h=45,coins=0){let a=poly(`${x},${y} ${x+w},${y} ${x+w-18},${y+h} ${x+18},${y+h}`, '#DCE3DF')+ellipse(x+w/2,y,w/2,10,'#EEF2EF');for(let i=0;i<coins;i++)a+=ellipse(x+27+i*(w-54)/Math.max(1,coins-1),y+9,9,4,C.yellow);return a;}
function middleShell(x,y,scale=1){return `<g transform="translate(${x} ${y}) scale(${scale})">`+path('M-23 -10 L-12 -15 L-4 -9 L7 -15 L20 -8 Q26 9 14 18 Q-8 27 -24 9 Z','#F5DEBA',C.ink,2)+path('M-19 -3 Q2 11 20 -2','none','#B79F7D',1.5)+`</g>`;}
function middleBubbles(x,y,n=7){let a='';for(let i=0;i<n;i++)a+=circle(x+((i*17)%43)-21,y-((i*23)%66),3+(i%3),C.paper,C.teal,1.6);return a;}
function middlePhoto(x,y,id,type=0,small=false){const w=small?56:76,h=small?67:87;let a=rect(x,y,w,h,C.paper,7,'#D5DDD5',1.4); const sc=small?.55:.8; if(type===1)a+=`<g transform="translate(${x+w/2} ${y+h/2-2}) scale(${sc})">`+path('M0 -28 L8 -20 L5 -15 L14 -9 L9 -3 L18 5 L10 10 L11 18 L0 31 L-9 18 L-16 10 L-9 5 L-17 -3 L-9 -9 L-12 -16 L-5 -20 Z',C.teal)+line(0,-23,0,29,C.paper,1.5)+`</g>`; else if(type===2)a+=`<g transform="translate(${x+w/2} ${y+h/2-2}) scale(${sc})">`+path('M0 -32 Q16 4 0 30 Q-16 4 0 -32Z',C.mint)+line(0,-25,0,29,C.ink,1.2)+`</g>`; else a+=leaf(x+w/2,y+h-23,sc,0,C.teal);a+=txt(x+w/2,y+h-8,String(id),13);return a;}
function renderMiddle(day,s,young,advanced){
 let art='',label='',note='';
 switch(day){
 case 11:{
  const qx=s===3?55:68,qy=102,qw=s===3?260:330,qh=158;
  art+=rect(qx,qy,qw,qh,'#E2E9CF',5,C.teal,3);
  [[.15,.26],[.65,.25],[.45,.7],[.85,.7],[.1,.78]].forEach(([a,b])=>art+=middleGrass(qx+qw*a,qy+qh*b,.8));
  art+=leaf(qx+qw*.38,qy+qh*.35,.65,-25,C.mint)+middleBug(qx+qw*.7,qy+qh*.65,.65);
  if(s===0){art+=dim(qx,qy-12,qx+qw,qy-12,'约1米')+dim(qx+qw+20,qy,qx+qw+20,qy+qh,'1米')+txt(505,131,'草地边缘',22)+txt(505,165,'站在区外看',20)+badge(505,217,'成人选安全地点',C.teal);label='围出一平方米，留下原来的样子';note='不翻石、不挖土、不触碰生物';}
  if(s===1){art+=middleClock(502,132,'先远看1分钟')+rect(442,194,124,67,C.paper,7)+txt(504,217,'我看见：',16)+line(460,237,550,237,C.muted,1.5)+line(460,250,550,250,C.muted,1.5);label=young?'先静静看，找一找生命':'先看1分钟，记下明显的发现';note='只记录真正看见的，不猜物种名称';}
  if(s===2){art+=circle(qx+qw*.7,qy+qh*.65,26,'none',C.coral,3)+line(qx+qw*.7+22,qy+qh*.65+20,423,243,C.coral,3)+middleClock(515,124,'再静看4分钟')+txt(512,220,'未知小虫 A',22)+txt(512,249,'这样记也可以',15,C.muted);label='再看4分钟，把新发现画下来';note='不确定名称，就描述颜色、大小和动作';}
  if(s===3){art+=rect(355,101,238,148,C.paper,10)+txt(414,128,'前1分钟',20)+txt(529,128,'共5分钟',20)+line(474,113,474,233,C.muted,1.5)+line(368,141,579,141,C.muted,1.5)+txt(416,177,'自己填',20,C.teal)+txt(531,177,'自己填',20,C.teal)+txt(476,215,'比较这次的发现',16)+arrow(195,272,297,272)+txt(439,277,'收走标记 · 保持原样',16,C.teal);label='比较两次记录，再收好绳子';note=advanced?'一次观察不是完整物种清单':'发现多少，都如实记录';}
  break;
 }
 case 12:{
  if(s===0){art+=rect(219,94,70,164,C.paper,0)+line(219,236,289,236,C.muted,2)+circle(254,236,5,C.ink)+dim(179,94,179,258,'12厘米')+dim(219,275,289,275,'2厘米')+txt(391,155,'小黑点在线上',22)+arrow(369,170,270,230)+txt(399,215,'距底1.5厘米',20)+badge(468,259,'成人协助剪裁');label='画铅笔线，点一个黑点并晾干';note='只用可洗水性笔，不用酒精或其他溶剂';}
  else if(s===1){art+=cup(174,132,169,127,{liquid:C.water,level:.13,label:'水深约0.5厘米'})+rect(238,96,45,154,C.paper,0)+line(238,229,283,229,C.muted,1.7)+circle(260,229,4.5,C.ink)+line(159,98,358,98,C.yellow,8)+rect(250,91,20,20,'#E7D0A2',2,'none',0)+line(184,243,334,243,C.teal,2)+txt(465,135,'墨点在水面上',22)+arrow(431,149,285,227)+txt(462,217,'纸底碰到水',20)+arrow(432,224,285,247);label='纸底入水，墨点一定高于水面';note='固定纸条上端，墨点不要泡进水里';}
  else if(s===2){art+=cup(140,139,172,119,{liquid:C.water,level:.13,label:'观察水向上走'})+rect(203,96,45,153,C.paper,0)+rect(204,123,43,124,'#D9EAF0',0,'none',0)+line(203,123,248,123,C.teal,2,'5 4')+line(203,229,248,229,C.muted,1.5)+rect(206,157,39,11,C.purple,2,'none',0)+rect(206,182,39,8,C.coral,2,'none',0)+rect(206,207,39,7,C.yellow,2,'none',0)+arrow(275,214,275,137,C.teal)+txt(452,127,'水接近纸顶时',22)+txt(452,155,'取出，马上标记',22)+arrow(414,160,252,124)+txt(450,213,'水前沿 ≠ 色带',20,C.muted);label='水前沿接近顶端，就取出并标记';note='图中色带只是示意，实际可能没有分色';}
  else{art+=rect(207,96,62,162,C.paper,0)+line(207,113,269,113,C.teal,2,'5 4')+line(207,238,269,238,C.muted,1.5)+rect(210,137,56,14,C.purple,2,'none',0)+rect(210,177,56,11,C.coral,2,'none',0)+rect(210,212,56,9,C.yellow,2,'none',0)+txt(431,120,'晾干后记录',21)+txt(431,158,'色带颜色：____',20)+txt(431,191,'没有分色也记下',20)+txt(431,244,advanced?'可量色带与水前沿的距离':'找到几种颜色？',20,C.teal);if(advanced)art+=dim(183,238,183,113,'水前沿距离');label=young?'把看到的颜色画下来':'晾干看色带，按真实结果记录';note='不是每一支黑色水性笔都会分出多种颜色';}
  break;
 }
 case 13:{
  if(s===0){art+=rect(59,116,87,87,'#EDF1ED',0)+rect(47,128,87,87,'#DCE3DF',0)+line(47,128,134,215,C.muted,1)+line(134,128,47,215,C.muted,1)+txt(91,241,'15×15厘米',16)+arrow(154,169,215,169)+middleFoil(240,163,148,44)+middleFoil(446,163,86,44)+txt(315,237,'宽底船',22)+txt(490,237,'窄底船',22)+txt(388,107,'两张相同面积的铝箔',22);label='同样大小的铝箔，折成宽船和窄船';note='船高不超过2厘米；成人协助把边缘压圆';}
  else{art+=rect(59,143,520,118,'#E4EEF0',22,C.teal,3)+rect(69,177,500,73,C.water,15,'none',0)+line(72,177,565,177,C.teal,2)+middleFoil(118,161+(s===2?12:0),165,40,s>=2?3:0)+middleFoil(386,161+(s===2?12:0),99,40,s>=2?2:0)+txt(201,283,'宽底船',20)+txt(439,283,'窄底船',20);
   if(s===1){art+=txt(320,104,'空船先试：有没有漏水？',22)+dim(594,177,594,249,'约3厘米');label='轻放空船，先检查漏水';note='漏水就换同面积新铝箔重做，并记下原因';}
   if(s===2){art+=ellipse(201,109,12,5,C.yellow)+arrow(201,119,201,151)+badge(432,104,'硬币只由成人拿',C.coral)+txt(323,236,'船底不能碰盆底',20,C.teal);label='成人逐枚均匀放硬币，看到越水就停';note='记录越水前一枚的数量；触底这一轮无效';}
   if(s===3){art+=txt(320,106,'尺寸 · 水线 · 承重',22)+line(78,177,561,177,C.coral,2,'6 5')+txt(201,235,'承重：__枚',16)+txt(439,235,'承重：__枚',16);label='看尺寸、水线与枚数，不只选赢家';note=advanced?'硬币图仅示意，不代表实验结果；可做3次独立重复':'自己观察、自己数，图中硬币不是标准答案';}
  }
  break;
 }
 case 14:{
  art+=rect(79,249,482,23,'#E2DFCF',9,C.muted,1.5)+cup(125,121,139,125,{liquid:C.water,level:.24,label:'清水 20毫升'})+cup(375,121,139,125,{liquid:'#E7E9B7',level:.24,label:'白醋 20毫升'});
  if(s===0){art+=txt(320,99,'两个敞口杯 · 每杯容量≥200毫升',20)+txt(196,188,'?',28,C.teal)+txt(446,188,'?',28,C.teal);label='标好水和醋，先猜哪杯会冒泡';note='全程敞口，绝不加盖、封瓶或套气球';}
  if(s===1){art+=spoon(174,94,-20)+spoon(424,94,-20)+grains(194,126,5,C.paper)+grains(444,126,5,C.paper)+arrow(194,113,194,160)+arrow(444,113,444,160)+txt(319,109,'各1/4平茶匙',20)+badge(320,184,'成人帮助少量慢加',C.coral);label='成人量取小苏打，两杯各加一份';note='不摇晃、不靠近闻、不入口';}
  if(s===2){art+=middleBubbles(445,217,11)+circle(197,222,4,C.paper,C.teal,1.5)+txt(320,98,'刚加入 → 1分钟',21)+arrow(448,175,448,137,C.coral)+txt(320,183,'隔远观察',20);label='比较刚加入和1分钟后的气泡';note='气泡多少按实际记录；图示不是保证结果';}
  if(s===3){art+=txt(196,163,'持续冒泡？',20)+txt(196,189,'自己记',16,C.teal)+txt(446,163,'持续冒泡？',20)+txt(446,189,'自己记',16,C.teal)+badge(320,100,'结束后由成人清理',C.coral);label='记下两杯的现象，留在托盘等清理';note=advanced?'不要只凭泡沫高度比较总产气量':'水杯短暂的小泡，也可能只是空气';}
  break;
 }
 case 15:{
  const types=[0,1,2,1,0,2];
  if(s===0){types.forEach((t,i)=>art+=middlePhoto(65+i*84,122,i+1,t));art+=txt(320,101,'6–8张叶片照片，每张编上号',22)+txt(320,252,'看形状、边缘、叶脉',21,C.teal);label='先给叶片编号，描述你看见的特征';note='可以只用照片；不触碰不明植物、不采食';}
  if(s===1){art+=rect(42,117,208,156,'#E3EEE0',12,C.teal,2)+rect(268,117,208,156,'#F3E3D8',12,C.coral,2)+rect(493,117,107,156,C.paper,12,C.muted,2)+txt(145,103,'边缘平滑',22)+txt(372,103,'明显锯齿',22)+txt(547,103,'待定',22);[0,2,4,5].forEach((i,j)=>art+=middlePhoto(62+(j%2)*86,131+Math.floor(j/2)*68,i+1,types[i],true));[1,3].forEach((i,j)=>art+=middlePhoto(300+j*86,152,i+1,types[i],true));art+=txt(547,193,'?',32,C.muted);label=young?'按一个特征，把叶片放在一起':'用边缘平滑或锯齿分组，保留待定';note='待定不是做错；规则要让别人看得懂';}
  if(s===2){art+=rect(75,119,220,151,'#E3EEE0',12,C.teal,2)+rect(323,119,244,151,'#F3E3D8',12,C.coral,2)+txt(185,104,'细长',21)+txt(445,104,'不细长',21);[2,5].forEach((i,j)=>art+=middlePhoto(113+j*84,151,i+1,types[i],true));[0,1,3,4].forEach((i,j)=>art+=middlePhoto(330+j*58,151,i+1,types[i],true));art+=arrow(292,194,319,194,C.coral);label='换成细长／不细长，再分一次';note='同一批叶片，换规则后伙伴可能不同';}
  if(s===3){art+=rect(255,89,130,35,C.mint,8)+txt(320,113,'全部叶片',20)+line(320,124,320,142)+line(176,142,465,142)+line(176,142,176,158)+line(465,142,465,158)+rect(105,158,144,35,C.paper,8)+rect(393,158,144,35,C.paper,8)+txt(177,181,'边缘平滑',20)+txt(465,181,'明显锯齿',20);[177,465].forEach(x=>{art+=line(x,194,x,211)+line(x-66,211,x+66,211)+line(x-66,211,x-66,229)+line(x+66,211,x+66,229)+txt(x-66,252,'细长',20)+txt(x+66,252,'不细长',20);});art+=txt(320,282,'请家人按规则试分；拿不准的单列待定',16,C.teal);label='画两级分组图，请家人试一试';note=advanced?'分类规则要可重复；外形分组不等于物种鉴定':'不能根据长相判断叶片能不能吃';}
  break;
 }
 case 16:{
  const ry=s===1?169:133;
  art+=rect(81,244,478,27,'#E7DDC9',10,C.muted,1.5)+middleRuler(183,ry,265);
  if(s===1){art+=poly('230,143 313,134 346,198 253,212',C.coral)+path('M249 158 L317 185 M247 173 L326 197','none','#BE695A',1.5)+arrow(239,116,410,116,C.coral)+txt(320,102,'沿同一方向，约20次',22)+txt(320,239,'用干布；别碰刚摩擦的部位',20);label='用干布沿同一方向摩擦尺子';note='远离插座、电子设备和易燃喷雾';}
  else{[0,1,2,3,4,5].forEach((i)=>{let x=150+i*62,y=230;if(s===2&&i%2===0)y=185+(i%3)*7;art+=`<g transform="rotate(${i*13-20} ${x} ${y})">`+rect(x,y,16,16,C.paper,1,C.muted,1)+`</g>`;if(s===2&&i%2===0)art+=arrow(x+8,223,x+8,y+20,C.teal,2);});
   if(s===0){art+=txt(320,101,'未摩擦：先试一次',23)+arrow(483,141,483,199)+txt(320,205,'靠近，但不压住纸',20);label='先用未摩擦的尺子靠近小纸片';note='每片约1厘米见方；纸片远离口鼻';}
   if(s===2){art+=txt(320,101,'摩擦后：从同样高度靠近',21)+line(170,189,472,189,C.muted,1.5,'5 5')+txt(503,225,'别碰纸',18,C.teal);if(advanced)art+=dim(518,161,518,225,'距离');label='不碰纸片，看看纸片会不会先动';note='示意图中的吸引并非每次都出现，按实测记录';}
   if(s===3){art+=middleClock(512,122,'放一会再试')+txt(318,103,'重复并记录',22)+txt(318,196,'纸动了吗？____',20)+txt(318,222,'空气潮湿吗？____',20);label='放置一会再试，没有变化也记下来';note='检查干湿与材料，不无限加力摩擦；尺子不是磁铁';}
  }
  break;
 }
 case 17:{
  if(s===0){art+=cup(136,123,151,134,{liquid:C.water,level:.45,label:'室温水20毫升'})+spoon(195,92,-15)+grains(207,149,7,C.paper)+grains(202,242,5,C.paper)+arrow(316,150,282,173)+txt(453,118,'每次1/2平茶匙盐',22)+txt(453,154,'加一次，搅一次',22)+txt(453,197,'约2平茶匙时',20)+txt(453,223,'可能还有盐粒不溶',20);label='盐分次加，每次都搅拌并记下用量';note='盐水和盐粒都不入口';}
  if(s===1){art+=cup(79,127,128,127,{liquid:C.water,level:.46,label:'先静置5分钟'})+grains(130,239,7,C.paper)+arrow(224,168,343,202,C.teal,4)+ellipse(440,235,112,25,C.paper)+ellipse(440,232,95,17,C.water)+txt(440,284,'上层清液约10毫升',20)+txt(449,137,'轻倒清液',23)+txt(449,168,'不要带入杯底盐粒',20);label='静置后，把上层清液轻倒进小碟';note='取约10毫升，杯底盐粒尽量留下';}
  if(s===2){art+=rect(80,251,474,18,'#D3C3A2',6,C.muted,1)+ellipse(315,228,111,26,C.paper)+ellipse(315,225,95,18,C.water)+arrow(260,184,260,136,C.teal)+arrow(317,181,317,131,C.teal)+arrow(375,184,375,136,C.teal)+badge(484,190,'不可食用',C.coral)+txt(319,106,'通风 · 不加热 · 不加盖',22)+txt(319,283,'放到儿童与宠物够不到的地方',16);label='拍起始水面，贴好不可食用标签';note='不放在食物旁，不用加热来催促';}
  if(s===3){art+=ellipse(198,207,114,30,C.paper)+ellipse(198,204,95,19,C.water)+txt(198,267,'起始',22)+arrow(330,203,383,203,C.teal)+ellipse(495,207,91,30,C.paper)+ellipse(495,205,66,12,'#E4E3D6');[[460,202],[487,207],[514,194],[525,216]].forEach(([x,y],i)=>art+=poly(`${x-6},${y-7} ${x+6},${y-6} ${x+9},${y+4} ${x-5},${y+7}`,C.paper,C.muted,1));art+=txt(495,267,'以后：画真实变化',16)+txt(320,106,'每天同一时刻记录 · 常需2–7天',22);label='每天看水面和晶体，仍湿就继续等';note='晶体仅是可能结果；一周仍湿也不是失败';}
  break;
 }
 case 18:{
  const box=(x,iced=false,droplets=false)=>{let z=rect(x,155,186,105,'#EEF4EF',10,C.teal,2)+rect(x+3,225,180,31,C.water,6,'none',0);if(s>0){z+=rect(x-4,145,194,8,'#DBE6E1',3,C.ink,2);if(iced){z+=path(`M${x+43} 140 L${x+37} 103 Q${x+89} 91 ${x+142} 102 L${x+137} 140Z`,'#D4E8EE',C.teal,2)+rect(x+55,109,26,23,'#F4FCFE',4,C.teal,1)+rect(x+97,105,27,25,'#F4FCFE',4,C.teal,1);}}if(droplets){[0,1,2,3,4].slice(0,iced?5:2).forEach(i=>z+=path(`M${x+30+i*30} 158 q-8 13 0 13 q8 0 0 -13`,C.water,C.teal,1));}return z;};
  art+=box(67,true,s>=2)+box(386,false,s>=2)+txt(160,283,'温水50毫升',20)+txt(479,283,'温水50毫升',20);
  if(s===0){art+=txt(320,103,'成人准备并确认：不超过40℃',21)+badge(320,194,'不用沸水',C.coral);label='成人准备温水，两盒各50毫升';note='儿童在成人确认温度后再参与';}
  if(s===1){art+=txt(160,93,'冰袋由成人放',20)+txt(479,113,'另一盖不放冰',20)+txt(320,225,'轻盖，不扣紧',20)+arrow(317,203,254,150,C.coral)+arrow(325,203,386,150,C.coral);label='两盒轻盖，一个盖上放少量冰';note='不密封、不加压；冰袋远离脸部';}
  if(s===2){art+=txt(320,92,'每隔3分钟看一次，约10分钟',22)+line(160,172,286,187,C.coral,2)+line(480,172,352,187,C.coral,2)+txt(320,210,'确认盖子内侧',20,C.teal);label='找盖子内侧的水滴，再比较两盒';note='图中滴数只是示意，实际多少自己观察';}
  if(s===3){art+=arrow(124,222,124,180,C.teal)+arrow(196,214,196,181,C.teal)+arrow(446,222,446,180,C.teal)+txt(416,101,'水面 → 空气 → 冷盖',20)+txt(321,197,'画路径',22,C.teal);label='画出水面、空气与冷盖之间的路径';note=advanced?'模型不是完整水循环；不能证明每滴都来自底部温水':'先确认水滴在哪一侧，再解释它从哪里来';}
  break;
 }
 case 19:{
  if(s===0){art+=rect(141,91,54,169,C.paper,0)+rect(233,91,54,169,C.paper,0)+line(141,247,195,247,C.muted,2)+line(233,247,287,247,C.muted,2)+dim(109,91,109,260,'15厘米')+txt(214,283,'两条同种纸 · 宽3厘米',20)+cup(416,139,126,117,{liquid:C.water,level:.16,label:'水深约1厘米'})+txt(433,110,'距纸底1厘米画线',20);label='裁两条相同纸，在底端上方画线';note='成人协助剪裁；食用色素1滴可省略';}
  else{art+=cup(112,147,167,111,{liquid:C.water,level:.18,label:'约0.5厘米浸水'})+rect(175,95,44,155,C.paper,0)+line(175,238,219,238,C.muted,1.5);if(s===1)art+=rect(403,95,44,155,C.paper,0)+line(403,238,447,238,C.muted,1.5)+txt(425,280,'干纸参照',20);
   if(s===1){art+=rect(176,239,42,10,C.water,0,'none',0)+line(152,95,240,95,C.yellow,7)+txt(425,121,'',20)+txt(425,180,'保持干燥',22)+txt(317,109,'固定纸顶',20)+arrow(294,116,229,98,C.coral);label='一条纸底碰水，另一条保持干燥';note='让纸顶固定好，不要整条掉进水里';}
   if(s>=2){art+=rect(176,137,42,112,'#D6E7E5',0,'none',0)+rect(176,167,42,82,C.water,0,'none',0)+line(175,137,219,137,C.teal,2,'4 3')+line(175,167,219,167,C.coral,2,'4 3');[226,197,174,153,137].forEach((y,i)=>{art+=line(218,y,235,y,C.muted,1.2);if(s===2)art+=txt(250,y+4,String(i+1),12,C.muted);});
    if(s===2){art+=txt(424,123,'每1分钟标一次',22)+txt(424,155,'共记录5分钟',22)+txt(425,204,'湿润前沿',16,C.teal)+txt(425,230,'与颜色前沿分开记',16,C.coral);label='每分钟标一次，找真正的干湿分界';note='颜色前沿不一定等于湿润前沿；高度仅示意';}
    if(s===3){art+=`<g transform="translate(320 132) rotate(90)">`+middleRuler(0,0,120)+`</g>`+dim(270,239,270,137,'上升高度')+txt(465,114,'从水面开始量',22)+txt(467,177,'1分  __厘米',16)+txt(467,205,'3分  __厘米',16)+txt(467,233,'5分  __厘米',16);label='量水面以上的高度，看看是否同速';note='记录实际数值；图上水位和前沿不按比例';}
   }
  }
  break;
 }
 case 20:{
  if(s===0){art+=rect(81,211,480,49,'#E6DECE',12,C.muted,1.5)+middleShell(206,176,1.35)+middleShell(423,176,1.35)+dim(170,244,238,244,'约2厘米')+dim(387,244,455,244,'约2厘米')+txt(320,105,'只用煮熟鸡蛋的蛋壳',24)+txt(320,135,'成人清洗、去内膜、移走尖碎屑',20)+badge(320,279,'两片大小接近的壳',C.coral);label='成人准备两片熟蛋壳，不用生蛋壳';note='蛋壳不是整颗鸡蛋；鸡蛋接触过敏者不做';}
  else{art+=rect(77,250,486,23,'#E6DECE',9,C.muted,1.5)+cup(123,129,146,118,{liquid:C.water,level:.44,label:'清水30毫升'})+cup(374,129,146,118,{liquid:'#E9E8BA',level:.44,label:'白醋30毫升'})+middleShell(196,222,.8)+middleShell(447,222,.8);
   if(s===1){art+=txt(320,96,'两杯始终敞口 · 成人放入蛋壳',22)+arrow(196,153,196,193)+arrow(447,153,447,193);label='成人把熟蛋壳放进水杯和醋杯';note='蛋壳浸在液体中，绝不封瓶、加盖';}
   if(s===2){art+=middleBubbles(447,215,9)+circle(190,214,3,C.paper,C.teal,1.5)+txt(320,96,'刚放入 → 5分钟 → 15分钟',22)+txt(320,178,'必要时观察至30分钟',16);label='隔杯看壳表面，比较新气泡有没有出现';note='气泡图只是可能现象；低龄只观察、不拿蛋壳';}
   if(s===3){art+=txt(196,165,'新气泡？',16)+txt(446,165,'新气泡？',16)+txt(196,187,'自己记录',15,C.teal)+txt(446,187,'自己记录',15,C.teal)+badge(320,99,'结束后成人清理',C.coral);label='记录新气泡与壳面变化，再结束实验';note='不长期放置、不食用；洗手，蛋壳不等同牙齿';}
  }
  break;
 }
 default:return null;
 }
 return {art,label,note};
}
/* Days 21–30: scene-specific procedural illustrations. All outcomes are illustrative. */
function lateBird(x,y,scale=1,color=C.ink){return `<g transform="translate(${x} ${y}) scale(${scale})">${ellipse(0,0,13,8,color,color)}${circle(10,-8,7,color,color)}${poly('16,-9 25,-6 16,-4',C.yellow,C.ink,1)}${path('M -11 1 L -24 -8 L -19 7 Z',color,color,1)}${line(-3,8,-5,15,color,2)}${line(4,8,6,15,color,2)}${circle(12,-10,1.3,C.paper,C.paper,0)}</g>`;}
function lateWindow(x,y,w,h,birds=0){let a=rect(x,y,w,h,'#E4F0EC',5,C.ink,3)+path(`M ${x+12} ${y+h-27} Q ${x+w*.45} ${y+h-45} ${x+w-8} ${y+h-24}`,C.mint,C.mint,0);a+=line(x+w*.3,y+h-20,x+w*.3,y+55,C.teal,8)+ellipse(x+w*.3,y+49,w*.19,h*.27,C.mint,C.teal,2)+poly(`${x+w*.59},${y+h-27} ${x+w*.59},${y+h-76} ${x+w*.78},${y+h-106} ${x+w*.96},${y+h-76} ${x+w*.96},${y+h-27}`,C.paper,C.muted,2);for(let n=0;n<birds;n++)a+=lateBird(x+w*.28+n*31,y+h-(h<150?40:63),.68);a+=line(x+w/2,y,x+w/2,y+h,C.ink,5)+line(x,y+h*.48,x+w,y+h*.48,C.ink,5);return a;}
function lateRamp(x,y,w,rise,cloth=false,box=true){const topY=y-rise;let a=rect(x-12,y+11,w+25,17,'#E3D9C4',7,C.muted,2)+poly(`${x},${y} ${x+w},${topY} ${x+w},${topY+9} ${x},${y+9}`,cloth?C.mint:C.paper,C.ink,3);if(cloth){for(let n=1;n<8;n++){let px=x+n*w/8,py=y-n*rise/8;a+=line(px-4,py-2,px+7,py+4,C.teal,1);}}if(box){const bx=x+w*.66,by=y-rise*.66;a+=`<g transform="translate(${bx} ${by}) rotate(${-Math.atan2(rise,w)*180/Math.PI})">${rect(-33,-37,66,35,C.coral,5,C.ink,2)}${line(-20,-29,20,-29,C.paper,2)}</g>`;}return a;}
function latePotato(x,y,scale=1,opacity=1){return `<g opacity="${opacity}" transform="translate(${x} ${y}) scale(${scale})">${poly('-20,-17 13,-22 23,-11 21,18 -13,22 -22,11',C.yellow,C.ink,2)}${path('M -20 -17 L -12 -6 L 21 -11 M -12 -6 L -13 22','none','#AD8A49',1.5)}${circle(8,7,1.4,'#AD8A49','#AD8A49',0)}${circle(12,-12,1.4,'#AD8A49','#AD8A49',0)}</g>`;}
function lateCelery(x,y,scale=1,colored=false){let a=`<g transform="translate(${x} ${y}) scale(${scale})">${path('M -9 0 Q -8 -48 -2 -108 L 10 -108 Q 7 -55 9 0 Z','#BBD18E',C.teal,2)}${line(-3,-4,2,-108,colored?C.coral:'#7EA263',3)}${line(4,-4,6,-106,colored?C.coral:'#7EA263',2)}${line(3,-100,-24,-135,C.teal,4)}${line(5,-90,32,-126,C.teal,4)}${leaf(-25,-136,.65,-40,colored?'#7C9F76':C.teal)}${leaf(34,-129,.7,35,colored?'#7C9F76':C.teal)}${leaf(3,-155,.65,5,C.teal)}`;if(colored)a+=line(3,-101,-22,-133,C.coral,2)+line(5,-91,30,-123,C.coral,2);return a+'</g>';}
function latePaper(x,y,w=110,h=65,angle=0){return `<g transform="rotate(${angle} ${x+w/2} ${y+h/2})">${rect(x,y,w,h,C.paper,2,C.ink,2)}${h>40?line(x+15,y+18,x+w-15,y+18,'#D3D8C9',2)+line(x+15,y+30,x+w-15,y+30,'#D3D8C9',2):''}</g>`;}
function latePaperBall(x,y,r=26){return path(`M ${x-r} ${y-6} L ${x-r*.6} ${y-r*.8} L ${x+4} ${y-r} L ${x+r*.85} ${y-r*.55} L ${x+r} ${y+9} L ${x+r*.45} ${y+r} L ${x-r*.5} ${y+r*.82} Z`,C.paper,C.ink,2)+path(`M ${x-r*.6} ${y-r*.8} L ${x-4} ${y-3} L ${x+r*.85} ${y-r*.55} M ${x-4} ${y-3} L ${x+7} ${y+r*.45} L ${x+r} ${y+9} M ${x-r} ${y-6} L ${x-r*.5} ${y+r*.82}`,'none','#B7C5BB',2);}
function lateIce(x,y,pitted=false,scale=1){return `<g transform="translate(${x} ${y}) scale(${scale})">${poly('-38,-14 -14,-30 35,-23 48,-3 28,37 -28,32',C.water,C.ink,2)}${path('M -38 -14 L 9 -4 L 48 -3 M 9 -4 L 28 37','none','#71AFC1',2)}${pitted?ellipse(-5,3,10,5,C.cream,'#71AFC1',1)+ellipse(20,-10,7,4,C.cream,'#71AFC1',1)+path('M -26 10 Q -11 4 -6 18','none','#71AFC1',2):line(-21,-14,-8,-21,C.paper,4)}</g>`;}
function latePlate(x,y,w=180){return ellipse(x,y,w/2,24,C.paper,C.ink,2)+ellipse(x,y,w*.39,15,'#EAF3F0','#C5D5CE',1);}
function lateCloud(x,y,scale=1){return `<g transform="translate(${x} ${y}) scale(${scale})">${path('M -34 15 C -55 12 -52 -13 -30 -15 C -25 -39 9 -39 16 -17 C 39 -24 56 1 40 16 Z',C.paper,'#A2C1C4',2)}</g>`;}
function lateSky(x,y,w,h,shift=0,grid=false){let a=rect(x,y,w,h,'#DCECF1',5,C.ink,2)+lateCloud(x+w*.35+shift,y+h*.37,Math.min(w/200,.85))+lateCloud(x+w*.72+shift*.35,y+h*.63,Math.min(w/270,.6));if(grid)a+=line(x+w/2,y,x+w/2,y+h,C.muted,1.5,'5 5')+line(x,y+h/2,x+w,y+h/2,C.muted,1.5,'5 5');return a;}
function lateBowl(x,y,w=200,fill='#EEE8D5',ridges=false){let a=path(`M ${x-w/2} ${y} Q ${x-w*.43} ${y+53} ${x} ${y+55} Q ${x+w*.43} ${y+53} ${x+w/2} ${y} Z`,C.paper,C.ink,3)+ellipse(x,y,w/2,24,fill,C.ink,2);if(ridges)a+=path(`M ${x-45} ${y+3} Q ${x-25} ${y-16} ${x-8} ${y} Q ${x+13} ${y+14} ${x+36} ${y-4}`,'none','#C6BCA0',3);return a;}
function lateTool(x,y,kind,scale=1){let a='';if(kind===0)a=ellipse(0,34,12,20,C.yellow,C.ink,2)+line(0,-32,0,16,C.ink,7);if(kind===1)a=path('M -17 45 L -7 -25 Q 0 -44 7 -25 L 17 45','none',C.teal,8)+line(-17,37,-17,49,C.ink,5)+line(17,37,17,49,C.ink,5);if(kind===2)a=line(-9,-35,-2,48,'#B98D59',7)+line(15,-35,5,48,'#B98D59',7);return `<g transform="translate(${x} ${y}) scale(${scale})">${a}</g>`;}
function lateTray(x,y,w=290,h=120,strips=false,count=12){let a=rect(x,y,w,h,'#E5DCCA',15,C.ink,2)+rect(x+9,y+9,w-18,h-18,C.paper,9,'#B8B2A0',1);for(let n=0;n<count;n++){const xx=x+38+(n%4)*(w-76)/3,yy=y+29+Math.floor(n/4)*(h-58)/2;a+=strips?`<g transform="rotate(${(n%3-1)*12} ${xx} ${yy})">${rect(xx-20,yy-6,40,12,C.yellow,2,C.ink,1)}</g>`:latePaperBall(xx,yy,12);}return a;}

function renderLate(day,s,young,advanced){
  const fs=young?22:20;
  let art='',label='',note='';
  switch(day){
    case 21:{
      if(s===0){art=lateWindow(54,96,326,179,0)+badge(215,86,'成人选安全闭窗位置')+rect(408,110,180,154,C.paper,10,C.muted,2)+txt(498,141,'日期：____',fs)+txt(498,179,'开始：____',fs)+txt(498,217,'天气：____',fs)+txt(215,300,'树与屋顶是边界',fs);label='先固定窗边位置，画出观察边界';note='不打开窗，不攀高，不投喂';}
      if(s===1){art=lateWindow(54,99,326,175,2)+badge(215,88,'安静观察 · 图中鸟仅示意')+circle(487,165,45,C.paper,C.teal,3)+line(487,165,487,137,C.teal,3)+line(487,165,510,177,C.teal,3)+txt(487,230,'10 分钟',23)+txt(487,269,young?'我画鸟的动作':'不认识就描述外形',fs);label='只记录边界里看到的鸟';note=young?'4–6 岁参与 5 分钟，成人继续观察':'不知道名称可以写“小黑鸟”，不猜物种';}
      if(s===2){art=txt(320,97,'计数规则示例（不是你的观察数据）',16,C.muted)+lateWindow(48,119,220,133,2)+lateWindow(372,119,220,133,3)+arrow(284,180,352,180)+badge(158,274,'先同时看到 2 只')+badge(482,274,'后来同时看到 3 只');label='这类鸟记 3，不把 2 和 3 加起来';note='只记同一时刻的最大只数，返回的鸟不累加';}
      if(s===3){art=rect(65,103,280,178,C.paper,12,C.ink,2)+txt(205,134,'我的观察记录',21)+line(84,151,326,151,C.muted,1)+txt(104,181,'外形',17,C.muted,'start')+txt(258,181,'最大同时数',17,C.muted)+txt(104,221,'______',22,C.ink,'start')+txt(262,221,'____',22)+txt(205,258,'没看到，也写 0',19,C.teal)+circle(469,165,46,C.mint,C.teal,2)+txt(469,175,'结束',25,C.teal)+txt(469,242,'到 10 分钟就停',fs);label='时间到即结束，留下真实记录';note=advanced?'复查时固定地点、时刻、边界与时长':'不把没观察与没看到混为一谈';}
      break;
    }
    case 22:{
      if(s===0){art=lateRamp(72,226,390,0,false,true)+dim(72,295,462,295,'纸板约 40 × 30 厘米')+dim(72,166,330,166,'距下端约 25 厘米')+txt(520,145,'纸面',21)+rect(488,160,66,52,C.paper,3,C.ink,2)+txt(520,242,'同一盒底朝下',15)+badge(271,111,'纸贴平，接缝避开滑道');label='贴平纸面，把同一个盒子放在起点';note='盒子约 10 厘米长；低处操作，托盘接住';}
      if(s===1){art=lateRamp(82,259,355,108,false,true)+arrow(294,168,239,187)+txt(223,157,'连续滑约 2 厘米就停',16)+dim(475,259,475,151,'量高度')+line(437,151,492,151,C.muted,1,'4 4')+badge(280,102,'成人固定下端，缓慢抬高');label='看到连续滑动，再量上端高度';note='不推盒子；手指不伸入板下';}
      if(s===2){art=lateRamp(43,209,240,63,false,true)+lateRamp(357,209,240,63,true,true)+badge(164,103,'纸面 · 3 次')+badge(478,103,'平整棉布 · 3 次')+txt(164,259,'① ___  ② ___  ③ ___',16)+txt(478,259,'① ___  ② ___  ③ ___',16);label='放平重置：纸面与布面各测三次';note=advanced?'控制起点、盒子方向、板长、抬升方式':'换表面，不换盒子，不加推力';}
      if(s===3){art=lateRamp(76,264,348,115,true,true)+line(61,149,506,149,C.coral,2,'7 5')+dim(483,264,483,149,'最多 15 厘米')+badge(263,107,'到最高线就停',C.coral);label='到 15 厘米仍未滑，也是一条结果';note='不敲板，不推盒子，不继续抬高';}
      break;
    }
    case 23:{
      const cups=()=>cup(110,123,137,143,{liquid:C.water,level:.65,label:'清水',sub:''})+cup(397,123,137,143,{liquid:'#B5DFD7',level:.65,label:'盐水',sub:''});
      if(s===0){art=cups()+txt(178,212,'200 毫升',18)+txt(465,212,'200 毫升',18)+badge(178,98,'盐 0 克')+badge(465,98,'盐 50 克')+spoon(485,143,-25)+txt(322,147,'→',32,C.coral)+txt(322,176,'完全溶解',16,C.teal);label='两杯各 200 毫升，盐水杯加盐 50 克';note='杯容量至少 350 毫升；搅匀后确认杯底无盐粒';}
      if(s===1){art=cups()+latePotato(179,235,.72)+arrow(179,146,179,199)+badge(179,98,'成人切约 3 厘米土豆块')+badge(466,99,'稍后再用')+txt(322,197,'30 秒',22)+txt(322,229,'上 / 中 / 下？',17);label=young?'我看大人放土豆，找它停在哪里':'先轻放清水，等约 30 秒再记录';note='土豆位置为示意，按真实结果记录；不用手压';}
      if(s===2){art=cups()+latePotato(466,183,.72)+path('M 186 121 Q 322 67 452 121','none',C.coral,3)+arrow(436,113,455,126)+badge(320,92,'同一块土豆，不换一块')+txt(318,211,'再等 30 秒',18)+txt(318,241,'拨去附着气泡',16);label='同一块轻放盐水，再观察一次';note='图中浮起仅为可能结果；不为追求浮起继续加盐';}
      if(s===3){art=cups()+latePotato(180,235,.72)+latePotato(324,156,.65)+drops(324,110,3,C.water)+arrow(430,111,360,145)+arrow(293,166,231,197)+badge(323,92,'先冲净，再沥水')+txt(323,228,'回到原清水杯',18)+txt(323,258,'与第一次比一比',16);label='冲净同一块土豆，再放回原清水';note='检查结果是否接近第一次；实验土豆不入口';}
      break;
    }
    case 24:{
      if(s<3){art=cup(112,173,135,96,{liquid:C.water,level:.6,label:'清水 100 毫升'})+cup(395,173,135,96,{liquid:'#E8A69A',level:.6,label:'水 100 毫升'});if(s===0){art+=txt(320,132,'色素约 20 滴',20,C.coral)+lateCelery(179,239,.75,false)+lateCelery(461,239,.75,false)+dim(71,238,71,124,'约 15 厘米')+badge(320,91,'成人现切底端；粗细、叶量相近');label='两根芹菜相近，两杯水一样多';note='一杯加食用色素，另一杯不加；所有切割由成人完成';}if(s===1){art+=lateCelery(179,253,.85,false)+lateCelery(461,253,.85,false)+badge(321,87,'各放 1 根，底端浸水')+txt(321,161,'叶片',17)+txt(321,184,'露出水面',17)+txt(321,239,'开始：____',17);label='叶片露出水面，记录开始时刻和原色';note='放同一明亮、无烈日的位置；杯子保持稳定';}if(s===2){art+=lateCelery(179,253,.85,false)+lateCelery(461,253,.85,true)+badge(320,87,'2 小时 → 6 小时 → 次日')+txt(319,153,'看叶脉',18)+txt(319,181,'和叶柄',18)+arrow(367,166,434,150)+txt(320,235,'最多 24 小时',17,C.coral);label='按时看颜色出现在哪里，不反复切短';note='染色只是可能结果，颜色不明显也如实记录';}}else{art=rect(65,112,510,171,C.paper,6,'#C9D0C0',2)+txt(177,139,'清水对照',19)+txt(457,139,'染色组',19);for(let j=0;j<2;j++){let yy=182+j*62;art+=txt(320,yy+6,j?'距底端 8 厘米':'距底端 2 厘米',16);for(let x of [177,457]){art+=ellipse(x,yy,41,18,'#D9E5B6',C.teal,2);for(let n=0;n<5;n++)art+=circle(x-26+n*13,yy-4+(n%2)*7,3,x===457?C.coral:C.teal,x===457?C.coral:C.teal,0);}}art+=badge(320,88,'成人擦净表面后横切');label='看内部色点，和清水组并排比较';note='切面为示意；不要把表面沾色当成内部染色';}
      break;
    }
    case 25:{
      if(s===0){art=latePaper(70,145,160,102)+latePaper(304,133,110,70)+arrow(432,168,473,168)+latePaperBall(532,181,34)+txt(151,113,'保留平纸',22)+txt(390,113,'另一张揉成团',22)+txt(151,282,'同一包 A4 纸',19)+dim(495,258,569,258,'直径约 5–6 厘米');label='同样两张纸，只改变其中一张的形状';note='不剪纸，不加胶带或夹子，用纸量相同';}
      if(s===1){art=line(70,278,567,278,C.ink,3)+line(85,151,559,151,C.coral,2,'8 5')+latePaper(145,135,148,16)+latePaperBall(458,126,25)+dim(89,151,89,278,'1 米')+txt(334,186,'最低处对齐',20,C.coral)+badge(322,96,'成人双手准备 · 室内无风')+txt(322,254,'站在地面，不登椅',19);label='平纸近水平，两者最低处对齐一米线';note='清空周围，不从窗外投放';}
      if(s===2){art=line(70,279,568,279,C.ink,3)+line(85,116,559,116,C.muted,1,'6 5')+latePaper(145,174,140,30,-10)+latePaperBall(466,250,24)+path('M 214 121 Q 161 138 211 158 Q 263 177 211 214','none',C.coral,3)+arrow(211,215,223,242)+arrow(465,130,465,210)+txt(318,102,'同时松开，不向下推',21)+txt(318,301,'下降位置仅为示意',15,C.muted);label='看谁先落地，也留意平纸是否飘转';note='记录实际现象，不预设每次都一样';}
      if(s===3){art=latePaper(60,134,100,65)+latePaperBall(551,169,28)+arrow(185,145,452,145,C.teal)+arrow(452,183,185,183,C.coral)+txt(319,112,'左右手交替，重新摊平',21);for(let n=0;n<5;n++)art+=rect(77+n*102,225,83,59,C.paper,7,C.ink,2)+txt(118+n*102,248,`第 ${n+1} 次`,15)+txt(118+n*102,273,'____',18);label='共试五次，记录每一轮';note=advanced?'不同步或撞家具要注明，并另做一次；不删掉异常记录':'不同步、撞家具，也要记下来';}
      break;
    }
    case 26:{
      if(s===0||s===1||s===2){art=latePlate(175,238,208)+latePlate(465,238,208)+lateIce(175,s===2?214:202,false,s===2?.85:1)+lateIce(465,s===2?219:202,s===2,s===2?.78:1)+txt(175,292,'不加盐',21)+txt(465,292,s?'加盐 1/4 平茶匙':'同样大小的冰',s?18:21);if(s===0){art+=badge(320,95,'同一冰格、同次冻成')+txt(320,127,'每格约 20 毫升水',20);label='两块相近的冰，同时放进相同浅盘';note='同一室温，避开阳光与风口；用勺取放';}if(s===1){art+=badge(320,96,'只给一块撒盐，立即计时')+spoon(479,131,-30)+grains(467,161,10,C.paper)+txt(174,137,'不加任何东西',18);label='一块均匀撒盐，另一块保持原样';note='不反复翻冰；冰盐混合物不能贴皮肤';}if(s===2){art+=badge(320,96,'5 分钟 · 10 分钟 · 20 分钟')+txt(175,143,'轮廓与剩余冰',18)+txt(465,143,'凹坑与液体',18)+arrow(523,156,493,200);label='同一视角记录冰的轮廓与凹坑';note='变化仅为示意；不能只看水摊得多大';}}else{art=rect(57,110,330,171,C.paper,12,C.ink,2)+txt(222,142,'看不见固态冰的时刻',20)+line(76,158,368,158,C.muted,1)+txt(85,192,'不加盐：____',20,C.ink,'start')+txt(85,230,'加盐：  ____',20,C.ink,'start')+circle(492,173,50,C.paper,C.teal,3)+txt(492,172,'60',30,C.teal)+txt(492,199,'分钟',17,C.teal)+txt(492,257,'到时仍有冰？',17);label='仍未化完，就记“超过 60 分钟”';note='不加热催促；完全融化的先后不预设';}
      break;
    }
    case 27:{
      if(s===0){art=lateSky(80,111,313,158,0,false)+poly('80,269 80,242 159,213 240,242 393,242 393,269',C.mint,C.ink,2)+rect(76,107,321,166,'none',4,C.ink,5)+txt(493,143,'固定站位',22)+txt(493,185,'固定朝向',22)+txt(493,235,'避开太阳',22,C.coral)+badge(238,90,'成人选安全观察点');label='用窗框或屋顶，框住同一片天空';note='不探窗，不登高，不直视太阳';}
      if(s===1){art=lateSky(65,108,310,170,0,true)+txt(491,117,'画四格',22)+txt(491,154,'云盖住多少？',19);['0','1/4','1/2','3/4','全部'].forEach((t,n)=>{art+=rect(412+n%3*65,178+Math.floor(n/3)*50,56,36,C.paper,5,C.ink,1)+txt(440+n%3*65,202+Math.floor(n/3)*50,t,18);});label='画云的位置，估计覆盖比例并记时刻';note='天空中的云只是示意，请画你实际看到的';}
      if(s===2){for(let n=0;n<3;n++)art+=lateSky(35+n*207,125,185,124,(n-1)*9,true)+badge(127+n*207,103,['开始','30 分钟','60 分钟'][n])+txt(127+n*207,279,'时刻：____',17);label='半小时和一小时后，回到原位再画';note='太阳进入视野就停止该方向，记缺测，不强行补齐';}
      if(s===3){for(let n=0;n<3;n++)art+=lateSky(35+n*207,109,185,109,(n-1)*13,true)+txt(127+n*207,244,'云量：____',17)+txt(127+n*207,275,'位置：____',17);label='分开比较“云有多少”和“云在哪里”';note=advanced?'覆盖相近、位置改变，也要分别描述':'云移动了，不一定表示云变多了';}
      break;
    }
    case 28:{
      const eye=ellipse(103,155,24,13,C.paper,C.ink,2)+circle(109,155,7,C.teal,C.teal,0);
      if(s===0){art=cup(255,128,150,140,{liquid:C.water,level:0,label:'空的塑料杯'})+line(282,105,367,250,C.yellow,10)+line(282,105,367,250,C.ink,2)+rect(276,126,31,15,'#D4D9C9',2,C.muted,1)+eye+line(130,158,256,198,C.muted,2,'5 5')+txt(491,151,'先看空杯',21)+txt(491,193,'画出直铅笔',19)+badge(321,88,'未削尖 · 斜靠并固定');label='先从侧上方看，画下空杯中的铅笔';note='杯和铅笔位置固定；不用玻璃杯或尖铅笔';}
      if(s===1||s===2){art=cup(255,128,150,140,{liquid:C.water,level:.58,label:'清水 200 毫升'})+line(282,105,330,187,C.yellow,10)+line(331,187,383,249,C.yellow,10)+rect(276,126,31,15,'#D4D9C9',2,C.muted,1)+eye+line(130,158,326,187,C.muted,2,'5 5')+badge(323,87,s===1?'成人缓慢加水':'水面附近，看起来错开了？');if(s===1){art+=txt(492,167,'回到原视角',20)+txt(492,206,'不移动装置',18);label='加水后，从同一个角度再看';note='铅笔只有一部分浸水；不饮实验水';}else{art+=circle(332,187,22,'none',C.coral,3)+arrow(462,145,353,177)+txt(493,129,'水面附近',19)+txt(493,249,'视位置示意',16,C.muted);if(advanced)art+=line(330,187,367,250,C.ink,1.5,'5 4');label='画出空气中与水中看起来的位置';note='不明显也先记录，再缓慢换角度；图像不是实物折断';}}
      if(s===3){art=cup(79,132,132,134,{liquid:C.water,level:.58,label:'杯子留在托盘'})+line(311,170,542,170,C.yellow,11)+line(311,170,542,170,C.ink,2)+rect(315,205,225,53,C.paper,8,C.muted,2)+txt(427,239,'检查：还是直的吗？',20)+arrow(224,164,283,164)+badge(426,113,'成人取出、擦干');label='拿出检查：看起来弯，不等于真的弯';note='把“外观”与“实际形状”分开记录';}
      break;
    }
    case 29:{
      if(s===0){art=rect(67,120,128,136,C.paper,8,C.ink,2)+txt(131,151,'玉米淀粉',21)+txt(131,187,'100 克',24)+txt(131,231,'成人慢慢倒',16,C.coral)+lateBowl(397,218,238,'#EEE8D5',true)+arrow(213,198,268,212)+cup(383,100,71,73,{liquid:C.water,level:.6,label:''})+txt(505,139,'先加水',18)+txt(505,167,'45 毫升',21)+badge(320,89,'成人先拌湿，孩子再参与');label='成人贴近碗底倒粉，慢慢加水拌湿';note='避免扬尘；不用面粉替代玉米淀粉';}
      if(s===1){art=lateBowl(320,217,220,'#EEE8D5',true)+badge(320,88,'每次调整后都拌匀')+cup(81,122,72,73,{liquid:C.water,level:.55,label:''})+txt(129,233,'仍松散：加水',17)+txt(129,263,'每次 5 毫升',19)+arrow(172,170,231,196)+spoon(506,145,-40)+txt(510,233,'太稀：成人补粉',17)+txt(510,263,'每次 1 平茶匙',19)+arrow(468,179,421,201)+txt(321,139,'记录实际用量',18,C.teal);label='少量调整，找到慢搅能流动的状态';note='总备水 60 毫升；成人补粉并拌湿后孩子再接续';}
      if(s===2){art=lateBowl(170,200,220,'#EEE8D5',true)+lateBowl(472,200,220,'#EEE8D5',true)+spoon(150,140,-25)+spoon(452,140,-25)+arrow(113,116,186,116,C.teal,3)+arrow(393,116,535,116,C.coral,5)+txt(170,92,'慢慢划过',22,C.teal)+txt(472,92,'较快划过',22,C.coral)+txt(170,285,'手感：____',19)+txt(472,285,'手感：____',19);label='同一把勺、相近深度，比较慢推与快推';note=young?'成人扶碗，我用勺轻轻体验；不猛砸':'不大力敲打；“费力”是手感，不是直接测量力';}
      if(s===3){art=lateBowl(320,206,255,'#EEE8D5',false)+spoon(465,126,35)+badge(320,92,'停下，看看能否慢慢流平')+txt(149,151,'慢',25,C.teal)+arrow(179,143,272,143,C.teal)+txt(320,151,'快',25,C.coral)+arrow(349,143,442,143,C.coral)+txt(491,151,'停',25,C.ink)+txt(320,286,'重复慢、快三轮 · 记录飞溅',18);label='停下观察流平，再重复三轮';note='不为追求效果猛砸；残料刮入垃圾，不倒下水道';}
      break;
    }
    case 30:{
      if(s===0){art=lateTray(45,164,315,112,false,12)+lateBowl(500,218,167,C.paper,false)+lateTool(109,107,0,.55)+lateTool(214,107,1,.55)+lateTool(320,107,2,.55)+txt(108,155,'汤匙',16)+txt(214,155,'圆头夹',16)+txt(319,155,'钝头筷',16)+txt(502,151,'收集碗位置固定',18)+txt(203,301,'12 个纸团 · 直径约 4 厘米',20);label='工具当“鸟喙”，纸团只代表“食物”';note='这是模型，不给真实鸟类投喂纸';}
      if(s===1){art=lateTray(45,164,315,120,false,11)+lateBowl(500,218,167,C.paper,false)+lateTool(391,131,0,.8)+latePaperBall(391,153,13)+path('M 340 124 Q 407 86 483 174','none',C.coral,3)+arrow(474,158,485,180)+badge(189,105,young?'低龄可不计时':'同一人 · 30 秒')+txt(505,120,'完全进碗才计数',18)+txt(503,291,'不用另一只手帮忙',16);label='用一种工具，把纸团从盘里移进碗';note='动作示意，不是成绩；工具不指脸，夹子防夹手';}
      if(s===2){art=lateTray(45,166,315,110,true,12)+lateBowl(505,222,167,C.paper,false)+lateTool(111,111,0,.55)+lateTool(214,111,1,.55)+lateTool(317,111,2,.55)+arrow(148,106,180,106)+arrow(253,106,286,106)+txt(500,122,'先把 12 个放回',18)+txt(500,155,'再换工具',18)+txt(204,301,'12 条纸条 · 约 8 × 2 厘米',20);label='三种工具都测，再换十二条纸条';note='恢复相近分布；同一人、同样时间、同一个碗位置';}
      if(s===3){art=rect(88,105,465,181,C.paper,9,C.ink,2)+line(88,148,553,148,C.muted,1)+line(88,193,553,193,C.muted,1)+line(88,238,553,238,C.muted,1)+line(252,105,252,286,C.muted,1)+line(402,105,402,286,C.muted,1)+txt(168,134,'工具',19)+txt(326,134,'纸团',19)+txt(479,134,'纸条',19);['汤匙','圆头夹','钝头筷'].forEach((v,n)=>{art+=txt(167,178+n*45,v,19)+txt(327,178+n*45,'____',22)+txt(479,178+n*45,'____',22);});label=young?'说说哪一种工具，抓什么更方便':'比较同一个人搬两种材料的记录';note=advanced?'模型未包含真实鸟的全部结构、行为与环境':'不比较不同孩子的成绩，不把模型当作真实鸟';}
      break;
    }
    default:return null;
  }
  return {art,label,note};
}
const DIAGRAM_TITLES = ['纸桥为什么变结实','搅拌能让糖更快“消失”吗','叶子的水去哪儿了','会旋转的纸直升机','紫甘蓝的颜色密码','种子发芽需要水吗','影子会自己移动吗','油和水为什么分层','尺子怎么唱出高低音','苹果怎样少变褐','一平方米里有什么生命','黑色笔迹藏着几种颜色','一张铝箔能承载多少','两种厨房材料相遇','叶片怎样分类更清楚','塑料尺隔空吸纸','盐去哪儿又回来了','小水滴从哪里来','纸巾里的水会爬高吗','熟鸡蛋壳遇到醋','窗外鸟儿的定时观察','什么表面更难滑动','盐水能托起土豆吗','芹菜里的运输线','纸张怎样落得慢','盐为什么改变冰的融化','今天的天空有多云','水里的直线为什么像折了','淀粉水的快慢手感','用工具模拟鸟喙取食'];
let diagramSerial=0;
/** Return an accessible, standalone SVG. Step is zero-based. No external assets. */
export function renderDiagram(dayId,stepIndex=0,ageBand='7-9'){
  const match=String(dayId).match(/(?:day)?0?(\d{1,2})/i);
  const day=Math.min(30,Math.max(1,match?Number(match[1]):1));
  let s=Math.min(3,Math.max(0,Math.floor(Number(stepIndex)||0)));
  if(/-step[1-4]$/.test(String(dayId))&&arguments.length<2)s=Number(String(dayId).slice(-1))-1;
  const age=String(ageBand).replace(/[–—]/g,'-'),young=age==='4-6',advanced=age==='10-12'||age==='13-16';
  const scene=renderEarly(day,s,young,advanced)||renderMiddle(day,s,young,advanced)||renderLate(day,s,young,advanced);
  if(!scene)throw new Error(`Missing diagram for day ${day}, step ${s+1}`);
  const id=`science-diagram-${day}-${s}-${++diagramSerial}`;
  const label=scene.label||'', wrapped=label.length>26?[label.slice(0,26),label.slice(26)]:[label];
  const caption=wrapped.map((t,i)=>txt(320,wrapped.length>1?326+i*25:339,t,22,C.ink,'middle',700)).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" class="science-diagram" viewBox="0 0 640 360" width="640" height="360" role="img" aria-labelledby="${id}-title ${id}-desc" style="display:block;max-width:100%;height:auto;font-family:system-ui,-apple-system,'Noto Sans CJK SC','Microsoft YaHei',sans-serif"><title id="${id}-title">第${day}天，第${s+1}步：${esc(DIAGRAM_TITLES[day-1])}</title><desc id="${id}-desc">${esc(label)}。${esc(scene.note||'图中现象仅为示意，记录实际观察。')}成人陪同，实验材料不入口。${young?'低龄版：大图示、简短动作提示。':advanced?'进阶版：注意对照、变量和实际记录。':'观察版：按顺序操作并记录。'}</desc>${rect(0,0,640,360,C.cream,0,'none',0)}${txt(25,36,DIAGRAM_TITLES[day-1]+' · 示意',23,C.ink,'start',750)}${txt(610,36,`${s+1} / 4`,22,C.teal,'end')}${line(24,58,616,58,'#DDE5D9',1.5)}${scene.art}${rect(0,307,640,53,'#E9EFE4',0,'none',0)}${caption}</svg>`;
}
export const diagramCoverage={days:365,legacyBespokeDays:30,stepsPerDay:4,ageBands:['4-6','7-9','10-12','13-16'],type:'legacy apparatus drawings plus activity-labelled procedural schematics; render combinations are not unique artwork counts',motion:false};

// Annual activities use semantic operation maps. Labels come from the reviewed card;
// no generated values are presented as observed measurements or historical facts.
function wrappedText(text,x,y,width=20,size=17,color=C.ink,anchor='middle',maxLines=3){
 const chars=Array.from(String(text||'')),lines=[];for(let i=0;i<chars.length;i+=width)lines.push(chars.slice(i,i+width).join(''));
 return lines.slice(0,maxLines).map((t,i)=>txt(x,y+i*(size+6),t+(i===maxLines-1&&lines.length>maxLines?'…':''),size,color,anchor)).join('');
}
function materialGlyph(name,x,y){
 const t=String(name);let z='';
 if(/纸|卡|照片|记录|史料/.test(t))z=rect(x-24,y-29,48,58,C.paper,4,C.teal,2)+line(x-14,y-12,x+14,y-12,C.teal,2)+line(x-14,y,x+9,y,C.teal,2)+line(x-14,y+12,x+14,y+12,C.teal,2);
 else if(/尺/.test(t)){z=rect(x-34,y-12,68,24,C.yellow,2,C.teal,2);for(let i=0;i<7;i++)z+=line(x-27+i*9,y-11,x-27+i*9,y-(i%2?3:0),C.teal,1.4)}
 else if(/叶|植物|花/.test(t))z=leaf(x,y+25,.8,25);
 else if(/钟|计时/.test(t))z=circle(x,y,26,C.paper,C.teal,2)+line(x,y,x,y-17,C.teal,2)+line(x,y,x+13,y+9,C.teal,2);
 else if(/杯|水|液|醋|油/.test(t))z=cup(x-25,y-25,50,49,{level:.4,label:''});
 else if(/笔/.test(t))z=poly(`${x-20},${y+25} ${x-15},${y+8} ${x+14},${y-25} ${x+25},${y-14} ${x-6},${y+20}`,C.yellow,C.teal,2);
 else if(/书/.test(t))z=book(x-30,y-21,60,42,C.mint)+line(x,y-18,x,y+19,C.paper,2);
 else z=rect(x-27,y-23,54,46,C.mint,9,C.teal,2)+txt(x,y+7,'观察',15,C.teal);
 return z;
}
function operationScene(e,s,items){
 let art=txt(320,91,s===1?'摆好对象，按步骤安排':'执行指定动作，留意发生什么',20,C.teal);
 const names=items.slice(0,2);names.forEach((name,i)=>{const y=130+i*84;art+=materialGlyph(name,95,y+10)+wrappedText(name,162,y,10,15,C.ink,'start',3)});
 art+=arrow(300,185,337,185,C.coral,3)+rect(351,107,237,182,C.paper,12,C.teal,2)+txt(370,136,`第 ${s+1} 步`,17,C.teal,'start')+wrappedText(e.steps[s].shortText,370,165,11,17,C.ink,'start',5);
 return {art,label:e.visual?.labels?.[s]||e.steps[s].title,note:'材料小图标用于识别对象；箭头表示操作顺序，不表示物理因果。正文包含完整要求。'};
}
function specificAnnualScene(e,s){
 if(s!==1&&s!==2)return null;
 let art='',note='位置与形状为示意，按实际对象核对。';
 if(e.title==='纸柱的截面挑战'){
  art=rect(65,253,510,23,C.mint,8,C.teal,2)+path('M145 125 L220 105 L251 135 V245 L145 235 Z',C.paper,C.teal,3)+path('M145 125 L251 135 L220 105 M220 105 V215 L251 245', 'none',C.teal,2)+rect(375,128,103,115,C.paper,0,C.teal,3)+ellipse(426,128,51,16,C.paper,C.teal,3)+path('M375 242 Q426 265 478 242','none',C.teal,3)+txt(196,297,'三角筒 · 同高10厘米',16)+txt(426,297,'圆筒 · 同高10厘米',16);
  if(s===2)art+=rect(163,85,69,25,C.yellow,4,C.teal,2)+rect(392,85,69,25,C.yellow,4,C.teal,2)+arrow(197,61,197,82)+arrow(426,61,426,82);
  note=s===1?'先在托盘上检查能否站稳；示意接缝不代表制作尺寸。':'成人依次用同一块大橡皮；图中并排呈现两个测试状态。凹陷即取下。';
 }else if(e.title==='糖块完整还是压碎'){
  art=txt(177,96,'完整方糖',20)+txt(463,96,'同规格方糖压碎',20);
  [177,463].forEach(x=>{art+=path(`M${x-75} 118 L${x-63} 265 H${x+63} L${x+75} 118`,C.paper,C.teal,3)+path(`M${x-68} 171 H${x+68} L${x+63} 262 H${x-63} Z`,C.mint,'none')+txt(x,294,'50毫升常温水',18)});
  art+=rect(158,229,38,30,C.yellow,4,C.teal,2);[[439,244],[459,251],[478,240],[449,228],[478,257]].forEach(([x,y])=>{art+=rect(x,y,12,10,C.yellow,2,C.teal,1)});
  note=s===1?'同时加入，不搅动。两幅表示初始物料形态，不是预设最终结果。':'每30秒观察，最多5分钟。图中残留仅示意，记录自己的实际变化。';
 }else if(e.title==='袜子一一配对'){
  [0,1,2].forEach(i=>{const y=120+i*61;art+=path(`M130 ${y-19} H157 V${y+8} H180 V${y+27} H130 Z`,C.mint,C.teal,2)+path(`M450 ${y-19} H477 V${y+8} H500 V${y+27} H450 Z`,C.yellow,C.teal,2)+line(199,y+5,427,y+5,C.teal,2,s===2?'5 5':null)});
  art+=txt(153,83,'左组：3只',19)+txt(473,83,'右组：3只',19);note=s===1?'一只只对应，不重复配。连线是对应关系，不需要真实绳线。':'改变摆放距离再配对，检查是否出现落单；图示不是数量证明。';
 }else if(e.title==='两本印本的年代线'){
  art=rect(65,97,235,159,C.paper,10,C.teal,2)+rect(340,97,235,159,C.paper,10,C.teal,2)+txt(182,129,'《金刚经》印本',20)+txt(182,169,'868年',25)+txt(182,210,'敦煌发现 · 中国',18)+txt(457,129,'古腾堡《圣经》印本',19)+txt(457,169,'1454—1455年',23)+txt(457,210,'欧洲 · 美因茨',18)+arrow(287,278,365,278,C.teal,3)+txt(182,283,'较早',18)+txt(457,283,'较晚',18);note='两件具体印本的时间先后，不代表所有印刷术的起源；间距不是年代比例。';
 }else if(e.title==='家里的“一杯”有多大'){
  art=path('M86 120 L100 263 H212 L226 120',C.paper,C.teal,3)+line(96,192,217,192,C.coral,3,'6 4')+txt(156,94,'第一只杯',20)+txt(156,291,'外侧半高标记',18)+arrow(251,191,333,191,C.teal,3)+path('M380 105 V264 H514 V105',C.paper,C.teal,3)+txt(447,84,'量杯',20);
  [140,175,210,245].forEach(y=>{art+=line(380,y,405,y,C.teal,2)});art+=txt(447,291,'平视读数，不预填',18);note='先加水到标记，再倒入量杯；每只最多100毫升，未到标记就停止。第二只同样做。';
 }else if(e.title==='桌面也能变成地图'){
  art=rect(82,87,476,205,'#EAE9D8',16,C.teal,2)+rect(117,115,114,64,C.mint,5,C.teal,2)+rect(304,113,77,121,C.coral,5,C.teal,2)+rect(416,199,110,54,C.yellow,5,C.teal,2)+txt(173,153,'A',25)+txt(343,180,'B',25)+txt(470,234,'C',25)+txt(320,278,s===1?'想象正上方的外形，不攀爬':'三个长方形代表三本书',18,C.teal);
  note='这是三本书的一种示意摆法；自己的地图要对应实际桌面，孩子坐着观察。';
 }else if(e.title==='路线长还是直线长'){
  art=rect(71,86,498,210,C.paper,9,C.teal,2)+rect(283,139,100,101,C.mint,4,C.teal,2)+txt(333,194,'障碍',20)+circle(124,252,7,C.coral)+circle(514,115,7,C.teal)+txt(110,278,'A',20)+txt(530,111,'B',20)+line(124,252,514,115,s===1?C.coral:C.muted,s===1?4:2,'7 5')+path('M124 252 H249 V107 H514 V115','none',s===2?C.coral:C.teal,s===2?4:2)+txt(410,276,s===1?'测直线段 A—B':'各段长度相加',19,C.teal);
  note='路线图不按真实比例。虚线为纸上直线距离，不表示可以穿过真实障碍。';
 }else if(e.title==='植物观察的比例尺'){
  art=rect(74,91,220,196,C.paper,8,C.teal,2)+rect(347,91,220,196,C.paper,8,C.teal,2)+line(184,237,184,171,C.teal,4)+leaf(184,211,.5,-45)+leaf(184,192,.5,45)+line(457,237,457,120,C.teal,5)+leaf(457,197,.8,-45)+leaf(457,160,.8,45)+txt(184,264,'标注实际：10厘米',18)+txt(457,264,'标注实际：10厘米',18)+txt(184,119,'图一',19)+txt(457,119,'图二',19);
  note='两张图的画幅不同，但设定实际高度相同；图上长度不能直接当植物真实高度。';
 }else if(e.title==='叶缘侦探：平滑还是锯齿'){
  art=path('M172 263 C94 220 95 126 172 102 C249 126 250 220 172 263',C.mint,C.teal,3)+path('M462 263 L431 240 425 219 407 208 418 183 408 165 429 151 425 135 451 119 462 102 475 119 498 135 494 151 515 165 505 183 516 208 498 219 492 240 Z',C.mint,C.teal,3)+line(172,263,172,123,C.teal,2)+line(462,263,462,123,C.teal,2)+txt(172,293,'平滑边缘 · 示意',18)+txt(462,293,'锯齿边缘 · 示意',18);
  note='这是两种叶缘形状示意，不是预先给白菜或薄荷作分类；按真实叶片观察。';
 }else if(e.title==='叶脉像网还是平行线'){
  art=path('M173 263 C95 220 100 125 173 102 C249 125 250 220 173 263',C.mint,C.teal,3)+line(173,254,173,117,C.teal,3)+path('M173 143 L138 167 M173 177 L128 202 M173 211 L146 233 M173 152 L207 175 M173 188 L221 211 M139 166 L129 184 M207 175 L214 191','none',C.teal,2)+path('M461 263 Q405 179 461 102 Q517 179 461 263',C.mint,C.teal,3)+path('M461 259 V109 M451 244 Q429 183 452 122 M471 244 Q493 183 470 122','none',C.teal,2)+txt(173,293,'网状脉 · 示意',18)+txt(461,293,'平行脉 · 示意',18);
  note='示意帮助描述叶脉，不仅凭叶脉就断言植物种类。';
 }else if(e.title==='地球模型的比例审查'){
  art=txt(320,89,'练习图：故意不按真实比例',21,C.coral)+circle(141,180,75,C.yellow,C.teal,2)+circle(441,180,15,C.mint,C.teal,2)+txt(141,183,'太阳',22)+txt(441,221,'地球',20)+txt(141,275,'画直径5厘米',17)+txt(441,275,'画直径1厘米',17)+dim(141,110,441,110,'画图圆心距离10厘米');
  note='这是步骤指定的故意不按真实比例的练习图，不能从图中测出真实太阳、地球大小或距离。';
 }else if(e.title==='同一杯水为何读出不同数'){
  art=cup(274,100,140,157,{level:.55,label:''})+line(278,172,410,172,C.teal,2)+eye(140,113)+eye(140,172)+eye(140,234)+line(163,113,277,172,C.muted,2,'5 5')+line(163,172,277,172,C.coral,3)+line(163,234,277,172,C.muted,2,'5 5')+txt(491,121,'稍上方',18)+txt(491,180,'液面高度',18,C.coral)+txt(491,242,'稍下方',18)+txt(320,291,'杯子不动，改变观察高度',19,C.teal);
  note='眼睛位置仅为示意，不要求攀爬或钻桌底；实际读法遵循量杯说明，不预设三次数值不同。';
 }else if(e.title==='称重时盒子的重量去哪了'){
  art=rect(91,208,188,62,C.mint,11,C.teal,2)+rect(127,229,115,28,C.paper,4,C.teal,1)+txt(184,250,s===1?'总质量':'去皮后读数',16)+rect(109,125,151,81,C.paper,6,C.teal,2)+rect(132,106,104,46,C.yellow,4,C.teal,2)+txt(184,177,'盒＋纸',19)+txt(447,142,'总质量',23)+txt(447,184,'－ 空盒质量',23)+line(348,201,546,201,C.teal,2)+txt(447,237,'＝ 纸的质量',23)+txt(320,295,'记录实际读数，不超过秤量程',18,C.muted);
  note='秤屏显示的是字段名，不是测量值。去皮和放置由成人按秤说明操作。';
 }else if(e.title==='尺子没从零开始怎么办'){
  art=rect(82,202,479,42,C.yellow,3,C.teal,2)+rect(181,135,283,57,C.mint,3,C.teal,2)+line(181,126,181,254,C.coral,2,'5 5')+line(464,126,464,254,C.coral,2,'5 5')+txt(181,280,'起点：3厘米',20)+txt(464,280,'终点：实际读数',20)+txt(323,171,'同一条纸，保持平行',18)+txt(320,95,s===1?'平移纸条，不改变它的长度':'长度＝终点读数－起点读数',21,C.teal);
  for(let i=0;i<25;i++)art+=line(91+i*19,203,91+i*19,i%5?216:226,C.teal,1);
  note='纸条长度和刻度间距为示意；起点3厘米来自步骤，终点由实际测量填写。';
 }else if(e.title==='不靠颜色也能认出分类'){
  art=rect(72,109,215,150,C.paper,12,C.teal,2)+rect(354,109,215,150,C.paper,12,C.teal,2)+rect(92,127,175,27,C.mint,3,C.teal,1)+rect(374,127,175,27,C.coral,3,C.teal,1);
  if(s===1)art+=rect(87,122,185,38,C.paper,2,C.muted,1)+rect(369,122,185,38,C.paper,2,C.muted,1)+txt(180,219,'？',39)+txt(462,219,'？',39);
  else art+=poly('125,217 149,174 173,217',C.paper,C.ink,3)+txt(220,205,'待整理',18)+circle(408,199,23,C.paper,C.ink,3)+txt(501,205,'已整理',18);
  art+=txt(320,294,s===1?'盖住颜色后，还能判断吗？':'加入文字＋形状，不只靠颜色',19,C.teal);note='这些是活动约定的标签，不是通用安全标志；不蒙眼或模拟残障。';
 }else if(e.title==='先放入的纸卡先取出'){
  if(s===1){['A1','A2','A3','B1','B2','B3'].forEach((t,i)=>{art+=rect(179+i*8,243-i*24,207,36,i<3?C.mint:C.yellow,4,C.teal,2)+txt(199+i*8,267-i*24,t,17,C.ink,'start')});art+=arrow(464,88,391,125)+txt(485,80,'从上面取',18)+txt(320,297,'A先放入，B后放入',18,C.teal)}else{['A1','A2','A3','B1','B2','B3'].forEach((t,i)=>art+=rect(64+i*87,145,76,69,i<3?C.mint:C.yellow,5,C.teal,2)+txt(102+i*87,188,t,23));art+=arrow(76,238,76,277)+txt(122,279,'前端取',18)+arrow(565,96,565,134)+txt(513,90,'后端放入',18)+txt(320,272,'卡片是流程模型，不用食物',17,C.muted)}
  note='箭头表示放入和取用方向；先观察实际次序，不把模型直接当食品储存建议。';
 }else if(e.title==='纸盒展开后占地方吗'){
  art=poly('107,161 217,121 286,162 176,205',C.paper,C.teal,2)+poly('107,161 176,205 176,263 107,220',C.mint,C.teal,2)+poly('176,205 286,162 286,220 176,263',C.yellow,C.teal,2)+arrow(303,191,350,191)+rect(381,135,192,113,C.paper,3,C.teal,2)+line(429,135,429,248,C.muted,1,'5 4')+line(477,135,477,248,C.muted,1,'5 4')+line(525,135,525,248,C.muted,1,'5 4')+txt(190,294,'立体状态',19)+txt(477,294,'沿原折线折平',19);
  note='形状仅示意；折平可能增加桌面占地，不预设所有收纳指标都会减少。成人操作，不使用刀具。';
 }else return null;
 return{art,label:e.visual?.labels?.[s]||e.steps[s].title,note};
}
function annualScene(e,s,ageBand){
 const young=ageBand==='4-6';
 const specific=specificAnnualScene(e,s);if(specific)return specific;
 const v=e.visual||{},kind=v.kind||'flow',labels=v.labels||e.steps.map(x=>x.title),items=v.items?.length?v.items:e.materials.slice(0,3);
 const short=(i,fallback)=>items[i]||fallback;
 let art='',note='图示表示操作关系，不预设观察结果。';
 const text=e.title+' '+e.steps[s].shortText;
 if((s===1||s===2)&&(['structure','pattern','flow','timeline'].includes(kind)||(['compare','evidence','sort'].includes(kind)&&!v.items?.length)||(kind==='map'&&!/路线|方格|平面图|地图/.test(text))||(kind==='light'&&!/影子|遮挡/.test(text))||(kind==='water'&&!/两杯|两个杯|两只杯|两杯水/.test(e.steps.map(x=>x.detail).join(' ')))||(kind==='measure'&&!/长度|距离|周长|宽度|高度|边长|尺/.test(text))||(kind==='plant'&&!/两株|两盆/.test(e.steps.map(x=>x.detail).join(' ')))))return operationScene(e,s,items);
 const panel=(x,y,w,h,label,fill=C.paper)=>rect(x,y,w,h,fill,12,C.teal,2)+wrappedText(label,x+w/2,y+30,Math.floor(w/18),17);
 if(s===0){
  art=txt(320,93,'先确认对象与材料',20,C.teal);
  const count=Math.min(3,items.length),w=150,gap=28,start=(640-count*w-(count-1)*gap)/2;
  for(let i=0;i<count;i++)art+=panel(start+i*(w+gap),118,w,134,short(i,'观察对象'))+materialGlyph(short(i,'观察对象'),start+i*(w+gap)+w/2,219);
  art+=txt(320,285,young?'成人准备，我指认与选择':'核对材料、条件与安全，再开始',18,C.muted);
 }else if(s===3){
  art=rect(83,88,474,198,C.paper,10,C.teal,2)+txt(115,118,'我的真实记录',20,C.teal,'start')+txt(520,118,'不预填答案',16,C.muted,'end');
  const fields=(e.ageGuides?.[ageBand]?.recordFields||['观察或证据','条件或来源','还不确定']).slice(0,4);
  fields.forEach((f,i)=>{const gap=fields.length>3?35:44;art+=line(104,138+i*gap,536,138+i*gap,C.mint,1)+wrappedText(f,113,155+i*gap,17,13,C.ink,'start',2)+line(367,159+i*gap,519,159+i*gap,C.muted,1,'4 5')});
  note='横线留给自己的观察、计算或证据，不是标准答案。';
 }else if(kind==='timeline'){
  art=txt(320,98,'按证据排列，不凭想象补日期',20,C.teal)+line(85,219,555,219,C.teal,4)+arrow(528,219,555,219,C.teal,4);
  [145,320,495].forEach((x,i)=>{art+=circle(x,219,10,s===2&&i===1?C.coral:C.mint)+line(x,209,x,180,C.teal,2)+panel(x-65,117,130,62,short(i,['证据甲','证据乙','证据丙'][i]))+txt(x,260,'先核对日期',16,C.muted)});
  note='位置表示排列方式，不代表真实年代比例。';
 }else if(kind==='map'){
  art=rect(84,90,472,195,C.paper,8,C.teal,2);
  for(let i=1;i<6;i++)art+=line(84+i*78,90,84+i*78,285,C.mint,1);
  for(let i=1;i<4;i++)art+=line(84,90+i*48,556,90+i*48,C.mint,1);
  art+=rect(133,129,374,117,C.paper,12,C.teal,2)+wrappedText(e.steps[s].shortText,320,161,19,18,C.ink,'middle',4);
  note='方格只提供绘图参照；不代表实际地图、方向、比例或路线。';
 }else if(kind==='evidence'){
  art=panel(66,105,210,130,short(0,'证据或来源甲'))+panel(364,105,210,130,short(1,'证据或来源乙'))+materialGlyph('史料',171,193)+materialGlyph('史料',469,193)+arrow(282,170,355,170,C.muted,2)+txt(320,269,s===1?'分别查看：谁、何时、为什么留下？':'对照：一致处、差异处、缺少什么？',19,C.teal);
  note='并排是对照，不表示两项来源同样可靠。';
 }else if(kind==='pattern'){
  art=txt(320,99,s===1?'按题目摆出关系':'改变一处，再检查规律',21,C.teal);
  const colors=[C.mint,C.coral,C.mint,C.coral];
  for(let i=0;i<4;i++)art+=rect(82+i*121,130,103,90,colors[i],12,C.teal,2)+txt(133+i*121,185,i%2?'B':'A',30,C.ink,'middle',700);
  art+=wrappedText(short(0,'纸片、图形或数的关系'),320,258,27,20)+txt(320,288,'A / B 表示关系占位，请按正文替换',15,C.muted);
  note='AB图是关系示意，不是所有题目的答案。';
 }else if(kind==='plant'){
  art=panel(64,92,214,185,short(0,'观察对象'))+panel(362,92,214,185,short(1,'参照对象'));
  [171,469].forEach(x=>{art+=line(x,242,x,181,C.teal,4)+leaf(x,222,.7,-48)+leaf(x,203,.7,44)+path(`M${x-40} 245 h80 l-10 22 h-60z`,C.coral,C.teal,2)});
  art+=txt(320,297,s===1?'先画下起点，不伤害生命':'保持观察位置与方法一致',17,C.teal);
  note='叶形和数量仅为观察对象图标，不表示生长结果。';
 }else if(kind==='water'){
  art=cup(96,131,154,112,{level:.47,label:'对象 A'})+cup(389,131,154,112,{level:.47,label:'对象 B'})+wrappedText(short(0,'按正文准备'),173,98,13,17)+wrappedText(short(1,'按正文准备'),466,98,13,17)+txt(320,285,s===1?'按步骤确认用量、温度与容器':'只做正文指定动作，不另加材料',18,C.teal);
  if(s===2)art+=arrow(278,182,361,182,C.muted,2)+txt(320,165,'比较',16,C.muted);
  note='水位是容器图标，不代表精确用量；只按正文使用材料。';
 }else if(kind==='light'){
  art=rect(69,138,100,83,C.yellow,12,C.teal,2)+txt(119,186,'光源',22)+rect(312,111,24,142,C.teal,3,C.teal,1)+rect(471,101,83,171,C.paper,4,C.teal,2)+txt(512,294,'观察面',18)+line(176,159,308,159,C.yellow,5)+line(176,201,308,201,C.yellow,5)+arrow(350,181,453,181,C.muted,2)+txt(320,93,s===1?'摆好位置与参照':'改变正文指定条件',20,C.teal);
  note='仅示意光源、物体与观察面；不得直视太阳、激光或强光。';
 }else if(kind==='measure'){
  art=panel(88,91,464,84,short(0,'待测对象'))+rect(98,194,444,40,C.yellow,3,C.teal,2);
  for(let i=0;i<23;i++)art+=line(108+i*19,195,108+i*19,i%5===0?220:210,C.teal,1.5);
  art+=arrow(109,254,530,254,C.teal,2)+txt(320,284,s===1?'对齐参照，确认单位':'重复读数，记录实际值和误差',18,C.teal);
  note='尺子无刻度数值，不表示实际测量值或单位。';
 }else if(kind==='structure'){
  art=book(90,218,130,45,C.mint)+book(420,218,130,45,C.mint)+path('M130 204 L320 121 L510 204','none',C.teal,7)+line(130,204,510,204,C.teal,4)+line(320,121,320,204,C.teal,4)+txt(320,96,'形状与支撑关系示意',20,C.teal)+txt(320,294,s===1?'先确认连接和稳定，再比较':'保持低矮；变形、滑动立即停',17,C.muted);
  note='三角框表示结构思考，不代替正文的装置形状或承载限制。';
 }else if(kind==='sort'){
  art=panel(61,102,223,164,short(0,'类别或对象 A'))+panel(356,102,223,164,short(1,'类别或对象 B'));
  art+=materialGlyph(short(0,'观察对象'),171,211)+materialGlyph(short(1,'观察对象'),469,211);
  art+=txt(320,294,s===1?'先说清分类规则':'检查同一规则能否一致使用',18,C.teal);
  note='小图标提示分类对象，不代表实际对象数量或分类结果。';
 }else if(kind==='compare'){
  art=panel(67,107,213,147,short(0,'条件 A'))+panel(360,107,213,147,short(1,'条件 B'))+materialGlyph(short(0,'观察对象'),173,207)+materialGlyph(short(1,'观察对象'),466,207)+arrow(287,180,352,180,C.muted,2)+txt(320,94,s===1?'哪些保持一样？只改变什么？':'用同一方法观察或比较',20,C.teal)+txt(320,290,'对照不是预先规定谁赢',18,C.muted);
 }else{
  art=panel(55,129,150,109,short(0,'准备对象'))+arrow(213,182,243,182)+panel(247,129,150,109,s===1?'按正文安排':'执行本步动作')+arrow(405,182,435,182)+panel(439,129,150,109,short(1,'核对变化'))+txt(320,98,'按顺序操作，再检查证据',21,C.teal)+txt(320,286,'箭头只表示步骤，不自动表示因果',17,C.muted);
 }
 return {art,label:labels[s]||e.steps[s].title,note};
}
export function renderActivityDiagram(activity,stepIndex=0,ageBand='7-9'){
 const e=activity,s=Math.min(3,Math.max(0,Math.floor(Number(stepIndex)||0)));
 if(e.id<=30)return renderDiagram(e.id,s,ageBand);
 const young=ageBand==='4-6',scene=annualScene(e,s,ageBand),id=`science-diagram-${e.id}-${s}-${++diagramSerial}`;
 return `<svg xmlns="http://www.w3.org/2000/svg" class="science-diagram" viewBox="0 0 640 360" width="640" height="360" role="img" aria-labelledby="${id}-title ${id}-desc" style="display:block;max-width:100%;height:auto;font-family:system-ui,-apple-system,'Noto Sans CJK SC','Microsoft YaHei',sans-serif"><title id="${id}-title">第${e.day}天，第${s+1}步：${esc(e.title)}</title><desc id="${id}-desc">${esc(e.steps[s].detail)} ${esc(scene.note)} ${esc(e.ageGuides[ageBand].steps[s].caption)}</desc>${rect(0,0,640,360,C.cream,0,'none',0)}${wrappedText(e.title+' · 操作关系图',25,35,25,21,C.ink,'start',1)}${txt(610,36,`${s+1} / 4`,22,C.teal,'end')}${line(24,58,616,58,'#DDE5D9',1.5)}${scene.art}${rect(0,307,640,53,'#E9EFE4',0,'none',0)}${wrappedText(scene.label,320,338,29,21,C.ink,'middle',1)}</svg>`;
}
