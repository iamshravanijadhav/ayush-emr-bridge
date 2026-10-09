# REST API contract

Base URL locally: `http://localhost:4000`. All endpoints except `/api/health` require a Firebase ID token in `Authorization: Bearer <token>`.

## Common errors
```json
{ "error": { "code": "VALIDATION_ERROR", "message": "diagnosisTerm: String must contain at least 2 character(s)" } }
```
Possible codes include `UNAUTHORIZED`, `INVALID_TOKEN`, `ROLE_REQUIRED`, `FORBIDDEN`, `VALIDATION_ERROR`, `PATIENT_NOT_FOUND`, and `INTERNAL_ERROR`.

## Endpoints

### `GET /api/health`
Public. Returns API health status.

### `GET /api/dashboard`
Any authenticated role. Returns counts calculated from Firestore.

### `GET /api/patients?q=rahul`
Any authenticated role. Searches up to the first 250 patient documents by display name or internal patient code.

### `POST /api/patients`
`admin` or `clinician`.
```json
{ "displayName": "Rahul Demo", "birthYear": 1990, "sex": "male" }
```
Returns 201 and the created fictional patient. Duplicate display names produce a warning; they are not automatically merged.

### `GET /api/patients/:patientId`
Any authenticated role. Returns one patient or 404.

### `GET /api/patients/:patientId/history`
Any authenticated role. Returns the patient plus chronological encounters. It logs a history-view audit event.

### `POST /api/patients/:patientId/encounters`
`admin` or `clinician`.
```json
{
  "system": "MODERN_MEDICINE",
  "encounterDate": "2026-09-01",
  "diagnosisTerm": "Demo condition alpha",
  "diagnosisCode": "DEMO-MM-001",
  "terminologySystem": "DEMO_MODERN_MEDICINE",
  "medicines": ["Demo medicine A"],
  "notes": "Fictional example only."
}
```
For AYUSH, use `"system":"AYUSH"` and provide `ayushDiscipline`, e.g. `"Ayurveda"`. `terminologySystem` must identify the source as provided. The backend preserves the original values and attaches mapping metadata.

### `GET /api/mappings/search?q=demo`
Any authenticated role. Searches the local demonstration dataset and returns dataset metadata. Empty query returns no rows.

### `GET /api/mappings/reviews`
`admin` or `clinician`. Returns the review queue.

### `POST /api/mappings/reviews/:reviewId/decision`
`admin` or `clinician`.
```json
{ "decision": "reject", "reviewerNotes": "No authoritative evidence provided." }
```
This records a reviewer decision and audit event. A review decision does not by itself establish clinical equivalence.

## Role assignment
Roles are not accepted from request bodies. A trusted administrator assigns Firebase custom claims using `npm run set-role -- --uid UID --role admin`. The backend checks the verified token's role, then falls back to a trusted Firestore `users/{uid}` role document if needed.
