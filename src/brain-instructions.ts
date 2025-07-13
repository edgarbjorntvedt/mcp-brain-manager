/**
 * Brain Tool Instructions Generator
 * Since MCP tools can't call each other directly, this generates
 * instructions for Claude to execute the brain tools
 */

export interface BrainToolInstruction {
  tool: string;
  args: any;
  description: string;
}

export class BrainToolInstructions {
  static brainInit(): BrainToolInstruction {
    return {
      tool: 'brain:brain_init',
      args: {},
      description: 'Initialize brain session'
    };
  }

  static stateGet(category: string, key: string): BrainToolInstruction {
    return {
      tool: 'brain:state_get',
      args: { category, key },
      description: `Get ${category}/${key} from state`
    };
  }

  static stateSet(category: string, key: string, value: any): BrainToolInstruction {
    return {
      tool: 'brain:state_set',
      args: { category, key, value },
      description: `Set ${category}/${key} in state`
    };
  }

  static brainRemember(key: string, value: any, type: string = 'general'): BrainToolInstruction {
    return {
      tool: 'brain:brain_remember',
      args: { key, value, type },
      description: `Remember ${key} as ${type}`
    };
  }

  static brainRecall(query: string, limit: number = 10): BrainToolInstruction {
    return {
      tool: 'brain:brain_recall',
      args: { query, limit },
      description: `Recall memories matching "${query}"`
    };
  }

  static obsidianNote(action: string, params: any): BrainToolInstruction {
    return {
      tool: 'brain:obsidian_note',
      args: { action, ...params },
      description: `Obsidian ${action} operation`
    };
  }

  static custom(tool: string, args: any, description: string): BrainToolInstruction {
    return {
      tool,
      args,
      description
    };
  }
}
