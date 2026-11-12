import { readAppSecret } from './app-secret.js';

interface EnvType {
  appSecret: string;
}

export const ENV: EnvType = {
  appSecret: readAppSecret(),
};
