import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';

import {
  Form,
  FormCheckboxGroup,
  FormInput,
  FormSubmit,
} from '@/components/form';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from '@/components/ui/toast';
import type { PermissionInfo } from '@/services/permission/types';
import { createRole, updateRole } from '@/services/role';
import type { RoleDetail, UpdateRolePayload } from '@/services/role/types';

import { roleFormSchema, ADMIN_ROLE, type RoleFormValues } from '../types';

interface RoleFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  role: RoleDetail | null;
  permissions: PermissionInfo[];
  onSaved: () => void;
}

export function RoleFormDialog({
  open,
  onOpenChange,
  role,
  permissions,
  onSaved,
}: RoleFormDialogProps) {
  const isEdit = role !== null;
  const isAdmin = role?.code === ADMIN_ROLE;

  const form = useForm<RoleFormValues>({
    resolver: zodResolver(roleFormSchema),
    defaultValues: { code: '', name: '', permissionCodes: [] },
  });

  useEffect(() => {
    if (!open) return;
    form.reset({
      code: role?.code ?? '',
      name: role?.name ?? '',
      permissionCodes: isAdmin ? permissions.map((item) => item.code) : (role?.permissionCodes ?? []),
    });
  }, [open, role, permissions, isAdmin, form]);

  const onSubmit = async (values: RoleFormValues) => {
    if (isEdit && role) {
      const payload: UpdateRolePayload = {
        name: values.name,
        permissionCodes: values.permissionCodes,
      };
      await updateRole(role.id, payload);
      toast.add({ type: 'success', title: '保存成功' });
    } else {
      await createRole({
        code: values.code,
        name: values.name,
        permissionCodes: values.permissionCodes,
      });
      toast.add({ type: 'success', title: '创建成功' });
    }
    onSaved();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? '编辑角色' : '新增角色'}</DialogTitle>
          <DialogDescription>
            {isEdit ? '修改角色名称与权限。' : '创建一个新的角色并分配权限。'}
          </DialogDescription>
        </DialogHeader>
        <Form form={form} onSubmit={onSubmit}>
          <FormInput
            control={form.control}
            name="code"
            label="角色标识"
            autoComplete="off"
            disabled={isEdit}
          />
          <FormInput
            control={form.control}
            name="name"
            label="角色名称"
            autoComplete="off"
            disabled={isAdmin}
          />
          <FormCheckboxGroup
            control={form.control}
            name="permissionCodes"
            label="权限"
            emptyText="暂无可用权限"
            options={permissions.map((permission) => ({
              value: permission.code,
              label: permission.name,
              description: permission.code,
              disabled: isAdmin,
            }))}
          />
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              取消
            </Button>
            <FormSubmit />
          </DialogFooter>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
