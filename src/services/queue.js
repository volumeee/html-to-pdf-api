/**
 * Request Queue Service (In-Memory)
 *
 * Simple in-memory job queue for heavy PDF operations.
 * No external dependencies (Redis/BullMQ) required.
 *
 * Features:
 *   - Configurable concurrency
 *   - Job status tracking (pending, processing, completed, failed)
 *   - Job result retrieval via ID
 *   - Auto-cleanup of old completed jobs
 *   - Priority support
 *
 * For production scale, replace with BullMQ + Redis.
 */
const { v4: uuidv4 } = require("uuid");

const MAX_CONCURRENT = parseInt(process.env.QUEUE_CONCURRENCY) || 3;
const MAX_COMPLETED_AGE_MS = 30 * 60 * 1000; // 30 minutes
const MAX_QUEUE_SIZE = 100;

/**
 * @typedef {Object} Job
 * @property {string} id
 * @property {string} status - pending | processing | completed | failed
 * @property {object} data - Job input data
 * @property {object|null} result - Job result (after completion)
 * @property {string|null} error - Error message (if failed)
 * @property {number} created_at
 * @property {number|null} started_at
 * @property {number|null} completed_at
 * @property {number} priority - Higher = runs first (default 0)
 */

const jobs = new Map();
let activeCount = 0;

/**
 * Add a job to the queue
 *
 * @param {string} type - Job type (e.g., "pdf", "batch", "convert")
 * @param {object} data - Job input data
 * @param {Function} handler - Async function to process the job: (data) => Promise<result>
 * @param {object} [options]
 * @param {number} [options.priority=0] - Higher priority runs first
 * @returns {object} Job info { id, status, position }
 */
function enqueue(type, data, handler, options = {}) {
  if (jobs.size >= MAX_QUEUE_SIZE) {
    cleanupOldJobs();
    if (jobs.size >= MAX_QUEUE_SIZE) {
      throw new Error("Queue is full. Please try again later.");
    }
  }

  const job = {
    id: uuidv4(),
    type,
    status: "pending",
    data,
    handler,
    result: null,
    error: null,
    created_at: Date.now(),
    started_at: null,
    completed_at: null,
    priority: options.priority || 0,
  };

  jobs.set(job.id, job);
  processNext();

  const pendingJobs = [...jobs.values()].filter((j) => j.status === "pending");
  return {
    id: job.id,
    status: job.status,
    position: pendingJobs.length,
    queue_size: jobs.size,
  };
}

/**
 * Process the next pending job if concurrency allows
 */
function processNext() {
  if (activeCount >= MAX_CONCURRENT) return;

  // Get highest priority pending job
  const pending = [...jobs.values()]
    .filter((j) => j.status === "pending")
    .sort((a, b) => b.priority - a.priority);

  if (pending.length === 0) return;

  const job = pending[0];
  job.status = "processing";
  job.started_at = Date.now();
  activeCount++;

  // Process async
  job
    .handler(job.data)
    .then((result) => {
      job.status = "completed";
      job.result = result;
      job.completed_at = Date.now();
    })
    .catch((err) => {
      job.status = "failed";
      job.error = err.message;
      job.completed_at = Date.now();
    })
    .finally(() => {
      activeCount--;
      // Remove the handler to free memory
      delete job.handler;
      processNext();
    });
}

/**
 * Get job status by ID
 *
 * @param {string} jobId
 * @returns {object|null} Job info without handler
 */
function getJob(jobId) {
  const job = jobs.get(jobId);
  if (!job) return null;

  const { handler, ...info } = job;
  return {
    ...info,
    duration_ms:
      job.completed_at && job.started_at
        ? job.completed_at - job.started_at
        : job.started_at
          ? Date.now() - job.started_at
          : null,
    waiting_ms: job.started_at
      ? job.started_at - job.created_at
      : Date.now() - job.created_at,
  };
}

/**
 * Get queue stats
 */
function getQueueStats() {
  const all = [...jobs.values()];
  return {
    total: all.length,
    pending: all.filter((j) => j.status === "pending").length,
    processing: all.filter((j) => j.status === "processing").length,
    completed: all.filter((j) => j.status === "completed").length,
    failed: all.filter((j) => j.status === "failed").length,
    max_concurrent: MAX_CONCURRENT,
    max_queue_size: MAX_QUEUE_SIZE,
  };
}

/**
 * Remove old completed/failed jobs
 */
function cleanupOldJobs() {
  const now = Date.now();
  for (const [id, job] of jobs) {
    if (
      (job.status === "completed" || job.status === "failed") &&
      job.completed_at &&
      now - job.completed_at > MAX_COMPLETED_AGE_MS
    ) {
      jobs.delete(id);
    }
  }
}

// Auto-cleanup every 5 minutes
setInterval(cleanupOldJobs, 5 * 60 * 1000);

module.exports = { enqueue, getJob, getQueueStats };
