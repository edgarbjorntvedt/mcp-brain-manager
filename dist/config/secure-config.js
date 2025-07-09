/**
 * Secure Configuration Manager
 * Handles encrypted storage and retrieval of sensitive configuration
 */
import crypto from 'crypto';
import { BrainToolInstructions } from '../brain-instructions.js';
export class SecureConfigManager {
    sessions = new Map();
    SALT = 'brain-config-salt-v1';
    ITERATIONS = 100000;
    KEY_LENGTH = 32;
    ALGORITHM = 'aes-256-gcm';
    /**
     * Start a secure session with password
     * In production, this would use your system login password
     */
    async startSecureSession(password) {
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
        }
        catch (error) {
            return {
                success: false,
                message: 'Failed to start secure session. Invalid password?'
            };
        }
    }
    /**
     * Encrypt sensitive data
     */
    async encryptData(data, password) {
        const key = await this.deriveKey(password);
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipheriv(this.ALGORITHM, key, iv);
        let encrypted = cipher.update(data, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        const tag = cipher.getAuthTag();
        return {
            encrypted,
            iv: iv.toString('hex'),
            tag: tag.toString('hex')
        };
    }
    /**
     * Decrypt sensitive data
     */
    async decryptData(encryptedData, iv, tag, password) {
        const key = await this.deriveKey(password);
        const decipher = crypto.createDecipheriv(this.ALGORITHM, key, Buffer.from(iv, 'hex'));
        decipher.setAuthTag(Buffer.from(tag, 'hex'));
        let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    }
    /**
     * Check if session is valid
     */
    isSessionValid(token) {
        const session = this.sessions.get(token);
        if (!session)
            return false;
        if (new Date() > session.expiresAt) {
            this.sessions.delete(token);
            return false;
        }
        return true;
    }
    /**
     * Get secure configuration instructions
     */
    getSecureConfigInstructions(token, configKey) {
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
    getSaveSecureConfigInstructions(token, configKey, encryptedData) {
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
    async deriveKey(password) {
        return new Promise((resolve, reject) => {
            crypto.pbkdf2(password, this.SALT, this.ITERATIONS, this.KEY_LENGTH, 'sha256', (err, derivedKey) => {
                if (err)
                    reject(err);
                else
                    resolve(derivedKey);
            });
        });
    }
    cleanExpiredSessions() {
        const now = new Date();
        for (const [token, session] of this.sessions.entries()) {
            if (now > session.expiresAt) {
                this.sessions.delete(token);
            }
        }
    }
}
//# sourceMappingURL=secure-config.js.map