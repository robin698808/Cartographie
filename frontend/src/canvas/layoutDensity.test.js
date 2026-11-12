import { test } from 'node:test';
import assert from 'node:assert/strict';
import { centralSlots, placeMostConnectedFirst, gridOffsets } from './layoutDensity.js';

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
