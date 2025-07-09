/**
 * Repository Update Protocol
 * Automated workflow for updating repositories with proper documentation
 */

import { BrainToolInstruction, BrainToolInstructions } from '../brain-instructions.js';

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

export class RepoUpdateProtocol {
  private githubUsername: string | null = null;
  
  /**
   * Set GitHub username for repo creation
   */
  setGitHubUsername(username: string): void {
    this.githubUsername = username;
  }
  
  /**
   * Execute the full repository update protocol
   */
  async executeUpdate(options: RepoUpdateOptions): Promise<RepoUpdateResult> {
    const steps: StepResult[] = [];
    const instructions: BrainToolInstruction[] = [];
    const summary: UpdateSummary = {
      filesChanged: [],
      testsRun: false,
      buildStatus: 'not-applicable',
      documentationUpdated: false,
      brainStateUpdated: false,
      notes: []
    };

    // Step 1: Git Operations
    const gitStep = this.createGitStep(options);
    steps.push(gitStep.result);
    instructions.push(...gitStep.instructions);

    // Step 2: Build & Test
    if (options.includeTests !== false) {
      const buildStep = this.createBuildStep(options);
      steps.push(buildStep.result);
      instructions.push(...buildStep.instructions);
    }

    // Step 3: Version Update
    if (options.versionBump) {
      const versionStep = this.createVersionStep(options);
      steps.push(versionStep.result);
      instructions.push(...versionStep.instructions);
    }

    // Step 4: Documentation Update
    const docStep = this.createDocumentationStep(options);
    steps.push(docStep.result);
    instructions.push(...docStep.instructions);

    // Step 5: Update Brain State
    const brainStep = this.createBrainStateStep(options);
    steps.push(brainStep.result);
    instructions.push(...brainStep.instructions);
    summary.brainStateUpdated = true;

    // Step 6: Create Summary
    if (options.createSummary !== false) {
      const summaryStep = this.createSummaryStep(options, summary);
      steps.push(summaryStep.result);
      instructions.push(...summaryStep.instructions);
    }

    return {
      success: steps.every(s => s.status !== 'failed'),
      steps,
      summary,
      instructions
    };
  }

  private createGitStep(options: RepoUpdateOptions): { result: StepResult; instructions: BrainToolInstruction[] } {
    const instructions: BrainToolInstruction[] = [];
    
    // First check if git repo exists, initialize if needed
    const initCheck = `
# Check and initialize git if needed
if [ ! -d .git ]; then
  echo "Initializing git repository..."
  git init
  git add -A
  git commit -m "Initial commit: ${options.projectName}"
  echo "Git repository initialized"
  echo "Create repo at: https://github.com/new"
  echo "Then: git remote add origin git@github.com:${this.githubUsername || 'YOUR_USERNAME'}/${options.projectName}.git"
  echo "      git branch -M main"
  echo "      git push -u origin main"
fi
`;
    
    instructions.push({
      tool: 'brain:brain_execute',
      args: {
        code: initCheck,
        description: 'Check and initialize git if needed',
        language: 'shell'
      },
      description: 'Ensure git repository exists'
    });
    
    // Then provide normal git operations
    const commitMsg = options.commitMessage || this.generateCommitMessage(options);
    const gitCommands = `
# Git operations for ${options.projectName}
git add -A
git commit -m "${commitMsg}"
# Try to push, will fail gracefully if no remote
git push origin main 2>/dev/null || echo "No remote configured yet"
`;

    instructions.push({
      tool: 'brain:brain_execute',
      args: {
        code: gitCommands,
        description: 'Execute git operations',
        language: 'shell'
      },
      description: `Git operations: add, commit, push`
    });

    return {
      result: {
        step: 'Git Operations',
        status: 'success',
        output: 'Git commands prepared for execution'
      },
      instructions
    };
  }

  private createBuildStep(options: RepoUpdateOptions): { result: StepResult; instructions: BrainToolInstruction[] } {
    const instructions: BrainToolInstruction[] = [];
    
    const buildCommands = `
# Build and test ${options.projectName}
npm run build
npm test
`;

    instructions.push({
      tool: 'brain:brain_execute',
      args: {
        code: buildCommands,
        description: 'Build and test project',
        language: 'shell'
      },
      description: 'Build and test the project'
    });

    return {
      result: {
        step: 'Build & Test',
        status: 'success',
        output: 'Build commands prepared'
      },
      instructions
    };
  }

  private createVersionStep(options: RepoUpdateOptions): { result: StepResult; instructions: BrainToolInstruction[] } {
    const instructions: BrainToolInstruction[] = [];
    
    const versionCommands = `
# Version bump for ${options.projectName}
npm version ${options.versionBump}
# Update CHANGELOG.md manually or with a tool
`;

    instructions.push({
      tool: 'brain:brain_execute',
      args: {
        code: versionCommands,
        description: `Version bump: ${options.versionBump}`,
        language: 'shell'
      },
      description: `Bump version (${options.versionBump})`
    });

    return {
      result: {
        step: 'Version Update',
        status: 'success',
        output: `Version bump: ${options.versionBump}`
      },
      instructions
    };
  }

  private createDocumentationStep(options: RepoUpdateOptions): { result: StepResult; instructions: BrainToolInstruction[] } {
    const instructions: BrainToolInstruction[] = [];
    
    // Just a reminder to check documentation
    instructions.push({
      tool: 'brain:brain_remember',
      args: {
        key: `${options.projectName}_doc_check`,
        value: {
          timestamp: new Date().toISOString(),
          reminder: 'Check if README.md and other docs need updates',
          files: ['README.md', 'CHANGELOG.md', 'docs/']
        },
        type: 'task'
      },
      description: 'Documentation update reminder'
    });

    return {
      result: {
        step: 'Documentation Update',
        status: 'success',
        output: 'Documentation check reminder set'
      },
      instructions
    };
  }

  private createBrainStateStep(options: RepoUpdateOptions): { result: StepResult; instructions: BrainToolInstruction[] } {
    const instructions: BrainToolInstruction[] = [];
    const timestamp = new Date().toISOString();
    
    // Get current projects index
    instructions.push(
      BrainToolInstructions.stateGet('system', 'projects_index')
    );

    // Note: In actual usage, the projects index update would happen after getting the current state
    // For now, we'll add a reminder instruction
    instructions.push({
      tool: 'brain:brain_remember',
      args: {
        key: `update_projects_index_${options.projectName}`,
        value: {
          instruction: 'Update projects_index after getting current state',
          projectName: options.projectName,
          updates: {
            last_worked: timestamp,
            recent_changes: options.commitMessage || 'Repository updated'
          }
        },
        type: 'instruction'
      },
      description: 'Reminder to update projects index'
    });

    // Update session context
    instructions.push(
      BrainToolInstructions.stateSet('system', 'last_session_context', {
        timestamp,
        lastProject: options.projectName,
        lastActivity: 'repository_update',
        conversationMode: 'development'
      })
    );

    return {
      result: {
        step: 'Update Brain State',
        status: 'success',
        output: 'Brain state update instructions created'
      },
      instructions
    };
  }

  private createSummaryStep(options: RepoUpdateOptions, summary: UpdateSummary): { result: StepResult; instructions: BrainToolInstruction[] } {
    const instructions: BrainToolInstruction[] = [];
    const date = new Date().toISOString().split('T')[0];
    
    const summaryContent = `# ${options.projectName} Update - ${date}

## Changes Made
${options.commitMessage || 'Repository updates'}

## Technical Details
- Build Status: ${summary.buildStatus}
- Tests Run: ${summary.testsRun ? 'Yes' : 'No'}
- Documentation Updated: ${summary.documentationUpdated ? 'Yes' : 'No'}

## Files Modified
${summary.filesChanged.map(f => `- ${f}`).join('\n') || '- See git log for details'}

## Next Steps
- Monitor CI/CD pipeline
- Update deployment if needed
- Review any pending issues

## Notes
${summary.notes.join('\n') || 'No additional notes'}

---
Generated by Repository Update Protocol`;

    instructions.push({
      tool: 'brain:obsidian_note',
      args: {
        action: 'create',
        title: `${date} ${options.projectName} Update`,
        content: summaryContent,
        folder: `projects/${options.projectName}/updates`
      },
      description: 'Create update summary note in Obsidian'
    });

    return {
      result: {
        step: 'Create Summary',
        status: 'success',
        output: 'Summary note prepared'
      },
      instructions
    };
  }

  private generateCommitMessage(options: RepoUpdateOptions): string {
    const lines = [`Update ${options.projectName}`];
    
    if (options.versionBump) {
      lines.push(`\n- Version bump: ${options.versionBump}`);
    }
    
    lines.push(
      '\n- Update documentation',
      '- Update brain state',
      '- General maintenance'
    );
    
    return lines.join('\n');
  }

  /**
   * Generate a quick summary without executing steps
   */
  generateSummaryOnly(
    projectName: string,
    changes: string[],
    notes?: string[]
  ): BrainToolInstruction[] {
    const date = new Date().toISOString().split('T')[0];
    const content = `# ${projectName} Summary - ${date}

## Changes
${changes.map(c => `- ${c}`).join('\n')}

## Notes
${notes?.join('\n') || 'No additional notes'}

---
Generated: ${new Date().toISOString()}`;

    return [{
      tool: 'brain:obsidian_note',
      args: {
        action: 'create',
        title: `${date} ${projectName} Summary`,
        content,
        folder: `projects/${projectName}/summaries`
      },
      description: 'Create project summary in Obsidian'
    }];
  }
}
