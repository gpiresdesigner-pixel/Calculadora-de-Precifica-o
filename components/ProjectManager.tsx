import React, { useState, useRef } from 'react';
import { SavedProject, StudioProfile, DocumentType } from '../types';
import { FileText, Eye, Trash2, Download, FileCheck, CheckCircle, X, Send } from 'lucide-react';
import ConfirmModal from './ConfirmModal';

interface ProjectManagerProps {
  projects: SavedProject[];
  studio: StudioProfile;
  onDeleteProject: (id: string) => void;
  onViewProject: (project: SavedProject) => void;
  onUpdateStatus: (id: string, status: 'completed') => void;
}

const ProjectManager: React.FC<ProjectManagerProps> = ({ projects, studio, onDeleteProject, onViewProject, onUpdateStatus }) => {
  const [previewDoc, setPreviewDoc] = useState<{type: DocumentType, project: SavedProject} | null>(null);
  
  // State for Confirmation Modals
  const [projectToDelete, setProjectToDelete] = useState<string | null>(null);
  const [projectToClose, setProjectToClose] = useState<string | null>(null);

  // Ref for the iframe to trigger print
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Helper to format currency
  const fmtMoney = (val: number) => `R$ ${val?.toFixed(2) || '0.00'}`;

  // Split projects
  const openProposals = projects.filter(p => p.status === 'draft');
  const closedTattoos = projects.filter(p => p.status === 'completed');

  const handleWhatsAppShare = (project: SavedProject) => {
    if (!project.clientPhone) {
        alert('Telefone do cliente não disponível neste projeto.');
        return;
    }
    const cleanPhone = project.clientPhone.replace(/[^0-9]/g, '');
    const message = `Olá ${project.clientName}! Aqui está o orçamento para sua tattoo:\n\n` +
                    `Estilo: ${project.style}\n` +
                    `Local: ${project.bodyPart} (${project.widthCm}cm x ${project.heightCm}cm)\n` +
                    `Valor Total: ${fmtMoney(project.finalPrice)}\n\n` +
                    `Podemos agendar?`;
    
    const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  const generateDocumentContent = (project: SavedProject, type: DocumentType) => {
    const today = new Date().toLocaleDateString('pt-BR');
    
    // Safety check for studio data
    const safeStudio = {
        name: studio?.name || 'Nome do Estúdio',
        address: studio?.address || 'Endereço não informado',
        phone: studio?.phone || '',
        email: studio?.email || '',
        document: studio?.document || '',
        ownerName: studio?.ownerName || 'Tatuador',
        logoUrl: studio?.logoUrl || ''
    };
    
    let content = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>${type} - ${project.clientName}</title>
          <meta charset="utf-8" />
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700&family=Lato:wght@300;400;700&display=swap');
            body { 
              font-family: 'Lato', sans-serif; 
              padding: 40px; 
              line-height: 1.6; 
              color: #1a1a1a;
              max-width: 800px;
              margin: 0 auto;
              background: white;
            }
            .header { text-align: center; margin-bottom: 50px; border-bottom: 2px solid #000; padding-bottom: 20px; }
            .studio-logo { max-height: 80px; margin-bottom: 10px; }
            .studio-name { font-family: 'Cinzel', serif; font-size: 28px; font-weight: 700; text-transform: uppercase; letter-spacing: 2px; margin: 0; }
            .studio-info { font-size: 12px; color: #555; margin-top: 5px; }
            
            h1 { text-align: center; font-family: 'Cinzel', serif; font-size: 22px; margin-bottom: 30px; text-transform: uppercase; letter-spacing: 1px; }
            h2 { font-size: 16px; margin-top: 25px; border-bottom: 1px solid #ddd; padding-bottom: 5px; text-transform: uppercase; color: #333; }
            
            .content { font-size: 14px; text-align: justify; }
            .field-row { display: flex; justify-content: space-between; margin-bottom: 8px; border-bottom: 1px dotted #ccc; padding-bottom: 2px; }
            .field-label { font-weight: 700; }
            
            .signature-box { margin-top: 80px; display: flex; justify-content: space-between; gap: 40px; }
            .line { border-top: 1px solid #000; width: 100%; text-align: center; padding-top: 10px; font-size: 12px; }
            
            .footer { margin-top: 50px; text-align: center; font-size: 10px; color: #999; }
            
            @media print {
                body { padding: 0; max-width: 100%; }
                .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            ${safeStudio.logoUrl 
                ? `<img src="${safeStudio.logoUrl}" class="studio-logo" alt="Logo" />` 
                : `<div class="studio-name">${safeStudio.name}</div>`
            }
            <div class="studio-info">${safeStudio.address} • ${safeStudio.phone}</div>
            <div class="studio-info">${safeStudio.email} • CNPJ/CPF: ${safeStudio.document}</div>
          </div>
          
          <h1>${type}</h1>
          <div class="content">
    `;

    if (type === DocumentType.CONTRACT) {
      content += `
        <p>Pelo presente instrumento particular, de um lado <strong>${safeStudio.ownerName}</strong>, doravante denominado TATUADOR(A), e de outro lado <strong>${project.clientName}</strong>, doravante denominado CLIENTE.</p>
        
        <h2>1. Do Serviço Contratado</h2>
        <div class="field-row"><span class="field-label">Estilo:</span> <span>${project.style}</span></div>
        <div class="field-row"><span class="field-label">Local do Corpo:</span> <span>${project.bodyPart}</span></div>
        <div class="field-row"><span class="field-label">Dimensões:</span> <span>${project.widthCm}cm x ${project.heightCm}cm</span></div>
        <div class="field-row"><span class="field-label">Sessões Estimadas:</span> <span>${project.sessions}</span></div>

        <h2>2. Do Investimento</h2>
        <p>O valor total acordado para a realização do projeto é de <strong>${fmtMoney(project.finalPrice)}</strong>.</p>
        
        <h2>3. Termos e Condições</h2>
        <p>O CLIENTE declara estar ciente de que a tatuagem é um processo irreversível e que o resultado final depende também dos cuidados pós-procedimento.</p>
        <p>O CLIENTE autoriza o uso de imagem da tatuagem realizada para fins de portfólio e divulgação do TATUADOR(A).</p>
      `;
    } else if (type === DocumentType.ANAMNESIS) {
      content += `
        <div class="field-row"><span class="field-label">Cliente:</span> <span>${project.clientName}</span></div>
        <div class="field-row"><span class="field-label">Data:</span> <span>${today}</span></div>
        
        <h2>Questionário de Saúde Obrigatório</h2>
        <p>Para sua segurança, responda com sinceridade:</p>
        
        <div style="margin-top: 20px; line-height: 2;">
          ( ) Diabetes &nbsp;&nbsp; ( ) Hipertensão &nbsp;&nbsp; ( ) Hemofilia<br/>
          ( ) Hepatite &nbsp;&nbsp; ( ) HIV+ &nbsp;&nbsp; ( ) Epilepsia<br/>
          ( ) Problemas Cardíacos &nbsp;&nbsp; ( ) Uso de Anticoagulantes<br/>
          ( ) Alergias (tintas, látex, medicamentos): _______________________<br/>
          ( ) Doenças de Pele (Psoríase, Vitiligo): _______________________<br/>
          ( ) Está grávida ou amamentando? _______________________
        </div>

        <h2>Termo de Responsabilidade</h2>
        <p>Declaro que as informações acima são verdadeiras. Isento o profissional de responsabilidades decorrentes de informações omitidas sobre minha saúde.</p>
      `;
    } else if (type === DocumentType.AFTERCARE) {
      content += `
        <h2>Guia de Cuidados Pós-Tatuagem</h2>
        <p>A qualidade da sua tatuagem depende 50% do tatuador e 50% da sua cicatrização. Siga rigorosamente:</p>
        
        <h3 style="font-size: 14px; text-transform: uppercase; margin-top: 20px;">Limpeza</h3>
        <p>Lave o local 3x ao dia com sabonete neutro e água fria/morna. Não use buchas. Seque com papel toalha (não esfregue).</p>
        
        <h3 style="font-size: 14px; text-transform: uppercase; margin-top: 20px;">Hidratação</h3>
        <p>Após lavar, aplique uma camada <strong>fina</strong> da pomada recomendada. O excesso de pomada prejudica a cicatrização.</p>
        
        <h3 style="font-size: 14px; text-transform: uppercase; margin-top: 20px;">Proibições (30 Dias)</h3>
        <ul>
          <li>Não tomar sol na região.</li>
          <li>Não entrar em mar, piscina, sauna ou banheira.</li>
          <li>Não coçar ou arrancar as casquinhas.</li>
          <li>Evitar alimentos remosos (porco, frutos do mar, chocolate, ovo).</li>
        </ul>
      `;
    }

    content += `
          </div>
          <div class="signature-box">
            <div class="line">
              <strong>${safeStudio.ownerName}</strong><br/>
              Tatuador(a)
            </div>
            <div class="line">
              <strong>${project.clientName}</strong><br/>
              Cliente
            </div>
          </div>
          <div class="footer">
             Gerado via InkValue - Gestão Inteligente para Tatuadores
          </div>
        </body>
      </html>
    `;
    return content;
  };

  const openPreview = (project: SavedProject, type: DocumentType) => {
    setPreviewDoc({ type, project });
  };

  const handlePrint = () => {
    if (iframeRef.current && iframeRef.current.contentWindow) {
        iframeRef.current.contentWindow.print();
    } else if (previewDoc) {
        // Fallback if iframe access fails
        const content = generateDocumentContent(previewDoc.project, previewDoc.type);
        const printWindow = window.open('', '_blank');
        if (printWindow) {
            printWindow.document.write(content);
            printWindow.document.close();
            printWindow.focus();
            setTimeout(() => {
                printWindow.print();
                printWindow.close();
            }, 500);
        }
    }
  };

  // --- MOBILE CARD COMPONENT ---
  const MobileProjectCard: React.FC<{
    project: SavedProject;
    isOpen: boolean;
  }> = ({ project, isOpen }) => (
    <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl flex flex-col gap-3 shadow-md">
      <div className="flex justify-between items-start">
        <div>
          <span className="text-xs text-zinc-500 uppercase font-bold">{new Date(project.date).toLocaleDateString()}</span>
          <h4 className="text-white font-bold text-lg">{project.clientName}</h4>
          <p className="text-zinc-400 text-sm mt-1">
             {project.style} • {project.bodyPart}
          </p>
          <p className="text-zinc-500 text-xs">
             {project.widthCm}cm x {project.heightCm}cm
          </p>
        </div>
        <div className="text-right">
           <div className="text-emerald-400 font-bold text-lg">{fmtMoney(project.finalPrice)}</div>
           {isOpen && (
             <span className="text-xs bg-purple-500/20 text-purple-400 px-2 py-1 rounded">Rascunho</span>
           )}
        </div>
      </div>

      <div className="h-px bg-zinc-800 w-full my-1"></div>

      <div className="flex gap-2 flex-wrap">
        {isOpen ? (
          <>
            <button 
                onClick={() => onViewProject(project)} 
                className="flex-1 py-2 bg-zinc-800 text-blue-400 rounded-lg text-sm font-medium flex justify-center items-center gap-2"
            >
                <Eye size={16}/> Editar
            </button>
            <button 
                onClick={(e) => { e.stopPropagation(); handleWhatsAppShare(project); }} 
                className="p-2 bg-emerald-900/30 text-emerald-400 rounded-lg"
                title="WhatsApp"
            >
                <Send size={18}/>
            </button>
            <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setProjectToClose(project.id);
                }}
                className="flex-1 py-2 bg-emerald-600/20 text-emerald-400 border border-emerald-600/30 rounded-lg text-sm font-bold flex justify-center items-center gap-2"
            >
                <CheckCircle size={16} /> Fechar
            </button>
            <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setProjectToDelete(project.id);
                }} 
                className="p-2 bg-zinc-800 text-red-400 rounded-lg"
            >
                <Trash2 size={18}/>
            </button>
          </>
        ) : (
          <>
             <button onClick={() => openPreview(project, DocumentType.CONTRACT)} className="flex-1 py-2 bg-zinc-800 border border-zinc-700 text-zinc-300 text-xs rounded-lg">Contrato</button>
             <button onClick={() => openPreview(project, DocumentType.ANAMNESIS)} className="flex-1 py-2 bg-zinc-800 border border-zinc-700 text-zinc-300 text-xs rounded-lg">Anamnese</button>
             <button onClick={() => openPreview(project, DocumentType.AFTERCARE)} className="flex-1 py-2 bg-zinc-800 border border-zinc-700 text-zinc-300 text-xs rounded-lg">Cuidados</button>
             <button onClick={() => setProjectToDelete(project.id)} className="p-2 text-red-400 bg-zinc-800 rounded-lg"><Trash2 size={16}/></button>
          </>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-12 animate-fade-in pb-20">
      
      {/* SECTION 1: OPEN PROPOSALS */}
      <div>
        <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-4">
          <FileText className="text-purple-500" /> Propostas em Aberto
        </h2>
        
        {/* DESKTOP TABLE */}
        <div className="hidden md:block bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-xl mb-4">
           {openProposals.length === 0 ? (
             <div className="p-8 text-center text-zinc-500 text-sm">Nenhuma proposta pendente.</div>
           ) : (
             <table className="w-full text-left text-sm text-zinc-400">
               <thead className="bg-zinc-950 text-xs uppercase font-medium text-zinc-500">
                 <tr>
                   <th className="px-4 py-3">Cliente</th>
                   <th className="px-4 py-3">Projeto</th>
                   <th className="px-4 py-3">Valor</th>
                   <th className="px-4 py-3 text-right">Ação</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-zinc-800">
                 {openProposals.slice().reverse().map(proj => (
                   <tr key={proj.id} className="hover:bg-zinc-800/40">
                      <td className="px-4 py-3 text-white font-medium">{proj.clientName}</td>
                      <td className="px-4 py-3">{proj.style} - {proj.bodyPart} ({proj.widthCm}x{proj.heightCm})</td>
                      <td className="px-4 py-3 text-emerald-400">{fmtMoney(proj.finalPrice)}</td>
                      <td className="px-4 py-3 text-right flex justify-end gap-2 items-center">
                         <button onClick={(e) => { e.stopPropagation(); handleWhatsAppShare(proj); }} className="p-2 bg-zinc-800 hover:bg-zinc-700 rounded text-emerald-400" title="WhatsApp"><Send size={16}/></button>
                         <button onClick={() => onViewProject(proj)} className="p-2 bg-zinc-800 hover:bg-zinc-700 rounded text-blue-400" title="Editar"><Eye size={16}/></button>
                         <button onClick={(e) => { e.stopPropagation(); setProjectToDelete(proj.id); }} className="p-2 bg-zinc-800 hover:bg-zinc-700 rounded text-red-400" title="Excluir"><Trash2 size={16}/></button>
                         <button onClick={(e) => { e.stopPropagation(); setProjectToClose(proj.id); }} className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-bold flex items-center gap-1"><CheckCircle size={14} /> Fechar</button>
                      </td>
                   </tr>
                 ))}
               </tbody>
             </table>
           )}
        </div>

        {/* MOBILE CARDS (OPEN) */}
        <div className="md:hidden space-y-4">
           {openProposals.length === 0 ? (
             <div className="p-8 text-center text-zinc-500 text-sm bg-zinc-900 rounded-xl border border-zinc-800">Nenhuma proposta pendente.</div>
           ) : (
             openProposals.slice().reverse().map(proj => <MobileProjectCard key={proj.id} project={proj} isOpen={true} />)
           )}
        </div>
      </div>

      {/* SECTION 2: CLOSED TATTOOS */}
      <div>
        <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-4">
          <FileCheck className="text-emerald-500" /> Tattoos Fechadas & Documentos
        </h2>
        
        {/* DESKTOP TABLE */}
        <div className="hidden md:block bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-xl">
           {closedTattoos.length === 0 ? (
             <div className="p-8 text-center text-zinc-500 text-sm">Nenhuma tattoo fechada ainda.</div>
           ) : (
             <table className="w-full text-left text-sm text-zinc-400">
               <thead className="bg-zinc-950 text-xs uppercase font-medium text-zinc-500">
                 <tr>
                   <th className="px-4 py-3">Data</th>
                   <th className="px-4 py-3">Cliente</th>
                   <th className="px-4 py-3">Documentos</th>
                   <th className="px-4 py-3 text-right"></th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-zinc-800">
                 {closedTattoos.slice().reverse().map(proj => (
                   <tr key={proj.id} className="hover:bg-zinc-800/40">
                      <td className="px-4 py-3">{new Date(proj.date).toLocaleDateString()}</td>
                      <td className="px-4 py-3 text-white font-medium">{proj.clientName}</td>
                      <td className="px-4 py-3">
                         <div className="flex gap-2">
                            <button onClick={() => openPreview(proj, DocumentType.CONTRACT)} className="px-2 py-1 bg-zinc-800 border border-zinc-700 rounded text-xs text-zinc-300 hover:text-white">Contrato</button>
                            <button onClick={() => openPreview(proj, DocumentType.ANAMNESIS)} className="px-2 py-1 bg-zinc-800 border border-zinc-700 rounded text-xs text-zinc-300 hover:text-white">Anamnese</button>
                            <button onClick={() => openPreview(proj, DocumentType.AFTERCARE)} className="px-2 py-1 bg-zinc-800 border border-zinc-700 rounded text-xs text-zinc-300 hover:text-white">Cuidados</button>
                         </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                          <button onClick={() => setProjectToDelete(proj.id)} className="text-red-400 hover:text-red-300 p-1"><Trash2 size={16}/></button>
                      </td>
                   </tr>
                 ))}
               </tbody>
             </table>
           )}
        </div>

        {/* MOBILE CARDS (CLOSED) */}
        <div className="md:hidden space-y-4">
           {closedTattoos.length === 0 ? (
             <div className="p-8 text-center text-zinc-500 text-sm bg-zinc-900 rounded-xl border border-zinc-800">Nenhuma tattoo fechada.</div>
           ) : (
             closedTattoos.slice().reverse().map(proj => <MobileProjectCard key={proj.id} project={proj} isOpen={false} />)
           )}
        </div>
      </div>

      {/* DOCUMENT PREVIEW MODAL */}
      {previewDoc && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
           <div className="bg-zinc-900 rounded-xl w-full max-w-3xl h-[85vh] flex flex-col border border-zinc-700 shadow-2xl">
              <div className="flex justify-between items-center p-4 border-b border-zinc-800 bg-zinc-950 rounded-t-xl">
                 <h3 className="text-white font-bold flex items-center gap-2">
                    <Eye className="text-purple-500" size={20}/>
                    Visualizar {previewDoc.type}
                 </h3>
                 <button onClick={() => setPreviewDoc(null)} className="text-zinc-400 hover:text-white"><X size={24}/></button>
              </div>
              
              <div className="flex-1 bg-zinc-200 p-0 overflow-hidden relative">
                 <iframe 
                   ref={iframeRef}
                   srcDoc={generateDocumentContent(previewDoc.project, previewDoc.type)}
                   className="w-full h-full bg-white"
                   title="Document Preview"
                 />
              </div>

              <div className="p-4 border-t border-zinc-800 bg-zinc-950 flex justify-end gap-3 rounded-b-xl">
                 <button onClick={() => setPreviewDoc(null)} className="px-4 py-2 text-zinc-400 hover:text-white">Cancelar</button>
                 <button 
                    onClick={handlePrint}
                    className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-bold flex items-center gap-2 shadow-lg shadow-purple-900/20"
                 >
                    <Download size={18}/> Imprimir / Salvar PDF
                 </button>
              </div>
           </div>
        </div>
      )}
      
      {/* DELETE MODAL */}
      <ConfirmModal 
        isOpen={!!projectToDelete}
        onClose={() => setProjectToDelete(null)}
        onConfirm={() => projectToDelete && onDeleteProject(projectToDelete)}
        title="Excluir Proposta"
        message="Tem certeza que deseja remover esta proposta? Esta ação não pode ser desfeita."
        variant="danger"
        confirmText="Sim, Excluir"
      />

      {/* CLOSE DEAL MODAL */}
      <ConfirmModal 
        isOpen={!!projectToClose}
        onClose={() => setProjectToClose(null)}
        onConfirm={() => projectToClose && onUpdateStatus(projectToClose, 'completed')}
        title="Confirmar Venda"
        message="Deseja confirmar a realização desta tattoo? O valor será contabilizado no relatório financeiro."
        variant="success"
        confirmText="Confirmar Venda"
      />

    </div>
  );
};

export default ProjectManager;