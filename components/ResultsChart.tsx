import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { PricingResult } from '../types';

interface ResultsChartProps {
  data: PricingResult['breakdown'];
}

const ResultsChart: React.FC<ResultsChartProps> = ({ data }) => {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            paddingAngle={5}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
            ))}
          </Pie>
          <Tooltip 
            formatter={(value: number) => `R$ ${value.toFixed(2)}`}
            contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', color: '#f4f4f5' }}
            itemStyle={{ color: '#f4f4f5' }}
          />
          <Legend wrapperStyle={{ paddingTop: '10px' }}/>
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ResultsChart;