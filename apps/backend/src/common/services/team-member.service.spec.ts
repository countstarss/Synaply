import { Role, WorkspaceType } from '../../../prisma/generated/prisma/client';
import { TeamMemberService } from './team-member.service';

const createTransactionMock = () => ({
  team: {
    upsert: jest.fn(),
  },
  teamMember: {
    upsert: jest.fn(),
  },
  workspace: {
    update: jest.fn(),
  },
});

const createService = () => {
  const tx = createTransactionMock();
  const prisma = {
    workspace: {
      findUnique: jest.fn(),
    },
    teamMember: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
    },
    $transaction: jest.fn(async (callback) => callback(tx)),
  };

  const service = new TeamMemberService(prisma as any);

  return { prisma, service, tx };
};

describe('TeamMemberService', () => {
  it('provisions a personal workspace owner membership when none exists yet', async () => {
    const { prisma, service, tx } = createService();

    prisma.workspace.findUnique.mockResolvedValue({
      id: 'workspace-1',
      type: WorkspaceType.PERSONAL,
      userId: 'user-1',
      teamId: null,
      team: null,
    });
    prisma.teamMember.findUnique.mockResolvedValue({
      id: 'member-1',
    });

    const teamMemberId = await service.getTeamMemberIdByWorkspace(
      'user-1',
      'workspace-1',
    );

    expect(teamMemberId).toBe('member-1');
    expect(tx.team.upsert).toHaveBeenCalledWith({
      where: { id: 'workspace-1' },
      create: {
        id: 'workspace-1',
        name: '__personal_workspace__:user-1',
      },
      update: {},
    });
    expect(tx.teamMember.upsert).toHaveBeenCalledWith({
      where: {
        teamId_userId: {
          teamId: 'workspace-1',
          userId: 'user-1',
        },
      },
      create: {
        teamId: 'workspace-1',
        userId: 'user-1',
        role: Role.OWNER,
      },
      update: {
        role: Role.OWNER,
      },
    });
    expect(tx.workspace.update).toHaveBeenCalledWith({
      where: { id: 'workspace-1' },
      data: {
        teamId: 'workspace-1',
      },
    });
  });
});
