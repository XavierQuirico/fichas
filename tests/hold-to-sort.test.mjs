import test from 'node:test';
import assert from 'node:assert/strict';
import { createHoldToSort } from '../lib/hold-to-sort.ts';
function setup(t) {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  let lifts = 0;
  const hold = createHoldToSort(() => lifts++);
  return { hold, lifts: () => lifts };
}
test('vertical scroll cancels the hold permanently for the current contact', (t) => {
  const { hold, lifts } = setup(t);
  hold.start(100, 300);
  t.mock.timers.tick(90);
  assert.equal(hold.move(102, 275), 'scrolling');
  t.mock.timers.tick(1000);
  assert.equal(lifts(), 0);
  assert.equal(hold.move(100, 300), 'scrolling');
});
test('horizontal thumbnail scrolling never turns into sorting mid-swipe', (t) => {
  const { hold, lifts } = setup(t);
  hold.start(160, 400);
  assert.equal(hold.move(125, 401), 'scrolling');
  t.mock.timers.tick(1000);
  assert.equal(lifts(), 0);
});
test('a short tap does not lift or reorder', (t) => {
  const { hold, lifts } = setup(t);
  hold.start(40, 40);
  t.mock.timers.tick(180);
  hold.cancel();
  t.mock.timers.tick(1000);
  assert.equal(lifts(), 0);
  assert.equal(hold.phase(), 'idle');
});
test('a stationary 280ms hold lifts once and permits dragging', (t) => {
  const { hold, lifts } = setup(t);
  hold.start(40, 40);
  hold.move(43, 42);
  t.mock.timers.tick(279);
  assert.equal(lifts(), 0);
  t.mock.timers.tick(1);
  assert.equal(lifts(), 1);
  assert.equal(hold.move(100, 180), 'dragging');
  t.mock.timers.tick(1000);
  assert.equal(lifts(), 1);
});
test('cancellation clears the timer and the next gesture starts independently', (t) => {
  const { hold, lifts } = setup(t);
  hold.start(0, 0);
  t.mock.timers.tick(200);
  hold.cancel();
  t.mock.timers.tick(200);
  assert.equal(lifts(), 0);
  hold.start(10, 10);
  t.mock.timers.tick(280);
  assert.equal(lifts(), 1);
});
