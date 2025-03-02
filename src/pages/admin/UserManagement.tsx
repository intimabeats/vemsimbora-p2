import React, { useState, useEffect, useCallback } from 'react'
import { Layout } from '../../components/Layout'
import {
  Plus,
  Edit,
  Trash2,
  Search,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { UserSchema } from '../../types/firestore-schema'
import { userManagementService } from '../../services/UserManagementService' // Corrected import
import { CreateUserModal } from '../../components/modals/CreateUserModal'
import { EditUserModal } from '../../components/modals/EditUserModal'
import { DeleteConfirmationModal } from '../../components/modals/DeleteConfirmationModal'
import useDebounce from '../../utils/useDebounce'
import { getDefaultProfileImage } from '../../utils/user'

export const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<UserSchema[]>([])
  const [isLoading, setLoading] = useState(true)
  const [filter, setFilter] = useState<{
    role?: UserSchema['role']
    status?: UserSchema['status']
  }>({})
  const [searchTerm, setSearchTerm] = useState('')
  const debouncedSearchTerm = useDebounce(searchTerm, 500)

  // Paginação
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const itemsPerPage = 10

  // Modais
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<UserSchema | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)

    const fetchUsers = useCallback(async () => {
    try {
      setLoading(true)
      const fetchedUsers = await userManagementService.fetchUsers({
        role: filter.role,
        status: filter.status,
        limit: itemsPerPage,
        page: currentPage,
        searchTerm: debouncedSearchTerm // Use debounced term
      })

      setUsers(fetchedUsers.data)
      setTotalPages(fetchedUsers.totalPages)
    } catch (error) {
      console.error('Erro ao buscar usuários:', error)
    } finally {
      setLoading(false)
    }
  }, [filter.role, filter.status, currentPage, itemsPerPage, debouncedSearchTerm]) // Include debouncedSearchTerm

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers]) // Simplified dependency

  const handleDeleteUser = async () => {
    if (!selectedUser) return

    try {
      await userManagementService.deleteUser(selectedUser.id)
      setUsers(prevUsers =>
        prevUsers.filter(user => user.id !== selectedUser.id)
      )
      setSelectedUser(null)
      setIsDeleteModalOpen(false)
    } catch (error) {
      console.error('Erro ao excluir usuário:', error)
    }
  }

  const handleEditUser = (user: UserSchema) => {
    setSelectedUser(user)
    setIsEditModalOpen(true)
  }

  const handleDeleteConfirmation = (user: UserSchema) => {
    setSelectedUser(user)
    setIsDeleteModalOpen(true)
  }

  const handleUserCreated = (newUser: UserSchema) => {
    setUsers(prevUsers => [newUser, ...prevUsers])
  }

  const handleUserUpdated = (updatedUser: UserSchema) => {
    setUsers(prevUsers =>
      prevUsers.map(user =>
        user.id === updatedUser.id ? updatedUser : user
      )
    )
  }

  const RoleBadge: React.FC<{ role: UserSchema['role'] }> = ({ role }) => {
    const roleStyles = {
      admin: 'bg-red-100 text-red-800',
      manager: 'bg-blue-100 text-blue-800',
      employee: 'bg-green-100 text-green-800'
    }

    return (
      <span className={`px-2 py-1 rounded-full text-xs ${roleStyles[role]}`}>
        {role.charAt(0).toUpperCase() + role.slice(1)}
      </span>
    )
  }

  return (
    <Layout role="admin" isLoading={isLoading}>
      <div className="container mx-auto p-6">
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-800 flex items-center">
                 Gerenciamento de Usuários
              </h1>
              <p className="text-gray-500 text-sm">
                Gerencie e acompanhe todos os usuários do sistema.
              </p>
            </div>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center hover:bg-blue-700 transition"
            >
              <Plus className="mr-2" /> Adicionar Usuário
            </button>
          </div>

          {/* Filtros e Busca */}
          <div className="md:flex md:space-x-4 mb-6">
            <div className="relative flex-grow mb-4 md:mb-0">
              <input
                type="text"
                placeholder="Buscar usuários..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <Search className="absolute left-3 top-3 text-gray-400" size={20} />
            </div>

            <select
              value={filter.role || ''}
              onChange={(e) =>
                setFilter({
                  ...filter,
                  role: e.target.value as UserSchema['role']
                })
              }
              className="w-full md:w-auto px-4 py-2 border rounded-lg mb-4 md:mb-0"
            >
              <option value="">Todos os Cargos</option>
              <option value="admin">Administradores</option>
              <option value="manager">Gestores</option>
              <option value="employee">Funcionários</option>
            </select>

            <select
              value={filter.status || ''}
              onChange={(e) =>
                setFilter({
                  ...filter,
                  status: e.target.value as UserSchema['status']
                })
              }
              className="w-full md:w-auto px-4 py-2 border rounded-lg"
            >
              <option value="">Todos os Status</option>
              <option value="active">Ativos</option>
              <option value="inactive">Inativos</option>
              <option value="suspended">Suspensos</option>
            </select>
          </div>

          {/* Lista de Usuários (Grid Layout) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {users.length === 0 ? (
              <div className="text-center py-4 col-span-full">
                Nenhum usuário encontrado
              </div>
            ) : (
              users.map((user) => (
                <div
                  key={user.id}
                  className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition group"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                      <img
                        src={user.profileImage || getDefaultProfileImage(user.name)}
                        alt={`Foto de ${user.name}`}
                        className="w-10 h-10 rounded-full object-cover mr-4"
                      />
                      <div>
                        <h2 className="text-lg font-semibold text-gray-800">
                          {user.name}
                        </h2>
                        <p className="text-gray-600 text-sm">{user.email}</p>
                      </div>
                    </div>
                    <div className="flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleEditUser(user)}
                        className="text-blue-500 hover:text-blue-700"
                      >
                        <Edit size={20} />
                      </button>
                      <button
                        onClick={() => handleDeleteConfirmation(user)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <RoleBadge role={user.role} />
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${
                        user.status === 'active'
                          ? 'bg-green-100 text-green-800'
                          : user.status === 'inactive'
                          ? 'bg-gray-100 text-gray-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {user.status === 'active'
                        ? 'Ativo'
                        : user.status === 'inactive'
                        ? 'Inativo'
                        : 'Suspenso'}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Paginação */}
          <div className="flex justify-between items-center mt-4">
            <span className="text-sm text-gray-600">
              Página {currentPage} de {totalPages}
            </span>
            <div className="flex space-x-2">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 border rounded-lg disabled:opacity-50 flex items-center"
              >
                <ChevronLeft className="mr-2" /> Anterior
              </button>
              <button
                onClick={() =>
                  setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                }
                disabled={currentPage === totalPages}
                className="px-4 py-2 border rounded-lg disabled:opacity-50 flex items-center"
              >
                Próximo <ChevronRight className="ml-2" />
              </button>
            </div>
          </div>

          {/* Modais */}
          <CreateUserModal
            isOpen={isCreateModalOpen}
            onClose={() => setIsCreateModalOpen(false)}
            onUserCreated={handleUserCreated}
          />

          {selectedUser && (
            <>
              <EditUserModal
                user={selectedUser}
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                onUserUpdated={handleUserUpdated}
              />

              <DeleteConfirmationModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleDeleteUser}
                itemName={selectedUser.name}
                warningMessage="A exclusão de um usuário removerá permanentemente todas as suas informações do sistema."
              />
            </>
          )}
        </div>
      </div>
    </Layout>
  )
}

export default UserManagement
