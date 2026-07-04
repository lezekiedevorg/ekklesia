## 1. Project Setup & Infrastructure

- [ ] 1.1 Initialize Next.js project with Tailwind CSS and PWA configuration
- [ ] 1.2 Setup Supabase client SDK and environment variables
- [ ] 1.3 Create database migrations for core tables (profiles, groups, members, attendance, shepherd_activities, member_visits, sunday_absences, weekly_reports)
- [ ] 1.4 Implement PostgreSQL Row Level Security (RLS) policies for Pastor, Leaders, and Shepherds

## 2. Authentication & User Hierarchy Management

- [ ] 2.1 Build login and authentication flow using Supabase Auth
- [ ] 2.2 Create User Profile management view with role assignment (Pastor, Leader, Shepherd) and group assignment (Puissance, Gloire, Sagesse)
- [ ] 2.3 Implement role-based navigation dashboard (Shepherd view, Leader group view, Pastor global view)

## 3. Member Management & Class Progression

- [ ] 3.1 Create Member registration form supporting basic info, assigned shepherd, and invited_by tracking
- [ ] 3.2 Implement member list view with search, filter, and class status display
- [ ] 3.3 Build class progression management controls to enroll, promote, regress, or complete Tuesday and Wednesday classes

## 4. Attendance Tracking & New Member 4-Week Logic

- [ ] 4.1 Build interactive attendance checklist UI filtered by program type (Tuesday class, Wednesday class, Thursday online, Friday, Sunday)
- [ ] 4.2 Implement backend logic to increment `consecutive_sundays_present` counter for new members upon Sunday presence
- [ ] 4.3 Create automatic graduation trigger from `new` to `member` at 4 Sunday presences
- [ ] 4.4 Build suspension logic shifting status to `absent_to_relaunch` without resetting the counter upon Sunday absence

## 5. Pastoral Care Alerts & Visit Logging

- [ ] 5.1 Create automatic prolonged absence detection triggering visual alert badges at 2+ consecutive Sunday absences
- [ ] 5.2 Build pastoral visit logging modal capturing visit date, motive/reason, notes, and optional accompanying member
- [ ] 5.3 Implement alert clearing logic upon attendance recording or pastoral visit logging

## 6. Shepherd Spiritual Discipline & Weekly Reporting

- [ ] 6.1 Create Shepherd weekly personal discipline tracker (meditation count, prayer hours count, evangelization, monthly vigil, monthly in-person prayer)
- [ ] 6.2 Build Sunday weekly report consolidation preview combining attendance ratios, Sunday absentees with reasons, new member progression, and spiritual discipline
- [ ] 6.3 Implement weekly report submission, archiving (`weekly_reports` JSONB snapshot), and Leader approval workflow
- [ ] 6.4 Build Pastor executive analytics dashboard filtering reports and stats across all groups and shepherds
