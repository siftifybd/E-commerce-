import React, { useState, useEffect, useRef, useMemo } from 'react';
import * as d3 from 'd3';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Receipt,
  PieChart as PieIcon,
  PlusCircle,
  Calendar,
  Download,
  Filter,
  Trash2,
  CheckCircle,
  ArrowUpRight,
  ArrowDownRight,
  Layers
} from 'lucide-react';
import { Order } from '../../types';

interface FinancialDashboardProps {
  orders: Order[];
}

interface ExpenseItem {
  id: string;
  title: string;
  amount: number;
  category: 'marketing' | 'sourcing' | 'shipping' | 'office' | 'utilities' | 'other';
  date: string;
  notes?: string;
}

type TimeRange = 'today' | '7days' | '30days' | 'this_month' | 'this_year' | 'all';

export const FinancialDashboard: React.FC<FinancialDashboardProps> = ({ orders }) => {
  const [timeRange, setTimeRange] = useState<TimeRange>('30days');
  const [expenses, setExpenses] = useState<ExpenseItem[]>(() => {
    const saved = localStorage.getItem('bdshops_admin_expenses');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse expenses:', e);
      }
    }
    // Default mock expenses for realistic financial visualization
    return [
      { id: 'exp-1', title: 'Facebook & Digital Ads', amount: 4500, category: 'marketing', date: new Date(Date.now() - 3 * 86400000).toISOString().split('T')[0], notes: 'Targeted Boost Campaigns' },
      { id: 'exp-2', title: 'Packaging & Bubble Wrap', amount: 2200, category: 'shipping', date: new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0], notes: 'Courier boxes & tape' },
      { id: 'exp-3', title: 'Warehouse Rent & Electricity', amount: 12000, category: 'office', date: new Date(Date.now() - 15 * 86400000).toISOString().split('T')[0], notes: 'Monthly rent' },
      { id: 'exp-4', title: 'Product Inventory Sourcing', amount: 35000, category: 'sourcing', date: new Date(Date.now() - 20 * 86400000).toISOString().split('T')[0], notes: 'Wholesale gadgets purchase' },
    ];
  });

  // New Expense Form State
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [newExpenseTitle, setNewExpenseTitle] = useState('');
  const [newExpenseAmount, setNewExpenseAmount] = useState('');
  const [newExpenseCategory, setNewExpenseCategory] = useState<ExpenseItem['category']>('marketing');
  const [newExpenseDate, setNewExpenseDate] = useState(new Date().toISOString().split('T')[0]);
  const [newExpenseNotes, setNewExpenseNotes] = useState('');

  // Refs for D3 Chart containers
  const lineChartRef = useRef<SVGSVGElement | null>(null);
  const profitBarChartRef = useRef<SVGSVGElement | null>(null);
  const pieChartRef = useRef<SVGSVGElement | null>(null);

  // Save expenses to localStorage
  useEffect(() => {
    localStorage.setItem('bdshops_admin_expenses', JSON.stringify(expenses));
  }, [expenses]);

  // Filter orders and expenses based on selected time range
  const { filteredOrders, filteredExpenses, startDateLimit } = useMemo(() => {
    const now = new Date();
    let limit = new Date(0); // 'all'

    if (timeRange === 'today') {
      limit = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    } else if (timeRange === '7days') {
      limit = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else if (timeRange === '30days') {
      limit = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    } else if (timeRange === 'this_month') {
      limit = new Date(now.getFullYear(), now.getMonth(), 1);
    } else if (timeRange === 'this_year') {
      limit = new Date(now.getFullYear(), 0, 1);
    }

    const validOrders = orders.filter((o) => {
      const orderDate = new Date(o.createdAt);
      return orderDate >= limit && o.orderStatus !== 'cancelled';
    });

    const validExpenses = expenses.filter((e) => {
      const expDate = new Date(e.date);
      return expDate >= limit;
    });

    return { filteredOrders: validOrders, filteredExpenses: validExpenses, startDateLimit: limit };
  }, [orders, expenses, timeRange]);

  // Calculate Financial Metrics
  const financialSummary = useMemo(() => {
    const totalSales = filteredOrders.reduce((sum, o) => sum + (o.grandTotal || o.total || 0), 0);
    const totalDeliveryChargesCollected = filteredOrders.reduce((sum, o) => sum + (o.deliveryCharge || 0), 0);
    
    // Total expenses = manual operational expenses + estimated courier/delivery cost
    const manualExpensesTotal = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
    // Estimated delivery expense paid to courier
    const courierExpenseTotal = totalDeliveryChargesCollected * 0.9; 
    const totalExpenses = manualExpensesTotal + courierExpenseTotal;

    const netProfit = totalSales - totalExpenses;
    const profitMargin = totalSales > 0 ? (netProfit / totalSales) * 100 : 0;
    const totalOrdersCount = filteredOrders.length;
    const averageOrderValue = totalOrdersCount > 0 ? totalSales / totalOrdersCount : 0;

    return {
      totalSales,
      totalExpenses,
      manualExpensesTotal,
      courierExpenseTotal,
      netProfit,
      profitMargin,
      totalOrdersCount,
      averageOrderValue,
    };
  }, [filteredOrders, filteredExpenses]);

  // Handle Adding Expense
  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExpenseTitle.trim() || !newExpenseAmount || Number(newExpenseAmount) <= 0) return;

    const newExp: ExpenseItem = {
      id: `exp-${Date.now()}`,
      title: newExpenseTitle.trim(),
      amount: Number(newExpenseAmount),
      category: newExpenseCategory,
      date: newExpenseDate,
      notes: newExpenseNotes.trim() || undefined,
    };

    setExpenses([newExp, ...expenses]);
    setNewExpenseTitle('');
    setNewExpenseAmount('');
    setNewExpenseNotes('');
    setShowAddExpense(false);
  };

  const handleDeleteExpense = (id: string) => {
    setExpenses(expenses.filter((e) => e.id !== id));
  };

  // Group daily data for D3 Line/Area Chart & Profit Bar Chart
  const dailyData = useMemo(() => {
    const map = new Map<string, { dateStr: string; dateObj: Date; sales: number; expenses: number; profit: number }>();

    // Generate daily ticks between startDateLimit and now
    const end = new Date();
    const start = startDateLimit.getTime() === 0 ? new Date(end.getTime() - 30 * 86400000) : new Date(startDateLimit);
    
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      map.set(dateStr, {
        dateStr,
        dateObj: new Date(d),
        sales: 0,
        expenses: 0,
        profit: 0,
      });
    }

    filteredOrders.forEach((o) => {
      const dStr = new Date(o.createdAt).toISOString().split('T')[0];
      if (map.has(dStr)) {
        const item = map.get(dStr)!;
        item.sales += (o.grandTotal || o.total || 0);
        item.expenses += (o.deliveryCharge || 0) * 0.9;
      }
    });

    filteredExpenses.forEach((e) => {
      const dStr = e.date;
      if (map.has(dStr)) {
        const item = map.get(dStr)!;
        item.expenses += e.amount;
      }
    });

    map.forEach((val) => {
      val.profit = val.sales - val.expenses;
    });

    return Array.from(map.values()).sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime());
  }, [filteredOrders, filteredExpenses, startDateLimit]);

  // Render D3 Sales vs Expenses Area Chart
  useEffect(() => {
    if (!lineChartRef.current || dailyData.length === 0) return;

    const svg = d3.select(lineChartRef.current);
    svg.selectAll('*').remove();

    const width = lineChartRef.current.clientWidth || 600;
    const height = 300;
    const margin = { top: 20, right: 30, bottom: 40, left: 50 };

    svg.attr('viewBox', `0 0 ${width} ${height}`);

    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const g = svg
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Scales
    const xScale = d3
      .scaleTime()
      .domain(d3.extent(dailyData, (d) => d.dateObj) as [Date, Date])
      .range([0, innerWidth]);

    const maxVal = d3.max(dailyData, (d) => Math.max(d.sales, d.expenses)) || 1000;
    const yScale = d3
      .scaleLinear()
      .domain([0, maxVal * 1.1])
      .range([innerHeight, 0]);

    // Gradients
    const defs = svg.append('defs');
    
    const salesGradient = defs.append('linearGradient')
      .attr('id', 'sales-gradient')
      .attr('x1', '0%').attr('y1', '0%')
      .attr('x2', '0%').attr('y2', '100%');
    salesGradient.append('stop').attr('offset', '0%').attr('stop-color', '#00BFA5').attr('stop-opacity', 0.4);
    salesGradient.append('stop').attr('offset', '100%').attr('stop-color', '#00BFA5').attr('stop-opacity', 0.0);

    const expGradient = defs.append('linearGradient')
      .attr('id', 'exp-gradient')
      .attr('x1', '0%').attr('y1', '0%')
      .attr('x2', '0%').attr('y2', '100%');
    expGradient.append('stop').attr('offset', '0%').attr('stop-color', '#EF4444').attr('stop-opacity', 0.3);
    expGradient.append('stop').attr('offset', '100%').attr('stop-color', '#EF4444').attr('stop-opacity', 0.0);

    // Gridlines
    const yGrid = d3.axisLeft(yScale).tickSize(-innerWidth).tickFormat(() => '');
    g.append('g')
      .attr('class', 'grid')
      .call(yGrid as any)
      .selectAll('line')
      .attr('stroke', '#E2E8F0')
      .attr('stroke-dasharray', '3,3');

    // Area Generators
    const salesArea = d3
      .area<typeof dailyData[0]>()
      .x((d) => xScale(d.dateObj))
      .y0(innerHeight)
      .y1((d) => yScale(d.sales))
      .curve(d3.curveMonotoneX);

    const expArea = d3
      .area<typeof dailyData[0]>()
      .x((d) => xScale(d.dateObj))
      .y0(innerHeight)
      .y1((d) => yScale(d.expenses))
      .curve(d3.curveMonotoneX);

    // Line Generators
    const salesLine = d3
      .line<typeof dailyData[0]>()
      .x((d) => xScale(d.dateObj))
      .y((d) => yScale(d.sales))
      .curve(d3.curveMonotoneX);

    const expLine = d3
      .line<typeof dailyData[0]>()
      .x((d) => xScale(d.dateObj))
      .y((d) => yScale(d.expenses))
      .curve(d3.curveMonotoneX);

    // Append Area paths
    g.append('path')
      .datum(dailyData)
      .attr('fill', 'url(#sales-gradient)')
      .attr('d', salesArea);

    g.append('path')
      .datum(dailyData)
      .attr('fill', 'url(#exp-gradient)')
      .attr('d', expArea);

    // Append Line paths
    g.append('path')
      .datum(dailyData)
      .attr('fill', 'none')
      .attr('stroke', '#00BFA5')
      .attr('stroke-width', 3)
      .attr('d', salesLine);

    g.append('path')
      .datum(dailyData)
      .attr('fill', 'none')
      .attr('stroke', '#EF4444')
      .attr('stroke-width', 2)
      .attr('stroke-dasharray', '4,4')
      .attr('d', expLine);

    // Axes
    const xAxis = d3.axisBottom(xScale).ticks(5).tickFormat(d3.timeFormat('%b %d') as any);
    const yAxis = d3.axisLeft(yScale).ticks(5).tickFormat((d) => `৳${d}`);

    g.append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(xAxis as any)
      .selectAll('text')
      .style('font-size', '11px')
      .style('fill', '#64748B');

    g.append('g')
      .call(yAxis as any)
      .selectAll('text')
      .style('font-size', '11px')
      .style('fill', '#64748B');

  }, [dailyData]);

  // Render D3 Net Profit Bar Chart
  useEffect(() => {
    if (!profitBarChartRef.current || dailyData.length === 0) return;

    const svg = d3.select(profitBarChartRef.current);
    svg.selectAll('*').remove();

    const width = profitBarChartRef.current.clientWidth || 600;
    const height = 250;
    const margin = { top: 20, right: 30, bottom: 40, left: 50 };

    svg.attr('viewBox', `0 0 ${width} ${height}`);

    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const g = svg
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const xScale = d3
      .scaleBand()
      .domain(dailyData.map((d) => d.dateStr))
      .range([0, innerWidth])
      .padding(0.3);

    const minProfit = d3.min(dailyData, (d) => d.profit) || 0;
    const maxProfit = d3.max(dailyData, (d) => d.profit) || 1000;

    const yScale = d3
      .scaleLinear()
      .domain([Math.min(0, minProfit), Math.max(100, maxProfit)])
      .range([innerHeight, 0]);

    const zeroY = yScale(0);

    // Bars
    g.selectAll('.bar')
      .data(dailyData)
      .enter()
      .append('rect')
      .attr('class', 'bar')
      .attr('x', (d) => xScale(d.dateStr) || 0)
      .attr('width', xScale.bandwidth())
      .attr('y', (d) => (d.profit >= 0 ? yScale(d.profit) : zeroY))
      .attr('height', (d) => Math.abs(yScale(d.profit) - zeroY))
      .attr('fill', (d) => (d.profit >= 0 ? '#10B981' : '#F43F5E'))
      .attr('rx', 3);

    // Zero Axis Line
    g.append('line')
      .attr('x1', 0)
      .attr('x2', innerWidth)
      .attr('y1', zeroY)
      .attr('y2', zeroY)
      .attr('stroke', '#94A3B8')
      .attr('stroke-width', 1.5);

    // Axes
    const xAxis = d3.axisBottom(xScale).tickValues(
      xScale.domain().filter((_, i) => i % Math.max(1, Math.floor(dailyData.length / 6)) === 0)
    );
    const yAxis = d3.axisLeft(yScale).ticks(4).tickFormat((d) => `৳${d}`);

    g.append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(xAxis as any)
      .selectAll('text')
      .style('font-size', '10px')
      .style('fill', '#64748B');

    g.append('g')
      .call(yAxis as any)
      .selectAll('text')
      .style('font-size', '10px')
      .style('fill', '#64748B');

  }, [dailyData]);

  // Render D3 Expense Breakdown Pie/Donut Chart
  useEffect(() => {
    if (!pieChartRef.current) return;

    const svg = d3.select(pieChartRef.current);
    svg.selectAll('*').remove();

    const categoryTotals: Record<string, number> = {
      marketing: 0,
      sourcing: 0,
      shipping: financialSummary.courierExpenseTotal,
      office: 0,
      utilities: 0,
      other: 0,
    };

    filteredExpenses.forEach((e) => {
      categoryTotals[e.category] = (categoryTotals[e.category] || 0) + e.amount;
    });

    const pieData = Object.entries(categoryTotals)
      .filter(([_, val]) => val > 0)
      .map(([cat, val]) => ({ category: cat, value: val }));

    if (pieData.length === 0) return;

    const width = pieChartRef.current.clientWidth || 300;
    const height = 220;
    const radius = Math.min(width, height) / 2 - 20;

    svg.attr('viewBox', `0 0 ${width} ${height}`);

    const g = svg
      .append('g')
      .attr('transform', `translate(${width / 2},${height / 2})`);

    const color = d3
      .scaleOrdinal<string>()
      .domain(['marketing', 'sourcing', 'shipping', 'office', 'utilities', 'other'])
      .range(['#3B82F6', '#8B5CF6', '#F59E0B', '#10B981', '#EC4899', '#64748B']);

    const pie = d3.pie<{ category: string; value: number }>().value((d) => d.value);
    const arc = d3.arc<d3.PieArcDatum<{ category: string; value: number }>>()
      .innerRadius(radius * 0.55)
      .outerRadius(radius);

    const arcs = g.selectAll('.arc')
      .data(pie(pieData))
      .enter()
      .append('g')
      .attr('class', 'arc');

    arcs.append('path')
      .attr('d', arc as any)
      .attr('fill', (d) => color(d.data.category))
      .attr('stroke', '#FFFFFF')
      .attr('stroke-width', 2);

  }, [filteredExpenses, financialSummary]);

  return (
    <div className="space-y-6">
      {/* Top Header & Time Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <DollarSign className="w-6 h-6 text-[#00BFA5]" />
            <span>Financial Summary & Profit Analytics</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            D3.js চালিত রিয়েল-টাইম আয়-ব্যয় হিসাব ও লাভের বিশ্লেষণ
          </p>
        </div>

        {/* Time Range Selector */}
        <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-xl border border-slate-200 self-start sm:self-auto overflow-x-auto">
          {[
            { id: 'today', label: 'আজ' },
            { id: '7days', label: '৭ দিন' },
            { id: '30days', label: '৩০ দিন' },
            { id: 'this_month', label: 'এই মাস' },
            { id: 'this_year', label: 'এই বছর' },
            { id: 'all', label: 'সব সময়' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setTimeRange(item.id as TimeRange)}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                timeRange === item.id
                  ? 'bg-[#00BFA5] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Summary KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Sales */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">মোট বিক্রি (Sales)</span>
            <h3 className="text-2xl font-black text-slate-900 mt-1">
              ৳{financialSummary.totalSales.toLocaleString('bn-BD')}
            </h3>
            <span className="text-[11px] font-medium text-teal-600 flex items-center gap-1 mt-1">
              <ArrowUpRight className="w-3.5 h-3.5" />
              {financialSummary.totalOrdersCount} টি সফল অর্ডার
            </span>
          </div>
          <div className="w-12 h-12 bg-teal-50 text-[#00BFA5] rounded-2xl flex items-center justify-center shrink-0">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        {/* Total Expenses */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">মোট খরচ (Expenses)</span>
            <h3 className="text-2xl font-black text-rose-600 mt-1">
              ৳{financialSummary.totalExpenses.toLocaleString('bn-BD')}
            </h3>
            <span className="text-[11px] font-medium text-slate-500 mt-1 block">
              কুরিয়ার: ৳{Math.round(financialSummary.courierExpenseTotal).toLocaleString()} | অন্যান্য: ৳{financialSummary.manualExpensesTotal.toLocaleString()}
            </span>
          </div>
          <div className="w-12 h-12 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center shrink-0">
            <Receipt className="w-6 h-6" />
          </div>
        </div>

        {/* Net Profit */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">নিট লাভ (Net Profit)</span>
            <h3 className={`text-2xl font-black mt-1 ${financialSummary.netProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
              ৳{financialSummary.netProfit.toLocaleString('bn-BD')}
            </h3>
            <span className={`text-[11px] font-bold flex items-center gap-1 mt-1 ${financialSummary.netProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
              {financialSummary.netProfit >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
              প্রফিট মার্জিন: {financialSummary.profitMargin.toFixed(1)}%
            </span>
          </div>
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${financialSummary.netProfit >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        {/* Average Order Value (AOV) */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">গড় অর্ডার মূল্য (AOV)</span>
            <h3 className="text-2xl font-black text-slate-900 mt-1">
              ৳{Math.round(financialSummary.averageOrderValue).toLocaleString('bn-BD')}
            </h3>
            <span className="text-[11px] font-medium text-slate-500 mt-1 block">
              প্রতি অর্ডারে গড় আয়
            </span>
          </div>
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shrink-0">
            <Layers className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Main D3 Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales vs Expenses Trend (D3 Area Line Chart) */}
        <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">বিক্রি বনাম খরচের প্রবণতা (Sales vs Expenses)</h3>
              <p className="text-xs text-slate-500">D3.js এরিয়া লাইনের মাধ্যমে দৈনিক তুলনা</p>
            </div>
            <div className="flex items-center gap-4 text-xs font-bold">
              <span className="flex items-center gap-1.5 text-[#00BFA5]">
                <span className="w-3 h-3 rounded-full bg-[#00BFA5]"></span> বিক্রি (Sales)
              </span>
              <span className="flex items-center gap-1.5 text-rose-500">
                <span className="w-3 h-3 rounded-full bg-rose-500"></span> খরচ (Expenses)
              </span>
            </div>
          </div>

          <div className="w-full overflow-x-auto">
            <svg ref={lineChartRef} className="w-full h-[300px]"></svg>
          </div>
        </div>

        {/* Expense Category Breakdown (D3 Donut Chart) */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <PieIcon className="w-5 h-5 text-amber-500" />
              <span>খরচের খাতসমূহ (Expense Breakdown)</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">ক্যাটাগরি ভিত্তিক খরচের বণ্টন</p>
          </div>

          <div className="w-full overflow-hidden my-2 flex justify-center">
            <svg ref={pieChartRef} className="w-full max-w-[280px] h-[220px]"></svg>
          </div>

          <div className="space-y-2 text-xs font-medium border-t border-slate-100 pt-3">
            <div className="flex justify-between text-slate-600">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>কুরিয়ার ও ডেলিভারি:</span>
              <span className="font-bold text-slate-900">৳{Math.round(financialSummary.courierExpenseTotal).toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>মার্কেটিং ও বিজ্ঞাপন:</span>
              <span className="font-bold text-slate-900">
                ৳{filteredExpenses.filter(e => e.category === 'marketing').reduce((sum, e) => sum + e.amount, 0).toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span>পণ্য ক্রয়/সোর্সিং:</span>
              <span className="font-bold text-slate-900">
                ৳{filteredExpenses.filter(e => e.category === 'sourcing').reduce((sum, e) => sum + e.amount, 0).toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Net Profit Bar Chart & Expense Manager */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Net Profit Bar Chart (D3.js) */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="mb-4">
            <h3 className="text-base font-bold text-slate-900">দৈনিক নিট লাভ বার-চার্ট (Net Profit Trend)</h3>
            <p className="text-xs text-slate-500">সবুজ বার = লাভ, লাল বার = লোকসান</p>
          </div>
          <div className="w-full overflow-x-auto">
            <svg ref={profitBarChartRef} className="w-full h-[250px]"></svg>
          </div>
        </div>

        {/* Expense Management Table & Add Button */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">স্টোর খরচ ট্র্যাকার (Expense Manager)</h3>
                <p className="text-xs text-slate-500">অতিরিক্ত শপ বা এডমিন খরচ যোগ করুন</p>
              </div>
              <button
                onClick={() => setShowAddExpense(!showAddExpense)}
                className="px-3 py-2 bg-[#00BFA5] hover:bg-[#00A892] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" />
                <span>নতুন খরচ যোগ</span>
              </button>
            </div>

            {/* Add Expense Form */}
            {showAddExpense && (
              <form onSubmit={handleAddExpense} className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3 mb-4 animate-in fade-in duration-300">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">খরচের বিবরণ</label>
                    <input
                      type="text"
                      placeholder="যেমন: ফেইসবুক বুস্টিং"
                      value={newExpenseTitle}
                      onChange={(e) => setNewExpenseTitle(e.target.value)}
                      required
                      className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-[#00BFA5] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">টাকার পরিমাণ (৳)</label>
                    <input
                      type="number"
                      placeholder="5000"
                      value={newExpenseAmount}
                      onChange={(e) => setNewExpenseAmount(e.target.value)}
                      required
                      className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-[#00BFA5] focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">ক্যাটাগরি</label>
                    <select
                      value={newExpenseCategory}
                      onChange={(e) => setNewExpenseCategory(e.target.value as any)}
                      className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-[#00BFA5] focus:outline-none"
                    >
                      <option value="marketing">মার্কেটিং ও এডস</option>
                      <option value="sourcing">পণ্য কেনা / সোর্সিং</option>
                      <option value="shipping">প্যাকেজিং ও শিপিং</option>
                      <option value="office">অফিস / গুদাম ভাড়া</option>
                      <option value="utilities">বিদ্যুৎ ও ইউটিলিটি</option>
                      <option value="other">অন্যান্য</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">তারিখ</label>
                    <input
                      type="date"
                      value={newExpenseDate}
                      onChange={(e) => setNewExpenseDate(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-[#00BFA5] focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowAddExpense(false)}
                    className="px-3 py-1.5 bg-slate-200 text-slate-700 text-xs font-bold rounded-lg cursor-pointer"
                  >
                    বাতিল
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-[#00BFA5] text-white text-xs font-bold rounded-lg cursor-pointer"
                  >
                    সেভ করুন
                  </button>
                </div>
              </form>
            )}

            {/* Expenses List Table */}
            <div className="max-h-[220px] overflow-y-auto space-y-2 pr-1">
              {filteredExpenses.length === 0 ? (
                <p className="text-xs text-slate-400 py-6 text-center">কোনো কাস্টম খরচ এন্ট্রি নেই</p>
              ) : (
                filteredExpenses.map((exp) => (
                  <div key={exp.id} className="p-3 bg-slate-50 hover:bg-slate-100 rounded-xl flex items-center justify-between text-xs transition-colors border border-slate-100">
                    <div>
                      <h4 className="font-bold text-slate-900">{exp.title}</h4>
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        {exp.category} • {exp.date}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-rose-600">৳{exp.amount.toLocaleString('bn-BD')}</span>
                      <button
                        onClick={() => handleDeleteExpense(exp.id)}
                        className="text-slate-400 hover:text-rose-500 transition-colors p-1"
                        title="ডিলিট করুন"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
