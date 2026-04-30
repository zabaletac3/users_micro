import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Schemas } from 'lideris-commoms-microservice';

export class JudicialAuthorityNoticeResponseDto {
  @ApiProperty({ example: '6931b22e9078fac94c48c84c' })
  _id: string;

  @ApiProperty({ example: '6931b22e9078fac94c48c84c' })
  companyId: string;

  @ApiProperty({ example: '6931b22e9078fac94c48c84c' })
  patientId: string;

  @ApiPropertyOptional({ example: '6931b22e9078fac94c48c84c' })
  soatCaseId?: string;

  @ApiPropertyOptional({ type: Date })
  patientAdmissionDate?: Date;

  @ApiPropertyOptional({ type: String })
  patientAdmissionTime?: string;

  @ApiPropertyOptional({ type: Boolean })
  victimReferredFromAnotherIps?: boolean;

  @ApiPropertyOptional({ type: Schemas.JudicialReferringIps })
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

  @ApiProperty({ example: '2025-04-21T12:00:00.000Z' })
  createdAt: string;

  @ApiProperty({ example: '2025-04-21T12:00:00.000Z' })
  updatedAt: string;
}

export class JudicialAuthorityNoticeListResponseDto {
  @ApiProperty({ type: [JudicialAuthorityNoticeResponseDto] })
  items: JudicialAuthorityNoticeResponseDto[];
}
