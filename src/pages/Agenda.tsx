
import React, { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { X, Edit, Trash2, FileText, Plus, Bell, Send, Calendar, Clock, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Evento, getEventos, setEventos } from '@/utils/localStorage';
import { exportEventosToPDF, exportAllToPDF } from '@/utils/pdfExport';
import { createEventReminderMessage, openWhatsAppChat } from '@/utils/whatsapp';
import { checkEventNotifications, isNotificationsSupported, requestNotificationPermission, playAlertSound } from '@/utils/notifications';

type Prioridade = 'alta' | 'media' | 'baixa';

const AgendaPage = () => {
  const { toast } = useToast();
  const [eventos, setEventosState] = useState<Evento[]>([]);
  const [currentEvento, setCurrentEvento] = useState<Evento | null>(null);
  const [filtro, setFiltro] = useState<string>('todos');
  const [sortBy, setSortBy] = useState<string>('data');
  const [notificationsPermission, setNotificationsPermission] = useState<boolean>(false);
  
  // Load eventos from localStorage
  useEffect(() => {
    const loadedEventos = getEventos();
    setEventosState(loadedEventos);
    
    // Request notification permission
    if (isNotificationsSupported()) {
      requestNotificationPermission().then(setNotificationsPermission);
    }
  }, []);
  
  // Check for notifications on load and every minute
  useEffect(() => {
    // Check for notifications immediately
    const notifiedEvents = checkEventNotifications(eventos);
    
    // Update notified events
    if (notifiedEvents.length > 0) {
      const updatedEventos = eventos.map(evento => {
        if (notifiedEvents.some(e => e.id === evento.id)) {
          return { ...evento, notificado: true };
        }
        return evento;
      });
      
      setEventosState(updatedEventos);
      setEventos(updatedEventos);
    }
    
    // Check for notifications every minute
    const intervalId = setInterval(() => {
      const notifiedEvents = checkEventNotifications(eventos);
      
      if (notifiedEvents.length > 0) {
        const updatedEventos = eventos.map(evento => {
          if (notifiedEvents.some(e => e.id === evento.id)) {
            return { ...evento, notificado: true };
          }
          return evento;
        });
        
        setEventosState(updatedEventos);
        setEventos(updatedEventos);
      }
      
      // Check for current time events and play alert
      const now = new Date();
      const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      const today = now.toISOString().split('T')[0];
      
      eventos.forEach(evento => {
        if (evento.data === today && evento.hora === currentTime) {
          // Play alert sound based on priority
          playAlertSound(evento.prioridade === 'alta');
          
          // Show notification
          toast({
            title: `📅 Evento Agora: ${evento.titulo}`,
            description: evento.descricao,
            variant: evento.prioridade === 'alta' ? 'destructive' : 'default',
          });
        }
      });
    }, 60000); // Check every minute
    
    return () => clearInterval(intervalId);
  }, [eventos, toast]);
  
  // Save eventos to localStorage when state changes
  useEffect(() => {
    setEventos(eventos);
  }, [eventos]);
  
  // Initialize a new evento
  const initNewEvento = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    setCurrentEvento({
      id: Date.now().toString(),
      titulo: '',
      descricao: '',
      data: tomorrow.toISOString().split('T')[0],
      hora: '08:00',
      whatsapp: '',
      prioridade: 'media',
      notificacaoAntecipada: 1,
      notificado: false,
    });
  };
  
  // Handle form submit for evento
  const handleEventoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentEvento) return;
    
    // Validate required fields
    if (!currentEvento.titulo || !currentEvento.data || !currentEvento.hora) {
      toast({
        title: "Erro",
        description: "Por favor, preencha todos os campos obrigatórios.",
        variant: "destructive",
      });
      return;
    }
    
    // Check if editing existing evento or adding new one
    const isEditing = eventos.some(e => e.id === currentEvento.id);
    
    // For editing, preserve the notificado status if the date/time hasn't changed
    if (isEditing) {
      const originalEvento = eventos.find(e => e.id === currentEvento.id);
      if (originalEvento && 
          (originalEvento.data !== currentEvento.data || 
           originalEvento.hora !== currentEvento.hora || 
           originalEvento.notificacaoAntecipada !== currentEvento.notificacaoAntecipada)) {
        // If date, time or notification days changed, reset notification status
        currentEvento.notificado = false;
      }
    }
    
    if (isEditing) {
      // Update existing evento
      setEventosState(eventos.map(e => 
        e.id === currentEvento.id ? currentEvento : e
      ));
    } else {
      // Add new evento
      setEventosState([...eventos, currentEvento]);
    }
    
    toast({
      title: isEditing ? "Evento atualizado" : "Evento adicionado",
      description: `${currentEvento.titulo} foi ${isEditing ? 'atualizado' : 'adicionado'} com sucesso.`,
    });
    
    setCurrentEvento(null);
  };
  
  // Handle evento field change
  const handleEventoChange = (field: keyof Evento, value: any) => {
    if (!currentEvento) return;
    
    setCurrentEvento({
      ...currentEvento,
      [field]: value,
    });
  };
  
  // Delete evento
  const handleDeleteEvento = (id: string) => {
    setEventosState(eventos.filter(e => e.id !== id));
    
    toast({
      title: "Evento removido",
      description: "O evento foi removido com sucesso.",
    });
  };
  
  // Send WhatsApp message with event info
  const sendEventInfo = (evento: Evento) => {
    if (!evento.whatsapp) {
      toast({
        title: "Erro",
        description: "Este evento não possui um número de WhatsApp associado.",
        variant: "destructive",
      });
      return;
    }
    
    const message = createEventReminderMessage(
      evento.titulo,
      evento.data,
      evento.hora,
      evento.descricao
    );
    
    openWhatsAppChat(evento.whatsapp, message);
    
    toast({
      title: "WhatsApp",
      description: "Abrindo WhatsApp com as informações do evento.",
    });
  };
  
  // Filter and sort eventos
  const filteredAndSortedEventos = React.useMemo(() => {
    // Filter eventos
    let filtered = eventos;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (filtro === 'hoje') {
      const todayStr = today.toISOString().split('T')[0];
      filtered = eventos.filter(e => e.data === todayStr);
    } else if (filtro === 'amanha') {
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split('T')[0];
      filtered = eventos.filter(e => e.data === tomorrowStr);
    } else if (filtro === 'semana') {
      const nextWeek = new Date(today);
      nextWeek.setDate(nextWeek.getDate() + 7);
      filtered = eventos.filter(e => {
        const eventDate = new Date(e.data);
        return eventDate >= today && eventDate <= nextWeek;
      });
    } else if (filtro === 'futuros') {
      filtered = eventos.filter(e => {
        const eventDate = new Date(e.data);
        return eventDate >= today;
      });
    } else if (filtro === 'passados') {
      filtered = eventos.filter(e => {
        const eventDate = new Date(e.data);
        return eventDate < today;
      });
    } else if (filtro === 'alta') {
      filtered = eventos.filter(e => e.prioridade === 'alta');
    } else if (filtro === 'media') {
      filtered = eventos.filter(e => e.prioridade === 'media');
    } else if (filtro === 'baixa') {
      filtered = eventos.filter(e => e.prioridade === 'baixa');
    }
    
    // Sort eventos
    return [...filtered].sort((a, b) => {
      if (sortBy === 'data') {
        const dateA = new Date(`${a.data}T${a.hora}`);
        const dateB = new Date(`${b.data}T${b.hora}`);
        return dateA.getTime() - dateB.getTime();
      } else if (sortBy === 'prioridade') {
        const prioridadeOrder = { alta: 0, media: 1, baixa: 2 };
        return prioridadeOrder[a.prioridade] - prioridadeOrder[b.prioridade];
      } else if (sortBy === 'titulo') {
        return a.titulo.localeCompare(b.titulo);
      }
      return 0;
    });
  }, [eventos, filtro, sortBy]);
  
  // Get priority color
  const getPriorityColor = (prioridade: Prioridade): string => {
    switch (prioridade) {
      case 'alta':
        return 'bg-priority-high text-white';
      case 'media':
        return 'bg-priority-medium text-white';
      case 'baixa':
        return 'bg-priority-low text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };
  
  // Format date
  const formatDate = (dateStr: string): string => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-BR');
  };
  
  // Check if event is today
  const isEventToday = (dateStr: string): boolean => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const eventDate = new Date(dateStr);
    eventDate.setHours(0, 0, 0, 0);
    return today.getTime() === eventDate.getTime();
  };
  
  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Agenda</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Gerencie eventos e compromissos
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button className="gap-1.5" onClick={initNewEvento}>
                <Plus className="h-4 w-4" />
                Adicionar Evento
              </Button>
            </DialogTrigger>
            
            {currentEvento && (
              <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                  <DialogTitle>
                    {eventos.some(e => e.id === currentEvento.id)
                      ? `Editar Evento - ${currentEvento.titulo}`
                      : 'Adicionar Novo Evento'}
                  </DialogTitle>
                  <DialogDescription>
                    Preencha as informações do evento
                  </DialogDescription>
                </DialogHeader>
                
                <form onSubmit={handleEventoSubmit} className="space-y-6 py-4">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="titulo">Título do Evento *</Label>
                      <Input
                        id="titulo"
                        value={currentEvento.titulo}
                        onChange={e => handleEventoChange('titulo', e.target.value)}
                        placeholder="Título do evento"
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="descricao">Descrição</Label>
                      <Textarea
                        id="descricao"
                        value={currentEvento.descricao}
                        onChange={e => handleEventoChange('descricao', e.target.value)}
                        placeholder="Descrição do evento"
                        rows={3}
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="data">Data *</Label>
                      <Input
                        id="data"
                        type="date"
                        value={currentEvento.data}
                        onChange={e => handleEventoChange('data', e.target.value)}
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="hora">Hora *</Label>
                      <Input
                        id="hora"
                        type="time"
                        value={currentEvento.hora}
                        onChange={e => handleEventoChange('hora', e.target.value)}
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="whatsapp">WhatsApp</Label>
                      <Input
                        id="whatsapp"
                        value={currentEvento.whatsapp}
                        onChange={e => handleEventoChange('whatsapp', e.target.value)}
                        placeholder="Ex: (11) 98765-4321"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="prioridade">Prioridade</Label>
                      <Select
                        value={currentEvento.prioridade}
                        onValueChange={(value) => handleEventoChange('prioridade', value as Prioridade)}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Selecione a prioridade" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="baixa">Baixa</SelectItem>
                          <SelectItem value="media">Média</SelectItem>
                          <SelectItem value="alta">Alta</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="notificacaoAntecipada">Notificação Antecipada (dias)</Label>
                    <Input
                      id="notificacaoAntecipada"
                      type="number"
                      min="0"
                      value={currentEvento.notificacaoAntecipada}
                      onChange={e => handleEventoChange('notificacaoAntecipada', parseInt(e.target.value))}
                    />
                  </div>
                  
                  <DialogFooter>
                    <Button type="submit">
                      {eventos.some(e => e.id === currentEvento.id) ? 'Salvar Alterações' : 'Adicionar Evento'}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            )}
          </Dialog>
          
          <Button
            variant="outline"
            onClick={() => exportAllToPDF([], eventos, [])}
            disabled={eventos.length === 0}
          >
            <FileText className="h-4 w-4 mr-1.5" />
            Exportar Todos
          </Button>
        </div>
      </div>
      
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="flex items-center gap-2">
          <Label htmlFor="filtro" className="whitespace-nowrap">Filtrar por:</Label>
          <Select value={filtro} onValueChange={setFiltro}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              <SelectItem value="hoje">Hoje</SelectItem>
              <SelectItem value="amanha">Amanhã</SelectItem>
              <SelectItem value="semana">Próxima semana</SelectItem>
              <SelectItem value="futuros">Futuros</SelectItem>
              <SelectItem value="passados">Passados</SelectItem>
              <SelectItem value="alta">Prioridade Alta</SelectItem>
              <SelectItem value="media">Prioridade Média</SelectItem>
              <SelectItem value="baixa">Prioridade Baixa</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex items-center gap-2">
          <Label htmlFor="ordenar" className="whitespace-nowrap">Ordenar por:</Label>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Data" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="data">Data</SelectItem>
              <SelectItem value="prioridade">Prioridade</SelectItem>
              <SelectItem value="titulo">Título</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      {eventos.length === 0 ? (
        <div className="text-center p-12 border rounded-lg bg-gray-50 dark:bg-gray-800">
          <h3 className="text-lg font-medium mb-2">Nenhum evento cadastrado</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            Adicione eventos para gerenciar sua agenda
          </p>
          <Button onClick={initNewEvento}>
            <Plus className="h-4 w-4 mr-1.5" />
            Adicionar Evento
          </Button>
        </div>
      ) : filteredAndSortedEventos.length === 0 ? (
        <div className="text-center p-12 border rounded-lg bg-gray-50 dark:bg-gray-800">
          <h3 className="text-lg font-medium mb-2">Nenhum evento encontrado</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            Nenhum evento corresponde aos critérios de filtro selecionados
          </p>
          <Button variant="outline" onClick={() => setFiltro('todos')}>
            Mostrar Todos
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredAndSortedEventos.map(evento => {
            const isPast = new Date(`${evento.data}T${evento.hora}`) < new Date();
            const isToday = isEventToday(evento.data);
            
            return (
              <Card 
                key={evento.id} 
                className={`overflow-hidden border-l-4 transition-all ${
                  isPast ? 'border-l-gray-300 opacity-70' : 
                  evento.prioridade === 'alta' ? 'border-l-priority-high' : 
                  evento.prioridade === 'media' ? 'border-l-priority-medium' : 
                  'border-l-priority-low'
                } hover:shadow-lg`}
              >
                <CardContent className="p-0">
                  <div className="relative p-6 space-y-4">
                    {isToday && evento.prioridade === 'alta' && (
                      <div className="absolute top-2 right-2 flex items-center justify-center animate-pulse-alert">
                        <AlertTriangle className="h-5 w-5 text-priority-high" />
                      </div>
                    )}
                    
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-xl font-bold">{evento.titulo}</h3>
                        <div className="flex items-center mt-1 text-gray-500 dark:text-gray-400">
                          <Calendar className="h-4 w-4 mr-1.5" />
                          <span>{formatDate(evento.data)}</span>
                          <Clock className="h-4 w-4 ml-3 mr-1.5" />
                          <span>{evento.hora}</span>
                        </div>
                      </div>
                      <div className={`px-2 py-1 rounded text-xs font-medium uppercase ${getPriorityColor(evento.prioridade)}`}>
                        {evento.prioridade}
                      </div>
                    </div>
                    
                    {evento.descricao && (
                      <div className="pt-2">
                        <p className="text-sm line-clamp-3">{evento.descricao}</p>
                      </div>
                    )}
                    
                    <div className="flex justify-between items-center pt-2">
                      <div className="flex items-center">
                        {evento.notificacaoAntecipada > 0 && (
                          <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                            <Bell className="h-4 w-4 mr-1.5" />
                            <span>{evento.notificacaoAntecipada} dia(s) antes</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex space-x-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setCurrentEvento(evento);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => exportEventosToPDF([], evento)}
                        >
                          <FileText className="h-4 w-4" />
                        </Button>
                        
                        {evento.whatsapp && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => sendEventInfo(evento)}
                          >
                            <Send className="h-4 w-4" />
                          </Button>
                        )}
                        
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteEvento(evento.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AgendaPage;
