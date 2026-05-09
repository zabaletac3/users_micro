import { Injectable } from '@nestjs/common';
import { ChatOpenAI } from '@langchain/openai';
import { HumanMessage } from '@langchain/core/messages';
import { z } from 'zod';

import { ColombianDocumentType, CLASSIFIER_MODEL } from '../../id-documents.constants';

const classifierOutputSchema = z.object({
  documentType: z
    .nativeEnum(ColombianDocumentType)
    .describe('Tipo de documento de identidad colombiano detectado.'),
  confidence: z.number().min(0).max(1).describe('Nivel de confianza (0-1).'),
});

@Injectable()
export class ClassifierAgent {
  private readonly llm: ChatOpenAI;

  constructor() {
    this.llm = new ChatOpenAI({
      model: CLASSIFIER_MODEL,
      temperature: 0,
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  async classify(
    imageBase64: string,
  ): Promise<{ documentType: ColombianDocumentType; confidence: number }> {
    const modelWithStructuredOutput = this.llm.withStructuredOutput(classifierOutputSchema, {
      name: 'documentClassification',
    });

    const message = new HumanMessage({
      content: [
        {
          type: 'text',
          text: `Identifica el tipo de documento de identidad colombiano que aparece en esta imagen.

Opciones:
- CC: Cédula de Ciudadanía (formato vertical, fondo azul/rosado, para mayores de edad)
- TI: Tarjeta de Identidad (formato horizontal, fondo azul, para menores de 7 a 17 años)
- CE: Cédula de Extranjería (similar a CC pero dice "CÉDULA DE EXTRANJERÍA")
- PA: Pasaporte colombiano (libreta oscura, páginas internas con datos)
- PPT: Permiso de Protección Temporal (documento para migrantes venezolanos)
- NIT: Número de Identificación Tributaria (personas jurídicas, formato distinto)
- UNKNOWN: Si no puedes determinar el tipo con certeza

Devuelve también un nivel de confianza entre 0 y 1.`,
        },
        {
          type: 'image_url',
          image_url: { url: `data:image/png;base64,${imageBase64}` },
        },
      ],
    });

    const result = await modelWithStructuredOutput.invoke([message]);

    return result;
  }
}
