
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Professor, Materia, Evento, Aluno, Nota } from './localStorage';

// Helper function to format date
const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('pt-BR');
};

// Helper function to format currency
const formatCurrency = (value: number): string => {
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
};

// Export professores to PDF with Excel-like formatting
export const exportProfessoresToPDF = (professores: Professor[], individual?: Professor): void => {
  const doc = new jsPDF();
  
  // If individual is provided, export just that professor
  const professoresToExport = individual ? [individual] : professores;
  
  // Document title and header
  doc.setFontSize(16);
  doc.text('Relatório de Professores', 14, 20);
  doc.setFontSize(10);
  doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, 14, 26);
  
  // Loop through each professor
  professoresToExport.forEach((professor, index) => {
    // Add a new page for each professor except the first one
    if (index > 0) {
      doc.addPage();
    }
    
    // Professor info section
    doc.setFontSize(14);
    doc.text(`Professor: ${professor.nome}`, 14, 40);
    
    // Create a table for professor details
    const professorDetailsData = [
      ['Título:', professor.titulo],
      ['Estatutário:', professor.estatutario ? 'Sim' : 'Não'],
      ['Valor da Hora/Aula:', formatCurrency(professor.valorHoraAula)],
      ['Observações:', professor.observacoes || '']
    ];
    
    autoTable(doc, {
      startY: 45,
      head: [['Informação', 'Detalhe']],
      body: professorDetailsData,
      theme: 'grid',
      headStyles: { fillColor: [41, 128, 185], textColor: 255 },
      margin: { top: 40 }
    });
    
    let lastY = (doc as any).lastAutoTable.finalY + 10;
    
    // Matérias table
    if (professor.materias.length > 0) {
      doc.setFontSize(12);
      doc.text('Matérias Ministradas:', 14, lastY);
      
      const tableColumn = ['Matéria', 'Data', 'Horário', 'Local', 'Horas Aula'];
      const tableRows = professor.materias.map(materia => [
        materia.nome,
        formatDate(materia.data),
        materia.horario,
        materia.local,
        materia.horasAula.toString()
      ]);
      
      // Add table to document
      autoTable(doc, {
        startY: lastY + 5,
        head: [tableColumn],
        body: tableRows,
        theme: 'grid',
        headStyles: { fillColor: [41, 128, 185], textColor: 255 }
      });
      
      // Calculate totals
      const totalHoras = professor.materias.reduce((total, materia) => total + materia.horasAula, 0);
      const totalPagamento = totalHoras * professor.valorHoraAula;
      
      // Add summary table
      lastY = (doc as any).lastAutoTable.finalY + 10;
      
      const summaryData = [
        ['Total de Horas:', totalHoras.toString()],
        ['Total a Receber:', formatCurrency(totalPagamento)]
      ];
      
      autoTable(doc, {
        startY: lastY,
        body: summaryData,
        theme: 'grid',
        styles: { fontStyle: 'bold' },
        columnStyles: {
          0: { cellWidth: 100 },
          1: { cellWidth: 100, halign: 'right' }
        }
      });
    } else {
      doc.setFontSize(12);
      doc.text('Nenhuma matéria registrada.', 14, lastY);
    }
  });
  
  // Save the PDF
  doc.save(individual ? `professor_${individual.nome}.pdf` : 'professores.pdf');
};

// Export eventos to PDF with Excel-like formatting
export const exportEventosToPDF = (eventos: Evento[], individual?: Evento): void => {
  const doc = new jsPDF();
  
  // If individual is provided, export just that evento
  const eventosToExport = individual ? [individual] : eventos;
  
  // Document title and header
  doc.setFontSize(16);
  doc.text('Relatório de Agenda', 14, 20);
  doc.setFontSize(10);
  doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, 14, 26);
  
  // Create table data for all eventos
  const tableColumn = ['Título', 'Data', 'Hora', 'Prioridade', 'WhatsApp', 'Notificação (dias)', 'Descrição'];
  const tableRows = eventosToExport.map(evento => [
    evento.titulo,
    formatDate(evento.data),
    evento.hora,
    evento.prioridade.charAt(0).toUpperCase() + evento.prioridade.slice(1),
    evento.whatsapp,
    evento.notificacaoAntecipada.toString(),
    evento.descricao
  ]);
  
  // Add table to document with Excel-like styling
  autoTable(doc, {
    startY: 35,
    head: [tableColumn],
    body: tableRows,
    theme: 'grid',
    headStyles: { fillColor: [41, 128, 185], textColor: 255 },
    styles: { overflow: 'linebreak' },
    columnStyles: {
      0: { cellWidth: 30 },
      6: { cellWidth: 50 }
    }
  });
  
  // Save the PDF
  doc.save(individual ? `evento_${individual.titulo}.pdf` : 'agenda.pdf');
};

// Export alunos to PDF with Excel-like formatting
export const exportAlunosToPDF = (alunos: Aluno[], individual?: Aluno): void => {
  const doc = new jsPDF();
  
  // If individual is provided, export just that aluno
  const alunosToExport = individual ? [individual] : alunos;
  
  // Document title and header
  doc.setFontSize(16);
  doc.text('Relatório de Alunos', 14, 20);
  doc.setFontSize(10);
  doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, 14, 26);
  
  let yPos = 35;
  
  // Loop through each aluno
  alunosToExport.forEach((aluno, index) => {
    // Add a new page for each aluno except the first one
    if (index > 0) {
      doc.addPage();
      yPos = 35;
    }
    
    // Aluno header
    doc.setFontSize(14);
    doc.text(`Aluno: ${aluno.nome}`, 14, yPos);
    yPos += 10;
    
    // Calculate media and situacao
    let mediaPonderada = 0;
    const somaPesos = aluno.notas.reduce((total, nota) => total + nota.peso, 0);
    
    if (somaPesos > 0) {
      mediaPonderada = aluno.notas.reduce((total, nota) => total + (nota.valor * nota.peso), 0) / somaPesos;
    }
    
    const percentualFaltas = (aluno.faltas / aluno.totalAulas) * 100;
    const situacao = percentualFaltas > aluno.limiteFaltas ? 'Reprovado por Faltas' : mediaPonderada >= 6 ? 'Aprovado' : 'Reprovado por Nota';
    
    // Create info table
    const infoData = [
      ['Total de Aulas:', aluno.totalAulas.toString()],
      ['Faltas:', `${aluno.faltas} (${percentualFaltas.toFixed(2)}%)`],
      ['Limite de Faltas:', `${aluno.limiteFaltas}%`],
      ['Média Ponderada:', mediaPonderada.toFixed(2)],
      ['Situação:', situacao]
    ];
    
    autoTable(doc, {
      startY: yPos,
      body: infoData,
      theme: 'grid',
      styles: { fontStyle: 'bold' },
      columnStyles: {
        0: { cellWidth: 100 },
        1: { cellWidth: 100 }
      }
    });
    
    yPos = (doc as any).lastAutoTable.finalY + 10;
    
    // Notas table
    if (aluno.notas.length > 0) {
      doc.setFontSize(12);
      doc.text('Notas:', 14, yPos);
      yPos += 5;
      
      const notasColumn = ['Descrição', 'Nota', 'Peso'];
      const notasRows = aluno.notas.map(nota => [
        nota.descricao,
        nota.valor.toFixed(2),
        nota.peso.toString()
      ]);
      
      // Add table to document
      autoTable(doc, {
        startY: yPos,
        head: [notasColumn],
        body: notasRows,
        theme: 'grid',
        headStyles: { fillColor: [41, 128, 185], textColor: 255 }
      });
    } else {
      doc.setFontSize(12);
      doc.text('Nenhuma nota registrada.', 14, yPos);
    }
  });
  
  // Save the PDF
  doc.save(individual ? `aluno_${individual.nome}.pdf` : 'alunos.pdf');
};

// Export all data to PDF with Excel-like formatting
export const exportAllToPDF = (professores: Professor[], eventos: Evento[], alunos: Aluno[]): void => {
  const doc = new jsPDF();
  
  // Document title and header
  doc.setFontSize(18);
  doc.text('Relatório Completo do Sistema', 14, 20);
  doc.setFontSize(10);
  doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, 14, 26);
  
  let currentPage = 1;
  let totalPages = 1; // Will be updated later
  
  // Function to add page numbers
  const addPageNumbers = () => {
    const pageCount = doc.getNumberOfPages();
    totalPages = pageCount;
    
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.text(`Página ${i} de ${pageCount}`, doc.internal.pageSize.getWidth() - 30, doc.internal.pageSize.getHeight() - 10);
    }
  };
  
  // 1. Professores Section
  if (professores.length > 0) {
    // Section title
    doc.setFontSize(16);
    doc.text('1. Professores', 14, 35);
    
    // Create table data for all professores
    const tableColumn = ['Nome', 'Título', 'Estatutário', 'Valor Hora/Aula', 'Total Horas', 'Total a Receber'];
    const tableRows = professores.map(professor => {
      const totalHoras = professor.materias.reduce((total, materia) => total + materia.horasAula, 0);
      const totalPagamento = totalHoras * professor.valorHoraAula;
      
      return [
        professor.nome,
        professor.titulo,
        professor.estatutario ? 'Sim' : 'Não',
        formatCurrency(professor.valorHoraAula),
        totalHoras.toString(),
        formatCurrency(totalPagamento)
      ];
    });
    
    // Add table to document
    autoTable(doc, {
      startY: 40,
      head: [tableColumn],
      body: tableRows,
      theme: 'grid',
      headStyles: { fillColor: [41, 128, 185], textColor: 255 }
    });
    
    // Add detailed professor info
    const detailY = (doc as any).lastAutoTable.finalY + 10;
    doc.setFontSize(14);
    doc.text('Detalhes dos Professores:', 14, detailY);
    
    let currentY = detailY + 10;
    
    professores.forEach((professor, index) => {
      // Check if we need a new page
      if (currentY > doc.internal.pageSize.getHeight() - 40) {
        doc.addPage();
        currentPage++;
        currentY = 20;
      }
      
      doc.setFontSize(12);
      doc.text(`${index + 1}. ${professor.nome}`, 14, currentY);
      currentY += 7;
      
      // Professor materias
      if (professor.materias.length > 0) {
        const materiasColumn = ['Matéria', 'Data', 'Horário', 'Local', 'Horas'];
        const materiasRows = professor.materias.map(materia => [
          materia.nome,
          formatDate(materia.data),
          materia.horario,
          materia.local,
          materia.horasAula.toString()
        ]);
        
        autoTable(doc, {
          startY: currentY,
          head: [materiasColumn],
          body: materiasRows,
          theme: 'grid',
          headStyles: { fillColor: [52, 152, 219], textColor: 255 },
          margin: { left: 30 }
        });
        
        currentY = (doc as any).lastAutoTable.finalY + 15;
      } else {
        doc.setFontSize(10);
        doc.text('Nenhuma matéria registrada.', 30, currentY);
        currentY += 15;
      }
    });
    
    // Add page break after professores
    doc.addPage();
    currentPage++;
  }
  
  // 2. Eventos Section
  if (eventos.length > 0) {
    doc.setFontSize(16);
    doc.text('2. Agenda', 14, 20);
    
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
    
    let yPos = 30;
    
    Object.entries(eventosByMonth).forEach(([monthYear, monthEventos]) => {
      // Check if we need a new page
      if (yPos > doc.internal.pageSize.getHeight() - 40) {
        doc.addPage();
        currentPage++;
        yPos = 20;
      }
      
      // Month header
      doc.setFontSize(14);
      const [month, year] = monthYear.split('/');
      const monthName = new Date(parseInt(year), parseInt(month) - 1).toLocaleString('pt-BR', { month: 'long' });
      doc.text(`${monthName.charAt(0).toUpperCase() + monthName.slice(1)} de ${year}`, 14, yPos);
      yPos += 10;
      
      // Sort eventos by date
      monthEventos.sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime());
      
      // Create table for events in this month
      const eventsColumn = ['Título', 'Data', 'Hora', 'Prioridade', 'WhatsApp', 'Descrição'];
      const eventsRows = monthEventos.map(evento => [
        evento.titulo,
        formatDate(evento.data),
        evento.hora,
        evento.prioridade.charAt(0).toUpperCase() + evento.prioridade.slice(1),
        evento.whatsapp,
        evento.descricao
      ]);
      
      autoTable(doc, {
        startY: yPos,
        head: [eventsColumn],
        body: eventsRows,
        theme: 'grid',
        headStyles: { fillColor: [231, 76, 60], textColor: 255 },
        columnStyles: {
          5: { cellWidth: 50 }
        }
      });
      
      yPos = (doc as any).lastAutoTable.finalY + 15;
    });
    
    // Add page break after eventos
    doc.addPage();
    currentPage++;
  }
  
  // 3. Alunos Section
  if (alunos.length > 0) {
    doc.setFontSize(16);
    doc.text('3. Alunos', 14, 20);
    
    // Create summary table for all alunos
    const alunosColumn = ['Nome', 'Total Aulas', 'Faltas', '% Faltas', 'Média', 'Situação'];
    const alunosRows = alunos.map(aluno => {
      // Calculate media and situacao
      let mediaPonderada = 0;
      const somaPesos = aluno.notas.reduce((total, nota) => total + nota.peso, 0);
      
      if (somaPesos > 0) {
        mediaPonderada = aluno.notas.reduce((total, nota) => total + (nota.valor * nota.peso), 0) / somaPesos;
      }
      
      const percentualFaltas = (aluno.faltas / aluno.totalAulas) * 100;
      const situacao = percentualFaltas > aluno.limiteFaltas ? 'Reprovado por Faltas' : mediaPonderada >= 6 ? 'Aprovado' : 'Reprovado por Nota';
      
      return [
        aluno.nome,
        aluno.totalAulas.toString(),
        aluno.faltas.toString(),
        `${percentualFaltas.toFixed(2)}%`,
        mediaPonderada.toFixed(2),
        situacao
      ];
    });
    
    autoTable(doc, {
      startY: 30,
      head: [alunosColumn],
      body: alunosRows,
      theme: 'grid',
      headStyles: { fillColor: [46, 204, 113], textColor: 255 }
    });
    
    // Add detailed student info
    const detailY = (doc as any).lastAutoTable.finalY + 10;
    doc.setFontSize(14);
    doc.text('Detalhes dos Alunos:', 14, detailY);
    
    let currentY = detailY + 10;
    
    alunos.forEach((aluno, index) => {
      // Check if we need a new page
      if (currentY > doc.internal.pageSize.getHeight() - 40) {
        doc.addPage();
        currentPage++;
        currentY = 20;
      }
      
      doc.setFontSize(12);
      doc.text(`${index + 1}. ${aluno.nome}`, 14, currentY);
      currentY += 7;
      
      // Aluno notas
      if (aluno.notas.length > 0) {
        const notasColumn = ['Descrição', 'Nota', 'Peso'];
        const notasRows = aluno.notas.map(nota => [
          nota.descricao,
          nota.valor.toFixed(2),
          nota.peso.toString()
        ]);
        
        autoTable(doc, {
          startY: currentY,
          head: [notasColumn],
          body: notasRows,
          theme: 'grid',
          headStyles: { fillColor: [46, 204, 113], textColor: 255 },
          margin: { left: 30 }
        });
        
        currentY = (doc as any).lastAutoTable.finalY + 15;
      } else {
        doc.setFontSize(10);
        doc.text('Nenhuma nota registrada.', 30, currentY);
        currentY += 15;
      }
    });
  }
  
  // Add page numbers to the document
  addPageNumbers();
  
  // Save the PDF
  doc.save('relatorio_completo.pdf');
};
