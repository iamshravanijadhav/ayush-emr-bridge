import { db } from '../firebase.js';

export async function writeAudit({ actor, action, targetType, targetId, details = {} }) {
  await db.collection('auditLogs').add({
    actorUid: actor.uid,
    actorRole: actor.role,
    action,
    targetType,
    targetId: targetId || null,
    details,
    createdAt: new Date().toISOString()
  });
}
