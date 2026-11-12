import { test } from 'node:test';
import assert from 'node:assert/strict';
import { centralSlots, placeMostConnectedFirst, gridOffsets, optimizedFontSizes, fitBounds } from './layoutDensity.js';

test('most connected applications occupy central slots deterministically', () => {
  const apps=Array.from({length:9},(_,i)=>({id:String(i)}));
  const placed=placeMostConnectedFirst(apps,3,{'8':20,'0':10});
  assert.equal(placed[4].id,'8');
  assert.ok([1,3,5,7].includes(placed.findIndex(app=>app.id==='0')));
  assert.equal(new Set(placed.map(app=>app.id)).size,apps.length);
  assert.deepEqual(centralSlots(1,1),[0]);
});

test('dense grids reserve extra space around well-connected applications', () => {
  const apps=[{id:'hub'},{id:'a'},{id:'b'},{id:'c'}];
  const grid=gridOffsets(apps,2,100,50,20,10,{hub:10},4);
  assert.deepEqual(grid.x,[0,160]);
  assert.deepEqual(grid.y,[0,100]);
  assert.equal(grid.w,260);
  assert.equal(grid.h,150);
  const compact=gridOffsets(apps,2,100,50,20,10,{hub:10},0);
  assert.deepEqual(compact.x,[0,120]);
  assert.deepEqual(compact.y,[0,60]);
});

test('incomplete grids place every application once', () => {
  const apps=Array.from({length:5},(_,i)=>({id:String(i)}));
  const placed=placeMostConnectedFirst(apps,3,{'4':9});
  assert.equal(placed.length,5);
  assert.equal(placed[1].id,'4');
  assert.deepEqual(new Set(placed.map(app=>app.id)),new Set(apps.map(app=>app.id)));
});

test('automatic font sizes target readable screen sizes and respect slider limits', () => {
  const sizes=optimizedFontSizes(1.35,1,0.6);
  assert.ok(Math.abs(15*1.35*sizes.app*0.6-16)<1);
  assert.ok(Math.abs(13*1.35*sizes.domain*0.6-16)<1);
  assert.ok(sizes.flow*0.6*1.6>=14);
  const extreme=optimizedFontSizes(0.8,0.6,0.01);
  assert.equal(extreme.app,6);
  assert.equal(extreme.flow,96);
});

test('fitBounds keeps all bounds within the usable viewport', () => {
  for(const [width,height] of [[1200,700],[320,240]]){
    const b={x1:-600,y1:-900,x2:10000,y2:7000};
    const {zoom,offset}=fitBounds(b,width,height,40);
    assert.ok(b.x1*zoom+offset.x>=40-1e-8);
    assert.ok(b.y1*zoom+offset.y>=40-1e-8);
    assert.ok(b.x2*zoom+offset.x<=width-40+1e-8);
    assert.ok(b.y2*zoom+offset.y<=height-40+1e-8);
  }
});
