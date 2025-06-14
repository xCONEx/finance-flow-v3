
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Edit, Trash2 } from 'lucide-react';

interface Column {
  id: string;
  title: string;
  color: string;
}

interface ColumnManagerProps {
  columns: { [key: string]: { title: string; color: string; items: any[] } };
  onAddColumn: (column: { id: string; title: string; color: string }) => void;
  onEditColumn: (columnId: string, title: string, color: string) => void;
  onDeleteColumn: (columnId: string) => void;
}

const ColumnManager: React.FC<ColumnManagerProps> = ({
  columns,
  onAddColumn,
  onEditColumn,
  onDeleteColumn
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [newColumnTitle, setNewColumnTitle] = useState('');
  const [newColumnColor, setNewColumnColor] = useState('bg-blue-50 border-blue-200');
  const [editingColumn, setEditingColumn] = useState<string | null>(null);

  const colorOptions = [
    { value: 'bg-blue-50 border-blue-200', label: 'Azul' },
    { value: 'bg-green-50 border-green-200', label: 'Verde' },
    { value: 'bg-yellow-50 border-yellow-200', label: 'Amarelo' },
    { value: 'bg-red-50 border-red-200', label: 'Vermelho' },
    { value: 'bg-purple-50 border-purple-200', label: 'Roxo' },
    { value: 'bg-pink-50 border-pink-200', label: 'Rosa' },
    { value: 'bg-gray-50 border-gray-200', label: 'Cinza' },
  ];

  const fixedColumns = ['todo', 'inProgress', 'review', 'done'];

  const handleAddColumn = () => {
    if (newColumnTitle.trim()) {
      const newColumn = {
        id: `custom_${Date.now()}`,
        title: newColumnTitle.trim(),
        color: newColumnColor
      };
      onAddColumn(newColumn);
      setNewColumnTitle('');
      setIsOpen(false);
    }
  };

  const handleEditColumn = (columnId: string) => {
    if (newColumnTitle.trim()) {
      onEditColumn(columnId, newColumnTitle.trim(), newColumnColor);
      setEditingColumn(null);
      setNewColumnTitle('');
    }
  };

  const startEdit = (columnId: string, currentTitle: string, currentColor: string) => {
    setEditingColumn(columnId);
    setNewColumnTitle(currentTitle);
    setNewColumnColor(currentColor);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Gerenciar Colunas
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Gerenciar Colunas</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Input
              placeholder="Nome da coluna"
              value={newColumnTitle}
              onChange={(e) => setNewColumnTitle(e.target.value)}
            />
            
            <select
              className="w-full p-2 border rounded"
              value={newColumnColor}
              onChange={(e) => setNewColumnColor(e.target.value)}
            >
              {colorOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            
            <Button 
              onClick={editingColumn ? () => handleEditColumn(editingColumn) : handleAddColumn} 
              className="w-full"
            >
              {editingColumn ? 'Salvar Alterações' : 'Adicionar Coluna'}
            </Button>
            
            {editingColumn && (
              <Button 
                variant="outline" 
                onClick={() => {
                  setEditingColumn(null);
                  setNewColumnTitle('');
                }} 
                className="w-full"
              >
                Cancelar
              </Button>
            )}
          </div>
          
          <div className="space-y-2">
            <h4 className="font-medium">Colunas Existentes</h4>
            <div className="space-y-2">
              {Object.entries(columns).map(([columnId, column]) => (
                <div key={columnId} className="flex items-center justify-between p-2 border rounded">
                  <span className="font-medium">{column.title}</span>
                  <div className="flex gap-1">
                    {!fixedColumns.includes(columnId) && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => startEdit(columnId, column.title, column.color)}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onDeleteColumn(columnId)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ColumnManager;