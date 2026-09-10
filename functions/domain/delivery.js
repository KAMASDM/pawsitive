// A lease prevents concurrent scheduler invocations from sending the same item.
// Provider acceptance and device delivery are deliberately separate concepts.
async function deliverOnce(db, path, send, now = Date.now()) {
  const record = db.ref(path);
  const claim = await record.transaction((current) => {
    if (current?.status === 'accepted' || current?.status === 'skipped') return;
    if (current?.status === 'sending' && current.leaseUntil > now) return;
    return { status: 'sending', attemptedAt: now, leaseUntil: now + 120000, attempts: (current?.attempts || 0) + 1 };
  });
  if (!claim.committed) return { status: 'already_processed' };
  try {
    const result = await send();
    if (result?.success === false) throw new Error('Provider rejected the request');
    const status = result?.skipped ? 'skipped' : 'accepted';
    await record.update({ status, finishedAt: Date.now(), leaseUntil: null });
    return { status };
  } catch (error) {
    await record.update({ status: 'failed', finishedAt: Date.now(), leaseUntil: null, error: String(error.code || 'send_failed').slice(0, 100) });
    return { status: 'failed' };
  }
}

module.exports = { deliverOnce };
