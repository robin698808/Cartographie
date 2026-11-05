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

/**
 * cards: [{id,x,y,w,h}], links: [{id,from,to}]
 * Retourne {paths:{[linkId]:[{x,y}...]|null}}; chaque chemin est une polyligne orthogonale
 * qui contourne les cartes et se répartit sur des couloirs parallèles.
 */
export function routeFlows(cards,links,opts){
  const o=Object.assign({pad:3,margin:160,maxCells:110000,minCell:9,turn:5,cong:3,maxExpand:350000},opts);
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

  const g=new Float32Array(N*4),closed=new Uint8Array(N*4),parent=new Int32Array(N*4),usage=new Uint8Array(N);
  const order=ends.slice().sort((p,q)=>(Math.abs(p.ps.col-p.pt.col)+Math.abs(p.ps.row-p.pt.row))-(Math.abs(q.ps.col-q.pt.col)+Math.abs(q.ps.row-q.pt.row)));

  order.forEach(e=>{
    const s=e.ps,t=e.pt;
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
        const ng=g[idx]+1+usage[ncell]*o.cong+(nd!==d?o.turn:0);
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

/**
 * specs: [{id,w,h}] (dimensions en unités canvas), cards: [{x,y,w,h}].
 * Retourne {[id]:{x,y}} (centre de l'étiquette) en évitant les autres étiquettes, les cartes et les autres flux.
 */
export function placeLabels(paths,specs,cards){
  const segs=[];
  Object.keys(paths).forEach(id=>{
    const p=paths[id];if(!p)return;
    for(let i=0;i<p.length-1;i++)segs.push({id:String(id),x1:Math.min(p[i].x,p[i+1].x),y1:Math.min(p[i].y,p[i+1].y),x2:Math.max(p[i].x,p[i+1].x),y2:Math.max(p[i].y,p[i+1].y)});
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
      [0.5,0.3,0.7,0.15,0.85].forEach(t=>{
        cands.push({x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t,base:(horiz?0:6)+(L<(horiz?sp.w:sp.h)?40:0)+Math.abs(t-0.5)*10-Math.min(L,500)/100});
      });
    }
    let best=null;
    cands.forEach(c=>{
      const r={x:c.x-sp.w/2,y:c.y-sp.h/2,w:sp.w,h:sp.h};
      let score=c.base;
      placed.forEach(q=>{if(overlap(r,q,4))score+=1000;});
      cards.forEach(cd=>{if(overlap(r,cd,2))score+=1000;});
      segs.forEach(s=>{
        if(s.id===String(sp.id))return;
        if(s.x1<=r.x+r.w&&s.x2>=r.x&&s.y1<=r.y+r.h&&s.y2>=r.y)score+=25;
      });
      if(!best||score<best.score)best={score:score,x:c.x,y:c.y,r:r};
    });
    if(best){out[sp.id]={x:best.x,y:best.y};placed.push(best.r);}
  });
  return out;
}
