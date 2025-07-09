/**
 * Security validators for brain-manager
 * Prevents accidental storage of sensitive data
 */

// Common patterns for API keys and secrets
const SENSITIVE_PATTERNS = [
  // API Key patterns
  /\b(api[_-]?key|apikey)\s*[:=]\s*["']?[\w-]{20,}/i,
  /\b(secret[_-]?key|secretkey)\s*[:=]\s*["']?[\w-]{20,}/i,
  /\b(access[_-]?key|accesskey)\s*[:=]\s*["']?[\w-]{20,}/i,
  /\b(private[_-]?key|privatekey)\s*[:=]\s*["']?[\w-]{20,}/i,
  
  // Common API key prefixes
  /\bsk[-_][\w]{20,}/,  // Stripe secret key
  /\bpk[-_][\w]{20,}/,  // Public/private key
  /\bapi[-_][\w]{20,}/,  // Generic API key
  /\bkey[-_][\w]{20,}/,  // Generic key
  /\btoken[-_][\w]{20,}/, // Generic token
  
  // OAuth and JWT patterns
  /\bBearer\s+[\w-]+\.[\w-]+\.[\w-]+/,  // JWT token
  /\b(oauth[_-]?token|oauthtoken)\s*[:=]\s*["']?[\w-]{20,}/i,
  
  // Database connection strings
  /mongodb(\+srv)?:\/\/[^:]+:[^@]+@/,
  /postgres(ql)?:\/\/[^:]+:[^@]+@/,
  /mysql:\/\/[^:]+:[^@]+@/,
  
  // AWS patterns
  /\bAKIA[0-9A-Z]{16}\b/,  // AWS Access Key ID
  /\b[0-9a-zA-Z/+=]{40}\b/, // AWS Secret Access Key (less reliable)
  
  // Other cloud providers
  /\bAIza[0-9A-Za-z-_]{35}\b/, // Google API Key
  /\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/i, // UUID (potential secret)
];

// Field names that often contain secrets
const SENSITIVE_FIELD_NAMES = [
  'password', 'passwd', 'pwd',
  'secret', 'api_key', 'apikey', 'api-key',
  'access_key', 'accesskey', 'access-key',
  'private_key', 'privatekey', 'private-key',
  'auth_token', 'authtoken', 'auth-token',
  'oauth_token', 'oauthtoken', 'oauth-token',
  'bearer_token', 'bearertoken', 'bearer-token',
  'client_secret', 'clientsecret', 'client-secret',
  'encryption_key', 'encryptionkey', 'encryption-key',
  'signing_key', 'signingkey', 'signing-key',
  'ssh_key', 'sshkey', 'ssh-key',
  'certificate', 'cert',
  'credentials', 'creds'
];

export interface ValidationResult {
  isValid: boolean;
  warnings: string[];
  errors: string[];
}

/**
 * Validates if a value contains sensitive data that shouldn't be stored
 */
export function validateForSensitiveData(value: any, key?: string): ValidationResult {
  const result: ValidationResult = {
    isValid: true,
    warnings: [],
    errors: []
  };

  // Check the key name first
  if (key) {
    const keyLower = key.toLowerCase();
    for (const sensitiveField of SENSITIVE_FIELD_NAMES) {
      if (keyLower.includes(sensitiveField)) {
        result.errors.push(`Field name '${key}' suggests sensitive data (contains '${sensitiveField}')`);
        result.isValid = false;
      }
    }
  }

  // Convert value to string for pattern matching
  let valueStr: string;
  if (typeof value === 'string') {
    valueStr = value;
  } else if (typeof value === 'object' && value !== null) {
    valueStr = JSON.stringify(value);
  } else {
    valueStr = String(value);
  }

  // Check for sensitive patterns
  for (const pattern of SENSITIVE_PATTERNS) {
    if (pattern.test(valueStr)) {
      result.errors.push(`Value contains pattern matching sensitive data: ${pattern.source}`);
      result.isValid = false;
    }
  }

  // Additional checks for object values
  if (typeof value === 'object' && value !== null) {
    for (const [k, v] of Object.entries(value)) {
      const subResult = validateForSensitiveData(v, k);
      if (!subResult.isValid) {
        result.errors.push(...subResult.errors.map(e => `In field '${k}': ${e}`));
        result.isValid = false;
      }
      result.warnings.push(...subResult.warnings.map(w => `In field '${k}': ${w}`));
    }
  }

  // Add warnings for potentially sensitive data
  if (valueStr.length > 20 && /^[a-zA-Z0-9_-]+$/.test(valueStr)) {
    if (!result.errors.length) {
      result.warnings.push('Long alphanumeric string detected - ensure this is not a secret key');
    }
  }

  return result;
}

/**
 * Sanitizes an object by removing detected sensitive fields
 */
export function sanitizeSensitiveData(obj: any): { sanitized: any; removed: string[] } {
  const removed: string[] = [];
  
  function sanitize(value: any, path: string = ''): any {
    if (typeof value === 'string') {
      const validation = validateForSensitiveData(value);
      if (!validation.isValid) {
        removed.push(path);
        return '[REDACTED]';
      }
      return value;
    }
    
    if (Array.isArray(value)) {
      return value.map((item, index) => sanitize(item, `${path}[${index}]`));
    }
    
    if (typeof value === 'object' && value !== null) {
      const sanitized: any = {};
      for (const [key, val] of Object.entries(value)) {
        const keyPath = path ? `${path}.${key}` : key;
        const keyValidation = validateForSensitiveData(val, key);
        
        if (!keyValidation.isValid) {
          removed.push(keyPath);
          sanitized[key] = '[REDACTED]';
        } else {
          sanitized[key] = sanitize(val, keyPath);
        }
      }
      return sanitized;
    }
    
    return value;
  }
  
  return {
    sanitized: sanitize(obj),
    removed
  };
}

/**
 * Creates a Monitex-compatible password prompt configuration
 */
export function createPasswordPromptConfig(purpose: string = 'decrypt state database') {
  return {
    prompt: `Enter password to ${purpose}:`,
    type: 'password',
    required: true,
    minLength: 8,
    // Monitex will handle the actual prompting
    monitexIntegration: true
  };
}
