const fetch = require("node-fetch");

// --- Retry Configuration ---
// OPTIMIZATION: Increased retries for more resilience.
const MAX_RETRIES = 6; // 1 initial attempt + 6 retries = 7 total attempts
const INITIAL_BACKOFF_MS = 100;

// --- Helper function for async sleep ---
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

exports.handler = async (event) => {
  // OPTIMIZATION: Start timing the entire function execution.
  const lambdaStartTime = Date.now();

  const basePath = event.path.replace(/^\/api/, "");
  const queryString = event.rawQueryString ? `?${event.rawQueryString}` : "";
  const fullPath = `${basePath}${queryString}`;
  const backendURL = `https://wellwash-erp-rtsgo.sevalla.app${fullPath}`;
  const requestMethod = event.httpMethod.toUpperCase();

  console.log(`[PROXY_REQUEST] ${requestMethod} ${event.path} -> ${backendURL}`);

  const forwardedHeaders = {};
  for (const [key, value] of Object.entries(event.headers)) {
      const lowerKey = key.toLowerCase();
      if (['accept', 'accept-language', 'content-type', 'authorization'].includes(lowerKey)) {
          forwardedHeaders[key] = value;
      }
  }
  forwardedHeaders['User-Agent'] = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36';
  forwardedHeaders['host'] = "https://wellwash-erp-rtsgo.sevalla.app";
  forwardedHeaders['X-Forwarded-For'] = event.requestContext?.http?.sourceIp || 'unknown';
  forwardedHeaders['X-Forwarded-Proto'] = 'https';
  
  const body = (requestMethod === 'GET' || requestMethod === 'HEAD') ? undefined : event.body;

  // --- Retry Loop ---
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    // OPTIMIZATION: Start timing this specific attempt.
    const attemptStartTime = Date.now();
    try {
      if (attempt > 0) {
        const backoffTime = INITIAL_BACKOFF_MS * Math.pow(2, attempt - 1);
        const jitter = backoffTime * 0.2 * Math.random();
        const waitTime = backoffTime + jitter;
        
        console.log(`[PROXY_RETRY] Attempt ${attempt} failed. Retrying in ${Math.round(waitTime)}ms...`);
        await sleep(waitTime);
      }
      
      console.log(`[PROXY_SENDING] Attempt ${attempt + 1}/${MAX_RETRIES + 1} to ${backendURL}`);
      
      const response = await fetch(backendURL, {
        method: requestMethod,
        headers: forwardedHeaders,
        body: body,
        redirect: 'manual' 
      });
      
      // OPTIMIZATION: Calculate how long this attempt took.
      const attemptDuration = Date.now() - attemptStartTime;

      if (response.status < 500 || ![502, 503, 504].includes(response.status)) {
        const responseBody = await response.text();
        const responseContentType = response.headers.get("Content-Type") || "application/json";
        const totalDuration = Date.now() - lambdaStartTime;
        
        // OPTIMIZATION: Add timing to the success log.
        console.log(`[PROXY_SUCCESS] ${requestMethod} ${fullPath} -> ${response.status} ${response.statusText}. Attempt took ${attemptDuration}ms.`);
        console.log(`[PROXY_COMPLETE] Request finished in ${totalDuration}ms.`);

        return {
          statusCode: response.status,
          body: responseBody,
          headers: {
            "Content-Type": responseContentType,
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With",
          },
        };
      }
      
      throw new Error(`Received retryable status code: ${response.status}`);

    } catch (error) {
      // OPTIMIZATION: Add timing to the failure log for this attempt.
      const attemptDuration = Date.now() - attemptStartTime;
      console.error(`[PROXY_ATTEMPT_FAILED] Attempt ${attempt + 1} failed after ${attemptDuration}ms with error: ${error.message}`);
      
      if (attempt === MAX_RETRIES) {
        const totalDuration = Date.now() - lambdaStartTime;
        console.error(`[PROXY_FATAL] All ${MAX_RETRIES + 1} attempts failed. Giving up. Total time: ${totalDuration}ms.`);
        return {
          statusCode: 502,
          body: JSON.stringify({ error: "Proxy Error", message: "Could not connect to the backend service after multiple retries." }),
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        };
      }
    }
  }
};