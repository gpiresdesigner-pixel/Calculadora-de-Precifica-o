import React, { useMemo, useState } from 'react';
import { SavedProject } from '../types';
import { BarChart3, TrendingUp, DollarSign, Calendar } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface DashboardProps {
  projects: SavedProject[];
}

const Dashboard: React.FC<DashboardProps> = ({ projects }) => {
  const [filterYear, setFilterYear] = useState(new Date().getFullYear());

  const stats = useMemo(() => {
    const completedProjects = projects.filter(p => p.status === 'completed');
    
    // Filter by year if needed for detailed chart, but total stats usually cover all time or YTD.
    // Let's do All Time for top cards, and monthly breakdown for the chart.

    const totalRevenue = completedProjects.reduce((sum, p) => sum + p.finalPrice, 0);
    const totalCost = completedProjects.reduce((sum, p) => sum + p.finalCost, 0);
    const totalProfit = completedProjects.reduce((sum, p) => sum + p.finalProfit, 0);
    const avgTicket = completedProjects.length ? totalRevenue / completedProjects.length : 0;
    const margin = totalRevenue ? (totalProfit / totalRevenue) * 100 : 0;

    // Chart Data (Monthly for selected year)
    const monthlyData = Array(12).fill(0).map((_, i) => ({
      name: new Date(0, i).toLocaleString('pt-BR', { month: 'short' }),
      receita: 0,
      lucro: 0,
      custo: 0
    }));

    completedProjects.forEach(p => {
      const d = new Date(p.date);
      if (d.getFullYear() === filterYear) {
        const month = d.getMonth();
        monthlyData[month].receita += p.finalPrice;
        monthlyData[month].lucro += p.finalProfit;
        monthlyData[month].custo += p.finalCost;
      }
    });

    return { totalRevenue, totalCost, totalProfit, avgTicket, margin, monthlyData, count: completedProjects.length };
  }, [projects, filterYear]);

  return (
    <div className="space-y-6 animate-fade-in pb-20">
      <div className="flex justify-between items-center">
        <h2 className="text-xl md:text-2xl font-bold text-white flex items-center gap-2">
          <TrendingUp className="text-purple-500" /> Relatório Financeiro
        </h2>
        <div className="flex items-center gap-2 bg-zinc-900 p-1 rounded-lg border border-zinc-800">
           <button onClick={() => setFilterYear(filterYear - 1)} className="px-3 py-1 text-zinc-400 hover:text-white">&lt;</button>
           <span className="font-mono text-purple-400 font-bold">{filterYear}</span>
           <button onClick={() => setFilterYear(filterYear + 1)} className="px-3 py-1 text-zinc-400 hover:text-white">&gt;</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="Receita Total" 
          value={`R$ ${stats.totalRevenue.toFixed(2)}`} 
          icon={<DollarSign className="text-purple-500" />} 
          subtext={`${stats.count} projetos fechados`}
        />
        <StatCard 
          title="Lucro Líquido" 
          value={`R$ ${stats.totalProfit.toFixed(2)}`} 
          icon={<TrendingUp className="text-emerald-500" />} 
          subtext={`Margem média: ${stats.margin.toFixed(1)}%`}
        />
        <StatCard 
          title="Ticket Médio" 
          value={`R$ ${stats.avgTicket.toFixed(2)}`} 
          icon={<BarChart3 className="text-blue-500" />} 
          subtext="Por tatuagem"
        />
        <StatCard 
          title="Custos Totais" 
          value={`R$ ${stats.totalCost.toFixed(2)}`} 
          icon={<DollarSign className="text-red-500" />} 
          subtext="Fixos + Variáveis"
        />
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 md:p-6 shadow-lg h-96">
        <h3 className="text-lg font-semibold text-white mb-6">Desempenho Mensal ({filterYear})</h3>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={stats.monthlyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
            <XAxis dataKey="name" stroke="#71717a" fontSize={12} />
            <YAxis stroke="#71717a" fontSize={12} />
            <Tooltip 
              contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', color: '#f4f4f5' }}
              cursor={{fill: '#27272a'}}
            />
            <Bar dataKey="receita" name="Receita" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
            <Bar dataKey="lucro" name="Lucro" fill="#10b981" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

const StatCard: React.FC<{title: string, value: string, icon: React.ReactNode, subtext: string}> = ({title, value, icon, subtext}) => (
  <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 shadow-lg">
    <div className="flex justify-between items-start mb-2">
      <span className="text-zinc-400 text-sm font-medium">{title}</span>
      <div className="p-2 bg-zinc-950 rounded-lg">{icon}</div>
    </div>
    <div className="text-2xl font-bold text-white mb-1">{value}</div>
    <div className="text-xs text-zinc-500">{subtext}</div>
  </div>
);

export default Dashboard;