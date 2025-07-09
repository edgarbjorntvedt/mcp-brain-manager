/**
 * Automated Project Creator
 * Creates new projects using configuration from brain state table
 */
import { BrainToolInstruction } from '../brain-instructions.js';
import { ProjectConfiguration } from './secure-config.js';
export interface ProjectCreationOptions {
    name: string;
    type?: string;
    description?: string;
    template?: string;
    customConfig?: Partial<ProjectConfiguration>;
}
export interface ProjectCreationResult {
    success: boolean;
    projectPath: string;
    githubUrl?: string;
    instructions: BrainToolInstruction[];
    message: string;
}
export declare class AutomatedProjectCreator {
    private secureConfig;
    private templateManager;
    constructor();
    /**
     * Create a new project with all automation
     */
    createProject(options: ProjectCreationOptions, sessionToken?: string, existingConfig?: ProjectConfiguration): Promise<ProjectCreationResult>;
    /**
     * Generate all setup commands for the project
     */
    private generateSetupCommands;
    /**
     * Get secure setup instructions (GitHub repo creation, etc.)
     */
    private getSecureSetupInstructions;
    /**
     * Generate pyproject.toml content
     */
    private generatePyprojectToml;
    /**
     * Generate .gitignore content
     */
    private generateGitignore;
    /**
     * Generate README.md content
     */
    private generateReadme;
    /**
     * Generate other configuration files...
     */
    private generatePreCommitConfig;
    private generateCIConfig;
    private generateMakefile;
    private generateDockerfile;
    private generateEnvExample;
    private generateLicense;
    private generateConftest;
    /**
     * Get initial tasks based on project type
     */
    private getInitialTasks;
}
//# sourceMappingURL=project-creator.d.ts.map