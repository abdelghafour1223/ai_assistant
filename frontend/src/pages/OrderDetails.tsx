import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import socketService from '@/lib/socket';
import { Truck, MapPin, Clock, Package } from 'lucide-react';
import toast from 'react-hot-toast';
import { Order, OrderStatus } from '@/types';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

export default function OrderDetails() {
  const { id } = useParams();
  const queryClient = useQueryClient();

  const { data: orderData, isLoading } = useQuery({
    queryKey: ['order', id],
    queryFn: async () => {
      const response = await api.get(`/orders/${id}`);
      return response.data.order as Order;
    }
  });

  const shipMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post(`/orders/${id}/ship`);
      return response.data;
    },
    onSuccess: () => {
      toast.success('تم شحن الطلب بنجاح');
      queryClient.invalidateQueries({ queryKey: ['order', id] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'فشل شحن الطلب');
    }
  });

  useEffect(() => {
    const socket = socketService.getSocket();
    if (!socket || !id) return;

    socket.emit('order:subscribe', id);

    socket.on('order:update', (data: { order: Order }) => {
      queryClient.setQueryData(['order', id], data.order);
      toast.success('تم تحديث حالة الطلب');
    });

    return () => {
      socket.emit('order:unsubscribe', id);
      socket.off('order:update');
    };
  }, [id, queryClient]);

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
        <p className="text-gray-600 mt-4">جاري التحميل...</p>
      </div>
    );
  }

  if (!orderData) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">الطلب غير موجود</p>
      </div>
    );
  }

  const customer = typeof orderData.customerId === 'object' ? orderData.customerId : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">تفاصيل الطلب</h1>
          <p className="text-gray-600 mt-2">رقم الطلب: {orderData._id}</p>
        </div>
        {orderData.status === OrderStatus.CONFIRMED && (
          <button
            onClick={() => shipMutation.mutate()}
            disabled={shipMutation.isPending}
            className="btn btn-primary flex items-center gap-2"
          >
            <Truck className="w-5 h-5" />
            {shipMutation.isPending ? 'جاري الشحن...' : 'شحن الطلب'}
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Order Info */}
        <div className="card">
          <h2 className="text-xl font-bold mb-4">معلومات الطلب</h2>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">المنتج:</span>
              <span className="font-medium">{orderData.productName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">السعر:</span>
              <span className="font-medium">{orderData.productPrice} درهم</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">الكمية:</span>
              <span className="font-medium">{orderData.quantity}</span>
            </div>
            <div className="flex justify-between border-t pt-3">
              <span className="text-gray-600 font-medium">المجموع:</span>
              <span className="font-bold text-lg">{orderData.totalAmount} درهم</span>
            </div>
            {orderData.trackingNumber && (
              <div className="flex justify-between">
                <span className="text-gray-600">رقم التتبع:</span>
                <span className="font-medium">{orderData.trackingNumber}</span>
              </div>
            )}
          </div>
        </div>

        {/* Customer Info */}
        <div className="card">
          <h2 className="text-xl font-bold mb-4">معلومات العميل</h2>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">الاسم:</span>
              <span className="font-medium">{customer?.name || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">الهاتف:</span>
              <span className="font-medium" dir="ltr">{customer?.phone || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">المدينة:</span>
              <span className="font-medium">{customer?.city || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">العنوان:</span>
              <span className="font-medium text-left">{customer?.address || 'N/A'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Status History */}
      <div className="card">
        <h2 className="text-xl font-bold mb-4">تاريخ الحالة</h2>
        <div className="space-y-4">
          {orderData.statusHistory.map((status, index) => (
            <div key={index} className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                  <Package className="w-5 h-5 text-primary-600" />
                </div>
                {index !== orderData.statusHistory.length - 1 && (
                  <div className="w-0.5 h-full bg-gray-200 mt-2"></div>
                )}
              </div>
              <div className="flex-1 pb-4">
                <div className="flex items-center justify-between">
                  <p className="font-medium">{status.message}</p>
                  <p className="text-sm text-gray-600">
                    {format(new Date(status.timestamp), 'dd MMM yyyy HH:mm', { locale: ar })}
                  </p>
                </div>
                {status.location && (
                  <p className="text-sm text-gray-600 mt-1 flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    {status.location}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
