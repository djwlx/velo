import { toast } from '@/components/ui/toast';

import { send } from './client';
import { RequestError } from './error';
import { getErrorMessage } from './messages';
import type { BaseResponse, RequestOptions } from './types';

export async function request<T>(
  url: string,
  options: RequestOptions = {}
): Promise<BaseResponse<T>> {
  const { toast: showError = true, ...init } = options;

  try {
    return await send<T>(url, init);
  } catch (error) {
    const requestError =
      error instanceof RequestError
        ? error
        : new RequestError(
            error instanceof Error ? error.message : 'Unknown error',
            'network'
          );

    if (showError) {
      toast.add({ type: 'error', title: getErrorMessage(requestError) });
    }

    throw requestError;
  }
}
