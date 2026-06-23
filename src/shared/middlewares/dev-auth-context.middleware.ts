import { Injectable, NestMiddleware } from '@nestjs/common';
import { FastifyReply, FastifyRequest } from 'fastify';

const DEV_USER_ID = process.env.DEV_USER_ID || '000000000000000000000001';
const DEV_COMPANY_ID = process.env.DEV_COMPANY_ID || '000000000000000000000002';

const RESOURCES = ['patients', 'employees', 'users'];

const ACTIONS = ['read', 'create', 'update', 'delete'];

function buildMockContext(): string {
  const permissions = RESOURCES.flatMap((r) => ACTIONS.map((a) => `${r}:${a}`));
  const resourceScopes = RESOURCES.map((r) => ({
    resource: r,
    scope: 'company',
  }));

  const payload = {
    principal: {
      userId: DEV_USER_ID,
      email: 'dev@local.test',
      displayName: 'Dev User',
      companyIdSelected: DEV_COMPANY_ID,
      companyIds: [DEV_COMPANY_ID],
      permissions,
      resourceScopes,
      tokenVersion: 0,
    },
    issuedAt: Math.floor(Date.now() / 1000),
    expiresAt: Math.floor(Date.now() / 1000) + 86400,
    traceId: 'dev-local',
    source: 'dev-mock',
  };

  return Buffer.from(JSON.stringify(payload), 'utf8').toString('base64');
}

const MOCK_CONTEXT_B64 = buildMockContext();

@Injectable()
export class DevAuthContextMiddleware implements NestMiddleware {
  use(req: FastifyRequest, _res: FastifyReply, next: () => void): void {
    console.log(
      `[DevAuthContextMiddleware] Processing ${req.url} | has x-auth-context: ${!!req.headers['x-auth-context']}`,
    );

    if (!req.headers['x-auth-context']) {
      console.log('[DevAuthContextMiddleware] Injecting dev auth context');
      (req.headers as Record<string, string>)['x-auth-context'] = MOCK_CONTEXT_B64;
      (req.headers as Record<string, string>)['x-company-id'] =
        (req.headers['x-company-id'] as string) || DEV_COMPANY_ID;
    } else {
      console.log('[DevAuthContextMiddleware] x-auth-context already present');
    }
    next();
  }
}
