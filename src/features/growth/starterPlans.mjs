export function starterSuggestions(type = '', lifeStage = 'adult', goal = 'steady') {
  const young = lifeStage === 'young';
  const quiet = lifeStage === 'older';
  const common = [
    { id: 'water', kind: 'water', title: 'Fresh water', time: '08:00', selected: true },
    { id: 'meal', kind: 'meal', title: 'Meal', time: '08:30', selected: false },
    { id: 'play', kind: 'play', title: young ? 'A little supervised play' : quiet ? 'Gentle enrichment' : 'Play & enrichment', time: '18:00', selected: false },
  ];
  let result;
  if (type.toLowerCase() === 'dog') result = [...common, { id: 'walk', kind: 'walk', title: quiet ? 'A gentle sniff break' : 'Walk & sniff time', time: '17:30', selected: false }];
  else if (type.toLowerCase() === 'cat') result = [...common, { id: 'litter', kind: 'litter', title: 'Litter care', time: '09:00', selected: false }];
  else result = [{ id: 'habitat', kind: 'other', title: 'Check their habitat', time: '08:00', selected: true }, { id: 'checkin', kind: 'other', title: 'Daily care check-in', time: '18:00', selected: false }];
  if (goal === 'settling') result.push({ id: 'settle', kind: 'other', title: 'A quiet check-in together', time: '19:00', selected: false });
  if (goal === 'shared') result.push({ id: 'handover', kind: 'other', title: 'Check in with their caregiver', time: '19:00', selected: false });
  return result;
}

export function routineAlreadyExists(existing, petId, item) {
  return Boolean(existing?.[`starter_${petId}_${item.id}`]) || Object.values(existing || {}).some(routine => routine.petId === petId && routine.kind === item.kind && routine.time === item.time);
}
export function refreshStarterSuggestions(type, previous, values) {
  const next = { ...previous, ...values };
  const priorDefaults = starterSuggestions(type, previous.lifeStage, previous.goal);
  const fresh = starterSuggestions(type, next.lifeStage, next.goal).map(item => {
    const edited = previous.suggestions.find(old => old.id === item.id);
    if (!edited) return item;
    const original = priorDefaults.find(old => old.id === item.id);
    return { ...item, selected: edited.selected, time: edited.time, title: edited.title !== original?.title ? edited.title : item.title };
  });
  const ids = new Set(fresh.map(item => item.id));
  for (const item of previous.suggestions) if (!ids.has(item.id) && item.selected) fresh.push(item);
  return { ...next, suggestions: fresh };
}

export function starterWrites(existing, petId, suggestions, day, timestamp) {
  const writes = {};
  for (const item of suggestions.filter(item => item.selected)) {
    if (!/^[a-z]{1,20}$/.test(item.id) || !['meal','water','walk','play','grooming','litter','other'].includes(item.kind) || !item.title?.trim() || item.title.trim().length > 80 || !/^([01]\d|2[0-3]):[0-5]\d$/.test(item.time)) throw new Error('Give each selected routine a name and a valid time.');
    const key = `starter_${petId}_${item.id}`;
    if (routineAlreadyExists(existing, petId, item)) continue;
    writes[key] = { petId, title: item.title.trim(), kind: item.kind, time: item.time, startDate: day, active: true, createdAt: timestamp };
  }
  return writes;
}
