import { getFileDirectoryLocation } from '../utils';

export const getLocalDirectoryLocation = (path = '') =>
  getFileDirectoryLocation('local', path);

export const getParentDirectory = (path: string) =>
  path.split('/').slice(0, -1).join('/');
