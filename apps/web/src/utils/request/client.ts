import { RequestError } from './error';
import type { BaseResponse } from './types';

export const API_BASE_URL = '/api';

const ACCESS_TOKEN_KEY = 'velo_access_token';

export async function send<T>(
  url: string,
  options: RequestInit = {}
): Promise<BaseResponse<T>> {
  const token = localStorage.getItem(ACCESS_TOKEN_KEY);
  const headers = new Headers(options.headers);
  if (!headers.has('Content-Type') && options.body) {
    headers.set('Content-Type', 'application/json');
  }
  if (token) headers.set('Authorization', `Bearer ${token}`);

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${url}`, { ...options, headers });
  } catch (error) {
    throw new RequestError(
      error instanceof Error ? error.message : 'Network error',
      'network'
    );
  }

  let result: BaseResponse<T>;
  try {
    result = await response.json();
  } catch {
    if (!response.ok) {
      throw new RequestError(`HTTP ${response.status}`, 'http', response.status);
    }
    throw new RequestError('Invalid response', 'http', response.status);
  }

  if (result.code !== 0) {
    throw new RequestError(
      result.message ?? '',
      'business',
      response.ok ? undefined : response.status,
      result.code
    );
  }

  if (!response.ok) {
    throw new RequestError(`HTTP ${response.status}`, 'http', response.status);
  }

  return result;
}
