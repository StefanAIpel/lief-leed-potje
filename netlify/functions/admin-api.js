// Netlify Function: admin-api.js
// Secure admin API endpoints met PIN verificatie

exports.handler = async (event, context) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, X-Admin-PIN',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Content-Type': 'application/json'
  };

  // Handle preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers };
  }

  // Get PIN from header
  const providedPin = event.headers['x-admin-pin'] || event.headers['X-Admin-PIN'];
  const ADMIN_PIN = process.env.ADMIN_PIN;

  if (!ADMIN_PIN) {
    console.error('ADMIN_PIN environment variable not set');
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Server configuration error' })
    };
  }

  // Honeypot check (voor POST requests met body)
  if (event.body) {
    try {
      const bodyData = JSON.parse(event.body);
      if (bodyData.website || bodyData.company) {
        console.log('🍯 Honeypot triggered — spam rejected');
        return { statusCode: 401, headers, body: JSON.stringify({ error: 'Unauthorized' }) };
      }
    } catch (e) { /* body is niet JSON, skip */ }
  }

  // Verify PIN
  if (!providedPin || providedPin !== ADMIN_PIN) {
    console.log('Admin API: Unauthorized access attempt');
    return {
      statusCode: 401,
      headers,
      body: JSON.stringify({ error: 'Unauthorized - Invalid PIN' })
    };
  }

  // Parse the action from query string or body
  const params = event.queryStringParameters || {};
  const action = params.action;

  try {
    switch (action) {
      case 'verify':
        // Just verify PIN is valid (for session check)
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ 
            success: true, 
            message: 'PIN verified',
            authenticated: true
          })
        };

      case 'status':
        // Return admin status
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            success: true,
            authenticated: true,
            timestamp: new Date().toISOString()
          })
        };

      default:
        // Default: return authenticated status
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            success: true,
            message: 'Admin API ready',
            authenticated: true,
            action: action || 'none'
          })
        };
    }

  } catch (error) {
    console.error('Admin API error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};
