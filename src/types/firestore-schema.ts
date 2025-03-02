// src/types/firestore-schema.ts

// User Schema
export interface UserSchema {
  id: string
  name: string
  email: string
  role: 'admin' | 'manager' | 'employee'
  status: 'active' | 'inactive' | 'suspended'
  coins: number
  createdAt: number
  updatedAt: number
  profileImage?: string
  coverImage?: string;
  lastLogin?: number
  bio?: string;
}

// Project Schema
export interface ProjectSchema {
  id: string
  name: string
  description: string
  startDate: number
  endDate?: number | null // Updated to allow null values
  status: 'planning' | 'active' | 'paused' | 'completed' | 'cancelled' | 'archived'
  managers: string[]
  createdBy?: string // Made optional to fix TypeScript error
  createdAt: number
  updatedAt: number
  messages?: {  // Keep for Project Chat
    id: string
    userId: string
    userName: string
    content: string
    timestamp: number
    attachments?: {
      id: string
      name: string
      url: string
      type: 'image' | 'video' | 'document' | 'link' | 'other' | 'audio'
      size?: number
    }[]
    quotedMessage?: { // For quoted messages
      userName: string;
      content: string;
      attachments?: any[];
    }
    originalMessageId?: string; // To update the original message
    messageType?: 'task_submission' | 'task_approval' | 'general';
  }[]
  commentTabs?: { id: string; name: string; comments: any[] }[]; // Keep for future use
}

// Task Schema
export interface TaskSchema {
  id: string;
  projectId: string;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'waiting_approval' | 'completed' | 'blocked';
  priority: 'low' | 'medium' | 'high' | 'critical';
  assignedTo: string; // Single user ID
  createdBy: string; // User ID
  startDate: number; // Start date
  dueDate: number;
  completedAt?: number;
  difficultyLevel: number; // Difficulty level 2-9
  coinsReward: number; // Calculated reward
  subtasks?: {
    id: string;
    title: string;
    completed: boolean;
    completedAt?: number;
  }[];
  comments?: {
    id: string;
    userId: string;
    text: string;
    createdAt: number;
    attachments?: string[]; // URLs or file references
  }[];
  attachments?: string[]; // URLs or file references
  createdAt: number;
  updatedAt: number;
  actions: TaskAction[]; // Array of actions
}

//  Interface for a task action
export interface TaskAction {
  id: string;
  title: string;
  type: 'text' | 'long_text' | 'file_upload' | 'approval' | 'date' | 'document' | 'info'; // Added 'info'
  completed: boolean;
  completedAt?: number | null;
  completedBy?: string | null;
  description?: string;
    // Specific fields for 'info' type
    infoTitle?: string;         // Title for the info section
    infoDescription?: string;   // Description for the info section
    hasAttachments?: boolean;   // Flag for required attachments
    data?: {
        fileURLs?: string[];    // NEW: Array of file URLs for 'info' type
        steps?: any[];          // Keep steps for document type
    };
    attachments?: {             // Attachments specific to THIS action step
        id: string;
        name: string;
        url: string;
        type: 'image' | 'video' | 'document' | 'link' | 'other' | 'audio';
        size?: number;
    }[];
}

//NEW: Interface for a task action template
export interface ActionTemplateSchema {
    id: string;
    title: string;
    type: 'custom'; // Assuming a single type for now
    elements: TaskAction[]; // Now includes description and fileURLs
    order: number;
}

    // Reward Schema
    export interface RewardSchema {
      id: string
      userId: string
      type: 'task_completion' | 'monthly_bonus' | 'special_achievement'
      amount: number
      description: string
      timestamp: number
      projectId?: string
      taskId?: string
    }

    // Notification Schema
    export interface NotificationSchema {
      id: string
      userId: string
      type: 'task_created' | 'task_assigned' | 'task_completed' | 'project_update' | 'reward_earned' | 'system_alert' | 'task_updated'
      title: string
      message: string
      read: boolean
      timestamp: number
      relatedEntityId?: string
      sender?: string
    }

    // System Settings Schema
    export interface SystemSettingsSchema {
      taskCompletionBase: number
      complexityMultiplier: number
      monthlyBonus: number
      twoFactorAuth: boolean
      passwordResetFrequency: number
      emailNotifications: boolean
      pushNotifications: boolean
      weeklyReports: boolean
    }

   // Activity Log Schema
    export interface ActivityLogSchema {
      id: string;
      userId: string;
      userName: string;
      type: 'project_created' | 'project_updated' | 'task_created' | 'task_updated' | 'task_completed' | 'user_login' | 'user_created' | 'task_status_update' | 'other'; // Added task_status_update
      projectId?: string; // Optional, if related to a project
      taskId?: string;    // Optional, if related to a task
      projectName?: string; // NEW: Project name for easier display
      taskName?: string;    // NEW: Task name for easier display
      newStatus?: string;   // NEW: For status updates
      details?: string;   // Optional, for additional details
      timestamp: number;
    }
