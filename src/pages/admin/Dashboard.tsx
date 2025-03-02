// src/pages/admin/Dashboard.tsx
import React, { useState, useEffect } from 'react'
import { Layout } from '../../components/Layout'
import {
  BarChart2,
  Briefcase,
  Users,
  CheckCircle,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { projectService } from '../../services/ProjectService'
import { userManagementService } from '../../services/UserManagementService'
import { taskService } from '../../services/TaskService'
import { activityService } from '../../services/ActivityService';
import { ActivityLogSchema, ProjectSchema, TaskSchema } from '../../types/firestore-schema';
import { useAuth } from '../../context/AuthContext';

const StatCard: React.FC<{
  icon: React.ElementType,
  title: string,
  value: string | number,
  color: string
}> = ({ icon: Icon, title, value, color }) => (
  <div className={`bg-white p-4 rounded-xl shadow-md flex items-center space-x-4 border border-${color.split('-')[1]}-100`}>
    <div className={`p-3 rounded-full ${color} bg-opacity-20`}>
      <Icon className={`${color} w-6 h-6`} />
    </div>
    <div>
      <p className="text-sm text-gray-500">{title}</p>
      <h3 className="text-xl font-bold text-gray-800">{value}</h3>
    </div>
  </div>
)

// Reusable Progress Bar Component
const ProgressBar: React.FC<{ name: string; progress: number; color: string }> = ({ name, progress, color }) => (
  <div className="mb-2">
    <div className="flex justify-between text-sm text-gray-600 mb-1">
      <span>{name}</span>
      <span>{progress}%</span>
    </div>
    <div className="w-full bg-gray-200 rounded-full h-2">
      <div
        className={`${color} h-2 rounded-full`}
        style={{ width: `${progress}%` }}
      ></div>
    </div>
  </div>
)
const StatusBadge: React.FC<{ status: ProjectSchema['status'] }> = ({ status }) => {
    const statusStyles = {
      planning: 'bg-yellow-100 text-yellow-800',
      active: 'bg-green-100 text-green-800',
      completed: 'bg-blue-100 text-blue-800',
      paused: 'bg-gray-100 text-gray-800',
      cancelled: 'bg-red-100 text-red-800',
      archived: 'bg-gray-400 text-white'
    }

    const statusLabels = {
      planning: 'Planejamento',
      active: 'Ativo',
      completed: 'Concluído',
      paused: 'Pausado',
      cancelled: 'Cancelado',
      archived: 'Arquivado'
    }

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusStyles[status]}`}>
        {statusLabels[status]}
      </span>
    )
  }
// Helper function to calculate project progress
const calculateProjectProgress = (tasks: TaskSchema[]): number => {
  if (!tasks.length) return 0;
  const completedTasks = tasks.filter(task => task.status === 'completed').length;
  return Math.round((completedTasks / tasks.length) * 100);
};


export const AdminDashboard: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [projectCount, setProjectCount] = useState(0);
  const [userCount, setUserCount] = useState(0);
  const [completedTasksCount, setCompletedTasksCount] = useState(0);
  const [pendingTasksCount, setPendingTasksCount] = useState(0);
  const [projects, setProjects] = useState<ProjectSchema[]>([]); // Store projects
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [recentActivities, setRecentActivities] = useState<ActivityLogSchema[]>([]); // Use the new type
  const [error, setError] = useState<string | null>(null);
    const [projectsWithTasks, setProjectsWithTasks] = useState<{ project: ProjectSchema; tasks: TaskSchema[] }[]>([]);
    const { currentUser } = useAuth();


  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const projectsResponse = await projectService.fetchProjects({ limit: 9, page: currentPage, excludeStatus: 'archived' }); // Exclude archived
        const projectsData = projectsResponse.data;
        setProjects(projectsData);
        setTotalPages(projectsResponse.totalPages);
        setProjectCount(projectsResponse.totalProjects); // Get total project count

        const users = await userManagementService.fetchUsers();
        setUserCount(users.totalUsers);

        const completedTasks = await taskService.fetchTasks({ status: 'completed' });
        setCompletedTasksCount(completedTasks.totalTasks);

        const pendingTasks = await taskService.fetchTasks({ status: 'pending' });
        setPendingTasksCount(pendingTasks.totalTasks);

        // Fetch recent activities
        const activities = await activityService.getRecentActivities();
        setRecentActivities(activities);

        // Fetch tasks for each project *before* rendering.
        const projectsWithTasksPromises = projectsData.map(async (project) => {
          const tasksResponse = await taskService.fetchTasks({ projectId: project.id });
          return { project, tasks: tasksResponse.data };
        });
        const projectsWithTasksResult = await Promise.all(projectsWithTasksPromises);
        setProjectsWithTasks(projectsWithTasksResult);

      } catch (err: any) {
        setError(err.message || 'Erro ao buscar dados.');
        console.error("Error fetching data:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [currentPage, currentUser]); // Add currentPage as a dependency


  return (
    <Layout role="admin" isLoading={isLoading}>
      <div className="container mx-auto p-6">
        <div className="space-y-6">
          
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Dashboard</h1>
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Grid de Estatísticas */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard
              icon={Briefcase}
              title="Projetos"
              value={projectCount}
              color="text-blue-600"
            />
            <StatCard
              icon={Users}
              title="Usuários"
              value={userCount}
              color="text-green-600"
            />
            <StatCard
              icon={CheckCircle}
              title="Tarefas Concluídas"
              value={completedTasksCount}
              color="text-purple-600"
            />
            <StatCard
              icon={AlertTriangle}
              title="Pendentes"
              value={pendingTasksCount}
              color="text-yellow-600"
            />
          </div>

          {/* Seções de Detalhes */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Progresso de Projetos */}
            <div className="bg-white p-6 rounded-xl shadow-md">
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <BarChart2 className="mr-2 text-blue-600" />
                Progresso dos Projetos
              </h2>
              <div className="space-y-4">
                {projectsWithTasks.map(({ project, tasks }) => { // Destructure here
                  const progress = calculateProjectProgress(tasks);
                  return (
                    <div key={project.id}>
                    <ProgressBar
                      
                      name={project.name}
                      progress={progress}
                      color="bg-blue-500"
                    />
                    <div className='flex justify-end'>
                    <StatusBadge status={project.status} />
                    </div>
                    </div>
                  );
                })}
              </div>
              {/* Pagination Controls */}
              <div className="flex justify-between items-center mt-4">
                <span className="text-sm text-gray-600">
                  {currentPage} de {totalPages}
                </span>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2 border rounded-lg disabled:opacity-50 flex items-center"
                  >
                    <ChevronLeft className="mr-2" /> Anterior
                  </button>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 border rounded-lg disabled:opacity-50 flex items-center"
                  >
                    Próximo <ChevronRight className="ml-2" />
                  </button>
                </div>
              </div>
            </div>

            {/* Atividade Recente */}
            <div className="bg-white p-6 rounded-xl shadow-md">
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <Users className="mr-2 text-green-600" />
                Atividade Recente
              </h2>
              <div className="space-y-4">
                {recentActivities.map((activity, index) => (
                  <div
                    key={index}
                    className="flex justify-between items-center pb-2 border-b last:border-b-0"
                  >
                    <div>
                      <p className="font-medium text-gray-700 text-sm">{activity.userName}</p>
                      <p className="text-xs text-gray-500">
                        {activity.type === 'project_created' && `Criou o projeto ${activity.projectName}`}
                        {activity.type === 'project_updated' && `Atualizou o projeto ${activity.projectName}`}
                        {activity.type === 'task_created' && `Criou a tarefa ${activity.taskName} no projeto ${activity.projectName}`}
                        {activity.type === 'task_updated' && `Atualizou a tarefa ${activity.taskName} no projeto ${activity.projectName}`}
                        {activity.type === 'task_completed' && `Completou a tarefa ${activity.taskName} no projeto ${activity.projectName}`}
                        {activity.type === 'task_status_update' && `Alterou o status da tarefa ${activity.taskName} para ${activity.newStatus}`}
                        {/* Add more activity types as needed */}
                      </p>
                    </div>
                    <span className="text-xs text-gray-400">
                      {new Date(activity.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}
