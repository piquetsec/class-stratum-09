
import React, { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { X, Edit, Trash2, FileText, Plus, Send, ChevronDown, Check, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { Aluno, Nota, getAlunos, setAlunos } from '@/utils/localStorage';
import { exportAlunosToPDF, exportAllToPDF } from '@/utils/pdfExport';
import { createStudentReportMessage, openWhatsAppChat } from '@/utils/whatsapp';

const AlunosPage = () => {
  const { toast } = useToast();
  const [alunos, setAlunosState] = useState<Aluno[]>([]);
  const [currentAluno, setCurrentAluno] = useState<Aluno | null>(null);
  const [isAddingNota, setIsAddingNota] = useState(false);
  const [newNota, setNewNota] = useState<Omit<Nota, 'id'>>({
    valor: 0,
    peso: 1,
    descricao: '',
  });
  
  // Load alunos from localStorage
  useEffect(() => {
    const loadedAlunos = getAlunos();
    setAlunosState(loadedAlunos);
  }, []);
  
  // Save alunos to localStorage when state changes
  useEffect(() => {
    setAlunos(alunos);
  }, [alunos]);
  
  // Initialize a new aluno
  const initNewAluno = () => {
    setCurrentAluno({
      id: Date.now().toString(),
      nome: '',
      notas: [],
      totalAulas: 0,
      faltas: 0,
      limiteFaltas: 25, // Default limit is 25%
    });
  };
  
  // Handle form submit for aluno
  const handleAlunoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentAluno) return;
    
    // Validate required fields
    if (!currentAluno.nome || currentAluno.totalAulas < 0) {
      toast({
        title: "Erro",
        description: "Por favor, preencha todos os campos obrigatórios corretamente.",
        variant: "destructive",
      });
      return;
    }
    
    // Check if editing existing aluno or adding new one
    const isEditing = alunos.some(a => a.id === currentAluno.id);
    
    if (isEditing) {
      // Update existing aluno
      setAlunosState(alunos.map(a => 
        a.id === currentAluno.id ? currentAluno : a
      ));
    } else {
      // Add new aluno
      setAlunosState([...alunos, currentAluno]);
    }
    
    toast({
      title: isEditing ? "Aluno atualizado" : "Aluno adicionado",
      description: `${currentAluno.nome} foi ${isEditing ? 'atualizado' : 'adicionado'} com sucesso.`,
    });
    
    setCurrentAluno(null);
  };
  
  // Handle aluno field change
  const handleAlunoChange = (field: keyof Aluno, value: any) => {
    if (!currentAluno) return;
    
    setCurrentAluno({
      ...currentAluno,
      [field]: value,
    });
  };
  
  // Delete aluno
  const handleDeleteAluno = (id: string) => {
    setAlunosState(alunos.filter(a => a.id !== id));
    
    toast({
      title: "Aluno removido",
      description: "O aluno foi removido com sucesso.",
    });
  };
  
  // Add nota to current aluno
  const handleAddNota = () => {
    if (!currentAluno) return;
    
    // Validate required fields
    if (!newNota.descricao || newNota.valor < 0 || newNota.valor > 10 || newNota.peso <= 0) {
      toast({
        title: "Erro",
        description: "Por favor, preencha todos os campos obrigatórios da nota corretamente.",
        variant: "destructive",
      });
      return;
    }
    
    const notaToAdd: Nota = {
      ...newNota,
      id: Date.now().toString(),
    };
    
    setCurrentAluno({
      ...currentAluno,
      notas: [...currentAluno.notas, notaToAdd],
    });
    
    // Reset form
    setNewNota({
      valor: 0,
      peso: 1,
      descricao: '',
    });
    
    setIsAddingNota(false);
    
    toast({
      title: "Nota adicionada",
      description: `A nota ${notaToAdd.descricao} foi adicionada com sucesso.`,
    });
  };
  
  // Remove nota from current aluno
  const handleRemoveNota = (id: string) => {
    if (!currentAluno) return;
    
    setCurrentAluno({
      ...currentAluno,
      notas: currentAluno.notas.filter(n => n.id !== id),
    });
    
    toast({
      title: "Nota removida",
      description: "A nota foi removida com sucesso.",
    });
  };
  
  // Calculate media ponderada
  const calcularMediaPonderada = (notas: Nota[]): number => {
    if (notas.length === 0) return 0;
    
    const somaProdutos = notas.reduce((total, nota) => total + (nota.valor * nota.peso), 0);
    const somaPesos = notas.reduce((total, nota) => total + nota.peso, 0);
    
    return somaPesos > 0 ? somaProdutos / somaPesos : 0;
  };
  
  // Determine situacao do aluno
  const determinarSituacao = (aluno: Aluno): { status: string; cor: string } => {
    if (aluno.totalAulas === 0) {
      return { status: 'Indefinido', cor: 'text-gray-500' };
    }
    
    const percentualFaltas = (aluno.faltas / aluno.totalAulas) * 100;
    
    if (percentualFaltas > aluno.limiteFaltas) {
      return { status: 'Reprovado por Faltas', cor: 'text-red-500' };
    }
    
    const media = calcularMediaPonderada(aluno.notas);
    
    if (media >= 6) {
      return { status: 'Aprovado', cor: 'text-green-500' };
    } else {
      return { status: 'Reprovado por Nota', cor: 'text-red-500' };
    }
  };
  
  // Calculate falta percentage
  const calcularPercentualFaltas = (aluno: Aluno): number => {
    if (aluno.totalAulas === 0) return 0;
    return (aluno.faltas / aluno.totalAulas) * 100;
  };
  
  // Send WhatsApp message with student report
  const sendStudentReport = (aluno: Aluno) => {
    // Extract phone number from student name (assuming it's in format "Name - 11999999999")
    const phoneRegex = /(\d{10,11})/g;
    const phoneMatch = aluno.nome.match(phoneRegex);
    
    if (!phoneMatch) {
      toast({
        title: "Erro",
        description: "Não foi encontrado um número de telefone no nome do aluno.",
        variant: "destructive",
      });
      return;
    }
    
    const phone = phoneMatch[0];
    const media = calcularMediaPonderada(aluno.notas);
    const situacao = determinarSituacao(aluno);
    
    const message = createStudentReportMessage(
      aluno.nome.replace(phoneRegex, '').trim(),
      media,
      aluno.faltas,
      aluno.totalAulas,
      situacao.status
    );
    
    openWhatsAppChat(phone, message);
    
    toast({
      title: "WhatsApp",
      description: "Abrindo WhatsApp com o relatório do aluno.",
    });
  };
  
  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Gestão de Alunos</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Gerencie notas e faltas dos alunos
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button className="gap-1.5" onClick={initNewAluno}>
                <Plus className="h-4 w-4" />
                Adicionar Aluno
              </Button>
            </DialogTrigger>
            
            {currentAluno && (
              <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {alunos.some(a => a.id === currentAluno.id)
                      ? `Editar Aluno - ${currentAluno.nome}`
                      : 'Adicionar Novo Aluno'}
                  </DialogTitle>
                  <DialogDescription>
                    Preencha as informações do aluno
                  </DialogDescription>
                </DialogHeader>
                
                <form onSubmit={handleAlunoSubmit} className="space-y-6 py-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2 sm:col-span-2">
                      <Label htmlFor="nome">Nome do Aluno *</Label>
                      <Input
                        id="nome"
                        value={currentAluno.nome}
                        onChange={e => handleAlunoChange('nome', e.target.value)}
                        placeholder="Nome completo"
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="totalAulas">Total de Aulas *</Label>
                      <Input
                        id="totalAulas"
                        type="number"
                        min="0"
                        value={currentAluno.totalAulas}
                        onChange={e => handleAlunoChange('totalAulas', parseInt(e.target.value) || 0)}
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="faltas">Faltas *</Label>
                      <Input
                        id="faltas"
                        type="number"
                        min="0"
                        max={currentAluno.totalAulas}
                        value={currentAluno.faltas}
                        onChange={e => handleAlunoChange('faltas', parseInt(e.target.value) || 0)}
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="limiteFaltas">Limite de Faltas (%) *</Label>
                      <Input
                        id="limiteFaltas"
                        type="number"
                        min="0"
                        max="100"
                        value={currentAluno.limiteFaltas}
                        onChange={e => handleAlunoChange('limiteFaltas', parseInt(e.target.value) || 0)}
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-medium">Notas</h3>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setIsAddingNota(true)}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Adicionar Nota
                      </Button>
                    </div>
                    
                    {isAddingNota && (
                      <Card>
                        <CardContent className="p-4 space-y-4">
                          <div className="flex justify-between items-center">
                            <h4 className="font-medium">Nova Nota</h4>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => setIsAddingNota(false)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                          
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="notaDescricao">Descrição *</Label>
                              <Input
                                id="notaDescricao"
                                value={newNota.descricao}
                                onChange={e => setNewNota({...newNota, descricao: e.target.value})}
                                placeholder="Ex: Prova 1, Trabalho"
                                required
                              />
                            </div>
                            
                            <div className="space-y-2">
                              <Label htmlFor="notaValor">Nota (0-10) *</Label>
                              <Input
                                id="notaValor"
                                type="number"
                                min="0"
                                max="10"
                                step="0.1"
                                value={newNota.valor || ''}
                                onChange={e => setNewNota({...newNota, valor: parseFloat(e.target.value) || 0})}
                                required
                              />
                            </div>
                            
                            <div className="space-y-2">
                              <Label htmlFor="notaPeso">Peso *</Label>
                              <Input
                                id="notaPeso"
                                type="number"
                                min="1"
                                step="1"
                                value={newNota.peso || ''}
                                onChange={e => setNewNota({...newNota, peso: parseInt(e.target.value) || 1})}
                                required
                              />
                            </div>
                          </div>
                          
                          <Button
                            type="button"
                            className="w-full"
                            onClick={handleAddNota}
                          >
                            Adicionar
                          </Button>
                        </CardContent>
                      </Card>
                    )}
                    
                    {currentAluno.notas.length > 0 ? (
                      <div className="rounded-md border">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Descrição</TableHead>
                              <TableHead>Nota</TableHead>
                              <TableHead>Peso</TableHead>
                              <TableHead className="w-[70px]"></TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {currentAluno.notas.map(nota => (
                              <TableRow key={nota.id}>
                                <TableCell>{nota.descricao}</TableCell>
                                <TableCell>{nota.valor.toFixed(1)}</TableCell>
                                <TableCell>{nota.peso}</TableCell>
                                <TableCell>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleRemoveNota(nota.id)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    ) : (
                      <div className="text-center p-4 border rounded-md bg-gray-50 dark:bg-gray-800">
                        <p className="text-gray-500 dark:text-gray-400">Nenhuma nota adicionada</p>
                      </div>
                    )}
                  </div>
                  
                  <DialogFooter>
                    <Button type="submit">
                      {alunos.some(a => a.id === currentAluno.id) ? 'Salvar Alterações' : 'Adicionar Aluno'}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            )}
          </Dialog>
          
          <Button
            variant="outline"
            onClick={() => exportAllToPDF([], [], alunos)}
            disabled={alunos.length === 0}
          >
            <FileText className="h-4 w-4 mr-1.5" />
            Exportar Todos
          </Button>
        </div>
      </div>
      
      {alunos.length === 0 ? (
        <div className="text-center p-12 border rounded-lg bg-gray-50 dark:bg-gray-800">
          <h3 className="text-lg font-medium mb-2">Nenhum aluno cadastrado</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            Adicione alunos para gerenciar suas notas e faltas
          </p>
          <Button onClick={initNewAluno}>
            <Plus className="h-4 w-4 mr-1.5" />
            Adicionar Aluno
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {alunos.map(aluno => {
            const media = calcularMediaPonderada(aluno.notas);
            const percentualFaltas = calcularPercentualFaltas(aluno);
            const situacao = determinarSituacao(aluno);
            
            return (
              <Card key={aluno.id} className="overflow-hidden transition-all hover:shadow-lg">
                <CardContent className="p-0">
                  <Collapsible>
                    <div className="p-6 space-y-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-xl font-bold">{aluno.nome}</h3>
                          <p className={`text-sm font-medium ${situacao.cor}`}>
                            {situacao.status}
                          </p>
                        </div>
                        <div className="flex space-x-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setCurrentAluno(aluno);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => exportAlunosToPDF([], aluno)}
                          >
                            <FileText className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => sendStudentReport(aluno)}
                          >
                            <Send className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteAluno(aluno.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 pt-2">
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <p className="text-sm text-gray-500 dark:text-gray-400">Média</p>
                            <p className="font-medium">{media.toFixed(1)}</p>
                          </div>
                          <Progress value={media * 10} className="h-2" />
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <p className="text-sm text-gray-500 dark:text-gray-400">Faltas</p>
                            <p className="font-medium">
                              {aluno.faltas}/{aluno.totalAulas} ({percentualFaltas.toFixed(1)}%)
                            </p>
                          </div>
                          <Progress 
                            value={percentualFaltas} 
                            max={aluno.limiteFaltas * 2}
                            className={`h-2 ${percentualFaltas > aluno.limiteFaltas ? 'bg-red-500' : ''}`} 
                          />
                        </div>
                      </div>
                      
                      <CollapsibleTrigger asChild>
                        <Button variant="ghost" className="w-full flex items-center justify-center">
                          <span className="mr-2">Detalhes</span>
                          <ChevronDown className="h-4 w-4" />
                        </Button>
                      </CollapsibleTrigger>
                    </div>
                    
                    <CollapsibleContent>
                      <div className="border-t p-6 bg-gray-50 dark:bg-gray-800/50 space-y-4">
                        <div>
                          <h4 className="text-sm font-medium mb-2">Informações</h4>
                          <div className="grid grid-cols-3 gap-4">
                            <div>
                              <p className="text-sm text-gray-500 dark:text-gray-400">Total de Aulas</p>
                              <p className="font-medium">{aluno.totalAulas}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-500 dark:text-gray-400">Faltas</p>
                              <p className="font-medium">{aluno.faltas}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-500 dark:text-gray-400">Limite de Faltas</p>
                              <p className="font-medium">{aluno.limiteFaltas}%</p>
                            </div>
                          </div>
                        </div>
                        
                        <div>
                          <h4 className="text-sm font-medium mb-2">Notas</h4>
                          {aluno.notas.length > 0 ? (
                            <div className="rounded-md border">
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead>Descrição</TableHead>
                                    <TableHead>Nota</TableHead>
                                    <TableHead>Peso</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {aluno.notas.map(nota => (
                                    <TableRow key={nota.id}>
                                      <TableCell>{nota.descricao}</TableCell>
                                      <TableCell>{nota.valor.toFixed(1)}</TableCell>
                                      <TableCell>{nota.peso}</TableCell>
                                    </TableRow>
                                  ))}
                                  <TableRow>
                                    <TableCell colSpan={2} className="font-medium text-right">
                                      Média Ponderada:
                                    </TableCell>
                                    <TableCell className="font-medium">
                                      {media.toFixed(1)}
                                    </TableCell>
                                  </TableRow>
                                </TableBody>
                              </Table>
                            </div>
                          ) : (
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              Nenhuma nota registrada
                            </p>
                          )}
                        </div>
                        
                        <div>
                          <h4 className="text-sm font-medium mb-2">Análise</h4>
                          <div className="space-y-2">
                            <div className="flex items-center space-x-2">
                              <div className={`w-2 h-2 rounded-full ${situacao.cor}`}></div>
                              <p className="text-sm">
                                Situação: <span className={`font-medium ${situacao.cor}`}>{situacao.status}</span>
                              </p>
                            </div>
                            
                            {percentualFaltas > 0 && (
                              <div className="flex items-center space-x-2">
                                {percentualFaltas > aluno.limiteFaltas ? (
                                  <>
                                    <AlertTriangle className="h-4 w-4 text-red-500" />
                                    <p className="text-sm text-red-500">
                                      Aluno excedeu o limite de faltas ({aluno.limiteFaltas}%)
                                    </p>
                                  </>
                                ) : (
                                  <>
                                    <Check className="h-4 w-4 text-green-500" />
                                    <p className="text-sm text-green-500">
                                      Frequência dentro do limite permitido
                                    </p>
                                  </>
                                )}
                              </div>
                            )}
                            
                            {aluno.notas.length > 0 && (
                              <div className="flex items-center space-x-2">
                                {media >= 6 ? (
                                  <>
                                    <Check className="h-4 w-4 text-green-500" />
                                    <p className="text-sm text-green-500">
                                      Média acima da nota mínima (6,0)
                                    </p>
                                  </>
                                ) : (
                                  <>
                                    <AlertTriangle className="h-4 w-4 text-red-500" />
                                    <p className="text-sm text-red-500">
                                      Média abaixo da nota mínima (6,0)
                                    </p>
                                  </>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AlunosPage;
