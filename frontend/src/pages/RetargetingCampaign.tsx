import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Upload, Sparkles, Send, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import { RetargetingCampaign } from '@/types';

export default function RetargetingCampaignPage() {
  const { id } = useParams();
  const queryClient = useQueryClient();
  const [spreadsheetUrl, setSpreadsheetUrl] = useState('');
  const [showImport, setShowImport] = useState(false);

  const { data: campaign, isLoading } = useQuery({
    queryKey: ['campaign', id],
    queryFn: async () => {
      const response = await api.get(`/retargeting/${id}`);
      return response.data.campaign as RetargetingCampaign;
    }
  });

  const importMutation = useMutation({
    mutationFn: async (data: { spreadsheetUrl: string }) => {
      const response = await api.post(`/retargeting/${id}/import-audience`, data);
      return response.data;
    },
    onSuccess: (data) => {
      toast.success(`تم استيراد ${data.audienceCount} عميل`);
      queryClient.invalidateQueries({ queryKey: ['campaign', id] });
      setShowImport(false);
      setSpreadsheetUrl('');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'فشل الاستيراد');
    }
  });

  const generateMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post(`/retargeting/${id}/generate-messages`);
      return response.data;
    },
    onSuccess: () => {
      toast.success('تم توليد الرسالة بنجاح');
      queryClient.invalidateQueries({ queryKey: ['campaign', id] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'فشل توليد الرسالة');
    }
  });

  const launchMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post(`/retargeting/${id}/launch`);
      return response.data;
    },
    onSuccess: () => {
      toast.success('تم إطلاق الحملة بنجاح');
      queryClient.invalidateQueries({ queryKey: ['campaign', id] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'فشل إطلاق الحملة');
    }
  });

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
        <p className="text-gray-600 mt-4">جاري التحميل...</p>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">الحملة غير موجودة</p>
      </div>
    );
  }

  const handleImport = () => {
    if (!spreadsheetUrl) {
      toast.error('يرجى إدخال رابط Google Sheets');
      return;
    }

    importMutation.mutate({ spreadsheetUrl });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">{campaign.name}</h1>
        <p className="text-gray-600 mt-2">إدارة حملة إعادة الاستهداف</p>
      </div>

      {/* Import Modal */}
      {showImport && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold mb-4">استيراد الجمهور</h3>
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
                  يجب أن يحتوي الملف على أرقام هواتف العملاء السابقين
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

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card">
          <p className="text-sm text-gray-600 mb-1">الجمهور المستهدف</p>
          <p className="text-3xl font-bold text-gray-900">{campaign.targetAudience?.length || 0}</p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-600 mb-1">تم الإرسال</p>
          <p className="text-3xl font-bold text-blue-600">{campaign.sentCount}</p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-600 mb-1">تم التوصيل</p>
          <p className="text-3xl font-bold text-green-600">{campaign.deliveredCount}</p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-600 mb-1">معدل التحويل</p>
          <p className="text-3xl font-bold text-purple-600">
            {campaign.sentCount > 0
              ? Math.round((campaign.convertedCount / campaign.sentCount) * 100)
              : 0}
            %
          </p>
        </div>
      </div>

      {/* Product Info */}
      <div className="card">
        <h2 className="text-xl font-bold mb-4">معلومات المنتج</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600">اسم المنتج</p>
            <p className="font-medium text-lg">{campaign.productName}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">السعر</p>
            <p className="font-medium text-lg">{campaign.productPrice} درهم</p>
          </div>
          <div className="md:col-span-2">
            <p className="text-sm text-gray-600 mb-2">الوصف</p>
            <p className="text-gray-800">{campaign.productDescription}</p>
          </div>
        </div>
      </div>

      {/* AI Generated Message */}
      {campaign.aiGeneratedMessage && (
        <div className="card bg-gradient-to-br from-purple-50 to-blue-50">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-6 h-6 text-purple-600" />
            <h2 className="text-xl font-bold">الرسالة المولدة بالذكاء الاصطناعي</h2>
          </div>
          <div className="bg-white p-4 rounded-lg">
            <p className="text-gray-800 whitespace-pre-wrap">{campaign.aiGeneratedMessage}</p>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-wrap gap-4">
        {campaign.targetAudience?.length === 0 && (
          <button
            onClick={() => setShowImport(true)}
            className="btn btn-primary flex items-center gap-2"
          >
            <Upload className="w-5 h-5" />
            استيراد الجمهور
          </button>
        )}

        {campaign.targetAudience?.length > 0 && !campaign.aiGeneratedMessage && (
          <button
            onClick={() => generateMutation.mutate()}
            disabled={generateMutation.isPending}
            className="btn btn-primary flex items-center gap-2"
          >
            <Sparkles className="w-5 h-5" />
            {generateMutation.isPending ? 'جاري التوليد...' : 'توليد رسالة بالذكاء الاصطناعي'}
          </button>
        )}

        {campaign.targetAudience?.length > 0 &&
          campaign.aiGeneratedMessage &&
          campaign.status === 'draft' && (
            <button
              onClick={() => launchMutation.mutate()}
              disabled={launchMutation.isPending}
              className="btn btn-primary flex items-center gap-2"
            >
              <Send className="w-5 h-5" />
              {launchMutation.isPending ? 'جاري الإطلاق...' : 'إطلاق الحملة'}
            </button>
          )}
      </div>
    </div>
  );
}
