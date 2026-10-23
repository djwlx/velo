-- Custom SQL migration file, put your code below! --
INSERT OR IGNORE INTO `velo_role_permissions` (`role_id`, `permission_code`)
SELECT `role_id`, 'file:read'
FROM `velo_role_permissions`
WHERE `permission_code` = 'module:files';
--> statement-breakpoint
DELETE FROM `velo_role_permissions`
WHERE `permission_code` NOT IN ('file:read', 'file:write');
