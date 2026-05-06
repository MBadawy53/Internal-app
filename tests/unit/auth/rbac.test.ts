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
        {
          id: "u1",
          role: Role.EMPLOYEE,
          businessLineId: "bl1",
          canEditProducts: false,
          canEditCatalog: false,
        },
        "create",
        "product",
      ),
    ).toThrow(ForbiddenError);
  });

  it("returns the granted scope when permitted", () => {
    const scope = requirePermission(
      {
        id: "u1",
        role: Role.TEAM_MANAGER,
        businessLineId: "bl1",
        canEditProducts: false,
        canEditCatalog: false,
      },
      "list",
      "lead",
    );
    expect(scope).toBe("team");
  });

  it("canEditProducts flag grants 'all' scope on product CRUD regardless of role", () => {
    const actor = {
      id: "u1",
      role: Role.EMPLOYEE,
      businessLineId: null,
      canEditProducts: true,
      canEditCatalog: false,
    };
    expect(requirePermission(actor, "create", "product")).toBe("all");
    expect(requirePermission(actor, "update", "product")).toBe("all");
    expect(requirePermission(actor, "delete", "product")).toBe("all");
    // But the flag does NOT grant catalog rights.
    expect(() => requirePermission(actor, "create", "productCategory")).toThrow(ForbiddenError);
  });

  it("canEditCatalog flag grants 'all' scope on category and variable CRUD", () => {
    const actor = {
      id: "u2",
      role: Role.EMPLOYEE,
      businessLineId: null,
      canEditProducts: false,
      canEditCatalog: true,
    };
    expect(requirePermission(actor, "create", "productCategory")).toBe("all");
    expect(requirePermission(actor, "update", "productCategory")).toBe("all");
    expect(requirePermission(actor, "create", "productVariable")).toBe("all");
    // But the flag does NOT grant product CRUD.
    expect(() => requirePermission(actor, "create", "product")).toThrow(ForbiddenError);
  });
});
