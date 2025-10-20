import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import socketService from '@/lib/socket';
import { MessageCircle, CheckCircle, XCircle, Loader } from 'lucide-react';
import { WhatsAppStatus } from '@/types';

export default function WhatsApp() {
  const [status, setStatus] = useState<WhatsAppStatus>({ status: 'pending' });

  const { data: statusData } = useQuery({
    queryKey: ['whatsapp-status'],
    queryFn: async () => {
      const response = await api.get('/whatsapp/status');
      return response.data as WhatsAppStatus;
    },
    refetchInterval: 5000
  });

  useEffect(() => {
    if (statusData) {
      setStatus(statusData);
    }
  }, [statusData]);

  useEffect(() => {
    const socket = socketService.getSocket();
    if (!socket) return;

    socket.on('whatsapp:qr', (data: { qrCode: string }) => {
      setStatus({ status: 'pending', qrCode: data.qrCode });
    });

    socket.on('whatsapp:ready', () => {
      setStatus({ status: 'ready' });
    });

    socket.on('whatsapp:disconnected', () => {
      setStatus({ status: 'disconnected' });
    });

    return () => {
      socket.off('whatsapp:qr');
      socket.off('whatsapp:ready');
      socket.off('whatsapp:disconnected');
    };
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">واتساب</h1>
        <p className="text-gray-600 mt-2">إدارة اتصال واتساب</p>
      </div>

      <div className="card max-w-2xl mx-auto">
        <div className="text-center">
          <div
            className={`inline-flex items-center justify-center w-20 h-20 rounded-full mb-6 ${
              status.status === 'ready'
                ? 'bg-green-100'
                : status.status === 'disconnected'
                ? 'bg-red-100'
                : 'bg-yellow-100'
            }`}
          >
            {status.status === 'ready' ? (
              <CheckCircle className="w-10 h-10 text-green-600" />
            ) : status.status === 'disconnected' ? (
              <XCircle className="w-10 h-10 text-red-600" />
            ) : (
              <Loader className="w-10 h-10 text-yellow-600 animate-spin" />
            )}
          </div>

          <h2 className="text-2xl font-bold mb-2">
            {status.status === 'ready'
              ? 'متصل بواتساب'
              : status.status === 'disconnected'
              ? 'غير متصل'
              : 'في انتظار المسح'}
          </h2>

          <p className="text-gray-600 mb-6">
            {status.status === 'ready'
              ? 'تطبيق واتساب متصل ويعمل بشكل صحيح'
              : status.status === 'disconnected'
              ? 'واتساب غير متصل، يرجى المحاولة مرة أخرى'
              : 'امسح رمز QR بواسطة تطبيق واتساب على هاتفك'}
          </p>

          {status.qrCode && (
            <div className="bg-white p-6 rounded-lg inline-block">
              <img src={status.qrCode} alt="WhatsApp QR Code" className="w-64 h-64" />
              <p className="text-sm text-gray-600 mt-4">
                1. افتح واتساب على هاتفك
                <br />
                2. اضغط على القائمة &gt; الأجهزة المرتبطة
                <br />
                3. امسح هذا الرمز
              </p>
            </div>
          )}

          {status.status === 'ready' && (
            <div className="mt-8 p-4 bg-green-50 rounded-lg">
              <div className="flex items-center justify-center gap-2 text-green-700">
                <MessageCircle className="w-5 h-5" />
                <p className="font-medium">يمكنك الآن إرسال الرسائل للعملاء</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Instructions */}
      <div className="card max-w-2xl mx-auto">
        <h3 className="text-xl font-bold mb-4">كيفية الاستخدام</h3>
        <div className="space-y-4 text-gray-700">
          <div className="flex gap-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold">
              1
            </div>
            <div>
              <p className="font-medium">المسح الأولي</p>
              <p className="text-sm text-gray-600">
                امسح رمز QR بواسطة واتساب على هاتفك لربط الحساب
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold">
              2
            </div>
            <div>
              <p className="font-medium">الإشعارات التلقائية</p>
              <p className="text-sm text-gray-600">
                سيتم إرسال إشعارات تلقائية للعملاء عند تغيير حالة طلباتهم
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold">
              3
            </div>
            <div>
              <p className="font-medium">حملات إعادة الاستهداف</p>
              <p className="text-sm text-gray-600">
                أطلق حملات تسويقية ذكية للعملاء السابقين
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
