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
  async findAll(username?: string): Promise<(FeedbackEntity & { avatarId?: string })[]> {
    const qb = this.repo
      .createQueryBuilder('f')
      .leftJoin('f.profile', 'p')
      .addSelect('p.avatarId', 'f_avatarId')
      .orderBy('f.createdAt', 'DESC');

    if (username) {
      const key = username.toLowerCase();
      qb.where('LOWER(f.username) = :key', { key });
    }

    const raw = await qb.getRawAndEntities();
    return raw.entities.map((entity, i) => ({
      ...entity,
      avatarId: raw.raw[i]?.f_avatarId ?? undefined,
    }));
  }

  /** Fetch a single feedback entry by id, including the author's avatarId. */
  async findOne(id: string): Promise<FeedbackEntity & { avatarId?: string }> {
    const raw = await this.repo
      .createQueryBuilder('f')
      .leftJoin('f.profile', 'p')
      .addSelect('p.avatarId', 'f_avatarId')
      .where('f.id = :id', { id })
      .getRawAndEntities();

    if (!raw.entities[0]) throw new NotFoundException(`feedback "${id}" not found`);
    return { ...raw.entities[0], avatarId: raw.raw[0]?.f_avatarId ?? undefined };
  }
}
