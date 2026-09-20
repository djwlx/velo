import { Pencil, Plus, Trash2 } from 'lucide-react';
import { useCallback, useState } from 'react';

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
import { Input } from '@/components/ui/input';
import { toast } from '@/components/ui/toast';
import { useRequestQuery } from '@/hooks/useRequestQuery';
import { listRoles } from '@/services/role';
import { deleteUser, listUsers } from '@/services/user';
import type { UserSummary } from '@/services/user/types';
import { UserFormDialog } from './components/UserFormDialog';

const PAGE_SIZE = 20;

export function UserManagement() {
  const [page, setPage] = useState(1);
  const [keyword, setKeyword] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [formUserId, setFormUserId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState<UserSummary | null>(null);

  const fetchUsers = useCallback(
    () => listUsers({ page, pageSize: PAGE_SIZE, keyword }),
    [page, keyword]
  );
  const { data, loading, refetch } = useRequestQuery(fetchUsers);
  const { data: rolesData } = useRequestQuery(listRoles);

  const users = data?.data.list ?? [];
  const total = data?.data.total ?? 0;
  const roles = rolesData?.data.list ?? [];
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const handleSearch = (event: React.FormEvent) => {
    event.preventDefault();
    setPage(1);
    setKeyword(searchInput.trim());
  };

  const openCreate = () => {
    setFormUserId(null);
    setFormOpen(true);
  };

  const openEdit = (id: number) => {
    setFormUserId(id);
    setFormOpen(true);
  };

  const handleDelete = async () => {
    if (!deleting) return;
    try {
      await deleteUser(deleting.id);
    } catch {
      return;
    }
    toast.add({ type: 'success', title: '删除成功' });
    const isLastItemOnPage = users.length === 1 && page > 1;
    setDeleting(null);
    if (isLastItemOnPage) setPage(page - 1);
    else void refetch();
  };

  const columns: ProTableColumn<UserSummary>[] = [
    {
      key: 'nickname',
      title: '用户',
      render: (_value, item) => (
        <div className="flex items-center gap-3">
          {item.avatar ? (
            <img
              src={item.avatar}
              alt={item.nickname || item.email}
              className="size-8 shrink-0 rounded-full object-cover"
            />
          ) : (
            <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium">
              {(item.nickname || item.email).slice(0, 1).toUpperCase()}
            </div>
          )}
          <div className="flex min-w-0 flex-col">
            <span className="truncate font-medium">{item.nickname || '-'}</span>
            <span className="truncate text-xs text-muted-foreground">
              {item.email}
            </span>
          </div>
        </div>
      ),
    },
    {
      key: 'status',
      title: '状态',
      render: (_value, item) => (
        <Badge variant={item.status === 'active' ? 'secondary' : 'outline'}>
          {item.status === 'active' ? '启用' : '禁用'}
        </Badge>
      ),
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
            onClick={() => openEdit(item.id)}
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

  const footer = (
    <div className="flex items-center justify-between px-4 py-3 text-sm text-muted-foreground">
      <span>共 {total} 条</span>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={page <= 1}
          onClick={() => setPage(page - 1)}
        >
          上一页
        </Button>
        <span>
          {page} / {totalPages}
        </span>
        <Button
          variant="outline"
          size="sm"
          disabled={page >= totalPages}
          onClick={() => setPage(page + 1)}
        >
          下一页
        </Button>
      </div>
    </div>
  );

  return (
    <main className="flex min-h-0 flex-1 flex-col px-4 py-6">
      <Card className="gap-0">
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2 pb-4">
          <CardTitle>用户管理</CardTitle>
          <div className="flex flex-wrap items-center gap-2">
            <form onSubmit={handleSearch}>
              <Input
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="搜索邮箱或昵称"
                className="w-56"
              />
            </form>
            <Button onClick={openCreate}>
              <Plus data-icon="inline-start" />
              新增用户
            </Button>
          </div>
        </CardHeader>
        <ProTable
          columns={columns}
          items={users}
          rowKey="id"
          isLoading={loading}
          footer={footer}
        />
      </Card>

      <UserFormDialog
        key={formUserId ?? 'create'}
        open={formOpen}
        onOpenChange={setFormOpen}
        userId={formUserId}
        roles={roles}
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
            <AlertDialogTitle>删除用户</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除「{deleting?.nickname || deleting?.email}
              」吗？此操作不可撤销。
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
