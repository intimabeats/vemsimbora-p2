// src/pages/admin/EditProjectTask.tsx
import React, { useState, useEffect } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { Layout } from '../../components/Layout'
import {
  CheckCircle,
  AlertTriangle,
  Plus,
  ArrowLeft,
  Trash2,
  FileText,
  Calendar,
  Users,
  Clock,
  Flag,
  Award,
  Briefcase,
  Save
} from 'lucide-react'
import { taskService } from '../../services/TaskService'
import { projectService } from '../../services/ProjectService'
import { userManagementService } from '../../services/UserManagementService'
import { TaskSchema, TaskAction } from '../../types/firestore-schema'
import { systemSettingsService } from '../../services/SystemSettingsService'
import { actionTemplateService } from '../../services/ActionTemplateService';
import { deepCopy } from '../../utils/helpers';
import { useAuth } from '../../context/AuthContext'

export const EditProjectTask: React.FC = () => {
  const { projectId, taskId } = useParams<{ projectId: string; taskId: string }>()
  const navigate = useNavigate()
  const { currentUser } = useAuth()

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    projectId: projectId || '',
    assignedTo: '',
    priority: 'medium' as TaskSchema['priority'],
    startDate: new Date().toISOString().split('T')[0],
    dueDate: new Date().toISOString().split('T')[0],
    difficultyLevel: 5,
    actions: [] as TaskAction[]
  })

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({})
  const [isLoading, setIsLoading] = useState(true)

  const [users, setUsers] = useState<{ id: string, name: string }[]>([])
  const [coinsReward, setCoinsReward] = useState(0)
  const [templates, setTemplates] = useState<{ id: string, title: string }[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [projectName, setProjectName] = useState('');

  // Load task data and other necessary data
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        if (!taskId) {
          throw new Error('Task ID is required');
        }

        // Fetch task data
        const taskData = await taskService.getTaskById(taskId);

        // Fetch project name
        if (projectId) {
          const project = await projectService.getProjectById(projectId);
          setProjectName(project.name);
        }

        // Fetch users, settings, and templates
        const [usersRes, settings, templatesRes] = await Promise.all([
          userManagementService.fetchUsers(),
          systemSettingsService.getSettings(),
          actionTemplateService.fetchActionTemplates()
        ]);

        // Set form data from task
        setFormData({
          title: taskData.title,
          description: taskData.description,
          projectId: taskData.projectId,
          assignedTo: taskData.assignedTo,
          priority: taskData.priority,
          startDate: new Date(taskData.startDate || Date.now()).toISOString().split('T')[0],
          dueDate: new Date(taskData.dueDate).toISOString().split('T')[0],
          difficultyLevel: taskData.difficultyLevel || 5,
          actions: taskData.actions || []
        });

        // Set other state
        setUsers(usersRes.data.map(u => ({ id: u.id, name: u.name })));
        setCoinsReward(Math.round(settings.taskCompletionBase * taskData.difficultyLevel * settings.complexityMultiplier));
        setTemplates(templatesRes.map(t => ({ id: t.id, title: t.title })));

      } catch (err: any) {
        console.error('Error loading task data:', err);
        setError(err.message || 'Failed to load task data');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [taskId, projectId]);

  const validateForm = () => {
    const errors: { [key: string]: string } = {}
    if (!formData.title.trim()) errors.title = 'Título é obrigatório'
    if (!formData.description.trim()) errors.description = 'Descrição é obrigatória'
    if (!formData.assignedTo) errors.assignedTo = 'Um responsável é obrigatório'
    if (!formData.startDate) errors.startDate = 'Data de início é obrigatória'
    if (!formData.dueDate) errors.dueDate = 'Data de vencimento é obrigatória'

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))

    if (formErrors[name]) {
      setFormErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[name]
        return newErrors
      })
    }
  }

  const handleAddActionFromTemplate = async () => {
    if (!selectedTemplate) return;

    try {
      const fullTemplate = await actionTemplateService.getActionTemplateById(selectedTemplate);
      if (!fullTemplate) return;

      const newAction: TaskAction = {
        id: Date.now().toString() + Math.random().toString(36).substring(7),
        title: fullTemplate.title,
        type: 'document',
        completed: false,
        description: fullTemplate.elements.map(e => e.description).join(' '),
        data: { steps: deepCopy(fullTemplate.elements) },
      };

      setFormData(prev => ({
        ...prev,
        actions: [...prev.actions, newAction],
      }));
      
      // Reset the selected template after adding
      setSelectedTemplate('');
    } catch (error) {
      console.error("Error adding action from template:", error);
      setError("Failed to add action from template.");
    }
  };

  const handleRemoveAction = (actionId: string) => {
    setFormData(prev => ({
      ...prev,
      actions: prev.actions.filter(action => action.id !== actionId)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    setError(null);

    try {
      if (!taskId) {
        throw new Error('Task ID is missing');
      }

      const updateData = {
        title: formData.title,
        description: formData.description,
        assignedTo: formData.assignedTo,
        priority: formData.priority,
        startDate: new Date(formData.startDate).getTime(),
        dueDate: new Date(formData.dueDate).getTime(),
        difficultyLevel: formData.difficultyLevel,
        actions: formData.actions,
        coinsReward
      };

      await taskService.updateTask(taskId, updateData);
      navigate(`/admin/projects/${projectId}`);
    } catch (err: any) {
      setError(err.message || 'Failed to update task');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout role={currentUser?.role || 'admin'} isLoading={isLoading}>
      <div className="container mx-auto p-6">
        <div className="flex items-center mb-6">
          <button 
            onClick={() => navigate(-1)} 
            className="mr-4 p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
            aria-label="Go back"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center">
            <CheckCircle className="mr-3 text-blue-600" />
            Editar Tarefa em {projectName}
          </h1>
        </div>

        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-lg flex items-center mb-6">
            <AlertTriangle className="mr-3 flex-shrink-0" size={20} />
            <p>{error}</p>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800">Informações da Tarefa</h2>
            <p className="text-sm text-gray-600">Atualize os detalhes da tarefa</p>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                    <FileText size={16} className="mr-2 text-blue-600" />
                    Título
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    placeholder="Digite o título da tarefa"
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${formErrors.title ? 'border-red-500 focus:ring-red-500' : 'focus:ring-blue-500 border-gray-300'}`}
                  />
                  {formErrors.title && (
                    <p className="text-red-500 text-xs mt-1">{formErrors.title}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                    <Users size={16} className="mr-2 text-blue-600" />
                    Responsável
                  </label>
                  <select
                    name="assignedTo"
                    value={formData.assignedTo}
                    onChange={handleChange}
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${formErrors.assignedTo ? 'border-red-500 focus:ring-red-500' : 'focus:ring-blue-500 border-gray-300'}`}
                  >
                    <option value="">Selecione um responsável</option>
                    {users.map(user => (
                      <option key={user.id} value={user.id}>
                        {user.name}
                      </option>
                    ))}
                  </select>
                  {formErrors.assignedTo && (
                    <p className="text-red-500 text-xs mt-1">{formErrors.assignedTo}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                    <Briefcase size={16} className="mr-2 text-blue-600" />
                    Projeto
                  </label>
                  <input
                    type="text"
                    value={projectName}
                    disabled
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700 cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                    <Flag size={16} className="mr-2 text-blue-600" />
                    Prioridade
                  </label>
                  <select
                    name="priority"
                    value={formData.priority}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="low">Baixa</option>
                    <option value="medium">Média</option>
                    <option value="high">Alta</option>
                    <option value="critical">Crítica</option>
                  </select>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                    <FileText size={16} className="mr-2 text-blue-600" />
                    Descrição
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="Descreva a tarefa em detalhes"
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 h-24 ${formErrors.description ? 'border-red-500 focus:ring-red-500' : 'focus:ring-blue-500 border-gray-300'}`}
                  />
                  {formErrors.description && (
                    <p className="text-red-500 text-xs mt-1">{formErrors.description}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                      <Calendar size={16} className="mr-2 text-blue-600" />
                      Data de Início
                    </label>
                    <input
                      type="date"
                      name="startDate"
                      value={formData.startDate}
                      onChange={handleChange}
                      className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${formErrors.startDate ? 'border-red-500 focus:ring-red-500' : 'focus:ring-blue-500 border-gray-300'}`}
                    />
                    {formErrors.startDate && (
                      <p className="text-red-500 text-xs mt-1">{formErrors.startDate}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                      <Clock size={16} className="mr-2 text-blue-600" />
                      Data de Vencimento
                    </label>
                    <input
                      type="date"
                      name="dueDate"
                      value={formData.dueDate}
                      onChange={handleChange}
                      className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${formErrors.dueDate ? 'border-red-500 focus:ring-red-500' : 'focus:ring-blue-500 border-gray-300'}`}
                    />
                    {formErrors.dueDate && (
                      <p className="text-red-500 text-xs mt-1">{formErrors.dueDate}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                    <Award size={16} className="mr-2 text-blue-600" />
                    Nível de Dificuldade ({formData.difficultyLevel})
                  </label>
                  <div className="flex items-center space-x-1">
                    <span className="text-xs text-gray-500">Fácil</span>
                    <input
                      type="range"
                      min="2"
                      max="9"
                      step="1"
                      value={formData.difficultyLevel}
                      onChange={(e) => setFormData(prev => ({ ...prev, difficultyLevel: parseInt(e.target.value) }))}
                      className="flex-grow h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                    <span className="text-xs text-gray-500">Difícil</span>
                  </div>
                  <div className="flex justify-between mt-1">
                    <span className="text-xs text-gray-500">Recompensa: {coinsReward} moedas</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Templates */}
            <div className="border-t border-gray-200 pt-6">
              <div className="flex justify-between items-center mb-4">
                <label className="block text-sm font-medium text-gray-700 flex items-center">
                  <CheckCircle size={16} className="mr-2 text-blue-600" />
                  Ações da Tarefa
                </label>
                <div className="flex space-x-2">
                  <Link
                    to="/admin/action-templates/create"
                    target="_blank"
                    className="text-blue-600 text-sm hover:text-blue-800 flex items-center"
                  >
                    <Plus size={14} className="mr-1" />
                    Criar Modelo
                  </Link>
                </div>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-4">
                <div className="flex space-x-2">
                  <select
                    value={selectedTemplate}
                    onChange={(e) => setSelectedTemplate(e.target.value)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Selecione um Modelo de Ação</option>
                    {templates.map(template => (
                      <option key={template.id} value={template.id}>
                        {template.title}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={handleAddActionFromTemplate}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center"
                    disabled={!selectedTemplate}
                  >
                    <Plus size={18} className="mr-1" /> Adicionar
                  </button>
                </div>
              </div>

              {/* Display Added Actions */}
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {formData.actions.length === 0 ? (
                  <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
                    <p className="text-gray-500">Adicione ações do modelo para esta tarefa</p>
                  </div>
                ) : (
                  formData.actions.map((action) => (
                    <div key={action.id} className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center">
                          <div className="bg-blue-100 p-2 rounded-full mr-3">
                            <FileText size={16} className="text-blue-600" />
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900">{action.title}</h4>
                            <p className="text-sm text-gray-500 line-clamp-1">{action.description}</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveAction(action.id)}
                          className="text-gray-400 hover:text-red-500 transition-colors p-1 rounded-full hover:bg-gray-100"
                          title="Remover ação"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="border-t border-gray-200 pt-6 flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className={`px-6 py-2 rounded-lg text-white transition flex items-center ${loading ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Atualizando...
                  </>
                ) : (
                  <>
                    <Save className="mr-2" size={18} /> Salvar Alterações
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
}
