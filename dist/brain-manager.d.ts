/**
 * Brain Manager - Core context management functionality
 */
import { BrainToolClient } from './brain-client.js';
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
export declare class BrainManager {
    private currentProject;
    private sessionContext;
    private projectStack;
    private pendingUpdates;
    private brainClient;
    constructor(brainClient: BrainToolClient);
    initialize(): Promise<boolean>;
    getLastSession(): Promise<SessionContext | null>;
    loadProject(projectName: string): Promise<ProjectContext | null>;
    proposeUpdate(updateType: string, updates: any, projectName?: string): Promise<UpdateProposal>;
    confirmUpdate(updateId: string, modifications?: any): Promise<{
        success: boolean;
        message: string;
    }>;
    switchProject(projectName: string, createIfNotExists?: boolean, template?: string): Promise<{
        success: boolean;
        project?: ProjectContext;
        message: string;
    }>;
    returnToPrevious(): Promise<{
        success: boolean;
        project?: ProjectContext;
        message: string;
    }>;
    generateDashboard(projectName?: string, includeAnalytics?: boolean): Promise<string>;
    analyzePatterns(timeframe: string, focusArea?: string): Promise<any>;
    getContextSummary(verbose?: boolean): Promise<any>;
    getSuggestedActions(mode: string): string[];
    private generateConfirmationPrompt;
    private createProjectFromTemplate;
    private calculateProjectAnalytics;
}
//# sourceMappingURL=brain-manager.d.ts.map