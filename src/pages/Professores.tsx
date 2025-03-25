
import React, { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { X, Edit, Trash2, FileText, Plus, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Professor, Materia, getProfessores, setProfessores } from '@/utils/localStorage';
import { exportProfessoresToPDF, exportAllToPDF } from '@/utils/pdfExport';
import { createProfessorPaymentMessage, openWhatsAppChat } from '@/utils/whatsapp';

const ProfessoresPage = () => {
  const { toast } = useToast();
  const [professores, setProfessoresState] = useState<Professor[]>([]);
  const [currentProfessor, setCurrentProfessor] = useState<Professor | null>(null);
  const [isAddingMaterias, setIsAddingMaterias] = useState(false);
  const [newMateria, setNewMateria] = useState<Omit<Materia, 'id'>>({
    nome: '',
    data: '',
    horario: '',
    local: '',
    horasAula: 0,
  });
  
  // Load professores from localStorage
  useEffect(() => {
    const loadedProfessores = getProfessores();
    setProfessoresState(loadedProfessores);
  }, []);
  
  // Save professores to localStorage when state changes
  useEffect(() => {
    setProfessores(professores);
  }, [professores]);
  
  // Initialize a new professor
  const initNewProfessor = () => {
    setCurrentProfessor({
      id: Date.now().toString(),
      nome: '',
      titulo: '',
      materias: [],
      valorHoraAula: 0,
      estatutario: false,
      observacoes: '',
    });
  };
  
  // Handle form submit for professor
  const handleProfessorSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentProfessor) return;
    
    // Validate required fields
    if (!currentProfessor.nome || !currentProfessor.titulo) {
      toast({
        title: "Erro",
        description: "Por favor, preencha todos os campos obrigatórios.",
        variant: "destructive",
      });
      return;
    }
    
    // Check if editing existing professor or adding new one
    const isEditing = professores.some(p => p.id === currentProfessor.id);
    
    if (isEditing) {
      // Update existing professor
      setProfessoresState(professores.map(p => 
        p.id === currentProfessor.id ? currentProfessor : p
      ));
    } else {
      // Add new professor
      setProfessoresState([...professores, currentProfessor]);
    }
    
    toast({
      title: isEditing ? "Professor atualizado" : "Professor adicionado",
      description: `${currentProfessor.nome} foi ${isEditing ? 'atualizado' : 'adicionado'} com sucesso.`,
    });
    
    setCurrentProfessor(null);
  };
  
  // Handle professor field change
  const handleProfessorChange = (field: keyof Professor, value: any) => {
    if (!currentProfessor) return;
    
    setCurrentProfessor({
      ...currentProfessor,
      [field]: value,
    });
  };
  
  // Delete professor
  const handleDeleteProfessor = (id: string) => {
    setProfessoresState(professores.filter(p => p.id !== id));
    
    toast({
      title: "Professor removido",
      description: "O professor foi removido com sucesso.",
    });
  };
  
  // Add materia to current professor
  const handleAddMateria = () => {
    if (!currentProfessor) return;
    
    // Validate required fields
    if (!newMateria.nome || !newMateria.data || !newMateria.horario || !newMateria.local || newMateria.horasAula <= 0) {
      toast({
        title: "Erro",
        description: "Por favor, preencha todos os campos obrigatórios da matéria.",
        variant: "destructive",
      });
      return;
    }
    
    const materiaToAdd: Materia = {
      ...newMateria,
      id: Date.now().toString(),
    };
    
    setCurrentProfessor({
      ...currentProfessor,
      materias: [...currentProfessor.materias, materiaToAdd],
    });
    
    // Reset form
    setNewMateria({
      nome: '',
      data: '',
      horario: '',
      local: '',
      horasAula: 0,
    });
    
    setIsAddingMaterias(false);
    
    toast({
      title: "Matéria adicionada",
      description: `A matéria ${materiaToAdd.nome} foi adicionada com sucesso.`,
    });
  };
  
  // Remove materia from current professor
  const handleRemoveMateria = (id: string) => {
    if (!currentProfessor) return;
    
    setCurrentProfessor({
      ...currentProfessor,
      materias: currentProfessor.materias.filter(m => m.id !== id),
    });
    
    toast({
      title: "Matéria removida",
      description: "A matéria foi removida com sucesso.",
    });
  };
  
  // Calculate total hours for a professor
  const calculateTotalHours = (professor: Professor): number => {
    return professor.materias.reduce((total, materia) => total + materia.horasAula, 0);
  };
  
  // Calculate total payment for a professor
  const calculateTotalPayment = (professor: Professor): number => {
    const totalHours = calculateTotalHours(professor);
    return totalHours * professor.valorHoraAula;
  };
  
  // Format currency
  const formatCurrency = (value: number): string => {
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  };
  
  // Send WhatsApp message with payment info
  const sendPaymentInfo = (professor: Professor) => {
    const totalHoras = calculateTotalHours(professor);
    const totalPagamento = calculateTotalPayment(professor);
    
    // Check if professor has a phone number in observations
    const phoneRegex = /(\d{10,11})/g;
    const phoneMatch = professor.observacoes ? professor.observacoes.match(phoneRegex) : null;
    
    if (!phoneMatch) {
      toast({
        title: "Erro",
        description: "Não foi encontrado um número de telefone nas observações do professor.",
        variant: "destructive",
      });
      return;
    }
    
    const phone = phoneMatch[0];
    const message = createProfessorPaymentMessage(
      professor.nome,
      totalHoras,
      professor.valorHoraAula,
      totalPagamento
    );
    
    openWhatsAppChat(phone, message);
    
    toast({
      title: "WhatsApp",
      description: "Abrindo WhatsApp com as informações de pagamento.",
    });
  };
  
  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Gestão de Professores</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Gerencie informações e pagamentos dos professores
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button className="gap-1.5" onClick={initNewProfessor}>
                <Plus className="h-4 w-4" />
                Adicionar Professor
              </Button>
            </DialogTrigger>
            
            {currentProfessor && (
              <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {professores.some(p => p.id === currentProfessor.id)
                      ? `Editar Professor - ${currentProfessor.nome}`
                      : 'Adicionar Novo Professor'}
                  </DialogTitle>
                  <DialogDescription>
                    Preencha as informações do professor
                  </DialogDescription>
                </DialogHeader>
                
                <form onSubmit={handleProfessorSubmit} className="space-y-6 py-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="nome">Nome do Professor *</Label>
                      <Input
                        id="nome"
                        value={currentProfessor.nome}
                        onChange={e => handleProfessorChange('nome', e.target.value)}
                        placeholder="Nome completo"
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="titulo">Título do Professor *</Label>
                      <Input
                        id="titulo"
                        value={currentProfessor.titulo}
                        onChange={e => handleProfessorChange('titulo', e.target.value)}
                        placeholder="Ex: Mestre, Doutor, Especialista"
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="valorHoraAula">Valor da Hora/Aula (R$) *</Label>
                      <Input
                        id="valorHoraAula"
                        type="number"
                        min="0"
                        step="0.01"
                        value={currentProfessor.valorHoraAula}
                        onChange={e => handleProfessorChange('valorHoraAula', parseFloat(e.target.value) || 0)}
                        placeholder="0.00"
                        required
                      />
                    </div>
                    
                    <div className="flex items-center space-x-2 pt-6">
                      <Checkbox
                        id="estatutario"
                        checked={currentProfessor.estatutario}
                        onCheckedChange={checked => handleProfessorChange('estatutario', !!checked)}
                      />
                      <Label htmlFor="estatutario">Professor Estatutário</Label>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="observacoes">Observações</Label>
                    <Input
                      id="observacoes"
                      value={currentProfessor.observacoes || ''}
                      onChange={e => handleProfessorChange('observacoes', e.target.value)}
                      placeholder="Observações, números de contato, etc."
                    />
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-medium">Matérias Ministradas</h3>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setIsAddingMaterias(true)}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Adicionar Matéria
                      </Button>
                    </div>
                    
                    {isAddingMaterias && (
                      <Card>
                        <CardContent className="p-4 space-y-4">
                          <div className="flex justify-between items-center">
                            <h4 className="font-medium">Nova Matéria</h4>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => setIsAddingMaterias(false)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                          
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="materiaNome">Nome da Matéria *</Label>
                              <Input
                                id="materiaNome"
                                value={newMateria.nome}
                                onChange={e => setNewMateria({...newMateria, nome: e.target.value})}
                                placeholder="Ex: Matemática, Física"
                                required
                              />
                            </div>
                            
                            <div className="space-y-2">
                              <Label htmlFor="materiaData">Data *</Label>
                              <Input
                                id="materiaData"
                                type="date"
                                value={newMateria.data}
                                onChange={e => setNewMateria({...newMateria, data: e.target.value})}
                                required
                              />
                            </div>
                            
                            <div className="space-y-2">
                              <Label htmlFor="materiaHorario">Horário *</Label>
                              <Input
                                id="materiaHorario"
                                type="time"
                                value={newMateria.horario}
                                onChange={e => setNewMateria({...newMateria, horario: e.target.value})}
                                required
                              />
                            </div>
                            
                            <div className="space-y-2">
                              <Label htmlFor="materiaLocal">Local *</Label>
                              <Input
                                id="materiaLocal"
                                value={newMateria.local}
                                onChange={e => setNewMateria({...newMateria, local: e.target.value})}
                                placeholder="Ex: Sala 101, Laboratório"
                                required
                              />
                            </div>
                            
                            <div className="space-y-2">
                              <Label htmlFor="materiaHorasAula">Horas de Aula *</Label>
                              <Input
                                id="materiaHorasAula"
                                type="number"
                                min="1"
                                step="1"
                                value={newMateria.horasAula || ''}
                                onChange={e => setNewMateria({...newMateria, horasAula: parseInt(e.target.value) || 0})}
                                required
                              />
                            </div>
                          </div>
                          
                          <Button
                            type="button"
                            className="w-full"
                            onClick={handleAddMateria}
                          >
                            Adicionar
                          </Button>
                        </CardContent>
                      </Card>
                    )}
                    
                    {currentProfessor.materias.length > 0 ? (
                      <div className="rounded-md border">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Matéria</TableHead>
                              <TableHead>Data</TableHead>
                              <TableHead>Horário</TableHead>
                              <TableHead>Local</TableHead>
                              <TableHead>Horas</TableHead>
                              <TableHead className="w-[70px]"></TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {currentProfessor.materias.map(materia => (
                              <TableRow key={materia.id}>
                                <TableCell>{materia.nome}</TableCell>
                                <TableCell>{new Date(materia.data).toLocaleDateString('pt-BR')}</TableCell>
                                <TableCell>{materia.horario}</TableCell>
                                <TableCell>{materia.local}</TableCell>
                                <TableCell>{materia.horasAula}</TableCell>
                                <TableCell>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleRemoveMateria(materia.id)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                            
                            <TableRow>
                              <TableCell colSpan={4} className="text-right font-medium">
                                Total de Horas:
                              </TableCell>
                              <TableCell colSpan={2} className="font-medium">
                                {calculateTotalHours(currentProfessor)}
                              </TableCell>
                            </TableRow>
                            
                            <TableRow>
                              <TableCell colSpan={4} className="text-right font-medium">
                                Total a Receber:
                              </TableCell>
                              <TableCell colSpan={2} className="font-medium">
                                {formatCurrency(calculateTotalPayment(currentProfessor))}
                              </TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                      </div>
                    ) : (
                      <div className="text-center p-4 border rounded-md bg-gray-50 dark:bg-gray-800">
                        <p className="text-gray-500 dark:text-gray-400">Nenhuma matéria adicionada</p>
                      </div>
                    )}
                  </div>
                  
                  <DialogFooter>
                    <Button type="submit">
                      {professores.some(p => p.id === currentProfessor.id) ? 'Salvar Alterações' : 'Adicionar Professor'}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            )}
          </Dialog>
          
          <Button
            variant="outline"
            onClick={() => exportAllToPDF(professores, [], [])}
            disabled={professores.length === 0}
          >
            <FileText className="h-4 w-4 mr-1.5" />
            Exportar Todos
          </Button>
        </div>
      </div>
      
      {professores.length === 0 ? (
        <div className="text-center p-12 border rounded-lg bg-gray-50 dark:bg-gray-800">
          <h3 className="text-lg font-medium mb-2">Nenhum professor cadastrado</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            Adicione professores para gerenciar suas informações e pagamentos
          </p>
          <Button onClick={initNewProfessor}>
            <Plus className="h-4 w-4 mr-1.5" />
            Adicionar Professor
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {professores.map(professor => {
            const totalHoras = calculateTotalHours(professor);
            const totalPagamento = calculateTotalPayment(professor);
            
            return (
              <Card key={professor.id} className="overflow-hidden transition-all hover:shadow-lg">
                <CardContent className="p-0">
                  <div className="p-6 space-y-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-xl font-bold">{professor.nome}</h3>
                        <p className="text-gray-500 dark:text-gray-400">{professor.titulo}</p>
                      </div>
                      <div className="flex flex-col items-center justify-center rounded-full bg-primary/10 text-primary w-12 h-12">
                        <p className="text-sm font-semibold">{professor.estatutario ? 'EST' : 'N-EST'}</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <p className="text-sm text-gray-500 dark:text-gray-400">Valor da Hora/Aula</p>
                        <p className="font-semibold">{formatCurrency(professor.valorHoraAula)}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-gray-500 dark:text-gray-400">Total de Horas</p>
                        <p className="font-semibold">{totalHoras}</p>
                      </div>
                      <div className="space-y-1 col-span-2">
                        <p className="text-sm text-gray-500 dark:text-gray-400">Total a Receber</p>
                        <p className="font-semibold text-lg">{formatCurrency(totalPagamento)}</p>
                      </div>
                    </div>
                    
                    {professor.observacoes && (
                      <div className="pt-2">
                        <p className="text-sm text-gray-500 dark:text-gray-400">Observações</p>
                        <p className="text-sm">{professor.observacoes}</p>
                      </div>
                    )}
                    
                    <div className="border-t pt-4 flex justify-between">
                      <div className="space-y-1">
                        <p className="text-sm text-gray-500 dark:text-gray-400">Matérias</p>
                        <p className="font-medium">{professor.materias.length}</p>
                      </div>
                      
                      <div className="flex space-x-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setCurrentProfessor(professor);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => exportProfessoresToPDF([], professor)}
                        >
                          <FileText className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => sendPaymentInfo(professor)}
                        >
                          <Send className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteProfessor(professor.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                  
                  {professor.materias.length > 0 && (
                    <div className="border-t">
                      <div className="px-6 py-3 bg-gray-50 dark:bg-gray-800 font-medium">
                        Matérias Ministradas
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b">
                              <th className="px-6 py-2 text-left">Matéria</th>
                              <th className="px-6 py-2 text-left">Data</th>
                              <th className="px-6 py-2 text-left">Horário</th>
                              <th className="px-6 py-2 text-left">Local</th>
                              <th className="px-6 py-2 text-right">Horas</th>
                            </tr>
                          </thead>
                          <tbody>
                            {professor.materias.map((materia, index) => (
                              <tr 
                                key={materia.id} 
                                className={`${index !== professor.materias.length - 1 ? 'border-b' : ''}`}
                              >
                                <td className="px-6 py-2">{materia.nome}</td>
                                <td className="px-6 py-2">{new Date(materia.data).toLocaleDateString('pt-BR')}</td>
                                <td className="px-6 py-2">{materia.horario}</td>
                                <td className="px-6 py-2">{materia.local}</td>
                                <td className="px-6 py-2 text-right">{materia.horasAula}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ProfessoresPage;
