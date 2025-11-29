import React, { useState } from 'react';
import { Client } from '../types';
import { Users, Search, Plus, Trash2, Edit2, Phone, Mail, Save } from 'lucide-react';
import ConfirmModal from './ConfirmModal';

interface ClientManagerProps {
  clients: Client[];
  onAddClient: (client: Client) => void;
  onUpdateClient: (client: Client) => void;
  onDeleteClient: (id: string) => void;
}

const DDI_OPTIONS = [
  { code: '+55', country: '🇧🇷' },
  { code: '+1', country: '🇺🇸' },
  { code: '+351', country: '🇵🇹' },
  { code: '+44', country: '🇬🇧' },
  { code: '+34', country: '🇪🇸' },
  { code: '+33', country: '🇫🇷' },
  { code: '+49', country: '🇩🇪' },
  { code: '+39', country: '🇮🇹' },
  { code: '+81', country: '🇯🇵' },
  { code: '+86', country: '🇨🇳' },
  { code: '+598', country: '🇺🇾' },
  { code: '+54', country: '🇦🇷' },
  { code: '+56', country: '🇨🇱' },
  { code: '+57', country: '🇨🇴' },
  { code: '+51', country: '🇵🇪' },
];

// Safe ID Generator
const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
};

const ClientManager: React.FC<ClientManagerProps> = ({ clients, onAddClient, onUpdateClient, onDeleteClient }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Client>>({});
  
  // Phone State
  const [phoneDDI, setPhoneDDI] = useState('+55');
  const [phoneNumber, setPhoneNumber] = useState('');

  // State for Confirmation Modal
  const [clientToDelete, setClientToDelete] = useState<string | null>(null);

  // Filter clients
  const filteredClients = clients.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.phone.includes(searchTerm)
  );

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, ''); // Remove non-digits
    
    // Limit length (max 11 digits for BR generally, but lenient for international)
    if (val.length > 15) val = val.slice(0, 15);

    // Apply basic mask based on length if it looks like a BR number (10-11 digits)
    // Otherwise just show raw digits
    let formatted = val;
    if (phoneDDI === '+55') {
       if (val.length > 11) val = val.slice(0, 11);
       
       if (val.length > 2) {
          formatted = `(${val.slice(0, 2)}) ${val.slice(2)}`;
       }
       if (val.length > 6) {
          if (val.length === 11) {
             formatted = `(${val.slice(0, 2)}) ${val.slice(2, 7)}-${val.slice(7)}`;
          } else if (val.length >= 6) {
             formatted = `(${val.slice(0, 2)}) ${val.slice(2, 6)}-${val.slice(6)}`;
          }
       }
    }
    
    setPhoneNumber(formatted);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;
    
    // Basic validation
    const cleanDigits = phoneNumber.replace(/\D/g, '');
    if (cleanDigits.length < 8) {
      alert("Por favor, insira um número de telefone válido.");
      return;
    }

    const fullPhone = `${phoneDDI} ${phoneNumber}`;

    if (isEditing === 'new') {
      const newClient: Client = {
        id: generateId(),
        name: formData.name,
        phone: fullPhone,
        email: formData.email,
        notes: formData.notes,
        createdAt: Date.now()
      };
      onAddClient(newClient);
    } else if (isEditing) {
      const updatedClient = {
        ...clients.find(c => c.id === isEditing)!,
        ...formData,
        phone: fullPhone
      } as Client;
      onUpdateClient(updatedClient);
    }
    setIsEditing(null);
    setFormData({});
    setPhoneNumber('');
  };

  const startEdit = (client?: Client) => {
    if (client) {
      setIsEditing(client.id);
      setFormData(client);
      
      // Try to parse existing phone
      // Heuristic: Check if starts with a known DDI + space or just DDI
      let foundDDI = DDI_OPTIONS.find(d => client.phone.startsWith(d.code + ' '));
      
      if (foundDDI) {
          setPhoneDDI(foundDDI.code);
          setPhoneNumber(client.phone.replace(foundDDI.code + ' ', ''));
      } else {
          // Try exact match start
          foundDDI = DDI_OPTIONS.find(d => client.phone.startsWith(d.code));
          if (foundDDI) {
             setPhoneDDI(foundDDI.code);
             setPhoneNumber(client.phone.replace(foundDDI.code, '').trim());
          } else {
             // Default fallback if format is old
             setPhoneDDI('+55');
             setPhoneNumber(client.phone);
          }
      }

    } else {
      setIsEditing('new');
      setFormData({});
      setPhoneDDI('+55');
      setPhoneNumber('');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-20">
      <div className="flex justify-between items-center">
        <h2 className="text-xl md:text-2xl font-bold text-white flex items-center gap-2">
          <Users className="text-purple-500" /> Carteira de Clientes
        </h2>
        <button 
          onClick={() => startEdit()}
          className="bg-purple-600 hover:bg-purple-700 text-white px-3 md:px-4 py-2 rounded-lg flex items-center gap-2 transition-colors text-sm md:text-base"
        >
          <Plus size={18} /> <span className="hidden md:inline">Novo Cliente</span><span className="md:hidden">Novo</span>
        </button>
      </div>

      {isEditing && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 md:p-6 shadow-xl">
          <h3 className="text-lg font-semibold text-white mb-4">
            {isEditing === 'new' ? 'Adicionar Novo Cliente' : 'Editar Cliente'}
          </h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1">Nome Completo</label>
              <input 
                required
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-purple-500 text-base"
                value={formData.name || ''}
                onChange={e => setFormData({...formData, name: e.target.value})}
                placeholder="Ex: João da Silva"
              />
            </div>
            
            {/* Phone Input with DDI */}
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1">Telefone / WhatsApp</label>
              <div className="flex gap-2">
                 <select
                    className="bg-zinc-800 border border-zinc-700 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-purple-500 text-base w-24 appearance-none text-center"
                    value={phoneDDI}
                    onChange={e => setPhoneDDI(e.target.value)}
                 >
                    {DDI_OPTIONS.map(opt => (
                       <option key={opt.code} value={opt.code}>{opt.country} {opt.code}</option>
                    ))}
                 </select>
                 <input 
                   required
                   className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-purple-500 text-base"
                   value={phoneNumber}
                   onChange={handlePhoneChange}
                   placeholder="(00) 00000-0000"
                 />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1">Email (Opcional)</label>
              <input 
                type="email"
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-purple-500 text-base"
                value={formData.email || ''}
                onChange={e => setFormData({...formData, email: e.target.value})}
                placeholder="cliente@email.com"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-zinc-400 mb-1">Observações</label>
              <textarea 
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-purple-500 text-base"
                rows={2}
                value={formData.notes || ''}
                onChange={e => setFormData({...formData, notes: e.target.value})}
                placeholder="Preferências, alergias, ideias de tattoo..."
              />
            </div>
            <div className="md:col-span-2 flex justify-end gap-3 mt-2">
              <button 
                type="button" 
                onClick={() => setIsEditing(null)}
                className="px-4 py-2 text-zinc-400 hover:text-white"
              >
                Cancelar
              </button>
              <button 
                type="submit" 
                className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg flex items-center gap-2"
              >
                <Save size={18} /> Salvar
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-zinc-800">
          <div className="relative">
            <Search className="absolute left-3 top-3 text-zinc-500 w-5 h-5" />
            <input 
              className="w-full bg-zinc-950 border border-zinc-700 rounded-lg py-2.5 pl-10 text-white focus:outline-none focus:border-purple-500 text-base"
              placeholder="Buscar por nome ou telefone..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        
        <div className="divide-y divide-zinc-800">
          {filteredClients.length === 0 ? (
            <div className="p-8 text-center text-zinc-500">
              Nenhum cliente encontrado.
            </div>
          ) : (
            filteredClients.map(client => (
              <div key={client.id} className="p-4 flex flex-col md:flex-row justify-between items-start md:items-center hover:bg-zinc-800/50 transition-colors gap-4">
                <div className="w-full md:w-auto overflow-hidden">
                  <h4 className="font-semibold text-white text-lg truncate">{client.name}</h4>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mt-1 text-sm text-zinc-400">
                    <span className="flex items-center gap-1"><Phone size={14} /> {client.phone}</span>
                    {client.email && <span className="flex items-center gap-1 truncate"><Mail size={14} /> {client.email}</span>}
                  </div>
                  {client.notes && <p className="text-xs text-zinc-500 mt-2 italic truncate">{client.notes}</p>}
                </div>
                <div className="flex items-center gap-2 self-end md:self-auto w-full md:w-auto justify-end">
                  <button 
                    onClick={() => startEdit(client)}
                    className="p-3 md:p-2 bg-zinc-800 md:bg-transparent text-zinc-400 hover:text-purple-400 hover:bg-zinc-800 rounded-lg"
                  >
                    <Edit2 size={20} />
                  </button>
                  <button 
                    onClick={() => setClientToDelete(client.id)}
                    className="p-3 md:p-2 bg-zinc-800 md:bg-transparent text-zinc-400 hover:text-red-400 hover:bg-zinc-800 rounded-lg"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
      
      <ConfirmModal 
        isOpen={!!clientToDelete}
        onClose={() => setClientToDelete(null)}
        onConfirm={() => clientToDelete && onDeleteClient(clientToDelete)}
        title="Excluir Cliente"
        message="Tem certeza que deseja remover este cliente? O histórico de orçamentos dele será mantido, mas o cadastro será removido."
        confirmText="Sim, Excluir"
      />
    </div>
  );
};

export default ClientManager;