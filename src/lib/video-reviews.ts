import {z} from 'zod';
import rawReviews from '../../content/video-reviews.json';

const captionSchema=z.object({
  language:z.string().min(2),
  kind:z.enum(['manual','automatic'])
});

const videoReviewSchema=z.object({
  videoId:z.string().regex(/^[A-Za-z0-9_-]{11}$/),
  reviewed:z.iso.date(),
  caption:captionSchema.nullable(),
  sampledAt:z.array(z.number().nonnegative()).min(3),
  observations:z.array(z.string().trim().min(1)).min(1),
  conflicts:z.array(z.string().trim().min(1))
});

export const videoReviews=z.object({
  schemaVersion:z.literal(1),
  reviews:z.record(z.string(),videoReviewSchema)
}).parse(rawReviews).reviews;

export type VideoReview=z.infer<typeof videoReviewSchema>;
