import { ApiPropertyOptional } from '@nestjs/swagger';
import { Schemas } from 'lideris-commoms-microservice';

export class CreateJudicialAuthorityNoticeDto {
  @ApiPropertyOptional({
    type: String,
    example: '6931b22e9078fac94c48c84c',
    description: 'ID del caso SOAT (`PatientSoatCase`), mismo paciente e IPS. Opcional.',
  })
  soatCaseId?: string;

  @ApiPropertyOptional({ type: Date })
  patientAdmissionDate?: Date;

  @ApiPropertyOptional({ type: String, example: '08:30' })
  patientAdmissionTime?: string;

  @ApiPropertyOptional({ type: Boolean })
  victimReferredFromAnotherIps?: boolean;

  @ApiPropertyOptional({
    type: Schemas.JudicialReferringIps,
    description:
      'Obligatorio (con name, address, phone y email) si `victimReferredFromAnotherIps` es true.',
  })
  referringIps?: Schemas.JudicialReferringIps;

  @ApiPropertyOptional({ type: String })
  careDetails?: string;

  @ApiPropertyOptional({ type: String })
  injuriesOrConditionDescription?: string;

  @ApiPropertyOptional({ type: String })
  treatmentsPerformed?: string;

  @ApiPropertyOptional({ type: String })
  policeContactEmail?: string;

  @ApiPropertyOptional({ type: String })
  prosecutorContactEmail?: string;

  @ApiPropertyOptional({ type: String })
  noticeResponsibleName?: string;

  @ApiPropertyOptional({ type: String })
  noticeResponsiblePosition?: string;

  @ApiPropertyOptional({ type: String })
  ipsSignatureAndSeal?: string;
}

export class UpdateJudicialAuthorityNoticeDto extends CreateJudicialAuthorityNoticeDto {}
