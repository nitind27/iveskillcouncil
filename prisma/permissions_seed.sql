-- ============================================================
-- Seed: Insert default permissions (run after permissions.sql)
-- Use: Run once after creating permissions table
-- ============================================================

INSERT INTO `permissions` (`key`, `label`, `module`) VALUES
('dashboard.view', 'View Dashboard', 'Main'),
('userpanel.manage', 'Manage User Panel', 'Main'),
('analytics.view', 'View Analytics', 'Main'),
('subscription.plans.view', 'View Subscription Plans', 'Subscription'),
('subscription.plans.manage', 'Manage Subscription Plans', 'Subscription'),
('franchises.view', 'View Franchises', 'Subscription'),
('franchises.manage', 'Manage Franchises', 'Subscription'),
('franchises.approve', 'Approve Franchises', 'Subscription'),
('courses.view', 'View Courses', 'Academics'),
('courses.manage', 'Manage Courses', 'Academics'),
('students.view', 'View Students', 'Academics'),
('students.manage', 'Manage Students', 'Academics'),
('fees.view', 'View Fees', 'Academics'),
('fees.manage', 'Manage Fees', 'Academics'),
('attendance.view', 'View Attendance', 'Attendance'),
('attendance.manage', 'Manage Attendance', 'Attendance'),
('certificates.view', 'View Certificates', 'Certificates'),
('certificates.issue', 'Issue Certificates', 'Certificates'),
('staff.view', 'View Staff', 'Staff'),
('staff.manage', 'Manage Staff', 'Staff'),
('notifications.view', 'View Notifications', 'Communication'),
('notifications.manage', 'Manage Notifications', 'Communication'),
('feedback.view', 'View Feedback', 'Communication'),
('feedback.manage', 'Manage Feedback', 'Communication'),
('email_reminders.manage', 'Manage Email Reminders', 'Communication'),
('users.view', 'View Users', 'System'),
('users.manage', 'Manage Users', 'System'),
('settings.view', 'View Settings', 'System'),
('settings.manage', 'Manage Settings', 'System'),
('permissions.manage', 'Manage Permissions', 'System')
ON DUPLICATE KEY UPDATE `label` = VALUES(`label`), `module` = VALUES(`module`);
