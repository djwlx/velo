import { Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';

import { ProTable, type ProTableColumn } from '@/components/pro-table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/components/ui/toast';
import { useRequestQuery } from '@/hooks/useRequestQuery';
import { listPermissions } from '@/services/permission';
import { deleteRole, listRoles } from '@/services/role';
import type { RoleDetail } from '@/services/role/types';
import { RoleFormDialog } from './components/RoleFormDialog';

export function RoleManagement() {
  const { data, loading, refetch } = useRequestQuery(listRoles);
  const { data: permissionsData } = useRequestQuery(listPermissions);
  const [formOpen, setFormOpen] = useState(false);
  const [formRole, setFormRole] = useState<RoleDetail | null>(null);
  const [deleting, setDeleting] = useState<RoleDetail | null>(null);

  const roles = data?.data.list ?? [];
  const permissions = permissionsData?.data.list ?? [];
  const permissionNames = new Map(
    permissions.map((item) => [item.code, item.name])
  );

  const openCreate = () => {
    setFormRole(null);
    setFormOpen(true);
  };

  const openEdit = (role: RoleDetail) => {
    setFormRole(role);
    setFormOpen(true);
  };

  const handleDelete = async () => {
    if (!deleting) return;
    try {
      await deleteRole(deleting.id);
    } catch {
      return;
    }
    toast.add({ type: 'success', title: '删除成功' });
    setDeleting(null);
    void refetch();
  };

  const columns: ProTableColumn<RoleDetail>[] = [
    {
      key: 'name',
      title: '角色',
      render: (_value, item) => (
        <div className="flex flex-col">
          <span className="font-medium">{item.name}</span>
          <span className="text-xs text-muted-foreground">{item.code}</span>
        </div>
      ),
    },
    {
      key: 'permissionCodes',
      title: '权限',
      render: (_value, item) =>
        item.permissionCodes.length === 0 ? (
          <span className="text-muted-foreground">-</span>
        ) : (
          <div className="flex flex-wrap gap-1">
            {item.permissionCodes.map((code) => (
              <Badge key={code} variant="outline">
                {permissionNames.get(code) ?? code}
              </Badge>
            ))}
          </div>
        ),
    },
    {
      key: 'userCount',
      title: '用户数',
      className: 'w-20',
      render: (_value, item) => item.userCount,
    },
    {
      key: 'actions',
      title: '操作',
      className: 'w-24',
      render: (_value, item) => (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="编辑"
            onClick={() => openEdit(item)}
          >
            <Pencil />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="删除"
            onClick={() => setDeleting(item)}
          >
            <Trash2 />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <main className="flex min-h-0 flex-1 flex-col px-4 py-6">
      <Card className="gap-0">
        <CardHeader className="flex flex-row items-center justify-between gap-2 pb-4">
          <CardTitle>角色管理</CardTitle>
          <Button onClick={openCreate}>
            <Plus data-icon="inline-start" />
            新增角色
          </Button>
        </CardHeader>
        <ProTable
          columns={columns}
          items={roles}
          rowKey="id"
          isLoading={loading}
        />
      </Card>

      <RoleFormDialog
        key={formRole?.id ?? 'create'}
        open={formOpen}
        onOpenChange={setFormOpen}
        role={formRole}
        permissions={permissions}
        onSaved={() => void refetch()}
      />

      <AlertDialog
        open={deleting !== null}
        onOpenChange={(open) => {
          if (!open) setDeleting(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>删除角色</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除「{deleting?.name}」吗？此操作不可撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => void handleDelete()}
            >
              删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}
