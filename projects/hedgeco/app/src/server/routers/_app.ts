// Main tRPC router - combines all sub-routers

import { router } from '../trpc';
import { fundRouter } from './fund';
import { userRouter } from './user';
import { statsRouter } from './stats';
import { providerRouter } from './provider';
import { messageRouter } from './message';
import { conferenceRouter } from './conference';
import { returnRouter } from './return';
import { searchRouter } from './search';
import { aiRouter } from './ai';
import { adminRouter } from './admin';
import { pdfRouter } from './pdf';
import { emailRouter } from './email';
import { paymentRouter } from './payment';
import { analyticsRouter } from './analytics';

export const appRouter = router({
  fund: fundRouter,
  user: userRouter,
  stats: statsRouter,
  provider: providerRouter,
  message: messageRouter,
  conference: conferenceRouter,
  return: returnRouter,
  search: searchRouter,
  ai: aiRouter,
  admin: adminRouter,
  pdf: pdfRouter,
  email: emailRouter,
  payment: paymentRouter,
  analytics: analyticsRouter,
});

// Export type definition for client
export type AppRouter = typeof appRouter;
