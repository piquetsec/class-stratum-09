
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Professor, Materia, Evento, Aluno, Nota } from './localStorage';

// Helper function to format date
const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('pt-BR');
};

// Export professores to PDF
export const exportProfessoresToPDF = (professores: Professor[], individual?: Professor): void => {
  const doc = new jsPDF();
  
  // If individual is provided, export just that professor
  const professoresToExport = individual ? [individual] : professores;
  
  doc.setFontSize(16);
  doc.text('Relatório de Professores', 14, 20);
  doc.setFontSize(10);
  doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, 14, 26);
  
  let yPos = 40;
  
  professoresToExport.forEach((professor, index) => {
    // Reset yPos if we're about to go off page and not on the first item
    if (yPos > 250 && index > 0) {
      doc.addPage();
      yPos = 20;
    }
    
    doc.setFontSize(14);
    doc.text(`Professor: ${professor.nome}`, 14, yPos);
    yPos += 6;
    
    doc.setFontSize(10);
    doc.text(`Título: ${professor.titulo}`, 14, yPos);
    yPos += 5;
    
    doc.text(`Estatutário: ${professor.estatutario ? 'Sim' : 'Não'}`, 14, yPos);
    yPos += 5;
    
    doc.text(`Valor da Hora/Aula: R$ ${professor.valorHoraAula.toFixed(2)}`, 14, yPos);
    yPos += 5;
    
    if (professor.observacoes) {
      doc.text(`Observações: ${professor.observacoes}`, 14, yPos);
      yPos += 5;
    }
    
    yPos += 5;
    
    // Table for materias
    if (professor.materias.length > 0) {
      const tableColumn = ['Matéria', 'Data', 'Horário', 'Local', 'Horas Aula'];
      const tableRows = professor.materias.map(materia => [
        materia.nome,
        formatDate(materia.data),
        materia.horario,
        materia.local,
        materia.horasAula.toString()
      ]);
      
      // Total hours and payment calculation
      const totalHoras = professor.materias.reduce((total, materia) => total + materia.horasAula, 0);
      const totalPagamento = totalHoras * professor.valorHoraAula;
      
      // Add table to document
      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: yPos
      });
      
      yPos = (doc as any).lastAutoTable.finalY + 10;
      
      doc.text(`Total de Horas: ${totalHoras}`, 14, yPos);
      yPos += 5;
      doc.text(`Total a Receber: R$ ${totalPagamento.toFixed(2)}`, 14, yPos);
      yPos += 15;
    } else {
      doc.text('Nenhuma matéria registrada.', 14, yPos);
      yPos += 15;
    }
    
    // Add separator except for the last item
    if (index < professoresToExport.length - 1) {
      doc.setDrawColor(200, 200, 200);
      doc.line(14, yPos - 5, 196, yPos - 5);
      yPos += 10;
    }
  });
  
  // Save the PDF
  doc.save(individual ? `professor_${individual.nome}.pdf` : 'professores.pdf');
};

// Export eventos to PDF
export const exportEventosToPDF = (eventos: Evento[], individual?: Evento): void => {
  const doc = new jsPDF();
  
  // If individual is provided, export just that evento
  const eventosToExport = individual ? [individual] : eventos;
  
  doc.setFontSize(16);
  doc.text('Relatório de Agenda', 14, 20);
  doc.setFontSize(10);
  doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, 14, 26);
  
  let yPos = 40;
  
  eventosToExport.forEach((evento, index) => {
    // Reset yPos if we're about to go off page and not on the first item
    if (yPos > 250 && index > 0) {
      doc.addPage();
      yPos = 20;
    }
    
    doc.setFontSize(14);
    doc.text(`Evento: ${evento.titulo}`, 14, yPos);
    yPos += 6;
    
    doc.setFontSize(10);
    doc.text(`Data: ${formatDate(evento.data)} - Hora: ${evento.hora}`, 14, yPos);
    yPos += 5;
    
    doc.text(`Prioridade: ${evento.prioridade.charAt(0).toUpperCase() + evento.prioridade.slice(1)}`, 14, yPos);
    yPos += 5;
    
    doc.text(`WhatsApp: ${evento.whatsapp}`, 14, yPos);
    yPos += 5;
    
    doc.text(`Notificação Antecipada: ${evento.notificacaoAntecipada} dia(s)`, 14, yPos);
    yPos += 5;
    
    doc.text(`Descrição: ${evento.descricao}`, 14, yPos);
    yPos += 15;
    
    // Add separator except for the last item
    if (index < eventosToExport.length - 1) {
      doc.setDrawColor(200, 200, 200);
      doc.line(14, yPos - 5, 196, yPos - 5);
      yPos += 10;
    }
  });
  
  // Save the PDF
  doc.save(individual ? `evento_${individual.titulo}.pdf` : 'agenda.pdf');
};

// Export alunos to PDF
export const exportAlunosToPDF = (alunos: Aluno[], individual?: Aluno): void => {
  const doc = new jsPDF();
  
  // If individual is provided, export just that aluno
  const alunosToExport = individual ? [individual] : alunos;
  
  doc.setFontSize(16);
  doc.text('Relatório de Alunos', 14, 20);
  doc.setFontSize(10);
  doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, 14, 26);
  
  let yPos = 40;
  
  alunosToExport.forEach((aluno, index) => {
    // Reset yPos if we're about to go off page and not on the first item
    if (yPos > 250 && index > 0) {
      doc.addPage();
      yPos = 20;
    }
    
    doc.setFontSize(14);
    doc.text(`Aluno: ${aluno.nome}`, 14, yPos);
    yPos += 6;
    
    doc.setFontSize(10);
    
    // Calculate media and situacao
    let mediaPonderada = 0;
    const somaPesos = aluno.notas.reduce((total, nota) => total + nota.peso, 0);
    
    if (somaPesos > 0) {
      mediaPonderada = aluno.notas.reduce((total, nota) => total + (nota.valor * nota.peso), 0) / somaPesos;
    }
    
    const percentualFaltas = (aluno.faltas / aluno.totalAulas) * 100;
    const situacao = percentualFaltas > aluno.limiteFaltas ? 'Reprovado por Faltas' : mediaPonderada >= 6 ? 'Aprovado' : 'Reprovado por Nota';
    
    doc.text(`Total de Aulas: ${aluno.totalAulas}`, 14, yPos);
    yPos += 5;
    
    doc.text(`Faltas: ${aluno.faltas} (${percentualFaltas.toFixed(2)}%)`, 14, yPos);
    yPos += 5;
    
    doc.text(`Limite de Faltas: ${aluno.limiteFaltas}%`, 14, yPos);
    yPos += 5;
    
    doc.text(`Média Ponderada: ${mediaPonderada.toFixed(2)}`, 14, yPos);
    yPos += 5;
    
    doc.text(`Situação: ${situacao}`, 14, yPos);
    yPos += 10;
    
    // Table for notas
    if (aluno.notas.length > 0) {
      const tableColumn = ['Descrição', 'Nota', 'Peso'];
      const tableRows = aluno.notas.map(nota => [
        nota.descricao,
        nota.valor.toFixed(2),
        nota.peso.toString()
      ]);
      
      // Add table to document
      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: yPos
      });
      
      yPos = (doc as any).lastAutoTable.finalY + 15;
    } else {
      doc.text('Nenhuma nota registrada.', 14, yPos);
      yPos += 15;
    }
    
    // Add separator except for the last item
    if (index < alunosToExport.length - 1) {
      doc.setDrawColor(200, 200, 200);
      doc.line(14, yPos - 5, 196, yPos - 5);
      yPos += 10;
    }
  });
  
  // Save the PDF
  doc.save(individual ? `aluno_${individual.nome}.pdf` : 'alunos.pdf');
};

// Export all data to PDF
export const exportAllToPDF = (professores: Professor[], eventos: Evento[], alunos: Aluno[]): void => {
  const doc = new jsPDF();
  
  doc.setFontSize(18);
  doc.text('Relatório Completo do Sistema', 14, 20);
  doc.setFontSize(10);
  doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, 14, 26);
  
  // Add professores
  if (professores.length > 0) {
    doc.setFontSize(16);
    doc.text('Professores', 14, 35);
    
    let yPos = 45;
    
    professores.forEach((professor, index) => {
      // Check if we need a new page
      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
      }
      
      doc.setFontSize(12);
      doc.text(`${index + 1}. ${professor.nome} - ${professor.titulo}`, 14, yPos);
      yPos += 5;
      
      doc.setFontSize(10);
      doc.text(`Estatutário: ${professor.estatutario ? 'Sim' : 'Não'}`, 20, yPos);
      yPos += 5;
      
      // Total hours and payment calculation
      const totalHoras = professor.materias.reduce((total, materia) => total + materia.horasAula, 0);
      const totalPagamento = totalHoras * professor.valorHoraAula;
      
      doc.text(`Total de Horas: ${totalHoras} - Valor da Hora: R$ ${professor.valorHoraAula.toFixed(2)}`, 20, yPos);
      yPos += 5;
      doc.text(`Total a Receber: R$ ${totalPagamento.toFixed(2)}`, 20, yPos);
      yPos += 10;
    });
    
    // Add page break after professores
    doc.addPage();
  }
  
  // Add eventos
  if (eventos.length > 0) {
    doc.setFontSize(16);
    doc.text('Agenda', 14, 20);
    
    let yPos = 30;
    
    // Group eventos by month for a more structured report
    const eventosByMonth: { [key: string]: Evento[] } = {};
    
    eventos.forEach(evento => {
      const date = new Date(evento.data);
      const monthYear = `${date.getMonth() + 1}/${date.getFullYear()}`;
      
      if (!eventosByMonth[monthYear]) {
        eventosByMonth[monthYear] = [];
      }
      
      eventosByMonth[monthYear].push(evento);
    });
    
    Object.entries(eventosByMonth).forEach(([monthYear, monthEventos]) => {
      // Check if we need a new page
      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
      }
      
      doc.setFontSize(12);
      const [month, year] = monthYear.split('/');
      const monthName = new Date(parseInt(year), parseInt(month) - 1).toLocaleString('pt-BR', { month: 'long' });
      doc.text(`${monthName.charAt(0).toUpperCase() + monthName.slice(1)} de ${year}`, 14, yPos);
      yPos += 8;
      
      monthEventos.sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime());
      
      monthEventos.forEach(evento => {
        // Check if we need a new page
        if (yPos > 250) {
          doc.addPage();
          yPos = 20;
        }
        
        doc.setFontSize(10);
        doc.text(`${formatDate(evento.data)} - ${evento.hora}: ${evento.titulo} (${evento.prioridade})`, 20, yPos);
        yPos += 5;
      });
      
      yPos += 5;
    });
    
    // Add page break after eventos
    doc.addPage();
  }
  
  // Add alunos
  if (alunos.length > 0) {
    doc.setFontSize(16);
    doc.text('Alunos', 14, 20);
    
    let yPos = 30;
    
    alunos.forEach((aluno, index) => {
      // Check if we need a new page
      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
      }
      
      // Calculate media and situacao
      let mediaPonderada = 0;
      const somaPesos = aluno.notas.reduce((total, nota) => total + nota.peso, 0);
      
      if (somaPesos > 0) {
        mediaPonderada = aluno.notas.reduce((total, nota) => total + (nota.valor * nota.peso), 0) / somaPesos;
      }
      
      const percentualFaltas = (aluno.faltas / aluno.totalAulas) * 100;
      const situacao = percentualFaltas > aluno.limiteFaltas ? 'Reprovado por Faltas' : mediaPonderada >= 6 ? 'Aprovado' : 'Reprovado por Nota';
      
      doc.setFontSize(12);
      doc.text(`${index + 1}. ${aluno.nome}`, 14, yPos);
      yPos += 5;
      
      doc.setFontSize(10);
      doc.text(`Faltas: ${aluno.faltas}/${aluno.totalAulas} (${percentualFaltas.toFixed(2)}%)`, 20, yPos);
      yPos += 5;
      
      doc.text(`Média: ${mediaPonderada.toFixed(2)} - Situação: ${situacao}`, 20, yPos);
      yPos += 10;
    });
  }
  
  // Save the PDF
  doc.save('relatorio_completo.pdf');
};
