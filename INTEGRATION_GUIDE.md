# MCP Brain Manager - Integration Guide

## How It Works

The MCP Brain Manager is designed to work **alongside** your existing brain tools, not replace them. Due to MCP architecture constraints (tools cannot call other tools directly), the Brain Manager operates in a collaborative pattern with Claude.

## Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  Brain Manager  │     │     Claude       │     │   Brain Tools   │
│   (This MCP)    │────▶│  (Orchestrator)  │────▶│  (Existing MCP) │
└─────────────────┘     └──────────────────┘     └─────────────────┘
        │                         ▲                         │
        │    Instructions         │                         │
        └─────────────────────────┘─────────────────────────┘
                            Results/Data
```

## Key Concepts

### 1. **Instruction Generation**
Instead of calling brain tools directly, the Brain Manager generates instructions that Claude executes:

```json
{
  "requiredBrainCalls": "Execute these brain tool calls:\n\n1. Initialize brain session\n   Tool: brain:brain_init\n   Args: {}\n\n2. Get system/last_session_context from state\n   Tool: brain:state_get\n   Args: {\"category\":\"system\",\"key\":\"last_session_context\"}"
}
```

### 2. **Data Flow Pattern**
The typical flow for using Brain Manager:

1. **Initial Call** → Brain Manager returns instructions
2. **Claude Executes** → Claude runs the brain tool calls
3. **Return with Data** → Call Brain Manager again with results
4. **Process & Continue** → Brain Manager uses the data

## Usage Examples

### Example 1: Starting a Session

```typescript
// First call - no data yet
manager_init({ 
  message: "Let's continue working on the API project" 
})

// Returns:
{
  "requiredBrainCalls": "Execute these brain tool calls:\n\n1. Initialize brain session...\n2. Get last session context...",
  "note": "Execute the brain tool calls listed above, then call this tool again with sessionData and projectData parameters filled in."
}

// Claude executes:
brain:brain_init()
brain:state_get({ category: "system", key: "last_session_context" })

// Second call - with data
manager_init({
  message: "Let's continue working on the API project",
  sessionData: { /* result from state_get */ },
  projectData: { /* if project was loaded */ }
})

// Returns:
{
  "mode": "project_continuation",
  "confidence": 0.85,
  "currentProject": { /* project details */ }
}
```

### Example 2: Recording Progress

```typescript
// Propose an update
propose_update({
  updateType: "progress",
  updates: {
    completedTasks: ["Implement authentication"],
    newTasks: ["Add error handling"],
    currentFocus: "Testing auth flow"
  }
})

// Returns proposal for review
{
  "id": "uuid-here",
  "confirmationPrompt": "📝 Proposed progress update...",
  "proposedContext": { /* updated project */ }
}

// Confirm the update
confirm_update({ updateId: "uuid-here" })

// Returns:
{
  "success": true,
  "requiredBrainCalls": "Execute these brain tool calls:\n\n1. Set project context...\n2. Update session context..."
}

// Claude executes the state_set calls
```

### Example 3: Creating a Dashboard

```typescript
generate_dashboard({ 
  projectName: "api-project",
  includeAnalytics: true 
})

// Returns:
{
  "dashboard": "# api-project\n\n> **Status:** active...",
  "requiredBrainCalls": "Execute these brain tool calls:\n\n1. Create Obsidian note...",
  "note": "Execute the obsidian_note call to save this dashboard"
}
```

## Working with Projects

### Loading Projects
Projects can be loaded in two ways:

1. **Through manager_init** - Automatically loads last project
2. **Through switch_project** - Explicitly switch to a project

### Project Cache
The Brain Manager maintains a local cache during its session:
- Reduces need for repeated brain:state_get calls
- Improves performance for project switching
- Cache is lost when MCP server restarts

### Project Templates
Available templates:
- `software` - Development projects
- `research` - Investigation and learning
- `ml` - Machine learning projects  
- `writing` - Documentation and content
- `custom` - Blank slate

## Best Practices

### 1. **Always Initialize First**
Start every session with `manager_init`:
```typescript
manager_init({ message: "Your first message" })
```

### 2. **Execute Brain Calls Promptly**
When you see `requiredBrainCalls`, execute them immediately:
```typescript
// If Brain Manager returns this:
"requiredBrainCalls": "Execute these brain tool calls:\n\n1. Set project/my-project in state..."

// You should immediately run:
brain:state_set({ category: "project", key: "my-project", value: {...} })
```

### 3. **Pass Data Back**
After executing brain tools, pass the results back:
```typescript
// Got data from brain:state_get
const sessionData = { lastProject: "my-project", ... }

// Pass it back to Brain Manager
manager_init({ 
  message: "Continue", 
  sessionData: sessionData 
})
```

### 4. **Confirm Updates**
Always review proposed updates before confirming:
```typescript
// Review the proposal
const proposal = await propose_update({...})
// Check proposal.confirmationPrompt

// If good, confirm it
confirm_update({ updateId: proposal.id })
```

## Semantic Routing

The Brain Manager includes intelligent intent classification:

### Modes
- `project_continuation` - Continuing existing work
- `project_management` - New development tasks
- `research` - Learning and exploration
- `analysis` - Pattern finding
- `help` - System assistance
- `general_assistant` - General conversation

### Classification Process
1. **Explicit Switches** - "Switch to research mode"
2. **Context Signals** - "Let's continue" with active project
3. **Keyword Analysis** - Sophisticated pattern matching
4. **Confidence Scoring** - How certain the classification is

## Integration Patterns

### Pattern 1: Session Initialization
```typescript
// Claude's workflow:
1. User: "Let's work on the chat app"
2. Claude: manager_init({ message: "Let's work on the chat app" })
3. Brain Manager: Returns brain tool instructions
4. Claude: Executes brain:brain_init and brain:state_get
5. Claude: manager_init({ message: "...", sessionData: {...} })
6. Brain Manager: Returns classified intent and loaded context
```

### Pattern 2: Progress Tracking
```typescript
// Claude's workflow:
1. User: "I finished the websocket implementation"
2. Claude: propose_update({ 
     updateType: "progress",
     updates: { completedTasks: ["Implement websockets"] }
   })
3. Brain Manager: Returns proposal with confirmation prompt
4. Claude: Shows prompt to user, gets confirmation
5. Claude: confirm_update({ updateId: "..." })
6. Brain Manager: Returns brain tool instructions
7. Claude: Executes brain:state_set calls
```

### Pattern 3: Project Switching
```typescript
// Claude's workflow:
1. User: "Switch to my ML project"
2. Claude: switch_project({ projectName: "ml-project" })
3. Brain Manager: Returns instructions to load project
4. Claude: Executes brain:state_get
5. Claude: switch_project({ 
     projectName: "ml-project",
     projectData: {...}
   })
6. Brain Manager: Confirms switch, updates context
```

## Error Handling

### Missing Projects
```typescript
switch_project({ projectName: "unknown-project" })
// Returns: "Project not in cache. Execute the instruction to load it."

// After executing brain:state_get, if not found:
switch_project({ 
  projectName: "unknown-project",
  createIfNotExists: true,
  template: "software"
})
```

### Expired Proposals
```typescript
confirm_update({ updateId: "old-id" })
// Returns: { success: false, message: "Update proposal not found or expired" }
// Proposals expire after 5 minutes
```

## Advanced Features

### Project Analytics
```typescript
generate_dashboard({ includeAnalytics: true })
// Includes:
// - Task velocity (tasks/week)
// - Completion rate percentage
// - Decision frequency
// - Days active
```

### Pattern Analysis
```typescript
analyze_patterns({ 
  timeframe: "week",
  focusArea: "productivity" 
})
// Returns insights about work patterns
```

### Context Summary
```typescript
get_context_summary({ verbose: true })
// Returns current state, cached projects, pending updates
```

## Migration from brain_execute

If you're currently using `brain:brain_execute`, the Brain Manager provides:

1. **Better Structure** - Typed contexts instead of free-form memory
2. **Human Confirmation** - Updates are proposed, not automatic
3. **Project Management** - Built-in project switching with stack
4. **Semantic Understanding** - Intelligent mode selection
5. **Template System** - Structured project initialization

## Troubleshooting

### Q: Why can't Brain Manager call brain tools directly?
A: MCP architecture doesn't allow tools to call other tools. This is by design for security and clarity.

### Q: What happens if I restart Claude?
A: You'll need to run `manager_init` again. The Brain Manager's cache is cleared, but your data is safe in brain state.

### Q: Can I use Brain Manager without brain tools?
A: Yes, but with limited functionality. It will work as a session-only project manager.

### Q: How do I know which brain calls to execute?
A: The `requiredBrainCalls` field provides exact instructions with tool names and arguments.

## Summary

The Brain Manager enhances your brain tools by providing:
- **Intelligent context management**
- **Human-in-the-loop updates**  
- **Project organization**
- **Semantic intent routing**
- **Template-based initialization**

It works *with* your existing brain tools, not instead of them, creating a more structured and intelligent knowledge management system.
