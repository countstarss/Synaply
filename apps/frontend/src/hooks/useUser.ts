import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import {
  fetchUserById,
  PublicUserInfo,
  getUserNameFallback,
} from "@/lib/fetchers/user";

/**
 * 获取用户信息的 Hook
 */
export const useUserInfo = (userId: string | undefined) => {
  const { session } = useAuth();

  return useQuery({
    queryKey: ["user", userId],
    queryFn: async () => {
      if (!userId || !session?.access_token) {
        throw new Error("Missing userId or access token");
      }
      return fetchUserById(userId, session.access_token);
    },
    enabled: !!userId && !!session?.access_token,
    staleTime: 5 * 60 * 1000, // 5分钟缓存
  });
};

/**
 * 获取用户显示名称，优先使用name，然后使用email前缀
 */
export const getUserDisplayName = (
  user: PublicUserInfo | undefined
): string => {
  if (!user) return "用户";

  if (user.name) {
    return user.name;
  }

  return getUserNameFallback(user.email);
};

/**
 * 获取用户头像信息
 */
export const getUserAvatar = (user: PublicUserInfo | undefined) => {
  if (!user) {
    return {
      src: "https://avatar.vercel.sh/default",
      fallback: "U",
    };
  }

  const fallback = user.name
    ? user.name[0]?.toUpperCase()
    : getUserNameFallback(user.email)[0]?.toUpperCase();

  return {
    src: user.avatarUrl || `https://avatar.vercel.sh/${user.id}`,
    fallback: fallback || "U",
  };
};
