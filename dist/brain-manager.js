/**
 * Brain Manager - Core context management functionality
 */
import { randomUUID } from 'crypto';
export class BrainManager {
    currentProject = null;
    sessionContext = null;
    projectStack = [];
    pendingUpdates = new Map();
    brainClient;
    constructor(brainClient) {
        this.brainClient = brainClient;
    }
    async initialize() {
        console.log('🧠 Initializing Brain Manager...');
        return await this.brainClient.brainInit();
    }
    async getLastSession() {
        const session = await this.brainClient.stateGet('system', 'last_session_context');
        return session;
    }
    async loadProject(projectName) {
        const project = await this.brainClient.stateGet('project', projectName);
        if (project) {
            this.currentProject = project;
            return this.currentProject;
        }
        return null;
    }
    async proposeUpdate(updateType, updates, projectName) {
        const project = projectName
            ? await this.loadProject(projectName)
            : this.currentProject;
        if (!project) {
            throw new Error('No project specified or loaded');
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
                message: 'Update proposal not found or expired'
            };
        }
        // Apply any modifications
        let finalContext = proposal.proposedContext;
        if (modifications) {
            finalContext = { ...finalContext, ...modifications };
        }
        // Save the updated context
        await this.brainClient.stateSet('project', proposal.projectName, finalContext);
        this.currentProject = finalContext;
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
        await this.brainClient.stateSet('system', 'last_session_context', sessionUpdate);
        this.sessionContext = sessionUpdate;
        // Remove from pending
        this.pendingUpdates.delete(updateId);
        return {
            success: true,
            message: `Successfully applied ${proposal.type} update to ${proposal.projectName}`
        };
    }
    async switchProject(projectName, createIfNotExists = false, template) {
        // Save current project to stack if exists
        if (this.currentProject) {
            this.projectStack.push({
                project: JSON.parse(JSON.stringify(this.currentProject)),
                timestamp: new Date().toISOString(),
                mode: this.sessionContext?.conversationMode || 'unknown'
            });
        }
        // Try to load the project
        let project = await this.loadProject(projectName);
        if (!project && createIfNotExists) {
            // Create new project with template
            project = this.createProjectFromTemplate(projectName, template);
            await this.brainClient.stateSet('project', projectName, project);
        }
        if (project) {
            this.currentProject = project;
            return {
                success: true,
                project,
                message: `Switched to project: ${projectName}`
            };
        }
        return {
            success: false,
            message: `Project '${projectName}' not found. Set createIfNotExists=true to create it.`
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
        return {
            success: true,
            project: previous.project,
            message: `Returned to project: ${previous.project.projectName} (saved at ${previous.timestamp})`
        };
    }
    async generateDashboard(projectName, includeAnalytics = false) {
        const project = projectName
            ? await this.loadProject(projectName)
            : this.currentProject;
        if (!project) {
            return '# No Project Found\n\nPlease specify a project name or load a project first.';
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
        return dashboard;
    }
    async analyzePatterns(timeframe, focusArea) {
        // This would analyze patterns in project work
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
                // Analyze tasks that have been open for a long time
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
            pendingUpdates: this.pendingUpdates.size
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
}
//# sourceMappingURL=brain-manager.js.map