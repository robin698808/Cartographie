// Routage orthogonal des flux (A* sur grille) et placement d'étiquettes sans chevauchement.
const DX=[1,0,-1,0];
const DY=[0,1,0,-1];

function Heap(){this.k=[];this.v=[];}
Heap.prototype.push=function(key,val){
  const k=this.k,v=this.v;let i=k.length;k.push(key);v.push(val);
  while(i>0){const p=(i-1)>>1;if(k[p]<=k[i])break;[k[p],k[i]]=[k[i],k[p]];[v[p],v[i]]=[v[i],v[p]];i=p;}
};
Heap.prototype.pop=function(){
  const k=this.k,v=this.v;const top=v[0];const lk=k.pop(),lv=v.pop();
  if(k.length){k[0]=lk;v[0]=lv;let i=0;const n=k.length;
    for(;;){let l=2*i+1,r=l+1,m=i;if(l<n&&k[l]<k[m])m=l;if(r<n&&k[r]<k[m])m=r;if(m===i)break;[k[m],k[i]]=[k[i],k[m]];[v[m],v[i]]=[v[i],v[m]];i=m;}}
  return top;
};
Heap.prototype.size=function(){return this.k.length;};

const sideOf=(a,b)=>{
  const dx=b.x+b.w/2-(a.x+a.w/2),dy=b.y+b.h/2-(a.y+a.h/2);
  const nx=Math.abs(dx)/((a.w+b.w)/2),ny=Math.abs(dy)/((a.h+b.h)/2);
  if(nx>=ny)return dx>=0?0:2;
  return dy>=0?1:3;
};

export function straightFlowPath(source, target, cards, pad=3) {
  if (!source || !target || source.id === target.id) return null;
  const sx=source.x+source.w/2,sy=source.y+source.h/2;
  const tx=target.x+target.w/2,ty=target.y+target.h/2;
  const dx=tx-sx,dy=ty-sy;
  if (dx===0 && dy===0) return null;
  const edge=(c,x,y,vx,vy)=>{
    const scale=Math.min(vx===0?Infinity:c.w/2/Math.abs(vx),vy===0?Infinity:c.h/2/Math.abs(vy));
    return {x:x+vx*scale,y:y+vy*scale};
  };
  const from=edge(source,sx,sy,dx,dy),to=edge(target,tx,ty,-dx,-dy);
  if ((to.x-from.x)*dx+(to.y-from.y)*dy<=0) return null;
  const intersects=(card)=>{
    let low=0,high=1;
    for (const [start,delta,min,max] of [
      [from.x,to.x-from.x,card.x-pad,card.x+card.w+pad],
      [from.y,to.y-from.y,card.y-pad,card.y+card.h+pad],
    ]) {
      if (delta===0) {
        if (start<min || start>max) return false;
      } else {
        const a=(min-start)/delta,b=(max-start)/delta;
        low=Math.max(low,Math.min(a,b));high=Math.min(high,Math.max(a,b));
        if (low>high) return false;
      }
    }
    return true;
  };
  return cards.some(c=>c.id!==source.id && c.id!==target.id && intersects(c)) ? null : [from,to];
}

/**
 * cards: [{id,x,y,w,h}], links: [{id,from,to}]
 * Retourne {paths:{[linkId]:[{x,y}...]|null}}; chaque chemin est une polyligne orthogonale
 * qui contourne les cartes et se répartit sur des couloirs parallèles.
 */
export function routeFlows(cards,links,opts){
  const o=Object.assign({pad:3,margin:160,maxCells:110000,minCell:9,turn:5,cong:3,crossing:12,maxExpand:350000},opts);
  const paths={};
  if(!cards.length||!links.length)return{paths:paths};
  const byId=new Map(cards.map(c=>[c.id,c]));
  let minX=Infinity,minY=Infinity,maxX=-Infinity,maxY=-Infinity;
  cards.forEach(c=>{minX=Math.min(minX,c.x);minY=Math.min(minY,c.y);maxX=Math.max(maxX,c.x+c.w);maxY=Math.max(maxY,c.y+c.h);});
  minX-=o.margin;minY-=o.margin;maxX+=o.margin;maxY+=o.margin;
  const W=maxX-minX,H=maxY-minY;
  const G=Math.max(o.minCell,Math.ceil(Math.sqrt(W*H/o.maxCells)));
  const cols=Math.ceil(W/G)+1,rows=Math.ceil(H/G)+1,N=cols*rows;
  const ccx=c=>minX+c*G+G/2,ccy=r=>minY+r*G+G/2;
  const blocked=new Uint8Array(N);
  cards.forEach(c=>{
    const c0=Math.max(0,Math.floor((c.x-o.pad-minX)/G)),c1=Math.min(cols-1,Math.ceil((c.x+c.w+o.pad-minX)/G));
    const r0=Math.max(0,Math.floor((c.y-o.pad-minY)/G)),r1=Math.min(rows-1,Math.ceil((c.y+c.h+o.pad-minY)/G));
    for(let r=r0;r<=r1;r++)for(let cc=c0;cc<=c1;cc++){
      const x=ccx(cc),y=ccy(r);
      if(x>c.x-o.pad&&x<c.x+c.w+o.pad&&y>c.y-o.pad&&y<c.y+c.h+o.pad)blocked[r*cols+cc]=1;
    }
  });

  // Ports: répartition des extrémités le long de chaque côté de carte.
  const valid=links.filter(l=>l.from!==l.to&&byId.has(l.from)&&byId.has(l.to));
  const portGroups={};
  const ends=valid.map(l=>{
    const a=byId.get(l.from),b=byId.get(l.to);
    return{link:l,sS:sideOf(a,b),sT:sideOf(b,a),a:a,b:b};
  });
  ends.forEach(e=>{
    [["s",e.a,e.sS,e.b],["t",e.b,e.sT,e.a]].forEach(it=>{
      const key=it[1].id+"|"+it[2];
      const other=it[3];
      const along=(it[2]%2===0)?other.y+other.h/2:other.x+other.w/2;
      (portGroups[key]=portGroups[key]||[]).push({e:e,end:it[0],along:along});
    });
  });
  const portMargin=Math.max(10,G);
  Object.keys(portGroups).forEach(key=>{
    const list=portGroups[key].sort((p,q)=>p.along-q.along);
    list.forEach((p,i)=>{p.t=(i+1)/(list.length+1);});
  });
  const mkPort=(card,side,t)=>{
    let col,row,ex,ey;
    if(side===0||side===2){
      const lo=card.y+portMargin,hi=card.y+card.h-portMargin;
      const py=hi>lo?lo+(hi-lo)*t:card.y+card.h/2;
      row=Math.floor((py-minY)/G);
      col=side===0?Math.floor((card.x+card.w+o.pad-minX)/G)+1:Math.floor((card.x-o.pad-minX)/G)-1;
      ey=ccy(row);ex=side===0?card.x+card.w:card.x;
    }else{
      const lo=card.x+portMargin,hi=card.x+card.w-portMargin;
      const px=hi>lo?lo+(hi-lo)*t:card.x+card.w/2;
      col=Math.floor((px-minX)/G);
      row=side===1?Math.floor((card.y+card.h+o.pad-minY)/G)+1:Math.floor((card.y-o.pad-minY)/G)-1;
      ex=ccx(col);ey=side===1?card.y+card.h:card.y;
    }
    col=Math.max(0,Math.min(cols-1,col));row=Math.max(0,Math.min(rows-1,row));
    // Avance vers l'extérieur jusqu'à une cellule libre (cartes voisines très proches).
    const sx=side===0?1:side===2?-1:0,sy=side===1?1:side===3?-1:0;
    for(let k=0;k<8&&blocked[row*cols+col];k++){
      const nc=col+sx,nr=row+sy;
      if(nc<0||nr<0||nc>=cols||nr>=rows)break;
      col=nc;row=nr;
    }
    return{cell:row*cols+col,col:col,row:row,ex:ex,ey:ey};
  };
  ends.forEach(e=>{
    const ps=portGroups[e.a.id+"|"+e.sS].find(p=>p.e===e&&p.end==="s");
    const pt=portGroups[e.b.id+"|"+e.sT].find(p=>p.e===e&&p.end==="t");
    e.ps=mkPort(e.a,e.sS,ps.t);e.pt=mkPort(e.b,e.sT,pt.t);
  });

  // Align facing ports when a clear shared grid line exists, without reusing another port.
  const portUsage=new Map();
  const portKey=(card,side,port)=>card.id+"|"+side+"|"+(side%2===0?port.row:port.col);
  const countPort=(key,delta)=>{
    const n=(portUsage.get(key)||0)+delta;
    if(n)portUsage.set(key,n);else portUsage.delete(key);
  };
  ends.forEach(e=>{countPort(portKey(e.a,e.sS,e.ps),1);countPort(portKey(e.b,e.sT,e.pt),1);});
  ends.forEach(e=>{
    const horizontal=(e.sS===0&&e.sT===2&&e.a.x+e.a.w<=e.b.x)||(e.sS===2&&e.sT===0&&e.b.x+e.b.w<=e.a.x);
    const vertical=(e.sS===1&&e.sT===3&&e.a.y+e.a.h<=e.b.y)||(e.sS===3&&e.sT===1&&e.b.y+e.b.h<=e.a.y);
    if(!horizontal&&!vertical)return;
    const s=e.ps,t=e.pt;
    const lo=horizontal?Math.max(e.a.y,e.b.y)+portMargin:Math.max(e.a.x,e.b.x)+portMargin;
    const hi=horizontal?Math.min(e.a.y+e.a.h,e.b.y+e.b.h)-portMargin:Math.min(e.a.x+e.a.w,e.b.x+e.b.w)-portMargin;
    const origin=horizontal?minY:minX,limit=horizontal?rows:cols;
    const first=Math.max(0,Math.ceil((lo-origin-G/2)/G));
    const last=Math.min(limit-1,Math.floor((hi-origin-G/2)/G));
    const preferred=horizontal?(s.row+t.row)/2:(s.col+t.col)/2;
    const candidates=[];
    for(let i=first;i<=last;i++)candidates.push(i);
    candidates.sort((a,b)=>Math.abs(a-preferred)-Math.abs(b-preferred));
    const oldS=portKey(e.a,e.sS,s),oldT=portKey(e.b,e.sT,t);
    for(const i of candidates){
      const newS=horizontal?{...s,row:i,ey:ccy(i),cell:i*cols+s.col}:{...s,col:i,ex:ccx(i),cell:s.row*cols+i};
      const newT=horizontal?{...t,row:i,ey:ccy(i),cell:i*cols+t.col}:{...t,col:i,ex:ccx(i),cell:t.row*cols+i};
      const keyS=portKey(e.a,e.sS,newS),keyT=portKey(e.b,e.sT,newT);
      if((portUsage.get(keyS)||0)-(keyS===oldS?1:0)>0||(portUsage.get(keyT)||0)-(keyT===oldT?1:0)>0)continue;
      const start=horizontal?Math.min(s.ex,t.ex):Math.min(s.ey,t.ey);
      const end=horizontal?Math.max(s.ex,t.ex):Math.max(s.ey,t.ey);
      const axis=horizontal?newS.ey:newS.ex;
      const clear=!cards.some(c=>c.id!==e.a.id&&c.id!==e.b.id&&(
        horizontal
          ? axis>c.y-o.pad&&axis<c.y+c.h+o.pad&&start<c.x+c.w+o.pad&&end>c.x-o.pad
          : axis>c.x-o.pad&&axis<c.x+c.w+o.pad&&start<c.y+c.h+o.pad&&end>c.y-o.pad
      ));
      if(!clear)continue;
      countPort(oldS,-1);countPort(oldT,-1);
      e.ps=newS;e.pt=newT;
      e.direct=horizontal?"horizontal":"vertical";
      countPort(keyS,1);countPort(keyT,1);
      break;
    }
  });

  const g=new Float32Array(N*4),closed=new Uint8Array(N*4),parent=new Int32Array(N*4),usage=new Uint8Array(N),directions=new Uint8Array(N);
  const order=ends.slice().sort((p,q)=>(Math.abs(p.ps.col-p.pt.col)+Math.abs(p.ps.row-p.pt.row))-(Math.abs(q.ps.col-q.pt.col)+Math.abs(q.ps.row-q.pt.row)));

  order.forEach(e=>{
    const s=e.ps,t=e.pt;
    if(e.direct){
      const horizontal=e.direct==="horizontal";
      const start=horizontal?Math.min(s.ex,t.ex):Math.min(s.ey,t.ey);
      const end=horizontal?Math.max(s.ex,t.ex):Math.max(s.ey,t.ey);
      const origin=horizontal?minX:minY,limit=horizontal?cols:rows;
      const first=Math.max(0,Math.ceil((start-origin-G/2)/G));
      const last=Math.min(limit-1,Math.floor((end-origin-G/2)/G));
      const cells=[];
      for(let i=first;i<=last;i++){
        const cell=horizontal?s.row*cols+i:i*cols+s.col;
        if(!blocked[cell])cells.push(cell);
      }
      if(cells.every(cell=>usage[cell]===0)){
        cells.forEach(cell=>{usage[cell]=1;directions[cell]|=horizontal?1:2;});
        paths[e.link.id]=[{x:s.ex,y:s.ey},{x:t.ex,y:t.ey}];
        return;
      }
    }
    const sb=blocked[s.cell],tb=blocked[t.cell];
    blocked[s.cell]=0;blocked[t.cell]=0;
    g.fill(Infinity);closed.fill(0);
    const heap=new Heap();
    const h=cell=>Math.abs((cell%cols)-t.col)+Math.abs(Math.floor(cell/cols)-t.row);
    const startIdx=s.cell*4+e.sS;
    g[startIdx]=0;parent[startIdx]=-1;heap.push(h(s.cell),startIdx);
    let found=-1,expanded=0;
    while(heap.size()){
      const idx=heap.pop();
      if(closed[idx])continue;
      closed[idx]=1;
      const cell=idx>>2,d=idx&3;
      if(cell===t.cell){found=idx;break;}
      if(++expanded>o.maxExpand)break;
      const cc=cell%cols,cr=(cell-cc)/cols;
      for(let nd=0;nd<4;nd++){
        if(nd===((d+2)&3))continue;
        const nc=cc+DX[nd],nr=cr+DY[nd];
        if(nc<0||nr<0||nc>=cols||nr>=rows)continue;
        const ncell=nr*cols+nc;
        if(blocked[ncell])continue;
        const nidx=ncell*4+nd;
        if(closed[nidx])continue;
        const axis=nd%2===0?1:2;
        const crosses=(directions[ncell]&(axis===1?2:1))!==0;
        const ng=g[idx]+1+usage[ncell]*o.cong+(crosses?o.crossing:0)+(nd!==d?o.turn:0);
        if(ng<g[nidx]){g[nidx]=ng;parent[nidx]=idx;heap.push(ng+h(ncell),nidx);}
      }
    }
    blocked[s.cell]=sb;blocked[t.cell]=tb;
    if(found<0){paths[e.link.id]=null;return;}
    const cells=[];
    for(let idx=found;idx>=0;idx=parent[idx])cells.push(idx);
    cells.reverse();
    const pts=[{x:s.ex,y:s.ey}];
    let prevDir=-1;
    cells.forEach((idx,i)=>{
      const cell=idx>>2,d=idx&3;
      usage[cell]=Math.min(255,usage[cell]+1);
      directions[cell]|=d%2===0?1:2;
      if(i+1<cells.length)directions[cell]|=(cells[i+1]&3)%2===0?1:2;
      const cc=cell%cols,cr=(cell-cc)/cols;
      const isEnd=i===cells.length-1;
      if(i===0||isEnd||d!==(cells[i+1]&3)){pts.push({x:ccx(cc),y:ccy(cr)});}
      prevDir=d;
    });
    void prevDir;
    pts.push({x:t.ex,y:t.ey});
    // Supprime les points alignés redondants.
    const out=[pts[0]];
    for(let i=1;i<pts.length-1;i++){
      const a=out[out.length-1],b=pts[i],c=pts[i+1];
      if((a.x===b.x&&b.x===c.x)||(a.y===b.y&&b.y===c.y))continue;
      out.push(b);
    }
    out.push(pts[pts.length-1]);
    paths[e.link.id]=out;
  });
  return{paths:paths};
}

export function pathToD(pts,radius){
  const r0=radius==null?8:radius;
  if(!pts||pts.length<2)return"";
  let d="M"+pts[0].x+" "+pts[0].y;
  for(let i=1;i<pts.length-1;i++){
    const p=pts[i-1],c=pts[i],n=pts[i+1];
    const l1=Math.hypot(c.x-p.x,c.y-p.y),l2=Math.hypot(n.x-c.x,n.y-c.y);
    const r=Math.min(r0,l1/2,l2/2);
    if(r<1){d+=" L"+c.x+" "+c.y;continue;}
    d+=" L"+(c.x-(c.x-p.x)/l1*r)+" "+(c.y-(c.y-p.y)/l1*r)+" Q"+c.x+" "+c.y+" "+(c.x+(n.x-c.x)/l2*r)+" "+(c.y+(n.y-c.y)/l2*r);
  }
  d+=" L"+pts[pts.length-1].x+" "+pts[pts.length-1].y;
  return d;
}

const overlap=(a,b,m)=>a.x-m<b.x+b.w&&a.x+a.w+m>b.x&&a.y-m<b.y+b.h&&a.y+a.h+m>b.y;

function segmentIntersectsRect(a,b,rect){
  let lo=0,hi=1;
  for(const [p,d,min,max] of [[a.x,b.x-a.x,rect.x,rect.x+rect.w],[a.y,b.y-a.y,rect.y,rect.y+rect.h]]){
    if(d===0){if(p<min||p>max)return false;}
    else{const x=(min-p)/d,y=(max-p)/d;lo=Math.max(lo,Math.min(x,y));hi=Math.min(hi,Math.max(x,y));if(lo>hi)return false;}
  }
  return true;
}

// Utilise l'enveloppe convexe de chaque courbe pour préserver les obstacles.
export function curvedFlowPath(points,cards,sourceId,targetId){
  if(!points||points.length<2)return {d:"",points:[]};
  const samples=[points[0]];
  let d="M"+points[0].x+" "+points[0].y;
  const line=p=>{d+=" L"+p.x+" "+p.y;samples.push(p);};
  const clear=(a,c,b,ignoreEndpoints=false)=>{
    const minX=Math.min(a.x,b.x,c.x),maxX=Math.max(a.x,b.x,c.x);
    const minY=Math.min(a.y,b.y,c.y),maxY=Math.max(a.y,b.y,c.y);
    return !cards.some(card=>{
      if(ignoreEndpoints&&(card.id===sourceId||card.id===targetId))return false;
      return minX<card.x+card.w+3&&maxX>card.x-3&&minY<card.y+card.h+3&&maxY>card.y-3;
    });
  };
  const curve=(a,c,b)=>{
    d+=" Q"+c.x+" "+c.y+" "+b.x+" "+b.y;
    for(let i=1;i<=4;i++){
      const t=i/4,u=1-t;
      samples.push({x:u*u*a.x+2*u*t*c.x+t*t*b.x,y:u*u*a.y+2*u*t*c.y+t*t*b.y});
    }
  };
  if(points.length===2){
    const a=points[0],b=points[1],dx=b.x-a.x,dy=b.y-a.y,length=Math.hypot(dx,dy);
    if(length>0&&(dx===0||dy===0)){
      for(const side of [1,-1]){
        const offset=Math.min(48,length/5)*side;
        const control={x:(a.x+b.x)/2-dy/length*offset,y:(a.y+b.y)/2+dx/length*offset};
        if(clear(a,control,b,true)){curve(a,control,b);return {d,points:samples};}
      }
    }
    line(b);
    return {d,points:samples};
  }
  for(let i=1;i<points.length-1;i++){
    const p=points[i-1],c=points[i],n=points[i+1];
    const l1=Math.hypot(c.x-p.x,c.y-p.y),l2=Math.hypot(n.x-c.x,n.y-c.y);
    let r=Math.min(80,l1/2,l2/2),a,b;
    while(r>=2){
      a={x:c.x-(c.x-p.x)/l1*r,y:c.y-(c.y-p.y)/l1*r};
      b={x:c.x+(n.x-c.x)/l2*r,y:c.y+(n.y-c.y)/l2*r};
      if(clear(a,c,b))break;
      r/=2;
    }
    if(r<2)line(c);
    else{line(a);curve(a,c,b);}
  }
  line(points[points.length-1]);
  return {d,points:samples};
}

/**
 * specs: [{id,w,h}] (dimensions en unités canvas), cards: [{x,y,w,h}].
 * Les étiquettes restent sur le tracé, même lorsqu'un chevauchement est inévitable.
 */
export function placeLabels(paths,specs,cards,options={}){
  const segs=[];
  Object.keys(paths).forEach(id=>{
    const p=paths[id];if(!p)return;
    for(let i=0;i<p.length-1;i++){
      const a=p[i],b=p[i+1];
      segs.push({id:String(id),a,b,x1:Math.min(a.x,b.x),x2:Math.max(a.x,b.x),y1:Math.min(a.y,b.y),y2:Math.max(a.y,b.y)});
    }
  });
  const len=id=>{const p=paths[id];let L=0;if(p)for(let i=0;i<p.length-1;i++)L+=Math.abs(p[i+1].x-p[i].x)+Math.abs(p[i+1].y-p[i].y);return L;};
  const order=specs.slice().sort((a,b)=>len(a.id)-len(b.id));
  const placed=[],out={};
  order.forEach(sp=>{
    const p=paths[sp.id];if(!p)return;
    const cands=[];
    for(let i=0;i<p.length-1;i++){
      const a=p[i],b=p[i+1];
      const horiz=a.y===b.y;
      const L=Math.abs(b.x-a.x)+Math.abs(b.y-a.y);
      const length=Math.hypot(b.x-a.x,b.y-a.y);
      const inset=length?Math.min(0.5,24/length):0.5;
      (options.verticesOnly?[0,1]:[0.5,0.3,0.7,0.15,0.85]).forEach(candidate=>{
        const t=options.verticesOnly?candidate:Math.max(inset,Math.min(1-inset,candidate));
        const x=a.x+(b.x-a.x)*t,y=a.y+(b.y-a.y)*t;
        const base=(horiz?0:6)+(L<(horiz?sp.w:sp.h)?40:0)+Math.abs(t-0.5)*10-Math.min(L,500)/100;
        cands.push({x:x,y:y,base:base});
      });
    }
    let best=null;
    cands.forEach(c=>{
      const r={x:c.x-sp.w/2,y:c.y-sp.h/2,w:sp.w,h:sp.h};
      let score=c.base;
      placed.forEach(q=>{if(overlap(r,q,4))score+=10000;});
      cards.forEach(cd=>{if(overlap(r,cd,2))score+=10000;});
      segs.forEach(s=>{
        if(s.id===String(sp.id))return;
        if(s.x1>r.x+r.w||s.x2<r.x||s.y1>r.y+r.h||s.y2<r.y)return;
        if(segmentIntersectsRect(s.a,s.b,r))score+=250;
      });
      if(!best||score<best.score)best={...c,score:score,r:r};
    });
    if(best){out[sp.id]={x:best.x,y:best.y};placed.push(best.r);}
  });
  return out;
}

export function flowLabelSpec(flow, fontSize, zoom) {
  const text=flow.label||'Flux';
  const scale=Math.min(1/Math.max(0.08,zoom),1.6);
  const font=Math.max(8,fontSize);
  return {id:flow.id,w:Math.max(60,text.length*font*0.55+16)*scale,h:font*1.5*scale};
}

export function evaluateFlowLayout(cards, flows, fontSize, zoom, flowShape='default') {
  const byId=new Map(cards.map(c=>[c.id,c]));
  const valid=flows.filter(f=>byId.has(f.from)&&byId.has(f.to)&&f.from!==f.to);
  const paths=routeFlows(cards,valid.map(f=>({id:f.id,from:f.from,to:f.to}))).paths;
  let straightFallbacks=0;
  valid.forEach(f=>{
    if(f.routeStyle==='straight'){
      const straight=straightFlowPath(byId.get(f.from),byId.get(f.to),cards);
      if(straight)paths[f.id]=straight;
      else straightFallbacks++;
    }
    if(flowShape==='curved'&&paths[f.id])paths[f.id]=curvedFlowPath(paths[f.id],cards,f.from,f.to).points;
  });
  const specs=valid.filter(f=>paths[f.id]).map(f=>flowLabelSpec(f,fontSize,zoom));
  const labels=placeLabels(paths,specs,cards,{verticesOnly:flowShape==='curved'});
  const rects=specs.filter(s=>labels[s.id]).map(s=>({id:s.id,x:labels[s.id].x-s.w/2,y:labels[s.id].y-s.h/2,w:s.w,h:s.h}));
  let labelOverlaps=0,cardOverlaps=0,flowOverlaps=0,flowCrossings=0;
  rects.forEach((rect,i)=>{
    for(let j=0;j<i;j++)if(overlap(rect,rects[j],0))labelOverlaps++;
    cards.forEach(card=>{if(overlap(rect,card,0))cardOverlaps++;});
    Object.entries(paths).forEach(([id,points])=>{
      if(String(id)===String(rect.id)||!points)return;
      for(let j=1;j<points.length;j++){
        if(segmentIntersectsRect(points[j-1],points[j],rect)){flowOverlaps++;break;}
      }
    });
  });
  const activePaths=Object.values(paths).filter(Boolean);
  const crosses=(a,b,c,d)=>{
    const rx=b.x-a.x,ry=b.y-a.y,sx=d.x-c.x,sy=d.y-c.y;
    const cross=rx*sy-ry*sx,qx=c.x-a.x,qy=c.y-a.y;
    if(Math.abs(cross)<1e-8){
      if(Math.abs(qx*ry-qy*rx)>1e-8)return false;
      const length=rx*rx+ry*ry;
      if(length<1e-8)return false;
      const t0=(qx*rx+qy*ry)/length,t1=t0+(sx*rx+sy*ry)/length;
      return Math.min(1,Math.max(t0,t1))-Math.max(0,Math.min(t0,t1))>1e-6;
    }
    const t=(qx*sy-qy*sx)/cross,u=(qx*ry-qy*rx)/cross;
    return t>=0&&t<=1&&u>=0&&u<=1&&!((t<1e-6||t>1-1e-6)&&(u<1e-6||u>1-1e-6));
  };
  for(let i=0;i<activePaths.length;i++)for(let j=0;j<i;j++){
    const a=activePaths[i],b=activePaths[j];
    let found=false;
    for(let k=1;k<a.length&&!found;k++)for(let l=1;l<b.length;l++){
      if(crosses(a[k-1],a[k],b[l-1],b[l])){found=true;break;}
    }
    if(found)flowCrossings++;
  }
  return {unrouted:flows.length-valid.length+valid.filter(f=>!paths[f.id]).length,labelOverlaps,cardOverlaps,flowOverlaps,flowCrossings,straightFallbacks};
}
