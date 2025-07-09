/**
 * Security validators for brain-manager
 * Prevents accidental storage of sensitive data
 */
export interface ValidationResult {
    isValid: boolean;
    warnings: string[];
    errors: string[];
}
/**
 * Validates if a value contains sensitive data that shouldn't be stored
 */
export declare function validateForSensitiveData(value: any, key?: string): ValidationResult;
/**
 * Sanitizes an object by removing detected sensitive fields
 */
export declare function sanitizeSensitiveData(obj: any): {
    sanitized: any;
    removed: string[];
};
/**
 * Creates a Monitex-compatible password prompt configuration
 */
export declare function createPasswordPromptConfig(purpose?: string): {
    prompt: string;
    type: string;
    required: boolean;
    minLength: number;
    monitexIntegration: boolean;
};
//# sourceMappingURL=validators.d.ts.map