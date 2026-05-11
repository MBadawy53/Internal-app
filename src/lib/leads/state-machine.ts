// Lead status state machine — pure functions, no I/O.
//
// The legal transitions and the set of transitions that demand an explicit
// reason. The server action is the single enforcement point: every status
// change goes through canTransition + needsReason. The UI uses the same
// helpers so it can show only valid next-states.

import { LeadStatus } from "@prisma/client";

/** Legal next-states from each current state. Empty array = terminal. */
const TRANSITIONS: Record<LeadStatus, LeadStatus[]> = {
  [LeadStatus.NEW]: [
    LeadStatus.ASSIGNED,
    LeadStatus.CONTACTED,
    LeadStatus.NO_ANSWER,
    LeadStatus.CREDIT_REJECTED_NT,
  ],
  [LeadStatus.ASSIGNED]: [
    LeadStatus.CONTACTED,
    LeadStatus.NO_ANSWER,
    LeadStatus.CREDIT_REJECTED_NT,
  ],
  [LeadStatus.CONTACTED]: [
    LeadStatus.NO_ANSWER,
    LeadStatus.APPLICATION_CREATED,
    LeadStatus.CREDIT_REJECTED_NT,
  ],
  [LeadStatus.NO_ANSWER]: [LeadStatus.CONTACTED, LeadStatus.CREDIT_REJECTED_NT],
  [LeadStatus.APPLICATION_CREATED]: [LeadStatus.CREDIT_APPROVED, LeadStatus.CREDIT_REJECTED_FT],
  [LeadStatus.CREDIT_APPROVED]: [LeadStatus.CONTRACTED, LeadStatus.CREDIT_REJECTED_FT],
  [LeadStatus.CONTRACTED]: [LeadStatus.LICENSING],
  [LeadStatus.LICENSING]: [],
  [LeadStatus.CREDIT_REJECTED_FT]: [],
  [LeadStatus.CREDIT_REJECTED_NT]: [],
};

/** Statuses that require a reason from the user when transitioning into them. */
const REQUIRES_REASON: ReadonlySet<LeadStatus> = new Set<LeadStatus>([
  LeadStatus.NO_ANSWER,
  LeadStatus.CREDIT_REJECTED_FT,
  LeadStatus.CREDIT_REJECTED_NT,
]);

export function allowedTransitions(from: LeadStatus): LeadStatus[] {
  return TRANSITIONS[from] ?? [];
}

export function canTransition(from: LeadStatus, to: LeadStatus): boolean {
  return allowedTransitions(from).includes(to);
}

export function needsReason(to: LeadStatus): boolean {
  return REQUIRES_REASON.has(to);
}

export function isTerminal(status: LeadStatus): boolean {
  return TRANSITIONS[status].length === 0;
}
