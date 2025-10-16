// Ready Player Me Configuration
// Replace these with your actual credentials from https://studio.readyplayer.me/

export const RPM_CONFIG = {
  // Your subdomain from Ready Player Me Studio
  subdomain: process.env.NEXT_PUBLIC_RPM_SUBDOMAIN ,
  
  // Your App ID from Ready Player Me Studio
  appId: process.env.NEXT_PUBLIC_RPM_APP_ID ,
  
  // Your Organization ID from Ready Player Me Studio
  organizationId: process.env.NEXT_PUBLIC_RPM_ORGANIZATION_ID ,
  
  // API Key for server-side operations (optional)
  apiKey: process.env.RPM_API_KEY ,
  
  // Avatar Creator URL
  get avatarCreatorUrl() {
    return `https://${this.subdomain}/avatar?frameApi&ui=minimal&uiHints=0&appId=${this.appId}`;
  },
  
  // Avatar API base URL
  get apiBaseUrl() {
    return `https://${this.subdomain}.readyplayer.me/api`;
  }
};

// Helper function to validate configuration
export const validateRPMConfig = () => {
  // For demo purposes, we'll allow demo values
  const required = ['subdomain', 'appId', 'organizationId'];
  const missing = required.filter(key => 
    RPM_CONFIG[key] === 'your-' + key.replace(/([A-Z])/g, '-$1').toLowerCase()
  );
  
  if (missing.length > 0) {
    console.warn(`Missing Ready Player Me configuration: ${missing.join(', ')}`);
    // For demo, we'll still return true to allow testing
    return true;
  }
  
  return true;
};
