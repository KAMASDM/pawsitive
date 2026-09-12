const policy = require('./domain/copilot');

async function generateWithVertex({ admin, question, mode, sources }) {
  const project = process.env.GCLOUD_PROJECT || process.env.GOOGLE_CLOUD_PROJECT;
  if (!project || project.startsWith('demo-') || process.env.FUNCTIONS_EMULATOR === 'true') throw new Error('provider-not-configured');
  const token = await admin.credential.applicationDefault().getAccessToken();
  const response = await fetch(`https://aiplatform.googleapis.com/v1/projects/${encodeURIComponent(project)}/locations/global/publishers/google/models/${policy.MODEL}:generateContent`, {
    method: 'POST', signal: AbortSignal.timeout(30000),
    headers: { Authorization: `Bearer ${token.access_token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: policy.SYSTEM_PROMPT }] },
      contents: [{ role: 'user', parts: [{ text: JSON.stringify({ question, mode, approvedSources: sources }) }] }],
      generationConfig: { maxOutputTokens: 1024, candidateCount: 1, thinkingConfig: { thinkingLevel: 'MINIMAL' }, responseMimeType: 'application/json', responseSchema: { type: 'OBJECT', required: ['answer', 'references', 'followUpQuestions'], properties: { answer: { type: 'STRING' }, references: { type: 'ARRAY', items: { type: 'STRING' } }, followUpQuestions: { type: 'ARRAY', items: { type: 'STRING' } } } } },
    }),
  });
  if (!response.ok) throw new Error(`provider-${response.status}`);
  const data = await response.json();
  const candidate = data.candidates?.[0];
  if (candidate?.finishReason !== 'STOP') throw new Error('provider-incomplete');
  const output = JSON.parse((candidate.content?.parts || []).filter(part => !part.thought && typeof part.text === 'string').map(part => part.text).join(''));
  return { output, model: data.modelVersion || policy.MODEL, usage: { input: data.usageMetadata?.promptTokenCount || 0, output: data.usageMetadata?.candidatesTokenCount || 0 } };
}

module.exports = ({ functions, admin, generate = args => generateWithVertex({ ...args, admin }), now = Date.now }) => {
  const fail = (code, message) => { throw new functions.https.HttpsError(code, message); };
  const signedIn = context => {
    if (!context.auth?.uid) fail('unauthenticated', 'Sign in to use Copilot.');
    if (context.auth.token?.email_verified !== true) fail('permission-denied', 'Verify your email before using Copilot.');
    return context.auth.uid;
  };
  const callable = handler => functions.runWith({ memory: '256MB', timeoutSeconds: 60, maxInstances: 3 }).https.onCall(handler);
  const enabled = async () => (await admin.database().ref('copilotConfig/enabled').once('value')).val() === true;
  const contextFor = async (uid, petId) => {
    if (typeof petId !== 'string' || !/^[a-zA-Z0-9_-]{1,128}$/.test(petId)) fail('invalid-argument', 'Choose one of your own pets.');
    const [pet, owner] = await Promise.all([admin.database().ref(`userPets/${uid}/${petId}`).once('value'), admin.database().ref(`petOwners/${petId}`).once('value')]);
    if (!pet.exists() || owner.val() !== uid) fail('permission-denied', 'Copilot can only use your own pet records. Family access does not include AI summaries.');
    return policy.buildContext(pet.val());
  };
  return {
    getCopilotStatus: callable(async (_, context) => {
      signedIn(context);
      return { enabled: await enabled(), provider: 'Google Gemini on Vertex AI', model: policy.MODEL, consentVersion: policy.CONSENT_VERSION, dailyLimit: policy.DAILY_ACCOUNT_LIMIT };
    }),
    previewCopilotRecords: callable(async (data, context) => {
      const uid = signedIn(context);
      return contextFor(uid, data?.petId);
    }),
    askPetCopilot: callable(async (data, context) => {
      const uid = signedIn(context);
      if (!data || !['question', 'summary'].includes(data.mode) || data.consentVersion !== policy.CONSENT_VERSION || data.consent !== true) fail('invalid-argument', 'Review and approve AI processing before sending.');
      if (typeof data.question !== 'string' || !data.question.trim() || data.question.length > 1000 || !/^[a-zA-Z0-9_-]{16,80}$/.test(data.requestId || '')) fail('invalid-argument', 'Enter a question of up to 1,000 characters.');
      if (!(await enabled())) fail('failed-precondition', 'Copilot is not available right now. Your care tools still work.');
      if (data.mode === 'question' && (data.petId || data.fingerprint)) fail('invalid-argument', 'General questions do not include pet records.');
      const approved = data.mode === 'summary' ? await contextFor(uid, data.petId) : { sources: [] };
      if (data.mode === 'summary' && (data.approveRecords !== true || data.fingerprint !== approved.fingerprint)) fail('failed-precondition', 'These records changed or were not approved. Review a fresh preview before sending.');
      const safety = policy.safetyResponse(data.question);
      if (safety) return { answer: safety, references: [], followUpQuestions: [], safetyNotice: true, provider: 'Pawppy safety guidance', model: null };
      const usage = await admin.database().ref('copilotUsage/current').transaction(current => policy.reserveUsage(current, { uid, requestId: data.requestId, now: now() }));
      if (!usage.committed) fail('resource-exhausted', 'Copilot’s request limit was reached, this request was already sent, or requests are too close together. Wait a moment before retrying. Each account has 5 requests per UTC day; the beta also has a shared daily limit.');
      try {
        const result = await generate({ question: data.question.trim(), mode: data.mode, sources: approved.sources });
        // Recheck ownership and the preview after the network call as well.
        if (data.mode === 'summary' && (await contextFor(uid, data.petId)).fingerprint !== data.fingerprint) fail('failed-precondition', 'Your records changed while preparing the answer. Please review them again.');
        const answer = policy.validateAnswer(result.output, approved.sources, data.mode);
        return { ...answer, provider: 'Google Gemini on Vertex AI', model: result.model, fingerprint: approved.fingerprint || null };
      } catch (error) {
        if (error instanceof functions.https.HttpsError) throw error;
        // Deliberately do not log prompts, pet context, model output or provider bodies.
        console.warn('Copilot request did not produce a usable answer.');
        fail('unavailable', 'Copilot could not prepare a reliable answer. Please try later. No care records were changed.');
      }
    }),
  };
};
module.exports.generateWithVertex = generateWithVertex;
