import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { Package, Users, MessageCircle, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function Dashboard() {
  const { data: stats } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const [ordersRes, customersRes] = await Promise.all([
        api.get('/orders?limit=100'),
        api.get('/customers?limit=100')
      ]);

      const orders = ordersRes.data.orders || [];
      const customers = customersRes.data.customers || [];

      const statusCounts = orders.reduce((acc: any, order: any) => {
        acc[order.status] = (acc[order.status] || 0) + 1;
        return acc;
      }, {});

      const chartData = [
        { name: 'معلق', value: statusCounts.pending || 0 },
        { name: 'مؤكد', value: statusCounts.confirmed || 0 },
        { name: 'تم الشحن', value: statusCounts.shipped || 0 },
        { name: 'في الطريق', value: statusCounts.in_transit || 0 },
        { name: 'تم التوصيل', value: statusCounts.delivered || 0 }
      ];

      return {
        totalOrders: orders.length,
        totalCustomers: customers.length,
        pendingOrders: statusCounts.pending || 0,
        deliveredOrders: statusCounts.delivered || 0,
        chartData
      };
    }
  });

  const cards = [
    {
      title: 'إجمالي الطلبات',
      value: stats?.totalOrders || 0,
      icon: Package,
      color: 'bg-blue-500'
    },
    {
      title: 'إجمالي العملاء',
      value: stats?.totalCustomers || 0,
      icon: Users,
      color: 'bg-green-500'
    },
    {
      title: 'طلبات معلقة',
      value: stats?.pendingOrders || 0,
      icon: MessageCircle,
      color: 'bg-yellow-500'
    },
    {
      title: 'تم التوصيل',
      value: stats?.deliveredOrders || 0,
      icon: TrendingUp,
      color: 'bg-purple-500'
    }
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">لوحة التحكم</h1>
        <p className="text-gray-600 mt-2">نظرة عامة على نظام إدارة التوصيل</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.title} className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">{card.title}</p>
                  <p className="text-3xl font-bold text-gray-900">{card.value}</p>
                </div>
                <div className={`${card.color} p-3 rounded-lg`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Chart */}
      <div className="card">
        <h2 className="text-xl font-bold text-gray-900 mb-6">حالة الطلبات</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={stats?.chartData || []}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="value" fill="#16a34a" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
