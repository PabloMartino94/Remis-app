import { 
  Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend,
  PieChart, Pie, Cell, LineChart, Line, Area, AreaChart
} from "recharts";
import { useApp } from "@/context/AppContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { format, parseISO, subDays } from "date-fns";
import { es } from "date-fns/locale";
import { TrendingUp, TrendingDown, Car, Fuel, DollarSign, Wallet } from "lucide-react";

const COLORS = {
  income: "#22c55e",
  expenses: "#ef4444",
  cc: "#3b82f6",
  particular: "#8b5cf6",
  nafta: "#f97316",
  gas: "#eab308",
  otro: "#6b7280",
  balance: "#0ea5e9",
  positive: "#22c55e",
  negative: "#ef4444",
};

export function IncomeChart() {
  const { allSummaries, trips, expenses } = useApp();

  const today = new Date();
  const last7Days = Array.from({ length: 7 }).map((_, i) => {
    const d = subDays(today, 6 - i);
    const dateStr = format(d, "yyyy-MM-dd");
    const summary = allSummaries.find(s => s.date === dateStr);
    
    return {
      date: dateStr,
      displayDate: format(d, "EEE", { locale: es }),
      fullDate: format(d, "dd/MM", { locale: es }),
      income: summary ? summary.totalIncome : 0,
      expenses: summary ? summary.totalExpenses : 0,
      incomeCC: summary ? summary.incomeCC + summary.waitCC : 0,
      incomePart: summary ? summary.incomePart + summary.waitPart : 0,
      balance: summary ? summary.balance : 0,
      tripCount: summary ? summary.tripCount : 0,
      netIncome: summary ? summary.totalIncome - summary.totalExpenses : 0,
    };
  });

  const totals7Days = last7Days.reduce((acc, day) => ({
    income: acc.income + day.income,
    expenses: acc.expenses + day.expenses,
    incomeCC: acc.incomeCC + day.incomeCC,
    incomePart: acc.incomePart + day.incomePart,
    tripCount: acc.tripCount + day.tripCount,
    netIncome: acc.netIncome + day.netIncome,
  }), { income: 0, expenses: 0, incomeCC: 0, incomePart: 0, tripCount: 0, netIncome: 0 });

  const tripTypeData = [
    { name: "CC", value: totals7Days.incomeCC, color: COLORS.cc },
    { name: "Particular", value: totals7Days.incomePart, color: COLORS.particular },
  ].filter(d => d.value > 0);

  const last7DaysExpenses = expenses.filter(e => {
    const expDate = parseISO(e.date);
    const sevenDaysAgo = subDays(today, 7);
    return expDate >= sevenDaysAgo;
  });

  const expenseByType = [
    { name: "Nafta", value: last7DaysExpenses.filter(e => e.type === 'Nafta').reduce((s, e) => s + e.amount, 0), color: COLORS.nafta },
    { name: "Gas", value: last7DaysExpenses.filter(e => e.type === 'Gas').reduce((s, e) => s + e.amount, 0), color: COLORS.gas },
    { name: "Otro", value: last7DaysExpenses.filter(e => e.type === 'Otro').reduce((s, e) => s + e.amount, 0), color: COLORS.otro },
  ].filter(d => d.value > 0);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-lg border bg-background/95 backdrop-blur p-3 shadow-lg">
          <p className="font-medium text-sm mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center gap-2 text-sm">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
              <span className="text-muted-foreground">{entry.name}:</span>
              <span className="font-semibold">${entry.value?.toFixed(0)}</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-4 pb-24">
      <div className="grid grid-cols-2 gap-3">
        <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border-green-200 dark:border-green-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="h-4 w-4 text-green-600" />
              <span className="text-xs text-green-700 dark:text-green-300 font-medium">Ingresos 7 días</span>
            </div>
            <p className="text-2xl font-bold text-green-700 dark:text-green-300" data-testid="text-total-income-7d">
              ${totals7Days.income.toFixed(0)}
            </p>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950 dark:to-red-900 border-red-200 dark:border-red-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingDown className="h-4 w-4 text-red-600" />
              <span className="text-xs text-red-700 dark:text-red-300 font-medium">Gastos 7 días</span>
            </div>
            <p className="text-2xl font-bold text-red-700 dark:text-red-300" data-testid="text-total-expenses-7d">
              ${totals7Days.expenses.toFixed(0)}
            </p>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-blue-200 dark:border-blue-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Car className="h-4 w-4 text-blue-600" />
              <span className="text-xs text-blue-700 dark:text-blue-300 font-medium">Viajes 7 días</span>
            </div>
            <p className="text-2xl font-bold text-blue-700 dark:text-blue-300" data-testid="text-total-trips-7d">
              {totals7Days.tripCount}
            </p>
          </CardContent>
        </Card>
        
        <Card className={`bg-gradient-to-br ${totals7Days.netIncome >= 0 ? 'from-emerald-50 to-emerald-100 dark:from-emerald-950 dark:to-emerald-900 border-emerald-200 dark:border-emerald-800' : 'from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900 border-orange-200 dark:border-orange-800'}`}>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Wallet className="h-4 w-4" />
              <span className="text-xs font-medium">Neto 7 días</span>
            </div>
            <p className={`text-2xl font-bold ${totals7Days.netIncome >= 0 ? 'text-emerald-700 dark:text-emerald-300' : 'text-orange-700 dark:text-orange-300'}`} data-testid="text-net-income-7d">
              ${totals7Days.netIncome.toFixed(0)}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Ingresos vs Gastos</CardTitle>
          <CardDescription>Comparación de los últimos 7 días</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[220px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={last7Days} barGap={2}>
                <XAxis 
                  dataKey="displayDate" 
                  stroke="#888888" 
                  fontSize={11} 
                  tickLine={false} 
                  axisLine={false} 
                />
                <YAxis 
                  stroke="#888888" 
                  fontSize={11} 
                  tickLine={false} 
                  axisLine={false} 
                  tickFormatter={(value) => `$${value >= 1000 ? (value/1000).toFixed(0) + 'k' : value}`} 
                  width={45}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend 
                  wrapperStyle={{ fontSize: '12px' }}
                  formatter={(value) => <span className="text-xs">{value}</span>}
                />
                <Bar 
                  dataKey="income" 
                  name="Ingresos"
                  fill={COLORS.income}
                  radius={[4, 4, 0, 0]} 
                />
                <Bar 
                  dataKey="expenses" 
                  name="Gastos"
                  fill={COLORS.expenses}
                  radius={[4, 4, 0, 0]} 
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Ganancia Neta</CardTitle>
          <CardDescription>Tendencia de ingresos menos gastos</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[180px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={last7Days}>
                <defs>
                  <linearGradient id="colorNet" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS.income} stopOpacity={0.3}/>
                    <stop offset="95%" stopColor={COLORS.income} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis 
                  dataKey="displayDate" 
                  stroke="#888888" 
                  fontSize={11} 
                  tickLine={false} 
                  axisLine={false} 
                />
                <YAxis 
                  stroke="#888888" 
                  fontSize={11} 
                  tickLine={false} 
                  axisLine={false} 
                  tickFormatter={(value) => `$${value}`} 
                  width={50}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area 
                  type="monotone"
                  dataKey="netIncome" 
                  name="Ganancia Neta"
                  stroke={COLORS.income}
                  fill="url(#colorNet)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardHeader className="pb-0 pt-3 px-3">
            <CardTitle className="text-sm">Tipo de Viaje</CardTitle>
          </CardHeader>
          <CardContent className="p-2">
            {tripTypeData.length > 0 ? (
              <div className="h-[140px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={tripTypeData}
                      cx="50%"
                      cy="50%"
                      innerRadius={30}
                      outerRadius={50}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {tripTypeData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: number) => [`$${value.toFixed(0)}`, '']}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[140px] flex items-center justify-center text-muted-foreground text-sm">
                Sin datos
              </div>
            )}
            <div className="flex justify-center gap-4 text-xs mt-1">
              <div className="flex items-center gap-1">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS.cc }} />
                <span>CC</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS.particular }} />
                <span>Particular</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-0 pt-3 px-3">
            <CardTitle className="text-sm">Tipo de Gasto</CardTitle>
          </CardHeader>
          <CardContent className="p-2">
            {expenseByType.length > 0 ? (
              <div className="h-[140px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={expenseByType}
                      cx="50%"
                      cy="50%"
                      innerRadius={30}
                      outerRadius={50}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {expenseByType.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: number) => [`$${value.toFixed(0)}`, '']}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[140px] flex items-center justify-center text-muted-foreground text-sm">
                Sin datos
              </div>
            )}
            <div className="flex justify-center gap-3 text-xs mt-1">
              <div className="flex items-center gap-1">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS.nafta }} />
                <span>Nafta</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS.gas }} />
                <span>Gas</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS.otro }} />
                <span>Otro</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Ingresos por Tipo</CardTitle>
          <CardDescription>CC vs Particular por día</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[200px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={last7Days} barGap={0}>
                <XAxis 
                  dataKey="displayDate" 
                  stroke="#888888" 
                  fontSize={11} 
                  tickLine={false} 
                  axisLine={false} 
                />
                <YAxis 
                  stroke="#888888" 
                  fontSize={11} 
                  tickLine={false} 
                  axisLine={false} 
                  tickFormatter={(value) => `$${value >= 1000 ? (value/1000).toFixed(0) + 'k' : value}`} 
                  width={45}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend 
                  wrapperStyle={{ fontSize: '12px' }}
                  formatter={(value) => <span className="text-xs">{value}</span>}
                />
                <Bar 
                  dataKey="incomeCC" 
                  name="CC"
                  stackId="a"
                  fill={COLORS.cc}
                  radius={[0, 0, 0, 0]} 
                />
                <Bar 
                  dataKey="incomePart" 
                  name="Particular"
                  stackId="a"
                  fill={COLORS.particular}
                  radius={[4, 4, 0, 0]} 
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Cantidad de Viajes</CardTitle>
          <CardDescription>Viajes por día</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[160px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={last7Days}>
                <XAxis 
                  dataKey="displayDate" 
                  stroke="#888888" 
                  fontSize={11} 
                  tickLine={false} 
                  axisLine={false} 
                />
                <YAxis 
                  stroke="#888888" 
                  fontSize={11} 
                  tickLine={false} 
                  axisLine={false} 
                  allowDecimals={false}
                  width={30}
                />
                <Tooltip 
                  formatter={(value: number) => [value, 'Viajes']}
                  labelFormatter={(label) => label}
                />
                <Line 
                  type="monotone"
                  dataKey="tripCount" 
                  name="Viajes"
                  stroke={COLORS.cc}
                  strokeWidth={2}
                  dot={{ fill: COLORS.cc, strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Historial Detallado</CardTitle>
          <CardDescription>Resumen por día</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {allSummaries.length > 0 ? (
            allSummaries.slice().reverse().slice(0, 14).map((summary) => (
              <div 
                key={summary.date} 
                className="flex justify-between items-center p-3 bg-muted/50 rounded-lg border"
                data-testid={`row-summary-${summary.date}`}
              >
                <div>
                  <div className="font-medium text-sm">
                    {format(parseISO(summary.date), "EEEE d 'de' MMMM", { locale: es })}
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {summary.tripCount} viajes • {summary.expenseCount} gastos
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-green-600 text-sm">
                    +${summary.totalIncome.toFixed(0)}
                  </div>
                  {summary.totalExpenses > 0 && (
                    <div className="text-xs text-red-500 font-medium">
                      -${summary.totalExpenses.toFixed(0)}
                    </div>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center text-muted-foreground py-8">
              No hay datos históricos aún.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
