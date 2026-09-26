# Customer Service Dashboard – Project Specification (spec.md)

## 1. Project Overview

### 1.1 Purpose
Build a web-based Customer Service Dashboard for small and mid-sized businesses (SMBs) to manage client inquiries (leads, support requests, complaints, feedback) in one place.

### 1.2 Goals
- Centralize all customer inquiries from multiple channels (web form, email, phone log, chat).
- Provide a clear workflow for handling inquiries from “New” to “Resolved”.
- Enable basic reporting on response times, resolution times, and team workload.
- Keep the system simple, affordable, and easy to maintain for SMBs.

### 1.3 Success Criteria
- Support staff can view, filter, assign, and update inquiries in under 2 clicks.
- Managers can see key metrics (open tickets, average response time, unresolved older than X days).
- The system is deployed on a standard web stack and can be hosted on common SMB infrastructure (e.g., shared hosting, small VPS, or managed cloud).

---

## 2. Scope

### 2.1 In Scope
- Web dashboard for internal users (support agents, managers, admins).
- Basic customer inquiry intake via:
  - Embedded web form on company site.
  - Manual entry by staff.
  - (Optional later) Email parsing / API integrations.
- Inquiry lifecycle management:
  - Statuses: New, In Progress, Waiting on Customer, Resolved, Closed.
  - Priority: Low, Medium, High, Urgent.
  - Assignment to agents.
  - Internal notes and customer-facing responses (log).
- Basic reporting and filters.
- User authentication and roles (Admin, Manager, Agent).
- Version-controlled development with Git.

### 2.2 Out of Scope (for MVP)
- Advanced CRM features (deals, pipelines, marketing automation).
- Complex SLA engines.
- Native mobile apps (responsive web only for MVP).
- Multi-tenant SaaS architecture (single company instance for MVP).

---

## 3. Users & Roles

### 3.1 Roles
- **Admin**
  - Manage users and roles.
  - Configure statuses, priorities, and basic settings.
  - Access all reports and data.
- **Manager**
  - View all inquiries.
  - Assign/reassign inquiries.
  - Access team performance reports.
- **Agent**
  - View assigned inquiries.
  - Update status, add notes, log communications.
  - Mark inquiries as Resolved (subject to policy).

---

## 4. Functional Requirements

### 4.1 Inquiry Management

#### 4.1.1 Create Inquiry
- Via web form (public):
  - Fields: Name, Email, Phone (optional), Subject, Category, Message, Consent checkbox.
- Via internal UI:
  - Same fields plus: Source (Web, Phone, Email, Chat, Other), Initial Status, Priority, Assigned Agent.

#### 4.1.2 View & Filter Inquiries
- List view with columns:
  - ID, Subject, Customer Name, Source, Status, Priority, Assigned Agent, Created At, Last Updated.
- Filters:
  - By status, priority, agent, date range, source, category, text search.
- Sorting:
  - By created date, updated date, priority, status.

#### 4.1.3 Inquiry Details
- Detail view includes:
  - Customer info.
  - Full conversation log (internal notes + customer messages).
  - Timeline of status/priority/assignment changes.
  - Attachments (if any).
  - Quick actions: change status, change priority, assign, add note, send response.

#### 4.1.4 Status & Workflow
- Allowed transitions (configurable, default):
  - New → In Progress
  - In Progress → Waiting on Customer
  - Waiting on Customer → In Progress
  - In Progress → Resolved
  - Resolved → Closed (after X days or manually)
- Automatic rules (MVP optional):
  - Auto-close Resolved tickets after N days of inactivity.

#### 4.1.5 Assignment & Notifications
- Agents can be assigned/unassigned by Managers/Admins.
- Optional email notifications:
  - On new assignment.
  - On status change to “Waiting on Customer”.
  - On resolution/closure.

### 4.2 Reporting & Dashboards

#### 4.2.1 Main Dashboard (Home)
- Widgets:
  - Open inquiries by status.
  - Inquiries by priority.
  - Inquiries by agent (count and average age).
  - SLA-like indicators:
    - % of inquiries first-response within X hours.
    - Inquiries older than N days still open.

#### 4.2.2 Reports
- Predefined reports:
  - Daily/Weekly/Monthly volume of new inquiries.
  - Average first response time.
  - Average resolution time.
  - Agent workload and performance summary.
- Export to CSV (MVP).

### 4.3 User Management & Security

- Authentication:
  - Email + password (with password reset).
  - Optional SSO later.
- Roles & permissions as defined in Section 3.
- Audit log:
  - Record who changed what and when (for key actions).

### 4.4 Integrations (MVP vs Future)

- MVP:
  - Web form integration (embeddable snippet or hosted form).
  - Manual entry.
- Future:
  - Email inbox parsing (IMAP/API).
  - Chat widget integration.
  - Basic CRM / ERP sync.

---

## 5. Non-Functional Requirements

### 5.1 Performance
- List views load in under 2 seconds for up to 10k inquiries.
- Dashboard widgets load in under 3 seconds.

### 5.2 Security
- HTTPS only.
- Passwords hashed with a strong algorithm (e.g., bcrypt/argon2).
- Role-based access control enforced on backend and API.
- Basic protection against common web vulnerabilities (XSS, CSRF, SQL injection).

### 5.3 Maintainability
- Clean separation between frontend, backend, and database.
- Codebase in Git with clear commit history.
- Documentation for setup, deployment, and operations.

### 5.4 Scalability
- Designed to handle growth from hundreds to tens of thousands of inquiries without architectural rework (proper indexing, pagination, caching where needed).
- Airtable enforces a 5 requests/second rate limit per base and a practical ceiling around 50,000 records per table on standard plans; the backend should cache list views and batch writes, and this should be revisited (e.g., migrate to PostgreSQL per the data layer trade-off in section 6.3) if the SMB's inquiry volume approaches those limits.

---

## 6. Technology Stack (Chosen Implementation)

### 6.1 Frontend
- Framework: React + TypeScript, built with Vite (SPA).
- UI library: MUI (Material UI).
- State/data: React Context for auth state; direct API calls via axios.

### 6.2 Backend
- Node.js + Express + TypeScript.
- RESTful API.
- Data layer: Airtable — no self-hosted database. The backend talks to Airtable over its REST API (via the official `airtable` Node client) instead of a relational database.

### 6.3 Data Layer (Airtable)
- An Airtable base ("Customer Service Dashboard") holds the tables described in section 7.
- The backend authenticates to Airtable with a Personal Access Token (PAT) scoped to this base, kept server-side only (`AIRTABLE_API_KEY` env var) and never exposed to the frontend.
- Airtable's REST API is rate-limited to 5 requests/second per base; the backend should batch reads/writes and avoid per-row API calls in loops as inquiry volume grows (see section 5.4).
- Trade-off vs. a relational DB: much faster to stand up, and gives non-technical staff a spreadsheet-like UI to inspect/edit records directly, at the cost of query flexibility, transactional guarantees, and the 5 req/s rate ceiling. Revisit (e.g., migrate to PostgreSQL) if the SMB outgrows Airtable's limits.
- Current PAT scope is `data.records:read` only (no write). This is sufficient for Phase 1 (login reads Users, the dashboard summary reads Inquiries), but blocks anything that writes to Airtable: the `npm run seed` admin-creation script, and all of Phase 2 (creating inquiries, changing status/priority/assignment, adding notes). Add `data.records:write` to the token before starting Phase 2.

### 6.4 Infrastructure
- Hosting:
  - Single VM / VPS or managed platform (e.g., Render, Railway, small AWS/Azure setup) for the Node.js API and the static frontend build.
- CI/CD:
  - GitHub Actions for build and type-check on every push.
- Backups:
  - Airtable keeps revision history and snapshots on paid plans; export the base periodically (CSV or API dump) as an independent backup.

---

## 7. Data Model (High-Level)

Implemented as tables inside a single Airtable base (see section 6.3). Each table's Airtable record ID (`recXXXXXXXXXXXXXX`) serves as the entity's primary key — there is no separate auto-increment `id` field.

### 7.1 Core Entities (Phase 1 — implemented)

- **Users** table
  - Name, Email, Password Hash, Role (single select: Admin/Manager/Agent), Active (checkbox)
- **Inquiries** table
  - Subject, Customer Name, Customer Email, Customer Phone, Category, Source (single select), Status (single select), Priority (single select), Assigned Agent (link to Users), Created At, Updated At, Closed At

### 7.2 Additional Entities (Phase 2+ — not yet created)

- **InquiryMessages** table (linked to Inquiries)
  - Sender Type (Customer/Agent/System), Sender (link to Users, nullable for customer), Content, Is Internal Note (checkbox), Created At
- **InquiryAttachments** table (linked to Inquiries, optionally to a message)
  - File (Airtable attachment field), File Type, Uploaded By (link to Users), Created At
- **AuditLog** table
  - Entity Type, Entity ID, Action, Old Values (long text/JSON), New Values (long text/JSON), User (link to Users), Created At

---

## 8. Development Process & Git Workflow

This project will follow a disciplined Git-based workflow. After **every** meaningful change, you must commit and push to the repository.

### 8.1 Branching Strategy (Simple SMB-Friendly)

- `main` – production-ready code.
- `develop` – integration branch for ongoing work.
- Feature branches: `feature/<description>` (e.g., `feature/inquiry-list-view`).

### 8.2 Commit & Push Rule

For all development tasks:

1. Make changes in the appropriate branch.
2. Run tests / manual checks.
3. Commit with a clear message:
   - Example: `feat: add inquiry list view with filters`
   - Example: `fix: correct status transition validation`
   - Example: `docs: update spec.md with reporting requirements`
4. Push to remote:
   - `git push origin <branch-name>`

**Rule:**
> After every change (feature, fix, refactor, docs, config), you must `commit` and `push` to the repo before moving to the next task.

This ensures:
- Full traceability.
- Easy rollback.
- Clear history for future maintenance.

### 8.3 Pull Requests / Code Review (Optional but Recommended)

- For non-trivial changes:
  - Create a PR from `feature/*` into `develop`.
  - Require at least one review before merging.
- For very small SMB teams, you may simplify:
  - Direct commits to `develop` are allowed if the developer is experienced, but still must commit & push after each change.

---

## 9. Project Phases & Milestones

### Phase 1 – Foundation
- Set up repo, CI/CD, basic project structure.
- Implement authentication and roles.
- Define database schema and migrations.
- **Deliverable:** Running skeleton app with login and empty dashboard.

### Phase 2 – Core Inquiry Management
- Implement inquiry creation (internal + web form).
- Implement inquiry list view with filters and sorting.
- Implement inquiry detail view and basic status/priority/assignment updates.
- **Deliverable:** Agents can manage inquiries end-to-end.

### Phase 3 – Dashboard & Reporting
- Implement main dashboard widgets.
- Implement basic reports and CSV export.
- **Deliverable:** Managers can monitor performance.

### Phase 4 – Hardening & Deployment
- Security review, performance tuning.
- Documentation for operations.
- Production deployment and pilot with real users.
- **Deliverable:** Live system in production.

---

## 10. Acceptance Criteria (MVP)

- Users can log in with role-based access.
- Staff can:
  - Create inquiries manually.
  - Receive inquiries from a web form.
  - View, filter, and sort inquiries.
  - Open an inquiry, change status/priority, assign, add notes.
- Managers can:
  - See a dashboard with key metrics.
  - Run basic reports and export to CSV.
- All code changes are committed and pushed to the repo with meaningful messages.
- The system runs on a standard web server with HTTPS and regular DB backups.

---

## 11. Future Enhancements (Post-MVP)

- Email integration (auto-create inquiries from support inbox).
- Chat widget integration.
- SLA policies with alerts.
- Customer portal (view their own inquiries).
- Advanced analytics and visualizations.
- Multi-company (SaaS) support.

---

## 12. Glossary

- **Inquiry**: Any customer-initiated contact (lead, support request, complaint, feedback) tracked in the system.
- **Ticket**: Synonym for Inquiry in some contexts; here we use “Inquiry” consistently.
- **SMB**: Small and Medium-sized Business.

---

## 13. UI/UX Guidelines for System Analyst (Ticket Dashboard Patterns)

This section gives concrete UI/UX guidance for designing the dashboard, drawing on common ticket-dashboard templates (similar to those showcased in resources like SlideTeam’s “Top 10 Ticket Dashboard Templates”). Use these patterns when creating wireframes, mockups, and final UI.

> Principle: Design for clarity, speed, and actionability. A manager or agent should understand the state of support operations within 5 seconds of opening the dashboard.

### 13.1 Global Layout Principles

- **Top Navigation Bar**
  - Logo / product name on the left.
  - Main sections: Dashboard, Inquiries, Reports, Settings.
  - User menu on the right (profile, logout).
- **Left Sidebar (Optional)**
  - Quick filters: “My Inquiries”, “Unassigned”, “Overdue”, “Urgent”.
  - Saved views (e.g., “VIP Customers”, “Last 7 Days”).
- **Content Area**
  - Dashboard: grid of widgets (cards).
  - Inquiries: full-width list or table with filter bar on top.
  - Detail view: two-column layout (conversation + metadata/actions).

- **Responsive Behavior**
  - Desktop: multi-column dashboard, full table views.
  - Tablet: stack widgets vertically, keep table with horizontal scroll.
  - Mobile: simplified views; focus on “My Inquiries” and detail view.

### 13.2 Main Dashboard – Widget Patterns

Design the home dashboard as a set of cards/widgets. Typical patterns include:

#### 13.2.1 KPI Summary Row (Top of Dashboard)

A horizontal row of 4–6 KPI cards, similar to executive ticket dashboards:

- **Total Open Inquiries**
  - Large number.
  - Small trend indicator vs. previous period (e.g., “+12% vs last week”).
- **Average First Response Time**
  - In hours/minutes.
  - Color-coded: green if within target, red if above.
- **Average Resolution Time**
  - In hours/days.
- **Overdue Inquiries**
  - Count of tickets older than defined SLA/age threshold.
- **Resolved This Week**
  - Count and percentage of total.
- **Customer Satisfaction (if available later)**
  - Average rating or % positive.

UI notes:
- Each KPI card is clickable → drills down into a filtered inquiry list.
- Use consistent color coding (e.g., red for overdue, amber for nearing SLA, green for OK).

#### 13.2.2 Status Breakdown Widget

A bar or donut chart showing inquiries by status:

- Segments: New, In Progress, Waiting on Customer, Resolved (last N days), Closed (last N days).
- Tooltip: exact count and percentage.
- Click on a segment → open inquiry list filtered by that status.

This mirrors typical “ticket status distribution” templates.

#### 13.2.3 Priority & Urgency Widget

A stacked bar or grouped bar chart:

- X-axis: priority (Low, Medium, High, Urgent).
- Y-axis: count of open inquiries.
- Optionally split by status (e.g., how many “Urgent” are still “New”).

Purpose: highlight where attention is needed now.

#### 13.2.4 Agent Workload Widget

A horizontal bar chart or table-like widget:

- Rows: agents (names or avatars).
- Columns/metrics:
  - Open inquiries count.
  - Average age of open inquiries.
  - Resolved this week.
- Color-code rows where average age exceeds target.

This follows common “agent performance / workload” dashboard templates.

#### 13.2.5 Aging / SLA Widget

A table or heatmap showing inquiries by age bucket:

- Age buckets: 0–1 day, 1–3 days, 3–7 days, >7 days.
- For each bucket: count of open inquiries.
- Optionally split by priority.

Alternatively, a simple list widget:

- “Oldest Open Inquiries”
  - Top 5–10 tickets by age.
  - Columns: ID, Subject, Customer, Priority, Age, Assigned Agent.

This matches “aging analysis” ticket dashboards.

#### 13.2.6 Recent Activity / Timeline Widget

A compact list showing recent actions:

- “Inquiry #1234 status changed to In Progress by Anna”
- “New inquiry from John Doe – ‘Billing issue’”
- “Inquiry #1220 resolved by Moshe”

Helps teams see what’s happening now, similar to “recent tickets” widgets.

### 13.3 Inquiries List View – UX Patterns

This is the core working screen for agents and managers.

#### 13.3.1 Filter & Search Bar

Place at the top of the list:

- Text search box: “Search by subject, customer, ID…”
- Dropdown filters:
  - Status (multi-select).
  - Priority (multi-select).
  - Agent (multi-select).
  - Source (Web, Email, Phone, Chat, Other).
  - Date range (Created from–to, or Last updated).
- Buttons:
  - “Apply Filters”
  - “Clear Filters”
  - “Save View” (for power users/managers).

Pattern: keep filters visible but collapsible on smaller screens.

#### 13.3.2 Table Layout

Columns (configurable, default set):

- Checkbox (for bulk actions).
- ID (clickable → detail view).
- Subject (truncated with tooltip).
- Customer Name.
- Source (icon + text).
- Status (colored badge).
- Priority (colored badge or icon).
- Assigned Agent (avatar + name).
- Created At (date/time).
- Last Updated (date/time).
- Age (optional, e.g., “2d 5h”).

UX details:

- Fixed header row on scroll.
- Zebra striping or subtle row borders.
- Hover highlight on row.
- Clicking a row opens the detail view (or use a dedicated “Open” icon).

#### 13.3.3 Bulk Actions

When one or more rows are selected:

- Bulk action bar appears above or below the table:
  - Change status.
  - Change priority.
  - Assign to agent.
  - Mark as spam / ignore (if needed later).
- Confirmation dialog for bulk changes.

### 13.4 Inquiry Detail View – UX Patterns

Two-column layout is typical for ticket detail pages:

#### 13.4.1 Left Column – Conversation Thread

- Chronological thread of messages:
  - Customer messages: distinct background/color.
  - Agent messages: different background/color.
  - Internal notes: visually distinct (e.g., shaded, with “Internal” label).
- Each message shows:
  - Sender name and role.
  - Timestamp.
  - Content.
  - Attachments (if any) as small chips with icons.
- Input area at bottom:
  - Text editor (rich text optional for MVP).
  - Toggle: “Internal note” vs “Reply to customer”.
  - Attachment upload button.
  - Send / Add Note button.

Scrolling behavior:

- Auto-scroll to bottom on new message.
- “Jump to latest” button if user scrolls up.

#### 13.4.2 Right Column – Metadata & Actions

A sticky sidebar with:

- **Header**
  - Inquiry ID and subject.
  - Status badge (clickable to change).
  - Priority badge (clickable to change).
- **Customer Info**
  - Name, email, phone.
  - Link to customer profile (if exists later).
- **Assignment**
  - Assigned agent (dropdown to reassign).
  - “Unassign” option.
- **Timeline / Audit**
  - Compact timeline of key events:
    - “Created by system”
    - “Assigned to Anna”
    - “Status changed to In Progress”
    - “Resolved by Moshe”
- **Quick Actions**
  - Change status (dropdown or buttons).
  - Change priority.
  - Mark as Resolved / Close.
  - Escalate (if escalation workflow added later).

This layout mirrors common “ticket detail” templates where the conversation is primary, and metadata/actions are always visible.

### 13.5 Reports Pages – UX Patterns

Reports should feel like an extension of the dashboard, not a separate BI tool.

#### 13.5.1 Report Selector

- Top tabs or sidebar:
  - Volume Over Time.
  - Response & Resolution Times.
  - Agent Performance.
  - Aging Analysis.
  - Custom (if implemented later).

#### 13.5.2 Volume Over Time

- Line or bar chart:
  - X-axis: date (day/week/month).
  - Y-axis: number of inquiries.
  - Series: New, Resolved, Closed.
- Filters: date range, source, category.

#### 13.5.3 Response & Resolution Times

- Line or bar charts:
  - Average first response time over time.
  - Average resolution time over time.
- Optional target line (SLA) to visualize performance vs goal.

#### 13.5.4 Agent Performance

- Table with sortable columns:
  - Agent name.
  - Total inquiries handled.
  - Average first response time.
  - Average resolution time.
  - % resolved within SLA (if defined).
- Optional small sparkline per agent showing trend.

#### 13.5.5 Export & Sharing

- Export button on each report:
  - CSV (mandatory for MVP).
  - PDF (optional later).
- Ability to save a report configuration (filters, date range) as a named view.

### 13.6 Visual Design Guidelines

- **Color Palette**
  - Neutral background (light gray/white).
  - Primary brand color for main actions and highlights.
  - Semantic colors:
    - Red: Urgent, Overdue, Error.
    - Orange/Amber: High priority, Warning.
    - Green: Resolved, OK, Within SLA.
    - Blue: Informational, links.
- **Typography**
  - Clear, legible sans-serif font.
  - Larger font for KPI numbers.
  - Consistent hierarchy: page title > section title > labels > body.
- **Spacing**
  - Generous whitespace around widgets and sections.
  - Consistent padding inside cards/tables.
- **Icons**
  - Use icons sparingly to support meaning (status, priority, source).
  - Avoid decorative icons that add noise.

### 13.7 Interaction & Feedback

- Loading states:
  - Skeleton loaders for dashboard widgets and tables.
  - Spinner for actions like “Assign”, “Change Status”.
- Empty states:
  - When no inquiries match filters: show friendly message and “Clear filters” button.
  - When agent has no assigned inquiries: suggest viewing “Unassigned” or “All”.
- Error states:
  - Clear error messages if saving fails (e.g., “Could not update status. Please try again.”).
  - Option to retry action.
- Confirmations:
  - Confirm destructive or bulk actions (e.g., bulk status change, closing multiple inquiries).

### 13.8 Accessibility & Usability

- Keyboard navigation:
  - Tab through filters, table rows, and actions.
  - Enter/Space to activate buttons and selected rows.
- Color contrast:
  - Ensure text and badges meet WCAG contrast guidelines.
- Screen reader support:
  - Proper labels for buttons, filters, and table headers.
- Touch-friendly:
  - Buttons and interactive elements large enough for touch on tablets.

### 13.9 Design Deliverables for System Analyst

As a system analyst, you should produce:

- **Low-Fidelity Wireframes**
  - Main dashboard (widgets layout).
  - Inquiries list view (filters + table).
  - Inquiry detail view (conversation + sidebar).
  - Key reports (charts + filters).
- **High-Fidelity Mockups**
  - In chosen UI library style (Material, Ant, etc.).
  - Including color coding for statuses and priorities.
- **Interaction Notes**
  - For each screen, describe:
    - What happens on click of key elements.
    - Filter behavior and default views.
    - Empty and error states.
- **Component Inventory**
  - Reusable components:
    - KPI card.
    - Status badge.
    - Priority badge.
    - Inquiry table row.
    - Message bubble (customer/agent/internal).
    - Chart widgets.

These artifacts will guide frontend developers and ensure the final UI aligns with proven ticket dashboard patterns.

---

## 14. Commit & Push Checklist for UI/UX Work

For every UI/UX-related change, follow this checklist before moving to the next task:

1. Update wireframes/mockups or frontend code.
2. Verify:
   - Layout looks correct on desktop and tablet.
   - Filters and actions behave as expected.
   - No console errors in browser dev tools.
3. Commit with a descriptive message, e.g.:
   - `feat(ui): add main dashboard KPI row`
   - `feat(ui): implement inquiry list filters`
   - `feat(ui): add conversation thread component`
   - `docs(ui): add wireframes for detail view`
4. Push to remote:
   - `git push origin <branch-name>`

Do not accumulate multiple unrelated UI changes in one commit unless they are part of a single coherent feature.
