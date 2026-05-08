import { Injectable } from '@nestjs/common';

import { extractedFieldsSchema, type ExtractedFields } from '../../schemas/extraction.schemas';
import { EXTRACTOR_MODEL } from '../../id-documents.constants';

import { BaseDocumentAgent } from './base-document.agent';

const TARJETA_IDENTIDAD_SYSTEM_PROMPT = `Eres un experto en extraer datos de la Tarjeta de Identidad colombiana (documento para menores de 7 a 17 años).

La IMAGEN 1 (REFERENCIA) es un diagrama anotado de una tarjeta de identidad con rectángulos de colores. Cada color indica un campo:

FRENTE (parte superior de la referencia, orientación horizontal):
- Azul (#185FA5): Título del documento — identifica si dice "TARJETA DE IDENTIDAD"
- Verde (#3B6D11): Número de tarjeta — número de identificación del menor
- Naranja (#993C1D): Apellidos — primer apellido y segundo apellido
- Dorado (#854F0B): Nombres — primer nombre y segundo nombre
- Azul (#185FA5): Fecha de nacimiento — formato DD/MM/AAAA o DD-MMM-AAAA
- Verde (#3B6D11): Lugar de nacimiento — departamento y municipio
- Morado (#534AB7): Fotografía — foto del menor (lado izquierdo de la tarjeta)

REVERSO (parte inferior de la referencia):
- Naranja (#993C1D): Estatura — en centímetros (ej: 1.65)
- Dorado (#854F0B): Grupo sanguíneo (G.S. RH) — ej: O+, A-, AB+
- Verde azulado (#0F6E56): Sexo — M (masculino) o F (femenino)
- Morado (#534AB7): Fecha y lugar de expedición
- Gris (#5F5E5A): Huella dactilar (índice derecho) y código de barras 2D (no se extraen)
- Rosa (#993556): Número de control al pie

CONVENCIONES IMPORTANTES:
- El número de documento va SIN puntos, SIN espacios. Ej: "1020304050", NO "1.020.304.050"
- Fechas en formato YYYY-MM-DD
- Nombres y apellidos con mayúscula inicial: "Valentina", "García"
- "M" → "male", "F" → "female" (en minúscula)
- Grupo sanguíneo: traduce "O+" → "O+", "A-" → "A-", etc. (con símbolo, sin underscore)
- Estatura: convierte a número entero en centímetros (1.65 → 165)
- Si hay un segundo nombre o segundo apellido, extráelos. Si solo hay uno, deja el segundo como undefined.
- Si un campo no es legible, déjalo como undefined. NO inventes datos.
- La tarjeta de identidad NO tiene firma (es para menores de edad).`;

@Injectable()
export class TarjetaIdentidadAgent extends BaseDocumentAgent<typeof extractedFieldsSchema> {
  constructor() {
    super(
      EXTRACTOR_MODEL,
      'tarjeta_identidad_anotada.svg',
      extractedFieldsSchema,
      TARJETA_IDENTIDAD_SYSTEM_PROMPT,
    );
  }

  async extract(imageBase64: string): Promise<ExtractedFields> {
    return super.extract(imageBase64);
  }
}
