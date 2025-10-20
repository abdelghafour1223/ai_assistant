import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import api from '@/lib/api';
import { Plus, Target, TrendingUp, Users, Send } from 'lucide-react';
import toast from 'react-hot-toast';
import { RetargetingCampaign } from '@/types';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

export default function Retargeting() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    productName: '',
    productDescription: '',
    productPrice: ''
  });

  const { data: campaignsData, isLoading } = useQuery({
    queryKey: ['campaigns'],
    queryFn: async () => {
      const response = await api.get('/retargeting');
      return response.data;
    }
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await api.post('/retargeting', data);
      return response.data;
    },
    onSuccess: (data) => {
      toast.success('تم إنشاء الحملة بنجاح');
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      setShowCreate(false);
      setFormData({ name: '', productName: '', productDescription: '', productPrice: '' });
      navigate(`/retargeting/${data.campaign._id}`);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'فشل إنشاء الحملة');
    }
  });

  const handleCreate = () => {
    if (!formData.name || !formData.productName || !formData.productPrice) {
      toast.error('يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    createMutation.mutate({
      ...formData,
      productPrice: parseFloat(formData.productPrice)
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">إعادة الاستهداف</h1>
          <p className="text-gray-600 mt-2">إدارة حملات التسويق الذكية</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="btn btn-primary flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          حملة جديدة
        </button>
      </div>

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold mb-4">إنشاء حملة جديدة</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  اسم الحملة *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input"
                  placeholder="مثال: حملة منتج جديد"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  اسم المنتج *
                </label>
                <input
                  type="text"
                  value={formData.productName}
                  onChange={(e) => setFormData({ ...formData, productName: e.target.value })}
                  className="input"
                  placeholder="مثال: ساعة ذكية"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  وصف المنتج
                </label>
                <textarea
                  value={formData.productDescription}
                  onChange={(e) => setFormData({ ...formData, productDescription: e.target.value })}
                  className="input"
                  rows={3}
                  placeholder="وصف مختصر للمنتج..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  السعر (درهم) *
                </label>
                <input
                  type="number"
                  value={formData.productPrice}
                  onChange={(e) => setFormData({ ...formData, productPrice: e.target.value })}
                  className="input"
                  placeholder="299"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleCreate}
                  disabled={createMutation.isPending}
                  className="btn btn-primary flex-1"
                >
                  {createMutation.isPending ? 'جاري الإنشاء...' : 'إنشاء'}
                </button>
                <button
                  onClick={() => setShowCreate(false)}
                  className="btn btn-secondary flex-1"
                >
                  إلغاء
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Campaigns Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          <div className="col-span-full text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
            <p className="text-gray-600 mt-4">جاري التحميل...</p>
          </div>
        ) : campaignsData?.campaigns?.length > 0 ? (
          campaignsData.campaigns.map((campaign: RetargetingCampaign) => (
            <Link key={campaign._id} to={`/retargeting/${campaign._id}`}>
              <div className="card hover:shadow-lg transition-shadow h-full">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
                      <Target className="w-6 h-6 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">{campaign.name}</h3>
                      <p className="text-sm text-gray-600">{campaign.productName}</p>
                    </div>
                  </div>
                  <span
                    className={`badge ${
                      campaign.status === 'active'
                        ? 'badge-confirmed'
                        : campaign.status === 'completed'
                        ? 'badge-delivered'
                        : 'badge-pending'
                    }`}
                  >
                    {campaign.status === 'active'
                      ? 'نشط'
                      : campaign.status === 'completed'
                      ? 'مكتمل'
                      : campaign.status === 'paused'
                      ? 'متوقف'
                      : 'مسودة'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <Users className="w-5 h-5 text-blue-600 mx-auto mb-1" />
                    <p className="text-2xl font-bold text-blue-600">
                      {campaign.targetAudience?.length || 0}
                    </p>
                    <p className="text-xs text-gray-600">الجمهور</p>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <Send className="w-5 h-5 text-green-600 mx-auto mb-1" />
                    <p className="text-2xl font-bold text-green-600">{campaign.sentCount}</p>
                    <p className="text-xs text-gray-600">تم الإرسال</p>
                  </div>
                </div>

                <div className="text-sm text-gray-600">
                  <p>السعر: {campaign.productPrice} درهم</p>
                  <p className="mt-1">
                    تاريخ الإنشاء: {format(new Date(campaign.createdAt), 'dd MMM yyyy', { locale: ar })}
                  </p>
                </div>
              </div>
            </Link>
          ))
        ) : (
          <div className="col-span-full text-center py-12">
            <Target className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">لا توجد حملات حالياً</p>
            <button
              onClick={() => setShowCreate(true)}
              className="btn btn-primary inline-flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              إنشاء حملة جديدة
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
