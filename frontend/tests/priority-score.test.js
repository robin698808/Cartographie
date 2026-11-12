import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildPriorityItems } from '../src/canvas/priority-score.js';

test('scores combine application attributes and incoming and outgoing project flows', () => {
  const apps = [
    { id: 'a', criticality: 'Haute', statut: 'Legacy', owner: '' },
    { id: 'b', criticality: 'Moyenne', owner: 'Alice' },
    { id: 'c', criticality: 'Basse', endOfService: '2000-01-01' },
  ];
  const flows = [{ from: 'a', to: 'b' }, { from: 'c', to: 'a' }];
  const items = buildPriorityItems(apps, flows);
  assert.deepEqual(items.map(item => item.score), [53, 21, 34]);
  assert.deepEqual(items.map(item => item.degree), [2, 1, 1]);
  assert.equal(items[0].parts.reduce((sum, part) => sum + part.v, 0), items[0].score);
});
