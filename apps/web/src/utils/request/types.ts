export interface BaseResponse<T> {
  code: number;
  data: T;
  message?: string;
}

export interface RequestOptions extends RequestInit {
  toast?: boolean;
}
