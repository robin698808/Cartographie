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
