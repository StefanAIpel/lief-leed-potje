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
    const body = JSON.parse(event.body);
    const { pin } = body;

    // Honeypot check
    if (body.website || body.company) {
      console.log('🍯 Honeypot triggered — spam rejected');
      return { statusCode: 401, headers, body: JSON.stringify({ success: false, error: 'Unauthorized' }) };
    }

    const correctPin = process.env.ADMIN_PIN;
    
    console.log('PIN check:', { pinLength: pin?.length, envExists: !!correctPin, envLength: correctPin?.length, envType: typeof correctPin });

    // Compare as strings, trim whitespace
    const pinMatch = correctPin && pin?.trim() === correctPin.trim();
    
    if (pinMatch) {
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
