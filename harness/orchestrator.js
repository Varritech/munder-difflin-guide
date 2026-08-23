/**
 * Munder Difflin Orchestrator
 * 
 * Core orchestration logic for managing multiple agent clones.
 * Handles task queuing, agent lifecycle, and shared memory.
 */

import Redis from 'ioredis';
import { spawnAgent } from './agent-spawn.js';
import { getContext, storeContext } from './memory.js';
import { validateCommand } from './safety.js';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const queue = new Redis(REDIS_URL);

console.log(`🔧 Munder Difflin orchestrator starting...`);
console.log(`📡 Connected to Redis: ${REDIS_URL}`);

/**
 * Process a single task with the specified clone
 */
export async function processTask(task) {
  const { cloneId, description, context, priority = 'normal' } = task;
  
  console.log(`\n📋 Processing task [${cloneId}]: ${description.substring(0, 50)}...`);
  
  try {
    // Load relevant context from shared memory
    const memory = context?.projectId 
      ? await getContext(cloneId, context.projectId, description)
      : '';
    
    // Spawn the agent with its profile
    const agent = await spawnAgent(cloneId, { 
      memory,
      safety: { validateCommand }
    });
    
    // Execute the task
    const startTime = Date.now();
    const result = await agent.execute(description);
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    
    console.log(`✅ Task completed in ${duration}s`);
    
    // Store outcomes for future context
    if (context?.projectId) {
      await storeContext(cloneId, context.projectId, {
        task: description,
        outcome: result,
        duration: duration,
        timestamp: Date.now()
      });
    }
    
    return {
      success: true,
      result,
      duration,
      cloneId
    };
    
  } catch (error) {
    console.error(`❌ Task failed [${cloneId}]:`, error.message);
    
    return {
      success: false,
      error: error.message,
      cloneId
    };
  }
}

/**
 * Worker loop - continuously processes tasks from the queue
 */
async function workerLoop() {
  console.log('🚀 Worker loop started, waiting for tasks...');
  
  while (true) {
    try {
      // Block waiting for tasks (5 second timeout)
      const task = await queue.brpop('tasks', 5);
      
      if (task) {
        const [, taskData] = task;
        const parsedTask = JSON.parse(taskData);
        await processTask(parsedTask);
      }
    } catch (error) {
      console.error('💥 Worker loop error:', error.message);
      // Wait before retrying to avoid tight error loops
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }
}

/**
 * Submit a task to the queue
 */
export async function submitTask(task) {
  const taskJson = JSON.stringify({
    ...task,
    submittedAt: Date.now()
  });
  
  await queue.lpush('tasks', taskJson);
  console.log(`📤 Task queued: ${task.description.substring(0, 50)}...`);
}

// Start the worker if this is the main module
if (process.argv[1]?.includes('orchestrator.js')) {
  workerLoop().catch(console.error);
}

export { workerLoop, submitTask };
