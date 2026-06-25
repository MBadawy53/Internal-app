// Lead status state machine — pure functions, no I/O.
//
// The legal transitions and the set of transitions that demand an explicit
// reason. The server action is the single enforcement point: every status
// change goes through canTransition + needsReason. The UI uses the same
// helpers so it can show only valid next-states.

import { LeadAppStatus, LeadProductStatus, LeadTrack } from "@prisma/client";

/** Encoded (appStatus, productStatus) pair. */
export interface LeadState {
  appStatus: LeadAppStatus;
  productStatus: LeadProductStatus;
}

function key(s: LeadState): string {
  return `${s.appStatus}__${s.productStatus}`;
}

/**
 * Legal next-state pairs for the new two-dimensional model, derived from
 * the Auto Loans status reference doc. Empty array = terminal.
 *
 * From any active state the user can move to (current_app, HOLD) when the
 * client withdraws — added as a global escape hatch in `allowedStates`
 * rather than every row of this map.
 */
const STATE_FLOW: Record<string, LeadState[]> = {
  // ── Credit assessment dimension (product stays at P_INITIATE) ──
  [key({ appStatus: LeadAppStatus.CREDIT_RISK, productStatus: LeadProductStatus.P_INITIATE })]: [
    { appStatus: LeadAppStatus.INCOMPLETE, productStatus: LeadProductStatus.P_INITIATE },
    { appStatus: LeadAppStatus.SALES, productStatus: LeadProductStatus.P_INITIATE },
    { appStatus: LeadAppStatus.APPROVAL, productStatus: LeadProductStatus.P_INITIATE },
  ],
  [key({ appStatus: LeadAppStatus.INCOMPLETE, productStatus: LeadProductStatus.P_INITIATE })]: [
    { appStatus: LeadAppStatus.CREDIT_RISK, productStatus: LeadProductStatus.P_INITIATE },
    { appStatus: LeadAppStatus.INVESTIGATION, productStatus: LeadProductStatus.P_INITIATE },
    { appStatus: LeadAppStatus.SALES, productStatus: LeadProductStatus.P_INITIATE },
  ],
  [key({ appStatus: LeadAppStatus.INVESTIGATION, productStatus: LeadProductStatus.P_INITIATE })]: [
    { appStatus: LeadAppStatus.SALES, productStatus: LeadProductStatus.P_INITIATE },
    { appStatus: LeadAppStatus.APPROVAL, productStatus: LeadProductStatus.P_INITIATE },
  ],
  [key({ appStatus: LeadAppStatus.SALES, productStatus: LeadProductStatus.P_INITIATE })]: [
    { appStatus: LeadAppStatus.CREDIT_RISK, productStatus: LeadProductStatus.P_INITIATE },
    { appStatus: LeadAppStatus.INVESTIGATION, productStatus: LeadProductStatus.P_INITIATE },
  ],
  [key({ appStatus: LeadAppStatus.APPROVAL, productStatus: LeadProductStatus.P_INITIATE })]: [
    { appStatus: LeadAppStatus.APPROVED_CLIENT, productStatus: LeadProductStatus.PRE_EXECUTION },
    { appStatus: LeadAppStatus.DENIED, productStatus: LeadProductStatus.HOLD },
  ],

  // ── Fulfilment dimension (app stays at APPROVED_CLIENT) ──
  [key({
    appStatus: LeadAppStatus.APPROVED_CLIENT,
    productStatus: LeadProductStatus.PRE_EXECUTION,
  })]: [
    { appStatus: LeadAppStatus.APPROVED_CLIENT, productStatus: LeadProductStatus.EXECUTION },
    { appStatus: LeadAppStatus.APPROVED_CLIENT, productStatus: LeadProductStatus.SALES },
  ],
  [key({ appStatus: LeadAppStatus.APPROVED_CLIENT, productStatus: LeadProductStatus.EXECUTION })]: [
    { appStatus: LeadAppStatus.APPROVED_CLIENT, productStatus: LeadProductStatus.P_REGISTER },
  ],
  [key({ appStatus: LeadAppStatus.APPROVED_CLIENT, productStatus: LeadProductStatus.P_REGISTER })]:
    [{ appStatus: LeadAppStatus.APPROVED_CLIENT, productStatus: LeadProductStatus.CONTRACT }],
  [key({ appStatus: LeadAppStatus.APPROVED_CLIENT, productStatus: LeadProductStatus.SALES })]: [
    { appStatus: LeadAppStatus.APPROVED_CLIENT, productStatus: LeadProductStatus.EXECUTION },
  ],
  [key({ appStatus: LeadAppStatus.APPROVED_CLIENT, productStatus: LeadProductStatus.CONTRACT })]:
    [],

  // ── Terminal / paused states ──
  [key({ appStatus: LeadAppStatus.DENIED, productStatus: LeadProductStatus.HOLD })]: [],
  [key({ appStatus: LeadAppStatus.HOLD, productStatus: LeadProductStatus.HOLD })]: [],
  [key({ appStatus: LeadAppStatus.APPROVED_CLIENT, productStatus: LeadProductStatus.HOLD })]: [
    // Re-engaging a held approved client resumes them at pre-execution.
    { appStatus: LeadAppStatus.APPROVED_CLIENT, productStatus: LeadProductStatus.PRE_EXECUTION },
  ],
};

/** A transition INTO any of these requires the user to supply a reason. */
const REQUIRES_STATE_REASON: ReadonlySet<string> = new Set<string>([
  key({ appStatus: LeadAppStatus.DENIED, productStatus: LeadProductStatus.HOLD }),
  key({ appStatus: LeadAppStatus.HOLD, productStatus: LeadProductStatus.HOLD }),
  key({ appStatus: LeadAppStatus.APPROVED_CLIENT, productStatus: LeadProductStatus.HOLD }),
]);

/**
 * Legal next states from a given current state. Includes the global
 * "withdraw to HOLD" escape: from any non-terminal state the actor may
 * mark the product status as HOLD (keeping the current app status).
 */
export function allowedStates(from: LeadState): LeadState[] {
  const base = STATE_FLOW[key(from)] ?? [];
  // Don't offer HOLD escape from already-HOLD or DENIED/HOLD or terminal CONTRACT.
  if (
    from.productStatus === LeadProductStatus.HOLD ||
    from.appStatus === LeadAppStatus.DENIED ||
    (from.appStatus === LeadAppStatus.APPROVED_CLIENT &&
      from.productStatus === LeadProductStatus.CONTRACT)
  ) {
    return base;
  }
  const hold = { appStatus: from.appStatus, productStatus: LeadProductStatus.HOLD };
  if (!base.some((s) => s.appStatus === hold.appStatus && s.productStatus === hold.productStatus)) {
    return [...base, hold];
  }
  return base;
}

export function canTransitionState(from: LeadState, to: LeadState): boolean {
  return allowedStates(from).some(
    (s) => s.appStatus === to.appStatus && s.productStatus === to.productStatus,
  );
}

export function needsReasonForState(to: LeadState): boolean {
  return REQUIRES_STATE_REASON.has(key(to));
}

export function isTerminalState(s: LeadState): boolean {
  return (STATE_FLOW[key(s)] ?? []).length === 0 && s.productStatus === LeadProductStatus.HOLD
    ? true
    : (STATE_FLOW[key(s)] ?? []).length === 0;
}

/** Default initial state when a lead is created. */
export const DEFAULT_STATE: LeadState = {
  appStatus: LeadAppStatus.INCOMPLETE,
  productStatus: LeadProductStatus.P_INITIATE,
};

/** Track is informational, not part of the state machine. Re-exported so
 *  callers don't need to import from @prisma/client. */
export { LeadAppStatus, LeadProductStatus, LeadTrack };
