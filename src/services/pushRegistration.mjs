// Retry transient setup failures on reconnect/resume, without repeatedly prompting.
export function createPushRegistrationSync({ getUser, register, now = Date.now }) {
  let registeredUid = null, pending = null, failedAt = 0;
  return async function sync({ forceRetry = false } = {}) {
    const user = getUser();
    if (!user) { registeredUid = null; failedAt = 0; return; }
    if (!user.emailVerified && user.providerData?.some(provider => provider.providerId === 'password')) return;
    if (registeredUid === user.uid || pending || (!forceRetry && failedAt && now() - failedAt < 30000)) return;
    const uid = user.uid;
    pending = uid;
    try {
      const result = await register(uid, { prompt: false });
      if (getUser()?.uid !== uid) return;
      if (result?.success) { registeredUid = uid; failedAt = 0; }
      else failedAt = now();
    } catch { failedAt = now(); }
    finally { pending = null; }
  };
}
