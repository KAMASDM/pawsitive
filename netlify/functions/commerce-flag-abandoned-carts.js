const { getServices } = require('./_commerce-utils');

exports.handler = async () => {
  try {
    const { db } = getServices();
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const snapshot = await db
      .collection('carts')
      .where('status', '==', 'active')
      .where('updatedAt', '<=', cutoff)
      .limit(100)
      .get();

    if (snapshot.empty) {
      return {
        statusCode: 200,
        body: JSON.stringify({ updated: 0 }),
      };
    }

    const batch = db.batch();
    snapshot.docs.forEach((cartDoc) => {
      batch.update(cartDoc.ref, {
        status: 'abandoned',
        abandonedAt: new Date(),
        updatedAt: new Date(),
      });
    });
    await batch.commit();

    return {
      statusCode: 200,
      body: JSON.stringify({ updated: snapshot.size }),
    };
  } catch (error) {
    console.error('[commerce-flag-abandoned-carts]', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
