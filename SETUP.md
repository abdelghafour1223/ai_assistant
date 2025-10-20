# دليل الإعداد السريع

## الخطوة 1: تثبيت MongoDB

### على Ubuntu/Debian:
```bash
sudo apt-get install -y mongodb-org
sudo systemctl start mongod
sudo systemctl enable mongod
```

### على macOS:
```bash
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community
```

### على Windows:
قم بتنزيل MongoDB من الموقع الرسمي وتثبيته.

## الخطوة 2: إعداد Google Sheets API

1. انتقل إلى https://console.cloud.google.com
2. أنشئ مشروع جديد
3. فعّل Google Sheets API
4. اذهب إلى "Credentials" > "Create Credentials" > "Service Account"
5. قم بإنشاء Service Account
6. اذهب إلى Service Account > Keys > Add Key > JSON
7. قم بتنزيل ملف JSON
8. افتح الملف وانسخ:
   - `client_email` إلى `GOOGLE_SHEETS_CLIENT_EMAIL`
   - `private_key` إلى `GOOGLE_SHEETS_PRIVATE_KEY`

## الخطوة 3: الحصول على Gemini API Key

1. اذهب إلى https://makersuite.google.com/app/apikey
2. قم بإنشاء API key جديد
3. انسخ المفتاح إلى `GEMINI_API_KEY` في ملف `.env`

## الخطوة 4: إعداد شركة التوصيل

اختر شركة التوصيل المناسبة وقم بالتسجيل للحصول على API key:
- Aramex
- DHL
- FedEx
- أي شركة محلية توفر API

ضع API key في `DELIVERY_API_KEY` و URL في `DELIVERY_API_URL`

## الخطوة 5: تثبيت المكتبات

```bash
# في المجلد الرئيسي
npm install

# تثبيت backend
cd backend
npm install

# تثبيت frontend
cd ../frontend
npm install
cd ..
```

## الخطوة 6: إعداد ملف .env

```bash
cd backend
cp .env.example .env
```

قم بتعديل ملف `.env` بالقيم الصحيحة.

## الخطوة 7: إنشاء مستخدم admin

```bash
# شغل الـ backend أولاً
cd backend
npm run dev
```

في terminal آخر، قم بإنشاء admin:
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "your-secure-password",
    "name": "Admin",
    "role": "admin"
  }'
```

## الخطوة 8: تشغيل التطبيق

```bash
# من المجلد الرئيسي
npm run dev
```

أو شغل كل جزء على حدة:
```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

## الخطوة 9: الوصول للتطبيق

افتح المتصفح على:
- Frontend: http://localhost:5173
- Backend API: http://localhost:5000

## الخطوة 10: ربط واتساب

1. افتح التطبيق وسجل الدخول
2. اذهب إلى صفحة "واتساب"
3. امسح رمز QR بواتساب على هاتفك
4. انتظر "متصل بواتساب"

## نصائح مهمة

### إعداد Google Sheets
تأكد من أن Google Sheet يحتوي على الأعمدة التالية:

**للطلبات:**
| الاسم | الهاتف | العنوان | المدينة | المنتج | السعر | الكمية | المجموع |
|-------|---------|----------|---------|--------|-------|--------|----------|

**للعملاء:**
| الاسم | الهاتف | العنوان | المدينة | البريد الإلكتروني | العلامات |
|-------|---------|----------|---------|-------------------|-----------|

**لإعادة الاستهداف:**
| الهاتف | الاسم |
|---------|-------|

### مشاركة Google Sheet
لا تنسَ مشاركة Google Sheet مع البريد الإلكتروني للـ Service Account.

### أمان WhatsApp
احرص على عدم حذف مجلد `whatsapp-session` وإلا ستحتاج لإعادة المسح.

## حل المشاكل الشائعة

### MongoDB لا يعمل
```bash
# تحقق من حالة MongoDB
sudo systemctl status mongod

# إعادة تشغيل
sudo systemctl restart mongod
```

### WhatsApp لا يتصل
- تأكد من أن رقم الهاتف غير مرتبط بـ WhatsApp Business API
- حاول حذف `whatsapp-session` وإعادة المسح
- تأكد من أن المنافذ غير محجوبة

### خطأ في Google Sheets API
- تأكد من تفعيل Google Sheets API في Console
- تأكد من مشاركة الـ Sheet مع Service Account
- تحقق من صحة الـ credentials

### خطأ في Gemini API
- تأكد من صحة API key
- تحقق من الحصة المتاحة (quota)
- تأكد من تفعيل Gemini API في مشروعك
