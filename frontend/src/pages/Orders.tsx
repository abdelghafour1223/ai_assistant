import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import api from '@/lib/api';
import { Upload, Package, Eye } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import toast from 'react-hot-toast';
import { Order, OrderStatus } from '@/types';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import clsx from 'clsx';

export default function Orders() {
  const queryClient = useQueryClient();
  const [showImport, setShowImport] = useState(false);
  const [spreadsheetUrl, setSpreadsheetUrl] = useState('');

  const { data: ordersData, isLoading } = useQuery({
    queryKey: ['orders'],
    queryFn: async () => {
      const response = await api.get('/orders');
      return response.data;
    }
  });

  const importMutation = useMutation({
    mutationFn: async (data: { spreadsheetUrl: string }) => {
      const response = await api.post('/orders/import', data);
      return response.data;
    },
    onSuccess: (data) => {
      toast.success(`تم استيراد ${data.count} طلب بنجاح`);
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      setShowImport(false);
      setSpreadsheetUrl('');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'فشل الاستيراد');
    }
  });

  const handleImport = () => {
    if (!spreadsheetUrl) {
      toast.error('يرجى إدخال رابط Google Sheets');
      return;
    }

    importMutation.mutate({ spreadsheetUrl });
  };

  const getStatusBadge = (status: OrderStatus) => {
    const badges: Record<OrderStatus, string> = {
      [OrderStatus.PENDING]: 'badge-pending',
      [OrderStatus.CONFIRMED]: 'badge-confirmed',
      [OrderStatus.SHIPPED]: 'badge-shipped',
      [OrderStatus.IN_TRANSIT]: 'badge-confirmed',
      [OrderStatus.OUT_FOR_DELIVERY]: 'badge-shipped',
      [OrderStatus.DELIVERED]: 'badge-delivered',
      [OrderStatus.CANCELLED]: 'badge-cancelled',
      [OrderStatus.RETURNED]: 'badge-cancelled'
    };

    const labels: Record<OrderStatus, string> = {
      [OrderStatus.PENDING]: 'معلق',
      [OrderStatus.CONFIRMED]: 'مؤكد',
      [OrderStatus.SHIPPED]: 'تم الشحن',
      [OrderStatus.IN_TRANSIT]: 'في الطريق',
      [OrderStatus.OUT_FOR_DELIVERY]: 'خارج للتوصيل',
      [OrderStatus.DELIVERED]: 'تم التوصيل',
      [OrderStatus.CANCELLED]: 'ملغي',
      [OrderStatus.RETURNED]: 'مرتجع'
    };

    return <span className={clsx('badge', badges[status])}>{labels[status]}</span>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">الطلبات</h1>
          <p className="text-gray-600 mt-2">إدارة جميع الطلبات</p>
        </div>
        <button
          onClick={() => setShowImport(true)}
          className="btn btn-primary flex items-center gap-2"
        >
          <Upload className="w-5 h-5" />
          استيراد من Google Sheets
        </button>
      </div>

      {/* Import Modal */}
      {showImport && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold mb-4">استيراد الطلبات</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  رابط Google Sheets
                </label>
                <input
                  type="text"
                  value={spreadsheetUrl}
                  onChange={(e) => setSpreadsheetUrl(e.target.value)}
                  className="input"
                  placeholder="https://docs.google.com/spreadsheets/d/..."
                />
                <p className="text-xs text-gray-500 mt-2">
                  الأعمدة المطلوبة: الاسم، الهاتف، العنوان، المدينة، المنتج، السعر، الكمية، المجموع
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleImport}
                  disabled={importMutation.isPending}
                  className="btn btn-primary flex-1"
                >
                  {importMutation.isPending ? 'جاري الاستيراد...' : 'استيراد'}
                </button>
                <button
                  onClick={() => setShowImport(false)}
                  className="btn btn-secondary flex-1"
                >
                  إلغاء
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Orders Table */}
      <div className="card">
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
            <p className="text-gray-600 mt-4">جاري التحميل...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-right py-3 px-4">العميل</th>
                  <th className="text-right py-3 px-4">المنتج</th>
                  <th className="text-right py-3 px-4">المبلغ</th>
                  <th className="text-right py-3 px-4">الحالة</th>
                  <th className="text-right py-3 px-4">التاريخ</th>
                  <th className="text-right py-3 px-4">إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {ordersData?.orders?.map((order: Order) => {
                  const customer = typeof order.customerId === 'object' ? order.customerId : null;

                  return (
                    <tr key={order._id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-medium">{customer?.name || 'N/A'}</p>
                          <p className="text-sm text-gray-600">{customer?.phone || 'N/A'}</p>
                        </div>
                      </td>
                      <td className="py-3 px-4">{order.productName}</td>
                      <td className="py-3 px-4 font-medium">{order.totalAmount} درهم</td>
                      <td className="py-3 px-4">{getStatusBadge(order.status)}</td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {format(new Date(order.createdAt), 'dd MMM yyyy', { locale: ar })}
                      </td>
                      <td className="py-3 px-4">
                        <Link
                          to={`/orders/${order._id}`}
                          className="text-primary-600 hover:text-primary-700"
                        >
                          <Eye className="w-5 h-5" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {(!ordersData?.orders || ordersData.orders.length === 0) && (
              <div className="text-center py-12">
                <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600">لا توجد طلبات حالياً</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
