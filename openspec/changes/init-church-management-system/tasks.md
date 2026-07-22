## 1. Project Setup & Infrastructure

- [x] 1.1 Initialize Next.js project with Tailwind CSS and PWA configuration
- [x] 1.2 Setup Supabase client SDK and environment variables
- [x] 1.3 Create database migrations for core tables (profiles, groups, members, attendance, shepherd_activities, member_visits, sunday_absences, weekly_reports)
- [x] 1.4 Implement PostgreSQL Row Level Security (RLS) policies for Pastor, Leaders, and Shepherds

## 2. Authentication & User Hierarchy Management

- [x] 2.1 Build login and authentication flow using Supabase Auth
- [x] 2.2 Create User Profile management view with role assignment (Pastor, Leader, Shepherd) and group assignment (Puissance, Gloire, Sagesse)
- [x] 2.3 Implement role-based navigation dashboard (Shepherd view, Leader group view, Pastor global view)

## 3. Member Management & Class Progression

- [x] 3.1 Create Member registration form supporting basic info, assigned shepherd, and invited_by tracking
- [x] 3.2 Implement member list view with search, filter, and class status display
- [x] 3.3 Build class progression management controls to enroll, promote, regress, or complete Tuesday and Wednesday classes

## 4. Attendance Tracking & New Member 4-Week Logic

- [x] 4.1 Build interactive attendance checklist UI filtered by program type (Tuesday class, Wednesday class, Thursday online, Friday, Sunday)
- [x] 4.2 Implement backend logic to increment `consecutive_sundays_present` counter for new members upon Sunday presence
- [x] 4.3 Create automatic graduation trigger from `new` to `member` at 4 Sunday presences
- [x] 4.4 Build suspension logic shifting status to `absent_to_relaunch` without resetting the counter upon Sunday absence

## 5. Pastoral Care Alerts & Visit Logging

- [x] 5.1 Create automatic prolonged absence detection triggering visual alert badges at 2+ consecutive Sunday absences
- [x] 5.2 Build pastoral visit logging modal capturing visit date, motive/reason, notes, and optional accompanying member
- [x] 5.3 Implement alert clearing logic upon attendance recording or pastoral visit logging

## 6. Shepherd Spiritual Discipline & Weekly Reporting

- [x] 6.1 Create Shepherd weekly personal discipline tracker (meditation count, prayer hours count, evangelization, monthly vigil, monthly in-person prayer)
- [x] 6.2 Build Sunday weekly report consolidation preview combining attendance ratios, Sunday absentees with reasons, new member progression, and spiritual discipline
- [x] 6.3 Implement weekly report submission, archiving (`weekly_reports` JSONB snapshot), and Leader approval workflow
- [x] 6.4 Build Pastor executive analytics dashboard filtering reports and stats across all groups and shepherds
