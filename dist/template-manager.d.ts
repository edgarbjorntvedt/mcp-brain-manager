/**
 * Template Manager - Project templates for different types
 */
export interface ProjectTemplate {
    name: string;
    description: string;
    defaultStatus: string;
    structure: {
        metadata: Record<string, any>;
        defaultTasks?: string[];
        suggestedMilestones?: string[];
        customFields?: Array<{
            field: string;
            type: string;
            default?: any;
        }>;
    };
}
export declare class TemplateManager {
    private templates;
    constructor();
    private initializeDefaultTemplates;
    getTemplate(name: string): ProjectTemplate | undefined;
    getAllTemplates(): Array<{
        key: string;
        template: ProjectTemplate;
    }>;
    createCustomTemplate(name: string, template: ProjectTemplate): void;
    applyTemplate(templateName: string, projectName: string, customizations?: Record<string, any>): any;
    suggestTemplate(description: string): string;
}
//# sourceMappingURL=template-manager.d.ts.map