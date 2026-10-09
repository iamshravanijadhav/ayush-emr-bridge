import { Router } from 'express';
import { randomUUID } from 'node:crypto';
import { db } from '../firebase.js';
import { patientSchema, encounterSchema } from '../schemas.js';
import { validateBody } from '../middleware/validate.js';
import { requireRole } from '../middleware/auth.js';
import { AppError } from '../utils/errors.js';
import { writeAudit } from '../services/audit.js';
import { mapConcept } from '../services/mapping.js';

export const patientsRouter = Router();

patientsRouter.get('/', async (req, res, next) => {
  try {
    const q = String(req.query.q || '').trim().toLowerCase();
    const snap = await db.collection('patients').limit(250).get();
    const patients = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      .filter(p => !q || p.displayName.toLowerCase().includes(q) || p.patientCode.toLowerCase().includes(q))
      .sort((a, b) => a.displayName.localeCompare(b.displayName));
    res.json({ data: patients });
  } catch (e) { next(e); }
});

patientsRouter.post('/', requireRole('admin', 'clinician'), validateBody(patientSchema), async (req, res, next) => {
  try {
    const snap = await db.collection('patients').limit(250).get();
    const duplicate = snap.docs.some(d => d.data().displayName.toLowerCase() === req.body.displayName.toLowerCase());
    const id = randomUUID();
    const patient = {
      patientCode: `DEMO-${id.slice(0, 8).toUpperCase()}`,
      displayName: req.body.displayName,
      birthYear: req.body.birthYear ?? null,
      sex: req.body.sex,
      demoOnly: true,
      createdBy: req.user.uid,
      createdAt: new Date().toISOString(),
      duplicateNameWarning: duplicate
    };
    await db.collection('patients').doc(id).create(patient);
    await writeAudit({ actor: req.user, action: 'PATIENT_CREATED', targetType: 'patient', targetId: id });
    res.status(201).json({ data: { id, ...patient }, warning: duplicate ? 'A patient with the same display name exists; verify before proceeding.' : null });
  } catch (e) { next(e); }
});

patientsRouter.get('/:patientId', async (req, res, next) => {
  try {
    const doc = await db.collection('patients').doc(req.params.patientId).get();
    if (!doc.exists) throw new AppError(404, 'PATIENT_NOT_FOUND', 'Patient not found.');
    res.json({ data: { id: doc.id, ...doc.data() } });
  } catch (e) { next(e); }
});

patientsRouter.get('/:patientId/history', async (req, res, next) => {
  try {
    const patient = await db.collection('patients').doc(req.params.patientId).get();
    if (!patient.exists) throw new AppError(404, 'PATIENT_NOT_FOUND', 'Patient not found.');
    const snap = await db.collection('encounters').where('patientId', '==', req.params.patientId).get();
    const encounters = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      .sort((a, b) => b.encounterDate.localeCompare(a.encounterDate));
    await writeAudit({ actor: req.user, action: 'PATIENT_HISTORY_VIEWED', targetType: 'patient', targetId: req.params.patientId });
    res.json({ data: { patient: { id: patient.id, ...patient.data() }, encounters } });
  } catch (e) { next(e); }
});

patientsRouter.post('/:patientId/encounters', requireRole('admin', 'clinician'), validateBody(encounterSchema), async (req, res, next) => {
  try {
    const patient = await db.collection('patients').doc(req.params.patientId).get();
    if (!patient.exists) throw new AppError(404, 'PATIENT_NOT_FOUND', 'Patient not found.');
    const input = req.body;
    const mapping = mapConcept({
      sourceSystem: input.system === 'AYUSH' ? 'DEMO_AYUSH' : 'DEMO_MODERN_MEDICINE',
      sourceCode: input.diagnosisCode,
      sourceTerm: input.diagnosisTerm
    });
    const id = randomUUID();
    const encounter = {
      patientId: req.params.patientId,
      system: input.system,
      ayushDiscipline: input.ayushDiscipline || null,
      encounterDate: input.encounterDate,
      diagnosisTerm: input.diagnosisTerm,
      diagnosisCode: input.diagnosisCode || null,
      terminologySystem: input.terminologySystem,
      medicines: input.medicines,
      notes: input.notes || '',
      mapping,
      createdBy: req.user.uid,
      createdAt: new Date().toISOString(),
      demoOnly: true
    };
    await db.collection('encounters').doc(id).create(encounter);
    if (['DEMO_UNVERIFIED', 'RELATED_REVIEW', 'NO_MAPPING'].includes(mapping.mapping_status)) {
      const reviewId = `review-${id}`;
      await db.collection('mappingReviews').doc(reviewId).set({
        encounterId: id,
        patientId: req.params.patientId,
        sourceTerm: input.diagnosisTerm,
        sourceCode: input.diagnosisCode || null,
        sourceSystem: input.system,
        targetTerm: mapping.target_term || null,
        targetCode: mapping.target_code || null,
        targetSystem: mapping.target_system || null,
        mappingStatus: mapping.mapping_status,
        evidenceReference: mapping.evidence_reference || null,
        verificationStatus: mapping.verification_status || 'not_verified',
        decisions: [],
        currentDecision: null,
        createdAt: new Date().toISOString(),
        createdBy: req.user.uid
      });
    }
    await writeAudit({ actor: req.user, action: 'ENCOUNTER_CREATED', targetType: 'encounter', targetId: id, details: { patientId: req.params.patientId, system: input.system } });
    res.status(201).json({ data: { id, ...encounter } });
  } catch (e) { next(e); }
});

patientsRouter.delete(
  '/:patientId',
  requireRole('admin'),
  async (req, res, next) => {
    try {
      const patientId = req.params.patientId;
      const patientRef = db.collection('patients').doc(patientId);
      const patientSnap = await patientRef.get();

      if (!patientSnap.exists) {
        throw new AppError(
          404,
          'PATIENT_NOT_FOUND',
          'Patient not found.'
        );
      }

      const [encountersSnap, reviewsSnap] = await Promise.all([
        db.collection('encounters')
          .where('patientId', '==', patientId)
          .get(),
        db.collection('mappingReviews')
          .where('patientId', '==', patientId)
          .get()
      ]);

      // Delete in chunks to stay within Firestore batch limits.
      const refs = [
        ...reviewsSnap.docs.map(doc => doc.ref),
        ...encountersSnap.docs.map(doc => doc.ref),
        patientRef
      ];

      for (let i = 0; i < refs.length; i += 450) {
        const batch = db.batch();

        for (const ref of refs.slice(i, i + 450)) {
          batch.delete(ref);
        }

        await batch.commit();
      }

      await writeAudit({
        actor: req.user,
        action: 'DEMO_PATIENT_DELETED',
        targetType: 'patient',
        targetId: patientId,
        details: {
          deletedEncounterCount: encountersSnap.size,
          deletedReviewCount: reviewsSnap.size,
          demoOnly: true
        }
      });

      res.json({
        message: 'Demo patient and linked records deleted.',
        data: {
          patientId,
          deletedEncounterCount: encountersSnap.size,
          deletedReviewCount: reviewsSnap.size
        }
      });
    } catch (error) {
      next(error);
    }
  }
);
