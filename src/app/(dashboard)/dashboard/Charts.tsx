'use client';

import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  BarChart, 
  Bar,
  Legend
} from 'recharts';
import { BarChart3 } from 'lucide-react';

interface ChartData {
  name: string;
  clientes?: number;
  receita?: number;
}

interface ChartProps {
  data?: ChartData[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--gray-200)',
        borderRadius: '12px',
        padding: '12px 16px',
        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
      }}>
        <p style={{ 
          fontWeight: 600, 
          marginBottom: 8,
          color: 'var(--text-primary)',
          fontSize: 13
        }}>{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} style={{ 
            color: entry.color, 
            fontSize: 13,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            marginBottom: 4
          }}>
            <span style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: entry.color,
              display: 'inline-block'
            }} />
            {entry.name}: <strong>{entry.dataKey === 'receita' ? `R$ ${entry.value}` : entry.value}</strong>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

function EmptyChart({ message }: { message: string }) {
  return (
    <div style={{ 
      width: '100%', 
      height: 300, 
      display: 'flex', 
      flexDirection: 'column',
      alignItems: 'center', 
      justifyContent: 'center',
      color: 'var(--text-muted)',
      gap: 12
    }}>
      <BarChart3 size={40} style={{ opacity: 0.5 }} />
      <p style={{ fontSize: 14 }}>{message}</p>
    </div>
  );
}

export function GrowthChart({ data }: ChartProps) {
  if (!data || data.length === 0) {
    return <EmptyChart message="Sem dados para exibir" />;
  }

  return (
    <div style={{ width: '100%', height: 300 }}>
      <ResponsiveContainer>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="colorClientes" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.4}/>
              <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--gray-200)" vertical={false} />
          <XAxis 
            dataKey="name" 
            stroke="var(--text-muted)" 
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <YAxis 
            stroke="var(--text-muted)" 
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area 
            type="monotone" 
            dataKey="clientes"
            name="Clientes"
            stroke="#8B5CF6" 
            strokeWidth={3}
            fillOpacity={1} 
            fill="url(#colorClientes)" 
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function RevenueChart({ data }: ChartProps) {
  if (!data || data.length === 0) {
    return <EmptyChart message="Sem dados para exibir" />;
  }

  return (
    <div style={{ width: '100%', height: 300 }}>
      <ResponsiveContainer>
        <BarChart data={data} barSize={32}>
          <defs>
            <linearGradient id="colorReceita" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#8B5CF6" stopOpacity={1}/>
              <stop offset="100%" stopColor="#6366F1" stopOpacity={1}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--gray-200)" vertical={false} />
          <XAxis 
            dataKey="name" 
            stroke="var(--text-muted)" 
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <YAxis 
            stroke="var(--text-muted)" 
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => `R$${value / 1000}k`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar 
            dataKey="receita"
            name="Receita"
            fill="url(#colorReceita)" 
            radius={[8, 8, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
