import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { createComment, getComments } from "@/lib/fetchers/comment";
import { CreateCommentDto, Comment } from "@/lib/fetchers/comment";

/**
 * 获取评论列表
 */
export const useComments = (issueId: string) => {
  const { session } = useAuth();

  return useQuery<Comment[]>({
    queryKey: ["comments", issueId],
    queryFn: () => {
      if (!session?.access_token) return [];
      return getComments(issueId, session.access_token);
    },
    enabled: !!session?.access_token && !!issueId,
  });
};

/**
 * 创建评论
 */
export const useCreateComment = () => {
  const { session } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateCommentDto) => {
      if (!session?.access_token) {
        throw new Error("未授权");
      }
      return createComment(data, session.access_token);
    },
    onSuccess: (_createdComment, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["comments", variables.issueId],
      });
    },
  });
};
