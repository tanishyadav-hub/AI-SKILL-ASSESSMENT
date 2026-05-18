# Security Specification - Mock Interview Platform

## Data Invariants
1. An Interview document must be linked to a valid session ID.
2. Only the owner (linked by email or studentName) should ideally see their interview results if they were authenticated, but for this anonymous session-based app, the sessionId is the primary key.
3. Once an interview is 'completed', the evaluation cannot be modified by the client.

## The Dirty Dozen Payloads

1. **Identity Spoofing**: Attempt to create an interview document with another user's email.
2. **Evaluation Injection**: Attempt to set your own score to 100 before the interview finishes.
3. **Session Hijacking**: Attempt to read an interview document that doesn't belong to your session ID.
4. **Mass Scrape**: Attempt to list all interviews in the collection.
5. **Shadow Field Injection**: Adding `isAdmin: true` to a message payload.
6. **System Field Modification**: Attempting to change `systemInstruction` via client write.
7. **Timestamp Spoofing**: Setting `createdAt` to a date in the past.
8. **Malicious ID**: Creating a document with a 1MB string as the ID.
9. **Status Short-circuit**: Setting status to 'completed' without any messages.
10. **Role Escalation**: Attempting to set `role: 'model'` for a user-provided message.
11. **Negative Score**: Attempting to set an evaluation score of -50.
12. **Orphaned Message**: Adding a message to a session that doesn't exist.

## The Test Runner
(A `firestore.rules.test.ts` would normally verify these, but since the server handles writes, client writes will be blocked by default.)
