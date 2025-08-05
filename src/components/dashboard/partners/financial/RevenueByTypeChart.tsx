"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart as PieChartIcon } from "lucide-react";
import { 
  PieChart, 
  Pie, 
  Cell, 
  Tooltip, 
  ResponsiveContainer
} from "recharts";


interface RevenueByTypeChartProps {
  data: Record<string, {
    count: number;
    grossRevenue: number;
    netRevenue: number;
  }>;
}

const COLORS = {
  activity: "#3B82F6",      // Blue
  event: "#8B5CF6",         // Purple
  restaurant: "#F59E0B",    // Amber
  accommodation: "#10B981", // Green
  vehicle: "#EF4444",       // Red
  package: "#EC4899",       // Pink
};

export function RevenueByTypeChart({ data }: RevenueByTypeChartProps) {
  // Format data for pie chart
  const chartData = Object.entries(data).map(([type, values]) => ({
    name: getTypeLabel(type),
    value: values.netRevenue / 100,
    count: values.count,
    color: COLORS[type as keyof typeof COLORS] || "#6B7280",
    percentage: 0, // Will calculate below
  }));

  // Calculate percentages
  const total = chartData.reduce((sum, item) => sum + item.value, 0);
  chartData.forEach(item => {
    item.percentage = total > 0 ? (item.value / total) * 100 : 0;
  });

  // Sort by value descending
  chartData.sort((a, b) => b.value - a.value);

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload[0]) {
      const data = payload[0];
      return (
        <div className="bg-white p-4 border rounded-lg shadow-lg">
          <p className="font-semibold text-sm mb-1">{data.name}</p>
          <p className="text-sm">
            <span className="text-gray-600">Receita:</span>{" "}
            <span className="font-medium">
              {new Intl.NumberFormat("pt-BR", {
                style: "currency",
                currency: "BRL",
              }).format(data.value)}
            </span>
          </p>
          <p className="text-sm">
            <span className="text-gray-600">Transações:</span>{" "}
            <span className="font-medium">{data.payload.count}</span>
          </p>
          <p className="text-sm">
            <span className="text-gray-600">Porcentagem:</span>{" "}
            <span className="font-medium">{data.payload.percentage.toFixed(1)}%</span>
          </p>
        </div>
      );
    }
    return null;
  };

  // Custom label
  const renderCustomLabel = (entry: any) => {
    if (entry.percentage < 5) return null; // Don't show label for small slices
    return `${entry.percentage.toFixed(0)}%`;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Receita por Tipo</CardTitle>
            <CardDescription>
              Distribuição das receitas por categoria
            </CardDescription>
          </div>
          <PieChartIcon className="h-5 w-5 text-blue-600" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={renderCustomLabel}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Legend */}
        <div className="mt-6 space-y-3">
          {chartData.map((item, index) => (
            <div key={index} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="w-4 h-4 rounded"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-sm font-medium">{item.name}</span>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold">
                  {new Intl.NumberFormat("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  }).format(item.value)}
                </p>
                <p className="text-xs text-gray-500">
                  {item.count} transações ({item.percentage.toFixed(1)}%)
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Total */}
        <div className="mt-6 pt-6 border-t">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-600">Total Geral</span>
            <p className="text-lg font-bold">
              {new Intl.NumberFormat("pt-BR", {
                style: "currency",
                currency: "BRL",
              }).format(total)}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function getTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    activity: "Atividades",
    event: "Eventos",
    restaurant: "Restaurantes",
    accommodation: "Hospedagens",
    vehicle: "Veículos",
    package: "Pacotes",
  };
  return labels[type] || type;
} 