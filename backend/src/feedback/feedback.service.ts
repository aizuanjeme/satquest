import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProfileService } from '../profile/profile.service';
import { CreateFeedbackDto } from './dto/create-feedback.dto';
import { FeedbackEntity } from './entities/feedback.entity';

@Injectable()
export class FeedbackService {
  constructor(
    @InjectRepository(FeedbackEntity)
    private readonly repo: Repository<FeedbackEntity>,
    private readonly profiles: ProfileService,
  ) {}

  /** Submit a new feedback entry for a player. Validates the profile exists first. */
  async create(dto: CreateFeedbackDto): Promise<FeedbackEntity> {
    // Ensure the profile exists — throws 404 if not.
    await this.profiles.findOne(dto.username);

    const entry = this.repo.create({
      username: dto.username,
      message: dto.message,
      rating: dto.rating,
      category: dto.category,
    });
    return this.repo.save(entry);
  }

  /** List all feedback, newest first. Optionally filtered by username. */
  async findAll(username?: string): Promise<FeedbackEntity[]> {
    const qb = this.repo
      .createQueryBuilder('f')
      .orderBy('f.createdAt', 'DESC');

    if (username) {
      const key = username.toLowerCase();
      // Match against the lowercased username for case-insensitive filtering.
      qb.where('LOWER(f.username) = :key', { key });
    }

    return qb.getMany();
  }

  /** Fetch a single feedback entry by id. */
  async findOne(id: string): Promise<FeedbackEntity> {
    const entry = await this.repo.findOne({ where: { id } });
    if (!entry) throw new NotFoundException(`feedback "${id}" not found`);
    return entry;
  }
}
