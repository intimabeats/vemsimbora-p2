import React, { useState, useRef } from 'react';
import { TaskAction } from '../types/firestore-schema';
import { 
  Save, X, Plus, Trash2, FileText, Type, List, 
  Calendar, Image, Video, Mic, Info
} from 'lucide-react';

interface ActionViewProps {
  action: TaskAction;
  onComplete: (actionId: string, data?: any) => void;
  onCancel: () => void;
  taskId: string;
  isOpen: boolean;
}

export const ActionView: React.FC<ActionViewProps> = ({
  action,
  onComplete,
  onCancel,
  taskId,
  isOpen
}) => {
  const [editedAction, setEditedAction] = useState<TaskAction>({...action});
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const handleChange = (field: keyof TaskAction, value: any) => {
    setEditedAction(prev => ({
      ...prev,
      [field]: value
    }));
  };
  
  const handleSave = () => {
    onComplete(editedAction.id, editedAction);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    // Handle file upload logic here
  };

  // Render fields based on action type
  const renderTypeSpecificFields = () => {
    switch (editedAction.type) {
      case 'info':
        return (
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Info Title
              </label>
              <input
                type="text"
                value={editedAction.infoTitle || ''}
                onChange={(e) => handleChange('infoTitle', e.target.value)}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring focus:border-blue-300"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Info Description
              </label>
              <textarea
                value={editedAction.infoDescription || ''}
                onChange={(e) => handleChange('infoDescription', e.target.value)}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring focus:border-blue-300 h-24"
              />
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="hasAttachments"
                checked={editedAction.hasAttachments || false}
                onChange={(e) => handleChange('hasAttachments', e.target.checked)}
                className="mr-2"
              />
              <label htmlFor="hasAttachments" className="text-sm text-gray-700">
                Requires attachments
              </label>
            </div>
          </div>
        );
        
      case 'text':
      case 'long_text':
        return (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {editedAction.type === 'text' ? 'Text' : 'Long Text'}
            </label>
            {editedAction.type === 'text' ? (
              <input
                type="text"
                value={editedAction.description || ''}
                onChange={(e) => handleChange('description', e.target.value)}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring focus:border-blue-300"
              />
            ) : (
              <textarea
                value={editedAction.description || ''}
                onChange={(e) => handleChange('description', e.target.value)}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring focus:border-blue-300 h-24"
              />
            )}
          </div>
        );

      case 'file_upload':
        return (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              File Upload
            </label>
            <input
              type="file"
              onChange={handleFileUpload}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring focus:border-blue-300"
            />
          </div>
        );

      case 'date':
        return (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date
            </label>
            <input
              type="date"
              value={editedAction.description || ''}
              onChange={(e) => handleChange('description', e.target.value)}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring focus:border-blue-300"
            />
          </div>
        );
      
      default:
        return null;
    }
  };
  
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Edit Action</h2>
          <button
            onClick={onCancel}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title
            </label>
            <input
              type="text"
              value={editedAction.title}
              onChange={(e) => handleChange('title', e.target.value)}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring focus:border-blue-300"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Type
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleChange('type', 'text')}
                className={`p-2 rounded-md flex items-center justify-center ${
                  editedAction.type === 'text' ? 'bg-blue-100 text-blue-700 border-blue-300 border' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Type size={16} className="mr-1" /> Text
              </button>
              <button
                type="button"
                onClick={() => handleChange('type', 'long_text')}
                className={`p-2 rounded-md flex items-center justify-center ${
                  editedAction.type === 'long_text' ? 'bg-blue-100 text-blue-700 border-blue-300 border' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <FileText size={16} className="mr-1" /> Long Text
              </button>
              <button
                type="button"
                onClick={() => handleChange('type', 'info')}
                className={`p-2 rounded-md flex items-center justify-center ${
                  editedAction.type === 'info' ? 'bg-blue-100 text-blue-700 border-blue-300 border' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Info size={16} className="mr-1" /> Info
              </button>
              <button
                type="button"
                onClick={() => handleChange('type', 'file_upload')}
                className={`p-2 rounded-md flex items-center justify-center ${
                  editedAction.type === 'file_upload' ? 'bg-blue-100 text-blue-700 border-blue-300 border' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Image size={16} className="mr-1" /> File
              </button>
              <button
                type="button"
                onClick={() => handleChange('type', 'date')}
                className={`p-2 rounded-md flex items-center justify-center ${
                  editedAction.type === 'date' ? 'bg-blue-100 text-blue-700 border-blue-300 border' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Calendar size={16} className="mr-1" /> Date
              </button>
            </div>
          </div>
          
          {/* Type-specific fields */}
          {renderTypeSpecificFields()}
          
          {/* Action buttons */}
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
            >
              <Save size={16} className="mr-2" /> Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
