/**
 * Template Manager - Project templates for different types
 */

export interface ProjectTemplate {
  name: string;
  description: string;
  defaultStatus: string;
  structure: {
    metadata: Record<string, any>;
    defaultTasks?: string[];
    suggestedMilestones?: string[];
    customFields?: Array<{
      field: string;
      type: string;
      default?: any;
    }>;
  };
}

export class TemplateManager {
  private templates: Map<string, ProjectTemplate> = new Map();

  constructor() {
    this.initializeDefaultTemplates();
  }

  private initializeDefaultTemplates() {
    // Software project template
    this.templates.set('software', {
      name: 'Software Development',
      description: 'Template for software development projects',
      defaultStatus: 'planning',
      structure: {
        metadata: {
          techStack: [],
          architecture: {
            type: '',
            components: [],
            databases: [],
            apis: []
          },
          testingStrategy: '',
          deploymentTarget: '',
          repository: '',
          cicd: false
        },
        defaultTasks: [
          'Set up project repository',
          'Define architecture',
          'Create development environment',
          'Set up CI/CD pipeline'
        ],
        suggestedMilestones: [
          'Project setup complete',
          'Core functionality implemented',
          'Testing framework established',
          'First deployment'
        ]
      }
    });

    // Research project template
    this.templates.set('research', {
      name: 'Research Project',
      description: 'Template for research and investigation projects',
      defaultStatus: 'exploration',
      structure: {
        metadata: {
          researchQuestions: [],
          hypotheses: [],
          methodology: '',
          dataSources: [],
          literatureReview: [],
          findings: [],
          conclusions: []
        },
        defaultTasks: [
          'Define research questions',
          'Literature review',
          'Develop methodology',
          'Collect initial data'
        ],
        suggestedMilestones: [
          'Research questions defined',
          'Literature review complete',
          'Data collection started',
          'Initial findings documented'
        ]
      }
    });

    // Machine Learning template
    this.templates.set('ml', {
      name: 'Machine Learning',
      description: 'Template for ML/AI projects',
      defaultStatus: 'data_collection',
      structure: {
        metadata: {
          problemType: '', // classification, regression, clustering, etc.
          datasets: [],
          features: [],
          models: [],
          experiments: [],
          metrics: {
            baseline: {},
            current: {},
            target: {}
          },
          bestModel: {
            name: '',
            hyperparameters: {},
            performance: {}
          }
        },
        defaultTasks: [
          'Define problem and success metrics',
          'Collect and prepare dataset',
          'Exploratory data analysis',
          'Feature engineering',
          'Establish baseline model'
        ],
        suggestedMilestones: [
          'Dataset prepared',
          'Baseline established',
          'First model trained',
          'Target metrics achieved'
        ]
      }
    });

    // Writing project template
    this.templates.set('writing', {
      name: 'Writing Project',
      description: 'Template for writing and documentation projects',
      defaultStatus: 'outlining',
      structure: {
        metadata: {
          type: '', // blog, book, documentation, article, etc.
          targetAudience: '',
          tone: '',
          outline: [],
          chapters: [],
          sections: [],
          wordCount: 0,
          targetWordCount: 0,
          keyThemes: [],
          researchNotes: [],
          references: []
        },
        defaultTasks: [
          'Define target audience and tone',
          'Create outline',
          'Research key topics',
          'Write first draft'
        ],
        suggestedMilestones: [
          'Outline complete',
          'First chapter/section drafted',
          '50% complete',
          'First draft complete'
        ]
      }
    });

    // Custom template (blank slate)
    this.templates.set('custom', {
      name: 'Custom Project',
      description: 'Blank template for custom project types',
      defaultStatus: 'active',
      structure: {
        metadata: {},
        defaultTasks: [],
        suggestedMilestones: []
      }
    });
  }

  getTemplate(name: string): ProjectTemplate | undefined {
    return this.templates.get(name);
  }

  getAllTemplates(): Array<{ key: string; template: ProjectTemplate }> {
    return Array.from(this.templates.entries()).map(([key, template]) => ({
      key,
      template
    }));
  }

  createCustomTemplate(
    name: string,
    template: ProjectTemplate
  ): void {
    this.templates.set(name, template);
  }

  applyTemplate(
    templateName: string,
    projectName: string,
    customizations?: Record<string, any>
  ): any {
    const template = this.templates.get(templateName);
    if (!template) {
      throw new Error(`Template '${templateName}' not found`);
    }

    const now = new Date().toISOString();
    
    // Build project structure from template
    const project = {
      projectName,
      status: customizations?.status || template.defaultStatus,
      created: now,
      lastModified: now,
      summary: customizations?.summary || `${template.name} project`,
      currentFocus: customizations?.currentFocus || template.structure.defaultTasks?.[0] || '',
      openTasks: [...(template.structure.defaultTasks || [])],
      completedTasks: [],
      keyDecisions: [],
      milestones: [],
      keyFiles: [],
      metadata: JSON.parse(JSON.stringify(template.structure.metadata))
    };

    // Apply customizations
    if (customizations) {
      Object.entries(customizations).forEach(([key, value]) => {
        if (key in project && key !== 'metadata') {
          (project as any)[key] = value;
        }
      });

      // Merge metadata customizations
      if (customizations.metadata) {
        project.metadata = {
          ...project.metadata,
          ...customizations.metadata
        };
      }
    }

    return project;
  }

  suggestTemplate(description: string): string {
    // Simple keyword-based suggestion
    const descLower = description.toLowerCase();
    
    if (descLower.includes('ml') || descLower.includes('machine learning') || 
        descLower.includes('ai') || descLower.includes('model')) {
      return 'ml';
    }
    
    if (descLower.includes('research') || descLower.includes('study') || 
        descLower.includes('investigate')) {
      return 'research';
    }
    
    if (descLower.includes('write') || descLower.includes('blog') || 
        descLower.includes('document') || descLower.includes('book')) {
      return 'writing';
    }
    
    if (descLower.includes('app') || descLower.includes('software') || 
        descLower.includes('code') || descLower.includes('build')) {
      return 'software';
    }
    
    return 'custom';
  }
}
