import { PartialType, OmitType } from '@nestjs/swagger';
import { CreatePublicationDto } from './create-publication.dto';

export class UpdatePublicationDto extends PartialType(
  OmitType(CreatePublicationDto, ['authors'] as const),
) {}
