import { Worker } from 'bullmq';
import IORedis from 'ioredis';
import { Resend } from 'resend';
import { EmailJobSchema } from '@hedgeco/shared';

export function createEmailWorker(connection: IORedis, concurrency: number): Worker {
  const resend = new Resend(process.env.RESEND_API_KEY);
  
  return new Worker('email', async (job) => {
    console.log(`Processing email job: ${job.id}`);
    
    // Validate job data
    const emailJob = EmailJobSchema.parse(job.data);
    
    // TODO: Fetch email template based on templateKey and templateVersion
    // TODO: Render template with user data
    // TODO: Send via Resend with proper headers
    
    // Mock implementation
    const result = await resend.emails.send({
      from: `HedgeCo.Net <noreply@${emailJob.metadata.sendingDomain}>`,
      to: [emailJob.entityId], // In reality, this would be user email
      subject: `Welcome to HedgeCo.Net`,
      html: `<h1>Welcome!</h1><p>This is a test email.</p>`,
      headers: {
        'List-Unsubscribe': emailJob.metadata.unsubscribeLink 
          ? `<https://hedgeco.net/unsubscribe>`
          : undefined,
      },
    });
    
    // Throttle if specified
    if (emailJob.metadata.throttleMs > 0) {
      await new Promise(resolve => setTimeout(resolve, emailJob.metadata.throttleMs));
    }
    
    return {
      success: true,
      messageId: result.data?.id,
      template: emailJob.metadata.templateKey,
      audienceSize: Object.keys(emailJob.metadata.audienceDefinition).length,
    };
    
  }, { 
    connection,
    concurrency,
    removeOnComplete: 100,
    removeOnFail: 1000,
  });
}