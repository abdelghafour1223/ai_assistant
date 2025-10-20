import { google } from 'googleapis';
import logger from '../utils/logger';
import { Customer, Order, OrderStatus } from '../types';

class GoogleSheetsService {
  private sheets: any;
  private auth: any;

  constructor() {
    this.initializeAuth();
  }

  private initializeAuth() {
    try {
      const credentials = {
        client_email: process.env.GOOGLE_SHEETS_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_SHEETS_PRIVATE_KEY?.replace(/\\n/g, '\n')
      };

      this.auth = new google.auth.JWT(
        credentials.client_email,
        undefined,
        credentials.private_key,
        ['https://www.googleapis.com/auth/spreadsheets.readonly']
      );

      this.sheets = google.sheets({ version: 'v4', auth: this.auth });
    } catch (error) {
      logger.error('Failed to initialize Google Sheets auth:', error);
    }
  }

  async importCustomers(spreadsheetId: string, range: string = 'Sheet1!A2:F'): Promise<Customer[]> {
    try {
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId,
        range
      });

      const rows = response.data.values;
      if (!rows || rows.length === 0) {
        logger.warn('No data found in Google Sheet');
        return [];
      }

      const customers: Customer[] = rows.map((row: any[]) => ({
        name: row[0] || '',
        phone: row[1] || '',
        address: row[2] || '',
        city: row[3] || '',
        email: row[4] || undefined,
        tags: row[5] ? row[5].split(',').map((t: string) => t.trim()) : []
      }));

      logger.info(`Imported ${customers.length} customers from Google Sheets`);
      return customers;
    } catch (error) {
      logger.error('Failed to import customers from Google Sheets:', error);
      throw error;
    }
  }

  async importOrders(spreadsheetId: string, range: string = 'Sheet1!A2:H'): Promise<Partial<Order>[]> {
    try {
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId,
        range
      });

      const rows = response.data.values;
      if (!rows || rows.length === 0) {
        logger.warn('No orders found in Google Sheet');
        return [];
      }

      const orders: Partial<Order>[] = rows.map((row: any[]) => ({
        customer: {
          name: row[0] || '',
          phone: row[1] || '',
          address: row[2] || '',
          city: row[3] || ''
        },
        productName: row[4] || '',
        productPrice: parseFloat(row[5]) || 0,
        quantity: parseInt(row[6]) || 1,
        totalAmount: parseFloat(row[7]) || (parseFloat(row[5]) || 0) * (parseInt(row[6]) || 1),
        status: OrderStatus.PENDING,
        statusHistory: []
      }));

      logger.info(`Imported ${orders.length} orders from Google Sheets`);
      return orders;
    } catch (error) {
      logger.error('Failed to import orders from Google Sheets:', error);
      throw error;
    }
  }

  async importRetargetingList(spreadsheetId: string, range: string = 'Sheet1!A2:B'): Promise<string[]> {
    try {
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId,
        range
      });

      const rows = response.data.values;
      if (!rows || rows.length === 0) {
        logger.warn('No phone numbers found in Google Sheet');
        return [];
      }

      // Extract phone numbers (assuming they're in the first or second column)
      const phoneNumbers: string[] = rows
        .map((row: any[]) => row[0] || row[1])
        .filter((phone: string) => phone && phone.trim() !== '');

      logger.info(`Imported ${phoneNumbers.length} phone numbers for retargeting`);
      return phoneNumbers;
    } catch (error) {
      logger.error('Failed to import retargeting list from Google Sheets:', error);
      throw error;
    }
  }

  extractSpreadsheetId(url: string): string {
    const match = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
    return match ? match[1] : url;
  }
}

export default new GoogleSheetsService();
