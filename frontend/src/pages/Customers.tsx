import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Upload, Users, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import { Customer } from '@/types';

export default function Customers() {
  const queryClient = useQueryClient();
  const [showImport, setShowImport] = useState(false);
  const [spreadsheetUrl, setSpreadsheetUrl] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const { data: customersData, isLoading } = useQuery({
    queryKey: ['customers', searchTerm],
    queryFn: async () => {
      const response = await api.get('/customers', {
        params: { search: searchTerm || undefined }
      });
      return response.data;
    }
  });

  const importMutation = useMutation({
    mutationFn: async (data: { spreadsheetUrl: string }) => {
      const response = await api.post('/customers/import', data);
      return response.data;
    },
    onSuccess: (data) => {
      toast.success(`تم إنشاء ${data.results.created} عميل وتحديث ${data.results.updated} عميل`);
      queryClient.invalidateQueries({ queryKey: ['customers'] });
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">العملاء</h1>
          <p className="text-gray-600 mt-2">إدارة قاعدة بيانات العملاء</p>
        </div>
        <button
          onClick={() => setShowImport(true)}
          className="btn btn-primary flex items-center gap-2"
        >
          <Upload className="w-5 h-5" />
          استيراد من Google Sheets
        </button>
      </div>

      {/* Search */}
      <div className="card">
        <div className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="ابحث عن عميل..."
            className="input pr-10"
          />
        </div>
      </div>

      {/* Import Modal */}
      {showImport && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold mb-4">استيراد العملاء</h3>
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
                  الأعمدة المطلوبة: الاسم، الهاتف، العنوان، المدينة، البريد الإلكتروني، العلامات
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

      {/* Customers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          <div className="col-span-full text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
            <p className="text-gray-600 mt-4">جاري التحميل...</p>
          </div>
        ) : customersData?.customers?.length > 0 ? (
          customersData.customers.map((customer: Customer) => (
            <div key={customer._id} className="card hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center">
                    <Users className="w-6 h-6 text-primary-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">{customer.name}</h3>
                    <p className="text-sm text-gray-600" dir="ltr">{customer.phone}</p>
                  </div>
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">المدينة:</span>
                  <span className="font-medium">{customer.city}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">الطلبات:</span>
                  <span className="font-medium">{customer.previousOrders?.length || 0}</span>
                </div>
                {customer.tags && customer.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {customer.tags.map((tag, index) => (
                      <span key={index} className="badge bg-gray-100 text-gray-700 text-xs">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full text-center py-12">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600">لا يوجد عملاء</p>
          </div>
        )}
      </div>
    </div>
  );
}
