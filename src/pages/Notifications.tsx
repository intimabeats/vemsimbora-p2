import React, { useState, useEffect } from 'react'
import { Layout } from '../components/Layout'
import { Bell, CheckCircle, AlertTriangle, XCircle, Clock, Search, Filter, Trash2 } from 'lucide-react'
import { notificationService } from '../services/NotificationService'
import { useAuth } from '../context/AuthContext'
import { NotificationSchema } from '../types/firestore-schema'
import { Link } from 'react-router-dom'

export const Notifications: React.FC = () => {
  const [notifications, setNotifications] = useState<NotificationSchema[]>([])
  const [filteredNotifications, setFilteredNotifications] = useState<NotificationSchema[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<string>('all')
  const { currentUser } = useAuth()

  useEffect(() => {
    const fetchNotifications = async () => {
      setIsLoading(true)
      setError(null)
      try {
        if (currentUser) {
          const userNotifications = await notificationService.getUserNotifications(currentUser.uid)
          setNotifications(userNotifications)
          setFilteredNotifications(userNotifications)
        }
      } catch (error: any) {
        console.error('Erro ao buscar notificações:', error)
        setError('Não foi possível carregar as notificações. Por favor, tente novamente mais tarde.')
      } finally {
        setIsLoading(false)
      }
    }

    fetchNotifications()
  }, [currentUser])

  // Apply filters and search
  useEffect(() => {
    if (!notifications.length) return

    let result = [...notifications]

    // Apply type filter
    if (filterType !== 'all') {
      result = result.filter(notification => notification.type === filterType)
    }

    // Apply search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      result = result.filter(
        notification => 
          notification.title.toLowerCase().includes(term) || 
          notification.message.toLowerCase().includes(term)
      )
    }

    setFilteredNotifications(result)
  }, [notifications, filterType, searchTerm])

  const handleMarkAllAsRead = async () => {
    try {
      if (currentUser) {
        setIsLoading(true)
        await notificationService.markAllNotificationsAsRead(currentUser.uid)
        
        // Update notifications to mark all as read
        const updatedNotifications = notifications.map(notification => ({
          ...notification,
          read: true
        }))
        
        setNotifications(updatedNotifications)
        setFilteredNotifications(updatedNotifications)
        setIsLoading(false)
      }
    } catch (error) {
      console.error('Erro ao marcar todas as notificações como lidas:', error)
      setError('Não foi possível marcar as notificações como lidas.')
      setIsLoading(false)
    }
  }

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      if (currentUser) {
        await notificationService.markNotificationAsRead(currentUser.uid, notificationId)
        
        // Update local state
        const updatedNotifications = notifications.map(notification => 
          notification.id === notificationId 
            ? { ...notification, read: true } 
            : notification
        )
        
        setNotifications(updatedNotifications)
        setFilteredNotifications(
          filteredNotifications.map(notification => 
            notification.id === notificationId 
              ? { ...notification, read: true } 
              : notification
          )
        )
      }
    } catch (error) {
      console.error('Erro ao marcar notificação como lida:', error)
    }
  }

  const handleDeleteNotification = async (notificationId: string) => {
    try {
      if (currentUser) {
        // Remove from local state first for immediate UI update
        setNotifications(prev => prev.filter(n => n.id !== notificationId))
        setFilteredNotifications(prev => prev.filter(n => n.id !== notificationId))
        
        // Then delete from backend
        // Note: This is a placeholder - you'll need to implement the actual delete method in your service
        // await notificationService.deleteNotification(currentUser.uid, notificationId)
      }
    } catch (error) {
      console.error('Erro ao excluir notificação:', error)
    }
  }

  // Helper function to get notification icon based on type
  const getNotificationIcon = (type: NotificationSchema['type']) => {
    switch (type) {
      case 'task_created':
      case 'task_completed':
        return <CheckCircle className="text-green-500" />
      case 'task_assigned':
      case 'task_updated':
        return <Clock className="text-blue-500" />
      case 'system_alert':
        return <AlertTriangle className="text-red-500" />
      case 'reward_earned':
        return <CheckCircle className="text-yellow-500" />
      case 'project_update':
        return <Bell className="text-purple-500" />
      default:
        return <Bell className="text-gray-500" />
    }
  }

  // Format date for display
  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp)
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Get notification type label
  const getTypeLabel = (type: NotificationSchema['type']) => {
    switch (type) {
      case 'task_created': return 'Tarefa Criada'
      case 'task_assigned': return 'Tarefa Atribuída'
      case 'task_completed': return 'Tarefa Concluída'
      case 'task_updated': return 'Tarefa Atualizada'
      case 'project_update': return 'Atualização de Projeto'
      case 'reward_earned': return 'Recompensa Recebida'
      case 'system_alert': return 'Alerta do Sistema'
      default: return 'Notificação'
    }
  }

  return (
    <Layout role={currentUser?.role} isLoading={isLoading}>
      <div className="container mx-auto p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 flex items-center">
            <Bell className="mr-3 text-blue-600" />
            Notificações
          </h1>
          
          <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
            <div className="relative flex-grow">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="text-gray-400" size={18} />
              </div>
              <input
                type="text"
                placeholder="Buscar notificações..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
              />
            </div>
            
            <div className="relative">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none w-full"
              >
                <option value="all">Todos os tipos</option>
                <option value="task_created">Tarefas Criadas</option>
                <option value="task_assigned">Tarefas Atribuídas</option>
                <option value="task_completed">Tarefas Concluídas</option>
                <option value="task_updated">Tarefas Atualizadas</option>
                <option value="project_update">Atualizações de Projeto</option>
                <option value="reward_earned">Recompensas</option>
                <option value="system_alert">Alertas do Sistema</option>
              </select>
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Filter className="text-gray-400" size={18} />
              </div>
            </div>
            
            <button
              onClick={handleMarkAllAsRead}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition flex items-center justify-center whitespace-nowrap"
              disabled={notifications.every(n => n.read) || isLoading}
            >
              <CheckCircle className="mr-2" size={18} />
              Marcar Todas como Lidas
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-6 flex items-center">
            <AlertTriangle className="mr-2" />
            {error}
          </div>
        )}

        {filteredNotifications.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md p-12 text-center">
            <Bell className="mx-auto h-16 w-16 text-gray-300 mb-4" />
            <p className="text-gray-500 text-lg">
              {searchTerm || filterType !== 'all'
                ? 'Nenhuma notificação encontrada com os filtros atuais.'
                : 'Você não tem notificações.'}
            </p>
            {(searchTerm || filterType !== 'all') && (
              <button
                onClick={() => {
                  setSearchTerm('')
                  setFilterType('all')
                }}
                className="mt-4 text-blue-600 hover:text-blue-800 transition"
              >
                Limpar filtros
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredNotifications.map((notification) => {
              const icon = getNotificationIcon(notification.type)
              const typeLabel = getTypeLabel(notification.type)
              
              return (
                <div
                  key={notification.id}
                  className={`flex items-start p-5 rounded-lg shadow-md transition-all ${
                    notification.read ? 'bg-gray-50' : 'bg-white border-l-4 border-blue-500'
                  }`}
                >
                  <div className="mr-4 mt-1">{icon}</div>
                  
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <div>
                        <h2 className={`text-lg font-semibold ${notification.read ? 'text-gray-700' : 'text-gray-800'}`}>
                          {notification.title}
                        </h2>
                        <span className="inline-block px-2 py-1 bg-gray-100 text-xs rounded-full text-gray-600 mb-2">
                          {typeLabel}
                        </span>
                      </div>
                      
                      <div className="flex space-x-2">
                        {!notification.read && (
                          <button
                            onClick={() => handleMarkAsRead(notification.id)}
                            className="text-blue-600 hover:text-blue-800 p-1 rounded-full hover:bg-blue-50 transition"
                            title="Marcar como lida"
                          >
                            <CheckCircle size={18} />
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteNotification(notification.id)}
                          className="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-50 transition"
                          title="Excluir notificação"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                    
                    <p className={`text-gray-600 mb-2 ${notification.read ? 'text-gray-500' : 'text-gray-700'}`}>
                      {notification.message}
                    </p>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-500">
                        {formatDate(notification.timestamp)}
                      </span>
                      
                      {notification.relatedEntityId && (
                        <Link
                          to={`/tasks/${notification.relatedEntityId}`}
                          className="text-blue-600 hover:text-blue-800 text-sm hover:underline flex items-center"
                        >
                          Ver Tarefa
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </Layout>
  )
}
