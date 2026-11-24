// Unit tests for the dosage engine. Expected values are worked out by hand below each case.
// The label rates used here are made-up test numbers, NOT real product doses.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { termitePreGeometry, calculate, packPlan, parsePack, toSqm, toMetres, costOf } from '../src/lib/doseEngine.js';

const close = (a, b, msg) => assert.ok(Math.abs(a - b) < 1e-6, `${msg}: ${a} ≠ ${b}`);
const RECORD = { status: 'verified', amount_unit: 'ml', product_per_litre: 2, rate_horizontal: 5, rate_vertical: 7.5, rate_running: 7.5 };

test('unit conversion', () => {
  close(toMetres(10, 'imperial'), 3.048, '10 ft');
  close(toSqm(100, 'imperial'), 9.290304, '100 sq ft');
  assert.equal(toMetres(-1, 'metric'), null);
  assert.equal(toMetres('', 'metric'), null);
});

test('pack sizes are read correctly', () => {
  assert.deepEqual(parsePack('1 L'), { amount: 1000, unit: 'ml' });
  assert.deepEqual(parsePack('250 ml'), { amount: 250, unit: 'ml' });
  assert.deepEqual(parsePack('62.5 g'), { amount: 62.5, unit: 'g' });
  assert.deepEqual(parsePack('5 kg'), { amount: 5000, unit: 'g' });
  assert.deepEqual(parsePack('1 kg × 2'), { amount: 2000, unit: 'g' });
  assert.deepEqual(parsePack('35 gm'), { amount: 35, unit: 'g' });
  assert.equal(parsePack('Standard pack'), null);
});

test('geometry: plinth and perimeter derived from length × width', () => {
  // 10 m × 8 m → plinth 80 m², perimeter 2 × 18 = 36 m
  const g = termitePreGeometry({ length: 10, width: 8 });
  close(g.plinthSqm, 80, 'plinth');
  close(g.perimeterM, 36, 'perimeter');
  // 40 ft × 30 ft → 1200 sq ft = 111.483648 m²; perimeter 140 ft = 42.672 m
  const i = termitePreGeometry({ system: 'imperial', length: 40, width: 30 });
  close(i.plinthSqm, 111.483648, 'imperial plinth');
  close(i.perimeterM, 42.672, 'imperial perimeter');
});

test('geometry: strip and pit foundations', () => {
  // Strip: trench length = perimeter 36 m, width 0.6, depth 1.2 → bottom 21.6 m², sides 2 × 36 × 1.2 = 86.4 m²
  const s = termitePreGeometry({ length: 10, width: 8, foundation: { type: 'strip', trenchWidth: 0.6, trenchDepth: 1.2 } });
  close(s.foundationBottomSqm, 21.6, 'strip bottom');
  close(s.foundationSidesSqm, 86.4, 'strip sides');
  // Pits: 6 pits 1.5 × 1.5 × 1.8 → bottom 6 × 2.25 = 13.5 m²; sides 6 × 2 × 3 × 1.8 = 64.8 m²
  const p = termitePreGeometry({ plinthArea: 50, foundation: { type: 'pits', count: 6, pitLength: 1.5, pitWidth: 1.5, pitDepth: 1.8 } });
  close(p.foundationBottomSqm, 13.5, 'pit bottom');
  close(p.foundationSidesSqm, 64.8, 'pit sides');
});

test('pre-construction calculation, packs and cost', () => {
  const g = termitePreGeometry({ length: 10, width: 8, foundation: { type: 'strip', trenchWidth: 0.6, trenchDepth: 1.2 } });
  const r = calculate({ activity: 'termite_pre', record: RECORD, measures: g });
  // 80×5 = 400; 21.6×5 = 108; 86.4×7.5 = 648; 36×7.5 = 270 → 1426 L solution
  close(r.solutionL, 1426, 'solution');
  close(r.product.amount, 2852, 'product ml'); // 1426 L × 2 ml/L
  close(r.waterL, 1423.148, 'water'); // 1426 − 2.852
  const plan = packPlan(r.product.amount, 'ml', '1 L');
  assert.equal(plan.packs, 3); // 2852 ml → three 1 L packs
  close(plan.leftover, 148, 'leftover');
  assert.equal(costOf(plan.packs, 4630), 13890);
});

test('missing label rates are skipped, never filled in', () => {
  const r = calculate({ activity: 'termite_pre', record: { ...RECORD, rate_vertical: null }, measures: { plinthSqm: 10, foundationSidesSqm: 20 } });
  assert.equal(r.components.length, 1);
  assert.equal(r.skipped[0].key, 'foundation_sides');
  close(r.solutionL, 50, 'only plinth counted');
});

test('unverified data never produces a result', () => {
  const r = calculate({ activity: 'cockroach', record: { ...RECORD, status: 'unverified' }, measures: { surfaceSqm: 100 } });
  assert.ok(r.error);
});

test('larvicide and rodent bait', () => {
  // 5000 L × 20 ml per 1000 L = 100 ml
  const l = calculate({ activity: 'larvicide', record: { status: 'verified', amount_unit: 'ml', product_per_1000l: 20 }, measures: { waterLitres: 5000 } });
  close(l.product.amount, 100, 'larvicide');
  // 24 points × 15 g = 360 g → 1 kg pack covers it
  const b = calculate({ activity: 'rodent', record: { status: 'verified', bait_per_point: 15 }, measures: { baitPoints: 24 } });
  close(b.product.amount, 360, 'bait');
  assert.equal(packPlan(b.product.amount, 'g', '1 kg').packs, 1);
  assert.equal(packPlan(b.product.amount, 'ml', '1 kg'), null, 'unit mismatch gives no pack plan');
});
