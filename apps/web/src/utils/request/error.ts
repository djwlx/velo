type RequestErrorType = 'network' | 'http' | 'business';

export class RequestError extends Error {
  type: RequestErrorType;
  status?: number;
  code?: number;

  constructor(
    message: string,
    type: RequestErrorType,
    status?: number,
    code?: number
  ) {
    super(message);

    this.name = 'RequestError';
    this.type = type;
    this.status = status;
    this.code = code;
  }
}
