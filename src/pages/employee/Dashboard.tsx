import React from 'react'
import { Layout } from '../../components/Layout'
import { Construction } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

export const EmployeeDashboard: React.FC = () => {
  const { currentUser } = useAuth()

  return (
    <Layout role="employee">
      <div className="container mx-auto p-6">
        <div className="bg-white rounded-xl shadow-md p-12 text-center">
          <Construction className="mx-auto h-16 w-16 text-blue-500 mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Área em Construção</h2>
          <p className="text-gray-600 mb-4">
            Olá, {currentUser?.displayName || 'Funcionário'}! O painel de funcionários está em desenvolvimento.
          </p>
          <p className="text-gray-500">
            Em breve você terá acesso a todas as funcionalidades do sistema.
          </p>
        </div>
      </div>
    </Layout>
  )
}
