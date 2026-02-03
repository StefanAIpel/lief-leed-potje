// Netlify Function: verify-pin.js
// Server-side PIN verificatie voor admin toegang

exports.handler = async (event, context) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  // Handle preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers };
  }

  // Only allow POST
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { pin } = JSON.parse(event.body || '{}');
    const ADMIN_PIN = process.env.ADMIN_PIN;

    if (!ADMIN_PIN) {
      console.error('ADMIN_PIN environment variable not set');
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'Server configuration error' })
      };
    }

    if (!pin) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'PIN is required', valid: false })
      };
    }

    const isValid = pin === ADMIN_PIN;

    // Log attempt (without exposing PIN)
    console.log(`PIN verification attempt: ${isValid ? 'SUCCESS' : 'FAILED'}`);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        valid: isValid,
        message: isValid ? 'PIN verified' : 'Invalid PIN'
      })
    };

  } catch (error) {
    console.error('Error verifying PIN:', error);
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'Invalid request', valid: false })
    };
  }
};
