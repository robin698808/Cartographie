import { test } from 'node:test';
import assert from 'node:assert/strict';
import { centralSlots, placeMostConnectedFirst, gridOffsets, repositionFixedBounds, preserveDomainSize, optimizedSpacing, fitBounds, compactLayoutEligible, compactLayoutAcceptable } from './layoutDensity.js';
import { evaluateFlowLayout } from './flowRouting.js';

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

test('fixed category bounds retain their size and enclose repositioned content', () => {
  const original={x1:20,y1:30,x2:420,y2:330};
  const content={x1:900,y1:-200,x2:1100,y2:0};
  const result=repositionFixedBounds(original,content);
  assert.equal(result.x2-result.x1,400);
  assert.equal(result.y2-result.y1,300);
  assert.ok(result.x1<=content.x1&&result.x2>=content.x2);
  assert.ok(result.y1<=content.y1&&result.y2>=content.y2);
  assert.equal(repositionFixedBounds(original,{...content,x2:1301}),null);
  assert.equal(repositionFixedBounds(original,{...content,y2:101}),null);
});

test('manual domain dimensions are preserved or an incompatible layout is rejected', () => {
  const original={x1:0,y1:0,x2:400,y2:300},pad={w:100,h:200};
  const content={x1:1000,y1:2000,x2:1300,y2:2400};
  const next=preserveDomainSize(original,pad,content);
  assert.deepEqual(next,{w:200,h:100});
  assert.equal(preserveDomainSize(original,pad,{...content,x2:1501}),null);
  assert.equal(preserveDomainSize(original,pad,{...content,y2:2501}),null);
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
  const compact=optimizedSpacing({...options,compact:true});
  assert.ok(compact.appX<spacing.appX);
  assert.ok(compact.categoryY>=options.categoryTop+options.categoryBar+options.categoryBottom+30);
  assert.ok(compact.domainY+options.domainInsetY>=options.categoryTop+options.categoryBar+options.categoryBottom+30);
});

test('compact layouts are limited to fewer than 100 flows and default spacings', () => {
  assert.equal(compactLayoutEligible(0,2,44,30),true);
  assert.equal(compactLayoutEligible(99,2,44,30),true);
  assert.equal(compactLayoutEligible(100,2,44,30),false);
  assert.equal(compactLayoutEligible(1,7,44,30),false);
  assert.equal(compactLayoutEligible(1,2,64,30),false);
  assert.equal(compactLayoutEligible(1,2,44,40),false);
});

test('compact layouts require a meaningful area gain without excessive conflicts', () => {
  const report={unrouted:0,cardOverlaps:1,labelOverlaps:20,flowOverlaps:5,flowCrossings:50,straightFallbacks:0};
  const base={area:1000,zoneOverlaps:1,report};
  const candidate={area:900,zoneOverlaps:1,report:{...report,labelOverlaps:22,flowOverlaps:7,flowCrossings:55}};
  assert.equal(compactLayoutAcceptable(base,candidate),true);
  assert.equal(compactLayoutAcceptable(base,{...candidate,area:901}),false);
  assert.equal(compactLayoutAcceptable(base,{...candidate,zoneOverlaps:2}),false);
  for(const [key,value] of Object.entries({unrouted:1,cardOverlaps:2,labelOverlaps:23,flowOverlaps:8,flowCrossings:56,straightFallbacks:1})){
    assert.equal(compactLayoutAcceptable(base,{...candidate,report:{...candidate.report,[key]:value}}),false,key);
  }
});

test('a sparse grid with a routed flow admits a smaller compact layout', () => {
  const items=Array.from({length:9},(_,i)=>({id:String(i)}));
  const options={cardWidth:220,cardHeight:84,flowFontSize:13,hasFlows:true,appSpacing:2,domainSpacing:44,categorySpacing:30,domainPadding:20,domainHeader:24,categorySide:30,categoryTop:90,categoryBottom:32,categoryBar:98,domainInsetX:44,domainInsetY:70};
  const flow=[{id:'flow',from:'0',to:'1',label:'',protocol:''}];
  const evaluate=compact=>{
    const spacing=optimizedSpacing({...options,compact});
    const grid=gridOffsets(items,3,220,84,spacing.appX,spacing.appY,{},0);
    const cards=items.map((item,i)=>({id:item.id,x:grid.x[i%3],y:grid.y[Math.floor(i/3)],w:220,h:84}));
    return {area:grid.w*grid.h,zoneOverlaps:0,report:evaluateFlowLayout(cards,flow,13,0.6)};
  };
  const base=evaluate(false),compact=evaluate(true);
  assert.equal(compact.report.unrouted,0);
  assert.ok(compact.area<=base.area*0.9);
  assert.equal(compactLayoutAcceptable(base,compact),true);
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
