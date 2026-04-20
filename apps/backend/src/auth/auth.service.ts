import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  Role,
  WorkspaceType,
} from '../../prisma/generated/prisma/client'; // 导入 WorkspaceType 枚举

export interface SyncUserProfileInput {
  name?: string | null;
  avatarUrl?: string | null;
}

const normalizeOptionalString = (value?: string | null) => {
  if (value === undefined) {
    return undefined;
  }

  const trimmedValue = value?.trim();
  return trimmedValue ? trimmedValue : null;
};

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService) {}

  private getPersonalTeamName(userId: string) {
    return `__personal_workspace__:${userId}`;
  }

  /**
   * MARK: - 同步或创建用户
   * @description
   * 思考过程:
   * 1. 目标: 确保每个通过 Supabase 认证的用户在我们的数据库中都有对应的记录。
   * 2. 策略: 使用 `upsert` 操作，如果用户已存在（通过 `userId` 判断），则更新其信息（目前为空，可扩展）；如果不存在，则创建新用户。
   * 3. 额外操作: 为新创建的用户自动生成一个个人工作空间，这是系统设计中每个用户都应有的。
   * 4. 关联: 用户和工作空间通过 `workspaces` 关系关联。
   * 5. 返回值: 返回包含工作空间信息的用户对象，方便后续操作。
   * @param userId Supabase 用户 ID
   * @param email 用户邮箱
   * @param profile 用户的扩展资料（如名称、头像）
   * @returns 创建或更新后的用户对象
   */
  async syncUser(
    userId: string,
    email: string,
    profile: SyncUserProfileInput = {},
  ) {
    const normalizedName = normalizeOptionalString(profile.name);
    const normalizedAvatarUrl = normalizeOptionalString(profile.avatarUrl);

    return this.prisma.$transaction(async (tx) => {
      await tx.user.upsert({
        where: { id: userId },
        create: {
          id: userId,
          email: email,
          name: normalizedName ?? null,
          avatarUrl: normalizedAvatarUrl ?? null,
          // 为新用户创建个人工作空间
          workspaces: {
            create: {
              name: `${email} 的个人空间`,
              type: WorkspaceType.PERSONAL,
              calendar: {
                create: {
                  name: `${email} 的日历`,
                },
              },
            },
          },
        },
        update: {
          email,
          ...(normalizedName !== undefined ? { name: normalizedName } : {}),
          ...(normalizedAvatarUrl !== undefined
            ? { avatarUrl: normalizedAvatarUrl }
            : {}),
        },
      });

      let personalWorkspace = await tx.workspace.findFirst({
        where: {
          userId,
          type: WorkspaceType.PERSONAL,
        },
        select: {
          id: true,
          teamId: true,
        },
        orderBy: {
          createdAt: 'asc',
        },
      });

      if (!personalWorkspace) {
        personalWorkspace = await tx.workspace.create({
          data: {
            name: `${email} 的个人空间`,
            type: WorkspaceType.PERSONAL,
            userId,
            calendar: {
              create: {
                name: `${email} 的日历`,
              },
            },
          },
          select: {
            id: true,
            teamId: true,
          },
        });
      }

      const personalTeamId = personalWorkspace.teamId ?? personalWorkspace.id;

      await tx.team.upsert({
        where: { id: personalTeamId },
        create: {
          id: personalTeamId,
          name: this.getPersonalTeamName(userId),
        },
        update: {},
      });

      await tx.teamMember.upsert({
        where: {
          teamId_userId: {
            teamId: personalTeamId,
            userId,
          },
        },
        create: {
          teamId: personalTeamId,
          userId,
          role: Role.OWNER,
        },
        update: {
          role: Role.OWNER,
        },
      });

      if (personalWorkspace.teamId !== personalTeamId) {
        await tx.workspace.update({
          where: { id: personalWorkspace.id },
          data: {
            teamId: personalTeamId,
          },
        });
      }

      return tx.user.findUnique({
        where: { id: userId },
        include: { workspaces: true },
      });
    });
  }
}
