# Testing and end-to-end checklist

## Automated backend tests
From `backend/`:
```powershell
npm test
```

## Manual integration checklist
- [ ] Sign in with a Firebase account.
- [ ] Confirm unauthenticated API calls receive 401.
- [ ] Confirm a user without a role cannot read patient records.
- [ ] Assign `admin`, sign out/in, and confirm access.
- [ ] Register a fictional patient.
- [ ] Search by name.
- [ ] Confirm duplicate names are handled with a warning rather than silently merged.
- [ ] Add a Modern Medicine encounter.
- [ ] Add an AYUSH encounter.
- [ ] Open unified history and confirm chronological ordering.
- [ ] Search `Demo condition alpha`; confirm it is labelled demo/unverified.
- [ ] Search an unknown term; confirm no mapping is returned.
- [ ] Review a mapping as an authorized reviewer.
- [ ] Attempt review as `viewer`; expect 403.
- [ ] Try invalid request fields; expect 400.
- [ ] Verify Firestore documents are created only through the API.
- [ ] Confirm the frontend remains usable on mobile width.
- [ ] After deployment, repeat these tests using deployed URLs.

These checks are instructions, not a claim that the integration has been executed.
