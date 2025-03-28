
// Function to format WhatsApp number
export const formatWhatsAppNumber = (number: string): string => {
  // If number is empty or undefined, return empty string
  if (!number) return '';
  
  // Remove all non-numeric characters
  const cleaned = number.replace(/\D/g, '');
  
  // Check if the number already has the country code
  if (cleaned.startsWith('55')) {
    return cleaned;
  }
  
  // Add Brazil country code if not present
  return `55${cleaned}`;
};

// Function to open WhatsApp chat
export const openWhatsAppChat = (number: string, message: string = ''): void => {
  // If number is empty, show error in console and return
  if (!number) {
    console.error('Número de WhatsApp não fornecido');
    return;
  }
  
  const formattedNumber = formatWhatsAppNumber(number);
  const encodedMessage = encodeURIComponent(message);
  const url = `https://wa.me/${formattedNumber}?text=${encodedMessage}`;
  
  window.open(url, '_blank');
};

// Function to create event reminder message
export const createEventReminderMessage = (title: string, date: string, time: string, description: string): string => {
  // Fix date formatting to ensure it's consistent
  let formattedDate;
  try {
    // Parse the date string to get a Date object
    const dateObj = new Date(date);
    // Format the date as DD/MM/YYYY
    formattedDate = dateObj.toLocaleDateString('pt-BR');
  } catch (e) {
    // If parsing fails, use the original string
    formattedDate = date;
  }
  
  return `🔔 *Lembrete de Evento*\n\n*${title}*\nData: ${formattedDate}\nHora: ${time}\n\n${description}\n\nEste é um lembrete automático do EduSys.`;
};

// Function to create professor payment message
export const createProfessorPaymentMessage = (nome: string, totalHoras: number, valorHora: number, totalPagamento: number): string => {
  return `💰 *Relatório de Pagamento*\n\nProfessor: ${nome}\nTotal de Horas: ${totalHoras}\nValor da Hora/Aula: R$ ${valorHora.toFixed(2)}\nTotal a Receber: R$ ${totalPagamento.toFixed(2)}\n\nMensagem automática do EduSys.`;
};

// Function to create student report message
export const createStudentReportMessage = (nome: string, media: number, faltas: number, totalAulas: number, situacao: string): string => {
  const percentualFaltas = (faltas / totalAulas) * 100;
  
  return `📚 *Relatório de Aluno*\n\nAluno: ${nome}\nMédia: ${media.toFixed(2)}\nFaltas: ${faltas}/${totalAulas} (${percentualFaltas.toFixed(2)}%)\nSituação: ${situacao}\n\nMensagem automática do EduSys.`;
};
