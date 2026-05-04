import { describe, expect, it } from "vitest";
import { Role } from "@prisma/client";
import { can, scopeFor } from "@/lib/auth/rbac";
import { ForbiddenError, UnauthorizedError, requirePermission } from "@/lib/auth/permissions";

describe("RBAC matrix", () => {
  it("EMPLOYEE can read catalog and create own leads, cannot CRUD products", () => {
    expect(can(Role.EMPLOYEE, "read", "catalog")).toBe(true);
    expect(scopeFor(Role.EMPLOYEE, "create", "lead")).toBe("own");
    expect(can(Role.EMPLOYEE, "create", "product")).toBe(false);
    expect(can(Role.EMPLOYEE, "delete", "lead")).toBe(false);
  });

  it("TEAM_MANAGER inherits employee read scope but with team-wide reach on leads", () => {
    expect(scopeFor(Role.TEAM_MANAGER, "read", "lead")).toBe("team");
    expect(scopeFor(Role.TEAM_MANAGER, "export", "lead")).toBe("team");
    expect(can(Role.TEAM_MANAGER, "create", "product")).toBe(false);
  });

  it("BUSINESS_LINE_OWNER manages products in their BL and sees BL leads", () => {
    expect(scopeFor(Role.BUSINESS_LINE_OWNER, "create", "product")).toBe("businessLine");
    expect(scopeFor(Role.BUSINESS_LINE_OWNER, "read", "lead")).toBe("businessLine");
    expect(can(Role.BUSINESS_LINE_OWNER, "create", "user")).toBe(false);
  });

  it("ADMIN has all=true on every resource", () => {
    expect(scopeFor(Role.ADMIN, "create", "user")).toBe("all");
    expect(scopeFor(Role.ADMIN, "delete", "lead")).toBe("all");
    expect(scopeFor(Role.ADMIN, "update", "integrationConfig")).toBe("all");
    expect(scopeFor(Role.ADMIN, "read", "auditLog")).toBe("all");
  });
});

describe("requirePermission", () => {
  it("throws UnauthorizedError when actor is null", () => {
    expect(() => requirePermission(null, "read", "catalog")).toThrow(UnauthorizedError);
  });

  it("throws ForbiddenError when role lacks the permission", () => {
    expect(() =>
      requirePermission(
        { id: "u1", role: Role.EMPLOYEE, businessLineId: "bl1" },
        "create",
        "product",
      ),
    ).toThrow(ForbiddenError);
  });

  it("returns the granted scope when permitted", () => {
    const scope = requirePermission(
      { id: "u1", role: Role.TEAM_MANAGER, businessLineId: "bl1" },
      "list",
      "lead",
    );
    expect(scope).toBe("team");
  });
});
