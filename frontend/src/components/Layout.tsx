import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import {
  LayoutDashboard,
  Package,
  Users,
  Target,
  MessageCircle,
  LogOut
} from 'lucide-react';
import clsx from 'clsx';

export default function Layout() {
  const location = useLocation();
  const { user, logout } = useAuthStore();

  const navigation = [
    { name: 'لوحة التحكم', href: '/', icon: LayoutDashboard },
    { name: 'الطلبات', href: '/orders', icon: Package },
    { name: 'العملاء', href: '/customers', icon: Users },
    { name: 'إعادة الاستهداف', href: '/retargeting', icon: Target },
    { name: 'واتساب', href: '/whatsapp', icon: MessageCircle }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="fixed inset-y-0 right-0 w-64 bg-white shadow-lg">
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b">
            <h1 className="text-2xl font-bold text-primary-600">
              نظام التوصيل
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              مرحباً، {user?.name}
            </p>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              const Icon = item.icon;

              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={clsx(
                    'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors',
                    isActive
                      ? 'bg-primary-50 text-primary-700 font-medium'
                      : 'text-gray-700 hover:bg-gray-50'
                  )}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* Logout */}
          <div className="p-4 border-t">
            <button
              onClick={logout}
              className="flex items-center gap-3 w-full px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span>تسجيل الخروج</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="mr-64">
        <main className="p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
