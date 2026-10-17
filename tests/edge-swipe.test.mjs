import test from 'node:test';
import assert from 'node:assert/strict';
import { canStartEdgeSwipe, cancelsEdgeSwipe, completesEdgeSwipe } from '../lib/edge-swipe.ts';
test('exit gesture starts only on touch within the mobile left edge', () => {
  assert.equal(canStartEdgeSwipe('touch', 390, 0), true);
  assert.equal(canStartEdgeSwipe('touch', 740, 20), true);
  for (const args of [
    ['touch', 390, 21],
    ['touch', 390, 200],
    ['mouse', 390, 10],
    ['touch', 741, 10],
    ['touch', 390, -1],
  ])
    assert.equal(canStartEdgeSwipe(...args), false);
});
test('vertical reading and short or reverse drags cannot exit', () => {
  assert.equal(cancelsEdgeSwipe(10, 40), true);
  assert.equal(cancelsEdgeSwipe(90, 40), false);
  for (const [dx, dy] of [
    [80, 0],
    [-100, 0],
    [100, 70],
    [50, 100],
  ])
    assert.equal(completesEdgeSwipe(dx, dy), false);
  assert.equal(completesEdgeSwipe(81, 0), true);
  assert.equal(completesEdgeSwipe(100, 30), true);
});
