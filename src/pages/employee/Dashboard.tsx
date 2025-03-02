import React, { useState, useEffect } from 'react'
import { Layout } from '../../components/Layout'
import {
  Target,
  CheckCircle,
  Clock,
  Award,
  TrendingUp
} from 'lucide-react'

const StatCard: React.FC<{
  icon: React.ElementType,
  title: string,
  value: string,
  color: string
}> = ({ icon: Icon, title, value, color }) => (
  <div className="bg-white p-4 rounded-xl shadow-md flex items-center space-x-4 animate-fade-in">
    <div className={`p-3 rounded-full ${color} bg-opacity-10`}>
      <Icon className={`${color} w-6 h-6`} />
    </div>
    <div>
      <p className="text-sm text-gray-500">{title}</p>
      <h3 className="text-xl font-bold text-gray-800">{value}</h3>
    </div>
  </div>
)

export const EmployeeDashboard: React.FC = () => {
    const [isLoading, setIsLoading] = useState(true);
  const [tasks] = useState([
    {
      id: '1',
      title: 'Desenvolver Componente UI',
      project: 'Novo Produto',
      status: 'in_progress',
      dueDate: '15/03/2024',
      coinReward: 50
    },
    {
      id: '2',
      title: 'Relatório de Marketing',
      project: 'Marketing Digital',
      status: 'waiting_approval',
      dueDate: '28/02/2024',
      coinReward: 30
    }
  ])

  const [rewardHistory] = useState([
    {
      id: '1',
      description: 'Tarefa: Desenvolver Protótipo',
      coins: 75,
      date: '20/02/2024'
    },
    {
      id: '2',
      description: 'Bônus de Desempenho',
      coins: 100,
      date: '01/02/2024'
    }
  ])

    useEffect(() => {
        // Simulate data fetching
        const timer = setTimeout(() => {
            setIsLoading(false);
        }, 750);

        return () => clearTimeout(timer);
    }, []);

  const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
    const statusStyles = {
      'pending': 'bg-yellow-100 text-yellow-800',
      'in_progress': 'bg-blue-100 text-blue-800',
      'waiting_approval': 'bg-purple-100 text-purple-800',
      'completed': 'bg-green-100 text-green-800'
    }

    const statusLabels = {
      'pending': 'Pendente',
      'in_progress': 'Em Andamento',
      'waiting_approval': 'Aguardando',
      'completed': 'Concluída'
    }

    return (
      <span className={`px-2 py-1 rounded-full text-xs ${statusStyles[status]}`}>
        {statusLabels[status]}
      </span>
    )
  }

  return (
    <Layout role="employee" isLoading={isLoading}>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
            Meu Painel
          </h1>
          <div className="flex items-center space-x-2 bg-yellow-100 px-3 py-1 rounded-lg">
            <Award className="text-yellow-600 w-5 h-5" />
            <span className="font-semibold text-yellow-800 text-sm">
              225 Moedas
            </span>
          </div>
        </div>

        {/* Grid de Estatísticas */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            icon={Target}
            title="Tarefas Ativas"
            value="2"
            color="text-blue-600"
          />
          <StatCard
            icon={CheckCircle}
            title="Concluídas"
            value="15"
            color="text-green-600"
          />
          <StatCard
            icon={Clock}
            title="Pendentes"
            value="5"
            color="text-yellow-600"
          />
          <StatCard
            icon={TrendingUp}
            title="Moedas Ganhas"
            value="175"
            color="text-purple-600"
          />
        </div>

        {/* Seções de Detalhes */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Minhas Tarefas */}
          <div className="bg-white p-6 rounded-xl shadow-md">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <Target className="mr-2 text-blue-600" />
              Minhas Tarefas
            </h2>
            {tasks.map((task) => (
              <div
                key={task.id}
                className="mb-4 pb-4 border-b last:border-b-0 flex justify-between items-center"
              >
                <div>
                  <h3 className="font-medium text-gray-800 text-sm">
                    {task.title}
                  </h3>
                  <p className="text-xs text-gray-500">{task.project}</p>
                </div>
                <div className="flex flex-col items-end space-y-1">
                  <StatusBadge status={task.status} />
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-gray-500">{task.dueDate}</span>
                    <span className="text-yellow-600 font-semibold text-xs">
                      {task.coinReward} 🪙
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Histórico de Recompensas */}
          <div className="bg-white p-6 rounded-xl shadow-md">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <Award className="mr-2 text-yellow-600" />
              Histórico de Recompensas
            </h2>
            {rewardHistory.map((reward) => (
              <div
                key={reward.id}
                className="mb-4 pb-4 border-b last:border-b-0 flex justify-between items-center"
              >
                <div>
                  <h3 className="font-medium text-gray-800 text-sm">
                    {reward.description}
                  </h3>
                  <p className="text-xs text-gray-500">{reward.date}</p>
                </div>
                <span className="text-yellow-600 font-semibold text-sm">
                  +{reward.coins} 🪙
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  )
}
