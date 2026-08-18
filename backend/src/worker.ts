import { worker } from './queue/worker.js';

console.log('Worker process started, waiting for jobs...');

process.on('SIGTERM', async () => {
  await worker.close();
  process.exit(0);
});
