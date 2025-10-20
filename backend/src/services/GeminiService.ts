import { GoogleGenerativeAI } from '@google/generative-ai';
import logger from '../utils/logger';
import { RetargetingCampaign, Customer } from '../types';

class GeminiService {
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not configured');
    }

    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-pro' });
  }

  async generateRetargetingMessage(
    campaign: Partial<RetargetingCampaign>,
    customer: Customer
  ): Promise<string> {
    try {
      const prompt = `
أنت مساعد تسويقي محترف متخصص في كتابة رسائل واتساب تسويقية باللغة العربية (الدارجة المغربية).

معلومات العميل:
- الاسم: ${customer.name}
- المدينة: ${customer.city}
${customer.previousOrders && customer.previousOrders.length > 0 ? `- عدد الطلبات السابقة: ${customer.previousOrders.length}` : ''}

معلومات المنتج:
- اسم المنتج: ${campaign.productName}
- وصف المنتج: ${campaign.productDescription}
- السعر: ${campaign.productPrice} درهم

المهمة:
اكتب رسالة واتساب جذابة ومحفزة للعميل لإعادة استهدافه بهذا المنتج.

المتطلبات:
1. استخدم الدارجة المغربية بشكل طبيعي وودود
2. اجعل الرسالة شخصية وموجهة للعميل
3. أبرز قيمة المنتج وفوائده
4. أضف حافز للشراء (عرض خاص، خصم، هدية، الخ)
5. اختم بدعوة واضحة للعمل (Call to Action)
6. لا تتجاوز 200 كلمة
7. استخدم الإيموجي بشكل مناسب

الرسالة:
`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const message = response.text();

      logger.info('Generated retargeting message with Gemini AI');
      return message.trim();
    } catch (error) {
      logger.error('Failed to generate message with Gemini:', error);
      throw error;
    }
  }

  async generateBulkMessages(
    campaign: Partial<RetargetingCampaign>,
    customers: Customer[]
  ): Promise<Map<string, string>> {
    const messages = new Map<string, string>();

    for (const customer of customers) {
      try {
        const message = await this.generateRetargetingMessage(campaign, customer);
        messages.set(customer.phone, message);

        // Delay to respect API rate limits
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        logger.error(`Failed to generate message for customer ${customer.phone}:`, error);
      }
    }

    return messages;
  }

  async analyzeCustomerBehavior(customer: Customer, orderHistory: any[]): Promise<string[]> {
    try {
      const prompt = `
تحليل سلوك العميل وتقديم توصيات:

معلومات العميل:
- الاسم: ${customer.name}
- المدينة: ${customer.city}
- عدد الطلبات: ${orderHistory.length}

تاريخ الطلبات:
${orderHistory.map((order, index) => `${index + 1}. ${order.productName} - ${order.totalAmount} درهم`).join('\n')}

المهمة:
بناءً على تاريخ طلبات العميل، قدم 3-5 توصيات لمنتجات أو فئات منتجات قد تهمه.

قدم الإجابة كقائمة JSON بسيطة من التوصيات، مثال:
["منتج 1", "منتج 2", "منتج 3"]
`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      // Parse JSON response
      const recommendations = JSON.parse(text.trim());
      return recommendations;
    } catch (error) {
      logger.error('Failed to analyze customer behavior:', error);
      return [];
    }
  }

  async generateProductDescription(productName: string, features?: string[]): Promise<string> {
    try {
      const prompt = `
اكتب وصف تسويقي جذاب للمنتج التالي باللغة العربية (الدارجة المغربية):

اسم المنتج: ${productName}
${features && features.length > 0 ? `المميزات:\n${features.map(f => `- ${f}`).join('\n')}` : ''}

المتطلبات:
1. الوصف يجب أن يكون قصير وجذاب (50-100 كلمة)
2. استخدم الدارجة المغربية
3. ركز على الفوائد والقيمة
4. استخدم لغة تسويقية محفزة

الوصف:
`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return response.text().trim();
    } catch (error) {
      logger.error('Failed to generate product description:', error);
      throw error;
    }
  }
}

export default new GeminiService();
