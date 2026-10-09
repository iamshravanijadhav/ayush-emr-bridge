import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeTerm, searchMappings, mapConcept } from '../src/services/mapping.js';

test('normalizes spaces and case', () => {
  assert.equal(normalizeTerm('  Demo   Condition ALPHA '), 'demo condition alpha');
});

test('search returns synthetic demo rows with explicit status', () => {
  const rows = searchMappings('Demo condition alpha');
  assert.equal(rows.length, 1);
  assert.equal(rows[0].mapping_status, 'DEMO_UNVERIFIED');
  assert.equal(rows[0].verification_status, 'unverified_demo');
});

test('unknown term is not treated as a match', () => {
  const result = mapConcept({ sourceSystem: 'DEMO_AYUSH', sourceTerm: 'a completely unknown concept' });
  assert.equal(result.mapping_status, 'NO_MAPPING');
});
