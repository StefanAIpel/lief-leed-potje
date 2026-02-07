// Netlify Function: Server-side PIN verificatie
// PIN wordt opgeslagen als environment variable ADMIN_PIN

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
    return { statusCode: 204, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { pin } = JSON.parse(event.body);
    const correctPin = process.env.ADMIN_PIN;

    if (pin === correctPin) {
      // Generate a simple session token (valid for 24 hours)
      const token = Buffer.from(`${Date.now()}:${correctPin}`).toString('base64');
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ 
          valid: true,
          success: true, 
          token,
          expiresIn: 86400 // 24 hours
        })
      };
    } else {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ success: false, error: 'Onjuiste PIN' })
      };
    }
  } catch (error) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'Invalid request' })
    };
  }
};
