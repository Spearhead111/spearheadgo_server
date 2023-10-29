/** 用户角色map */
export const USER_ROLE_MAP = {
  ROOT: 'root',
  ADMIN: 'admin',
  AUTHOR: 'author',
  VISITOR: 'visitor',
  GUEST: 'guest',
};

/** 角色权限等级 */
export const ROLE_AUTH_MAP = {
  [USER_ROLE_MAP.ROOT]: 10,
  [USER_ROLE_MAP.ADMIN]: 8,
  [USER_ROLE_MAP.AUTHOR]: 5,
  [USER_ROLE_MAP.VISITOR]: 1,
};
