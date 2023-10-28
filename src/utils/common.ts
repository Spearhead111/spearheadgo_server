import { ROLE_AUTH_MAP } from 'src/constants/common';

/**
 * 判断用户的角色权限是否符合
 * @param accessRole 需要达到的角色权限
 * @param userRole 用户所有的角色
 * @returns 是否符合权限
 */
export const judegAuth = (
  accessRole: string | string[],
  userRole: string[],
) => {
  // 计算需要达到的最小角色权限
  const authLevel =
    accessRole instanceof Array
      ? Math.max(...accessRole.map((item) => ROLE_AUTH_MAP[item]))
      : ROLE_AUTH_MAP[accessRole];
  // 计算用户的最大角色权限
  const userMaxAuthLevel = Math.max(
    ...userRole.map((item) => ROLE_AUTH_MAP[item]),
  );
  return authLevel <= userMaxAuthLevel;
};
