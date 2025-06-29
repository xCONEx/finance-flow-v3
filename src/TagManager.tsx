
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, X } from 'lucide-react';

interface Tag {
  id: string;
  name: string;
  color: string;
}

interface TagManagerProps {
  tags: Tag[];
  onAddTag: (tag: Tag) => void;
  onRemoveTag: (tagId: string) => void;
  selectedTags: string[];
  onTagSelect: (tagId: string) => void;
}

const TagManager: React.FC<TagManagerProps> = ({
  tags,
  onAddTag,
  onRemoveTag,
  selectedTags,
  onTagSelect
}) => {
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState('#3B82F6');
  const [isOpen, setIsOpen] = useState(false);

  const colors = [
    '#3B82F6', '#EF4444', '#10B981', '#F59E0B',
    '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'
  ];

  const handleAddTag = () => {
    if (newTagName.trim()) {
      const newTag: Tag = {
        id: `tag_${Date.now()}`,
        name: newTagName.trim(),
        color: newTagColor
      };
      onAddTag(newTag);
      setNewTagName('');
      setIsOpen(false);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 flex-wrap">
        {tags.filter(tag => selectedTags.includes(tag.id)).map(tag => (
          <Badge
            key={tag.id}
            style={{ backgroundColor: tag.color, color: 'white' }}
            className="flex items-center gap-1"
          >
            {tag.name}
            <X
              className="h-3 w-3 cursor-pointer"
              onClick={() => onTagSelect(tag.id)}
            />
          </Badge>
        ))}
        
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="h-6">
              <Plus className="h-3 w-3" />
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Gerenciar Etiquetas</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Input
                  placeholder="Nome da etiqueta"
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                />
                
                <div className="flex gap-2 flex-wrap">
                  {colors.map(color => (
                    <div
                      key={color}
                      className={`w-8 h-8 rounded cursor-pointer border-2 ${
                        newTagColor === color ? 'border-gray-800' : 'border-gray-300'
                      }`}
                      style={{ backgroundColor: color }}
                      onClick={() => setNewTagColor(color)}
                    />
                  ))}
                </div>
                
                <Button onClick={handleAddTag} className="w-full">
                  Criar Etiqueta
                </Button>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium">Etiquetas Disponíveis</h4>
                <div className="flex gap-2 flex-wrap">
                  {tags.map(tag => (
                    <Badge
                      key={tag.id}
                      style={{ backgroundColor: tag.color, color: 'white' }}
                      className={`cursor-pointer ${
                        selectedTags.includes(tag.id) ? 'ring-2 ring-gray-800' : ''
                      }`}
                      onClick={() => onTagSelect(tag.id)}
                    >
                      {tag.name}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default TagManager;