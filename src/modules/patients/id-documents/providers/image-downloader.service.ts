import { Injectable, BadRequestException } from '@nestjs/common';
import sharp from 'sharp';

@Injectable()
export class ImageDownloaderService {
  private readonly FETCH_TIMEOUT_MS = 15_000;

  /**
   * Downloads a document from a URL and returns a base64 PNG string.
   * - Images: converted to PNG via sharp (works everywhere).
   * - PDFs: sharp extracts page 1 (works on Linux/macOS; not on Windows due
   *   to missing libvips PDF codec in pre-built binaries).
   */
  async downloadAsBase64Png(url: string): Promise<string> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.FETCH_TIMEOUT_MS);

    let response: Response;

    try {
      response = await fetch(url, { signal: controller.signal });
    } catch (err: unknown) {
      const message =
        err instanceof Error && err.name === 'AbortError'
          ? 'Timeout al descargar el documento. La URL tardó más de 15 segundos en responder.'
          : 'No se pudo acceder a la URL del documento. Verifica que sea accesible públicamente.';

      throw new BadRequestException(message);
    } finally {
      clearTimeout(timeout);
    }

    if (!response.ok) {
      throw new BadRequestException(`Error al descargar el documento: HTTP ${response.status}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    try {
      const pngBuffer = await sharp(buffer, { page: 0 }).png().toBuffer();

      return pngBuffer.toString('base64');
    } catch {
      const isPdf = url.toLowerCase().endsWith('.pdf');

      if (isPdf) {
        throw new BadRequestException(
          'No se pudo procesar el PDF en este entorno (Windows no incluye soporte PDF en sharp). ' +
            'En producción (Linux) esto funciona sin problemas. Para pruebas locales, usa una imagen JPG/PNG.',
        );
      }
      throw new BadRequestException(
        'No se pudo procesar la imagen. Asegúrate de que sea un JPG o PNG válido.',
      );
    }
  }
}
