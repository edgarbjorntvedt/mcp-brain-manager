/**
 * Brain Manager v2 - Works within MCP constraints
 * Instead of calling brain tools directly, it manages context locally
 * and provides instructions for brain tool usage
 */
import { randomUUID } from 'crypto';
import { BrainToolInstructions } from './brain-instructions.js';
import { AutomatedProjectCreator } from './config/project-creator.js';
import { SecureConfigManager } from './config/secure-config.js';
import { validateForSensitiveData, createPasswordPromptConfig } from './security/validators.js';
import { RepoUpdateProtocol } from './protocols/repo-update-protocol.js';
export class BrainManagerV2 {
    // Local session storage (persists only during MCP server lifetime)
    currentProject = null;
    sessionContext = null;
    projectStack = [];
    pendingUpdates = new Map();
    // Local cache of projects (will be synced with brain state)
    projectCache = new Map();
    lastSessionCache = null;
    // New: Automated project creator and secure config
    projectCreator;
    secureConfig;
    secureSessionToken = null;
    repoUpdateProtocol;
    constructor() {
        this.projectCreator = new AutomatedProjectCreator();
        this.secureConfig = new SecureConfigManager();
        this.repoUpdateProtocol = new RepoUpdateProtocol();
    }
    async initialize(existingSession, existingProject) {
        const instructions = [];
        // Always start with brain_init
        instructions.push(BrainToolInstructions.brainInit());
        // If no existing session provided, we need to load it
        if (!existingSession) {
            instructions.push(BrainToolInstructions.stateGet('system', 'last_session_context'));
            this.lastSessionCache = null;
        }
        else {
            this.lastSessionCache = existingSession;
            this.sessionContext = existingSession;
        }
        // If session has a last project and it wasn't provided, load it
        if (existingSession?.lastProject && !existingProject) {
            instructions.push(BrainToolInstructions.stateGet('project', existingSession.lastProject));
        }
        else if (existingProject) {
            this.currentProject = existingProject;
            this.projectCache.set(existingProject.projectName, existingProject);
        }
        return {
            initialized: true,
            mode: 'pending_classification',
            confidence: 0,
            reasoning: 'Awaiting semantic classification of user intent',
            instructions,
            suggestedActions: this.getSuggestedActions('init')
        };
    }
    loadSessionData(session, project) {
        if (session) {
            this.sessionContext = session;
            this.lastSessionCache = session;
        }
        if (project) {
            this.currentProject = project;
            this.projectCache.set(project.projectName, project);
        }
    }
    async proposeUpdate(updateType, updates, projectName) {
        // Validate for sensitive data
        const validation = validateForSensitiveData(updates);
        if (!validation.isValid) {
            throw new Error(`Security validation failed: ${validation.errors.join('; ')}. Remove sensitive data like API keys, passwords, or tokens before storing.`);
        }
        // Additional warning for potential sensitive data
        if (validation.warnings.length > 0) {
            console.warn('⚠️  Security warnings:', validation.warnings);
        }
        const project = projectName
            ? this.projectCache.get(projectName) || this.currentProject
            : this.currentProject;
        if (!project) {
            throw new Error('No project specified or loaded. Load a project first with loadSessionData()');
        }
        // Create a copy for proposed changes
        const proposedContext = JSON.parse(JSON.stringify(project));
        const changesMade = [];
        // Apply updates based on type
        switch (updateType) {
            case 'progress':
                proposedContext.lastModified = new Date().toISOString();
                if (updates.completedTasks) {
                    const completed = updates.completedTasks;
                    proposedContext.openTasks = proposedContext.openTasks.filter((task) => !completed.includes(task));
                    proposedContext.completedTasks.push(...completed);
                    changesMade.push(`Completed ${completed.length} tasks`);
                }
                if (updates.newTasks) {
                    proposedContext.openTasks.push(...updates.newTasks);
                    changesMade.push(`Added ${updates.newTasks.length} new tasks`);
                }
                if (updates.currentFocus) {
                    proposedContext.currentFocus = updates.currentFocus;
                    changesMade.push(`Changed focus to: ${updates.currentFocus}`);
                }
                break;
            case 'decision':
                const decision = {
                    timestamp: new Date().toISOString(),
                    decision: updates.decision,
                    rationale: updates.rationale || 'No rationale provided',
                    impact: updates.impact
                };
                proposedContext.keyDecisions.push(decision);
                changesMade.push(`Recorded decision: ${decision.decision}`);
                break;
            case 'milestone':
                const milestone = {
                    timestamp: new Date().toISOString(),
                    title: updates.title,
                    description: updates.description || '',
                    artifacts: updates.artifacts || []
                };
                proposedContext.milestones.push(milestone);
                changesMade.push(`Added milestone: ${milestone.title}`);
                break;
            case 'insight':
                if (!proposedContext.metadata) {
                    proposedContext.metadata = {};
                }
                if (!proposedContext.metadata.insights) {
                    proposedContext.metadata.insights = [];
                }
                proposedContext.metadata.insights.push({
                    timestamp: new Date().toISOString(),
                    insight: updates.insight,
                    source: updates.source || 'observation'
                });
                changesMade.push(`Recorded insight: ${updates.insight}`);
                break;
        }
        // Create confirmation prompt
        const confirmationPrompt = this.generateConfirmationPrompt(updateType, changesMade, proposedContext);
        // Create and store proposal
        const proposal = {
            id: randomUUID(),
            type: updateType,
            timestamp: new Date().toISOString(),
            projectName: project.projectName,
            changesSummary: changesMade.join(' | '),
            proposedContext,
            originalUpdates: updates,
            confirmationPrompt
        };
        this.pendingUpdates.set(proposal.id, proposal);
        // Clean up old proposals (older than 5 minutes)
        const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
        for (const [id, prop] of this.pendingUpdates.entries()) {
            if (new Date(prop.timestamp).getTime() < fiveMinutesAgo) {
                this.pendingUpdates.delete(id);
            }
        }
        return proposal;
    }
    async confirmUpdate(updateId, modifications) {
        const proposal = this.pendingUpdates.get(updateId);
        if (!proposal) {
            return {
                success: false,
                message: 'Update proposal not found or expired',
                instructions: []
            };
        }
        // Apply any modifications
        let finalContext = proposal.proposedContext;
        if (modifications) {
            finalContext = { ...finalContext, ...modifications };
        }
        // Update local cache
        this.projectCache.set(proposal.projectName, finalContext);
        this.currentProject = finalContext;
        // Generate instructions for persisting to brain state
        const instructions = [];
        // Save project context
        instructions.push(BrainToolInstructions.stateSet('project', proposal.projectName, finalContext));
        // Update session context
        const sessionUpdate = {
            timestamp: new Date().toISOString(),
            lastProject: proposal.projectName,
            lastActivity: proposal.changesSummary,
            conversationMode: 'project_management',
            openTasks: finalContext.openTasks.slice(0, 5), // Top 5
            keyDecisions: finalContext.keyDecisions
                .slice(-3)
                .map(d => d.decision)
        };
        instructions.push(BrainToolInstructions.stateSet('system', 'last_session_context', sessionUpdate));
        this.sessionContext = sessionUpdate;
        // Remove from pending
        this.pendingUpdates.delete(updateId);
        return {
            success: true,
            message: `Successfully applied ${proposal.type} update to ${proposal.projectName}`,
            instructions
        };
    }
    async switchProject(projectName, createIfNotExists = false, template, existingProjectData) {
        const instructions = [];
        // Save current project to stack if exists
        if (this.currentProject) {
            this.projectStack.push({
                project: JSON.parse(JSON.stringify(this.currentProject)),
                timestamp: new Date().toISOString(),
                mode: this.sessionContext?.conversationMode || 'unknown'
            });
        }
        // Check local cache first
        let project = this.projectCache.get(projectName) || existingProjectData;
        if (!project) {
            if (createIfNotExists) {
                // Create new project with template
                project = this.createProjectFromTemplate(projectName, template);
                this.projectCache.set(projectName, project);
                // Instruction to save new project
                instructions.push(BrainToolInstructions.stateSet('project', projectName, project));
            }
            else {
                // Need to load from brain state
                instructions.push(BrainToolInstructions.stateGet('project', projectName));
                return {
                    success: false,
                    message: `Project '${projectName}' not in cache. Execute the instruction to load it.`,
                    instructions
                };
            }
        }
        if (project) {
            this.currentProject = project;
            this.projectCache.set(projectName, project);
            return {
                success: true,
                project,
                message: `Switched to project: ${projectName}`,
                instructions
            };
        }
        return {
            success: false,
            message: `Project '${projectName}' not found. Set createIfNotExists=true to create it.`,
            instructions: []
        };
    }
    async returnToPrevious() {
        if (this.projectStack.length === 0) {
            return {
                success: false,
                message: 'No previous project in stack'
            };
        }
        const previous = this.projectStack.pop();
        this.currentProject = previous.project;
        this.projectCache.set(previous.project.projectName, previous.project);
        return {
            success: true,
            project: previous.project,
            message: `Returned to project: ${previous.project.projectName} (saved at ${previous.timestamp})`
        };
    }
    async generateDashboard(projectName, includeAnalytics = false) {
        const project = projectName
            ? this.projectCache.get(projectName) || this.currentProject
            : this.currentProject;
        if (!project) {
            return {
                dashboard: '# No Project Found\n\nPlease specify a project name or load a project first.',
                instructions: []
            };
        }
        let dashboard = `# ${project.projectName}

> **Status:** ${project.status} | **Last Modified:** ${project.lastModified}

## 📋 Summary
${project.summary}

## 🎯 Current Focus
${project.currentFocus}

## ✅ Open Tasks (${project.openTasks.length})
`;
        if (project.openTasks.length > 0) {
            project.openTasks.forEach(task => {
                dashboard += `- [ ] ${task}\n`;
            });
        }
        else {
            dashboard += '*No open tasks*\n';
        }
        dashboard += `\n## ✨ Recent Milestones\n`;
        const recentMilestones = project.milestones.slice(-3);
        if (recentMilestones.length > 0) {
            recentMilestones.forEach(milestone => {
                dashboard += `- **${milestone.title}** - ${milestone.timestamp}\n`;
                if (milestone.description) {
                    dashboard += `  - ${milestone.description}\n`;
                }
            });
        }
        else {
            dashboard += '*No milestones recorded*\n';
        }
        dashboard += `\n## 💡 Key Decisions\n`;
        const recentDecisions = project.keyDecisions.slice(-5);
        if (recentDecisions.length > 0) {
            recentDecisions.forEach(decision => {
                dashboard += `- **${decision.decision}**\n`;
                dashboard += `  - *Rationale:* ${decision.rationale}\n`;
                if (decision.impact) {
                    dashboard += `  - *Impact:* ${decision.impact}\n`;
                }
            });
        }
        else {
            dashboard += '*No decisions recorded*\n';
        }
        if (includeAnalytics) {
            dashboard += `\n## 📊 Analytics\n`;
            const analytics = this.calculateProjectAnalytics(project);
            dashboard += `- **Velocity:** ${analytics.tasksCompletedPerWeek} tasks/week\n`;
            dashboard += `- **Completion Rate:** ${analytics.completionRate}%\n`;
            dashboard += `- **Days Active:** ${analytics.daysActive}\n`;
            dashboard += `- **Decision Frequency:** ${analytics.decisionsPerWeek} decisions/week\n`;
        }
        dashboard += `\n---\n*Dashboard generated: ${new Date().toISOString()}*`;
        // Generate instruction to save to Obsidian
        const instructions = [
            BrainToolInstructions.obsidianNote('create', {
                title: `${project.projectName} Dashboard`,
                content: dashboard,
                folder: 'Projects'
            })
        ];
        return { dashboard, instructions };
    }
    async analyzePatterns(timeframe, focusArea) {
        const analysis = {
            timeframe,
            focusArea: focusArea || 'general',
            patterns: [],
            insights: [],
            recommendations: []
        };
        if (!this.currentProject) {
            analysis.insights.push('No active project to analyze');
            return analysis;
        }
        // Analyze based on focus area
        switch (focusArea) {
            case 'productivity':
                analysis.patterns.push({
                    type: 'task_completion',
                    observation: `Completed ${this.currentProject.completedTasks.length} tasks`,
                    trend: 'stable'
                });
                break;
            case 'decisions':
                analysis.patterns.push({
                    type: 'decision_making',
                    observation: `Made ${this.currentProject.keyDecisions.length} key decisions`,
                    recentDecisions: this.currentProject.keyDecisions.slice(-3)
                });
                break;
            case 'blockers':
                analysis.patterns.push({
                    type: 'potential_blockers',
                    observation: 'Tasks that might be blocked',
                    tasks: this.currentProject.openTasks.slice(0, 3)
                });
                break;
        }
        return analysis;
    }
    async getContextSummary(verbose = false) {
        const summary = {
            initialized: true,
            currentProject: this.currentProject ? {
                name: this.currentProject.projectName,
                status: this.currentProject.status,
                focus: this.currentProject.currentFocus,
                openTaskCount: this.currentProject.openTasks.length
            } : null,
            stackDepth: this.projectStack.length,
            pendingUpdates: this.pendingUpdates.size,
            cachedProjects: Array.from(this.projectCache.keys())
        };
        if (verbose && this.currentProject) {
            summary.currentProject.recentActivity = {
                lastModified: this.currentProject.lastModified,
                recentDecisions: this.currentProject.keyDecisions.slice(-2),
                nextTasks: this.currentProject.openTasks.slice(0, 3)
            };
            summary.availableActions = this.getSuggestedActions('current');
        }
        return summary;
    }
    getSuggestedActions(mode) {
        const actions = [];
        if (this.currentProject) {
            actions.push('propose_update - Record progress or decisions');
            actions.push('generate_dashboard - Create project dashboard');
            actions.push('analyze_patterns - Analyze work patterns');
        }
        actions.push('switch_project - Work on different project');
        if (this.projectStack.length > 0) {
            actions.push('return_to_previous - Go back to previous project');
        }
        return actions;
    }
    generateConfirmationPrompt(updateType, changes, context) {
        let prompt = `📝 Proposed ${updateType} update for '${context.projectName}':\n\n`;
        changes.forEach(change => {
            prompt += `  • ${change}\n`;
        });
        prompt += '\nConfirm these changes?';
        return prompt;
    }
    createProjectFromTemplate(projectName, template) {
        const now = new Date().toISOString();
        const baseProject = {
            projectName,
            status: 'active',
            created: now,
            lastModified: now,
            summary: '',
            currentFocus: '',
            openTasks: [],
            completedTasks: [],
            keyDecisions: [],
            milestones: [],
            keyFiles: []
        };
        // Apply template-specific fields
        switch (template) {
            case 'software':
                baseProject.summary = 'Software development project';
                baseProject.metadata = {
                    techStack: [],
                    architecture: { type: '', components: [] },
                    testingStrategy: ''
                };
                break;
            case 'research':
                baseProject.summary = 'Research project';
                baseProject.metadata = {
                    researchQuestions: [],
                    hypotheses: [],
                    methodology: '',
                    dataSources: []
                };
                break;
            case 'ml':
                baseProject.summary = 'Machine learning project';
                baseProject.metadata = {
                    problemType: '',
                    datasets: [],
                    models: [],
                    metrics: {}
                };
                break;
            case 'writing':
                baseProject.summary = 'Writing project';
                baseProject.metadata = {
                    type: '',
                    outline: [],
                    wordCount: 0,
                    targetAudience: ''
                };
                break;
        }
        return baseProject;
    }
    calculateProjectAnalytics(project) {
        const created = new Date(project.created);
        const now = new Date();
        const daysActive = Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
        const weeksActive = Math.max(1, daysActive / 7);
        return {
            daysActive,
            tasksCompletedPerWeek: Math.round(project.completedTasks.length / weeksActive),
            completionRate: project.openTasks.length + project.completedTasks.length > 0
                ? Math.round((project.completedTasks.length / (project.openTasks.length + project.completedTasks.length)) * 100)
                : 0,
            decisionsPerWeek: Math.round(project.keyDecisions.length / weeksActive)
        };
    }
    /**
     * Start a secure session for accessing sensitive configuration
     */
    async startSecureSession(password) {
        const result = await this.secureConfig.startSecureSession(password);
        if (result.success && result.token) {
            this.secureSessionToken = result.token;
        }
        return {
            success: result.success,
            message: result.message,
            expiresAt: result.expiresAt
        };
    }
    /**
     * Create a new project with full automation
     */
    async createNewProject(projectName, options, existingConfig) {
        const projectOptions = {
            name: projectName,
            type: options?.type,
            description: options?.description,
            template: options?.template
        };
        const result = await this.projectCreator.createProject(projectOptions, this.secureSessionToken || undefined, existingConfig);
        if (result.success) {
            // Create a project context for the new project
            const newProject = {
                projectName: projectName,
                status: 'active',
                created: new Date().toISOString(),
                lastModified: new Date().toISOString(),
                summary: options?.description || `${options?.type || 'Python'} project created with automated setup`,
                currentFocus: 'Initial development',
                openTasks: [
                    'Complete initial implementation',
                    'Write comprehensive tests',
                    'Create documentation',
                    'Set up deployment pipeline'
                ],
                completedTasks: [
                    'Project structure created',
                    'Development environment configured',
                    'Git repository initialized',
                    'CI/CD pipeline set up'
                ],
                keyDecisions: [],
                milestones: [
                    {
                        timestamp: new Date().toISOString(),
                        title: 'Project Created',
                        description: 'Automated project setup completed',
                        artifacts: ['README.md', 'pyproject.toml', '.github/workflows/ci.yml']
                    }
                ],
                keyFiles: [
                    `${result.projectPath}/README.md`,
                    `${result.projectPath}/pyproject.toml`,
                    `${result.projectPath}/src/${projectName.replace(/-/g, '_')}/main.py`
                ],
                metadata: {
                    createdBy: 'automated-project-creator',
                    githubUrl: result.githubUrl,
                    projectPath: result.projectPath
                }
            };
            this.projectCache.set(projectName, newProject);
            this.currentProject = newProject;
        }
        return {
            success: result.success,
            message: result.message,
            instructions: result.instructions,
            projectInfo: result.success ? {
                path: result.projectPath,
                githubUrl: result.githubUrl
            } : undefined
        };
    }
    /**
     * Initialize with encryption support (future Monitex integration)
     */
    async initializeWithEncryption(message, encrypted = false) {
        const result = await this.initialize();
        if (encrypted) {
            // Future: This will trigger Monitex password prompt
            const passwordConfig = createPasswordPromptConfig('access encrypted project data');
            return {
                ...result,
                passwordPrompt: {
                    required: true,
                    config: passwordConfig,
                    instructions: [
                        ...result.instructions,
                        {
                            tool: 'monitex',
                            action: 'prompt_password',
                            params: passwordConfig,
                            description: 'Monitex will prompt for password to decrypt state'
                        }
                    ]
                }
            };
        }
        return result;
    }
    /**
     * Get security status and recommendations
     */
    getSecurityStatus() {
        return {
            hasEncryption: false, // Will be true when Monitex integration is complete
            recommendations: [
                'Store API keys in environment variables',
                'Use .env files for local development (not tracked in git)',
                'Never commit credentials to version control',
                'Use Monitex password prompts for sensitive operations'
            ],
            sensitiveDataPolicy: 'The brain state table should never contain API keys, passwords, tokens, or other authentication credentials.'
        };
    }
    /**
     * Execute repository update protocol
     * Triggered by "update repo" or similar commands
     */
    async updateRepository(commitMessage, options) {
        if (!this.currentProject) {
            throw new Error('No project loaded. Load a project first.');
        }
        const updateOptions = {
            projectName: this.currentProject.projectName,
            commitMessage: commitMessage || `Update ${this.currentProject.projectName}`,
            includeTests: true,
            createSummary: true,
            ...options
        };
        const result = await this.repoUpdateProtocol.executeUpdate(updateOptions);
        // Generate summary text
        const summary = `
## Repository Update ${result.success ? 'Complete' : 'Failed'} 🎉

### Steps Executed:
${result.steps.map(s => `- ${s.step}: ${s.status}`).join('\n')}

### Summary:
- Build Status: ${result.summary.buildStatus}
- Tests Run: ${result.summary.testsRun ? 'Yes' : 'No'}
- Documentation Updated: ${result.summary.documentationUpdated ? 'Yes' : 'No'}
- Brain State Updated: ${result.summary.brainStateUpdated ? 'Yes' : 'No'}

### Instructions:
Execute the following commands and brain tool calls as provided.
`;
        return {
            success: result.success,
            summary,
            instructions: result.instructions
        };
    }
    /**
     * Generate a project summary
     * Triggered by "summarize" or similar commands
     */
    async generateProjectSummary(changes, notes) {
        if (!this.currentProject) {
            throw new Error('No project loaded.');
        }
        const defaultChanges = [
            `Worked on ${this.currentProject.projectName}`,
            `Current focus: ${this.currentProject.currentFocus}`,
            `Open tasks: ${this.currentProject.openTasks.length}`,
            `Completed tasks: ${this.currentProject.completedTasks.length}`
        ];
        const instructions = this.repoUpdateProtocol.generateSummaryOnly(this.currentProject.projectName, changes || defaultChanges, notes);
        return {
            success: true,
            instructions
        };
    }
    /**
     * Handle common workflow commands
     * Maps natural language to appropriate actions
     */
    async handleWorkflowCommand(command) {
        const lowerCommand = command.toLowerCase();
        // Repository update triggers
        if (lowerCommand.includes('update repo') ||
            lowerCommand.includes('commit') ||
            lowerCommand.includes('push changes')) {
            const result = await this.updateRepository();
            return {
                action: 'repository_update',
                result,
                instructions: result.instructions
            };
        }
        // Summary triggers
        if (lowerCommand.includes('summarize') ||
            lowerCommand.includes('summary') ||
            lowerCommand.includes('recap')) {
            const result = await this.generateProjectSummary();
            return {
                action: 'generate_summary',
                result,
                instructions: result.instructions
            };
        }
        // Project switching
        if (lowerCommand.includes('switch to') ||
            lowerCommand.includes('open project')) {
            // Extract project name from command
            const projectMatch = command.match(/(?:switch to|open project)\s+([\w-]+)/i);
            if (projectMatch) {
                const result = await this.switchProject(projectMatch[1]);
                return {
                    action: 'switch_project',
                    result,
                    instructions: result.instructions
                };
            }
        }
        throw new Error(`Unknown workflow command: ${command}`);
    }
}
//# sourceMappingURL=brain-manager-v2.js.map