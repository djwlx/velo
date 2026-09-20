import { ErrorCode } from '@velo/shared';
import { RequestError } from './error';

const CODE_MESSAGES: Record<number, string> = {
  [ErrorCode.InvalidRequest]: '请求参数有误',
  [ErrorCode.ValidationFailed]: '提交的内容有误',
  [ErrorCode.AuthenticationRequired]: '请先登录',
  [ErrorCode.InvalidCredentials]: '邮箱或密码错误',
  [ErrorCode.PermissionDenied]: '没有权限执行此操作',
  [ErrorCode.ResourceNotFound]: '资源不存在',
  [ErrorCode.ResourceConflict]: '资源已存在',
  [ErrorCode.ExternalServiceFailed]: '外部服务异常，请稍后重试',
  [ErrorCode.ConfigurationMissing]: '服务未正确配置',
  [ErrorCode.InternalError]: '服务器内部错误，请稍后重试',
};

export function getErrorMessage(error: unknown): string {
  if (!(error instanceof RequestError)) {
    return '操作失败，请稍后重试';
  }

  if (error.type === 'network') {
    return '网络异常，请检查网络连接';
  }

  if (error.type === 'http') {
    return error.status ? `请求失败（${error.status}）` : '请求失败';
  }

  return (
    error.message ||
    (error.code === undefined ? undefined : CODE_MESSAGES[error.code]) ||
    '操作失败，请稍后重试'
  );
}
