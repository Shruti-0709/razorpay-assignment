# CLAUDE.md

General working instructions for frontend and web application projects.
These instructions describe how to work, not what task to build. Follow
the current task prompt and more-specific repository instructions.

## 1. Understand the repository first

-   Inspect the repository structure, `package.json`, source files,
    routes, styling setup, and available scripts before changing
    anything.
-   Identify the framework, build tool, package manager, installed
    libraries, and existing conventions.
-   Extend an existing application rather than replacing or
    re-scaffolding it without a clear reason.
-   Do not assume a backend, API, design system, or data model exists.
-   Briefly summarize the existing setup and material uncertainty before
    planning.

## 2. Clarifications and assumptions

-   Ask concise questions when ambiguity materially changes product
    behavior, data modeling, security, or implementation.
-   Do not interrupt progress for minor details that can be handled with
    sensible conventions.
-   If clarification is not essential, make the smallest reasonable
    assumption, state it briefly, and proceed.
-   Do not invent requirements or add unrelated features.

## 3. Plan first, then implement decisively

For a new application or substantial feature: 1. Read the full task and
inspect the repository. 2. Discuss a concise plan covering user flows,
acceptance criteria, pages/components, state, data flow, validation,
edge cases, and verification. 3. Resolve material questions before
implementation. 4. Once the user approves the plan, implement the
complete agreed scope in a coordinated pass. Do not unnecessarily pause
for approval after every component or small file change. 5. Run checks,
review the result, fix issues, and report what was actually verified.

The user wants a capable agent to execute an agreed plan, not a stream
of permission requests for routine implementation decisions. Make
coherent changes across related files when the approved plan calls for
them. Keep the implementation organized and reviewable; do not
artificially split every small change into separate approval cycles. If
a genuinely new ambiguity or blocker changes the agreed scope, pause and
ask. Under time pressure, prioritize a complete working core flow over
optional polish.

## 4. React architecture and maintainability

-   Prefer functional React components and hooks.
-   Keep components cohesive, modular, and reusable where reuse is
    meaningful.
-   Avoid giant components and unnecessary fragmentation into tiny
    components.
-   Separate presentation, state management, data access, and validation
    responsibilities where practical.
-   Keep state close to where it is used; lift it only when multiple
    components genuinely need it.
-   Derive values from existing state instead of duplicating them.
-   Avoid `useEffect` for values calculable during render or
    event-driven logic that belongs in event handlers.
-   Use stable, meaningful list keys and handle asynchronous work
    safely.
-   Prefer clear names, simple interfaces, and code another developer
    can extend.
-   Avoid premature abstractions, overengineering, and unnecessary
    dependencies.

## 5. Preferred frontend tools

Use these preferences when compatible with the repository and task. Do
not force them into an existing project. - Framework: React. - Styling:
Tailwind CSS. Follow the installed Tailwind version and configuration. -
Icons: prefer `lucide-react` when installed or when adding it is
reasonable. Use consistent sizes and stroke weights; do not use emoji as
interface icons. - Forms: Formik is preferred when a form library is
useful. - Validation: Yup works well with Formik. - Shared client state:
Zustand may be used when state genuinely needs to be shared across
distant components or routes. - Local UI state: prefer React `useState`
or `useReducer`. - Do not introduce Redux, Zustand, Formik, or another
library merely for the sake of using it. Do not mix multiple form or
state libraries without a concrete reason. - Reuse the project's
existing component library and design tokens.

## 6. Visual design: professional fintech by default

Unless the task supplies a screenshot, brand system, or different
direction, use a clean, professional fintech/SaaS interface rather than
the default Vite starter aesthetic. - Prefer a white or very light
neutral page background, white surfaces, and subtle neutral borders. -
Use a restrained accent color for primary actions, links, selected
states, and important highlights. Avoid competing colors. - Use readable
sans-serif typography and a deliberate hierarchy for page titles,
section headings, labels, body text, and metadata. - Use consistent
spacing, alignment, widths, radii, and component heights. - Prefer clear
tables for dense transactional or financial data; use summary cards only
when they communicate useful metrics. - Use clear form layouts, visible
labels, concise helper text, and actionable validation messages. - Use
Lucide icons consistently where they improve recognition; do not add
icons decoratively to every label. - Make primary actions obvious and
secondary actions quieter. - Use subtle hover, focus, disabled, loading,
success, and error states. - Keep information density appropriate for a
real business dashboard. Avoid oversized empty hero sections and
unnecessary whitespace. - Avoid generic AI-dashboard styling: excessive
gradients, glassmorphism, bright multi-color backgrounds, gratuitous
shadows, too many rounded cards, decorative animations, and oversized
headings. - Ensure responsive behavior, semantic HTML, keyboard
usability, accessible labels, visible focus states, and sufficient
contrast. - Supplied screenshots, brand guidance, and explicit design
requirements take precedence.

## 7. Service layer and API integration

-   Keep network and data-access logic out of presentational components.
-   Create a clear service layer, for example `src/services/`, with
    domain-specific modules such as `paymentLinksService`,
    `customersService`, or `transactionsService`.
-   Components and hooks should call meaningful service functions such
    as `getPaymentLinks`, `createPaymentLink`, or
    `deactivatePaymentLink`.
-   Keep request/response handling, endpoint paths, and data mapping
    inside the service or API-client layer.
-   If a real backend/API is provided, use its documented endpoints and
    request/response shapes. Do not invent endpoint contracts.
-   If no backend is provided and a frontend prototype is expected,
    implement service functions that return realistic mock responses,
    preferably asynchronously. Keep mock data in `src/mocks/` or a
    dedicated mock-data module.
-   Do not call fake or nonexistent URLs just to imitate an API call. A
    mock service should clearly identify that its data is simulated.
-   Shape service function inputs and outputs so a real HTTP
    implementation can replace the mock implementation without rewriting
    the UI.
-   Handle loading, success, empty, and error states. Prevent duplicate
    submissions where appropriate.
-   Do not claim mock data is persisted remotely.

## 8. Forms, state, and edge cases

-   Validate inputs at appropriate boundaries and show actionable
    messages near relevant fields.
-   For Formik forms, use Yup schemas where suitable. Keep validation
    rules understandable and aligned with the task.
-   Use local state for local UI concerns; use Zustand only for
    genuinely shared client state.
-   Consider relevant edge cases: empty values, malformed input,
    duplicate submissions, boundary amounts, long text, no search
    results, stale selections, failed requests, and unexpected response
    data.
-   Do not expand scope with irrelevant edge cases.
-   Do not silently swallow errors.
-   Never hardcode secrets, credentials, or private tokens. Do not
    commit `.env` files or secrets.

## 9. Testing and verification

-   Inspect `package.json` scripts before choosing commands.
-   Run relevant available checks: lint, tests, type checks, and
    production build.
-   Test important user flows and edge cases, not just whether the page
    renders.
-   Add or update focused tests for important logic when a test setup
    exists and time permits.
-   If browser access or Playwright is available, use it for meaningful
    interaction checks. Do not install large testing dependencies for a
    quick task unless necessary.
-   If the user must perform browser verification, provide a short
    manual test checklist.
-   Report exactly which checks were run and their outcomes. Never claim
    a check passed unless it actually ran and passed. Explain checks
    that could not be run.

## 10. Review before finishing

-   Inspect the final diff for accidental changes, dead code, debug
    statements, broken imports, and unrelated formatting.
-   Pay special attention to state updates, form submission, validation,
    service/API behavior, filtering, sorting, async behavior, and error
    paths.
-   Check accessibility and responsive-layout issues.
-   Explain important files changed, decisions, assumptions, and known
    limitations concisely.

## 11. Git discipline

-   Do not create commits, branches, remotes, or push unless the user
    asks or task instructions require it.
-   Before committing, inspect `git status` and the diff.
-   Never add secrets, generated junk, dependency caches, or unrelated
    files.
-   Use clear commit messages describing the completed milestone.
-   If task instructions require milestone commits, create a separate
    commit for each completed milestone and verify the history.

## 12. Communication

-   Be direct, concise, and practical.
-   Explain meaningful trade-offs without overwhelming the user.
-   Flag blockers early.
-   Once the user approves a plan, execute it without asking for routine
    confirmation at every step.
-   Do not claim work is complete while required acceptance criteria
    remain unmet.
