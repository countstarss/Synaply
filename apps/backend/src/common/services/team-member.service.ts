import { Injectable, NotFoundException } from '@nestjs/common';
import { Role, WorkspaceType } from '../../../prisma/generated/prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class TeamMemberService {
  constructor(private prisma: PrismaService) {}

  private async ensurePersonalWorkspaceMembership(
    workspaceId: string,
    userId: string,
  ): Promise<string> {
    const workspace = await this.prisma.workspace.findUnique({
      where: { id: workspaceId },
      select: {
        id: true,
        type: true,
        userId: true,
        teamId: true,
      },
    });

    if (!workspace) {
      throw new NotFoundException('工作空间不存在');
    }

    if (workspace.type !== WorkspaceType.PERSONAL) {
      throw new NotFoundException('无效的工作空间类型');
    }

    if (workspace.userId !== userId) {
      throw new NotFoundException('无权限访问此工作空间');
    }

    const personalTeamId = workspace.teamId ?? workspace.id;

    await this.prisma.$transaction(async (tx) => {
      await tx.team.upsert({
        where: { id: personalTeamId },
        create: {
          id: personalTeamId,
          name: `__personal_workspace__:${userId}`,
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

      if (workspace.teamId !== personalTeamId) {
        await tx.workspace.update({
          where: { id: workspace.id },
          data: {
            teamId: personalTeamId,
          },
        });
      }
    });

    const teamMember = await this.prisma.teamMember.findUnique({
      where: {
        teamId_userId: {
          teamId: personalTeamId,
          userId,
        },
      },
      select: {
        id: true,
      },
    });

    if (!teamMember) {
      throw new NotFoundException('用户没有团队成员身份');
    }

    return teamMember.id;
  }

  /**
   * 根据User ID和工作空间ID获取对应的TeamMember ID
   * @param userId 用户ID
   * @param workspaceId 工作空间ID
   * @returns TeamMember ID
   */
  async getTeamMemberIdByWorkspace(
    userId: string,
    workspaceId: string,
  ): Promise<string> {
    // 查找工作空间
    const workspace = await this.prisma.workspace.findUnique({
      where: { id: workspaceId },
      include: {
        team: {
          include: {
            members: {
              where: { userId },
            },
          },
        },
      },
    });

    if (!workspace) {
      throw new NotFoundException('工作空间不存在');
    }

    // 如果是个人工作空间，获取用户的第一个TeamMember身份
    if (workspace.type === 'PERSONAL') {
      return this.ensurePersonalWorkspaceMembership(workspaceId, userId);
    }

    // 如果是团队工作空间，获取对应的TeamMember
    if (workspace.type === 'TEAM') {
      const teamMember = workspace.team.members.find(
        (m) => m.userId === userId,
      );
      if (!teamMember) {
        throw new NotFoundException('用户不是该团队成员');
      }
      return teamMember.id;
    }

    throw new NotFoundException('无效的工作空间类型');
  }

  /**
   * 根据User ID获取默认的TeamMember ID（用于没有明确工作空间上下文的情况）
   * @param userId 用户ID
   * @returns 默认的TeamMember ID
   */
  async getDefaultTeamMemberId(userId: string): Promise<string> {
    const teamMember = await this.prisma.teamMember.findFirst({
      where: { userId },
      orderBy: { createdAt: 'asc' }, // 获取最早加入的团队
    });

    if (!teamMember) {
      throw new NotFoundException('用户没有团队成员身份');
    }

    return teamMember.id;
  }

  /**
   * 验证用户是否有权访问指定工作空间
   * @param userId 用户ID
   * @param workspaceId 工作空间ID
   * @returns 工作空间信息和对应的TeamMember ID
   */
  async validateWorkspaceAccess(userId: string, workspaceId: string) {
    const workspace = await this.prisma.workspace.findUnique({
      where: { id: workspaceId },
      include: {
        team: {
          include: {
            members: {
              where: { userId },
            },
          },
        },
      },
    });

    if (!workspace) {
      throw new NotFoundException('工作空间不存在');
    }

    let teamMemberId: string;

    if (workspace.type === 'PERSONAL') {
      teamMemberId = await this.ensurePersonalWorkspaceMembership(
        workspaceId,
        userId,
      );
    } else {
      const teamMember = workspace.team.members.find(
        (m) => m.userId === userId,
      );
      if (!teamMember) {
        throw new NotFoundException('用户不是该团队成员');
      }
      teamMemberId = teamMember.id;
    }

    return { workspace, teamMemberId };
  }
}
