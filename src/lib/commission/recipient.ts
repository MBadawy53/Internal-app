// Decides who earns the commission on a closed (CONTRACT) lead and which
// commission persona's tier applies.
//
// Rule (per product owner request 2026-05): leads brought in by an
// ambassador pay the ambassador (AMBASSADOR persona); leads coming from
// an employee directly pay the lead's owner (EMPLOYEE persona).

import { CommissionPersona, Role } from "@prisma/client";

export interface LeadRecipientInput {
  ownerEmployeeId: string | null;
  referredByEmployeeId: string | null;
  referredBy: { id: string; role: Role } | null;
  owner: { id: string; role: Role } | null;
}

export interface CommissionRecipient {
  userId: string;
  persona: CommissionPersona;
}

export function resolveCommissionRecipient(lead: LeadRecipientInput): CommissionRecipient | null {
  if (lead.referredBy && lead.referredBy.role === Role.AMBASSADOR) {
    return { userId: lead.referredBy.id, persona: CommissionPersona.AMBASSADOR };
  }
  if (lead.owner) {
    return { userId: lead.owner.id, persona: CommissionPersona.EMPLOYEE };
  }
  return null;
}
