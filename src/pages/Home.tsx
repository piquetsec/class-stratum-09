
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, Calendar, GraduationCap, Settings, ArrowRight, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { getProfessores, getEventos, getAlunos, getConfig } from '@/utils/localStorage';
import { useToast } from '@/hooks/use-toast';
import { requestNotificationPermission, isNotificationsSupported } from '@/utils/notifications';

const Home = () => {
  const { toast } = useToast();
  const [stats, setStats] = useState({
    professores: 0,
    eventos: 0,
    eventosPendentes: 0,
    alunos: 0,
  });
  
  useEffect(() => {
    // Load stats
    const professores = getProfessores();
    const eventos = getEventos();
    const alunos = getAlunos();
    const config = getConfig();
    
    // Count pending events (future events)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const eventosPendentes = eventos.filter(evento => {
      const eventDate = new Date(evento.data);
      return eventDate >= today;
    }).length;
    
    setStats({
      professores: professores.length,
      eventos: eventos.length,
      eventosPendentes,
      alunos: alunos.length,
    });
    
    // Apply dark mode if configured
    if (config.darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    
    // Request notification permission if not already granted
    if (isNotificationsSupported() && Notification.permission !== 'granted') {
      requestNotificationPermission();
    }
  }, []);
  
  // Request notification permission
  const handleRequestPermission = async () => {
    if (!isNotificationsSupported()) {
      toast({
        title: "Notificações não suportadas",
        description: "Seu navegador não suporta notificações.",
        variant: "destructive",
      });
      return;
    }
    
    const granted = await requestNotificationPermission();
    
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
  
  const modules = [
    {
      title: 'Gestão de Professores',
      description: 'Gerencie informações e pagamentos dos professores',
      icon: Users,
      path: '/professores',
      count: stats.professores,
      color: 'bg-blue-500',
    },
    {
      title: 'Agenda',
      description: 'Gerencie eventos e compromissos',
      icon: Calendar,
      path: '/agenda',
      count: stats.eventos,
      badge: stats.eventosPendentes > 0 ? `${stats.eventosPendentes} pendentes` : undefined,
      color: 'bg-amber-500',
    },
    {
      title: 'Gestão de Alunos',
      description: 'Gerencie notas e faltas dos alunos',
      icon: GraduationCap,
      path: '/alunos',
      count: stats.alunos,
      color: 'bg-green-500',
    },
    {
      title: 'Configurações',
      description: 'Personalize as configurações do sistema',
      icon: Settings,
      path: '/configuracoes',
      color: 'bg-purple-500',
    },
  ];
  
  return (
    <div className="space-y-8 animate-fade-in">
      <div className="text-center max-w-3xl mx-auto py-12">
        <h1 className="text-4xl font-bold">Sistema de Gestão Educacional</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-4 text-lg">
          Gerencie professores, alunos e agenda em um único lugar
        </p>
        
        {isNotificationsSupported() && Notification.permission !== 'granted' && (
          <Button 
            onClick={handleRequestPermission}
            className="mt-6"
            variant="outline"
          >
            <Bell className="h-4 w-4 mr-2" />
            Permitir Notificações
          </Button>
        )}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {modules.map((module, index) => (
          <Card key={index} className="overflow-hidden hover:shadow-lg transition-all">
            <CardHeader className={`text-white ${module.color}`}>
              <div className="flex justify-between items-center">
                <CardTitle className="text-xl">{module.title}</CardTitle>
                <module.icon className="h-6 w-6 opacity-80" />
              </div>
              <CardDescription className="text-white/80">
                {module.description}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              {module.count !== undefined && (
                <div className="text-3xl font-bold">{module.count}</div>
              )}
              {module.badge && (
                <div className="mt-2 inline-block px-2 py-1 bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-100 rounded text-xs font-medium">
                  {module.badge}
                </div>
              )}
            </CardContent>
            <CardFooter className="border-t p-4">
              <Link to={module.path} className="w-full">
                <Button variant="ghost" className="w-full justify-between">
                  <span>Acessar</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </CardFooter>
          </Card>
        ))}
      </div>
      
      <div className="rounded-lg border bg-card text-card-foreground p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold">Comece a usar o sistema agora</h2>
            <p className="text-muted-foreground mt-1">
              Escolha um dos módulos acima para começar a gerenciar suas informações
            </p>
          </div>
          <div className="flex space-x-4">
            <Link to="/professores">
              <Button>
                <Users className="h-4 w-4 mr-2" />
                Professores
              </Button>
            </Link>
            <Link to="/agenda">
              <Button variant="outline">
                <Calendar className="h-4 w-4 mr-2" />
                Agenda
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
