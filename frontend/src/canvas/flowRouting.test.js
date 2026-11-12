import { test } from 'node:test';
import assert from 'node:assert/strict';
import { routeFlows, straightFlowPath, pathToD, curvedFlowPath, placeLabels, flowLabelSpec, evaluateFlowLayout } from './flowRouting.js';

const card = (id, x, y) => ({ id, x, y, w: 140, h: 80 });
const link = (id, from, to) => ({ id, from, to });

test('aligned horizontal ports stay straight when another flow shares the source', () => {
  const cards = [card('a', 0, 0), card('b', 400, 0), card('c', 400, 200)];
  const { paths } = routeFlows(cards, [link('ab', 'a', 'b'), link('ac', 'a', 'c')]);
  assert.equal(paths.ab[0].y, paths.ab.at(-1).y);
  assert.equal(paths.ab.length, 2);
  assert.notEqual(paths.ab[0].y, paths.ac[0].y);
});

test('aligned vertical ports work in both directions', () => {
  const cards = [card('a', 0, 0), card('b', 0, 300), card('c', 250, 300)];
  for (const [from, to] of [['a', 'b'], ['b', 'a']]) {
    const { paths } = routeFlows(cards, [link('main', from, to), link('other', 'a', 'c')]);
    assert.equal(paths.main[0].x, paths.main.at(-1).x);
    assert.equal(paths.main.length, 2);
  }
});

test('a narrow gap between aligned cards produces a straight path without a loop', () => {
  const cards = [card('a', 0, 0), card('b', 160, 0)];
  for (const [from, to] of [['a', 'b'], ['b', 'a']]) {
    const { paths } = routeFlows(cards, [link('ab', from, to)]);
    assert.equal(paths.ab.length, 2);
    assert.equal(paths.ab[0].y, paths.ab[1].y);
    assert.equal(Math.abs(paths.ab[1].x - paths.ab[0].x), 20);
  }
});

test('aligned ports do not make a flow cross an obstacle', () => {
  const cards = [card('a', 0, 0), card('b', 500, 0), { ...card('obstacle', 250, -50), h: 180 }];
  const { paths } = routeFlows(cards, [link('ab', 'a', 'b')]);
  assert.ok(paths.ab.length > 2);
  for (let i = 1; i < paths.ab.length; i++) {
    const a = paths.ab[i - 1], b = paths.ab[i];
    const crosses = Math.min(a.x, b.x) < 390 && Math.max(a.x, b.x) > 250 &&
      Math.min(a.y, b.y) < 130 && Math.max(a.y, b.y) > -50;
    assert.equal(crosses, false);
  }
});

test('parallel links keep distinct ports and nonoverlapping cards are not forced to align', () => {
  const cards = [card('a', 0, 0), card('b', 400, 0), card('c', 400, 200)];
  const { paths } = routeFlows(cards, [link('ab1', 'a', 'b'), link('ab2', 'a', 'b'), link('ac', 'a', 'c')]);
  assert.notEqual(paths.ab1[0].y, paths.ab2[0].y);
  assert.notEqual(paths.ab1.at(-1).y, paths.ab2.at(-1).y);
  assert.notEqual(paths.ac[0].y, paths.ac.at(-1).y);
});

test('crossing penalty reduces crossings in a dense grid without losing flows', () => {
  const cards=Array.from({length:9},(_,i)=>card(String(i),(i%3)*250,Math.floor(i/3)*180));
  const pairs=[['7','2'],['3','5'],['7','6'],['2','0'],['1','3'],['1','5'],['4','7'],['5','0']];
  const links=pairs.map(([from,to],i)=>link(String(i),from,to));
  const countCrossings=paths=>{
    const lines=Object.values(paths);
    assert.ok(lines.every(Boolean));
    let count=0;
    for(let i=0;i<lines.length;i++)for(let j=0;j<i;j++){
      let found=false;
      for(let k=1;k<lines[i].length&&!found;k++)for(let n=1;n<lines[j].length;n++){
        const a=lines[i][k-1],b=lines[i][k],c=lines[j][n-1],d=lines[j][n];
        const rx=b.x-a.x,ry=b.y-a.y,sx=d.x-c.x,sy=d.y-c.y,det=rx*sy-ry*sx;
        if(!det)continue;
        const t=((c.x-a.x)*sy-(c.y-a.y)*sx)/det,u=((c.x-a.x)*ry-(c.y-a.y)*rx)/det;
        if(t>0&&t<1&&u>0&&u<1){found=true;break;}
      }
      if(found)count++;
    }
    return count;
  };
  const original=countCrossings(routeFlows(cards,links,{crossing:0}).paths);
  const improved=countCrossings(routeFlows(cards,links).paths);
  assert.ok(improved<original,`${improved} crossings should be fewer than ${original}`);
});

test('straight paths clip to card edges in horizontal, vertical and diagonal directions', () => {
  const a=card('a',0,0);
  for (const b of [card('b',400,0),card('b',0,300),card('b',400,200)]) {
    const path=straightFlowPath(a,b,[a,b]);
    assert.ok(path);
    const [start,end]=path;
    assert.ok(start.x===a.x || start.x===a.x+a.w || start.y===a.y || start.y===a.y+a.h);
    assert.ok(end.x===b.x || end.x===b.x+b.w || end.y===b.y || end.y===b.y+b.h);
    assert.deepEqual(straightFlowPath(b,a,[a,b]),[end,start]);
  }
});

test('straight paths avoid obstacles including diagonal intersections and reject overlapping endpoints', () => {
  const a=card('a',0,0),b=card('b',400,200);
  assert.equal(straightFlowPath(a,b,[a,b,card('c',200,100)]),null);
  assert.ok(straightFlowPath(a,b,[a,b,card('c',200,300)]));
  assert.equal(straightFlowPath(a,card('overlap',20,10),[a,card('overlap',20,10)]),null);
  assert.equal(straightFlowPath(a,a,[a]),null);
});

test('elbow and rounded paths use distinct corner geometry', () => {
  const points=[{x:0,y:0},{x:100,y:0},{x:100,y:100}];
  assert.equal(pathToD(points,0),'M0 0 L100 0 L100 100');
  assert.match(pathToD(points,24),/Q100 0 100 24/);
  assert.match(pathToD(points,8),/Q100 0 100 8/);
});

test('curved mode bends a clear straight route and preserves endpoints', () => {
  const cards=[card('a',0,0),card('b',400,0)];
  const points=[{x:140,y:40},{x:400,y:40}];
  const curve=curvedFlowPath(points,cards,'a','b');
  assert.match(curve.d,/ Q/);
  assert.deepEqual(curve.points[0],points[0]);
  assert.deepEqual(curve.points.at(-1),points[1]);
  assert.notEqual(curve.points[2].y,40);
});

test('curved mode avoids obstacles and falls back to a straight segment', () => {
  const cards=[card('a',0,0),card('b',400,0),{id:'upper',x:200,y:-20,w:60,h:57},{id:'lower',x:200,y:43,w:60,h:57}];
  const points=[{x:140,y:40},{x:400,y:40}];
  const curve=curvedFlowPath(points,cards,'a','b');
  assert.doesNotMatch(curve.d,/ Q/);
  assert.deepEqual(curve.points,points);
});

test('curved mode rounds a routed corner without cutting through cards', () => {
  const points=[{x:0,y:0},{x:100,y:0},{x:100,y:100}];
  const free=curvedFlowPath(points,[],null,null);
  assert.match(free.d,/ Q/);
  const blocked=curvedFlowPath(points,[{id:'obstacle',x:98,y:1,w:20,h:20}],null,null);
  assert.doesNotMatch(blocked.d,/ Q/);
  assert.deepEqual(blocked.points,points);
});

test('layout evaluation supports curved routes', () => {
  const cards=[card('a',0,0),card('b',400,0)];
  const report=evaluateFlowLayout(cards,[link('f','a','b')],13,1,'curved');
  assert.equal(report.unrouted,0);
  assert.equal(report.cardOverlaps,0);
});

test('a displaced label has an anchor on the flow and avoids an obstacle', () => {
  const paths={f:[{x:0,y:0},{x:200,y:0}]};
  const positions=placeLabels(paths,[{id:'f',w:60,h:20}],[{x:40,y:-10,w:120,h:20}]);
  assert.notEqual(positions.f.y,0);
  assert.equal(positions.f.anchorY,0);
  assert.ok(positions.f.anchorX>=0&&positions.f.anchorX<=200);
  assert.ok(Math.abs(positions.f.y)>=20);
  assert.ok(positions.f.anchorX<40 || positions.f.anchorX>160);
});

test('unobstructed labels stay on horizontal, vertical and diagonal segments', () => {
  for(const end of [{x:200,y:0},{x:0,y:200},{x:200,y:100}]){
    const position=placeLabels({f:[{x:0,y:0},end]},[{id:'f',w:60,h:20}],[]).f;
    assert.ok(Math.abs(position.x*end.y-position.y*end.x)<1e-8);
  }
});

test('overlapping flows get separate labels anchored to the corresponding flow', () => {
  const paths={a:[{x:0,y:0},{x:200,y:0}],b:[{x:0,y:0},{x:200,y:0}]};
  const positions=placeLabels(paths,[{id:'a',w:190,h:20},{id:'b',w:190,h:20}],[]);
  assert.ok(Math.abs(positions.a.y-positions.b.y)>=20);
  assert.equal(positions.a.anchorY,0);
  assert.equal(positions.b.anchorY,0);
});

test('layout evaluation reports missing endpoints and uses full label dimensions', () => {
  const a=card('a',0,0),b=card('b',400,0);
  const label='Un libellé de flux beaucoup plus long que vingt-deux caractères';
  const spec=flowLabelSpec({id:'f',label},13,1);
  assert.ok(spec.w>200);
  const report=evaluateFlowLayout([a,b],[{id:'f',from:'a',to:'b',label},{id:'missing',from:'a',to:'unknown'}],13,1);
  assert.equal(report.unrouted,1);
  assert.equal(report.labelOverlaps,0);
  assert.equal(report.cardOverlaps,0);
});

test('layout evaluation reports a blocked straight route', () => {
  const cards=[card('a',0,0),card('b',500,0),{...card('c',250,-50),h:180}];
  const report=evaluateFlowLayout(cards,[{id:'f',from:'a',to:'b',routeStyle:'straight'}],13,1);
  assert.equal(report.straightFallbacks,1);
  assert.equal(report.unrouted,0);
});

test('layout evaluation detects crossings between straight flows', () => {
  const cards=[card('left',-300,0),card('right',300,0),card('top',0,-200),card('bottom',0,200)];
  const flows=[{id:'h',from:'left',to:'right',routeStyle:'straight'},{id:'v',from:'top',to:'bottom',routeStyle:'straight'}];
  assert.equal(evaluateFlowLayout(cards,flows,13,1).flowCrossings,1);
});
