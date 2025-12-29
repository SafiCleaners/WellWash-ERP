const fetch = require('node-fetch');

exports.handler = async (event, context) => {
  const targetDomain = 'wellwash-erp-rtsgo.sevalla.app';
  const path = event.path.replace('/.netlify/functions/proxy', '');
  const targetUrl = `https://${targetDomain}${path}`;
  
  try {
    const headers = { ...event.headers };
    delete headers.host; // Remove original host to avoid conflicts

    const response = await fetch(targetUrl, {
      method: event.httpMethod,
      headers: {
        ...headers,
        host: targetDomain,
      },
      body: ['GET', 'HEAD'].includes(event.httpMethod) ? undefined : event.body,
    });

    const data = await response.text();
    
    return {
      statusCode: response.status,
      body: data,
      headers: {
        'Content-Type': response.headers.get('Content-Type') || 'text/plain',
      },
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Proxy failed', details: error.message }),
    };
  }
};