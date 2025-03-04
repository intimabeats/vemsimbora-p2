// src/services/TaskService.ts
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  limit
} from 'firebase/firestore'
import { auth, storage } from '../config/firebase'
import { TaskSchema, ProjectSchema, TaskAction } from '../types/firestore-schema'
import { systemSettingsService } from './SystemSettingsService'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { notificationService } from './NotificationService'
import { projectService } from './ProjectService'
import { userManagementService } from './UserManagementService'
import { activityService } from './ActivityService'

export class TaskService {
  private db = getFirestore()

  // Criar nova tarefa
  async createTask(taskData: Omit<TaskSchema, 'id' | 'createdAt' | 'updatedAt'>) {
    try {
      const taskRef = doc(collection(this.db, 'tasks'))
      const settings = await systemSettingsService.getSettings()

      const coinsReward = Math.round(
        taskData.difficultyLevel *
        settings.taskCompletionBase *
        settings.complexityMultiplier
      )

      const newTask: TaskSchema = {
        id: taskRef.id,
        ...taskData,
        createdBy: auth.currentUser?.uid || '',
        status: 'pending',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        coinsReward,
        subtasks: taskData.subtasks || [],
        comments: taskData.comments || [],
        attachments: taskData.attachments || [],
        actions: taskData.actions || []
      }

      await setDoc(taskRef, newTask)

      // Log activity
      const projectData = await projectService.getProjectById(newTask.projectId)
      await activityService.logActivity({
        userId: auth.currentUser?.uid || '',
        userName: auth.currentUser?.displayName || 'Unknown User',
        type: 'task_created',
        projectId: newTask.projectId,
        projectName: projectData.name,
        taskId: newTask.id,
        taskName: newTask.title,
      })

      return newTask
    } catch (error) {
      console.error('Erro ao criar tarefa:', error)
      throw error
    }
  }

  // Atualizar tarefa
  async updateTask(taskId: string, updates: Partial<TaskSchema>) {
    try {
      const taskRef = doc(this.db, 'tasks', taskId)
      const taskSnap = await getDoc(taskRef)

      if (!taskSnap.exists()) {
        throw new Error("Task not found")
      }
      const previousTaskData = taskSnap.data() as TaskSchema

      const settings = await systemSettingsService.getSettings()

      // Recalculate coins reward if difficulty changes
      const coinsReward = updates.difficultyLevel
        ? Math.round(
          updates.difficultyLevel *
          settings.taskCompletionBase *
          settings.complexityMultiplier
        )
        : undefined

      const updateData = {
        ...updates,
        ...(coinsReward ? { coinsReward } : {}),
        updatedAt: Date.now()
      }

      await updateDoc(taskRef, updateData)

      // Fetch updated task
      const updatedDoc = await getDoc(taskRef)
      const updatedTaskData = { id: updatedDoc.id, ...updatedDoc.data() } as TaskSchema

      // Notification logic
      if (previousTaskData.status !== updatedTaskData.status) {
        const projectData = await projectService.getProjectById(updatedTaskData.projectId)

        // Create notification for assigned users
        if (updatedTaskData.assignedTo) {
          await notificationService.createNotification(
            updatedTaskData.assignedTo,
            {
              type: 'task_updated',
              title: 'Task Status Updated',
              message: `Task '${updatedTaskData.title}' in project '${projectData.name}' has been updated to ${updatedTaskData.status}`,
              relatedEntityId: taskId
            }
          )
        }
        
        // Notify project managers
        if (projectData && projectData.managers) {
          for (const managerId of projectData.managers) {
            await notificationService.createNotification(
              managerId,
              {
                type: 'task_updated',
                title: 'Task Status Updated',
                message: `Task '${updatedTaskData.title}' in project '${projectData.name}' has been updated to ${updatedTaskData.status}`,
                relatedEntityId: taskId
              }
            )
          }
        }
        // Log activity for task status update
        await activityService.logActivity({
          userId: auth.currentUser?.uid || '',
          userName: auth.currentUser?.displayName || 'Unknown User',
          type: 'task_status_update',
          projectId: updatedTaskData.projectId,
          projectName: projectData.name,
          taskId: taskId,
          taskName: updatedTaskData.title,
          newStatus: updatedTaskData.status,
          details: `Task status changed from ${previousTaskData.status} to ${updatedTaskData.status}`,
        })
      } else {
        // Log activity for general task update
        const projectData = await projectService.getProjectById(updatedTaskData.projectId)
        await activityService.logActivity({
          userId: auth.currentUser?.uid || '',
          userName: auth.currentUser?.displayName || 'Unknown User',
          type: 'task_updated',
          projectId: updatedTaskData.projectId,
          projectName: projectData.name,
          taskId: taskId,
          taskName: updatedTaskData.title,
          details: `Task updated.`,
        })
      }

      return updatedTaskData
    } catch (error) {
      console.error('Erro ao atualizar tarefa:', error)
      throw error
    }
  }

  // Excluir tarefa
  async deleteTask(taskId: string) {
    try {
      const taskRef = doc(this.db, 'tasks', taskId)
      await deleteDoc(taskRef)
    } catch (error) {
      console.error('Erro ao excluir tarefa:', error)
      throw error
    }
  }

  // Buscar tarefas com paginação e filtros
  async fetchTasks(options?: {
    projectId?: string
    status?: TaskSchema['status']
    assignedTo?: string
    limit?: number
    page?: number
  }) {
    try {
      let q = query(collection(this.db, 'tasks'))

      // Filtros
      if (options?.projectId) {
        q = query(q, where('projectId', '==', options.projectId))
      }

      if (options?.status) {
        q = query(q, where('status', '==', options.status))
      }

      if (options?.assignedTo) {
        q = query(q, where('assignedTo', '==', options.assignedTo))
      }

      // Ordenação
      q = query(q, orderBy('createdAt', 'desc'))

      // Executar consulta
      const snapshot = await getDocs(q)
      const allTasks = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as TaskSchema))

      // Paginação
      const limit = options?.limit || 10
      const page = options?.page || 1
      const startIndex = (page - 1) * limit
      const endIndex = startIndex + limit

      const paginatedTasks = allTasks.slice(startIndex, endIndex)
      const totalPages = Math.ceil(allTasks.length / limit)

      return {
        data: paginatedTasks,
        totalPages,
        totalTasks: allTasks.length
      }
    } catch (error) {
      console.error('Erro ao buscar tarefas:', error)
      throw error
    }
  }

  // Buscar tarefa por ID
  async getTaskById(taskId: string): Promise<TaskSchema> {
    try {
      const taskRef = doc(this.db, 'tasks', taskId)
      const taskSnap = await getDoc(taskRef)

      if (taskSnap.exists()) {
        return {
          id: taskSnap.id,
          ...taskSnap.data()
        } as TaskSchema
      } else {
        throw new Error('Tarefa não encontrada')
      }
    } catch (error) {
      console.error('Erro ao buscar tarefa:', error)
      throw error
    }
  }

  // Upload de anexos para tarefa
  async uploadTaskAttachment(taskId: string, file: File): Promise<string> {
    try {
      const timestamp = Date.now()
      const uniqueFilename = `${timestamp}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`
      
      const storageRef = ref(storage, `tasks/${taskId}/attachments/${uniqueFilename}`)
      
      const uploadResult = await uploadBytes(storageRef, file)
      console.log('File uploaded successfully:', uploadResult)
      
      const downloadURL = await getDownloadURL(storageRef)
      console.log('Download URL obtained:', downloadURL)

      const taskRef = doc(this.db, 'tasks', taskId)
      const taskSnap = await getDoc(taskRef)
      
      if (taskSnap.exists()) {
        const taskData = taskSnap.data() as TaskSchema
        const attachments = taskData.attachments || []
        
        await updateDoc(taskRef, {
          attachments: [...attachments, downloadURL],
          updatedAt: Date.now()
        })
      }

      return downloadURL
    } catch (error) {
      console.error('Error uploading attachment:', error)
      throw new Error('Failed to upload file. Please try again.')
    }
  }

  // Buscar anexos de uma tarefa
  async getTaskAttachments(taskId: string): Promise<string[]> {
    try {
      const taskRef = doc(this.db, 'tasks', taskId)
      const taskSnap = await getDoc(taskRef)

      if (taskSnap.exists()) {
        const taskData = taskSnap.data() as TaskSchema
        return taskData.attachments || []
      }

      return []
    } catch (error) {
      console.error('Erro ao buscar anexos:', error)
      throw error
    }
  }

  // Adicionar comentário à tarefa
  async addTaskComment(
    taskId: string,
    comment: {
      userId: string,
      text: string,
      attachments?: string[]
    }
  ) {
    try {
      const taskRef = doc(this.db, 'tasks', taskId)
      const taskDoc = await getDoc(taskRef)

      if (!taskDoc.exists()) {
        throw new Error('Tarefa não encontrada')
      }

      const taskData = taskDoc.data() as TaskSchema
      const newComment = {
        id: Date.now().toString(),
        userId: comment.userId,
        text: comment.text,
        createdAt: Date.now(),
        attachments: comment.attachments || []
      }

      await updateDoc(taskRef, {
        comments: [...(taskData.comments || []), newComment],
        updatedAt: Date.now()
      })

      return newComment
    } catch (error) {
      console.error('Erro ao adicionar comentário:', error)
      throw error
    }
  }

  // Completar uma ação da tarefa
  async completeTaskAction(taskId: string, actionId: string, data?: any): Promise<void> {
    try {
      const taskRef = doc(this.db, 'tasks', taskId)
      const taskSnap = await getDoc(taskRef)

      if (!taskSnap.exists()) {
        throw new Error('Task not found')
      }

      const taskData = taskSnap.data() as TaskSchema
      const updatedActions = taskData.actions.map(action => {
        if (action.id === actionId) {
          let updatedAction: TaskAction = {
            ...action,
            completed: true,
            completedAt: Date.now(),
            completedBy: auth.currentUser?.uid
          }

          if (action.type === 'info' && action.hasAttachments && data && data.attachments) {
            updatedAction = {
              ...updatedAction,
              data: {
                ...updatedAction.data,
                fileURLs: data.attachments
              }
            }
          } else if (action.type === 'document' && data) {
            updatedAction = {
              ...updatedAction,
              data: {
                ...updatedAction.data,
                steps: updatedAction.data?.steps || [],
                fileURLs: updatedAction.data?.fileURLs || []
              }
            }
          }
          
          return updatedAction
        }
        return action
      })

      await updateDoc(taskRef, {
        actions: updatedActions,
        updatedAt: Date.now()
      })
      
      console.log('Task action completed successfully')
    } catch (error) {
      console.error('Error completing task action:', error)
      throw error
    }
  }

  // Desfazer uma ação da tarefa
  async uncompleteTaskAction(taskId: string, actionId: string): Promise<void> {
    try {
      const taskRef = doc(this.db, 'tasks', taskId)
      const taskSnap = await getDoc(taskRef)

      if (!taskSnap.exists()) {
        throw new Error('Task not found')
      }

      const taskData = taskSnap.data() as TaskSchema
      const updatedActions = taskData.actions.map(action =>
        action.id === actionId ? { 
          ...action, 
          completed: false, 
          completedAt: null, 
          completedBy: null, 
          attachments: action.type === 'info' && action.hasAttachments ? [] : action.attachments 
        } : action
      )

      await updateDoc(taskRef, {
        actions: updatedActions,
        updatedAt: Date.now()
      })
    } catch (error) {
      console.error('Error uncompleting task action:', error)
      throw error
    }
  }

  // Editar uma ação da tarefa
  async editTaskAction(taskId: string, actionId: string, updates: Partial<TaskAction>): Promise<void> {
    try {
      const taskRef = doc(this.db, 'tasks', taskId)
      const taskSnap = await getDoc(taskRef)

      if (!taskSnap.exists()) {
        throw new Error('Task not found')
      }

      const taskData = taskSnap.data() as TaskSchema
      const updatedActions = taskData.actions.map(action =>
        action.id === actionId ? { ...action, ...updates, updatedAt: Date.now() } : action
      )

      await updateDoc(taskRef, {
        actions: updatedActions,
        updatedAt: Date.now()
      })

      console.log('Task action edited successfully')
    } catch (error) {
      console.error('Error editing task action:', error)
      throw error
    }
  }
}

export const taskService = new TaskService()
