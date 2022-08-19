import { Request } from 'express';
import { Worker } from 'worker_threads';

export interface RequestWithContext extends Request {
  engineWorker?: Worker;
}
