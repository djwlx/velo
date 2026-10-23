const MX_PLAYER_PACKAGE = 'com.mxtech.videoplayer.ad';

interface OpenInMxPlayerOptions {
  title?: string;
  fallbackUrl?: string;
}

export const openInMxPlayer = (
  url: string,
  { title, fallbackUrl }: OpenInMxPlayerOptions = {}
): void => {
  const schemeMatch = url.match(/^(https?):\/\//i);
  const scheme = schemeMatch?.[1].toLowerCase();
  const data = schemeMatch ? url.slice(schemeMatch[0].length) : url;
  const extras = [
    ...(scheme ? [`scheme=${scheme}`] : []),
    `package=${MX_PLAYER_PACKAGE}`,
    'type=video/*',
    ...(title ? [`S.title=${encodeURIComponent(title)}`] : []),
    ...(fallbackUrl
      ? [`S.browser_fallback_url=${encodeURIComponent(fallbackUrl)}`]
      : []),
  ];

  window.location.href = `intent://${data}#Intent;${extras.join(';')};end`;
};
