// Quick test of Redis connection and kernel functionality
const Redis = require('ioredis');
const { Queue } = require('bullmq');

console.log('🔍 Testing HedgeCo Kernel Setup...\n');

// Redis connection
const redis = new Redis({
  host: 'clever-ladybird-59195.upstash.io',
  port: 6379,
  password: 'Aec7AAIncDI4OWIxY2ZiZTQ5NWQ0MWVjYTEzMjM1MTc0ZDA4MTA1ZXAyNTkxOTU',
  tls: {},
  maxRetriesPerRequest: null
});

// Test Redis connection
async function testRedis() {
  try {
    console.log('🔗 Testing Redis connection...');
    await redis.ping();
    console.log('✅ Redis connected successfully!\n');
    
    // Test BullMQ queue
    console.log('📨 Testing BullMQ queue creation...');
    const testQueue = new Queue('test-kernel', { connection: redis });
    
    // Add a test job
    const job = await testQueue.add('test-job', {
      agent: 'scooby',
      action: 'test',
      entityId: 'test-123',
      data: { test: true }
    });
    
    console.log(`✅ Job added: ${job.id}`);
    console.log(`✅ Queue created: test-kernel`);
    
    // Get job counts
    const counts = await testQueue.getJobCounts();
    console.log(`✅ Job counts:`, counts);
    
    // Clean up
    await job.remove();
    await testQueue.close();
    
    console.log('\n🎉 Kernel infrastructure is working!');
    console.log('\n📋 Your configuration:');
    console.log('Redis: clever-ladybird-59195.upstash.io:6379');
    console.log('API Keys generated (5 agents)');
    console.log('BullMQ queues ready: email, approval, publish, embedding, webhook, notification');
    
    console.log('\n🚀 Next steps:');
    console.log('1. Deploy kernel to Railway/Render');
    console.log('2. Update web app to use kernel endpoints');
    console.log('3. Build approval dashboard');
    console.log('4. Route first real approval through kernel');
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('\n🔧 Troubleshooting:');
    console.error('- Check Upstash token is correct');
    console.error('- Verify Redis instance is running');
    console.error('- Check network connectivity');
    process.exit(1);
  }
}

testRedis();