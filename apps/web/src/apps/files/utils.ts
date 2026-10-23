export const getFileDirectoryLocation = (
  source: '115' | 'local',
  directory = ''
) => {
  const root = source === 'local' ? '/files/local' : '/files/115';
  const query = new URLSearchParams();
  if (directory && !(source === '115' && directory === '0')) {
    query.set('path', directory);
  }
  return `${root}${query.size ? `?${query.toString()}` : ''}`;
};
