import { worker } from './queue/worker.js';
import { runReconciliationSweep } from './services/reconciliation.js';

(async () => {
  await runReconciliationSweep(); // catches anything orphaned by a hard crash
  console.log('Worker process started, waiting for jobs...');
})();

process.on('SIGTERM', async () => {
  console.log('Shutting down worker gracefully...');
  await worker.close(); // finishes in-flight jobs before exiting
  process.exit(0);
});
