
import { Evento } from './localStorage';

// Check if browser notifications are supported
export const isNotificationsSupported = (): boolean => {
  return 'Notification' in window;
};

// Request notification permission
export const requestNotificationPermission = async (): Promise<boolean> => {
  if (!isNotificationsSupported()) {
    return false;
  }
  
  if (Notification.permission === 'granted') {
    return true;
  }
  
  const permission = await Notification.requestPermission();
  return permission === 'granted';
};

// Show notification
export const showNotification = (title: string, options: NotificationOptions = {}): void => {
  if (!isNotificationsSupported()) {
    console.warn('Notifications are not supported in this browser');
    return;
  }
  
  if (Notification.permission !== 'granted') {
    console.warn('Notification permission not granted');
    return;
  }
  
  const defaultOptions: NotificationOptions = {
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    silent: false,
  };
  
  const notification = new Notification(title, { ...defaultOptions, ...options });
  
  // Auto close after 10 seconds
  setTimeout(() => {
    notification.close();
  }, 10000);
  
  // Handle click
  notification.onclick = () => {
    window.focus();
    notification.close();
  };
};

// Check for due events and show notifications
export const checkEventNotifications = (eventos: Evento[]): Evento[] => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const notifiedEvents: Evento[] = [];
  
  eventos.forEach(evento => {
    if (evento.notificado) {
      return;
    }
    
    const eventDate = new Date(evento.data);
    eventDate.setHours(0, 0, 0, 0);
    
    // Calculate days difference
    const diffTime = eventDate.getTime() - today.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    // Check if it's time to notify (event day or notification days before)
    if (diffDays === 0 || diffDays === evento.notificacaoAntecipada) {
      const title = diffDays === 0
        ? `Evento hoje: ${evento.titulo}`
        : `Evento em ${diffDays} dias: ${evento.titulo}`;
      
      const options: NotificationOptions = {
        body: `${evento.descricao}\nData: ${eventDate.toLocaleDateString('pt-BR')}\nHora: ${evento.hora}`,
        tag: `evento-${evento.id}`,
      };
      
      showNotification(title, options);
      notifiedEvents.push(evento);
    }
  });
  
  return notifiedEvents;
};

// Play alert sound
export const playAlertSound = (urgent: boolean = false): void => {
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  
  // Create oscillator
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();
  
  // Configure oscillator
  oscillator.type = urgent ? 'sawtooth' : 'sine';
  oscillator.frequency.setValueAtTime(urgent ? 880 : 440, audioContext.currentTime);
  
  // Configure gain (volume)
  gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 1);
  
  // Connect nodes
  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);
  
  // Play sound
  oscillator.start();
  setTimeout(() => {
    oscillator.stop();
  }, 1000);
};
