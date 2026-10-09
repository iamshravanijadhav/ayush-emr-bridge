
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));

const datasetPath = path.resolve(
  here,
  '../../../datasets/terminology-mappings.demo.json'
);

let dataset = {
  datasetId: 'missing-demo-dataset',
  version: 'unknown',
  mappings: []
};

try {
  dataset = JSON.parse(fs.readFileSync(datasetPath, 'utf8'));
} catch (error) {
  console.warn('Could not load mapping dataset:', error.message);
}

export const mappingMetadata = {
  datasetId: dataset.datasetId,
  version: dataset.version,
  datasetType: dataset.datasetType,
  notice: dataset.notice
};

export function normalizeTerm(value = '') {
  return String(value)
    .normalize('NFKC')
    .trim()
    .toLocaleLowerCase('en')
    .replace(/\s+/g, ' ');
}

export function searchMappings(query = '') {
  const normalized = normalizeTerm(query);

  if (!normalized) return [];

  return (dataset.mappings || [])
    .filter(row =>
      [
        row.source_term,
        row.target_term,
        row.source_code,
        row.target_code
      ]
        .filter(Boolean)
        .some(value => normalizeTerm(value).includes(normalized))
    )
    .map(row => ({
      ...row,
      dataset_version: dataset.version
    }));
}

export function mapConcept({ sourceSystem, sourceCode, sourceTerm }) {
  const code = String(sourceCode || '').trim();
  const term = normalizeTerm(sourceTerm);
  const rows = dataset.mappings || [];

  const match = rows.find(row =>
    (sourceCode &&
      row.source_code === code &&
      row.source_system === sourceSystem) ||
    (sourceTerm &&
      row.source_system === sourceSystem &&
      normalizeTerm(row.source_term) === term)
  );

  if (!match) {
    return {
      mapping_status: 'NO_MAPPING',
      target_system: null,
      target_code: null,
      target_term: null,
      evidence_reference: null,
      verification_status: 'not_found_in_loaded_dataset',
      dataset_version: dataset.version
    };
  }

  return {
    ...match,
    dataset_version: dataset.version
  };
}

export function findCandidateForReview({ sourceSystem, sourceTerm }) {
  const term = normalizeTerm(sourceTerm);

  if (!term) return null;

  const systemAliases = {
    MODERN_MEDICINE: 'DEMO_MODERN_MEDICINE',
    'Modern Medicine': 'DEMO_MODERN_MEDICINE',
    AYUSH: 'DEMO_AYUSH'
  };

  const normalizedSystem = systemAliases[sourceSystem] || sourceSystem;

  const candidates = (dataset.mappings || []).filter(row => {
    const sourceTermNormalized = normalizeTerm(row.source_term);
    const targetTermNormalized = normalizeTerm(row.target_term);

    const sourceMatches =
      row.source_system === normalizedSystem &&
      sourceTermNormalized &&
      (
        sourceTermNormalized.includes(term) ||
        term.includes(sourceTermNormalized)
      );

    const targetMatches =
      row.target_system === normalizedSystem &&
      targetTermNormalized &&
      (
        targetTermNormalized.includes(term) ||
        term.includes(targetTermNormalized)
      );

    return Boolean(sourceMatches || targetMatches);
  });

  if (candidates.length === 0) return null;

  return {
    ...candidates[0],
    dataset_version: dataset.version,
    candidate_only: true,
    clinical_equivalence_verified: false
  };
}
