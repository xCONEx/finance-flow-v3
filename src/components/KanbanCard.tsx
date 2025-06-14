
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { User } from 'lucide-react';

interface KanbanTask {
  id: string;
  title: string;
  description: string;
  value: string;
  deadline: string;
  responsible: string;
  type: string;
  comments: number;
  attachments: number;
  priority: 'alta' | 'média' | 'baixa';
  createdAt: string;
  tags?: string[];
}

interface Tag {
  id: string;
  name: string;
  color: string;
}

interface KanbanCardProps {
  task: KanbanTask;
  tags: Tag[];
  onClick: () => void;
  isDragging?: boolean;
}

const KanbanCard: React.FC<KanbanCardProps> = ({ task, tags, onClick, isDragging }) => {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'alta': return '#EF4444';
      case 'média': return '#F59E0B';
      case 'baixa': return '#10B981';
      default: return '#6B7280';
    }
  };

  const taskTags = tags.filter(tag => task.tags?.includes(tag.id));

  return (
    <Card
      className={`bg-white shadow-sm hover:shadow-md transition-all cursor-pointer border-l-4 ${
        isDragging ? 'rotate-2 shadow-lg' : ''
      }`}
      style={{ borderLeftColor: getPriorityColor(task.priority) }}
      onClick={onClick}
    >
      <CardContent className="p-4 space-y-3">
        <div className="space-y-2">
          <h4 className="font-medium text-sm leading-tight text-gray-900">
            {task.title}
          </h4>
          
          <div className="flex items-center gap-2 text-xs text-gray-600">
            <User className="h-3 w-3" />
            <span>{task.responsible}</span>
          </div>
          
          {taskTags.length > 0 && (
            <div className="space-y-1">
              <p className="text-xs text-gray-500 font-medium">Etiquetas</p>
              <div className="flex gap-1 flex-wrap">
                {taskTags.map(tag => (
                  <Badge
                    key={tag.id}
                    style={{ backgroundColor: tag.color, color: 'white' }}
                    className="text-xs px-2 py-0"
                  >
                    {tag.name}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default KanbanCard;