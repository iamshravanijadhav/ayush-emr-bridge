import 'dotenv/config';
import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

initializeApp({ credential: applicationDefault(), projectId: process.env.FIREBASE_PROJECT_ID });
const db = getFirestore();
const now = new Date().toISOString();

const patients = [
  { id: 'demo-patient-rahul', patientCode: 'DEMO-RAHUL-001', displayName: 'Rahul Demo', birthYear: 1990, sex: 'male', demoOnly: true, createdBy: 'seed-script', createdAt: now },
  { id: 'demo-patient-anaya', patientCode: 'DEMO-ANAYA-002', displayName: 'Anaya Demo', birthYear: 1988, sex: 'female', demoOnly: true, createdBy: 'seed-script', createdAt: now }
];
for (const p of patients) await db.collection('patients').doc(p.id).set(p, { merge: true });

const encounters = [
  { id: 'demo-encounter-001', patientId: 'demo-patient-rahul', system: 'MODERN_MEDICINE', encounterDate: '2026-09-01', diagnosisTerm: 'Demo condition alpha', diagnosisCode: 'DEMO-MM-001', terminologySystem: 'DEMO_MODERN_MEDICINE', medicines: ['Demo medicine A'], notes: 'Fictional example only.', mapping: { mapping_status: 'DEMO_UNVERIFIED', verification_status: 'unverified_demo', dataset_version: '0.1.0-demo' }, createdBy: 'seed-script', createdAt: now, demoOnly: true },
  { id: 'demo-encounter-002', patientId: 'demo-patient-rahul', system: 'AYUSH', ayushDiscipline: 'Ayurveda', encounterDate: '2026-09-12', diagnosisTerm: 'Demo traditional concept alpha', diagnosisCode: 'DEMO-AY-001', terminologySystem: 'DEMO_AYUSH', medicines: ['Demo preparation A'], notes: 'Fictional example only; not a recommendation.', mapping: { mapping_status: 'DEMO_UNVERIFIED', verification_status: 'unverified_demo', dataset_version: '0.1.0-demo' }, createdBy: 'seed-script', createdAt: now, demoOnly: true }
];
for (const e of encounters) {
  const { id, ...data } = e;
  await db.collection('encounters').doc(id).set(data, { merge: true });
}
await db.collection('datasetMetadata').doc('active').set({ datasetId: 'ayush-emr-bridge-demo-mappings', version: '0.1.0-demo', datasetType: 'SYNTHETIC_DEMO_ONLY', updatedAt: now });
console.log('Seeded fictional demo patients and encounters.');
