"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from "recharts";
import { TrendingUp } from "lucide-react";

interface MonthlyRevenueChartProps {
  data: Array<{
    month: string;
    transactions: number;
    grossRevenue: number;
    netRevenue: number;
    refunds: number;
  }>;
}

export function MonthlyRevenueChart({ data }: MonthlyRevenueChartProps) {
  // Format data for display
  const formattedData = data.map(item => ({
    ...item,
    month: formatMonth(item.month),
    grossRevenueDisplay: item.grossRevenue / 100,
    netRevenueDisplay: item.netRevenue / 100,
    refundsDisplay: item.refunds / 100,
  }));

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 border rounded-lg shadow-lg">
          <p className="font-semibold text-sm mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center justify-between gap-4 text-sm">
              <span style={{ color: entry.color }}>{entry.name}:</span>
              <span className="font-medium">
                {new Intl.NumberFormat("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                }).format(entry.value)}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Tendência de Receitas</CardTitle>
            <CardDescription>
              Evolução mensal das suas receitas
            </CardDescription>
          </div>
          <TrendingUp className="h-5 w-5 text-green-600" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart 
              data={formattedData}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200" />
              <XAxis 
                dataKey="month" 
                className="text-xs"
                tick={{ fill: "#6B7280" }}
              />
              <YAxis 
                className="text-xs"
                tick={{ fill: "#6B7280" }}
                tickFormatter={(value) => `R$ ${value.toLocaleString("pt-BR")}`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                wrapperStyle={{ paddingTop: "20px" }}
                iconType="line"
              />
              <Line 
                type="monotone" 
                dataKey="grossRevenueDisplay" 
                stroke="#10B981" 
                strokeWidth={2}
                name="Receita Bruta"
                dot={{ fill: "#10B981", r: 4 }}
                activeDot={{ r: 6 }}
              />
              <Line 
                type="monotone" 
                dataKey="netRevenueDisplay" 
                stroke="#3B82F6" 
                strokeWidth={2}
                name="Receita Líquida"
                dot={{ fill: "#3B82F6", r: 4 }}
                activeDot={{ r: 6 }}
              />
              {data.some(item => item.refunds > 0) && (
                <Line 
                  type="monotone" 
                  dataKey="refundsDisplay" 
                  stroke="#EF4444" 
                  strokeWidth={2}
                  name="Reembolsos"
                  dot={{ fill: "#EF4444", r: 4 }}
                  activeDot={{ r: 6 }}
                  strokeDasharray="5 5"
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
        
        {/* Summary */}
        <div className="mt-6 pt-6 border-t">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-sm text-gray-600">Total do Período</p>
              <p className="text-lg font-semibold text-green-600">
                {new Intl.NumberFormat("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                }).format(data.reduce((sum, item) => sum + item.grossRevenue, 0) / 100)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Média Mensal</p>
              <p className="text-lg font-semibold text-blue-600">
                {new Intl.NumberFormat("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                }).format(data.reduce((sum, item) => sum + item.netRevenue, 0) / data.length / 100)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Transações</p>
              <p className="text-lg font-semibold text-purple-600">
                {data.reduce((sum, item) => sum + item.transactions, 0)}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function formatMonth(monthString: string): string {
  const [year, month] = monthString.split("-");
  const months = [
    "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
    "Jul", "Ago", "Set", "Out", "Nov", "Dez"
  ];
  return `${months[parseInt(month) - 1]}/${year.slice(2)}`;
} 