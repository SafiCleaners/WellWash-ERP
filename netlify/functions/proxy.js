const fetch = require('node-fetch');

exports.handler = async (event, context) => {
  const targetUrl = `http://68.183.27.113:8002${event.path.replace('/.netlify/functions/proxy', '')}`;
  
  try {
    const response = await fetch(targetUrl, {
      method: event.httpMethod,
      headers: {
        ...event.headers,
        host: '68.183.27.113', // Override Host header if needed
      },
      body: event.httpMethod === 'GET' ? undefined : event.body,
    });

    const data = await response.text();
    
    return {
      statusCode: response.status,
      body: data,
      headers: {
        'Content-Type': response.headers.get('Content-Type'),
      },
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Proxy failed' }),
    };
  }
};