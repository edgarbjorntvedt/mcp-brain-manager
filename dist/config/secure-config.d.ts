/**
 * Secure Configuration Manager
 * Handles encrypted storage and retrieval of sensitive configuration
 */
import { BrainToolInstruction } from '../brain-instructions.js';
export interface SecureSession {
    token: string;
    expiresAt: Date;
    permissionLevel: 'read' | 'write' | 'admin';
}
export declare class SecureConfigManager {
    private sessions;
    private readonly SALT;
    private readonly ITERATIONS;
    private readonly KEY_LENGTH;
    private readonly ALGORITHM;
    /**
     * Start a secure session with password
     * In production, this would use your system login password
     */
    startSecureSession(password: string): Promise<{
        success: boolean;
        token?: string;
        expiresAt?: Date;
        message: string;
    }>;
    /**
     * Encrypt sensitive data
     */
    encryptData(data: string, password: string): Promise<{
        encrypted: string;
        iv: string;
        tag: string;
    }>;
    /**
     * Decrypt sensitive data
     */
    decryptData(encryptedData: string, iv: string, tag: string, password: string): Promise<string>;
    /**
     * Check if session is valid
     */
    isSessionValid(token: string): boolean;
    /**
     * Get secure configuration instructions
     */
    getSecureConfigInstructions(token: string, configKey: string): BrainToolInstruction[];
    /**
     * Save encrypted configuration
     */
    getSaveSecureConfigInstructions(token: string, configKey: string, encryptedData: any): BrainToolInstruction[];
    private deriveKey;
    private cleanExpiredSessions;
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
//# sourceMappingURL=secure-config.d.ts.map