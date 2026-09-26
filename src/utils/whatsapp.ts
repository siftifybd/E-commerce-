/**
 * BD SHOPS — WhatsApp Automation & Direct Order Helper Utilities
 * Flexible, ultra-safe link generators supporting both positional arguments and option objects
 */

import { APP_CONFIG } from '../constants';
import { Product, Order, CartItem } from '../types';

/**
 * Cleans phone number to international WhatsApp format (e.g. 8801XXXXXXXXX)
 */
export function formatWhatsAppNumber(phone?: string): string {
  let target = phone;
  if (!target && typeof window !== 'undefined') {
    target = localStorage.getItem('bd_shops_whatsapp_number') || undefined;
  }
  if (!target) {
    target = APP_CONFIG.supportWhatsApp || APP_CONFIG.whatsappNumber || '01796983725';
  }
  let cleaned = target.replace(/\D/g, '');
  if (cleaned.startsWith('01')) {
    cleaned = '88' + cleaned;
  }
  return cleaned;
}

/**
 * Builds direct WhatsApp URL with encoded message
 */
export function buildWhatsAppUrl(message: string, customPhone?: string): string {
  const number = formatWhatsAppNumber(customPhone);
  const encoded = encodeURIComponent(message);
  return `https://wa.me/${number}?text=${encoded}`;
}

export interface ProductWhatsAppOptions {
  product: Product;
  selectedSize?: string;
  selectedColor?: string;
  quantity?: number;
  productUrl?: string;
}

/**
 * 1. Generates WhatsApp link from Product Detail Page
 * Supports both:
 *   - getProductWhatsAppLink(product, selectedSize, selectedColor, quantity, productUrl)
 *   - getProductWhatsAppLink({ product, selectedSize, ... })
 */
export function getProductWhatsAppLink(
  productOrOptions?: Product | ProductWhatsAppOptions | null,
  selectedSizeArg?: string,
  selectedColorArg?: string,
  quantityArg: number = 1,
  productUrlArg?: string
): string {
  if (!productOrOptions) {
    return buildWhatsAppUrl(`আসসালামু আলাইকুম ${APP_CONFIG.name}, আমি একটি প্রোডাক্ট অর্ডার করতে চাই।`);
  }

  let product: Product;
  let selectedSize: string | undefined = selectedSizeArg;
  let selectedColor: string | undefined = selectedColorArg;
  let quantity: number = quantityArg;
  let productUrl: string | undefined = productUrlArg;

  // Check if first argument is options object
  if ('product' in productOrOptions && productOrOptions.product) {
    product = productOrOptions.product;
    selectedSize = productOrOptions.selectedSize;
    selectedColor = productOrOptions.selectedColor;
    quantity = productOrOptions.quantity || 1;
    productUrl = productOrOptions.productUrl;
  } else {
    product = productOrOptions as Product;
  }

  const currentUrl =
    productUrl || (typeof window !== 'undefined' ? window.location.href : '');
  const unitPrice =
    (product as any)?.discountPrice ||
    product?.price ||
    product?.compareAtPrice ||
    0;

  const totalPrice = unitPrice * quantity;

  let message = `🛍️ *নতুন ওয়াটসঅ্যাপ অর্ডার রিকোয়েস্ট — ${APP_CONFIG.name}*\n\n`;
  message += `📦 *পণ্যের নাম:* ${product?.name || 'পণ্য'}\n`;
  message += `💰 *একক মূল্য:* ৳${unitPrice.toLocaleString('bn-BD')}\n`;
  message += `🔢 *পরিমাণ (Quantity):* ${quantity} টি\n`;
  message += `💵 *মোট মূল্য:* ৳${totalPrice.toLocaleString('bn-BD')}\n`;

  if (selectedSize) {
    message += `📏 *বাছাইকৃত সাইজ:* ${selectedSize}\n`;
  }
  if (selectedColor) {
    message += `🎨 *বাছাইকৃত কালার:* ${selectedColor}\n`;
  }

  if (currentUrl) {
    message += `\n🔗 *প্রোডাক্ট পেজ লিংক:* ${currentUrl}\n`;
  }

  message += `\nআসসালামু আলাইকুম, আমি এই প্রোডাক্টটি অর্ডার করতে চাই। দয়া করে প্রোডাক্টটি স্টক আছে কিনা এবং অর্ডার কনফার্ম করার নিয়ম জানান।`;

  return buildWhatsAppUrl(message);
}

export interface CheckoutWhatsAppOptions {
  fullName?: string;
  phone?: string;
  district?: string;
  address?: string;
  items?: CartItem[] | any[];
  subtotal?: number;
  deliveryCharge?: number;
  discount?: number;
  grandTotal?: number;
  paymentMethod?: string;
  notes?: string;
}

/**
 * 2. Generates WhatsApp link from Checkout Page or Order Object
 * Supports both:
 *   - getCheckoutWhatsAppLink(order, customPhone)
 *   - getCheckoutWhatsAppLink({ fullName, phone, items, ... })
 */
export function getCheckoutWhatsAppLink(
  orderOrOptions?: Order | CheckoutWhatsAppOptions | any,
  customPhone?: string
): string {
  if (!orderOrOptions) {
    return buildWhatsAppUrl(`আসসালামু আলাইকুম ${APP_CONFIG.name}, আমি একটি অর্ডার করতে চাই।`, customPhone);
  }

  // Handle Order object or Options object gracefully
  const fullName =
    orderOrOptions.fullName ||
    orderOrOptions.customerName ||
    orderOrOptions.customerInfo?.fullName ||
    orderOrOptions.shippingAddress?.fullName ||
    'সম্মানিত গ্রাহক';

  const phone =
    orderOrOptions.phone ||
    orderOrOptions.customerPhone ||
    orderOrOptions.customerInfo?.phone ||
    orderOrOptions.shippingAddress?.phone ||
    '';

  const district =
    orderOrOptions.district ||
    orderOrOptions.shippingAddress?.district ||
    orderOrOptions.shippingAddress?.city ||
    'ঢাকা';

  const address =
    orderOrOptions.address ||
    orderOrOptions.shippingAddress?.streetAddress ||
    orderOrOptions.shippingAddress?.address ||
    '';

  const items: any[] = orderOrOptions.items || [];
  const subtotal = orderOrOptions.subtotal || 0;
  const deliveryCharge = orderOrOptions.deliveryCharge || 0;
  const discount = orderOrOptions.discount || 0;
  const grandTotal =
    orderOrOptions.grandTotal ||
    orderOrOptions.total ||
    Math.max(0, subtotal + deliveryCharge - discount);

  const paymentMethod =
    orderOrOptions.paymentMethod === 'cash_on_delivery'
      ? 'ক্যাশ অন ডেলিভারি (COD)'
      : orderOrOptions.paymentMethod || 'ক্যাশ অন ডেলিভারি';

  const notes = orderOrOptions.notes || '';
  const orderNumber = orderOrOptions.orderNumber || '';

  let message = `🛍️ *নতুন অর্ডার রিকোয়েস্ট — ${APP_CONFIG.name}*\n\n`;
  if (orderNumber) {
    message += `📦 *অর্ডার ট্র্যাকিং আইডি:* ${orderNumber}\n`;
  }
  message += `👤 *গ্রাহকের নাম:* ${fullName}\n`;
  if (phone) {
    message += `📞 *মোবাইল:* ${phone}\n`;
  }
  if (address) {
    message += `📍 *ডেলিভারি ঠিকানা:* ${address}, ${district}\n\n`;
  }

  if (items.length > 0) {
    message += `🛒 *অর্ডারকৃত পণ্যসমূহ:*\n`;
    items.forEach((item, index) => {
      const itemPrice = item.discountPrice || item.price || 0;
      const qty = item.quantity || 1;
      message += `${index + 1}. *${item.name || 'পণ্য'}* (x${qty})\n`;
      if (item.selectedSize) message += `   • সাইজ: ${item.selectedSize}\n`;
      if (item.selectedColor) message += `   • কালার: ${item.selectedColor}\n`;
      message += `   • মূল্য: ৳${(itemPrice * qty).toLocaleString('bn-BD')}\n`;
      if (item.slug) {
        const origin = typeof window !== 'undefined' ? window.location.origin : '';
        message += `   • লিংক: ${origin}/products/${item.slug}\n`;
      }
    });
  }

  message += `\n💵 *হিসাব:*\n`;
  if (subtotal > 0) message += `• সাবটোটাল: ৳${subtotal.toLocaleString('bn-BD')}\n`;
  message += `• ডেলিভারি চার্জ: ৳${deliveryCharge.toLocaleString('bn-BD')}\n`;
  if (discount > 0) {
    message += `• ডিসকাউন্ট: -৳${discount.toLocaleString('bn-BD')}\n`;
  }
  message += `• *সর্বমোট প্রদেয়:* ৳${grandTotal.toLocaleString('bn-BD')}\n`;
  message += `• পেমেন্ট মেথড: ${paymentMethod}\n`;

  if (notes) {
    message += `📝 *বিশেষ নোট:* ${notes}\n`;
  }

  message += `\nদয়া করে আমার এই অর্ডারটি দ্রুত কনফার্ম করুন। ধন্যবাদ!`;

  return buildWhatsAppUrl(message, customPhone);
}

/**
 * 3. Generates WhatsApp link for Order Confirmation on Order Success page
 */
export function getOrderSuccessWhatsAppLink(order: Order): string {
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const trackingUrl = `${origin}/orders/track?search=${order?.orderNumber || ''}`;

  const customerName =
    order?.customerName ||
    order?.customerInfo?.fullName ||
    order?.shippingAddress?.fullName ||
    'সম্মানিত গ্রাহক';

  const customerPhone =
    order?.customerPhone ||
    order?.phone ||
    order?.customerInfo?.phone ||
    order?.shippingAddress?.phone ||
    '';

  const fullAddr =
    order?.shippingAddress?.streetAddress ||
    order?.shippingAddress?.address ||
    order?.address ||
    '';

  const district = order?.shippingAddress?.district || order?.district || '';
  const totalAmount = order?.grandTotal || order?.total || 0;

  let message = `✅ *অর্ডার কনফার্মেশন মেসেজ — ${APP_CONFIG.name}*\n\n`;
  message += `📦 *অর্ডার নম্বর:* ${order?.orderNumber || 'N/A'}\n`;
  message += `👤 *গ্রাহকের নাম:* ${customerName}\n`;
  if (customerPhone) {
    message += `📞 *মোবাইল:* ${customerPhone}\n`;
  }
  if (fullAddr) {
    message += `📍 *ঠিকানা:* ${fullAddr}${district ? `, ${district}` : ''}\n`;
  }
  message += `💰 *সর্বমোট বিল:* ৳${totalAmount.toLocaleString('bn-BD')}\n\n`;

  if (order?.orderNumber) {
    message += `🔗 *লাইভ অর্ডার ট্র্যাকিং লিংক:* ${trackingUrl}\n\n`;
  }
  message += `আসসালামু আলাইকুম, আমি ওয়েবসাইটে অর্ডার সম্পন্ন করেছি। অর্ডারটি দ্রুত প্রসেস করার অনুরোধ করছি।`;

  return buildWhatsAppUrl(message);
}

/**
 * 4. General Support WhatsApp link with Current Page Context
 */
export function getGeneralWhatsAppSupportLink(customMessage?: string): string {
  const currentUrl = typeof window !== 'undefined' ? window.location.href : '';
  let message = customMessage || `আসসালামু আলাইকুম ${APP_CONFIG.name}, আমি একটি বিষয়ে সহযোগিতা চাচ্ছি।\n\n`;
  if (currentUrl) {
    message += `🌐 পেইজ লিংক: ${currentUrl}`;
  }
  return buildWhatsAppUrl(message);
}
