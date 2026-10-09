import { Router } from 'express';
import { db } from '../firebase.js';
import { requireAuth } from '../middleware/auth.js';

export const dashboardRouter = Router();
dashboardRouter.get('/', requireAuth, async (req, res, next) => {
  try {
    const [patients, encounters, reviews] = await Promise.all([
      db.collection('patients').get(),
      db.collection('encounters').get(),
      db.collection('mappingReviews').get()
    ]);
    const encounterRows = encounters.docs.map(d => d.data());
    res.json({ data: {
      patients: patients.size,
      modernMedicineEncounters: encounterRows.filter(e => e.system === 'MODERN_MEDICINE').length,
      ayushEncounters: encounterRows.filter(e => e.system === 'AYUSH').length,
      mappedConcepts: encounterRows.filter(e => e.mapping && !['NO_MAPPING', 'DEMO_UNVERIFIED'].includes(e.mapping.mapping_status)).length,
      reviewsRequired: reviews.docs.filter(d => !d.data().currentDecision).length
    }});
  } catch (e) { next(e); }
});
