import { Module } from '@nestjs/common';

import { ClassifierAgent, CedulaCiudadaniaAgent, TarjetaIdentidadAgent } from './providers/agents';
import { IdDocumentOrchestratorService } from './providers/id-document-orchestrator.service';
import { ImageDownloaderService } from './providers/image-downloader.service';

@Module({
  providers: [
    ClassifierAgent,
    CedulaCiudadaniaAgent,
    TarjetaIdentidadAgent,
    IdDocumentOrchestratorService,
    ImageDownloaderService,
  ],
  exports: [IdDocumentOrchestratorService],
})
export class IdDocumentsModule {}
