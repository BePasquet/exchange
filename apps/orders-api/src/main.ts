import { isMainThread } from 'worker_threads';

async function init() {
  try {
    if (isMainThread) {
      const { main } = await import('./app/app');
      main();
    } else {
      await import('./app/engine-worker/engine.worker');
    }
  } catch (e) {
    // todo add monitoring
    console.log(e);
  }
}

init();
