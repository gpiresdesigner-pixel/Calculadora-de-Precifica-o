import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  TattooStyle, 
  ComplexityLevel, 
  FixedCosts, 
  TattooProject, 
  PricingResult, 
  AIAnalysisResult,
  Client,
  StudioProfile,
  SavedProject
} from './types';
import { 
  COMPLEXITY_MULTIPLIERS, 
  STYLE_MULTIPLIERS, 
  INITIAL_FIXED_COSTS, 
  INITIAL_PROJECT, 
  INITIAL_STUDIO_PROFILE, 
  BODY_PARTS
} from './constants';
import { analyzePricingWithGemini, generateSalesPitch } from './services/geminiService';
import ResultsChart from './components/ResultsChart';
import AIAnalysisPanel from './components/AIAnalysisPanel';
import ClientManager from './components/ClientManager';
import ProjectManager from './components/ProjectManager';
import Dashboard from './components/Dashboard';
import SalesPitchModal from './components/SalesPitchModal';
import ConfirmModal from './components/ConfirmModal';
import Toast, { ToastProps } from './components/Toast';

import { 
  Calculator, 
  DollarSign, 
  Clock, 
  Palette, 
  Settings, 
  Users,
  FileText,
  BarChart3,
  Save,
  Sparkles,
  PenTool,
  CheckCircle,
  Menu,
  Upload,
  Image as ImageIcon,
  Trash2
} from 'lucide-react';

type Tab = 'calculator' | 'clients' | 'proposals' | 'dashboard' | 'settings';

// Safe ID Generator
const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
};

const App: React.FC = () => {
  // --- STATE WITH LAZY INITIALIZATION ---
  const [activeTab, setActiveTab] = useState<Tab>('calculator');
  const [isAiLoading, setIsAiLoading] = useState(false);
  
  // Data State
  const [fixedCosts, setFixedCosts] = useState<FixedCosts>(() => {
    const saved = localStorage.getItem('inkprofit_costs');
    return saved ? JSON.parse(saved) : INITIAL_FIXED_COSTS;
  });

  const [studioProfile, setStudioProfile] = useState<StudioProfile>(() => {
    const saved = localStorage.getItem('inkprofit_studio');
    return saved ? JSON.parse(saved) : INITIAL_STUDIO_PROFILE;
  });

  const [clients, setClients] = useState<Client[]>(() => {
    const saved = localStorage.getItem('inkprofit_clients');
    return saved ? JSON.parse(saved) : [];
  });

  const [projects, setProjects] = useState<SavedProject[]>(() => {
    const saved = localStorage.getItem('inkprofit_projects');
    return saved ? JSON.parse(saved) : [];
  });
  
  // Calculator State
  const [project, setProject] = useState<TattooProject>(INITIAL_PROJECT);
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [aiResult, setAiResult] = useState<AIAnalysisResult | null>(null);
  
  // UI State for Body Part
  const [bodyPartSelect, setBodyPartSelect] = useState<string>(INITIAL_PROJECT.bodyPart);
  const [bodyPartCustom, setBodyPartCustom] = useState<string>('');

  // Sales Pitch State
  const [isPitchModalOpen, setIsPitchModalOpen] = useState(false);
  const [salesPitch, setSalesPitch] = useState("");
  const [isPitchLoading, setIsPitchLoading] = useState(false);

  // Close Confirm Modal State
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);

  // Toast State
  const [toast, setToast] = useState<{message: string, type: 'success' | 'error', isVisible: boolean}>({
    message: '',
    type: 'success',
    isVisible: false
  });

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type, isVisible: true });
  };

  // --- PERSISTENCE ---
  useEffect(() => { localStorage.setItem('inkprofit_costs', JSON.stringify(fixedCosts)); }, [fixedCosts]);
  useEffect(() => { localStorage.setItem('inkprofit_studio', JSON.stringify(studioProfile)); }, [studioProfile]);
  useEffect(() => { localStorage.setItem('inkprofit_clients', JSON.stringify(clients)); }, [clients]);
  useEffect(() => { localStorage.setItem('inkprofit_projects', JSON.stringify(projects)); }, [projects]);

  // Sync Body Part Logic
  useEffect(() => {
    if (bodyPartSelect === 'Outro') {
      setProject(p => ({ ...p, bodyPart: bodyPartCustom }));
    } else {
      setProject(p => ({ ...p, bodyPart: bodyPartSelect }));
    }
  }, [bodyPartSelect, bodyPartCustom]);

  // --- CALCULATIONS ---
  const results = useMemo<PricingResult>(() => {
    const totalMonthlyHours = fixedCosts.daysWorkedPerMonth * fixedCosts.hoursWorkedPerDay;
    const totalMonthlyFixedExpenses = 
      fixedCosts.monthlyRent + 
      fixedCosts.monthlyUtilities + 
      fixedCosts.monthlyMarketing + 
      fixedCosts.monthlyMisc;
    
    const overheadPerHour = totalMonthlyHours > 0 ? totalMonthlyFixedExpenses / totalMonthlyHours : 0;
    const totalHours = project.designTimeHours + project.tattooTimeHours;
    const laborCost = totalHours * project.hourlyRate;
    const totalOverheadCost = totalHours * overheadPerHour;
    const totalBaseCost = laborCost + totalOverheadCost + project.materialCost;

    const marginMultiplier = 1 + (project.profitMarginPercent / 100);
    const styleMult = STYLE_MULTIPLIERS[project.style];
    const complexityMult = COMPLEXITY_MULTIPLIERS[project.complexity];
    
    // Base Calculation
    const grossPrice = totalBaseCost * marginMultiplier * styleMult * complexityMult;

    // Apply Discount
    let discountVal = 0;
    if (project.discountType === 'fixed') {
      discountVal = project.discountAmount;
    } else {
      discountVal = grossPrice * (project.discountAmount / 100);
    }
    
    const suggestedPrice = Math.max(0, grossPrice - discountVal);
    const profitAmount = suggestedPrice - totalBaseCost;

    return {
      overheadPerHour,
      totalOverheadCost,
      laborCost,
      totalBaseCost,
      grossPrice,
      suggestedPrice,
      profitAmount,
      breakdown: [
        { name: 'Mão de Obra', value: laborCost, color: '#3b82f6' }, 
        { name: 'Custos Fixos', value: totalOverheadCost, color: '#ef4444' }, 
        { name: 'Materiais', value: project.materialCost, color: '#eab308' }, 
        { name: 'Lucro Líquido', value: Math.max(0, profitAmount), color: '#10b981' }, 
      ]
    };
  }, [fixedCosts, project]);

  // --- ACTIONS ---
  
  const handleCostChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFixedCosts(prev => ({ ...prev, [name]: parseFloat(value) || 0 }));
  };

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setStudioProfile(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  // --- LOGO UPLOAD LOGIC ---
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // 500KB limit to keep localStorage healthy
      if (file.size > 500 * 1024) {
         showToast("A imagem deve ter menos de 500KB", 'error');
         return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setStudioProfile(prev => ({ ...prev, logoUrl: reader.result as string }));
        showToast("Logo atualizado!");
      };
      reader.readAsDataURL(file);
    }
  };

  const removeLogo = () => {
     setStudioProfile(prev => ({ ...prev, logoUrl: '' }));
     showToast("Logo removido.");
  };

  const handleProjectChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setProject(prev => ({
      ...prev,
      [name]: (name === 'style' || name === 'complexity' || name === 'bodyPart' || name === 'discountType')
        ? value 
        : parseFloat(value) || 0
    }));
    setAiResult(null);
  };

  const runAiAnalysis = useCallback(async () => {
    if (!process.env.API_KEY) {
      showToast("API Key não configurada.", 'error');
      return;
    }
    setIsAiLoading(true);
    const analysis = await analyzePricingWithGemini(project, fixedCosts, results);
    setAiResult(analysis);
    setIsAiLoading(false);
  }, [project, fixedCosts, results]);

  const handleGeneratePitch = async () => {
    if (!process.env.API_KEY) {
      showToast("API Key não configurada.", 'error');
      return;
    }
    setIsPitchModalOpen(true);
    setIsPitchLoading(true);
    const client = clients.find(c => c.id === selectedClientId);
    const pitch = await generateSalesPitch(project, results.suggestedPrice, client?.name);
    setSalesPitch(pitch);
    setIsPitchLoading(false);
  };

  const saveProposal = (status: 'draft' | 'completed') => {
    if (!selectedClientId) {
      showToast("Selecione um cliente para salvar.", 'error');
      return;
    }
    const client = clients.find(c => c.id === selectedClientId);
    
    // Create new project object
    const newProject: SavedProject = {
      ...project,
      id: generateId(),
      clientId: selectedClientId,
      clientName: client?.name || "Desconhecido",
      clientPhone: client?.phone, // Save phone for WhatsApp
      date: Date.now(),
      status,
      finalPrice: results.suggestedPrice,
      finalCost: results.totalBaseCost,
      finalProfit: results.profitAmount
    };

    // Functional update ensures we're adding to the latest state
    setProjects(prev => {
      const updated = [...prev, newProject];
      return updated;
    });
    
    // Reset Form
    setProject(INITIAL_PROJECT);
    setBodyPartSelect(INITIAL_PROJECT.bodyPart);
    setBodyPartCustom('');
    setSelectedClientId('');
    setAiResult(null);

    if (status === 'completed') {
      showToast("Tattoo Fechada com sucesso! Contrato disponível.");
      setActiveTab('proposals');
    } else {
      showToast("Proposta Salva com sucesso!");
    }
  };

  const onDeleteProject = (id: string) => {
    setProjects(prevProjects => prevProjects.filter(p => p.id !== id));
    showToast("Proposta removida com sucesso.");
  };

  const updateProjectStatus = (id: string, status: 'completed') => {
     setProjects(prev => prev.map(p => p.id === id ? { ...p, status } : p));
     showToast("Tattoo marcada como realizada!");
  };

  const loadSavedProject = (saved: SavedProject) => {
    setProject({
      style: saved.style,
      complexity: saved.complexity,
      widthCm: saved.widthCm,
      heightCm: saved.heightCm,
      bodyPart: saved.bodyPart,
      sessions: saved.sessions,
      designTimeHours: saved.designTimeHours,
      tattooTimeHours: saved.tattooTimeHours,
      materialCost: saved.materialCost,
      hourlyRate: saved.hourlyRate,
      profitMarginPercent: saved.profitMarginPercent,
      discountAmount: saved.discountAmount,
      discountType: saved.discountType
    });
    setBodyPartSelect(BODY_PARTS.includes(saved.bodyPart) ? saved.bodyPart : 'Outro');
    if (!BODY_PARTS.includes(saved.bodyPart)) setBodyPartCustom(saved.bodyPart);
    
    setSelectedClientId(saved.clientId);
    setActiveTab('calculator');
  };

  // --- NAVBAR COMPONENT ---
  const Navbar = () => (
    <header className="h-16 md:h-20 bg-zinc-950 border-b border-zinc-800 flex items-center justify-between px-4 md:px-8 sticky top-0 z-40 shadow-lg">
       <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-purple-600 to-violet-800 p-2 rounded-xl shadow-lg shadow-purple-900/20">
            <PenTool className="text-white w-5 h-5 md:w-6 md:h-6" />
          </div>
          <div>
            <h1 className="font-bold text-lg md:text-xl text-white tracking-tight leading-none">InkValue</h1>
            <span className="text-[10px] md:text-xs text-zinc-500 font-medium tracking-wider">STUDIO MANAGER</span>
          </div>
       </div>

       {/* Desktop Navigation */}
       <nav className="hidden md:flex bg-zinc-900/50 p-1.5 rounded-full border border-zinc-800/50 backdrop-blur-md">
          {[
            { id: 'calculator', label: 'Calculadora', icon: Calculator },
            { id: 'clients', label: 'Clientes', icon: Users },
            { id: 'proposals', label: 'Propostas', icon: FileText },
            { id: 'dashboard', label: 'Relatórios', icon: BarChart3 },
            { id: 'settings', label: 'Config', icon: Settings },
          ].map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as Tab)}
              className={`
                flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-300
                ${activeTab === item.id 
                  ? 'bg-zinc-800 text-white shadow-sm ring-1 ring-zinc-700' 
                  : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50'}
              `}
            >
              <item.icon size={16} className={activeTab === item.id ? 'text-purple-400' : ''} />
              {item.label}
            </button>
          ))}
       </nav>
    </header>
  );

  const MobileNav = () => (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-zinc-950 border-t border-zinc-800 flex justify-around p-3 z-50 safe-area-bottom pb-6">
       {[
          { id: 'calculator', label: 'Calc', icon: Calculator },
          { id: 'clients', label: 'Clientes', icon: Users },
          { id: 'proposals', label: 'Propostas', icon: FileText },
          { id: 'dashboard', label: 'Relat.', icon: BarChart3 },
          { id: 'settings', label: 'Config', icon: Settings },
       ].map(item => (
         <button 
            key={item.id}
            onClick={() => setActiveTab(item.id as Tab)}
            className={`flex flex-col items-center gap-1 ${activeTab === item.id ? 'text-purple-400' : 'text-zinc-600'}`}
         >
           <item.icon size={22} />
           <span className="text-[10px]">{item.label}</span>
         </button>
       ))}
    </nav>
  );

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-purple-500/30 pb-24 md:pb-0">
      
      <Navbar />

      <main className="max-w-7xl mx-auto p-4 md:p-8">
        
        {/* VIEW: CALCULATOR */}
        {activeTab === 'calculator' && (
          <div className="animate-fade-in space-y-6">
            <header className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-zinc-800/50 pb-6">
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">Calculadora de Orçamento</h2>
                <p className="text-zinc-400 text-sm">Precificação inteligente baseada em custos e margem.</p>
              </div>
              <div className="w-full md:w-72 bg-zinc-900 p-1.5 rounded-xl border border-zinc-800 flex gap-2">
                 <div className="flex-1">
                    <select 
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-white text-sm focus:border-purple-500 outline-none"
                      value={selectedClientId}
                      onChange={(e) => setSelectedClientId(e.target.value)}
                    >
                      <option value="">Selecionar Cliente...</option>
                      {clients.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                 </div>
                 <button onClick={() => setActiveTab('clients')} className="p-2.5 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-zinc-400 hover:text-white transition-colors">
                    <Users size={18} />
                 </button>
              </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <div className="lg:col-span-7 space-y-6">
                
                {/* Details Card */}
                <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-2xl p-6 backdrop-blur-sm">
                  <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-wider mb-5 flex items-center gap-2">
                    <Palette className="w-4 h-4" /> Detalhes do Projeto
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <InputSelect label="Estilo" name="style" value={project.style} onChange={handleProjectChange} options={Object.values(TattooStyle)} />
                    <InputSelect label="Complexidade" name="complexity" value={project.complexity} onChange={handleProjectChange} options={Object.values(ComplexityLevel)} />
                    
                    {/* Body Part with Select + Custom Input */}
                    <div>
                      <label className="block text-xs font-bold text-zinc-500 uppercase mb-1.5">Local do Corpo</label>
                      <select 
                         value={bodyPartSelect} 
                         onChange={(e) => setBodyPartSelect(e.target.value)}
                         className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-white text-sm focus:border-purple-500 outline-none mb-2"
                      >
                         {BODY_PARTS.map(p => <option key={p} value={p}>{p}</option>)}
                      </select>
                      {bodyPartSelect === 'Outro' && (
                         <input 
                           type="text" 
                           placeholder="Especifique o local"
                           value={bodyPartCustom}
                           onChange={(e) => setBodyPartCustom(e.target.value)}
                           className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-white text-sm focus:border-purple-500 outline-none"
                         />
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                       <InputGroup label="Largura (L)" name="widthCm" value={project.widthCm} onChange={handleProjectChange} suffix="cm" />
                       <InputGroup label="Altura (A)" name="heightCm" value={project.heightCm} onChange={handleProjectChange} suffix="cm" />
                    </div>
                  </div>
                </div>

                {/* Costs Card */}
                <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-2xl p-6 backdrop-blur-sm">
                  <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-wider mb-5 flex items-center gap-2">
                    <Clock className="w-4 h-4" /> Custos & Tempo
                  </h3>
                  <div className="space-y-5">
                     <div className="grid grid-cols-2 gap-5">
                        <InputGroup label="Tempo Design (h)" name="designTimeHours" value={project.designTimeHours} onChange={handleProjectChange} />
                        <InputGroup label="Tempo Tattoo (h)" name="tattooTimeHours" value={project.tattooTimeHours} onChange={handleProjectChange} />
                     </div>
                     <div className="grid grid-cols-2 gap-5">
                        <InputGroup label="Sessões" name="sessions" value={project.sessions} onChange={handleProjectChange} />
                        <InputGroup label="Custo Materiais" name="materialCost" value={project.materialCost} onChange={handleProjectChange} prefix="R$" />
                     </div>
                     
                     <div className="pt-5 border-t border-zinc-800/50">
                        <div className="flex justify-between mb-2">
                           <label className="text-sm font-medium text-zinc-400">Margem de Lucro Desejada</label>
                           <span className="text-purple-400 font-bold">{project.profitMarginPercent}%</span>
                        </div>
                        <input type="range" name="profitMarginPercent" min="0" max="200" value={project.profitMarginPercent} onChange={handleProjectChange} className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-purple-600 hover:accent-purple-500" />
                     </div>
                  </div>
                </div>

                {/* Discounts Card */}
                <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-2xl p-6 backdrop-blur-sm">
                   <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-wider mb-5 flex items-center gap-2">
                    <DollarSign className="w-4 h-4" /> Oferta & Promoção
                  </h3>
                  <div className="flex gap-4">
                     <div className="w-1/3">
                        <label className="block text-xs font-bold text-zinc-500 uppercase mb-1.5">Tipo Desconto</label>
                        <select name="discountType" value={project.discountType} onChange={handleProjectChange} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-white text-sm outline-none focus:border-purple-500">
                           <option value="fixed">Valor (R$)</option>
                           <option value="percentage">Porcentagem (%)</option>
                        </select>
                     </div>
                     <div className="w-2/3">
                        <InputGroup label="Valor do Desconto" name="discountAmount" value={project.discountAmount} onChange={handleProjectChange} />
                     </div>
                  </div>
                </div>

              </div>

              {/* Results Column */}
              <div className="lg:col-span-5 space-y-6">
                <div className="bg-gradient-to-b from-zinc-900 to-zinc-950 border border-zinc-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-10">
                     <DollarSign size={100} />
                  </div>
                  
                  <div className="relative z-10">
                    <h3 className="text-zinc-500 font-bold uppercase tracking-widest text-xs mb-2">Preço Final Sugerido</h3>
                    <div className="flex items-baseline gap-1 mb-1">
                      <span className="text-sm text-zinc-400 font-light translate-y-[-10px]">R$</span>
                      <span className="text-6xl font-bold text-white tracking-tighter">
                        {results.suggestedPrice.toFixed(0)}
                      </span>
                      <span className="text-2xl text-zinc-500 font-light">,{(results.suggestedPrice % 1 * 100).toFixed(0).padStart(2, '0')}</span>
                    </div>
                    
                    {project.discountAmount > 0 && (
                       <div className="text-sm text-red-400 mb-6 line-through bg-red-400/10 inline-block px-2 py-1 rounded">
                          De: R$ {results.grossPrice.toFixed(2)}
                       </div>
                    )}
                    
                    <div className="mt-6 flex flex-col gap-3">
                       <button 
                          onClick={handleGeneratePitch}
                          className="w-full py-2.5 bg-gradient-to-r from-purple-900/40 to-violet-900/40 border border-purple-500/30 hover:border-purple-500/60 rounded-xl text-purple-200 text-sm font-medium flex items-center justify-center gap-2 transition-all group"
                       >
                          <Sparkles size={16} className="text-purple-400 group-hover:text-purple-300" /> 
                          Gerar Proposta Comercial com IA
                       </button>
                    </div>

                    <div className="mt-8 grid grid-cols-2 gap-4">
                      <div className="bg-zinc-950/50 p-4 rounded-xl border border-zinc-800/50 backdrop-blur-md">
                        <span className="text-xs text-zinc-500 font-bold uppercase block mb-1">Lucro Líquido</span>
                        <span className="text-xl font-bold text-emerald-400">R$ {results.profitAmount.toFixed(2)}</span>
                      </div>
                      <div className="bg-zinc-950/50 p-4 rounded-xl border border-zinc-800/50 backdrop-blur-md">
                         <span className="text-xs text-zinc-500 font-bold uppercase block mb-1">Custo Total</span>
                         <span className="text-xl font-bold text-red-400">R$ {results.totalBaseCost.toFixed(2)}</span>
                      </div>
                    </div>

                    <div className="mt-6 h-48">
                      <ResultsChart data={results.breakdown} />
                    </div>

                    {/* ACTIONS - ADDED MARGIN TOP 20 */}
                    <div className="flex gap-3 mt-20">
                       <button onClick={() => saveProposal('draft')} className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 py-3.5 rounded-xl font-medium transition-colors text-sm border border-zinc-700">
                          Salvar Proposta
                       </button>
                       <button 
                         onClick={() => {
                           if (!selectedClientId) {
                             showToast("Selecione um cliente para fechar a tattoo.", 'error');
                             return;
                           }
                           setShowCloseConfirm(true);
                         }} 
                         className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white py-3.5 rounded-xl font-bold transition-colors flex justify-center items-center gap-2 text-sm shadow-lg shadow-emerald-900/20"
                       >
                          <CheckCircle size={18} /> Fechar Tattoo
                       </button>
                    </div>
                  </div>
                </div>
                
                <AIAnalysisPanel analysis={aiResult} loading={isAiLoading} onAnalyze={runAiAnalysis} />
              </div>
            </div>
          </div>
        )}

        {/* VIEW: CLIENTS */}
        {activeTab === 'clients' && (
          <ClientManager 
            clients={clients}
            onAddClient={(c) => { setClients([...clients, c]); showToast("Cliente adicionado!"); }}
            onUpdateClient={(c) => { setClients(clients.map(old => old.id === c.id ? c : old)); showToast("Cliente atualizado!"); }}
            onDeleteClient={(id) => { setClients(clients.filter(c => c.id !== id)); showToast("Cliente removido!"); }}
          />
        )}

        {/* VIEW: PROPOSALS (RENAMED FROM PROJECTS) */}
        {activeTab === 'proposals' && (
          <ProjectManager 
            projects={projects}
            studio={studioProfile}
            onDeleteProject={onDeleteProject}
            onViewProject={loadSavedProject}
            onUpdateStatus={updateProjectStatus}
          />
        )}

        {/* VIEW: DASHBOARD */}
        {activeTab === 'dashboard' && (
          <Dashboard projects={projects} />
        )}

        {/* VIEW: SETTINGS */}
        {activeTab === 'settings' && (
          <div className="animate-fade-in max-w-4xl mx-auto">
             <header className="mb-8 pb-6 border-b border-zinc-800">
                <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                  <Settings className="text-zinc-400" /> Configurações Gerais
                </h2>
                <p className="text-zinc-500 mt-2">Defina os custos do estúdio e informações legais para contratos.</p>
             </header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
               <div className="space-y-6">
                  <section className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
                    <h3 className="font-bold text-white mb-6 flex items-center gap-2 text-sm uppercase tracking-wider">
                       <DollarSign className="w-4 h-4 text-purple-500" /> Custos Fixos Mensais
                    </h3>
                    <div className="space-y-4">
                      <InputGroup label="Aluguel do Estúdio" name="monthlyRent" value={fixedCosts.monthlyRent} onChange={handleCostChange} prefix="R$" />
                      <InputGroup label="Contas (Luz, Água, Net)" name="monthlyUtilities" value={fixedCosts.monthlyUtilities} onChange={handleCostChange} prefix="R$" />
                      <InputGroup label="Marketing / Ads" name="monthlyMarketing" value={fixedCosts.monthlyMarketing} onChange={handleCostChange} prefix="R$" />
                      <InputGroup label="Outros Gastos" name="monthlyMisc" value={fixedCosts.monthlyMisc} onChange={handleCostChange} prefix="R$" />
                      <div className="grid grid-cols-2 gap-4 pt-2">
                        <InputGroup label="Dias Trab/Mês" name="daysWorkedPerMonth" value={fixedCosts.daysWorkedPerMonth} onChange={handleCostChange} />
                        <InputGroup label="Horas/Dia" name="hoursWorkedPerDay" value={fixedCosts.hoursWorkedPerDay} onChange={handleCostChange} />
                      </div>
                    </div>
                  </section>
               </div>

               <div className="space-y-6">
                  <section className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
                    <h3 className="font-bold text-white mb-6 flex items-center gap-2 text-sm uppercase tracking-wider">
                       <FileText className="w-4 h-4 text-purple-500" /> Dados Legais (Contrato)
                    </h3>
                    
                    {/* LOGO UPLOAD SECTION */}
                    <div className="mb-6">
                       <label className="block text-xs font-bold text-zinc-500 uppercase mb-2">Logo do Estúdio</label>
                       <div className="flex items-center gap-4">
                          <div className="w-20 h-20 bg-zinc-950 border border-zinc-800 rounded-lg flex items-center justify-center overflow-hidden shrink-0">
                             {studioProfile.logoUrl ? (
                               <img src={studioProfile.logoUrl} alt="Logo" className="w-full h-full object-contain" />
                             ) : (
                               <ImageIcon className="text-zinc-700" size={24} />
                             )}
                          </div>
                          <div className="flex-1">
                             <div className="flex gap-2 mb-2">
                                <label className="flex-1 cursor-pointer bg-zinc-800 hover:bg-zinc-700 text-white py-2 px-3 rounded-lg text-xs font-medium flex items-center justify-center gap-2 transition-colors border border-zinc-700">
                                   <Upload size={14} /> Upload Logo
                                   <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                                </label>
                                {studioProfile.logoUrl && (
                                   <button onClick={removeLogo} className="p-2 bg-red-900/30 text-red-400 hover:bg-red-900/50 rounded-lg border border-red-900/50">
                                      <Trash2 size={14} />
                                   </button>
                                )}
                             </div>
                             <p className="text-[10px] text-zinc-500">Recomendado: Imagem transparente (PNG) até 500KB.</p>
                          </div>
                       </div>
                    </div>

                    <div className="space-y-4">
                       <InputGroup label="Nome Fantasia / Estúdio" name="name" value={studioProfile.name} onChange={handleProfileChange} type="text" />
                       <InputGroup label="Nome do Responsável" name="ownerName" value={studioProfile.ownerName} onChange={handleProfileChange} type="text" />
                       <InputGroup label="CPF ou CNPJ" name="document" value={studioProfile.document} onChange={handleProfileChange} type="text" />
                       <InputGroup label="Endereço Completo" name="address" value={studioProfile.address} onChange={handleProfileChange} type="text" />
                       <InputGroup label="Telefone Contato" name="phone" value={studioProfile.phone} onChange={handleProfileChange} type="text" />
                       <InputGroup label="Email Comercial" name="email" value={studioProfile.email} onChange={handleProfileChange} type="text" />
                    </div>
                  </section>
               </div>
            </div>
          </div>
        )}

      </main>

      <MobileNav />

      <SalesPitchModal 
        isOpen={isPitchModalOpen} 
        onClose={() => setIsPitchModalOpen(false)} 
        pitch={salesPitch} 
        loading={isPitchLoading} 
        clientPhone={clients.find(c => c.id === selectedClientId)?.phone}
      />

      <ConfirmModal 
        isOpen={showCloseConfirm}
        onClose={() => setShowCloseConfirm(false)}
        onConfirm={() => saveProposal('completed')}
        title="Confirmar Venda"
        message="Deseja fechar esta tattoo agora? O projeto será salvo e o valor contabilizado no relatório."
        variant="success"
        confirmText="Confirmar Venda"
      />

      <Toast 
        message={toast.message} 
        type={toast.type} 
        isVisible={toast.isVisible} 
        onClose={() => setToast(prev => ({ ...prev, isVisible: false }))} 
      />
    </div>
  );
};

// UI Components
const InputGroup: React.FC<{label: string, name: string, value: string | number, onChange: any, type?: string, prefix?: string, suffix?: string}> = 
  ({ label, name, value, onChange, type = "number", prefix, suffix }) => (
  <div>
    <label className="block text-xs font-bold text-zinc-500 uppercase mb-1.5">{label}</label>
    <div className="relative group">
      {prefix && <span className="absolute left-3 top-3 text-zinc-500 text-sm font-medium group-focus-within:text-purple-400">{prefix}</span>}
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        className={`w-full bg-zinc-950 border border-zinc-800 rounded-lg py-3 text-white text-sm focus:border-purple-500 focus:outline-none transition-all placeholder-zinc-700 ${prefix ? 'pl-9' : 'pl-3'} ${suffix ? 'pr-9' : 'pr-3'}`}
      />
      {suffix && <span className="absolute right-3 top-3 text-zinc-500 text-sm font-medium">{suffix}</span>}
    </div>
  </div>
);

const InputSelect: React.FC<{label: string, name: string, value: string, onChange: any, options: string[]}> = ({label, name, value, onChange, options}) => (
  <div>
    <label className="block text-xs font-bold text-zinc-500 uppercase mb-1.5">{label}</label>
    <div className="relative">
      <select 
        name={name} 
        value={value} 
        onChange={onChange}
        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-white text-sm focus:border-purple-500 focus:outline-none transition-all appearance-none"
      >
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
      <div className="absolute right-3 top-3.5 pointer-events-none text-zinc-500">
         <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
         </svg>
      </div>
    </div>
  </div>
);

export default App;