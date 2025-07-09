/**
 * Repository Update Protocol
 * Automated workflow for updating repositories with proper documentation
 */
import { BrainToolInstruction } from '../brain-instructions.js';
export interface RepoUpdateOptions {
    projectName: string;
    commitMessage?: string;
    includeTests?: boolean;
    versionBump?: 'major' | 'minor' | 'patch' | null;
    createSummary?: boolean;
}
export interface RepoUpdateResult {
    success: boolean;
    steps: StepResult[];
    summary: UpdateSummary;
    instructions: BrainToolInstruction[];
}
export interface StepResult {
    step: string;
    status: 'success' | 'failed' | 'skipped';
    output?: string;
    error?: string;
}
export interface UpdateSummary {
    filesChanged: string[];
    testsRun: boolean;
    buildStatus: 'success' | 'failed' | 'not-applicable';
    documentationUpdated: boolean;
    brainStateUpdated: boolean;
    commitHash?: string;
    notes: string[];
}
export declare class RepoUpdateProtocol {
    /**
     * Execute the full repository update protocol
     */
    executeUpdate(options: RepoUpdateOptions): Promise<RepoUpdateResult>;
    private createGitStep;
    private createBuildStep;
    private createVersionStep;
    private createDocumentationStep;
    private createBrainStateStep;
    private createSummaryStep;
    private generateCommitMessage;
    /**
     * Generate a quick summary without executing steps
     */
    generateSummaryOnly(projectName: string, changes: string[], notes?: string[]): BrainToolInstruction[];
}
//# sourceMappingURL=repo-update-protocol.d.ts.map