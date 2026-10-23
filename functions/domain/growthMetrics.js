// Aggregate only allowlisted activity; no names, link tokens, content or account
// identifiers are returned. These are measured-account funnels, not all visitors.
function summarizeGrowth(accounts, now = Date.now()) {
  const result = { measuredSignups: 0, setupEligible: 0, firstPetWithin24Hours: 0, firstUsefulActionWithin24Hours: 0, importStartedAccounts: 0, importSavedAccounts: 0, starterPlanAccounts: 0, safetySharingAccounts: 0, weeklySharingAccounts: 0, familySharingAccounts: 0, sharedLinkSignups: { safety: 0, week: 0, family: 0 } };
  for (const records of Object.values(accounts || {})) {
    const events = Object.values(records || {}).filter(item => Number.isFinite(item?.timestamp) && item.timestamp <= now);
    const has = name => events.some(item => item.name === name);
    const signup = events.find(item => item.name === 'signup_completed');
    if (signup) {
      result.measuredSignups++;
      if (now >= signup.timestamp + 86400000) {
        result.setupEligible++;
        const firstDay = events.filter(item => item.timestamp >= signup.timestamp && item.timestamp <= signup.timestamp + 86400000);
        if (firstDay.some(item => item.name === 'pet_created')) result.firstPetWithin24Hours++;
        if (firstDay.some(item => ['health_record_saved', 'routine_created', 'routine_completed'].includes(item.name))) result.firstUsefulActionWithin24Hours++;
      }
    }
    for (const [name, key] of [['record_import_started','importStartedAccounts'], ['record_import_saved','importSavedAccounts'], ['starter_plan_saved','starterPlanAccounts'], ['safety_card_shared','safetySharingAccounts'], ['weekly_card_shared','weeklySharingAccounts'], ['care_invitation_shared','familySharingAccounts']]) if (has(name)) result[key]++;
    for (const source of ['safety','week','family']) if (has(`${source}_link_signup`) && signup) result.sharedLinkSignups[source]++;
  }
  return result;
}
module.exports = { summarizeGrowth };
