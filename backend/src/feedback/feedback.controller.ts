import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { CreateFeedbackDto } from './dto/create-feedback.dto';
import { FeedbackService } from './feedback.service';
import { FeedbackEntity } from './entities/feedback.entity';

@Controller('feedback')
export class FeedbackController {
  constructor(private readonly feedback: FeedbackService) {}

  /**
   * POST /api/feedback
   * Submit feedback linked to a player profile.
   * Body: { username, message, rating?, category? }
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateFeedbackDto): Promise<FeedbackEntity> {
    return this.feedback.create(dto);
  }

  /**
   * GET /api/feedback
   * List all feedback, newest first.
   * Optional query param: ?username=<username> to filter by player.
   */
  @Get()
  findAll(@Query('username') username?: string): Promise<FeedbackEntity[]> {
    return this.feedback.findAll(username);
  }

  /**
   * GET /api/feedback/:id
   * Fetch a single feedback entry by its UUID.
   */
  @Get(':id')
  findOne(@Param('id') id: string): Promise<FeedbackEntity> {
    return this.feedback.findOne(id);
  }
}
