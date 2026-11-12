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

export function optimizedFontSizes(fontScale, categoryScale, zoom) {
  const clamp=(value,min,max)=>Math.round(Math.max(min,Math.min(max,value))*10)/10;
  const scale=Math.max(0.01,zoom);
  return {
    app:clamp(16/(15*fontScale*scale),0.8,6),
    domain:clamp(16/(13*fontScale*scale),0.8,6),
    category:clamp(16/(13*fontScale*categoryScale*scale),0.8,6),
    flow:Math.max(8,Math.min(96,Math.ceil(14/(scale*Math.min(1/scale,1.6))))),
  };
}

export function fitBounds(bounds, width, height, padding=40) {
  const availableWidth=Math.max(1,width-2*padding),availableHeight=Math.max(1,height-2*padding);
  const zoom=Math.min(1.5,availableWidth/Math.max(1,bounds.x2-bounds.x1),availableHeight/Math.max(1,bounds.y2-bounds.y1));
  return {zoom,offset:{x:width/2-(bounds.x1+bounds.x2)/2*zoom,y:height/2-(bounds.y1+bounds.y2)/2*zoom}};
}
