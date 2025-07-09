/**
 * Brain Manager v2 - Works within MCP constraints
 * Instead of calling brain tools directly, it manages context locally
 * and provides instructions for brain tool usage
 */
import { BrainToolInstruction } from './brain-instructions.js';
import { ProjectConfiguration } from './config/secure-config.js';
import { RepoUpdateOptions } from './protocols/repo-update-protocol.js';
export interface SessionContext {
    timestamp: string;
    lastProject: string;
    lastActivity: string;
    conversationMode: string;
    openTasks?: string[];
    keyDecisions?: string[];
}
export interface ProjectContext {
    projectName: string;
    status: string;
    created: string;
    lastModified: string;
    summary: string;
    currentFocus: string;
    openTasks: string[];
    completedTasks: string[];
    keyDecisions: Decision[];
    milestones: Milestone[];
    keyFiles: string[];
    dependencies?: {
        obsidianNotes?: string[];
        codeFiles?: string[];
        relatedProjects?: string[];
    };
    metadata?: Record<string, any>;
}
export interface Decision {
    timestamp: string;
    decision: string;
    rationale: string;
    impact?: string;
}
export interface Milestone {
    timestamp: string;
    title: string;
    description: string;
    artifacts?: string[];
}
export interface UpdateProposal {
    id: string;
    type: string;
    timestamp: string;
    projectName: string;
    changesSummary: string;
    proposedContext: ProjectContext;
    originalUpdates: any;
    confirmationPrompt: string;
}
export interface InitializationResult {
    initialized: boolean;
    mode: string;
    confidence: number;
    reasoning: string;
    instructions: BrainToolInstruction[];
    suggestedActions: string[];
}
export declare class BrainManagerV2 {
    private currentProject;
    private sessionContext;
    private projectStack;
    private pendingUpdates;
    private projectCache;
    private lastSessionCache;
    private projectCreator;
    private secureConfig;
    private secureSessionToken;
    private repoUpdateProtocol;
    constructor();
    initialize(existingSession?: SessionContext, existingProject?: ProjectContext): Promise<InitializationResult>;
    loadSessionData(session: SessionContext | null, project: ProjectContext | null): void;
    proposeUpdate(updateType: string, updates: any, projectName?: string): Promise<UpdateProposal>;
    confirmUpdate(updateId: string, modifications?: any): Promise<{
        success: boolean;
        message: string;
        instructions: BrainToolInstruction[];
    }>;
    switchProject(projectName: string, createIfNotExists?: boolean, template?: string, existingProjectData?: ProjectContext): Promise<{
        success: boolean;
        project?: ProjectContext;
        message: string;
        instructions: BrainToolInstruction[];
    }>;
    returnToPrevious(): Promise<{
        success: boolean;
        project?: ProjectContext;
        message: string;
    }>;
    generateDashboard(projectName?: string, includeAnalytics?: boolean): Promise<{
        dashboard: string;
        instructions: BrainToolInstruction[];
    }>;
    analyzePatterns(timeframe: string, focusArea?: string): Promise<any>;
    getContextSummary(verbose?: boolean): Promise<any>;
    getSuggestedActions(mode: string): string[];
    private generateConfirmationPrompt;
    private createProjectFromTemplate;
    private calculateProjectAnalytics;
    /**
     * Start a secure session for accessing sensitive configuration
     */
    startSecureSession(password: string): Promise<{
        success: boolean;
        message: string;
        expiresAt?: Date;
    }>;
    /**
     * Create a new project with full automation
     */
    createNewProject(projectName: string, options?: {
        type?: string;
        description?: string;
        template?: string;
    }, existingConfig?: ProjectConfiguration): Promise<{
        success: boolean;
        message: string;
        instructions: BrainToolInstruction[];
        projectInfo?: {
            path: string;
            githubUrl?: string;
        };
    }>;
    /**
     * Initialize with encryption support (future Monitex integration)
     */
    initializeWithEncryption(message: string, encrypted?: boolean): Promise<InitializationResult & {
        passwordPrompt?: any;
    }>;
    /**
     * Get security status and recommendations
     */
    getSecurityStatus(): {
        hasEncryption: boolean;
        recommendations: string[];
        sensitiveDataPolicy: string;
    };
    /**
     * Execute repository update protocol
     * Triggered by "update repo" or similar commands
     */
    updateRepository(commitMessage?: string, options?: Partial<RepoUpdateOptions>): Promise<{
        success: boolean;
        summary: string;
        instructions: BrainToolInstruction[];
    }>;
    /**
     * Generate a project summary
     * Triggered by "summarize" or similar commands
     */
    generateProjectSummary(changes?: string[], notes?: string[]): Promise<{
        success: boolean;
        instructions: BrainToolInstruction[];
    }>;
    /**
     * Handle common workflow commands
     * Maps natural language to appropriate actions
     */
    handleWorkflowCommand(command: string): Promise<{
        action: string;
        result: any;
        instructions: BrainToolInstruction[];
    }>;
}
//# sourceMappingURL=brain-manager-v2.d.ts.map