
import React, { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Moon, Sun, Bell, Send, FileText, Save, Download, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AppConfig, getConfig, setConfig, StorageKey } from '@/utils/localStorage';
import { requestNotificationPermission, isNotificationsSupported } from '@/utils/notifications';
import { exportAllToPDF } from '@/utils/pdfExport';

const ConfiguracoesPage = () => {
  const { toast } = useToast();
  const [config, setConfigState] = useState<AppConfig>({
    darkMode: false,
    whatsappIntegration: true,
  });
  const [notificationsAllowed, setNotificationsAllowed] = useState<boolean>(false);
  const [confirmReset, setConfirmReset] = useState<boolean>(false);
  
  // Load config from localStorage
  useEffect(() => {
    const loadedConfig = getConfig();
    setConfigState(loadedConfig);
    
    // Check if dark mode is already applied
    if (loadedConfig.darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    
    // Check notification permission
    if (isNotificationsSupported()) {
      setNotificationsAllowed(Notification.permission === 'granted');
    }
  }, []);
  
  // Save config to localStorage when state changes
  useEffect(() => {
    setConfig(config);
  }, [config]);
  
  // Toggle dark mode
  const toggleDarkMode = () => {
    const newValue = !config.darkMode;
    setConfigState({
      ...config,
      darkMode: newValue,
    });
    
    if (newValue) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    
    toast({
      title: newValue ? "Modo escuro ativado" : "Modo claro ativado",
      description: `O tema foi alterado para o modo ${newValue ? 'escuro' : 'claro'}.`,
    });
  };
  
  // Toggle WhatsApp integration
  const toggleWhatsAppIntegration = () => {
    const newValue = !config.whatsappIntegration;
    setConfigState({
      ...config,
      whatsappIntegration: newValue,
    });
    
    toast({
      title: newValue ? "Integração com WhatsApp ativada" : "Integração com WhatsApp desativada",
      description: `A integração com WhatsApp foi ${newValue ? 'ativada' : 'desativada'}.`,
    });
  };
  
  // Request notification permission
  const handleRequestNotificationPermission = async () => {
    const granted = await requestNotificationPermission();
    setNotificationsAllowed(granted);
    
    if (granted) {
      toast({
        title: "Notificações permitidas",
        description: "Você receberá notificações sobre eventos e lembretes.",
      });
    } else {
      toast({
        title: "Notificações bloqueadas",
        description: "Você não receberá notificações. Verifique as configurações do seu navegador para permitir notificações.",
        variant: "destructive",
      });
    }
  };
  
  // Export all data
  const handleExportAllData = () => {
    exportAllToPDF([], [], []);
    
    toast({
      title: "Exportação iniciada",
      description: "Todos os dados estão sendo exportados para PDF.",
    });
  };
  
  // Export data as JSON
  const handleExportJSON = () => {
    const allData = {
      professores: localStorage.getItem(StorageKey.PROFESSORES) ? JSON.parse(localStorage.getItem(StorageKey.PROFESSORES) || '[]') : [],
      eventos: localStorage.getItem(StorageKey.EVENTOS) ? JSON.parse(localStorage.getItem(StorageKey.EVENTOS) || '[]') : [],
      alunos: localStorage.getItem(StorageKey.ALUNOS) ? JSON.parse(localStorage.getItem(StorageKey.ALUNOS) || '[]') : [],
      config: config,
    };
    
    const dataStr = JSON.stringify(allData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `edusys_backup_${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    toast({
      title: "Backup realizado",
      description: "Os dados foram exportados com sucesso.",
    });
  };
  
  // Import data from JSON
  const handleImportJSON = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        
        if (data.professores) localStorage.setItem(StorageKey.PROFESSORES, JSON.stringify(data.professores));
        if (data.eventos) localStorage.setItem(StorageKey.EVENTOS, JSON.stringify(data.eventos));
        if (data.alunos) localStorage.setItem(StorageKey.ALUNOS, JSON.stringify(data.alunos));
        if (data.config) {
          setConfigState(data.config);
          setConfig(data.config);
          
          if (data.config.darkMode) {
            document.documentElement.classList.add('dark');
          } else {
            document.documentElement.classList.remove('dark');
          }
        }
        
        toast({
          title: "Importação concluída",
          description: "Os dados foram importados com sucesso. Recarregue a página para ver as alterações.",
        });
        
        // Reload after 2 seconds to refresh data
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } catch (error) {
        toast({
          title: "Erro na importação",
          description: "O arquivo selecionado não é um backup válido.",
          variant: "destructive",
        });
      }
    };
    reader.readAsText(file);
    
    // Reset the input
    event.target.value = '';
  };
  
  // Reset all data
  const handleResetData = () => {
    localStorage.removeItem(StorageKey.PROFESSORES);
    localStorage.removeItem(StorageKey.EVENTOS);
    localStorage.removeItem(StorageKey.ALUNOS);
    
    setConfirmReset(false);
    
    toast({
      title: "Dados resetados",
      description: "Todos os dados foram apagados. Recarregue a página para ver as alterações.",
    });
    
    // Reload after 2 seconds
    setTimeout(() => {
      window.location.reload();
    }, 2000);
  };
  
  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold">Configurações</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Personalize as configurações do sistema
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Aparência</CardTitle>
            <CardDescription>Personalize a aparência do sistema</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {config.darkMode ? (
                  <Moon className="h-5 w-5" />
                ) : (
                  <Sun className="h-5 w-5" />
                )}
                <Label htmlFor="dark-mode">Modo Escuro</Label>
              </div>
              <Switch
                id="dark-mode"
                checked={config.darkMode}
                onCheckedChange={toggleDarkMode}
              />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Notificações</CardTitle>
            <CardDescription>Configure as notificações do sistema</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Bell className="h-5 w-5" />
                <Label htmlFor="notifications">Permitir Notificações</Label>
              </div>
              {isNotificationsSupported() ? (
                <Switch
                  id="notifications"
                  checked={notificationsAllowed}
                  onCheckedChange={handleRequestNotificationPermission}
                  disabled={notificationsAllowed}
                />
              ) : (
                <p className="text-sm text-gray-500">Não suportado neste navegador</p>
              )}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Integrações</CardTitle>
            <CardDescription>Configure as integrações com outros serviços</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Send className="h-5 w-5" />
                <Label htmlFor="whatsapp-integration">Integração com WhatsApp</Label>
              </div>
              <Switch
                id="whatsapp-integration"
                checked={config.whatsappIntegration}
                onCheckedChange={toggleWhatsAppIntegration}
              />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Exportação e Backup</CardTitle>
            <CardDescription>Exporte relatórios e faça backup dos seus dados</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button variant="outline" className="w-full justify-start" onClick={handleExportAllData}>
              <FileText className="h-4 w-4 mr-2" />
              Exportar Todos os Dados para PDF
            </Button>
            
            <Button variant="outline" className="w-full justify-start" onClick={handleExportJSON}>
              <Save className="h-4 w-4 mr-2" />
              Fazer Backup (JSON)
            </Button>
            
            <div className="flex items-center justify-between border rounded-md p-2">
              <div className="flex items-center space-x-2">
                <Download className="h-4 w-4" />
                <Label htmlFor="import-json">Restaurar Backup</Label>
              </div>
              <input
                id="import-json"
                type="file"
                accept=".json"
                className="hidden"
                onChange={handleImportJSON}
              />
              <Button variant="ghost" size="sm" onClick={() => document.getElementById('import-json')?.click()}>
                Selecionar Arquivo
              </Button>
            </div>
          </CardContent>
        </Card>
        
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-red-500">Zona de Perigo</CardTitle>
            <CardDescription>Ações irreversíveis que afetam todos os seus dados</CardDescription>
          </CardHeader>
          <CardContent>
            <Dialog open={confirmReset} onOpenChange={setConfirmReset}>
              <DialogTrigger asChild>
                <Button variant="destructive" className="w-full justify-start">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Resetar Todos os Dados
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Confirmar Reset de Dados</DialogTitle>
                  <DialogDescription>
                    Esta ação irá apagar permanentemente todos os seus dados. Esta ação não pode ser desfeita.
                  </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                  <p className="text-sm text-red-500">
                    Considere fazer um backup dos seus dados antes de prosseguir.
                  </p>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setConfirmReset(false)}>
                    Cancelar
                  </Button>
                  <Button variant="destructive" onClick={handleResetData}>
                    Sim, Resetar Dados
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardContent>
          <CardFooter className="border-t">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Estas ações são irreversíveis e podem resultar na perda permanente de todos os seus dados.
              Recomendamos fazer um backup antes de prosseguir.
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default ConfiguracoesPage;
