import { test } from 'node:test';
import assert from 'node:assert/strict';
import { referenceDose, isDilution, strengthOf, unitFor } from '../src/lib/doseReference.js';
import { calculate } from '../src/lib/doseEngine.js';

const durmet = { name: 'Durmet TC', technical: 'Chlorpyrifos 20% EC', formulation: 'EC' };
const whiteoff50 = { name: 'WhiteOff 50', technical: 'Chlorpyrifos 50% EC', formulation: 'EC' };
const premise = { name: 'Premise SC', technical: 'Imidacloprid 30.5% SC', formulation: 'SC' };
const rtu = { name: 'Arban RTU', technical: 'Chlorpyriphos 2% RTU', formulation: 'RTU' };

test('IS 6313 application volumes for termite work', () => {
  const pre = referenceDose('termite_pre', premise).fields;
  assert.deepEqual([pre.rate_horizontal, pre.rate_vertical, pre.rate_running], [5, 7.5, 2.25]);
  const post = referenceDose('termite_post', premise).fields;
  assert.deepEqual([post.rate_running, post.rate_per_hole], [2.25, 1]);
});

test('chlorpyrifos dilution comes from the 1.0% a.i. figure in the standard', () => {
  assert.equal(isDilution('termite_pre', durmet).value, 50, '20% EC → 50 ml per litre (1 + 19)');
  assert.match(isDilution('termite_pre', durmet).note, /19 parts water/);
  assert.equal(isDilution('termite_post', whiteoff50).value, 20, '50% EC → 20 ml per litre');
  assert.equal(strengthOf('Chlorpyriphos 20% EC'), 20);
});

test('no dilution is invented for chemicals or forms the standard does not list', () => {
  assert.equal(isDilution('termite_pre', premise), null, 'imidacloprid is not in IS 6313:2001');
  assert.equal(isDilution('termite_pre', rtu), null, 'ready-to-use products are not diluted');
  assert.equal(isDilution('cockroach', durmet), null, 'only termite work');
  assert.deepEqual(referenceDose('cockroach', durmet), { fields: {}, sources: {} });
  assert.equal(referenceDose('termite_pre', premise).fields.product_per_litre, undefined);
});

test('units follow the formulation', () => {
  assert.equal(unitFor({ formulation: 'GR' }), 'g');
  assert.equal(unitFor({ formulation: 'EC' }), 'ml');
});

test('pre-construction job with Chlorpyrifos 20 EC at IS figures', () => {
  const ref = referenceDose('termite_pre', durmet).fields;
  const r = calculate({ activity: 'termite_pre', record: { status: 'manual', amount_unit: 'ml', ...ref },
    measures: { plinthSqm: 100, foundationBottomSqm: 20, foundationSidesSqm: 30, perimeterM: 40 } });
  // 100×5 + 20×5 + 30×7.5 + 40×2.25 = 500 + 100 + 225 + 90 = 915 L
  assert.equal(r.solutionL, 915);
  assert.equal(r.product.amount, 915 * 50);
  assert.equal(Math.round(r.waterL * 100) / 100, 869.25);
});

test('post-construction drill holes use up to 1 L per hole', () => {
  const r = calculate({ activity: 'termite_post', record: { status: 'manual', amount_unit: 'ml', product_per_litre: 50, rate_running: 2.25, rate_per_hole: 1 },
    measures: { perimeterM: 40, holes: 101 } });
  assert.equal(r.solutionL, 40 * 2.25 + 101);
});

test('figures that are left empty are skipped, not guessed', () => {
  const r = calculate({ activity: 'termite_pre', record: { status: 'manual', amount_unit: 'ml', product_per_litre: null, rate_horizontal: 5 }, measures: { plinthSqm: 10 } });
  assert.match(r.error, /dilution/);
});
