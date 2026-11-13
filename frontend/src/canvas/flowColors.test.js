import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_FLOW_DIRECTION_COLORS, normalizeFlowDirectionColors, flowDirectionColor } from './flowColors.js';

test('direction colors use valid saved values and defaults for missing or invalid values', () => {
  assert.deepEqual(normalizeFlowDirectionColors(null),DEFAULT_FLOW_DIRECTION_COLORS);
  assert.deepEqual(normalizeFlowDirectionColors({incoming:'#123456',outgoing:'red'}),{
    incoming:'#123456',outgoing:DEFAULT_FLOW_DIRECTION_COLORS.outgoing,
  });
});

test('flow color follows direction relative to the selected application', () => {
  const colors={incoming:'#112233',outgoing:'#abcdef'};
  const flow={from:'a',to:'b'};
  assert.equal(flowDirectionColor(flow,'a',colors,'#000000'),colors.outgoing);
  assert.equal(flowDirectionColor(flow,'b',colors,'#000000'),colors.incoming);
  assert.equal(flowDirectionColor(flow,null,colors,'#000000'),'#000000');
  assert.equal(flowDirectionColor(flow,'c',colors,'#000000'),'#000000');
});
