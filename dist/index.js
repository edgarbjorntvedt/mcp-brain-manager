#!/usr/bin/env node
/**
 * MCP Brain Manager Server
 * Provides intelligent context management and semantic routing
 */
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema, ErrorCode, McpError } from '@modelcontextprotocol/sdk/types.js';
import { BrainManagerV2 } from './brain-manager-v2.js';
import { SemanticRouter } from './semantic-router.js';
import { TemplateManager } from './template-manager.js';
// Initialize server
const server = new Server({
    name: 'mcp-brain-manager',
    version: '0.1.0',
}, {
    capabilities: {
        tools: {},
    },
});
// Initialize components
const brainManager = new BrainManagerV2();
const semanticRouter = new SemanticRouter();
const templateManager = new TemplateManager();
// Error handling helper
function createError(code, message) {
    return new McpError(code, message);
}
// Register tool handlers
server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
        tools: [
            {
                name: 'manager_init',
                description: 'Initialize Brain Manager with enhanced context loading and semantic routing',
                inputSchema: {
                    type: 'object',
                    properties: {
                        message: {
                            type: 'string',
                            description: 'Initial user message to determine mode'
                        },
                        sessionData: {
                            type: 'object',
                            description: 'Session data from brain:state_get("system", "last_session_context")',
                            nullable: true
                        },
                        projectData: {
                            type: 'object',
                            description: 'Project data from brain:state_get("project", projectName)',
                            nullable: true
                        }
                    },
                    required: ['message']
                }
            },
            {
                name: 'semantic_classify',
                description: 'Classify user intent using semantic analysis',
                inputSchema: {
                    type: 'object',
                    properties: {
                        message: {
                            type: 'string',
                            description: 'Message to classify'
                        },
                        context: {
                            type: 'object',
                            description: 'Optional context for classification',
                            properties: {
                                lastProject: { type: 'string' },
                                conversationHistory: { type: 'array' }
                            },
                            nullable: true
                        }
                    },
                    required: ['message']
                }
            },
            {
                name: 'propose_update',
                description: 'Propose a context update for review before saving',
                inputSchema: {
                    type: 'object',
                    properties: {
                        updateType: {
                            type: 'string',
                            enum: ['progress', 'decision', 'milestone', 'insight'],
                            description: 'Type of update'
                        },
                        updates: {
                            type: 'object',
                            description: 'Update content'
                        },
                        projectName: {
                            type: 'string',
                            description: 'Project to update (optional, uses current if not specified)',
                            nullable: true
                        }
                    },
                    required: ['updateType', 'updates']
                }
            },
            {
                name: 'confirm_update',
                description: 'Confirm and save a proposed update',
                inputSchema: {
                    type: 'object',
                    properties: {
                        updateId: {
                            type: 'string',
                            description: 'ID of the proposed update'
                        },
                        modifications: {
                            type: 'object',
                            description: 'Optional modifications to the proposed update',
                            nullable: true
                        }
                    },
                    required: ['updateId']
                }
            },
            {
                name: 'switch_project',
                description: 'Switch to a different project, saving current context to stack',
                inputSchema: {
                    type: 'object',
                    properties: {
                        projectName: {
                            type: 'string',
                            description: 'Name of project to switch to'
                        },
                        projectData: {
                            type: 'object',
                            description: 'Existing project data if available from brain:state_get',
                            nullable: true
                        },
                        createIfNotExists: {
                            type: 'boolean',
                            description: 'Create project if it doesn\'t exist',
                            default: false
                        },
                        template: {
                            type: 'string',
                            enum: ['software', 'research', 'ml', 'writing', 'custom'],
                            description: 'Template to use if creating new project',
                            nullable: true
                        }
                    },
                    required: ['projectName']
                }
            },
            {
                name: 'return_to_previous',
                description: 'Return to the previous project from the stack',
                inputSchema: {
                    type: 'object',
                    properties: {}
                }
            },
            {
                name: 'generate_dashboard',
                description: 'Generate an Obsidian dashboard for a project',
                inputSchema: {
                    type: 'object',
                    properties: {
                        projectName: {
                            type: 'string',
                            description: 'Project name (uses current if not specified)',
                            nullable: true
                        },
                        includeAnalytics: {
                            type: 'boolean',
                            description: 'Include productivity analytics',
                            default: false
                        }
                    }
                }
            },
            {
                name: 'analyze_patterns',
                description: 'Analyze conversation and work patterns for insights',
                inputSchema: {
                    type: 'object',
                    properties: {
                        timeframe: {
                            type: 'string',
                            enum: ['session', 'day', 'week', 'month', 'all'],
                            default: 'session'
                        },
                        focusArea: {
                            type: 'string',
                            enum: ['productivity', 'decisions', 'blockers', 'progress'],
                            description: 'Specific area to analyze',
                            nullable: true
                        }
                    }
                }
            },
            {
                name: 'get_context_summary',
                description: 'Get a summary of current context and available actions',
                inputSchema: {
                    type: 'object',
                    properties: {
                        verbose: {
                            type: 'boolean',
                            description: 'Include detailed context information',
                            default: false
                        }
                    }
                }
            },
            {
                name: 'update_repository',
                description: 'Execute the repository update protocol (git commit, build, test, document)',
                inputSchema: {
                    type: 'object',
                    properties: {
                        commitMessage: {
                            type: 'string',
                            description: 'Commit message for the update',
                            nullable: true
                        },
                        includeTests: {
                            type: 'boolean',
                            description: 'Run tests as part of update',
                            default: true
                        },
                        versionBump: {
                            type: 'string',
                            enum: ['major', 'minor', 'patch'],
                            description: 'Version bump type if needed',
                            nullable: true
                        },
                        createSummary: {
                            type: 'boolean',
                            description: 'Create Obsidian summary note',
                            default: true
                        }
                    }
                }
            },
            {
                name: 'generate_summary',
                description: 'Generate a project summary note',
                inputSchema: {
                    type: 'object',
                    properties: {
                        changes: {
                            type: 'array',
                            items: { type: 'string' },
                            description: 'List of changes made',
                            nullable: true
                        },
                        notes: {
                            type: 'array',
                            items: { type: 'string' },
                            description: 'Additional notes to include',
                            nullable: true
                        }
                    }
                }
            },
            {
                name: 'handle_workflow',
                description: 'Handle natural language workflow commands like "update repo", "summarize", etc.',
                inputSchema: {
                    type: 'object',
                    properties: {
                        command: {
                            type: 'string',
                            description: 'Natural language command'
                        }
                    },
                    required: ['command']
                }
            }
        ]
    };
});
// Tool implementation handler
server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    if (!args) {
        throw createError(ErrorCode.InvalidParams, "Missing arguments");
    }
    try {
        switch (name) {
            case 'manager_init': {
                const result = await brainManager.initialize(args.sessionData || undefined, args.projectData || undefined);
                // Load the data if provided
                if (args.sessionData || args.projectData) {
                    brainManager.loadSessionData(args.sessionData, args.projectData);
                }
                // Classify the message
                const classification = await semanticRouter.classify(args.message, {
                    lastProject: args.sessionData?.lastProject,
                    conversationHistory: []
                });
                return {
                    initialized: result.initialized,
                    mode: classification.mode,
                    confidence: classification.confidence,
                    reasoning: classification.reasoning,
                    instructions: result.instructions,
                    suggestedActions: result.suggestedActions,
                    lastSession: args.sessionData || null,
                    currentProject: args.projectData || null
                };
            }
            case 'semantic_classify': {
                const result = await semanticRouter.classify(args.message, args.context || {});
                return result;
            }
            case 'propose_update': {
                const proposal = await brainManager.proposeUpdate(args.updateType, args.updates, args.projectName);
                return proposal;
            }
            case 'confirm_update': {
                const result = await brainManager.confirmUpdate(args.updateId, args.modifications);
                return result;
            }
            case 'switch_project': {
                const result = await brainManager.switchProject(args.projectName, args.createIfNotExists || false, args.template, args.projectData);
                return result;
            }
            case 'return_to_previous': {
                const result = await brainManager.returnToPrevious();
                return result;
            }
            case 'generate_dashboard': {
                const result = await brainManager.generateDashboard(args.projectName, args.includeAnalytics || false);
                return result;
            }
            case 'analyze_patterns': {
                const result = await brainManager.analyzePatterns(args.timeframe, args.focusArea);
                return result;
            }
            case 'get_context_summary': {
                const result = await brainManager.getContextSummary(args.verbose);
                return result;
            }
            case 'update_repository': {
                const result = await brainManager.updateRepository(args.commitMessage, {
                    includeTests: args.includeTests ?? true,
                    versionBump: args.versionBump,
                    createSummary: args.createSummary ?? true
                });
                return result;
            }
            case 'generate_summary': {
                const result = await brainManager.generateProjectSummary(args.changes, args.notes);
                return result;
            }
            case 'handle_workflow': {
                const result = await brainManager.handleWorkflowCommand(args.command);
                return result;
            }
            default:
                throw createError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
        }
    }
    catch (error) {
        if (error instanceof McpError) {
            throw error;
        }
        throw createError(ErrorCode.InternalError, error instanceof Error ? error.message : 'Unknown error occurred');
    }
});
// Start the server
async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error('MCP Brain Manager Server running on stdio');
}
main().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
});
//# sourceMappingURL=index.js.map