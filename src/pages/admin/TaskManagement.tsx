// src/pages/admin/TaskManagement.tsx
import React, { useState, useEffect, useCallback } from 'react'
import { Layout } from '../../components/Layout'
import {
  Plus,
  Edit,
  Trash2,
  CheckCircle,
  Clock,
  Users,
  Search,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import { taskService } from '../../services/TaskService'
import { projectService } from '../../services/ProjectService'
import { userManagementService } from '../../services/UserManagementService'
import { TaskSchema } from '../../types/firestore-schema'
import { DeleteConfirmationModal } from '../../components/modals/DeleteConfirmationModal'
import { Link, useNavigate } from 'react-router-dom' // Import Link and useNavigate
import useDebounce from '../../utils/useDebounce';

export const TaskManagement: React.FC = () => {
  // Estados
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tasks, setTasks] = useState<TaskSchema[]>([])
  const [projects, setProjects] = useState<{ id: string, name: string }[]>([])
  const [users, setUsers] = useState<{ [key: string]: string }>({})

  // Estados de modal
  const [selectedTask, setSelectedTask] = useState<TaskSchema | null>(null)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)

  // Estados de filtro e paginação
  const [projectFilter, setProjectFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const debouncedSearchTerm = useDebounce(searchTerm, 500); // Debounce the search term

    const [filter, setFilter] = useState<{
        status?: TaskSchema['status']
    }>({})

  // Paginação
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const ITEMS_PER_PAGE = 9

  // NEW: State for selected project for new task
  const [selectedNewTaskProject, setSelectedNewTaskProject] = useState('');
  const navigate = useNavigate();


    // useCallback to prevent unnecessary re-renders of fetchProjects
    const fetchProjects = useCallback(async () => {
        try {
            const fetchedProjects = await projectService.fetchProjects({excludeStatus: 'archived'});
            setProjects(fetchedProjects.data.map(p => ({ id: p.id, name: p.name})));

        } catch (error) {
            console.error('Erro ao buscar projetos:', error);
            setError('Erro ao buscar projetos.'); // Set error state
        }
    }, []); // Correct dependencies

  useEffect(() => {
    fetchProjects()
  }, [fetchProjects]);


  // Carregar dados
    const loadData = useCallback(async () => { // Use useCallback here
        try {
            setIsLoading(true)
            setError(null)

            // Buscar projetos e usuários
            const [usersResponse, tasksResponse] = await Promise.all([
                userManagementService.fetchUsers(),
                taskService.fetchTasks({
                    projectId: projectFilter || undefined,
                    status: statusFilter as TaskSchema['status'] || undefined,
                    limit: ITEMS_PER_PAGE,
                    page: currentPage
                })
            ])

            // Mapear usuários
            const userMap = usersResponse.data.reduce((acc, user) => {
                acc[user.id] = user.name
                return acc
            }, {} as { [key: string]: string })
            setUsers(userMap)

            // Definir tarefas e total de páginas
            setTasks(tasksResponse.data)
            setTotalPages(tasksResponse.totalPages)
        } catch (err: any) {
            console.error('Erro ao carregar dados:', err)
            setError(err.message || 'Falha ao carregar dados')
        } finally {
            setIsLoading(false)
        }
    }, [projectFilter, statusFilter, currentPage, ITEMS_PER_PAGE, setIsLoading, setError, setProjects, setUsers, setTasks, setTotalPages]); // Include setIsLoading and setError

  useEffect(() => {
    loadData()
  }, [loadData, debouncedSearchTerm]); // Simplified dependency

  // Filtrar tarefas
  const filteredTasks = tasks.filter(task =>
    (searchTerm === '' ||
      task.title.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
      task.description.toLowerCase().includes(debouncedSearchTerm.toLowerCase()))
  )

  // Componente de Badge de Status
  const StatusBadgeTask: React.FC<{ status: TaskSchema['status'] }> = ({ status }) => {
    const statusStyles = {
      pending: 'bg-yellow-100 text-yellow-800',
      in_progress: 'bg-blue-100 text-blue-800',
      waiting_approval: 'bg-purple-100 text-purple-800',
      completed: 'bg-green-100 text-green-800',
      blocked: 'bg-red-100 text-red-800'
    }

    const statusLabels = {
      pending: 'Pendente',
      in_progress: 'Em Andamento',
      waiting_approval: 'Aguardando Aprovação',
      completed: 'Concluída',
      blocked: 'Bloqueada'
    }

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusStyles[status]}`}>
        {statusLabels[status]}
      </span>
    )
  }


  const handleDeleteTask = async () => {
    if (!selectedTask) return

    try {
      await taskService.deleteTask(selectedTask.id)
      setTasks(prev => prev.filter(task => task.id !== selectedTask.id))
      setIsDeleteModalOpen(false)
      setSelectedTask(null)
    } catch (err: any) {
      setError(err.message || 'Erro ao excluir tarefa')
    }
  }

    // NEW: Handle new task creation - navigate to the correct route
    const handleNewTask = () => {
        if (selectedNewTaskProject) {
            navigate(`/admin/projects/${selectedNewTaskProject}/create-task`);
        }
    };

  return (
    <Layout role="admin" isLoading={isLoading}>
      <div className="container mx-auto p-6">
        {/* Cabeçalho */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Gerenciamento de Tarefas
            </h1>
            <p className="text-gray-500 text-sm">
              Gerencie e acompanhe todas as tarefas do sistema
            </p>
          </div>
          <div className="flex space-x-4">
            {/* NEW: Project selection for new task */}
            <select
              value={selectedNewTaskProject}
              onChange={(e) => setSelectedNewTaskProject(e.target.value)}
              className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Selecione um Projeto</option>
              {projects.map(project => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
            <button
              onClick={handleNewTask}
              disabled={!selectedNewTaskProject} // Disable if no project is selected
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition shadow-md disabled:opacity-50"
            >
              <Plus className="mr-2" /> Nova Tarefa
            </button>
          </div>
        </div>

        {/* Filtros */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Buscar tarefas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <select
            value={projectFilter}
            onChange={(e) => setProjectFilter(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Todos os Projetos</option>
            {projects.map(project => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Todos os Status</option>
            <option value="pending">Pendente</option>
            <option value="in_progress">Em Andamento</option>
            <option value="waiting_approval">Aguardando Aprovação</option>
            <option value="completed">Concluída</option>
            <option value="blocked">Bloqueada</option>
          </select>
        </div>

        {/* Lista de Tarefas */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {filteredTasks.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl shadow-md">
            <div className="flex justify-center mb-4">
              <CheckCircle className="h-12 w-12 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Nenhuma tarefa encontrada
            </h3>
            <p className="text-gray-500">
              Tente ajustar os filtros ou criar uma nova tarefa.
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
              {filteredTasks.map((task) => {
                const project = projects.find(p => p.id === task.projectId);
                const assignedUserName = users[task.assignedTo] || 'N/A'; // Calculate assigned user's name *first*.
                return (
                <div
                  key={task.id}
                  className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 group"
                >
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <h2 className="text-lg font-semibold text-gray-800 group-hover:text-blue-600 transition">
                        <Link to={`/tasks/${task.id}`}>{task.title}</Link> {/* Correct Link */}
                      </h2>
                      <div className="flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Link to={`/admin/projects/${task.projectId}/edit-task/${task.id}`}>
                            <button
                            className="text-blue-500 hover:text-blue-700"
                            >
                            <Edit size={20} />
                            </button>
                        </Link>
                        <button
                          onClick={() => {
                            setSelectedTask(task)
                            setIsDeleteModalOpen(true)
                          }}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 size={20} />
                        </button>
                      </div>
                    </div>

                    <p className="text-gray-600 mb-4 line-clamp-2">
                      {task.description}
                    </p>
                    <p className="text-sm text-gray-600 mb-2">
                        Projeto: {project ? project.name : 'N/A'}
                    </p>

                    <div className="flex justify-between items-center mb-4">
                      <div className="flex items-center space-x-2">
                        <Users className="text-gray-500" size={16} />
                        <span className="text-gray-600 text-sm truncate max-w-[150px]">
                          {assignedUserName} {/* Use the assignedUserName variable */}
                        </span>
                      </div>
                      <StatusBadgeTask status={task.status} />
                    </div>

                    <div className="flex justify-between items-center">
                      <div className="flex items-center space-x-2">
                        <Clock className="text-gray-500" size={16} />
                        <span className="text-gray-600 text-sm">
                          {new Date(task.dueDate).toLocaleDateString()}
                        </span>
                      </div>
                      <span className="text-sm text-yellow-600 font-medium flex items-center">
                        <span className="mr-1">🪙</span>
                        {task.coinsReward}
                      </span>
                    </div>
                  </div>
                </div>
                );
              })}
            </div>

            {/* Paginação */}
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">
                Página {currentPage} de {totalPages}
              </span>
              <div className="flex space-x-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 border rounded-lg disabled:opacity-50 flex items-center hover:bg-gray-100 transition"
                >
                  <ChevronLeft className="mr-2" /> Anterior
                </button>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 border rounded-lg disabled:opacity-50 flex items-center hover:bg-gray-100 transition"
                >
                  Próximo <ChevronRight className="ml-2" />
                </button>
              </div>
            </div>
          </>
        )}

        {/* Modais */}
            <DeleteConfirmationModal
              isOpen={isDeleteModalOpen}
              onClose={() => {
                setIsDeleteModalOpen(false)
                setSelectedTask(null)
              }}
              onConfirm={handleDeleteTask}
              itemName={selectedTask ? selectedTask.title : ''}
              warningMessage="A exclusão de uma tarefa removerá permanentemente todas as suas informações do sistema."
            />
      </div>
    </Layout>
  )
}
