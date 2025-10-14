'use client';

import { RPM_CONFIG, validateRPMConfig } from '../config/rpm';

export default function ConfigTest() {
  const isValid = validateRPMConfig();
  
  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
      <h3 className="font-semibold text-yellow-800 mb-2">Configuration Status</h3>
      <div className="text-sm text-yellow-700 space-y-1">
        <p><strong>Status:</strong> {isValid ? '✅ Valid' : '⚠️ Invalid'}</p>
        <p><strong>Subdomain:</strong> {RPM_CONFIG.subdomain}</p>
        <p><strong>App ID:</strong> {RPM_CONFIG.appId}</p>
        <p><strong>Organization ID:</strong> {RPM_CONFIG.organizationId}</p>
        <p><strong>Avatar Creator URL:</strong> {RPM_CONFIG.avatarCreatorUrl}</p>
      </div>
      
      {!isValid && (
        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded">
          <p className="text-sm text-red-700">
            <strong>Action Required:</strong> Please update your Ready Player Me credentials in the environment variables or configuration file.
          </p>
        </div>
      )}
    </div>
  );
}
