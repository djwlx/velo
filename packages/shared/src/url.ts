export type UrlParams = Record<string, string | string[]>;

export function getUrlParams(request: { url: string }): UrlParams {
  const url = new URL(request.url);
  const params: UrlParams = Object.create(null);

  for (const [key, value] of url.searchParams) {
    const previous = params[key];
    params[key] =
      previous === undefined
        ? value
        : [...(Array.isArray(previous) ? previous : [previous]), value];
  }

  return params;
}
