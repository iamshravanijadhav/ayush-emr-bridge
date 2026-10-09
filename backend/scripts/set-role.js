import 'dotenv/config';
import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

const args = process.argv.slice(2);
function arg(name) { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : null; }
const uid = arg('--uid');
const role = arg('--role');
if (!uid || !['admin', 'clinician', 'viewer'].includes(role)) {
  console.error('Usage: npm run set-role -- --uid FIREBASE_UID --role admin|clinician|viewer');
  process.exit(1);
}
initializeApp({ credential: applicationDefault(), projectId: process.env.FIREBASE_PROJECT_ID });
await getAuth().setCustomUserClaims(uid, { role });
console.log(`Assigned role "${role}" to UID ${uid}. Sign out and sign in again to refresh the token.`);
