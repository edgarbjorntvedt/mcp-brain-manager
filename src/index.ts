#!/usr/bin/env node
/**
 * MCP Brain Manager Server
 * Provides intelligent context management and semantic routing
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ErrorCode,
  McpError
} from '@modelcontextprotocol/sdk/types.js';
import { BrainManagerV2, SessionContext, ProjectContext } from './brain-manager-v2.js';
import { SemanticRouter } from './semantic-router.js';
import { ProjectTemplate, TemplateManager } from './template-manager.js';
import { BrainToolInstruction } from './brain-instructions.js';

// Initialize server
const server = new Server(
  {
    name: 'mcp-brain-manager',
    version: '0.1.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Initialize components
const brainManager = new BrainManagerV2();
const semanticRouter = new SemanticRouter();
const templateManager = new TemplateManager();

// Error handling helper
function createError(code: ErrorCode, message: string) {
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
      },
      {
        name: 'create_project',
        description: 'Generate complete project setup instructions including all files, Git, GitHub, testing, and Brain integration. Execute the returned instructions to create the project.',
        inputSchema: {
          type: 'object',
          properties: {
            projectName: {
              type: 'string',
              description: 'Name of the project to create'
            },
            projectType: {
              type: 'string',
              enum: ['mcp-tool', 'web-app', 'cli-tool', 'library', 'api', 'general'],
              description: 'Type of project to create'
            },
            description: {
              type: 'string',
              description: 'Project description'
            },
            visibility: {
              type: 'string',
              enum: ['public', 'private'],
              default: 'public',
              description: 'GitHub repository visibility'
            },
            language: {
              type: 'string',
              enum: ['typescript', 'javascript'],
              default: 'typescript',
              description: 'Programming language'
            },
            features: {
              type: 'object',
              properties: {
                typescript: { type: 'boolean', default: true },
                testing: { type: 'boolean', default: true },
                linting: { type: 'boolean', default: true },
                docker: { type: 'boolean', default: false },
                cicd: { type: 'boolean', default: true },
                vscode: { type: 'boolean', default: true }
              },
              description: 'Optional features to include'
            },
            license: {
              type: 'string',
              enum: ['MIT', 'Apache-2.0', 'GPL-3.0', 'ISC', 'None'],
              default: 'MIT',
              description: 'License type'
            }
          },
          required: ['projectName', 'projectType']
        }
      },
      {
        name: 'brain_manager_help',
        description: 'Get help on using the Brain Manager',
        inputSchema: {
          type: 'object',
          properties: {
            command: {
              type: 'string',
              description: 'Specific command to get help for (or "all" for overview)'
            }
          }
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
        const result = await brainManager.initialize(
          (args.sessionData as SessionContext | undefined) || undefined,
          (args.projectData as ProjectContext | undefined) || undefined
        );
        
        // Load the data if provided
        if (args.sessionData || args.projectData) {
          brainManager.loadSessionData(args.sessionData as SessionContext | null, args.projectData as ProjectContext | null);
        }
        
        // Classify the message
        const classification = await semanticRouter.classify(
          (args.message as string),
          {
            lastProject: (args.sessionData as SessionContext | undefined)?.lastProject,
            conversationHistory: []
          }
        );
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                initialized: result.initialized,
                mode: classification.mode,
                confidence: classification.confidence,
                reasoning: classification.reasoning,
                instructions: result.instructions,
                suggestedActions: result.suggestedActions,
                lastSession: args.sessionData || null,
                currentProject: args.projectData || null
              }, null, 2)
            }
          ]
        };
      }

      case 'semantic_classify': {
        const result = await semanticRouter.classify(
          (args.message as string),
          (args.context as any) || {}
        );
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2)
            }
          ]
        };
      }

      case 'propose_update': {
        const proposal = await brainManager.proposeUpdate(
          (args.updateType as string),
          args.updates,
          args.projectName as string
        );
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(proposal, null, 2)
            }
          ]
        };
      }

      case 'confirm_update': {
        const result = await brainManager.confirmUpdate(
          (args.updateId as string),
          args.modifications
        );
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2)
            }
          ]
        };
      }

      case 'switch_project': {
        const result = await brainManager.switchProject(
          args.projectName as string,
          (args.createIfNotExists as boolean) || false,
          args.template as string,
          args.projectData as ProjectContext | undefined
        );
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2)
            }
          ]
        };
      }

      case 'return_to_previous': {
        const result = await brainManager.returnToPrevious();
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2)
            }
          ]
        };
      }

      case 'generate_dashboard': {
        const result = await brainManager.generateDashboard(
          args.projectName as string,
          (args.includeAnalytics as boolean) || false
        );
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2)
            }
          ]
        };
      }

      case 'analyze_patterns': {
        const result = await brainManager.analyzePatterns(
          (args.timeframe as string),
          args.focusArea as string | undefined
        );
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2)
            }
          ]
        };
      }

      case 'get_context_summary': {
        const result = await brainManager.getContextSummary((args.verbose as boolean));
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2)
            }
          ]
        };
      }

      case 'update_repository': {
        const result = await brainManager.updateRepository(
          args.commitMessage as string | undefined,
          {
            includeTests: (args.includeTests as boolean) ?? true,
            versionBump: args.versionBump as 'major' | 'minor' | 'patch' | undefined,
            createSummary: (args.createSummary as boolean) ?? true
          }
        );
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2)
            }
          ]
        };
      }

      case 'generate_summary': {
        const result = await brainManager.generateProjectSummary(
          args.changes as string[] | undefined,
          args.notes as string[] | undefined
        );
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2)
            }
          ]
        };
      }

      case 'handle_workflow': {
        const result = await brainManager.handleWorkflowCommand(
          args.command as string
        );
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2)
            }
          ]
        };
      }

      case 'create_project': {
        const result = await brainManager.createProject(args as any);
        return {
          content: [
            {
              type: 'text',
              text: result.summary
            },
            {
              type: 'text',
              text: '\n🚀 **EXECUTE THESE INSTRUCTIONS TO CREATE THE PROJECT:**\n\nThe following tools need to be called in order:\n\n' + 
                    result.instructions.map((inst, i) => 
                      `${i+1}. ${inst.tool} - ${inst.description}`
                    ).join('\n') + 
                    '\n\n**Full instruction details:**\n' + JSON.stringify(result.instructions, null, 2)
            }
          ]
        };
      }

      case 'brain_manager_help': {
        let helpText = '';
        const command = args.command as string | undefined;
        
        if (!command || command === 'all') {
          helpText = `🧠 Brain Manager Help
====================

The Brain Manager provides intelligent context management and semantic routing for your projects.

Available commands:

🚀 manager_init - Initialize session and load context
   Required: message
   Optional: sessionData, projectData

🎯 semantic_classify - Classify user intent
   Required: message
   Optional: context

📝 propose_update - Propose context changes for review
   Required: updateType, updates
   Optional: projectName

✅ confirm_update - Confirm and save proposed update
   Required: updateId
   Optional: modifications

🔄 switch_project - Switch to different project
   Required: projectName
   Optional: createIfNotExists, template, projectData

↩️  return_to_previous - Return to previous project

📊 generate_dashboard - Create Obsidian dashboard
   Optional: projectName, includeAnalytics

🔍 analyze_patterns - Analyze work patterns
   Optional: timeframe, focusArea

📋 get_context_summary - Get current context summary
   Optional: verbose

🔧 update_repository - Execute repository update protocol
   Optional: commitMessage, includeTests, versionBump, createSummary

📄 generate_summary - Generate project summary note
   Optional: changes, notes

🤖 handle_workflow - Handle natural language commands
   Required: command

➕ create_project - Generate project setup instructions
   Required: projectName, projectType
   Optional: description, visibility, language, features, license
   Note: Execute returned instructions to create the project

❓ brain_manager_help - Show this help
   Optional: command (specific command for details)

Use 'brain_manager_help' with a specific command for detailed information.`;
        } else {
          switch (command) {
            case 'manager_init':
              helpText = `🚀 manager_init - Initialize Brain Manager session

This is typically the first command to run in a session.

⚠️  IMPORTANT: This command now ALWAYS checks reminders first!
The awakening protocol and critical instructions are stored in reminders.

Parameters:
- message (required): Your initial message to determine mode
- sessionData: Result from brain:state_get("system", "last_session_context")
- projectData: Result from brain:state_get("project", projectName)

Usage pattern:
1. First call without data - returns brain tool instructions
2. Execute the brain tools (check_reminders, brain_init, state_get)
3. Call again with sessionData/projectData filled in

Example flow:
// First call
manager_init { "message": "Let's continue the API project" }
// Returns instructions including reminders check

// After executing brain tools, second call
manager_init {
  "message": "Let's continue the API project",
  "sessionData": { ...result from state_get... },
  "projectData": { ...if project was loaded... }
}
// Returns classified intent and loaded context`;
              break;
              
            case 'propose_update':
              helpText = `📝 propose_update - Propose context changes for review

Creates a proposal that can be reviewed before saving.

Parameters:
- updateType (required): Type of update
  Options: "progress", "decision", "milestone", "insight"
- updates (required): Update content object
- projectName: Project to update (uses current if not specified)

Example:
propose_update {
  "updateType": "progress",
  "updates": {
    "completedTasks": ["Implement authentication"],
    "newTasks": ["Add error handling"],
    "currentFocus": "Testing auth flow"
  }
}

Returns a proposal with:
- id: Use this to confirm the update
- confirmationPrompt: Review text
- proposedContext: Preview of changes`;
              break;
              
            case 'switch_project':
              helpText = `🔄 switch_project - Switch to a different project

Saves current context to stack and loads new project.

Parameters:
- projectName (required): Name of project to switch to
- createIfNotExists: Create if doesn't exist (default: false)
- template: Template for new project
  Options: "software", "research", "ml", "writing", "custom"
- projectData: Existing data from brain:state_get

Example:
switch_project {
  "projectName": "my-api-project",
  "createIfNotExists": true,
  "template": "software"
}`;
              break;
              
            case 'create_project':
              helpText = `➕ create_project - Generate complete project setup instructions

Generates detailed instructions for creating a complete project with Git, GitHub, testing, and Brain integration.

⚠️ IMPORTANT: This tool generates instructions that you must execute to actually create the project.

Parameters:
- projectName (required): Name of the project
- projectType (required): Type of project
  Options: "mcp-tool", "web-app", "cli-tool", "library", "api", "general"
- description: Project description
- visibility: "public" or "private" (default: public)
- language: "typescript" or "javascript" (default: typescript)
- license: "MIT", "Apache-2.0", "GPL-3.0", "ISC", "None" (default: MIT)
- features: Object with boolean flags:
  - typescript (default: true)
  - testing (default: true)
  - linting (default: true)
  - docker (default: false)
  - cicd (default: true)
  - vscode (default: true)

Example:
create_project {
  "projectName": "my-awesome-tool",
  "projectType": "mcp-tool",
  "description": "A tool that does awesome things",
  "features": {
    "docker": true
  }
}

After calling this, execute all returned instructions in the order specified.`;
              break;
              
            default:
              helpText = `Command '${command}' not found. Use 'brain_manager_help' without arguments to see all commands.`;
          }
        }
        
        return {
          content: [
            {
              type: 'text',
              text: helpText
            }
          ]
        };
      }

      default:
        throw createError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
    }
  } catch (error) {
    if (error instanceof McpError) {
      throw error;
    }
    throw createError(
      ErrorCode.InternalError,
      error instanceof Error ? error.message : 'Unknown error occurred'
    );
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
