const {
  FieldValue,
  Timestamp,
  getServices,
  handleOptions,
  jsonResponse,
  parseJsonBody,
  requireAdmin,
  requireAuth,
  writeUserNotification,
} = require('./_commerce-utils');

const ALLOWED_STATUSES = ['pending', 'documentation_required', 'under_review', 'approved', 'rejected', 'suspended'];

exports.handler = async (event) => {
  const options = handleOptions(event);
  if (options) return options;
  if (event.httpMethod !== 'POST') return jsonResponse(405, event, { error: 'Method not allowed' });

  try {
    const decoded = await requireAuth(event);
    requireAdmin(decoded);

    const { vendorId, status, note = '' } = parseJsonBody(event);
    if (!vendorId || !ALLOWED_STATUSES.includes(status)) {
      return jsonResponse(400, event, { error: 'Valid vendorId and status are required.' });
    }

    const { db } = getServices();
    const vendorRef = db.doc(`vendors/${vendorId}`);
    const vendorSnap = await vendorRef.get();
    if (!vendorSnap.exists) {
      return jsonResponse(404, event, { error: 'Vendor not found.' });
    }

    const vendor = vendorSnap.data();
    const historyItem = {
      from: vendor.status || null,
      to: status,
      note,
      changedBy: decoded.uid,
      changedAt: Timestamp.now(),
    };
    const update = {
      status,
      reviewNote: note,
      statusHistory: FieldValue.arrayUnion(historyItem),
      updatedAt: FieldValue.serverTimestamp(),
    };

    if (status === 'approved') {
      update.approvedAt = FieldValue.serverTimestamp();
      update.approvedBy = decoded.uid;
    }

    await vendorRef.update(update);

    if (vendor.ownerUid) {
      await writeUserNotification(vendor.ownerUid, {
        type: 'vendor_status',
        title: `Vendor ${status.replace(/_/g, ' ')}`,
        body: note || `Your Pawppy vendor status is now ${status.replace(/_/g, ' ')}.`,
        data: {
          type: 'vendor_status',
          vendorId,
          status,
          click_action: '/vendor/status',
        },
      });
    }

    return jsonResponse(200, event, { success: true, vendorId, status });
  } catch (error) {
    console.error('[commerce-set-vendor-status]', error);
    return jsonResponse(error.statusCode || 500, event, { error: error.message });
  }
};
