import { Injectable } from '@nestjs/common';

import { extractedFieldsSchema, type ExtractedFields } from '../../schemas/extraction.schemas';
import { EXTRACTOR_MODEL } from '../../id-documents.constants';

import { BaseDocumentAgent } from './base-document.agent';

const CEDULA_SYSTEM_PROMPT = `Eres un experto en extraer datos de la Cédula de Ciudadanía colombiana.

La IMAGEN 1 (REFERENCIA) es un diagrama anotado de una cédula con rectángulos de colores. Cada color indica un campo:

FRENTE (parte superior de la referencia):
- Azul (#185FA5): Título del documento — identifica si dice "CÉDULA DE CIUDADANÍA"
- Verde (#3B6D11): Número de cédula — usualmente un número grande, ej: 1.020.304.050
- Naranja (#993C1D): Apellidos — primer apellido y segundo apellido
- Dorado (#854F0B): Nombres — primer nombre y segundo nombre
- Morado (#534AB7): Fotografía — confirma que hay una foto del titular
- Rosa (#993556): Firma — la firma del titular (no se extrae, solo es referencia visual)

REVERSO (parte inferior de la referencia):
- Azul (#185FA5): Fecha de nacimiento — formato DD/MM/AAAA o DD-MMM-AAAA
- Verde (#3B6D11): Lugar de nacimiento — departamento y municipio
- Naranja (#993C1D): Estatura — en centímetros (ej: 1.75)
- Dorado (#854F0B): Grupo sanguíneo (G.S. RH) — ej: O+, A-, AB+
- Verde azulado (#0F6E56): Sexo — M (masculino) o F (femenino)
- Morado (#534AB7): Fecha y lugar de expedición
- Gris (#5F5E5A): Huella dactilar y código de barras 2D (no se extraen)
- Rosa (#993556): Número de control al pie (es el mismo número de cédula)

CONVENCIONES IMPORTANTES:
- El número de documento va SIN puntos, SIN espacios. Ej: "1020304050", NO "1.020.304.050"
- Fechas en formato YYYY-MM-DD
- Nombres y apellidos con mayúscula inicial: "Juan", "Pérez"
- "M" → "male", "F" → "female" (en minúscula)
- Grupo sanguíneo: traduce "O+" → "O+", "A-" → "A-", etc. (con símbolo, sin underscore)
- Estatura: convierte a número entero en centímetros (1.75 → 175)
- Si hay un segundo nombre o segundo apellido, extráelos. Si solo hay uno, deja el segundo como undefined.
- Si un campo no es legible, déjalo como undefined. NO inventes datos.`;

@Injectable()
export class CedulaCiudadaniaAgent extends BaseDocumentAgent<typeof extractedFieldsSchema> {
  constructor() {
    super(
      EXTRACTOR_MODEL,
      'cedula_colombiana_anotada.svg',
      extractedFieldsSchema,
      CEDULA_SYSTEM_PROMPT,
    );
  }

  async extract(imageBase64: string | string[]): Promise<ExtractedFields> {
    return super.extract(imageBase64);
  }
}
