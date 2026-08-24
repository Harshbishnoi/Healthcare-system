/**
 * JavaScript Event Loop Utilities & Demonstrations
 *
 * Implements non-blocking execution using the browser's Macrotask Queue,
 * Microtask Queue (queueMicrotask/Promises), and Animation Frame Callbacks (requestAnimationFrame).
 */

/**
 * Executes a task in the Microtask Queue (higher priority than macrotasks like setTimeout)
 * @param {Function} callback
 */
export const runInMicrotask = (callback) => {
  if (typeof queueMicrotask === 'function') {
    queueMicrotask(callback);
  } else {
    Promise.resolve().then(callback);
  }
};

/**
 * Defers execution to the Macrotask Queue (timer queue)
 * @param {Function} callback
 * @param {number} delayMs
 */
export const runInMacrotask = (callback, delayMs = 0) => {
  return setTimeout(callback, delayMs);
};

/**
 * Schedules execution right before the next browser repaint
 * @param {Function} callback
 */
export const runBeforeRepaint = (callback) => {
  if (typeof window !== 'undefined' && window.requestAnimationFrame) {
    return window.requestAnimationFrame(callback);
  }
  return setTimeout(callback, 16);
};

/**
 * Splits heavy CPU computations into non-blocking chunked iterations over the event loop
 * @param {Array} items
 * @param {Function} processFn
 * @param {number} chunkSize
 * @returns {Promise<void>}
 */
export const processNonBlocking = (items, processFn, chunkSize = 50) => {
  return new Promise((resolve) => {
    let index = 0;

    function processChunk() {
      const start = Date.now();
      while (index < items.length && Date.now() - start < 12) {
        processFn(items[index], index);
        index++;
      }

      if (index < items.length) {
        // Yield to the event loop to prevent UI stutter
        setTimeout(processChunk, 0);
      } else {
        resolve();
      }
    }

    processChunk();
  });
};
