# Terminology dataset policy

The bundled `datasets/terminology-mappings.demo.json` is synthetic demo content. It is not an official terminology release and must not be used clinically.

## Current dataset status
- Dataset ID: `ayush-emr-bridge-demo-mappings`
- Version: `0.1.0-demo`
- Type: `SYNTHETIC_DEMO_ONLY`
- Official source files included: none
- Official mapping claims: none

## Required workflow for an authoritative import
1. Obtain the source dataset from an authorized official source.
2. Review its licence, terms, attribution requirements, release/version, and permitted redistribution.
3. Preserve the original source code and preferred term exactly as provided.
4. Record the source URL, release identifier, import date, and checksum in dataset metadata.
5. Transform it using a versioned import script; do not overwrite source files manually.
6. Do not infer equivalence from text similarity.
7. Have qualified terminology/clinical reviewers assess proposed mappings.
8. Store evidence, mapping relation, review status, reviewer identity, and decision timestamp.
9. Run duplicate, schema, and provenance checks before publishing.
10. Release a new dataset version and keep the previous version available for audit.

## Suggested fields
`mapping_id`, `source_system`, `source_code`, `source_term`, `target_system`, `target_code`, `target_term`, `mapping_relation`, `mapping_status`, `source_reference`, `evidence_reference`, `verification_status`, `reviewer_notes`, `last_reviewed`.

## Status meanings
- `VERIFIED_EXACT`: only for an equivalence supported by authoritative evidence and appropriate review.
- `RELATED_REVIEW`: related but not asserted equivalent; requires review.
- `NO_MAPPING`: no known mapping in the currently loaded dataset.
- `DEMO_UNVERIFIED`: synthetic demonstration row, never an official mapping.

## Official resources to check
- WHO ICD-11: https://icd.who.int/
- WHO ICD API documentation: https://icd.who.int/docs/icd-api/
- WHO ICD API portal: https://icd.who.int/icdapi
- Ministry of AYUSH: https://ayush.gov.in/
- NAMASTE portal: https://namaste.ayush.gov.in/

This project has not verified the current availability or terms of any external dataset/API in this build. Confirm current official documentation directly before using data.
