
import { Router } from 'express';
import { db } from '../firebase.js';
import {
  searchMappings,
  mappingMetadata,
  findCandidateForReview
} from '../services/mapping.js';
import { reviewDecisionSchema } from '../schemas.js';
import { validateBody } from '../middleware/validate.js';
import { requireRole } from '../middleware/auth.js';
import { AppError } from '../utils/errors.js';
import { writeAudit } from '../services/audit.js';

export const mappingsRouter = Router();

// Search the currently loaded terminology dataset.
mappingsRouter.get('/search', (req, res) => {
  res.json({
    metadata: mappingMetadata,
    data: searchMappings(String(req.query.q || ''))
  });
});

// List mapping review items.
mappingsRouter.get(
  '/reviews',
  requireRole('admin', 'clinician'),
  async (req, res, next) => {
    try {
      const snap = await db.collection('mappingReviews').limit(200).get();

      const data = snap.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .sort((a, b) =>
          String(b.createdAt).localeCompare(String(a.createdAt))
        );

      res.json({ data });
    } catch (error) {
      next(error);
    }
  }
);

// Record a review decision and link it to the associated encounter.
mappingsRouter.post(
  '/reviews/:reviewId/decision',
  requireRole('admin', 'clinician'),
  validateBody(reviewDecisionSchema),
  async (req, res, next) => {
    try {
      const reviewRef = db
        .collection('mappingReviews')
        .doc(req.params.reviewId);

      const reviewSnap = await reviewRef.get();

      if (!reviewSnap.exists) {
        throw new AppError(
          404,
          'REVIEW_NOT_FOUND',
          'Mapping review item not found.'
        );
      }

      const previous = reviewSnap.data();
      const encounterId = previous.encounterId;

      if (!encounterId) {
        throw new AppError(
          400,
          'ENCOUNTER_LINK_MISSING',
          'This review item is not linked to an encounter.'
        );
      }

      const encounterRef = db.collection('encounters').doc(encounterId);
      const encounterSnap = await encounterRef.get();

      if (!encounterSnap.exists) {
        throw new AppError(
          404,
          'ENCOUNTER_NOT_FOUND',
          'The linked encounter was not found.'
        );
      }

      const now = new Date().toISOString();

      const decision = {
        decision: req.body.decision,
        reviewerNotes: req.body.reviewerNotes,
        reviewerUid: req.user.uid,
        reviewerRole: req.user.role,
        decidedAt: now
      };

      const decisions = [
        ...(previous.decisions || []),
        decision
      ];


      // Approval records a review decision, not clinical equivalence.
      const reviewStatus =
        req.body.decision === 'approve'
          ? 'APPROVED_FOR_DEMO_REVIEW'
          : 'REJECTED';

      const encounter = encounterSnap.data();

      const sourceSystemAliases = {
        AYUSH: 'DEMO_AYUSH',
        MODERN_MEDICINE: 'DEMO_MODERN_MEDICINE',
        'Modern Medicine': 'DEMO_MODERN_MEDICINE'
      };

      const candidate = findCandidateForReview({
        sourceSystem:
          sourceSystemAliases[previous.sourceSystem] ||
          previous.sourceSystem,
        sourceTerm: previous.sourceTerm || encounter.diagnosisTerm
      });
      console.log('DEBUG mapping review:', {
        sourceSystem: previous.sourceSystem,
        sourceTerm: previous.sourceTerm,
        encounterDiagnosis: encounter.diagnosisTerm,
        candidateFound: Boolean(candidate),
        candidateTarget: candidate?.target_term ?? null
      });

      const candidateDetails = candidate
        ? {
          sourceTerm: candidate.source_term,
          targetTerm: candidate.target_term,
          sourceSystem: candidate.source_system,
          targetSystem: candidate.target_system,
          mappingStatus: candidate.mapping_status,
          mappingRelation: candidate.mapping_relation || null,
          verificationStatus: candidate.verification_status,
          evidenceReference: candidate.evidence_reference || null,
          datasetVersion: candidate.dataset_version,
          clinicalEquivalenceVerified: false
        }
        : null;
      console.log('DEBUG candidate details:', candidateDetails);

      const reviewUpdate = {
        decisions,
        currentDecision: req.body.decision,
        updatedAt: now,
        candidate: candidateDetails
      };

      const encounterUpdate = {
        mappingReview: {
          reviewId: reviewRef.id,
          currentDecision: req.body.decision,
          reviewStatus,
          reviewerUid: req.user.uid,
          reviewerRole: req.user.role,
          reviewerNotes: req.body.reviewerNotes,
          decidedAt: now,
          candidate: candidateDetails
        },
        updatedAt: now
      };

      // Update both documents together.
      const batch = db.batch();
      batch.update(reviewRef, reviewUpdate);
      batch.update(encounterRef, encounterUpdate);
      await batch.commit();

      await writeAudit({
        actor: req.user,
        action: 'MAPPING_REVIEW_DECIDED',
        targetType: 'mappingReview',
        targetId: reviewRef.id,
        details: {
          decision: req.body.decision,
          encounterId
        }
      });

      res.json({
        data: {
          id: reviewRef.id,
          ...previous,
          ...reviewUpdate
        },
        encounterReview: encounterUpdate.mappingReview
      });
    } catch (error) {
      next(error);
    }
  }
);
