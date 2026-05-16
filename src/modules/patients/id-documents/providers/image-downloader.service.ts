import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import sharp from 'sharp';
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';
import { createCanvas } from '@napi-rs/canvas';

@Injectable()
export class ImageDownloaderService {
  private readonly logger = new Logger(ImageDownloaderService.name);
  private readonly FETCH_TIMEOUT_MS = 15_000;

  /** Magic bytes at the start of any PDF file */
  private static readonly PDF_MAGIC = Buffer.from('%PDF-');

  /**
   * Downloads a document from a URL and returns an array of base64 PNG strings.
   * - Images: array with a single PNG.
   * - PDFs: one PNG per page (all pages are rendered).
   */
  async downloadAsBase64PngList(url: string): Promise<string[]> {
    const buffer = await this.download(url);

    if (ImageDownloaderService.isPdf(buffer)) {
      return this.pdfPagesToBase64Png(buffer);
    }

    const png = await this.imageToBase64Png(url, buffer);

    return [png];
  }

  /**
   * Downloads a document from a URL and returns the first page as a base64 PNG string.
   * Convenience method for callers that only need a single image (e.g., classifier).
   */
  async downloadAsBase64Png(url: string): Promise<string> {
    const pages = await this.downloadAsBase64PngList(url);

    return pages[0];
  }

  /** Downloads the raw bytes from a URL with a timeout */
  private async download(url: string): Promise<Buffer> {
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

    return Buffer.from(arrayBuffer);
  }

  /** True if the buffer starts with PDF magic bytes */
  private static isPdf(buffer: Buffer): boolean {
    return buffer.length >= 5 && ImageDownloaderService.PDF_MAGIC.equals(buffer.subarray(0, 5));
  }

  /** Converts an image buffer to a base64 PNG string, resized to max 2048px. */
  private async imageToBase64Png(url: string, buffer: Buffer): Promise<string> {
    try {
      const pngBuffer = await sharp(buffer)
        .resize({ width: 2048, height: 2048, fit: 'inside', withoutEnlargement: true })
        .png()
        .toBuffer();

      return pngBuffer.toString('base64');
    } catch (err) {
      const sharpError = err instanceof Error ? err.message : String(err);

      this.logger.error(
        `Sharp error processing image from ${url}: ${sharpError}`,
        (err as Error)?.stack,
      );

      throw new BadRequestException(
        'No se pudo procesar la imagen. Asegúrate de que sea un JPG o PNG válido.',
      );
    }
  }

  /** Renders up to 2 pages of a PDF buffer using pdfjs-dist at reduced scale, then Sharp-resizes output. */
  private async pdfPagesToBase64Png(buffer: Buffer): Promise<string[]> {
    const MAX_PAGES = 2;
    const PDF_SCALE = 1.5;
    const MAX_DIMENSION = 2048;

    try {
      const doc = await getDocument({ data: new Uint8Array(buffer) }).promise;
      const totalPages = doc.numPages;

      if (totalPages > MAX_PAGES) {
        this.logger.warn(`PDF has ${totalPages} pages — only first ${MAX_PAGES} will be processed`);
      }

      const pagesToRender = Math.min(totalPages, MAX_PAGES);
      const pages: string[] = [];

      for (let i = 1; i <= pagesToRender; i++) {
        const page = await doc.getPage(i);
        const viewport = page.getViewport({ scale: PDF_SCALE });

        const canvas = createCanvas(viewport.width, viewport.height);
        const ctx = canvas.getContext('2d');

        // @ts-expect-error — @napi-rs/canvas context is compatible at runtime but lacks drawFocusIfNeeded in types
        await page.render({ canvasContext: ctx, viewport }).promise;

        const rawBuffer = canvas.toBuffer('image/png');

        // Sharp resize keeps PNG dimensions bounded regardless of PDF page size
        const optimizedPng = await sharp(rawBuffer)
          .resize({
            width: MAX_DIMENSION,
            height: MAX_DIMENSION,
            fit: 'inside',
            withoutEnlargement: true,
          })
          .png()
          .toBuffer();

        pages.push(optimizedPng.toString('base64'));
      }

      return pages;
    } catch (err) {
      const pdfError = err instanceof Error ? err.message : String(err);

      this.logger.error(`PDF render error: ${pdfError}`, (err as Error)?.stack);
      throw new BadRequestException(
        'No se pudo procesar el PDF. Puede estar corrupto, encriptado, o tener un formato no soportado.',
      );
    }
  }
}
