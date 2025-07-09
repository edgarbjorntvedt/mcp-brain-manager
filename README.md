# MCP Brain Manager

An intelligent context management layer for the Brain Knowledge Management System, implementing semantic routing and human-in-the-loop workflows.

## Overview

The MCP Brain Manager provides:
- **Enhanced Session Management** - Automatic context loading and mode selection
- **Semantic Routing** - Intelligent classification of user intent
- **Human-in-the-Loop Updates** - Proposed changes require confirmation
- **Project Stack** - Seamless switching between multiple projects
- **Project Templates** - Structured starting points for different project types
- **Analytics & Insights** - Pattern analysis and productivity metrics

## Installation

```bash
cd mcp-brain-manager
npm install
npm run build
```

## Configuration

Add to your MCP settings:

```json
{
  "mcpServers": {
    "brain-manager": {
      "command": "node",
      "args": ["/path/to/mcp-brain-manager/dist/index.js"],
      "description": "Intelligent Brain system management"
    }
  }
}
```

## Available Tools

### Core Management

#### `manager_init`
Initialize enhanced brain session with context loading.
```typescript
manager_init({ message: "Let's continue working on the API" })
// Returns: mode, confidence, last session info, current project
```

#### `propose_update`
Create a reviewable update proposal.
```typescript
propose_update({
  updateType: "progress",
  updates: {
    completedTasks: ["Setup auth"],
    newTasks: ["Add tests"],
    currentFocus: "Testing"
  }
})
// Returns: proposal ID, confirmation prompt, proposed changes
```

#### `confirm_update`
Apply a proposed update after review.
```typescript
confirm_update({
  updateId: "uuid-here",
  modifications: { /* optional changes */ }
})
```

### Project Management

#### `switch_project`
Switch to different project with context preservation.
```typescript
switch_project({
  projectName: "new-project",
  createIfNotExists: true,
  template: "software"
})
```

#### `return_to_previous`
Pop previous project from stack.
```typescript
return_to_previous()
```

#### `generate_dashboard`
Create Obsidian-compatible project dashboard.
```typescript
generate_dashboard({
  projectName: "my-project",
  includeAnalytics: true
})
```

### Intelligence Features

#### `semantic_classify`
Classify user intent with reasoning.
```typescript
semantic_classify({
  message: "I want to analyze the performance metrics",
  context: { lastProject: "api-project" }
})
// Returns: mode, confidence, reasoning
```

#### `analyze_patterns`
Analyze work patterns for insights.
```typescript
analyze_patterns({
  timeframe: "week",
  focusArea: "productivity"
})
```

## Usage Examples

### Starting a Session
```javascript
// First message of the day
await manager_init({ 
  message: "Let's continue with the chat app" 
})

// Response:
{
  "mode": "project_continuation",
  "confidence": 0.85,
  "reasoning": "Continuation signal detected with active project",
  "lastSession": {
    "project": "chat-app",
    "lastActivity": "Implemented websocket server"
  }
}
```

### Recording Progress
```javascript
// Propose an update
const proposal = await propose_update({
  updateType: "progress",
  updates: {
    completedTasks: ["Implement websockets"],
    newTasks: ["Add reconnection logic"],
    currentFocus: "Connection stability"
  }
})

// Review and confirm
await confirm_update({ updateId: proposal.id })
```

### Making Decisions
```javascript
await propose_update({
  updateType: "decision",
  updates: {
    decision: "Use Socket.IO instead of raw WebSockets",
    rationale: "Better browser compatibility and reconnection",
    impact: "Need to refactor existing code"
  }
})
```

## Project Templates

Available templates:
- `software` - Software development projects
- `research` - Research and investigation
- `ml` - Machine learning projects
- `writing` - Writing and documentation
- `custom` - Blank slate

## Security Guidelines

### Data Storage Restrictions

**NEVER store the following in the state table:**
- API keys (OpenAI, Anthropic, etc.)
- Passwords or authentication tokens
- OAuth tokens or refresh tokens
- Private SSH keys or certificates
- Database connection strings with credentials
- Any form of authentication credentials
- Personal identification information (SSN, credit cards, etc.)

### Sensitive Data Handling

If you need to work with sensitive data:

1. **Environment Variables** - Keep API keys in environment variables
2. **External Config** - Use separate config files (not tracked in git)
3. **Monitex Integration** - For future encrypted storage needs:
   ```javascript
   // Future implementation
   await manager_init({ 
     message: "Start work",
     encrypted: true  // Triggers Monitex password prompt
   })
   ```

### Validation Rules

The brain-manager includes automatic validation to prevent accidental storage of sensitive data:
- Detects common API key patterns (sk-, pk-, api-, key-, token-)
- Blocks storage of strings matching credential patterns
- Warns when attempting to store potential sensitive data

### Safe Data for State Table

✅ **Safe to store:**
- Project metadata and descriptions
- Task lists and progress tracking
- Decision records and rationales
- File paths and project structure
- Timestamps and activity logs
- Non-sensitive configuration options
- Public URLs and documentation links

❌ **Never store:**
- Any form of credentials or secrets
- Private/sensitive project data
- Customer data or PII
- Proprietary algorithms or trade secrets

## Architecture

```
mcp-brain-manager/
├── src/
│   ├── index.ts           # MCP server entry point
│   ├── brain-manager.ts   # Core management logic
│   ├── semantic-router.ts # Intent classification
│   └── template-manager.ts # Project templates
├── dist/                  # Compiled output
└── package.json
```

## Integration with Brain Tools

This manager coordinates with existing brain tools:
- Uses `brain:brain_init` for initialization
- Stores contexts with `brain:state_set/get`
- Saves narratives with `brain:brain_remember/recall`
- Creates dashboards with `brain:obsidian_note`

## Development

```bash
# Watch mode
npm run watch

# Run tests
npm test

# Build for production
npm run build
```

## Future Enhancements

1. **True Semantic Routing** - Call Claude for classification instead of patterns
2. **Context Compression** - Automatic summarization for large projects
3. **Collaboration Mode** - Share contexts between users
4. **Voice Integration** - Natural language project updates
5. **Auto-categorization** - Intelligent task and decision grouping

## Troubleshooting

**Q: Semantic classification seems wrong?**
A: You can provide feedback to improve:
```javascript
await semantic_classify({
  message: "your message",
  context: { /* ... */ }
})
// If wrong, explicitly state: "switch to research mode"
```

**Q: How to see all projects?**
A: Use the brain tools directly:
```javascript
brain:state_list({ category: "project" })
```

**Q: Update proposal expired?**
A: Proposals expire after 5 minutes. Create a new one.

## License

MIT
