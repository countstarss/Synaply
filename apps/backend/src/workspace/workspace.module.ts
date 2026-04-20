import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { WorkspaceService } from './workspace.service';
import { AuthModule } from '../auth/auth.module';
import { WorkspaceController } from './workspace.controller';
import { CommonModule } from '../common/common.module';
import { IssueModule } from '../issue/issue.module';
import { InboxModule } from '../inbox/inbox.module';

@Module({
  imports: [PrismaModule, AuthModule, CommonModule, IssueModule, InboxModule],
  controllers: [WorkspaceController],
  providers: [WorkspaceService],
  exports: [WorkspaceService],
})
export class WorkspaceModule {}
