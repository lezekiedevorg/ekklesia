## 1. Database Foundation

- [x] 1.1 Create migration `20260723000000_departments_and_newcomers.sql` with departments table (id, name, description, leader_id, icon, is_active, created_at)
- [x] 1.2 Add member_departments join table (member_id, department_id, role, joined_at) with composite PK
- [x] 1.3 Add newcomer_registrations table (id, member_id, registered_by, registration_date, invited_by_member_id, residence_location, is_self_initiated, assigned_shepherd_id, notes, created_at)
- [x] 1.4 Add residence_location column to members table
- [x] 1.5 Seed 6 default departments (Jeunesse, Musique, Ordre, Amis des Nouveaux, Prière, Évangélisation)
- [x] 1.6 Seed shepherd_score_weights in app_settings (JSONB with configurable weights)
- [x] 1.7 Create indexes on member_departments (member_id, department_id) and newcomer_registrations (registration_date, member_id, assigned_shepherd_id)
- [x] 1.8 Add RLS policies for departments, member_departments, and newcomer_registrations (read all for authenticated, manage for pastor/admin/super_admin)
- [x] 1.9 Add new permissions to app_permissions table (departments:view/edit/assign, newcomers:register/view_all, stats:view_global/compare/evolution, super_dashboard:view)
- [x] 1.10 Assign new permissions to roles in app_role_permissions (super_admin+admin: all, pastor: all, leader: departments:view, newcomers:register/view_all)

## 2. TypeScript Types & Constants

- [x] 2.1 Add Department interface to src/types/db.ts (id, name, description, leader_id, icon, is_active, created_at)
- [x] 2.2 Add MemberDepartment interface to src/types/db.ts (member_id, department_id, role, joined_at)
- [x] 2.3 Add NewcomerRegistration interface to src/types/db.ts (all fields from table)
- [x] 2.4 Add residence_location optional field to Member interface
- [x] 2.5 Create src/lib/constants/departments.ts with default department definitions

## 3. Department Management UI

- [x] 3.1 Create /admin/departments/page.tsx - department list with cards showing member counts and leader names
- [x] 3.2 Create /admin/departments/[id]/page.tsx - department detail with member list, edit form, and assign/remove controls
- [x] 3.3 Create server actions for department CRUD (create, update, delete) in src/app/admin/departments/actions.ts
- [x] 3.4 Create DepartmentMemberAssign component for adding/removing members from departments

## 4. Newcomer Registration (Amis des Nouveaux)

- [x] 4.1 Create /admin/newcomers/page.tsx - registration log showing date, name, phone, inviter, shepherd, self-initiated flag
- [x] 4.2 Create NewcomerRegistrationForm component with inviter lookup, shepherd auto-assignment logic, and walk-in flow
- [x] 4.3 Implement shepherd assignment logic: if invited → inviter's shepherd or group's first shepherd; if walk-in → manual selection with is_self_initiated flag
- [x] 4.4 Create server actions for newcomer registration in src/app/admin/newcomers/actions.ts
- [x] 4.5 Add auto-assignment to "Amis des Nouveaux" department on registration

## 5. Stats Engine

- [x] 5.1 Create src/lib/utils/stats.ts with getGlobalStats(period?) function
- [x] 5.2 Implement getGroupStats(groupId, period) - scoped to group members
- [x] 5.3 Implement getShepherdStats(shepherdId, period) - member count, attendance, discipline, score
- [x] 5.4 Implement getDepartmentStats(deptId, period) - member list, newcomer registrations
- [x] 5.5 Implement getAttendanceTrend(dimension, entityId, startDate, endDate) with weekly/monthly granularity
- [x] 5.6 Implement getDisciplineScores(shepherdId, period) - prayer, meditation, evangelism percentages
- [x] 5.7 Implement computeShepherdScore(shepherdId, period) - weighted composite score 0-5 stars
- [x] 5.8 Implement compareEntities(entities, metrics, period) - multi-entity comparison

## 6. Super Admin Dashboard

- [x] 6.1 Create /admin/super-dashboard/page.tsx with layout and data loading
- [x] 6.2 Create GlobalKPIs component - total members, attendance ratio, shepherds, departments, alerts, reports
- [x] 6.3 Create OrgTree component - interactive tree showing groups → shepherds → member counts
- [x] 6.4 Create WeekSummary component - current week attendance across 5 programs
- [x] 6.5 Create DepartmentGrid component - department cards with member counts and leaders
- [x] 6.6 Create AlertsPanel component - shepherd alerts, absent members, pending reports, newcomer count

## 7. Comparative Stats

- [x] 7.1 Create /admin/stats/page.tsx with entity selector and period filter
- [x] 7.2 Implement entity type selector (groups, shepherds, departments) with multi-select
- [x] 7.3 Implement comparison table showing metrics for selected entities
- [x] 7.4 Implement bar chart visualization for single-metric comparison

## 8. Evolution Charts

- [x] 8.1 Create /admin/stats/evolution/page.tsx with granularity toggle and date range picker
- [x] 8.2 Create DateRangePicker component for custom period selection
- [x] 8.3 Implement weekly/monthly granularity toggle
- [x] 8.4 Implement member growth line chart (total members over time)
- [x] 8.5 Implement attendance trend multi-line chart (5 programs over time)
- [x] 8.6 Implement facet filters (group, shepherd, department dropdowns)

## 9. Permissions & Navigation

- [x] 9.1 Add route guards for all new pages (super-dashboard, departments, newcomers, stats, stats/evolution)
- [x] 9.2 Update admin layout navigation with links to new pages
- [x] 9.3 Add link from admin page to super-dashboard
- [x] 9.4 Add audit logging for department CRUD operations
