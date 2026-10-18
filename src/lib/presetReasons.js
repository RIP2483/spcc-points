// Preset point reasons grouped by category.
// `amount` is signed: positive = award, negative = deduction.
// `department` (optional) restricts a group to only show for that department's members.
// `fillable` marks reasons that need the user to complete a blank (___).

export const PRESET_GROUPS = [
  {
    id: 'general',
    label: '📋 General',
    items: [
      { reason: 'Attended an exco meeting',               amount:  2 },
      { reason: 'Attended a general committee meeting',   amount:  2 },
      { reason: 'Attended a department meeting',          amount:  2 },
      { reason: 'Attended an SPCC event',                 amount:  2 },
      { reason: 'Volunteered at ___',                     amount:  2, fillable: true },
      { reason: 'Acted in a promotional reel',            amount:  3 },
      { reason: 'Completed a standard assigned task',     amount:  2 },
      { reason: 'Successful event (heads only)',          amount:  8 },
      { reason: 'Covering for an absent committee member',amount:  3 },
      { reason: 'Failure to complete the assigned task within the required timeframe', amount: -2 },
      { reason: 'Failure to respond within a 24-hour period',                          amount: -1 },
    ],
  },
  {
    id: 'events',
    label: '🎪 Events',
    department: 'events',
    items: [
      { reason: 'Prepared pre-event proposal',          amount: 3 },
      { reason: 'Prepared event checklist',             amount: 1 },
      { reason: 'Secured a sponsorship',                amount: 6 },
      { reason: 'Prepared event schedule/run sheet',    amount: 1 },
      { reason: 'Secured a vendor',                     amount: 3 },
      { reason: 'Managed the participant registration', amount: 3 },
      { reason: 'Prepared post-event proposal',         amount: 2 },
      { reason: 'Hosted the event as the emcee',        amount: 2 },
    ],
  },
  {
    id: 'media',
    label: '🎬 Media',
    department: 'media',
    items: [
      { reason: 'Provided photo and video coverage for the event', amount: 2 },
      { reason: 'Designed a poster',                               amount: 2 },
      { reason: 'Filmed a reel video',                             amount: 2 },
      { reason: 'Edited event photographs',                        amount: 2 },
      { reason: 'Edited a short reel/video',                       amount: 2 },
    ],
  },
  {
    id: 'bonus',
    label: '⭐ Bonus',
    items: [
      { reason: 'Task completed before deadline',                        amount: 1 },
      { reason: 'Took over an urgent task',                              amount: 1 },
      { reason: 'Helped another department',                             amount: 1 },
      { reason: 'Stayed beyond assigned duty to help',                   amount: 1 },
      { reason: 'Received exceptional feedback for work',                amount: 1 },
      { reason: 'Brought useful sponsorship/collaboration opportunity',  amount: 2 },
    ],
  },
]
