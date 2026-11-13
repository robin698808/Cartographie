export function centralSlots(count, columns) {
  const rows=Math.ceil(count/columns);
  return Array.from({length:count},(_,index)=>index).sort((a,b)=>{
    const distance=index=>Math.abs(index%columns-(columns-1)/2)+Math.abs(Math.floor(index/columns)-(rows-1)/2);
    return distance(a)-distance(b)||a-b;
  });
}

export function placeMostConnectedFirst(items, columns, connections) {
  const sorted=items.slice().sort((a,b)=>(connections[b.id]||0)-(connections[a.id]||0)||String(a.id).localeCompare(String(b.id)));
  const result=new Array(items.length);
  centralSlots(items.length,columns).forEach((slot,index)=>{result[slot]=sorted[index];});
  return result;
}

export function gridOffsets(items, columns, width, height, gapX, gapY, connections, densityFactor) {
  const rows=Math.ceil(items.length/columns);
  const colDegree=new Array(columns).fill(0),rowDegree=new Array(rows).fill(0);
  items.forEach((item,index)=>{
    const degree=connections[item.id]||0;
    colDegree[index%columns]=Math.max(colDegree[index%columns],degree);
    rowDegree[Math.floor(index/columns)]=Math.max(rowDegree[Math.floor(index/columns)],degree);
  });
  const offsets=(count,size,gap,degrees)=>{
    const result=[0];
    for(let i=1;i<count;i++)result.push(result[i-1]+size+gap+densityFactor*Math.max(degrees[i-1],degrees[i]));
    return result;
  };
  const x=offsets(columns,width,gapX,colDegree),y=offsets(rows,height,gapY,rowDegree);
  return {x,y,w:x[columns-1]+width,h:y[rows-1]+height};
}

export function repositionFixedBounds(original, content) {
  const width=original.x2-original.x1,height=original.y2-original.y1;
  if(content.x2-content.x1>width+1e-6||content.y2-content.y1>height+1e-6)return null;
  const x1=(content.x1+content.x2-width)/2,y1=(content.y1+content.y2-height)/2;
  return {x1,y1,x2:x1+width,y2:y1+height};
}

export function preserveDomainSize(original, pad, content) {
  const width=original.x2-original.x1+pad.w,height=original.y2-original.y1+pad.h;
  const newWidth=content.x2-content.x1,newHeight=content.y2-content.y1;
  if(newWidth>width+1e-6||newHeight>height+1e-6)return null;
  return {w:Math.max(0,width-newWidth),h:Math.max(0,height-newHeight)};
}

export const DEFAULT_LAYOUT_SPACING={app:2,domain:44,category:30};

export function compactLayoutEligible(flowCount, appSpacing, domainSpacing, categorySpacing) {
  return flowCount<=120&&appSpacing===DEFAULT_LAYOUT_SPACING.app&&domainSpacing===DEFAULT_LAYOUT_SPACING.domain&&categorySpacing===DEFAULT_LAYOUT_SPACING.category;
}

export function denseDefaultSizes(enabled, app, domain, scale, flow, thickness) {
  return {
    app:enabled&&app===1.6?2.8:app,
    domain:enabled&&domain===1.5?3:domain,
    scale:enabled&&scale===1?1.5:scale,
    flow:enabled&&flow===13?32:flow,
    thickness:enabled&&thickness===2?3.5:thickness,
  };
}

export function compactLayoutAcceptable(base, candidate) {
  const limit=(value)=>value+Math.max(2,Math.floor(value*0.1));
  return candidate.area<=base.area*0.9&&candidate.zoneOverlaps<=base.zoneOverlaps&&
    candidate.report.unrouted<=base.report.unrouted&&candidate.report.cardOverlaps<=base.report.cardOverlaps&&
    candidate.report.labelOverlaps<=limit(base.report.labelOverlaps)&&
    candidate.report.flowOverlaps<=limit(base.report.flowOverlaps)&&
    candidate.report.flowCrossings<=limit(base.report.flowCrossings)&&
    candidate.report.straightFallbacks<=base.report.straightFallbacks;
}

export function optimizedSpacing({cardWidth,cardHeight,flowFontSize,hasFlows,appSpacing,domainSpacing,categorySpacing,domainPadding,domainHeader,categorySide,categoryTop,categoryBottom,categoryBar,domainInsetX,domainInsetY,compact=false,labelHeight=0,hasCategories=true}) {
  const corridorX=Math.max(labelHeight,compact?Math.max(24,cardWidth*0.08,hasFlows?flowFontSize*1.5:0):Math.max(40,cardWidth*0.15,hasFlows?flowFontSize*2:0));
  const corridorY=Math.max(labelHeight,compact?Math.max(24,cardHeight*0.15,hasFlows?flowFontSize*1.5:0):Math.max(40,cardHeight*0.3,hasFlows?flowFontSize*2:0));
  return {
    appX:Math.ceil(Math.max(18+appSpacing,corridorX)),
    appY:Math.ceil(Math.max(14+appSpacing,corridorY)),
    categoryX:Math.ceil(Math.max(categorySpacing+appSpacing,2*categorySide+corridorX)),
    categoryY:Math.ceil(Math.max(categorySpacing+28+appSpacing,categoryTop+categoryBar+categoryBottom+corridorY)),
    domainX:Math.ceil(Math.max(70,domainSpacing,2*domainPadding+corridorX-domainInsetX,hasCategories?2*categorySide+corridorX-domainInsetX:0)),
    domainY:Math.ceil(Math.max(70,domainSpacing,2*domainPadding+domainHeader+corridorY-domainInsetY,hasCategories?categoryTop+categoryBar+categoryBottom+corridorY-domainInsetY:0)),
  };
}

export function fitBounds(bounds, width, height, padding=40) {
  const availableWidth=Math.max(1,width-2*padding),availableHeight=Math.max(1,height-2*padding);
  const zoom=Math.min(1.5,availableWidth/Math.max(1,bounds.x2-bounds.x1),availableHeight/Math.max(1,bounds.y2-bounds.y1));
  return {zoom,offset:{x:width/2-(bounds.x1+bounds.x2)/2*zoom,y:height/2-(bounds.y1+bounds.y2)/2*zoom}};
}
