// Temporary debug function - DELETE AFTER TESTING
exports.handler = async (event) => {
  const adminPin = process.env.ADMIN_PIN;
  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      hasAdminPin: !!adminPin,
      adminPinLength: adminPin ? adminPin.length : 0,
      adminPinType: typeof adminPin,
      // Show first/last char only for debugging
      adminPinHint: adminPin ? `${adminPin[0]}...${adminPin[adminPin.length-1]}` : 'undefined',
      nodeEnv: process.env.NODE_ENV,
      allEnvKeys: Object.keys(process.env).filter(k => k.includes('ADMIN') || k.includes('PIN') || k.includes('NOTIFY') || k.includes('RESEND'))
    })
  };
};
