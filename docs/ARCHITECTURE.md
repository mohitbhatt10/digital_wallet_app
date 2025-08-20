# Digital Wallet App - Current Architecture (Baseline Review)

Date: 2025-08-20

## High-Level Overview
Full‑stack monorepo containing:
- Backend: Spring Boot REST API (Java 17) with JPA (PostgreSQL), rudimentary JWT issuance, OAuth2 login scaffold, domain models for Users, Budgets, Categories, Expenses, Tags.
- Frontend: React 18 + TypeScript + Vite + Tailwind CSS 4 utility classes; simple router (react-router-dom) with landing page, auth forms, dashboard placeholder.

## Domain Model
User (id, email, username, password(bcrypt), first/last name, phone, roles[USER|ADMIN], provider[LOCAL|GOOGLE], createdAt)
Budget (user FK, year, month, amount, threshold)
Category (name, type, owner nullable => global vs user-defined)
Tag (name, owner)
Expense (user FK, category optional, tags many-to-many, amount, date, description)

Relationships:
- User 1..* Budgets
- User 1..* Expenses
- User 1..* Categories (user-defined subset)
- User 1..* Tags
- Expense *..* Tag
- Expense *..1 Category

## API Surface (Controllers)
AuthController (/auth)
- POST /signup : Registers local user (no email verification) -> returns JWT (uid claim)
- POST /login : Accepts usernameOrEmail + password but DOES NOT VERIFY PASSWORD (SECURITY ISSUE)

BudgetController (/budgets)
- POST / : Upsert budget for (year, month) for DEMO user hardcoded

CategoryController (/categories)
- POST / : Create category for DEMO user
- GET / : List categories (global + user-owned) for DEMO user

ExpenseController (/expenses)
- POST / : Create expense (date default now) for DEMO user; optional categoryId, tagIds

Missing endpoints: list/update/delete for most entities, tag management, expense querying, budget retrieval, reporting.

## Security
Spring Security configured stateless, permits /auth/** and requires auth for others, but controllers currently bypass security using demoUser().
Password verification absent in login endpoint -> any existing username/email yields a token.
JWT generation: uses io.jsonwebtoken (jjwt). Secret pulled from property; key derivation re-encodes secret via Base64 (double encode pattern) – functional but non-idiomatic.
No JWT validation filter implemented => tokens issued but not actually required (since controllers not wired to SecurityContext).
No CORS configuration present.

## Persistence
JPA entities with GenerationType.IDENTITY. ddl-auto=update (auto migration risk). PostgreSQL configured; no profile separation (dev/test/prod). No auditing annotations.
Repositories: basic CRUD + a few finder methods.

## Frontend
Routing: '/', '/login', '/signup', '/dashboard'.
State management: local component state only.
No API service layer (axios included but unused yet). No auth token storage or guarded routes.
Tailwind config present (classes used). UI is minimal skeleton: forms use alert() for submission.

## Build & Tooling
Backend: Standard Maven layout (pom not yet reviewed here). Single module.
Frontend: Vite script aliases minimal; no .env usage yet.

## Key Gaps / Risks
1. Authentication flow insecure (no password check, no JWT filter, hardcoded demo user).
2. Authorization / multi-user data separation not enforced.
3. Missing CRUD and query endpoints (cannot view budgets, expenses list, summaries).
4. Lack of validation for business rules (unique category name per user, budget uniqueness enforced only by upsert logic not constraint).
5. No tests (unit, integration, or UI) -> high regression risk.
6. Error handling minimal (no global exception handler / problem+json).
7. Observability lacking (no logging strategy, metrics beyond actuator not exposed here).
8. Frontend lacks API integration & auth guard; tokens not persisted or refreshed.
9. Secrets and environment (DB creds, JWT secret) stored directly in application.yml, no profiles.
10. Date/time handling: expenses default to LocalDate.now() (server timezone set to UTC globally) which is good, but no range queries exposed.

## Immediate Improvement Priorities (Suggested Roadmap)
Phase 1 (Security & Foundations):
- Implement password verification with AuthenticationManager.
- Add JWT authentication filter + UserDetailsService, remove demoUser() usages.
- Introduce password hashing already present; ensure login validates.
- Add CORS config & /auth responses unify error structure.
- Add dev vs prod profiles (application-dev.yml, application-prod.yml) + environment variable overrides.

Phase 2 (Domain & API Expansion):
- GET budget endpoint (current month) & list/history.
- Expense listing with pagination, filtering (date range, category, tags).
- Tag CRUD endpoints.
- Category update/delete; enforce uniqueness per user (db unique index on (owner_id, lower(name))).
- Budget threshold alert logic (service method to compute usage %).

Phase 3 (Frontend Integration):
- Create api client (axios instance) with interceptor injecting JWT from localStorage.
- Auth context + protected routes (redirect to /login if no token).
- Implement signup/login calls; handle errors.
- Dashboard fetch summary (budget, spent, remaining, recent expenses).
- Forms for adding expenses, categories, tags.

Phase 4 (Quality & Observability):
- Add unit tests (services), integration tests (controllers with @SpringBootTest + Testcontainers for PostgreSQL), frontend component tests (Vitest / React Testing Library).
- Centralized exception handler (@ControllerAdvice) returning consistent JSON error envelope.
- Add basic logging (slf4j) and structured logs.
- Add Flyway or Liquibase for schema migrations (replace ddl-auto).

Phase 5 (Enhancements):
- OAuth2 Google login completion (map principal -> User, JWT issuance).
- Refresh tokens / short-lived access tokens.
- Budget analytics endpoints (monthly spend per category, trends).
- Multi-currency support & exchange rates (future).

## Data Integrity Recommendations
- Add unique constraint budgets(user_id, budget_year, budget_month).
- Add unique constraint categories(owner_id, lower(name)).
- Add index on expenses(user_id, date).

## Proposed Package Additions
Backend:
- Add security.jwt package with filter + util.
- Add exception package (ApiError, GlobalExceptionHandler).
- Add dto responses (BudgetResponse, ExpenseResponse) to avoid exposing entity internals.
Frontend:
- src/api/http.ts (axios instance)
- src/context/AuthContext.tsx
- src/hooks/useAuth.ts
- src/types/*.d.ts for DTO shapes.

## Open Questions
- Do we need multi-tenant separation beyond per-user (e.g., household sharing)?
- Are budgets only monthly or also yearly/flexible periods?
- Should expenses support income (positive vs negative) classification? (Could repurpose Category.type.)
- Do we need soft deletes or audit history?

## Summary
Current code is an MVP scaffold with core entities and minimal endpoints. Security and CRUD completeness are priority gaps. The outlined roadmap aims to secure, expand, and harden the application incrementally.
