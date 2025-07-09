/**
 * Secure Configuration Manager
 * Handles encrypted storage and retrieval of sensitive configuration
 */

import crypto from 'crypto';
import { BrainToolInstruction, BrainToolInstructions } from '../brain-instructions.js';

export interface SecureSession {
  token: string;
  expiresAt: Date;
  permissionLevel: 'read' | 'write' | 'admin';
}

export class SecureConfigManager {
  private sessions: Map<string, SecureSession> = new Map();
  private readonly SALT = 'brain-config-salt-v1';
  private readonly ITERATIONS = 100000;
  private readonly KEY_LENGTH = 32;
  private readonly ALGORITHM = 'aes-256-gcm';
  
  /**
   * Start a secure session with password
   * In production, this would use your system login password
   */
  async startSecureSession(password: string): Promise<{
    success: boolean;
    token?: string;
    expiresAt?: Date;
    message: string;
  }> {
    try {
      // Derive key from password
      const key = await this.deriveKey(password);
      
      // Generate session token
      const token = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 4 * 60 * 60 * 1000); // 4 hours
      
      // Store session
      this.sessions.set(token, {
        token,
        expiresAt,
        permissionLevel: 'admin'
      });
      
      // Clean expired sessions
      this.cleanExpiredSessions();
      
      return {
        success: true,
        token,
        expiresAt,
        message: 'Secure session started. Token expires in 4 hours.'
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to start secure session. Invalid password?'
      };
    }
  }
  
  /**
   * Encrypt sensitive data
   */
  async encryptData(data: string, password: string): Promise<{
    encrypted: string;
    iv: string;
    tag: string;
  }> {
    const key = await this.deriveKey(password);
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(this.ALGORITHM, key, iv);
    
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const tag = (cipher as any).getAuthTag();
    
    return {
      encrypted,
      iv: iv.toString('hex'),
      tag: tag.toString('hex')
    };
  }
  
  /**
   * Decrypt sensitive data
   */
  async decryptData(
    encryptedData: string,
    iv: string,
    tag: string,
    password: string
  ): Promise<string> {
    const key = await this.deriveKey(password);
    const decipher = crypto.createDecipheriv(
      this.ALGORITHM,
      key,
      Buffer.from(iv, 'hex')
    );
    
    (decipher as any).setAuthTag(Buffer.from(tag, 'hex'));
    
    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }
  
  /**
   * Check if session is valid
   */
  isSessionValid(token: string): boolean {
    const session = this.sessions.get(token);
    if (!session) return false;
    
    if (new Date() > session.expiresAt) {
      this.sessions.delete(token);
      return false;
    }
    
    return true;
  }
  
  /**
   * Get secure configuration instructions
   */
  getSecureConfigInstructions(token: string, configKey: string): BrainToolInstruction[] {
    if (!this.isSessionValid(token)) {
      throw new Error('Invalid or expired session token');
    }
    
    return [
      BrainToolInstructions.stateGet('config', `secure/${configKey}`),
      {
        tool: 'brain:state_get',
        args: { category: 'config', key: `secure/${configKey}_metadata` },
        description: `Get encryption metadata for ${configKey}`
      }
    ];
  }
  
  /**
   * Save encrypted configuration
   */
  getSaveSecureConfigInstructions(
    token: string,
    configKey: string,
    encryptedData: any
  ): BrainToolInstruction[] {
    if (!this.isSessionValid(token)) {
      throw new Error('Invalid or expired session token');
    }
    
    return [
      BrainToolInstructions.stateSet('config', `secure/${configKey}`, encryptedData),
      BrainToolInstructions.stateSet('config', `secure/${configKey}_metadata`, {
        encrypted: true,
        algorithm: this.ALGORITHM,
        lastModified: new Date().toISOString()
      })
    ];
  }
  
  private async deriveKey(password: string): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      crypto.pbkdf2(password, this.SALT, this.ITERATIONS, this.KEY_LENGTH, 'sha256', (err, derivedKey) => {
        if (err) reject(err);
        else resolve(derivedKey);
      });
    });
  }
  
  private cleanExpiredSessions(): void {
    const now = new Date();
    for (const [token, session] of this.sessions.entries()) {
      if (now > session.expiresAt) {
        this.sessions.delete(token);
      }
    }
  }
}

/**
 * Configuration structure for project defaults
 */
export interface ProjectConfiguration {
  author: {
    name: string;
    email: string;
    github_username: string;
  };
  defaults: {
    python_version: string;
    license: string;
    private_repo: boolean;
    branch_protection: boolean;
    ci_provider: string;
  };
  tools: {
    package_manager: string;
    test_framework: string;
    linter: string;
    formatter: string;
    type_checker: string;
    pre_commit: boolean;
    docker: boolean;
  };
  project_structure: {
    src_layout: boolean;
    docs_tool: string;
    readme_badges: string[];
    include_makefile: boolean;
    include_philosophy: boolean;
  };
  templates: {
    use_copier: boolean;
    template_repo: string;
  };
  security: {
    dependency_scanning: boolean;
    security_workflow: boolean;
    require_2fa: boolean;
  };
}

/**
 * Secure API Keys structure
 */
export interface SecureApiKeys {
  github_token?: string;
  pypi_token?: string;
  aws_access_key_id?: string;
  aws_secret_access_key?: string;
  docker_hub_token?: string;
  openai_api_key?: string;
  anthropic_api_key?: string;
}
