import type { Order } from '../types/index';

export const BUSINESS_WHATSAPP_NUMBER = '919242150040';

/**
 * Generates exact WhatsApp message formatted per specification:
 * 
 * TAZE CLINING ORDER
 * 
 * Order ID:
 * [ORDER_ID]
 * 
 * Customer Name:
 * [CUSTOMER_NAME]
 * 
 * Mobile:
 * [CUSTOMER_PHONE]
 * 
 * Delivery Address:
 * [DELIVERY_ADDRESS]
 * 
 * Products:
 * [PRODUCT + VARIANT + QUANTITY]
 * 
 * Total Amount:
 * [ORDER_TOTAL]
 * 
 * Status:
 * PENDING
 */
export function formatWhatsAppMessage(order: Partial<Order>, _brandName = 'TAZE CLINING'): string {
  if (!order) return 'TAZE CLINING ORDER\n\nNo order details available.';

  const items = Array.isArray(order.items) ? order.items : [];
  const productsText = items.length > 0
    ? items.map(item => `${item.productName || 'Item'} (${item.size || ''}) x ${item.quantity || 1} - ₹${item.subtotal || 0}`).join('\n')
    : 'Items under review';

  return `TAZE CLINING ORDER

Order ID:
${order.id || 'Pending'}

Customer Name:
${order.customerName || 'Customer'}

Mobile:
${order.customerPhone || 'Not provided'}

Delivery Address:
${order.customerAddress || 'Address on file'}${order.notes ? `\nNotes: ${order.notes}` : ''}

Products:
${productsText}

Total Amount:
₹${order.grandTotal ?? 0}

Status:
${order.status || 'PENDING'}`;
}

/**
 * Creates WhatsApp deep link connecting directly to +91 9242150040 (919242150040)
 */
export function createWhatsAppOrderLink(
  order: Order,
  whatsappNumber = BUSINESS_WHATSAPP_NUMBER,
  brandName = 'TAZE CLINING'
): string {
  const message = formatWhatsAppMessage(order, brandName);
  const encoded = encodeURIComponent(message);
  const cleanNumber = (whatsappNumber || BUSINESS_WHATSAPP_NUMBER).replace(/[^0-9]/g, '');
  return `https://wa.me/${cleanNumber}?text=${encoded}`;
}
