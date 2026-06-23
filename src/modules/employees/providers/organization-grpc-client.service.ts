import { Injectable, Inject, OnModuleInit } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { Interfaces } from 'lideris-commoms-microservice';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class OrganizationGrpcClientService implements OnModuleInit {
  private organizationService!: Interfaces.IOrganizationGrpcService;

  constructor(@Inject('ORGANIZATION_PACKAGE') private client: ClientGrpc) {}

  onModuleInit() {
    this.organizationService =
      this.client.getService<Interfaces.IOrganizationGrpcService>('OrganizationService');
  }

  async validateEntities(
    request: Interfaces.ValidateEntitiesRequest,
  ): Promise<Interfaces.ValidateEntitiesResponse> {
    return firstValueFrom(this.organizationService.validateEntities(request));
  }

  async resolvePositionIds(
    request: Interfaces.ResolvePositionIdsRequest,
  ): Promise<Interfaces.ResolvePositionIdsResponse> {
    return firstValueFrom(this.organizationService.resolvePositionIds(request));
  }
}
