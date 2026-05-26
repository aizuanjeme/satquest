import {
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { FeedbackCategory } from '../entities/feedback.entity';

const CATEGORIES: FeedbackCategory[] = ['general', 'bug', 'suggestion', 'other'];

export class CreateFeedbackDto {
  @IsString()
  @IsNotEmpty()
  username!: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(2000)
  message!: string;

  /** Optional 1–5 star rating. */
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  rating?: number;

  /** Optional category label. */
  @IsOptional()
  @IsIn(CATEGORIES)
  category?: FeedbackCategory;
}
