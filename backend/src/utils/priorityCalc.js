const PRIORITY_SCORE = { critical: 1, high: 2, medium: 3, low: 4 };
const SLA_HOURS      = { critical: 2, high: 8, medium: 24, low: 48 };

function calcPriorityScore(priority) {
  return PRIORITY_SCORE[priority] || 3;
}

function calcSlaDeadline(priority, createdAt = new Date()) {
  const hours = SLA_HOURS[priority] || 24;
  return new Date(createdAt.getTime() + hours * 60 * 60 * 1000);
}

module.exports = { PRIORITY_SCORE, SLA_HOURS, calcPriorityScore, calcSlaDeadline };