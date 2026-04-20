import { Role, WorkspaceType } from '../../prisma/generated/prisma/client';
import { AuthService } from './auth.service';

const createTransactionMock = () => ({
  user: {
    upsert: jest.fn(),
    findUnique: jest.fn(),
  },
  workspace: {
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  team: {
    upsert: jest.fn(),
  },
  teamMember: {
    upsert: jest.fn(),
  },
});

const createService = () => {
  const tx = createTransactionMock();
  const prisma = {
    $transaction: jest.fn(async (callback) => callback(tx)),
  };

  const service = new AuthService(prisma as any);

  return { prisma, service, tx };
};

describe('AuthService', () => {
  it('backfills a personal workspace owner membership during user sync', async () => {
    const { service, tx } = createService();

    tx.workspace.findFirst.mockResolvedValue({
      id: 'workspace-1',
      teamId: null,
    });
    tx.user.findUnique.mockResolvedValue({
      id: 'user-1',
      email: 'user@example.com',
      workspaces: [
        {
          id: 'workspace-1',
          type: WorkspaceType.PERSONAL,
          teamId: 'workspace-1',
        },
      ],
    });

    const result = await service.syncUser('user-1', 'user@example.com');

    expect(tx.user.upsert).toHaveBeenCalled();
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
    expect(result).toEqual({
      id: 'user-1',
      email: 'user@example.com',
      workspaces: [
        {
          id: 'workspace-1',
          type: WorkspaceType.PERSONAL,
          teamId: 'workspace-1',
        },
      ],
    });
  });

  it('reuses an existing personal workspace team binding when present', async () => {
    const { service, tx } = createService();

    tx.workspace.findFirst.mockResolvedValue({
      id: 'workspace-1',
      teamId: 'team-1',
    });
    tx.user.findUnique.mockResolvedValue({
      id: 'user-1',
      email: 'user@example.com',
      workspaces: [
        {
          id: 'workspace-1',
          type: WorkspaceType.PERSONAL,
          teamId: 'team-1',
        },
      ],
    });

    await service.syncUser('user-1', 'user@example.com');

    expect(tx.team.upsert).toHaveBeenCalledWith({
      where: { id: 'team-1' },
      create: {
        id: 'team-1',
        name: '__personal_workspace__:user-1',
      },
      update: {},
    });
    expect(tx.workspace.update).not.toHaveBeenCalled();
  });
});
