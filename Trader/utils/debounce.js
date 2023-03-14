module.exports = function debounceAsync(func, wait) {
    let timeout;
    let lastArgs;
    let lastResult;
    let promise;
  
    return async function debounced(...args) {
      // Clear the previous timeout
      clearTimeout(timeout);
  
      // Save the current arguments
      lastArgs = args;
  
      // Check if there's a cached result for these arguments
      if (lastResult !== undefined && isArgsEqual(lastArgs, lastArgs)) {
        return lastResult;
      }
  
      // Create a new promise to resolve with the function result
      promise = new Promise(resolve => {
        timeout = setTimeout(async () => {
          // Call the function with the last saved arguments
          const result = await func(...lastArgs);
  
          // Cache the result for future calls
          lastResult = result;
          resolve(result);
        }, wait);
      });
  
      return promise;
    };
  }
  
  // Helper function to compare arrays of arguments
  function isArgsEqual(args1, args2) {
    if (args1.length !== args2.length) {
      return false;
    }
  
    for (let i = 0; i < args1.length; i++) {
      if (args1[i] !== args2[i]) {
        return false;
      }
    }
  
    return true;
  }
  