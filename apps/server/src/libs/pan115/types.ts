import { z } from 'zod';

export interface RequestOptions {
  withCookie?: boolean;
  timeoutMs?: number;
  accept?: string;
}

export type FileItem = {
  fid: string;
  uid: number;
  aid: number;
  cid: string;
  n: string;
  s: number;
  sta: number;
  pt: string;
  pc: string;
  fc: number;
  p: number;
  m: number;
  star_time: number;
  t: string;
  te: string;
  tp: string;
  tu: string;
  to: number;
  d: number;
  c: number;
  sh: number;
  e: string;
  ico: string;
  class?: string;
  fatr: string;
  fdes: number;
  sha: string;
  q: number;
  hdf: number;
  et: number;
  epos: string;
  fvs: number;
  check_code: number;
  check_msg: string;
  fuuid: number;
  ec: number;
  fl: unknown[];
  ms: number;
  u: string;
  score: number;
  is_top: number;
};

export type DirItem = {
  cid: string;
  aid: string;
  pid: string;
  n: string;
  m: number;
  star_time: number;
  cc: string;
  sh: string;
  pc: string;
  t: string;
  te: string;
  tu: string;
  tp: string;
  to: string;
  e: string;
  p: number;
  ns: string;
  u: string;
  fc: number;
  fdes: number;
  hdf: number;
  ispl: number;
  fvs: number;
  check_code: number;
  check_msg: string;
  fuuid: number;
  ec: number;
  fl: unknown[];
  issct: number;
  score: number;
  is_top: number;
  fid?: undefined;
  class?: undefined;
};

export type FileListItem = FileItem | DirItem;

export type PathItem = {
  name: string;
  aid: string;
  cid: string;
  pid: string;
  isp: string;
};

export type FileListResponse = {
  data: FileListItem[];
  count: number;
  sys_count: number;
  page_size: number;
  aid: string;
  cid: string | number;
  is_asc: number;
  star: number;
  is_share: number;
  type: number;
  is_q: number;
  r_all: number;
  stdir: number;
  cur: number;
  min_size: number;
  max_size: number;
  record_open_time: string;
  path: PathItem[];
  fields: string;
  order: string;
  fc_mix: number;
  cost_time_1: number;
  cost_time_2: number;
  cost_time_3: number;
  cost_time_4: number;
  cost_time_5: number;
  cost_time_6: number;
  cost_time_7: number;
  cost_time_8: number;
  natsort: number;
  uid: number;
  offset: number;
  limit: number;
  suffix: string;
  last_utime: number;
  use_cache: number;
  state: boolean;
  error: string;
  errNo: number;
};

export type FileUrl = {
  url: string;
  client: number;
  desc: string | null;
  isp: string | null;
  oss_id: string;
  ooid: string;
};

export type DownloadMeta = {
  file_name: string;
  file_size: string;
  pick_code: string;
  sha1: string;
  url: FileUrl;
};

export type DownloadMetaResponse = Record<string, DownloadMeta>;

export type FileResponse = {
  state: boolean;
  msg: string;
  errno: number;
  data: string;
};

export type FileInfo = {
  file_name: string;
  file_size: string;
  url: string;
  mime: string;
};

export const qrTokenResponseSchema = z.object({
  state: z.union([z.boolean(), z.number()]).optional(),
  code: z.number().int(),
  message: z.string(),
  data: z.object({
    uid: z.string().min(1).max(128),
    time: z.coerce.number().int().positive(),
    sign: z.string().min(1).max(512),
    qrcode: z.string().url(),
  }),
});

export const qrStatusResponseSchema = z.object({
  state: z.union([z.boolean(), z.number()]).optional(),
  data: z.object({ status: z.number().int() }),
});

export const qrLoginResponseSchema = z.object({
  state: z.union([z.boolean(), z.number()]).optional(),
  data: z.object({
    cookie: z.record(z.string(), z.union([z.string(), z.number()])),
  }),
});

export const userInfoResponseSchema = z.object({
  state: z.union([z.boolean(), z.number()]).optional(),
  data: z
    .object({
      device: z.number().int().optional(),
      rank: z.number().int().optional(),
      liang: z.number().int().optional(),
      mark: z.number().int().optional(),
      mark1: z.number().int().optional(),
      mark3: z.number().int().optional(),
      vip: z.number().int().optional(),
      expire: z.number().int().optional(),
      global: z.number().int().optional(),
      forever: z.number().int().optional(),
      is_privilege: z.boolean().optional(),
      privilege: z
        .object({
          start: z.number().int().optional(),
          expire: z.number().int().optional(),
          state: z.boolean().optional(),
          mark: z.number().int().optional(),
        })
        .optional(),
      user_name: z.string().max(128).optional(),
      face: z.string().max(2048).optional(),
      user_id: z.number().int().optional(),
      display_uid: z.string().max(128).optional(),
      forever_name: z.string().max(128).optional(),
    })
    .passthrough()
    .nullable()
    .optional(),
});

export type QrTokenResponse = z.infer<typeof qrTokenResponseSchema>;
export type QrLoginToken = Omit<QrTokenResponse['data'], 'qrcode'>;
export type UserInfoResponse = z.infer<typeof userInfoResponseSchema>;
