// Main tRPC router - combines all sub-routers

import { router } from '../trpc';
import { fundRouter } from './fund';
import { userRouter } from './user';
import { statsRouter } from './stats';

export const appRouter = router({
  fund: fundRouter,
  user: userRouter,
  stats: statsRouter,
});

// Export type definition for client
export type AppRouter = typeof appRouter;
