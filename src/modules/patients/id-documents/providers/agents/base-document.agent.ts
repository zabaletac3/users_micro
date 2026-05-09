import type { MessageContentImageUrl, MessageContentText } from '@langchain/core/messages';

import { readFileSync } from 'fs';
import { join } from 'path';

import sharp from 'sharp';
import { ChatOpenAI } from '@langchain/openai';
import { HumanMessage } from '@langchain/core/messages';
import { z } from 'zod';

export abstract class BaseDocumentAgent<T extends z.ZodTypeAny> {
  protected readonly llm: ChatOpenAI;
  private referencePngBase64: string | null = null;
  private readonly svgFileName: string;

  constructor(
    model: string,
    svgFileName: string,
    protected readonly zodSchema: T,
    protected readonly systemPrompt: string,
  ) {
    this.llm = new ChatOpenAI({
      model,
      temperature: 0,
      apiKey: process.env.OPENAI_API_KEY,
    });
    this.svgFileName = svgFileName;
  }

  async extract(targetImages: string | string[]): Promise<z.infer<T>> {
    if (!this.referencePngBase64) {
      this.referencePngBase64 = await this.loadReferenceImage();
    }

    const images = Array.isArray(targetImages) ? targetImages : [targetImages];

    const modelWithStructuredOutput = this.llm.withStructuredOutput(this.zodSchema, {
      name: 'extractedDocumentFields',
    });

    const content: (MessageContentText | MessageContentImageUrl)[] = [
      {
        type: 'text',
        text: this.buildPrompt(images.length),
      },
      {
        type: 'image_url',
        image_url: { url: `data:image/png;base64,${this.referencePngBase64}` },
      },
    ];

    for (const img of images) {
      content.push({
        type: 'image_url',
        image_url: { url: `data:image/png;base64,${img}` },
      });
    }

    const message = new HumanMessage({ content });

    return modelWithStructuredOutput.invoke([message]);
  }

  private buildPrompt(targetCount: number): string {
    const targetDesc =
      targetCount === 1
        ? 'IMAGEN 2 (OBJETIVO): Es el documento real del cual debes extraer los datos.'
        : `IMAGEN 2 (OBJETIVO — FRENTE): Es el frente del documento real.
IMAGEN 3 (OBJETIVO — REVERSO): Es el reverso del documento real.`;

    const instruction =
      targetCount === 1
        ? 'Usa la imagen 1 como guía visual para ubicar cada campo en la imagen 2.'
        : 'Usa la imagen 1 como guía visual para ubicar cada campo en las imágenes 2 (frente) y 3 (reverso).';

    return `${this.systemPrompt}

IMAGEN 1 (REFERENCIA): Es un diagrama con rectángulos de colores que marcan dónde está cada campo en este tipo de documento colombiano.
${targetDesc}

${instruction} Extrae ÚNICAMENTE los campos que sean legibles. Si un campo no está presente o no es legible, devuélvelo como null.

IMPORTANTE:
- El número de documento NO lleva puntos ni espacios.
- Las fechas deben estar en formato YYYY-MM-DD.
- Los nombres y apellidos deben llevar mayúscula inicial.
- El género debe ser "male" o "female" (en minúscula).
- Grupo sanguíneo: usa el símbolo (ej: "O+", "A-").`;
  }

  private async loadReferenceImage(): Promise<string> {
    const svgPath = join(__dirname, '..', '..', 'reference-images', this.svgFileName);
    const svgBuffer = readFileSync(svgPath);
    const pngBuffer = await sharp(svgBuffer).png().toBuffer();

    return pngBuffer.toString('base64');
  }
}
