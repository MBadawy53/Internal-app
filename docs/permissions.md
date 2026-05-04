# Permissions (RBAC)

The full permission matrix lives in code at [`src/lib/auth/rbac.ts`](../src/lib/auth/rbac.ts). This doc reflects that source of truth.

Each cell shows the **row scope** the role is granted for that `action:resource` permission. Empty cells mean **denied**.

Scopes:

- `own` — only rows where actor is referrer/owner
- `team` — rows owned by actor's direct reports
- `businessLine` — rows in actor's business line
- `all` — every row

## Catalog & Calculator

| Resource   | Action | EMPLOYEE | TEAM_MANAGER | BL_OWNER     | ADMIN |
| ---------- | ------ | -------- | ------------ | ------------ | ----- |
| catalog    | read   | all      | all          | all          | all   |
| product    | list   | all      | all          | all          | all   |
| product    | read   | all      | all          | all          | all   |
| product    | create |          |              | businessLine | all   |
| product    | update |          |              | businessLine | all   |
| product    | delete |          |              | businessLine | all   |
| calculator | read   | all      | all          | all          | all   |

## Leads & QR

| Resource | Action | EMPLOYEE | TEAM_MANAGER | BL_OWNER     | ADMIN |
| -------- | ------ | -------- | ------------ | ------------ | ----- |
| lead     | create | own      | team         | businessLine | all   |
| lead     | read   | own      | team         | businessLine | all   |
| lead     | list   | own      | team         | businessLine | all   |
| lead     | update | own      | team         | businessLine | all   |
| lead     | delete |          |              |              | all   |
| lead     | export | own      | team         | businessLine | all   |
| lead     | assign | own\*    | team         | businessLine | all   |
| qr       | create | own      | own          | own          | all   |
| qr       | read   | own      | team         | businessLine | all   |
| qr       | update | own      | own          | own          | all   |
| qr       | delete | own      | own          | own          | all   |

\* Employees can only "assign" by referring leads to other business lines (cross-BL referral).

## Notifications & Reports

| Resource     | Action | EMPLOYEE | TEAM_MANAGER | BL_OWNER     | ADMIN |
| ------------ | ------ | -------- | ------------ | ------------ | ----- |
| notification | read   | own      | own          | own          | all   |
| notification | update | own      | own          | own          | all   |
| report       | read   | own      | team         | businessLine | all   |

## Admin

| Resource          | Action             | ADMIN only |
| ----------------- | ------------------ | ---------- |
| user              | CRUD + list        | ✓          |
| businessLine      | CRUD + list        | ✓          |
| integrationConfig | read, update       | ✓          |
| auditLog          | read, list         | ✓          |
| messageTemplate   | read, list, update | ✓          |

## Enforcement

Every server action / API route calls `requirePermission(actor, action, resource)` which:

1. Throws `UnauthorizedError` if no actor.
2. Throws `ForbiddenError` if the role lacks the permission.
3. Returns the `Scope` so the caller can constrain the query (e.g. `WHERE owner_id = actor.id` for `own`).

UI never decides authorization on its own — it may **hide** disallowed actions, but the server always re-checks.
