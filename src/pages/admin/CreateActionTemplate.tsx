// Partial fix for the most critical issue
import React, { useState, useEffect, useCallback } from 'react'
import { Layout } from '../../components/Layout'
import { actionTemplateService } from '../../services/ActionTemplateService'
import { ActionTemplateSchema, TaskAction } from '../../types/firestore-schema'
import { PlusCircle, Save, XCircle, Plus, Trash2, ChevronLeft, ChevronRight, File, FileText, Type, List, Settings, ArrowUp, ArrowDown, FileEdit, Info } from 'lucide-react' // Added Info icon
import { DeleteConfirmationModal } from '../../components/modals/DeleteConfirmationModal';
import { deepCopy } from '../../utils/helpers'; // Import deepCopy

const getActionIcon = (type: TaskAction['type']) => {
  switch (type) {
    case 'text':
      return <Type size={16} />;
    case 'long_text':
      return <FileText size={16} />;
    case 'file_upload':
      return <File size={16} />;
    case 'date':
      return <List size={16} />;
    case 'info': // Added case for 'info'
      return <Info size={16} />;
    default:
      return null;
  }
};

// --- Componente Modal para Gerenciar Modelos ---
interface ManageTemplatesModalProps {
  isOpen: boolean;
  onClose: () => void;
  templates: ActionTemplateSchema[];
  onDelete: (id: string) => void;
  onReorder: (templates: ActionTemplateSchema[]) => void;
}

// ... (ManageTemplatesModal remains unchanged) ...
const ManageTemplatesModal: React.FC<ManageTemplatesModalProps> = ({ isOpen, onClose, templates, onDelete, onReorder }) => {
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [templateToDelete, setTemplateToDelete] = useState<string | null>(null);
    const [localTemplates, setLocalTemplates] = useState<ActionTemplateSchema[]>(templates);

    useEffect(() => {
        setLocalTemplates(templates);
    }, [templates]);

    const moveTemplate = (fromIndex: number, toIndex: number) => {
        const updatedTemplates = [...localTemplates];
        const [movedTemplate] = updatedTemplates.splice(fromIndex, 1);
        updatedTemplates.splice(toIndex, 0, movedTemplate);
        setLocalTemplates(updatedTemplates);
        onReorder(updatedTemplates);
    };

    if (!isOpen) return null;

  return (
    <>
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg w-96 max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Gerenciar Modelos</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <XCircle size={24} />
          </button>
        </div>
        <ul>
          {localTemplates.map((template, index) => (
            <li key={template.id} className="flex items-center justify-between py-2 border-b last:border-b-0">
              <span>{template.title}</span>
              <div className="flex space-x-2">
                <button
                    onClick={() => moveTemplate(index, index - 1)}
                    disabled={index === 0}
                    className="text-gray-500 hover:text-blue-600 disabled:opacity-50"
                    title="Mover para cima"
                >
                    <ArrowUp size={20} />
                </button>

                <button
                    onClick={() => moveTemplate(index, index + 1)}
                    disabled={index === localTemplates.length - 1}
                    className="text-gray-500 hover:text-blue-600 disabled:opacity-50"
                    title="Mover para baixo"
                >
                    <ArrowDown size={20} />
                </button>

                <button
                  onClick={() => {
                    setTemplateToDelete(template.id);
                    setIsDeleteModalOpen(true);
                  }}
                  className="text-red-500 hover:text-red-700"
                  title="Excluir"
                >
                  <Trash2 size={20} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
    <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
            setIsDeleteModalOpen(false);
            setTemplateToDelete(null);
        }}
        onConfirm={async () => {
            if (templateToDelete) {
                await onDelete(templateToDelete);
                setIsDeleteModalOpen(false);
                setTemplateToDelete(null);
            }
        }}
        itemName={
            templateToDelete
                ? templates.find((t) => t.id === templateToDelete)?.title || "este modelo"
                : "este modelo"
        }
        warningMessage="Esta ação não poderá ser desfeita."
    />
    </>
  );
};


export const CreateActionTemplate: React.FC = () => {
  const [title, setTitle] = useState('')
  const [numSteps, setNumSteps] = useState(1)
  const [currentStep, setCurrentStep] = useState(1)
  const [elementsByStep, setElementsByStep] = useState<{ [step: number]: TaskAction[] }>({})
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [templates, setTemplates] = useState<ActionTemplateSchema[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [isManageModalOpen, setIsManageModalOpen] = useState(false);
  const [saveOption, setSaveOption] = useState<'replace' | 'new' | null>(null); // 'replace', 'new', or null
  const [existingTemplateId, setExistingTemplateId] = useState<string | null>(null); // To store the ID for replacement

  const fetchTemplates = useCallback(async () => {
    try {
      const fetchedTemplates = await actionTemplateService.fetchActionTemplates();
      setTemplates(fetchedTemplates);
    } catch (error) {
      console.error("Error fetching templates:", error);
      setError("Failed to load templates.");
    }
  }, []);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  useEffect(() => {
    const loadTemplate = async () => {
      if (selectedTemplate) {
        try {
          const templateData = await actionTemplateService.getActionTemplateById(selectedTemplate);
          if (templateData) {
            setTitle(templateData.title);
            setExistingTemplateId(templateData.id); // Store the existing ID

            const newElementsByStep: { [step: number]: TaskAction[] } = {};
            let currentStep = 1;
            let currentStepElements: TaskAction[] = [];

            // Iterate through the elements and group them by step
            for (const element of templateData.elements) {
              currentStepElements.push(element);
              if (element.type === 'approval') { // Only approval marks end of step now
                newElementsByStep[currentStep] = currentStepElements;
                currentStep++;
                currentStepElements = []; // Reset for the next step
              }
            }
            // Add any remaining elements to the last step
            if (currentStepElements.length > 0) {
              newElementsByStep[currentStep] = currentStepElements;
            }

            setElementsByStep(newElementsByStep);
            setNumSteps(Object.keys(newElementsByStep).length);
            setCurrentStep(1);
          }
        } catch (error) {
          console.error("Error loading template:", error);
          setError("Failed to load the selected template.");
        }
      } else {
        // Reset if no template is selected
        setTitle('');
        setElementsByStep({});
        setNumSteps(1);
        setCurrentStep(1);
        setExistingTemplateId(null);
      }
    };

    loadTemplate();
  }, [selectedTemplate]);


  const handleAddElement = (type: TaskAction['type']) => {
    setElementsByStep(prev => {
      const currentElements = prev[currentStep] || [];
      let newElement: TaskAction;

      if (type === 'info') {
        newElement = {
          id: Date.now().toString(),
          type,
          title: '', // Initialize infoTitle
          completed: false,
          description: '',
          infoTitle: '',       // Initialize infoTitle
          infoDescription: '', // Initialize infoDescription
          hasAttachments: false, // Initialize hasAttachments
          data: { } // Initialize data, NO fileURLs here
        };
      } else {
        newElement = {
          id: Date.now().toString(),
          type,
          title: '',
          completed: false,
          description: '',
        };
      }
      return {
        ...prev,
        [currentStep]: [...currentElements, newElement]
      };
    });
  };

  const handleRemoveElement = (id: string) => {
    setElementsByStep(prev => {
      const currentElements = prev[currentStep] || [];
      const updatedElements = currentElements.filter(element => element.id !== id);
      return {
        ...prev,
        [currentStep]: updatedElements
      };
    });
  };

  const handleElementChange = (id: string, field: keyof TaskAction, value: any) => {
    setElementsByStep(prev => {
      const currentElements = prev[currentStep] || [];
      const updatedElements = currentElements.map(element =>
        element.id === id ? { ...element, [field]: value } : element
      );
      return {
        ...prev,
        [currentStep]: updatedElements
      };
    });
  };


  const handleNumStepsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    setNumSteps(isNaN(value) || value < 1 ? 1 : value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const allElements: TaskAction[] = [];
      for (let i = 1; i <= numSteps; i++) {
        if (elementsByStep[i]) {
          // Filter out data and other unnecessary fields, handling 'info' type
          const stepElements = elementsByStep[i].map(element => {
            // Add the completed property to make TypeScript happy
            const completeElement = {
              ...element,
              completed: false
            };
            
            if (element.type === 'info') {
              const { completed, completedAt, completedBy, attachments, ...infoElement } = completeElement;
              return { ...infoElement, completed: false };
            }
            
            const { data, ...rest } = completeElement;
            return data === undefined ? rest : completeElement;
          });
          allElements.push(...stepElements);
        }
      }

      const newTemplate: Omit<ActionTemplateSchema, 'id'> = {
        title,
        type: 'custom',  // Assuming a 'custom' type for user-created templates
        elements: allElements,
        order: Date.now()
      };

      // Check if replacing or creating new
      if (saveOption === 'replace' && existingTemplateId) {
        await actionTemplateService.updateActionTemplate(existingTemplateId, newTemplate);
        setSuccess(true);
      } else {
        // Check for title uniqueness if creating new
        const existingTemplates = await actionTemplateService.fetchActionTemplates();
        if (existingTemplates.some(t => t.title === title)) {
          setError("Já existe um modelo com este título. Por favor, escolha um título diferente.");
          setIsLoading(false);
          return; // Stop the process
        }

        await actionTemplateService.createActionTemplate(newTemplate);
        setSuccess(true);
        // Reset form only on successful *creation*
        setTitle('');
        setElementsByStep({});
        setNumSteps(1);
        setCurrentStep(1);
        setSelectedTemplate('');
      }

      await fetchTemplates(); // Refresh templates list in all cases

    } catch (err: any) {
      setError(err.message || 'Falha ao criar modelo de ação');
    } finally {
      setIsLoading(false);
      setSaveOption(null); // Reset save option
    }
  };

  const handleDeleteTemplate = async (templateId: string) => {
    try {
      await actionTemplateService.deleteActionTemplate(templateId);
      await fetchTemplates();
    } catch (error) {
      console.error("Error deleting template:", error);
      setError("Failed to delete the template.");
    }
  };

  const handleReorderTemplates = async (newTemplatesOrder: ActionTemplateSchema[]) => {
    try {
      setTemplates(newTemplatesOrder);
      await actionTemplateService.updateTemplateOrder(newTemplatesOrder);
    } catch (error) {
      console.error("Error reordering templates:", error);
      setError("Failed to reorder templates.");
    }
  };

  useEffect(() => {
    setElementsByStep(prev => {
      const newElements = { ...prev };
      for (let i = 1; i <= numSteps; i++) {
        if (!newElements[i]) {
          newElements[i] = [];
        }
      }
      Object.keys(newElements).forEach(key => {
        const stepNum = parseInt(key, 10);
        if (stepNum > numSteps) {
          delete newElements[stepNum];
        }
      });
      return newElements;
    });

    if (currentStep > numSteps) {
      setCurrentStep(numSteps);
    }
  }, [numSteps]);

  const isFormValid = () => {
    if (!title.trim()) return false;
    for (let i = 1; i <= numSteps; i++) {
      const stepElements = elementsByStep[i] || [];
      for (const element of stepElements) {
        if (!element.title.trim() || !element.description?.trim()) {
          return false;
        }
      }
    }
    return true;
  };

  return (
    <Layout role="admin">
      <div className="container mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 flex items-center">
            <PlusCircle className="mr-3 text-blue-600" />
            Criar Modelo de Ação
          </h1>
          <div className="flex space-x-2">
            <select
              value={selectedTemplate}
              onChange={(e) => setSelectedTemplate(e.target.value)}
              className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Selecione um Modelo</option>
              {templates.map(template => (
                <option key={template.id} value={template.id}>
                  {template.title}
                </option>
              ))}
            </select>
            <button
              onClick={() => setIsManageModalOpen(true)}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
              title="Gerenciar Modelos"
            >
              <Settings size={20} />
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
            <strong className="font-bold">Erro: </strong>
            <span className="block sm:inline"> {error}</span>
          </div>
        )}

        {success && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4" role="alert">
            <strong className="font-bold">Sucesso! </strong>
            <span className="block sm:inline"> Modelo de ação criado.</span>
          </div>
        )}

        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="mb-4">
            <label htmlFor="title" className="block text-sm font-medium text-gray-700">
              Título do Modelo
            </label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          <div className="mb-4">
            <label htmlFor="numSteps" className="block text-sm font-medium text-gray-700">
              Número de Etapas
            </label>
            <input
              type="number"
              id="numSteps"
              value={numSteps}
              onChange={handleNumStepsChange}
              min="1"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4">
            <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${(currentStep / numSteps) * 100}%` }}></div>
          </div>

          <div className="mb-4">
            <h2 className="text-lg font-semibold mb-2">Etapa {currentStep} de {numSteps}</h2>
            <div className="space-y-2">
              {elementsByStep[currentStep]?.map((element, index) => (
                <div key={element.id} className="border rounded-md p-4 flex items-center">
                    <span className="mr-2 text-gray-600">
                        {getActionIcon(element.type)}
                    </span>

                    <div className="flex-1 mr-2 space-y-2">
                        <input
                            type="text"
                            value={element.title}
                            onChange={(e) => handleElementChange(element.id, 'title', e.target.value)}
                            placeholder={`Título`}
                            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring focus:border-blue-300 text-gray-900"
                        />
                        <textarea
                            value={element.description || ''}
                            onChange={(e) => handleElementChange(element.id, 'description', e.target.value)}
                            placeholder="Descrição"
                            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring focus:border-blue-300  text-gray-900"
                        />
                        {element.type === 'info' && (
                            <>
                                <input
                                    type="text"
                                    value={element.infoTitle || ''}
                                    onChange={(e) => handleElementChange(element.id, 'infoTitle', e.target.value)}
                                    placeholder="Título das Informações Importantes"
                                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring focus:border-blue-300 text-gray-900"
                                />
                                <textarea
                                    value={element.infoDescription || ''}
                                    onChange={(e) => handleElementChange(element.id, 'infoDescription', e.target.value)}
                                    placeholder="Descrição das Informações Importantes"
                                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring focus:border-blue-300 text-gray-900"
                                />
                                <label className="flex items-center">
                                    <input
                                        type="checkbox"
                                        checked={element.hasAttachments || false}
                                        onChange={(e) => handleElementChange(element.id, 'hasAttachments', e.target.checked)}
                                        className="mr-2"
                                    />
                                    Requer arquivos?
                                </label>
                            </>
                        )}
                    </div>

                  <button
                    type="button"
                    onClick={() => handleRemoveElement(element.id)}
                    className="text-red-500 hover:text-red-700"
                    title="Remover etapa"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>

            <div className="mt-4 flex space-x-2">
              <button
                type="button"
                onClick={() => handleAddElement('text')}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                title="Adicionar campo de texto curto"
              >
                <Plus className="mr-1" size={16} /> Texto
              </button>
              <button
                type="button"
                onClick={() => handleAddElement('long_text')}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                title="Adicionar campo de texto longo"
              >
                <Plus className="mr-1" size={16} /> Texto Longo
              </button>
              <button
                type="button"
                onClick={() => handleAddElement('file_upload')}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                title="Adicionar upload de arquivo"
              >
                <Plus className="mr-1" size={16} /> Arquivo
              </button>
              <button
                type="button"
                onClick={() => handleAddElement('date')}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                title="Adicionar seleção de data"
              >
                <Plus className="mr-1" size={16} /> Data
              </button>
              <button
                type="button"
                onClick={() => handleAddElement('info')}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                title="Adicionar Informações Importantes"
              >
                <Plus className="mr-1" size={16} /> Informações
              </button>
            </div>
          </div>

          <div className="flex justify-between mt-6">
            <button
              type="button"
              onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
              disabled={currentStep === 1}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 disabled:opacity-50 flex items-center"
            >
              <ChevronLeft size={16} className="mr-1" /> Anterior
            </button>
            <button
              type="button"
              onClick={() => setCurrentStep(Math.min(numSteps, currentStep + 1))}
              disabled={currentStep === numSteps}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 disabled:opacity-50 flex items-center"
            >
              Próximo <ChevronRight size={16} className="ml-1" />
            </button>
          </div>
        </div>

        <div className="mt-4">
            {/* Conditional rendering based on whether a template is selected */}
            {existingTemplateId ? (
                <>
                    <button
                        type="button"
                        onClick={() => setSaveOption('replace')}
                        disabled={isLoading || !isFormValid()}
                        className={`w-full px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 disabled:opacity-50 flex items-center justify-center mb-2`}
                    >
                        {isLoading ? 'Salvando...' : 'Substituir Modelo Existente'}
                        <Save className="ml-2" />
                    </button>
                    <button
                        type="button"
                        onClick={() => setSaveOption('new')}
                        disabled={isLoading || !isFormValid()}
                        className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center"
                    >
                        {isLoading ? 'Salvando...' : 'Salvar como Novo Modelo'}
                        <Save className="ml-2" />
                    </button>
                </>
            ) : (
                <button
                    type="submit"
                    onClick={handleSubmit}
                    disabled={isLoading || !isFormValid()}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center"
                >
                    {isLoading ? 'Salvando...' : 'Salvar Modelo'}
                    <Save className="ml-2" />
                </button>
            )}
        </div>
      </div>

      <ManageTemplatesModal
        isOpen={isManageModalOpen}
        onClose={() => setIsManageModalOpen(false)}
        templates={templates}
        onDelete={handleDeleteTemplate}
        onReorder={handleReorderTemplates}
      />
        {/* Confirmation Modal for Save Option */}
        {saveOption && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white p-6 rounded-lg shadow-lg">
                    <p className="mb-4">
                        {saveOption === 'replace'
                            ? 'Tem certeza que deseja substituir o modelo existente?'
                            : 'Criar um novo modelo com este título irá sobrescrever qualquer modelo existente com o mesmo nome. Deseja continuar?'
                        }
                    </p>
                    <div className="flex justify-end space-x-4">
                        <button
                            onClick={() => setSaveOption(null)}
                            className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleSubmit}
                            className={`px-4 py-2 text-white rounded ${saveOption === 'replace' ? 'bg-yellow-500 hover:bg-yellow-600' : 'bg-blue-600 hover:bg-blue-700'}`}
                        >
                            {saveOption === 'replace' ? 'Substituir' : 'Criar Novo'}
                        </button>
                    </div>
                </div>
            </div>
        )}
    </Layout>
  )
}
