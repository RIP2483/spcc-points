/**
 * Determines if `actor` (the logged-in user profile) is allowed to award/deduct
 * points for `target` (the recipient profile).
 *
 * Rules:
 * - secretary: can target anyone (including themselves)
 * - exco: can target other exco + heads + secretary; CANNOT target committee or themselves
 * - head: can target committee in own dept + other heads + exco; CANNOT target secretary or themselves
 * - committee: cannot target anyone
 */
export function canAwardTo(actor, target) {
  if (!actor || !target) return false

  const { role: aRole, department: aDept, id: aId } = actor
  const { role: tRole, department: tDept, id: tId } = target

  if (aRole === 'secretary') return true

  if (aRole === 'exco') {
    if (tId === aId) return false
    return tRole === 'exco' || tRole === 'head' || tRole === 'secretary'
  }

  if (aRole === 'head') {
    if (tId === aId) return false
    if (tRole === 'committee') return tDept === aDept
    if (tRole === 'head') return true
    if (tRole === 'exco') return true   // can award but NOT view
    return false
  }

  return false
}

/**
 * Determines if `actor` can VIEW the points/history of `target`.
 */
export function canViewMember(actor, target) {
  if (!actor || !target) return false

  const { role: aRole, department: aDept, id: aId } = actor
  const { role: tRole, department: tDept, id: tId } = target

  if (aId === tId) return true
  if (aRole === 'secretary') return true
  if (aRole === 'exco') return true   // exco sees everyone
  if (aRole === 'head') {
    // heads can only see their own dept committee + other heads (NOT exco, NOT secretary)
    if (tRole === 'committee') return tDept === aDept
    if (tRole === 'head') return true
    return false
  }
  return false
}

/** Returns a human-readable label for a role string */
export function roleLabel(role) {
  const map = {
    committee: 'Committee Member',
    head: 'Department Head',
    exco: 'Exco',
    secretary: 'Secretary',
  }
  return map[role] ?? role
}

/** Returns a CSS badge class for a role */
export function roleBadgeClass(role) {
  const map = {
    committee: 'badge-role-committee',
    head: 'badge-role-head',
    exco: 'badge-role-exco',
    secretary: 'badge-role-secretary',
  }
  return `badge ${map[role] ?? 'badge-role-committee'}`
}

/** Formats a timestamp to a readable string */
export function formatDate(ts) {
  if (!ts) return '—'
  return new Date(ts).toLocaleString('en-MY', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

/** Returns "+15" or "−5" styled string */
export function formatAmount(amount) {
  return amount >= 0 ? `+${amount}` : `${amount}`
}
