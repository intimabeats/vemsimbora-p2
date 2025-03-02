import React, { useState, useEffect } from 'react'
import { Layout } from '../../components/Layout'
import {
  CheckCircle,
  MessageCircle,
  Paperclip,
  Send,
  Clock
} from 'lucide-react'

type Task = {
  id: string
  title: string
  description: string
  project: string
  status: 'pending' | 'in_progress' | 'waiting_approval' | 'completed'
  dueDate: string
  assignedTo: string[]
  checklist: { id: string, title: string, completed: boolean }[]
  comments: { user: string, text: string, date: string }[]
  attachments: { id: string, name: string, url: string }[]
}

export const TaskView: React.FC = () => {
    const [isLoading, setIsLoading] = useState(true);
  const [task, setTask] = useState<Task>({
    id: '1',
    title: 'Desenvolver Componente UI',
    description: 'Criar componente de interface para o novo sistema de gerenciamento de tarefas',
    project: 'Novo Produto',
    status: 'in_progress',
    dueDate: '2024-03-15',
    assignedTo: ['Carlos', 'Ana'],
    checklist: [
      { id: '1', title: 'Definir estrutura do componente', completed: true },
      { id: '2', title: 'Criar design responsivo', completed: false },
      { id: '3', title: 'Implementar interações', completed: false }
    ],
    comments: [
      {
        user: 'Maria (Gestor)',
        text: 'Foque na usabilidade e na experiência do usuário',
        date: '2024-02-22'
      }
    ],
    attachments: [
      {
        id: '1',
        name: 'design-mockup.figma',
        url: 'https://example.com/mockup.figma'
      }
    ]
  })

  const [newComment, setNewComment] = useState('')

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsLoading(false);
        }, 600);

        return () => clearTimeout(timer);
    }, []);

  const handleChecklistToggle = (itemId: string) => {
    setTask(prevTask => ({
      ...prevTask,
      checklist: prevTask.checklist.map(item =>
        item.id === itemId
          ? { ...item, completed: !item.completed }
          : item
      )
    }))
  }

  const handleAddComment = () => {
    if (newComment.trim()) {
      setTask(prevTask => ({
        ...prevTask,
        comments: [
          ...prevTask.comments,
          {
            user: 'Carlos',
            text: newComment,
            date: new Date().toISOString().split('T')[0]
          }
        ]
      }))
      setNewComment('')
    }
  }

  const StatusBadge: React.FC<{ status: Task['status'] }> = ({ status }) => {
    const statusStyles = {
      pending: 'bg-yellow-100 text-yellow-800',
      in_progress: 'bg-blue-100 text-blue-800',
      waiting_approval: 'bg-purple-100 text-purple-800',
      completed: 'bg-green-100 text-green-800'
    }

    const statusLabels = {
      pending: 'Pendente',
      in_progress: 'Em Andamento',
      waiting_approval: 'Aguardando Aprovação',
      completed: 'Concluída'
    }

    return (
      <span className={`px-2 py-1 rounded-full text-xs ${statusStyles[status]}`}>
        {statusLabels[status]}
      </span>
    )
  }

  return (
    <Layout role="employee" isLoading={isLoading}>
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">{task.title}</h1>
            <div className="mt-2 flex items-center space-x-4">
              <span className="text-gray-600">{task.project}</span>
              <StatusBadge status={task.status} />
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Clock className="text-gray-500" />
            <span className="text-gray-600">Prazo: {task.dueDate}</span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-8">
          <div className="col-span-2 space-y-6">
            <div className="bg-white p-6 rounded-xl shadow-md">
              <h2 className="text-xl font-semibold mb-4">Descrição</h2>
              <p className="text-gray-600">{task.description}</p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-md">
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <CheckCircle className="mr-2 text-green-600" /> Checklist
              </h2>
              {task.checklist.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center mb-2 pb-2 border-b last:border-b-0"
                >
                  <input
                    type="checkbox"
                    checked={item.completed}
                    onChange={() => handleChecklistToggle(item.id)}
                    className="mr-3 form-checkbox text-blue-600"
                  />
                  <span
                    className={`flex-1 ${item.completed ? 'line-through text-gray-500' : 'text-gray-800'}`}
                  >
                    {item.title}
                  </span>
                </div>
              ))}
            </div>

            <div className="bg-white p-6 rounded-xl shadow-md">
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <MessageCircle className="mr-2 text-blue-600" /> Discussão
              </h2>
              <div className="space-y-4 mb-6">
                {task.comments.map((comment, index) => (
                  <div key={index} className="bg-gray-100 p-4 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-semibold text-gray-800">
                        {comment.user}
                      </span>
                      <span className="text-xs text-gray-500">
                        {comment.date}
                      </span>
                    </div>
                    <p className="text-gray-600">{comment.text}</p>
                  </div>
                ))}
              </div>
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Adicionar comentário..."
                  className="flex-1 px-4 py-2 border rounded-lg"
                />
                <button
                  onClick={handleAddComment}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
                >
                  <Send size={20} />
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl shadow-md">
              <h2 className="text-xl font-semibold mb-4">Detalhes</h2>
              <div className="space-y-3">
                <div>
                  <span className="text-gray-500">Responsáveis</span>
                  <div className="flex space-x-2 mt-1">
                    {task.assignedTo.map((person, index) => (
                      <span
                        key={index}
                        className="bg-gray-100 px-2 py-1 rounded-full text-sm"
                      >
                        {person}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-md">
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <Paperclip className="mr-2 text-gray-600" /> Anexos
              </h2>
              {task.attachments.map((attachment) => (
                <div
                  key={attachment.id}
                  className="flex justify-between items-center mb-2 pb-2 border-b last:border-b-0"
                >
                  <span className="text-gray-600">{attachment.name}</span>
                  <a
                    href={attachment.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    Abrir
                  </a>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-4">
          <button
            className="bg-yellow-500 text-white px-6 py-2 rounded-lg hover:bg-yellow-600 transition"
          >
            Em Andamento
          </button>
          <button
            className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition"
          >
            Marcar como Concluída
          </button>
        </div>
      </div>
    </Layout>
  )
}
