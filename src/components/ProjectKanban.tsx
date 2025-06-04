
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Briefcase, Clock, DollarSign, User } from 'lucide-react';

const ProjectKanban = () => {
  const [columns, setColumns] = useState({
    'todo': {
      title: 'A Fazer',
      color: 'bg-red-50 border-red-200',
      items: [
        {
          id: '1',
          title: 'Vídeo Institucional - Tech Corp',
          value: 'R$ 4.500',
          deadline: '15/06/2025',
          responsible: 'João Silva',
          type: 'Filmagem'
        },
        {
          id: '2',
          title: 'Reels para Instagram - Loja ABC',
          value: 'R$ 800',
          deadline: '10/06/2025',
          responsible: 'Maria Santos',
          type: 'Edição'
        }
      ]
    },
    'inProgress': {
      title: 'Em Produção',
      color: 'bg-yellow-50 border-yellow-200',
      items: [
        {
          id: '3',
          title: 'Casamento - Ana & Pedro',
          value: 'R$ 3.200',
          deadline: '20/06/2025',
          responsible: 'Carlos Lima',
          type: 'Filmagem'
        }
      ]
    },
    'done': {
      title: 'Finalizado',
      color: 'bg-green-50 border-green-200',
      items: [
        {
          id: '4',
          title: 'Clipe Musical - Banda XYZ',
          value: 'R$ 2.800',
          deadline: '05/06/2025',
          responsible: 'Ana Costa',
          type: 'Edição'
        },
        {
          id: '5',
          title: 'VSL - Curso Online',
          value: 'R$ 1.500',
          deadline: '01/06/2025',
          responsible: 'João Silva',
          type: 'Motion Graphics'
        }
      ]
    }
  });

  const handleDragEnd = (result) => {
    if (!result.destination) return;

    const { source, destination } = result;
    
    if (source.droppableId !== destination.droppableId) {
      const sourceColumn = columns[source.droppableId];
      const destColumn = columns[destination.droppableId];
      const sourceItems = [...sourceColumn.items];
      const destItems = [...destColumn.items];
      const [removed] = sourceItems.splice(source.index, 1);
      destItems.splice(destination.index, 0, removed);
      
      setColumns({
        ...columns,
        [source.droppableId]: {
          ...sourceColumn,
          items: sourceItems
        },
        [destination.droppableId]: {
          ...destColumn,
          items: destItems
        }
      });
    } else {
      const column = columns[source.droppableId];
      const copiedItems = [...column.items];
      const [removed] = copiedItems.splice(source.index, 1);
      copiedItems.splice(destination.index, 0, removed);
      
      setColumns({
        ...columns,
        [source.droppableId]: {
          ...column,
          items: copiedItems
        }
      });
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'Filmagem': return 'bg-blue-100 text-blue-800';
      case 'Edição': return 'bg-purple-100 text-purple-800';
      case 'Motion Graphics': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold flex items-center justify-center gap-2">
          <Briefcase className="text-purple-600" />
          Kanban de Projetos
        </h2>
        <p className="text-gray-600">Gerencie o fluxo dos seus projetos aprovados</p>
      </div>

      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="grid lg:grid-cols-3 gap-6">
          {Object.entries(columns).map(([columnId, column]) => (
            <Card key={columnId} className={`${column.color} h-fit`}>
              <CardHeader className="pb-3">
                <CardTitle className="text-center font-semibold">
                  {column.title}
                  <Badge variant="secondary" className="ml-2">
                    {column.items.length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Droppable droppableId={columnId}>
                  {(provided, snapshot) => (
                    <div
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                      className={`space-y-3 min-h-[200px] p-2 rounded-lg transition-colors ${
                        snapshot.isDraggingOver ? 'bg-white/50' : ''
                      }`}
                    >
                      {column.items.map((item, index) => (
                        <Draggable key={item.id} draggableId={item.id} index={index}>
                          {(provided, snapshot) => (
                            <Card
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={`bg-white shadow-sm hover:shadow-md transition-all cursor-move ${
                                snapshot.isDragging ? 'rotate-2 shadow-lg' : ''
                              }`}
                            >
                              <CardContent className="p-4 space-y-3">
                                <div className="flex justify-between items-start">
                                  <h4 className="font-medium text-sm leading-tight">{item.title}</h4>
                                  <Badge className={getTypeColor(item.type)} variant="secondary">
                                    {item.type}
                                  </Badge>
                                </div>
                                
                                <div className="space-y-2 text-xs text-gray-600">
                                  <div className="flex items-center gap-2">
                                    <DollarSign className="h-3 w-3" />
                                    <span className="font-semibold text-green-600">{item.value}</span>
                                  </div>
                                  
                                  <div className="flex items-center gap-2">
                                    <Clock className="h-3 w-3" />
                                    <span>{item.deadline}</span>
                                  </div>
                                  
                                  <div className="flex items-center gap-2">
                                    <User className="h-3 w-3" />
                                    <span>{item.responsible}</span>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </CardContent>
            </Card>
          ))}
        </div>
      </DragDropContext>
    </div>
  );
};

export default ProjectKanban;
