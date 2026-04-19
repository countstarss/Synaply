import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const TeamMemberId = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();

    if (request.user && request.user.sub) {
      return request.user.sub; // 返回 Supabase User ID
    }
    return null;
  },
);
