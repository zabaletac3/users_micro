import type { ExtractedFields } from '../schemas/extraction.schemas';

import { Injectable, InternalServerErrorException } from '@nestjs/common';

import { ColombianDocumentType } from '../id-documents.constants';

import { ClassifierAgent, CedulaCiudadaniaAgent, TarjetaIdentidadAgent } from './agents';
import { ImageDownloaderService } from './image-downloader.service';

@Injectable()
export class IdDocumentOrchestratorService {
  private readonly agentMap: Partial<
    Record<ColombianDocumentType, CedulaCiudadaniaAgent | TarjetaIdentidadAgent>
  >;

  constructor(
    private readonly classifierAgent: ClassifierAgent,
    private readonly cedulaAgent: CedulaCiudadaniaAgent,
    private readonly tarjetaIdentidadAgent: TarjetaIdentidadAgent,
    private readonly imageDownloader: ImageDownloaderService,
  ) {
    this.agentMap = {
      [ColombianDocumentType.CEDULA_CIUDADANIA]: cedulaAgent,
      [ColombianDocumentType.TARJETA_IDENTIDAD]: tarjetaIdentidadAgent,
    };
  }

  async extract(documentUrl: string): Promise<ExtractedFields> {
    // 1. Download and convert to base64 PNGs (multiple pages for PDFs)
    const pages = await this.imageDownloader.downloadAsBase64PngList(documentUrl);

    // 2. Classify document type using the first page
    const { documentType } = await this.classifierAgent.classify(pages[0]);

    // 3. Route to specialized agent
    const agent = this.agentMap[documentType];

    if (!agent) {
      throw new InternalServerErrorException(
        `El tipo de documento "${documentType}" no tiene un agente de extracción implementado aún. ` +
          `Los tipos soportados son: CC (Cédula de Ciudadanía) y TI (Tarjeta de Identidad).`,
      );
    }

    // 4. Extract with specialized agent (send all pages)
    return agent.extract(pages);
  }
}
