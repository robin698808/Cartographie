import { test } from 'node:test';
import assert from 'node:assert/strict';
import { centralSlots, placeMostConnectedFirst, gridOffsets, optimizedAppScale, optimizedSpacing, fitBounds } from './layoutDensity.js';

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

test('application scale fits measured text without reducing existing size', () => {
  const requirements=[
    {width:375,height:90,baseWidth:220,baseHeight:84},
    {width:150,height:160,baseWidth:220,baseHeight:84},
  ];
  assert.equal(optimizedAppScale(1,requirements),2);
  assert.equal(optimizedAppScale(3,requirements),3);
  assert.equal(optimizedAppScale(1,[{width:2000,height:10,baseWidth:220,baseHeight:84}]),8);
  assert.equal(optimizedAppScale(1,[]),1);
});

test('optimized spacing reserves corridors around scaled cards and zone headers', () => {
  const options={cardWidth:200,cardHeight:100,flowFontSize:20,hasFlows:true,appSpacing:0,domainSpacing:0,categorySpacing:0,domainPadding:80,domainHeader:180,categorySide:45,categoryTop:274,categoryBottom:48,categoryBar:120,domainInsetX:44,domainInsetY:70};
  const spacing=optimizedSpacing(options);
  assert.ok(spacing.appX>=40);
  assert.ok(spacing.appY>=40);
  assert.ok(spacing.categoryX-2*options.categorySide>=40);
  assert.ok(spacing.categoryY-options.categoryTop-options.categoryBar-options.categoryBottom>=40);
  assert.ok(spacing.domainX+options.domainInsetX-2*options.domainPadding>=40);
  assert.ok(spacing.domainY+options.domainInsetY-2*options.domainPadding-options.domainHeader>=40);
  assert.ok(spacing.domainY+options.domainInsetY-options.categoryTop-options.categoryBar-options.categoryBottom>=40);
  const larger=optimizedSpacing({...options,cardWidth:2000,cardHeight:1000,flowFontSize:8});
  assert.ok(larger.appX>=300);
  assert.ok(larger.appY>=300);
  assert.ok(larger.domainX>spacing.domainX);
  assert.ok(larger.domainY>spacing.domainY);
  const userSpacing=optimizedSpacing({...options,appSpacing:500,domainSpacing:900,categorySpacing:600});
  assert.ok(userSpacing.appX>=518);
  assert.ok(userSpacing.domainX>=900);
  assert.ok(userSpacing.categoryX>=1100);
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
