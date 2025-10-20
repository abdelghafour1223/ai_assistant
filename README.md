# نظام إدارة التوصيل والتسويق الذكي

نظام متقدم لإدارة عمليات التوصيل والتواصل مع العملاء عبر واتساب، مع ميزة إعادة الاستهداف الذكية باستخدام الذكاء الاصطناعي.

## المميزات الرئيسية

### 1. إدارة الطلبات والتوصيل
- **استيراد تلقائي**: استيراد الطلبات والعملاء من Google Sheets
- **تتبع الشحنات**: تكامل مع شركات التوصيل لتتبع الطلبات في الوقت الفعلي
- **إدارة الحالات**: تحديث تلقائي لحالة الطلبات مع تاريخ كامل للتغييرات
- **لوحة تحكم شاملة**: عرض إحصائيات وتحليلات مفصلة

### 2. التواصل عبر واتساب
- **اتصال آمن**: ربط واتساب باستخدام whatsapp-web.js
- **إشعارات تلقائية**: إرسال تحديثات للعملاء عند تغيير حالة الطلب
- **رسائل مخصصة**: إرسال رسائل مخصصة لكل عميل
- **واجهة QR**: مسح رمز QR لربط الحساب بسهولة

### 3. إعادة الاستهداف الذكية
- **توليد رسائل بالذكاء الاصطناعي**: استخدام Gemini AI لتوليد رسائل تسويقية مخصصة
- **استهداف دقيق**: استيراد قوائم العملاء السابقين واستهدافهم بمنتجات جديدة
- **تتبع الأداء**: متابعة معدلات الفتح والتحويل
- **حملات آلية**: إطلاق حملات تسويقية بالكامل تلقائياً

### 4. الأمان والأداء
- **WebSocket**: اتصال ثنائي الاتجاه في الوقت الفعلي
- **JWT Authentication**: نظام مصادقة آمن
- **Rate Limiting**: حماية من الاستخدام المفرط
- **Encryption**: تشفير البيانات الحساسة
- **MongoDB**: قاعدة بيانات قابلة للتوسع مع فهرسة محسنة

## التقنيات المستخدمة

### Backend
- **Node.js** + **Express** + **TypeScript**
- **Socket.IO** للاتصال في الوقت الفعلي
- **MongoDB** + **Mongoose** لقاعدة البيانات
- **whatsapp-web.js** للتكامل مع واتساب
- **Google Sheets API** لاستيراد البيانات
- **Gemini AI** للتسويق الذكي
- **JWT** للمصادقة والأمان

### Frontend
- **React** + **TypeScript** + **Vite**
- **Tailwind CSS** للتصميم
- **React Query** لإدارة الحالة والبيانات
- **Zustand** لإدارة الحالة العامة
- **Socket.IO Client** للاتصال الفوري
- **Recharts** للرسوم البيانية

## التثبيت والإعداد

### المتطلبات
- Node.js 18+ و npm
- MongoDB 6+
- حساب Google Cloud (للـ Sheets API)
- Gemini API Key
- حساب واتساب

### 1. تثبيت المكتبات

```bash
# تثبيت جميع المكتبات
npm install

# أو تثبيت كل workspace على حدة
cd backend && npm install
cd ../frontend && npm install
```

### 2. إعداد المتغيرات البيئية

أنشئ ملف `.env` في مجلد `backend` بناءً على `.env.example`:

```env
# Server
PORT=5000
NODE_ENV=production

# MongoDB
MONGODB_URI=mongodb://localhost:27017/delivery-automation

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this
JWT_EXPIRE=7d

# Google Sheets API
GOOGLE_SHEETS_CLIENT_EMAIL=your-service-account-email
GOOGLE_SHEETS_PRIVATE_KEY=your-private-key

# Gemini AI
GEMINI_API_KEY=your-gemini-api-key

# Delivery Provider
DELIVERY_API_KEY=your-delivery-provider-api-key
DELIVERY_API_URL=https://api.delivery-provider.com

# Security
ENCRYPTION_KEY=your-encryption-key-32-characters
ALLOWED_ORIGINS=http://localhost:5173,https://yourdomain.com
```

### 3. إعداد Google Sheets API

1. انتقل إلى [Google Cloud Console](https://console.cloud.google.com)
2. أنشئ مشروع جديد
3. فعّل Google Sheets API
4. أنشئ Service Account واحصل على المفاتيح
5. شارك Google Sheets مع البريد الإلكتروني للـ Service Account

### 4. تشغيل التطبيق

```bash
# تطوير (Development)
npm run dev

# بناء (Production Build)
npm run build

# تشغيل الإنتاج
npm start
```

سيعمل:
- Backend على: `http://localhost:5000`
- Frontend على: `http://localhost:5173`

## الاستخدام

### 1. تسجيل الدخول
- افتح التطبيق في المتصفح
- سجل الدخول بحساب المسؤول

### 2. ربط واتساب
1. اذهب إلى صفحة "واتساب"
2. امسح رمز QR بواتساب على هاتفك
3. انتظر رسالة "متصل بواتساب"

### 3. استيراد الطلبات
1. اذهب إلى صفحة "الطلبات"
2. اضغط "استيراد من Google Sheets"
3. الصق رابط الـ Google Sheet
4. تأكد من أن الأعمدة: الاسم، الهاتف، العنوان، المدينة، المنتج، السعر، الكمية

### 4. شحن الطلبات
1. افتح تفاصيل الطلب
2. اضغط "شحن الطلب"
3. سيتم إنشاء رقم تتبع تلقائياً
4. سيتم إرسال إشعار واتساب للعميل

### 5. إنشاء حملة إعادة استهداف
1. اذهب إلى "إعادة الاستهداف"
2. اضغط "حملة جديدة"
3. أدخل معلومات المنتج
4. استورد قائمة العملاء من Google Sheets
5. اضغط "توليد رسالة بالذكاء الاصطناعي"
6. مراجعة الرسالة ثم "إطلاق الحملة"

## بنية المشروع

```
ai_assistant/
├── backend/
│   ├── src/
│   │   ├── config/         # إعدادات قاعدة البيانات
│   │   ├── models/         # نماذج MongoDB
│   │   ├── routes/         # API endpoints
│   │   ├── services/       # خدمات WhatsApp, Gemini, Google Sheets
│   │   ├── middleware/     # المصادقة والتحقق
│   │   ├── socket/         # معالجات WebSocket
│   │   ├── types/          # TypeScript types
│   │   ├── utils/          # أدوات مساعدة
│   │   └── server.ts       # نقطة دخول التطبيق
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/     # مكونات React
│   │   ├── pages/          # صفحات التطبيق
│   │   ├── lib/            # API و Socket clients
│   │   ├── store/          # إدارة الحالة (Zustand)
│   │   ├── types/          # TypeScript types
│   │   └── main.tsx        # نقطة دخول React
│   └── package.json
│
└── package.json            # Workspace root
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - تسجيل مستخدم جديد
- `POST /api/auth/login` - تسجيل الدخول

### Orders
- `GET /api/orders` - جلب جميع الطلبات
- `GET /api/orders/:id` - جلب طلب معين
- `POST /api/orders/import` - استيراد من Google Sheets
- `POST /api/orders/:id/ship` - شحن طلب
- `PUT /api/orders/:id/status` - تحديث حالة طلب
- `GET /api/orders/:id/track` - تتبع شحنة

### Customers
- `GET /api/customers` - جلب جميع العملاء
- `GET /api/customers/:id` - جلب عميل معين
- `POST /api/customers/import` - استيراد من Google Sheets

### Retargeting
- `GET /api/retargeting` - جلب جميع الحملات
- `GET /api/retargeting/:id` - جلب حملة معينة
- `POST /api/retargeting` - إنشاء حملة جديدة
- `POST /api/retargeting/:id/import-audience` - استيراد الجمهور
- `POST /api/retargeting/:id/generate-messages` - توليد رسائل AI
- `POST /api/retargeting/:id/launch` - إطلاق الحملة

### WhatsApp
- `GET /api/whatsapp/status` - حالة الاتصال
- `POST /api/whatsapp/send` - إرسال رسالة
- `POST /api/whatsapp/disconnect` - قطع الاتصال

## الأمان

- ✅ JWT Authentication لجميع الـ endpoints
- ✅ Rate Limiting لمنع الإساءة
- ✅ Helmet.js للأمان
- ✅ CORS مُفعّل
- ✅ تشفير كلمات المرور باستخدام bcrypt
- ✅ التحقق من المدخلات

## الدعم والمساعدة

للحصول على الدعم أو الإبلاغ عن مشكلة، يرجى فتح issue في المستودع.

## الترخيص

هذا المشروع مفتوح المصدر ومتاح للاستخدام الشخصي والتجاري.
