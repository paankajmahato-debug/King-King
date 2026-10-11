import React, { useState, useEffect, useRef } from 'react';
import type {
  Product,
  Order,
  DashboardStats,
  Variant,
  ProductStatus,
  Customer,
  StockAuditEntry,
  RevenueAuditEntry,
  AuditLogEntry,
  OrderStatus,
  StoreSettings,
  RevenueTransaction
} from '../../types/index';
import { api } from '../../services/api';
import {
  Boxes,
  ShoppingBag,
  TrendingUp,
  Clock,
  CheckCircle2,
  XCircle,
  Plus,
  Edit2,
  Trash2,
  Upload,
  AlertTriangle,
  RefreshCw,
  Eye,
  MessageCircle,
  ShieldCheck,
  ChevronRight,
  Sparkles,
  ArrowUpRight,
  Sliders,
  DollarSign,
  Users,
  Lock,
  Wallet,
  Check,
  Search,
  ExternalLink,
  Copy,
  UserCheck,
  UserX,
  History,
  Truck,
  Package,
  CheckCheck,
  Ban
} from 'lucide-react';
import { CustomerLinkGenerator } from './CustomerLinkGenerator';
import { OwnerLinkCard } from './OwnerLinkCard';
import { StoreBrandEditor } from './StoreBrandEditor';

interface AdminDashboardProps {
  onRefreshProducts: () => void;
  settings?: StoreSettings;
  onUpdateSettings?: (updated: StoreSettings) => void;
  onOpenGenerator?: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  onRefreshProducts,
  settings: initialSettings,
  onUpdateSettings,
  onOpenGenerator
}) => {
  const [activeTab, setActiveTab] = useState<'orders' | 'customers' | 'revenue' | 'products' | 'stock' | 'audits'>('orders');
  const [storeSettings, setStoreSettings] = useState<StoreSettings>(
    initialSettings || {
      brandName: 'TAZE CLINING',
      tagline: 'Pro Hygiene Solutions',
      heroTitle: 'Clinical Cleanliness.',
      heroSubtitle: 'Crafted for Homes & Industry.'
    }
  );
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [revenueTransactions, setRevenueTransactions] = useState<RevenueTransaction[]>([]);
  const [customerSearchQuery, setCustomerSearchQuery] = useState('');
  const [revenueManualInput, setRevenueManualInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [isGeneratingRandomOrder, setIsGeneratingRandomOrder] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Order filtering across complete lifecycle
  const [orderFilter, setOrderFilter] = useState<'ALL' | 'PENDING' | 'ACCEPTED' | 'PACKAGING' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'CANCELLED'>('PENDING');

  // Owner/Admin Order Revenue Customization State
  const [editingRevenueOrderId, setEditingRevenueOrderId] = useState<string | null>(null);
  const [editingRevenueValue, setEditingRevenueValue] = useState<string>('');
  const [revenueSubView, setRevenueSubView] = useState<'orders' | 'customers'>('orders');

  // Audit Logs State
  const [stockAuditLogs, setStockAuditLogs] = useState<StockAuditEntry[]>([]);
  const [revenueAuditLogs, setRevenueAuditLogs] = useState<RevenueAuditEntry[]>([]);
  const [systemAuditLogs, setSystemAuditLogs] = useState<AuditLogEntry[]>([]);
  const [activeAuditSubTab, setActiveAuditSubTab] = useState<'stock' | 'revenue' | 'system'>('stock');

  // Stock Editor Filtering & Delete Confirmation Modal State
  const [stockSearchQuery, setStockSearchQuery] = useState('');
  const [deleteConfirmTarget, setDeleteConfirmTarget] = useState<{
    type: 'variant' | 'product';
    productId: string;
    variantId?: string;
    name: string;
  } | null>(null);

  // Product Form Modal state
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productForm, setProductForm] = useState({
    name: '',
    tagline: '',
    category: 'Floor Care',
    description: '',
    features: ['Kills 99.9% germs', 'Deep clean formula'],
    image: '',
    status: 'LIVE' as ProductStatus,
    variants: [
      { size: '250 ML', mrp: 60, sellingPrice: 49, offer: '₹11 OFF', stockQuantity: 20 },
      { size: '500 ML', mrp: 100, sellingPrice: 85, offer: '₹15 OFF', stockQuantity: 15 },
      { size: '1 Litre', mrp: 180, sellingPrice: 149, offer: '₹31 OFF', stockQuantity: 10 },
      { size: '5 Litre', mrp: 700, sellingPrice: 599, offer: '₹101 OFF', stockQuantity: 5 }
    ]
  });

  // Variant editing modal state (Add vs Customize/Edit)
  const [editingVariantProduct, setEditingVariantProduct] = useState<Product | null>(null);
  const [editingVariantTarget, setEditingVariantTarget] = useState<Variant | null>(null);
  const [isVariantModalOpen, setIsVariantModalOpen] = useState(false);
  const [variantForm, setVariantForm] = useState({
    size: '1 Litre',
    mrp: 180,
    sellingPrice: 149,
    offer: '₹31 OFF',
    stockQuantity: 10,
    status: 'ACTIVE' as Variant['status']
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Custom Revenue Modal state (Admin only)
  const [isRevenueModalOpen, setIsRevenueModalOpen] = useState(false);
  const [customRevenueInput, setCustomRevenueInput] = useState('');
  const [isSavingRevenue, setIsSavingRevenue] = useState(false);

  const handleOpenRevenueModal = () => {
    setCustomRevenueInput(stats ? String(stats.totalSales) : '');
    setIsRevenueModalOpen(true);
  };

  const handleSaveCustomRevenue = async (amount: number | null) => {
    setIsSavingRevenue(true);
    try {
      const updated = await api.updateCustomRevenue(amount);
      setStats(updated);
      setIsRevenueModalOpen(false);
      showNotification(
        'success',
        amount !== null
          ? `Total Revenue customized to ₹${Number(amount).toLocaleString()} successfully!`
          : `Total Revenue reset to auto-calculated orders value (₹${updated.calculatedSales.toLocaleString()})`
      );
    } catch (err: any) {
      showNotification('error', err.message || 'Failed to update custom revenue');
    } finally {
      setIsSavingRevenue(false);
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [statsData, prodsData, ordersData, settingsData, customersData, revTxsData] = await Promise.all([
        api.getStats(),
        api.getProducts(true),
        api.getOrders(),
        api.getSettings().catch(() => null),
        api.getCustomers().catch(() => []),
        api.getRevenueTransactions().catch(() => [])
      ]);
      setStats(statsData);
      setProducts(Array.isArray(prodsData) ? prodsData : []);
      setOrders(Array.isArray(ordersData) ? ordersData : []);
      setCustomers(Array.isArray(customersData) ? customersData : []);
      setRevenueTransactions(Array.isArray(revTxsData) ? revTxsData : []);
      if (statsData) {
        setRevenueManualInput(statsData.totalSales !== undefined ? String(statsData.totalSales) : '0');
      }
      if (settingsData) {
        setStoreSettings(settingsData);
      }
    } catch (err: any) {
      console.error('[Admin Data Load Error]:', err);
      setMessage({ type: 'error', text: err.message || 'Failed to load dashboard data' });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleCustomerVerified = async (customerId: string) => {
    try {
      const isVerified = await api.toggleCustomerVerified(customerId);
      setCustomers(prev => prev.map(c => c.id === customerId ? { ...c, verified: isVerified } : c));
      showNotification('success', isVerified ? 'Customer verified as VIP!' : 'Customer verification updated');
      await loadData();
    } catch (err: any) {
      showNotification('error', err.message || 'Failed to update customer verification');
    }
  };

  const handleUpdatePaymentStatus = async (orderId: string, paymentStatus: 'PENDING' | 'PAID' | 'VERIFIED') => {
    setActionLoading(`pay-${orderId}`);
    try {
      await api.updateOrderPayment(orderId, paymentStatus);
      showNotification('success', `Order ${orderId} marked as ${paymentStatus}!`);
      await loadData();
    } catch (err: any) {
      showNotification('error', err.message || 'Failed to update payment status');
    } finally {
      setActionLoading(null);
    }
  };

  const handleSaveDirectRevenue = async () => {
    const val = parseFloat(revenueManualInput);
    if (isNaN(val) || val < 0) {
      showNotification('error', 'Please enter a valid positive revenue amount');
      return;
    }
    setIsSavingRevenue(true);
    try {
      const updated = await api.updateCustomRevenue(val);
      setStats(updated);
      showNotification('success', `Total Revenue updated to ₹${val.toLocaleString()} (Owner Manual Control)`);
    } catch (err: any) {
      showNotification('error', err.message || 'Failed to update revenue');
    } finally {
      setIsSavingRevenue(false);
    }
  };

  const handleSyncCalculatedOrdersToRevenue = async () => {
    if (!stats) return;
    setIsSavingRevenue(true);
    try {
      const updated = await api.updateCustomRevenue(stats.calculatedSales);
      setStats(updated);
      setRevenueManualInput(String(stats.calculatedSales));
      showNotification('success', `Total Revenue manually synchronized to calculated orders (₹${stats.calculatedSales.toLocaleString()})`);
    } catch (err: any) {
      showNotification('error', err.message || 'Failed to sync revenue');
    } finally {
      setIsSavingRevenue(false);
    }
  };

  const handleCreateRandomOrder = async (customId?: string, customName?: string) => {
    setIsGeneratingRandomOrder(true);
    try {
      const order = await api.createRandomOrder(customId, customName);
      showNotification('success', `Test Order ${order.id} placed for ${order.customerName} (${order.customerId || 'Direct'}) - ₹${order.grandTotal}!`);
      setActiveTab('orders');
      setOrderFilter('PENDING');
      await loadData();
    } catch (err: any) {
      showNotification('error', err.message || 'Failed to generate random order');
    } finally {
      setIsGeneratingRandomOrder(false);
    }
  };

  useEffect(() => {
    if (initialSettings) {
      setStoreSettings(initialSettings);
    }
  }, [initialSettings]);

  useEffect(() => {
    loadData();
  }, []);

  const handleSettingsUpdated = (updated: StoreSettings) => {
    setStoreSettings(updated);
    if (onUpdateSettings) {
      onUpdateSettings(updated);
    }
    showNotification('success', `Store brand name updated to "${updated.brandName}"!`);
  };

  const showNotification = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 4000);
  };

  // --- ORDER ACTIONS ---

  const handleAcceptOrder = async (orderId: string) => {
    setActionLoading(`accept-${orderId}`);
    try {
      const res = await api.acceptOrder(orderId);
      showNotification('success', `Order ${orderId} accepted! Stock successfully deducted.`);
      // Refresh all state
      await loadData();
      onRefreshProducts();
    } catch (err: any) {
      showNotification('error', err.message || 'Failed to accept order');
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancelOrder = async (orderId: string) => {
    if (!window.confirm(`Are you sure you want to cancel order ${orderId}? Stock will remain untouched.`)) {
      return;
    }
    setActionLoading(`cancel-${orderId}`);
    try {
      await api.cancelOrder(orderId);
      showNotification('success', `Order ${orderId} cancelled. Stock unchanged.`);
      await loadData();
    } catch (err: any) {
      showNotification('error', err.message || 'Failed to cancel order');
    } finally {
      setActionLoading(null);
    }
  };

  const handleUpdateItemStatus = async (
    orderId: string,
    productId: string,
    variantId: string,
    itemStatus: 'AVAILABLE' | 'PROCESSING' | 'PACKAGING' | 'OUT_OF_STOCK' | 'DELIVERED'
  ) => {
    setActionLoading(`item-status-${orderId}-${variantId}`);
    try {
      const updatedOrder = await api.updateOrderItemStatus(orderId, productId, variantId, itemStatus);
      setOrders(prev => prev.map(o => (o.id === orderId ? updatedOrder : o)));
      showNotification('success', `Item status in Order ${orderId} updated to ${itemStatus}.`);
      onRefreshProducts();
      await loadData();
    } catch (err: any) {
      showNotification('error', err.message || 'Failed to update item status');
    } finally {
      setActionLoading(null);
    }
  };

  // --- ORDER STATUS PROGRESSION (ACCEPTED -> PACKAGING -> OUT_FOR_DELIVERY -> DELIVERED) ---
  const handleUpdateOrderStatus = async (orderId: string, status: OrderStatus) => {
    setActionLoading(`status-${orderId}`);
    try {
      const updatedOrder = await api.updateOrderStatus(orderId, status);
      setOrders(prev => prev.map(o => (o.id === orderId ? updatedOrder : o)));
      if (status === 'DELIVERED') {
        const rev = updatedOrder.finalRevenue ?? (updatedOrder.deliveredRevenue ?? updatedOrder.grandTotal);
        showNotification('success', `Order ${orderId} marked DELIVERED! Automatic revenue of ₹${rev} generated.`);
      } else {
        showNotification('success', `Order ${orderId} moved to ${status}.`);
      }
      await loadData();
    } catch (err: any) {
      showNotification('error', err.message || 'Failed to update order status');
    } finally {
      setActionLoading(null);
    }
  };

  // --- OWNER/ADMIN REVENUE CUSTOMIZATION (AUTOMATIC REVENUE -> OWNER CUSTOMIZATION) ---
  const handleStartEditRevenue = (order: Order) => {
    setEditingRevenueOrderId(order.id);
    const currentRev = order.finalRevenue ?? (order.customRevenue ?? (order.deliveredRevenue ?? order.grandTotal));
    setEditingRevenueValue(String(currentRev));
  };

  const handleSaveRevenue = async (orderId: string) => {
    const val = parseFloat(editingRevenueValue);
    if (isNaN(val) || val < 0) {
      showNotification('error', 'Please enter a valid positive revenue amount (e.g. 450)');
      return;
    }
    setActionLoading(`revenue-${orderId}`);
    try {
      const updatedOrder = await api.updateOrderRevenue(orderId, val);
      setOrders(prev => prev.map(o => (o.id === orderId ? updatedOrder : o)));
      setEditingRevenueOrderId(null);
      showNotification('success', `Saved customized revenue of ₹${updatedOrder.finalRevenue} for Order ${orderId}!`);
      await loadData();
    } catch (err: any) {
      showNotification('error', err.message || 'Failed to save customized revenue');
    } finally {
      setActionLoading(null);
    }
  };

  const handleResetRevenue = async (orderId: string) => {
    setActionLoading(`revenue-${orderId}`);
    try {
      const updatedOrder = await api.updateOrderRevenue(orderId, null);
      setOrders(prev => prev.map(o => (o.id === orderId ? updatedOrder : o)));
      setEditingRevenueOrderId(null);
      showNotification('success', `Revenue for Order ${orderId} reset to automatically generated order value (₹${updatedOrder.finalRevenue}).`);
      await loadData();
    } catch (err: any) {
      showNotification('error', err.message || 'Failed to reset revenue');
    } finally {
      setActionLoading(null);
    }
  };
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setActionLoading('upload-photo');
    try {
      const imageUrl = await api.uploadPhoto(file);
      setProductForm(prev => ({ ...prev, image: imageUrl }));
      showNotification('success', 'Exact photo uploaded and saved successfully!');
    } catch (err: any) {
      showNotification('error', err.message || 'Failed to upload photo');
    } finally {
      setActionLoading(null);
    }
  };

  // --- PRODUCT MANAGEMENT ---

  const handleOpenAddProduct = () => {
    setEditingProduct(null);
    setProductForm({
      name: '',
      tagline: '',
      category: 'Floor Care',
      description: '',
      features: ['Kills 99.9% disease-causing germs', 'Pleasant aroma', 'Safe on tiles and marble'],
      image: '',
      status: 'UPCOMING', // Per specification: default to UPCOMING until admin makes it LIVE
      variants: [
        { size: '250 ML', mrp: 60, sellingPrice: 49, offer: '₹11 OFF', stockQuantity: 20 },
        { size: '500 ML', mrp: 100, sellingPrice: 85, offer: '₹15 OFF', stockQuantity: 15 },
        { size: '1 Litre', mrp: 180, sellingPrice: 149, offer: '₹31 OFF', stockQuantity: 10 },
        { size: '5 Litre', mrp: 700, sellingPrice: 599, offer: '₹101 OFF', stockQuantity: 5 }
      ]
    });
    setIsProductModalOpen(true);
  };

  const handleOpenEditProduct = (prod: Product) => {
    setEditingProduct(prod);
    setProductForm({
      name: prod.name,
      tagline: prod.tagline || '',
      category: prod.category || 'Floor Care',
      description: prod.description || '',
      features: prod.features || [],
      image: prod.image || '',
      status: prod.status,
      variants: prod.variants.map(v => ({
        size: v.size,
        mrp: v.mrp,
        sellingPrice: v.sellingPrice,
        offer: v.offer,
        stockQuantity: v.stockQuantity
      }))
    });
    setIsProductModalOpen(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productForm.name.trim()) {
      showNotification('error', 'Product name is required');
      return;
    }

    setActionLoading('save-product');
    try {
      if (editingProduct) {
        // Update product
        await api.updateProduct(editingProduct.id, {
          name: productForm.name,
          tagline: productForm.tagline,
          category: productForm.category,
          description: productForm.description,
          features: productForm.features,
          image: productForm.image,
          status: productForm.status
        });
        showNotification('success', `Product "${productForm.name}" updated successfully!`);
      } else {
        // Create product
        await api.createProduct({
          name: productForm.name,
          tagline: productForm.tagline,
          category: productForm.category,
          description: productForm.description,
          features: productForm.features,
          image: productForm.image,
          status: productForm.status,
          variants: productForm.variants.map(v => ({
            ...v,
            status: v.stockQuantity > 0 ? 'ACTIVE' : 'OUT_OF_STOCK'
          }))
        });
        showNotification('success', `Product "${productForm.name}" added successfully!`);
      }

      setIsProductModalOpen(false);
      await loadData();
      onRefreshProducts();
    } catch (err: any) {
      showNotification('error', err.message || 'Failed to save product');
    } finally {
      setActionLoading(null);
    }
  };

  const handleQuickStatusChange = async (productId: string, newStatus: ProductStatus) => {
    try {
      await api.updateProduct(productId, { status: newStatus });
      showNotification('success', `Product status set to ${newStatus}`);
      await loadData();
      onRefreshProducts();
    } catch (err: any) {
      showNotification('error', err.message || 'Failed to change status');
    }
  };

  const handleDeleteProduct = async (productId: string, productName: string) => {
    if (!window.confirm(`Are you sure you want to permanently delete "${productName}"?`)) return;
    try {
      await api.deleteProduct(productId);
      showNotification('success', `Product "${productName}" deleted.`);
      await loadData();
      onRefreshProducts();
    } catch (err: any) {
      showNotification('error', err.message || 'Failed to delete product');
    }
  };

  // --- VARIANT & STOCK MANAGEMENT ---

  const handleQuickStockAdjust = async (productId: string, variantId: string, currentStock: number, delta: number) => {
    const newStock = Math.max(0, currentStock + delta);
    try {
      await api.updateVariant(productId, variantId, {
        stockQuantity: newStock,
        status: newStock > 0 ? 'ACTIVE' : 'OUT_OF_STOCK'
      });
      await loadData();
      onRefreshProducts();
    } catch (err: any) {
      showNotification('error', err.message || 'Failed to adjust stock');
    }
  };

  const handleVariantPriceUpdate = async (
    productId: string,
    variantId: string,
    field: 'mrp' | 'sellingPrice' | 'offer' | 'stockQuantity',
    value: string | number
  ) => {
    try {
      const updates: any = {};
      if (field === 'mrp' || field === 'sellingPrice' || field === 'stockQuantity') {
        updates[field] = Number(value) || 0;
      } else {
        updates[field] = String(value);
      }

      await api.updateVariant(productId, variantId, updates);
      await loadData();
      onRefreshProducts();
    } catch (err: any) {
      showNotification('error', err.message || 'Failed to update variant');
    }
  };

  const handleToggleVariantStockStatus = async (
    productId: string,
    variantId: string,
    currentStatus?: string,
    currentStock = 0
  ) => {
    const isCurrentlyOut = currentStatus === 'OUT_OF_STOCK' || currentStock <= 0;
    const newStatus = isCurrentlyOut ? 'ACTIVE' : 'OUT_OF_STOCK';
    const newStock = isCurrentlyOut ? (currentStock > 0 ? currentStock : 10) : 0;

    try {
      await api.updateVariant(productId, variantId, {
        status: newStatus,
        stockQuantity: newStock
      });
      showNotification(
        'success',
        `Variant marked as ${isCurrentlyOut ? 'AVAILABLE (In Stock)' : 'OUT OF STOCK'}`
      );
      await loadData();
      onRefreshProducts();
    } catch (err: any) {
      showNotification('error', err.message || 'Failed to toggle variant status');
    }
  };

  const handleOpenAddVariant = (product: Product) => {
    setEditingVariantProduct(product);
    setEditingVariantTarget(null);
    setVariantForm({
      size: '',
      mrp: 100,
      sellingPrice: 85,
      offer: '₹15 OFF',
      stockQuantity: 10,
      status: 'ACTIVE'
    });
    setIsVariantModalOpen(true);
  };

  const handleOpenEditVariant = (product: Product, variant: Variant) => {
    setEditingVariantProduct(product);
    setEditingVariantTarget(variant);
    setVariantForm({
      size: variant.size,
      mrp: variant.mrp,
      sellingPrice: variant.sellingPrice,
      offer: variant.offer || '',
      stockQuantity: variant.stockQuantity,
      status: variant.status || (variant.stockQuantity > 0 ? 'ACTIVE' : 'OUT_OF_STOCK')
    });
    setIsVariantModalOpen(true);
  };

  const handleSaveVariant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingVariantProduct) return;
    const cleanSize = variantForm.size.trim();
    if (!cleanSize) {
      showNotification('error', 'Size is required (e.g. 250 ML, 500 ML, 1 Litre, 5 Litre)');
      return;
    }

    const normalizedSize = cleanSize.toLowerCase().replace(/\s+/g, '');

    // Duplicate Protection: Do not allow the same Product + same Variant/Size to be created multiple times
    const existingVariant = (editingVariantProduct.variants || []).find(v => {
      if (editingVariantTarget && v.variantId === editingVariantTarget.variantId) {
        return false; // Skip the variant currently being edited
      }
      return v.size.trim().toLowerCase().replace(/\s+/g, '') === normalizedSize;
    });

    if (existingVariant) {
      showNotification('error', 'This variant already exists. Please edit the existing variant instead.');
      return;
    }

    try {
      const numMrp = Number(variantForm.mrp) || 0;
      const numSelling = Number(variantForm.sellingPrice) || 0;
      const numStock = Math.max(0, Number(variantForm.stockQuantity) || 0);
      const computedOffer = variantForm.offer.trim() || (numMrp > numSelling ? `₹${numMrp - numSelling} OFF` : '');

      if (editingVariantTarget) {
        // --- CUSTOMIZE / EDIT EXISTING VARIANT ---
        await api.updateVariant(editingVariantProduct.id, editingVariantTarget.variantId, {
          size: cleanSize,
          mrp: numMrp,
          sellingPrice: numSelling,
          offer: computedOffer,
          stockQuantity: numStock,
          status: numStock > 0 ? (variantForm.status || 'ACTIVE') : 'OUT_OF_STOCK'
        });
        showNotification('success', `Saved changes for ${cleanSize} on ${editingVariantProduct.name}`);
      } else {
        // --- ADD NEW VALID VARIANT ---
        await api.addVariant(editingVariantProduct.id, {
          size: cleanSize,
          mrp: numMrp,
          sellingPrice: numSelling,
          offer: computedOffer,
          stockQuantity: numStock,
          status: numStock > 0 ? (variantForm.status || 'ACTIVE') : 'OUT_OF_STOCK'
        });
        showNotification('success', `Added ${cleanSize} variant to ${editingVariantProduct.name}`);
      }

      setIsVariantModalOpen(false);
      setEditingVariantProduct(null);
      setEditingVariantTarget(null);
      await loadData();
      onRefreshProducts();
    } catch (err: any) {
      showNotification('error', err.message || 'Failed to save variant');
    }
  };

  const handleDeleteVariant = async (productId: string, variantId: string, size: string) => {
    if (!window.confirm(`Delete variant "${size}"?`)) return;
    try {
      await api.deleteVariant(productId, variantId);
      showNotification('success', `Variant ${size} removed`);
      await loadData();
      onRefreshProducts();
    } catch (err: any) {
      showNotification('error', err.message || 'Failed to delete variant');
    }
  };

  const handleZeroStock = async (productId: string, variantId: string, sizeName: string) => {
    if (!window.confirm(`Set stock for "${sizeName}" to 0 (Mark as Out of Stock)?`)) return;
    try {
      await api.updateVariant(productId, variantId, {
        stockQuantity: 0,
        status: 'OUT_OF_STOCK'
      });
      showNotification('success', `Stock for "${sizeName}" reset to 0 (Out of Stock).`);
      await loadData();
      onRefreshProducts();
    } catch (err: any) {
      showNotification('error', err.message || 'Failed to reset stock');
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirmTarget) return;
    const { type, productId, variantId, name } = deleteConfirmTarget;
    try {
      if (type === 'variant' && variantId) {
        await api.deleteVariant(productId, variantId);
        showNotification('success', `Variant "${name}" deleted from inventory.`);
      } else if (type === 'product') {
        await api.deleteProduct(productId);
        showNotification('success', `Product "${name}" and all inventory permanently deleted.`);
      }
      setDeleteConfirmTarget(null);
      await loadData();
      onRefreshProducts();
    } catch (err: any) {
      showNotification('error', err.message || 'Failed to delete');
    }
  };

  const safeOrders = Array.isArray(orders) ? orders : [];
  const filteredOrders = safeOrders.filter(o => {
    if (!o) return false;
    if (orderFilter === 'ALL') return true;
    return o.status === orderFilter;
  });

  const statusCounts = {
    ALL: safeOrders.length,
    PENDING: safeOrders.filter(o => o.status === 'PENDING').length,
    ACCEPTED: safeOrders.filter(o => o.status === 'ACCEPTED').length,
    PACKAGING: safeOrders.filter(o => o.status === 'PACKAGING').length,
    OUT_FOR_DELIVERY: safeOrders.filter(o => o.status === 'OUT_FOR_DELIVERY').length,
    DELIVERED: safeOrders.filter(o => o.status === 'DELIVERED').length,
    CANCELLED: safeOrders.filter(o => o.status === 'CANCELLED').length
  };

  const filteredCustomers = customers.filter(c => {
    if (!customerSearchQuery.trim()) return true;
    const q = customerSearchQuery.toLowerCase().trim();
    return (
      c.name.toLowerCase().includes(q) ||
      c.phone.toLowerCase().includes(q) ||
      c.address.toLowerCase().includes(q) ||
      (c.sourceUrl && c.sourceUrl.toLowerCase().includes(q))
    );
  });

  const safeProducts = Array.isArray(products) ? products : [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Top Banner / Notification */}
      {message && (
        <div
          className={`p-4 rounded-xl border text-xs sm:text-sm font-semibold flex items-center justify-between animate-in fade-in ${
            message.type === 'success'
              ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
              : 'bg-rose-50 text-rose-900 border-rose-300'
          }`}
        >
          <div className="flex items-center gap-2">
            {message.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
            )}
            <span>{message.text}</span>
          </div>
          <button onClick={() => setMessage(null)} className="text-slate-400 hover:text-slate-700">
            Dismiss
          </button>
        </div>
      )}

      {/* Admin Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-slate-900 text-white">
              ADMIN CONTROL
            </span>
            <span className="text-xs text-slate-500">Live Inventory & Order Terminal</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 font-display mt-1 tracking-tight">
            {storeSettings.brandName} Master Operations
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Single shared database powering Customer URL, Main Website & Admin acceptance.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Quick 1 Random Order Generator */}
          <button
            type="button"
            onClick={() => handleCreateRandomOrder()}
            disabled={isGeneratingRandomOrder}
            className="px-3.5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 active:scale-95 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 disabled:opacity-50"
            title="Generate 1 Random Customer Order for testing"
          >
            <Sparkles className={`w-3.5 h-3.5 ${isGeneratingRandomOrder ? 'animate-spin' : ''}`} />
            <span>{isGeneratingRandomOrder ? 'Placing Order...' : '1 Random Order'}</span>
          </button>

          <button
            onClick={loadData}
            disabled={loading}
            className="px-3.5 py-2 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            onClick={handleOpenAddProduct}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Add Product</span>
          </button>
        </div>
      </div>

      {/* Dedicated Public Owner Access Link */}
      <OwnerLinkCard brandName={storeSettings.brandName} />

      {/* Store Brand Name & Tagline Settings (Name Change Input Tag) */}
      <StoreBrandEditor
        settings={storeSettings}
        onUpdateSettings={handleSettingsUpdated}
      />

      {/* Customer Link Generator (Mandatory Automated Customer Front) */}
      <CustomerLinkGenerator
        brandName={storeSettings.brandName}
        onOpenFullGenerator={onOpenGenerator}
      />

      {/* KPI Stats Grid */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
              <span>Total Products</span>
              <Boxes className="w-4 h-4 text-slate-400" />
            </div>
            <div className="text-2xl font-extrabold text-slate-900 font-mono-nums mt-1">
              {stats.totalProducts}
            </div>
            <div className="text-[11px] text-emerald-700 font-semibold mt-1">
              {stats.liveProducts} LIVE · {stats.upcomingProducts} UPCOMING
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
              <span>Total Units in Stock</span>
              <Boxes className="w-4 h-4 text-slate-400" />
            </div>
            <div className="text-2xl font-extrabold text-slate-900 font-mono-nums mt-1">
              {stats.totalStock}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">Across all variants</div>
          </div>

          <div
            className={`p-4 rounded-xl border shadow-xs transition-colors ${
              stats.pendingOrders > 0
                ? 'bg-amber-50/80 border-amber-300'
                : 'bg-white border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between text-slate-600 text-xs font-medium">
              <span>Pending Orders</span>
              <Clock className="w-4 h-4 text-amber-600" />
            </div>
            <div className="text-2xl font-extrabold text-amber-900 font-mono-nums mt-1">
              {stats.pendingOrders}
            </div>
            <div className="text-[11px] text-amber-800 font-bold mt-1">
              {stats.pendingOrders > 0 ? 'Requires Admin Acceptance' : 'Zero pending orders'}
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
              <span className="font-bold text-slate-900 flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-emerald-600" />
                Customers
              </span>
              <span className="px-1.5 py-0.5 text-[9px] font-bold bg-slate-100 text-slate-700 rounded border border-slate-200">
                Owner Only
              </span>
            </div>
            <div className="text-2xl font-extrabold text-slate-900 font-mono-nums mt-1">
              {stats.totalCustomers || customers.length}
            </div>
            <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
              <span>{stats.verifiedCustomers || 0} Verified VIP</span>
              <button
                type="button"
                onClick={() => setActiveTab('customers')}
                className="text-[10px] text-emerald-700 font-bold hover:underline"
              >
                Manage
              </button>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs col-span-2 sm:col-span-1 relative group hover:border-emerald-300 transition-colors">
            <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
              <span className="font-bold text-slate-900 flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-700" />
                Total Revenue
              </span>
              <span className="px-1.5 py-0.5 text-[9px] font-bold bg-emerald-100 text-emerald-800 rounded border border-emerald-200">
                Delivered Orders
              </span>
            </div>
            <div className="text-2xl font-extrabold text-emerald-700 font-mono-nums mt-1">
              ₹{stats.totalSales.toLocaleString()}
            </div>
            <div className="text-[11px] text-emerald-800 font-semibold mt-1 flex items-center justify-between">
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 inline-block animate-pulse" />
                Automatic ({stats.deliveredOrders} {stats.deliveredOrders === 1 ? 'delivered' : 'delivered'})
              </span>
              <button
                type="button"
                onClick={() => setActiveTab('revenue')}
                className="text-[10px] text-emerald-800 font-bold hover:underline"
              >
                View Ledger
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Admin Navigation Tabs */}
      <div className="flex border-b border-slate-200 gap-2 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveTab('orders')}
          className={`py-3 px-4 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'orders'
              ? 'border-emerald-600 text-emerald-900 bg-emerald-50/50 rounded-t-lg'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <ShoppingBag className="w-4 h-4" />
          <span>Customer Orders</span>
          {stats && stats.pendingOrders > 0 && (
            <span className="px-1.5 py-0.2 bg-amber-500 text-white rounded-full text-[10px] font-mono-nums">
              {stats.pendingOrders}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('customers')}
          className={`py-3 px-4 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'customers'
              ? 'border-emerald-600 text-emerald-900 bg-emerald-50/50 rounded-t-lg'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Users className="w-4 h-4 text-emerald-600" />
          <span>Customers (Owner Only)</span>
          <span className="px-1.5 py-0.2 bg-slate-100 text-slate-700 rounded-full text-[10px] font-mono-nums">
            {customers.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('revenue')}
          className={`py-3 px-4 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'revenue'
              ? 'border-emerald-600 text-emerald-900 bg-emerald-50/50 rounded-t-lg'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <TrendingUp className="w-4 h-4 text-emerald-600" />
          <span>Total Revenue (Delivered Orders)</span>
          {stats && (
            <span className="px-1.5 py-0.2 bg-emerald-100 text-emerald-800 rounded-full text-[10px] font-mono-nums font-bold">
              ₹{stats.totalSales.toLocaleString()}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('products')}
          className={`py-3 px-4 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'products'
              ? 'border-emerald-600 text-emerald-900 bg-emerald-50/50 rounded-t-lg'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Boxes className="w-4 h-4" />
          <span>Products & Variant Management</span>
        </button>

        <button
          onClick={() => setActiveTab('stock')}
          className={`py-3 px-4 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'stock'
              ? 'border-emerald-600 text-emerald-900 bg-emerald-50/50 rounded-t-lg'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>Quick Stock & Price Matrix</span>
        </button>
      </div>

      {/* TAB 1: ORDERS MANAGEMENT */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          {/* Order Filter bar */}
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs overflow-x-auto max-w-full">
              {[
                { key: 'ALL', label: 'ALL', id: 'allCount', count: statusCounts.ALL },
                { key: 'PENDING', label: 'PENDING', id: 'pendingCount', count: statusCounts.PENDING },
                { key: 'ACCEPTED', label: 'ACCEPTED', id: 'acceptedCount', count: statusCounts.ACCEPTED },
                { key: 'PACKAGING', label: 'PACKAGING', id: 'packagingCount', count: statusCounts.PACKAGING },
                { key: 'OUT_FOR_DELIVERY', label: 'OUT FOR DELIVERY', id: 'outDeliveryCount', count: statusCounts.OUT_FOR_DELIVERY },
                { key: 'DELIVERED', label: 'DELIVERED', id: 'deliveredCount', count: statusCounts.DELIVERED },
                { key: 'CANCELLED', label: 'CANCELLED', id: 'cancelledCount', count: statusCounts.CANCELLED }
              ].map(item => (
                <button
                  key={item.key}
                  onClick={() => setOrderFilter(item.key as any)}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                    orderFilter === item.key
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <span>{item.label}</span>
                  <span
                    id={item.id}
                    className="font-mono-nums px-1.5 py-0.2 rounded-full bg-slate-200/80 text-[11px] text-slate-800"
                  >
                    {item.count}
                  </span>
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleCreateRandomOrder('TEST_CUSTOMER_ID', 'Test Customer')}
                disabled={isGeneratingRandomOrder}
                className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 shadow-2xs disabled:opacity-50"
                title="Create test order for customer TEST_CUSTOMER_ID"
              >
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                <span>+ Test (TEST_CUSTOMER_ID)</span>
              </button>

              <button
                type="button"
                onClick={() => handleCreateRandomOrder()}
                disabled={isGeneratingRandomOrder}
                className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 shadow-2xs disabled:opacity-50"
                title="Simulate 1 new incoming random customer order"
              >
                <Sparkles className={`w-3.5 h-3.5 text-amber-600 ${isGeneratingRandomOrder ? 'animate-spin' : ''}`} />
                <span>{isGeneratingRandomOrder ? 'Placing Order...' : '+ 1 Random Order'}</span>
              </button>

              <div className="text-xs text-slate-500">
                Showing {filteredOrders.length} {filteredOrders.length === 1 ? 'order' : 'orders'}
              </div>
            </div>
          </div>

          {filteredOrders.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
              <ShoppingBag className="w-10 h-10 mx-auto text-slate-300 mb-2" />
              <h3 className="text-sm font-semibold text-slate-800">No {orderFilter.toLowerCase()} orders</h3>
              <p className="text-xs text-slate-500 mt-1">
                New orders placed via Customer URL or Catalog will appear here in real-time.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredOrders.map(order => {
                const isPending = order.status === 'PENDING';
                const isAccepted = order.status === 'ACCEPTED';
                const isCancelled = order.status === 'CANCELLED';

                return (
                  <div
                    key={order.id}
                    className={`bg-white rounded-2xl border transition-all p-4 sm:p-5 shadow-xs ${
                      isPending ? 'border-amber-300 ring-2 ring-amber-500/10' : 'border-slate-200'
                    }`}
                  >
                    {/* Order Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-extrabold text-slate-900 font-mono-nums">
                            {order.id}
                          </span>
                          {order.status === 'PENDING' && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                              PENDING
                            </span>
                          )}
                          {order.status === 'ACCEPTED' && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-sky-100 text-sky-800 border border-sky-200">
                              ACCEPTED
                            </span>
                          )}
                          {order.status === 'PACKAGING' && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-200">
                              PACKAGING
                            </span>
                          )}
                          {order.status === 'OUT_FOR_DELIVERY' && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">
                              OUT FOR DELIVERY
                            </span>
                          )}
                          {order.status === 'DELIVERED' && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                              DELIVERED
                            </span>
                          )}
                          {order.status === 'CANCELLED' && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                              CANCELLED
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-slate-400 block mt-0.5">
                          {new Date(order.createdAt).toLocaleString()}
                        </span>
                      </div>

                      <div className="text-right">
                        <div className="text-base font-extrabold text-slate-900 font-mono-nums">
                          ₹{order.grandTotal}
                        </div>
                        <span className="text-[11px] text-slate-500">
                          {order.items.reduce((acc, i) => acc + i.quantity, 0)} items
                        </span>
                      </div>
                    </div>

                    {/* Customer Info */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 py-3 text-xs text-slate-600 bg-slate-50/60 rounded-xl px-3 my-3">
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-semibold block">Customer</span>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <strong className="text-slate-900">{order.customerName}</strong>
                          {(() => {
                            const cPhone = (order.customerPhone || '').replace(/[^0-9]/g, '');
                            const matchCust = customers.find(c => (c.phone || '').replace(/[^0-9]/g, '') === cPhone);
                            if (matchCust && (matchCust.deliveredRevenue ?? matchCust.totalSpent ?? 0) > 0) {
                              return (
                                <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200" title="Lifetime Delivered Revenue from this customer">
                                  ₹{(matchCust.deliveredRevenue ?? matchCust.totalSpent ?? 0).toLocaleString()} Rev ({matchCust.deliveredOrders || 0} Del)
                                </span>
                              );
                            }
                            return null;
                          })()}
                        </div>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-semibold block">Phone</span>
                        <span className="font-mono-nums text-slate-900">{order.customerPhone}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-semibold block">Delivery Address</span>
                        <span className="text-slate-900 truncate block" title={order.customerAddress}>
                          {order.customerAddress}
                        </span>
                      </div>
                    </div>

                    {/* Item details with independent item-level status controls */}
                    <div className="space-y-2 text-xs py-1">
                      {order.items.map((item, idx) => (
                        <div
                          key={idx}
                          className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 bg-slate-50 rounded-xl border border-slate-200/80"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-900 truncate">{item.productName}</span>
                              <span className="text-slate-500 text-[11px]">
                                ({item.size} × <strong className="text-slate-900">{item.quantity}</strong>)
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-500 font-mono-nums mt-0.5">
                              @ ₹{item.sellingPrice} · Subtotal:{' '}
                              <strong className="text-slate-900 font-bold">₹{item.subtotal}</strong>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 self-start sm:self-auto">
                            <span className="text-[10px] uppercase font-bold text-slate-400">Item Status:</span>
                            <select
                              value={item.status || 'AVAILABLE'}
                              disabled={order.status === 'DELIVERED' || order.status === 'CANCELLED'}
                              onChange={e =>
                                handleUpdateItemStatus(
                                  order.id,
                                  item.productId,
                                  item.variantId,
                                  e.target.value as any
                                )
                              }
                              className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border focus:outline-none transition-colors ${
                                item.status === 'OUT_OF_STOCK'
                                  ? 'bg-rose-50 text-rose-800 border-rose-300'
                                  : item.status === 'PACKAGING'
                                  ? 'bg-purple-50 text-purple-800 border-purple-300'
                                  : item.status === 'DELIVERED'
                                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                  : 'bg-white text-slate-700 border-slate-300'
                              }`}
                            >
                              <option value="AVAILABLE">AVAILABLE / PROCESSING</option>
                              <option value="PACKAGING">PACKAGING</option>
                              <option value="OUT_OF_STOCK">OUT OF STOCK (Restores)</option>
                              <option value="DELIVERED">DELIVERED</option>
                            </select>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Action Buttons */}
                    <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        {/* WhatsApp Customer Contact Link */}
                        <a
                          href={`https://wa.me/${order.customerPhone.replace(/[^0-9]/g, '')}`}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3 py-1.5 rounded-lg border border-emerald-300 text-emerald-800 hover:bg-emerald-50 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                        >
                          <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Chat on WhatsApp</span>
                        </a>
                      </div>

                      {/* Unified Status Workflow Progression Controls */}
                      <div className="flex flex-wrap items-center gap-2">
                        {order.status === 'PENDING' && (
                          <div className="flex items-center gap-2 w-full sm:w-auto">
                            <button
                              type="button"
                              disabled={actionLoading === `cancel-${order.id}`}
                              onClick={() => handleCancelOrder(order.id)}
                              className="px-3 py-1.5 rounded-xl border border-rose-200 text-rose-700 hover:bg-rose-50 text-xs font-bold transition-colors"
                            >
                              Cancel Order
                            </button>
                            <button
                              type="button"
                              disabled={actionLoading === `accept-${order.id}`}
                              onClick={() => handleAcceptOrder(order.id)}
                              className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 active:scale-98 disabled:opacity-50"
                            >
                              {actionLoading === `accept-${order.id}` ? (
                                <>
                                  <span className="inline-block w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                  <span>Accepting...</span>
                                </>
                              ) : (
                                <>
                                  <CheckCircle2 className="w-4 h-4" />
                                  <span>ACCEPT ORDER</span>
                                </>
                              )}
                            </button>
                          </div>
                        )}

                        {order.status === 'ACCEPTED' && (
                          <button
                            type="button"
                            disabled={actionLoading === `status-${order.id}`}
                            onClick={() => handleUpdateOrderStatus(order.id, 'PACKAGING')}
                            className="px-4 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 active:scale-98 disabled:opacity-50"
                          >
                            <Package className="w-4 h-4" />
                            <span>Move to Packaging →</span>
                          </button>
                        )}

                        {order.status === 'PACKAGING' && (
                          <button
                            type="button"
                            disabled={actionLoading === `status-${order.id}`}
                            onClick={() => handleUpdateOrderStatus(order.id, 'OUT_FOR_DELIVERY')}
                            className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 active:scale-98 disabled:opacity-50"
                          >
                            <Truck className="w-4 h-4" />
                            <span>Dispatch / Out for Delivery →</span>
                          </button>
                        )}

                        {order.status === 'OUT_FOR_DELIVERY' && (
                          <button
                            type="button"
                            disabled={actionLoading === `status-${order.id}`}
                            onClick={() => handleUpdateOrderStatus(order.id, 'DELIVERED')}
                            className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 active:scale-98 disabled:opacity-50"
                          >
                            <CheckCheck className="w-4 h-4" />
                            <span>Mark as Delivered ✓</span>
                          </button>
                        )}

                        {order.status === 'DELIVERED' && (
                          <div className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-200 flex items-center gap-1.5">
                            <CheckCheck className="w-4 h-4 text-emerald-600" />
                            <span>Delivered & Closed</span>
                          </div>
                        )}

                        {/* Owner Manual Payment Status Toggle */}
                        {order.status !== 'PENDING' && order.status !== 'CANCELLED' && (
                          order.paymentStatus === 'PAID' || order.paymentStatus === 'VERIFIED' ? (
                            <button
                              type="button"
                              onClick={() => handleUpdatePaymentStatus(order.id, 'PENDING')}
                              className="px-2.5 py-1 bg-emerald-100 hover:bg-emerald-200 text-emerald-900 border border-emerald-300 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors"
                              title="Click to toggle payment status"
                            >
                              <Check className="w-3.5 h-3.5 text-emerald-700" />
                              <span>Paid & Verified</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleUpdatePaymentStatus(order.id, 'PAID')}
                              className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors"
                              title="Click to mark payment received"
                            >
                              <Clock className="w-3.5 h-3.5 text-amber-600" />
                              <span>Mark Paid</span>
                            </button>
                          )
                        )}

                        {/* Direct Unified Status Selector Dropdown */}
                        <div className="flex items-center gap-1.5 ml-auto">
                          <span className="text-[10px] text-slate-400 font-bold uppercase">Status:</span>
                          <select
                            value={order.status}
                            disabled={actionLoading === `status-${order.id}`}
                            onChange={e => handleUpdateOrderStatus(order.id, e.target.value as OrderStatus)}
                            className="px-2.5 py-1 text-xs font-bold rounded-lg border border-slate-300 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-2xs"
                          >
                            <option value="PENDING">1. PENDING</option>
                            <option value="ACCEPTED">2. ACCEPTED</option>
                            <option value="PACKAGING">3. PACKAGING</option>
                            <option value="OUT_FOR_DELIVERY">4. OUT FOR DELIVERY</option>
                            <option value="DELIVERED">5. DELIVERED</option>
                            <option value="CANCELLED">CANCELLED</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: PRODUCTS & VARIANT MANAGEMENT */}
      {activeTab === 'products' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
              {storeSettings.brandName} Product Catalog ({safeProducts.length})
            </h2>
            <button
              onClick={handleOpenAddProduct}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add New Product</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {safeProducts.map(product => (
              <div
                key={product.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between"
              >
                <div>
                  {/* Top info and status selector */}
                  <div className="flex items-start gap-4">
                    <div className="w-18 h-18 rounded-xl bg-slate-50 border border-slate-200 p-1 shrink-0 flex items-center justify-center overflow-hidden">
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-full h-full object-contain"
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-[11px] font-semibold text-slate-500 uppercase">
                          {product.category}
                        </span>
                        {/* Status Dropdown */}
                        <select
                          value={product.status}
                          onChange={e =>
                            handleQuickStatusChange(product.id, e.target.value as ProductStatus)
                          }
                          className={`text-[11px] font-bold px-2 py-0.5 rounded border focus:outline-none ${
                            product.status === 'LIVE'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                              : product.status === 'UPCOMING'
                              ? 'bg-amber-50 text-amber-800 border-amber-300'
                              : product.status === 'OUT_OF_STOCK'
                              ? 'bg-rose-50 text-rose-800 border-rose-300'
                              : 'bg-slate-100 text-slate-600 border-slate-300'
                          }`}
                        >
                          <option value="LIVE">LIVE (Orderable)</option>
                          <option value="UPCOMING">UPCOMING (Coming Soon)</option>
                          <option value="OUT_OF_STOCK">OUT_OF_STOCK</option>
                          <option value="INACTIVE">INACTIVE (Hidden)</option>
                        </select>
                      </div>

                      <h3 className="text-base font-bold text-slate-900 truncate mt-0.5">
                        {product.name}
                      </h3>
                      <p className="text-xs text-slate-500 line-clamp-1">{product.tagline}</p>
                    </div>
                  </div>

                  {/* Variants List */}
                  <div className="mt-4 pt-3 border-t border-slate-100">
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-600 mb-2">
                      <span>Variants & Stock ({product.variants.length})</span>
                      <button
                        type="button"
                        onClick={() => handleOpenAddVariant(product)}
                        className="text-emerald-700 hover:text-emerald-800 text-[11px] font-bold flex items-center gap-1"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Add Size</span>
                      </button>
                    </div>

                    <div className="space-y-2">
                      {product.variants.map(variant => (
                        <div
                          key={variant.variantId}
                          className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs flex items-center justify-between gap-2"
                        >
                          <div>
                            <div className="font-bold text-slate-900 flex items-center gap-1.5">
                              <span>{variant.size}</span>
                              <span className="text-[10px] text-slate-400 font-normal">
                                (Sold: {variant.soldQuantity || 0})
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-2">
                              <span>
                                MRP: <span className="line-through font-mono-nums">₹{variant.mrp}</span>
                              </span>
                              <span>
                                Sell:{' '}
                                <strong className="text-slate-900 font-mono-nums">
                                  ₹{variant.sellingPrice}
                                </strong>
                              </span>
                              {variant.offer && (
                                <span className="text-emerald-700 font-semibold">{variant.offer}</span>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            {/* Stock Stepper */}
                            <div className="flex items-center border border-slate-300 rounded bg-white p-0.5">
                              <button
                                type="button"
                                onClick={() =>
                                  handleQuickStockAdjust(
                                    product.id,
                                    variant.variantId,
                                    variant.stockQuantity,
                                    -1
                                  )
                                }
                                className="w-5 h-5 flex items-center justify-center text-slate-600 hover:bg-slate-100 rounded text-xs font-bold"
                              >
                                -
                              </button>
                              <span className="w-7 text-center font-mono-nums font-bold text-slate-900">
                                {variant.stockQuantity}
                              </span>
                              <button
                                type="button"
                                onClick={() =>
                                  handleQuickStockAdjust(
                                    product.id,
                                    variant.variantId,
                                    variant.stockQuantity,
                                    1
                                  )
                                }
                                className="w-5 h-5 flex items-center justify-center text-slate-600 hover:bg-slate-100 rounded text-xs font-bold"
                              >
                                +
                              </button>
                            </div>

                            {/* Customize / Edit Variant */}
                            <button
                              type="button"
                              onClick={() => handleOpenEditVariant(product, variant)}
                              className="text-slate-400 hover:text-emerald-700 p-1 rounded hover:bg-emerald-50 transition-colors"
                              title={`Customize / Edit ${variant.size} (Stock, Price, MRP, Offer)`}
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>

                            {/* Delete Variant */}
                            <button
                              type="button"
                              onClick={() =>
                                setDeleteConfirmTarget({
                                  type: 'variant',
                                  productId: product.id,
                                  variantId: variant.variantId,
                                  name: `${product.name} (${variant.size})`
                                })
                              }
                              className="text-slate-400 hover:text-rose-600 p-1 rounded hover:bg-rose-50 transition-colors"
                              title={`Delete ${variant.size} variant`}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400 font-mono">ID: {product.id}</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleOpenEditProduct(product)}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold flex items-center gap-1"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Edit Details</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteProduct(product.id, product.name)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                      title="Delete Product"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: QUICK STOCK & PRICE MATRIX / INVENTORY EDITOR */}
      {activeTab === 'stock' && (() => {
        const totalVariants = safeProducts.reduce((acc, p) => acc + (p.variants?.length || 0), 0);
        const outOfStockVariants = safeProducts.reduce(
          (acc, p) => acc + (p.variants || []).filter(v => v.status === 'OUT_OF_STOCK' || v.stockQuantity === 0).length,
          0
        );
        const totalStockUnits = safeProducts.reduce(
          (acc, p) => acc + (p.variants || []).reduce((sum, v) => sum + (v.stockQuantity || 0), 0),
          0
        );

        const filteredStockProducts = safeProducts.filter(prod => {
          if (!stockSearchQuery.trim()) return true;
          const q = stockSearchQuery.toLowerCase().trim();
          const nameMatch = prod.name ? prod.name.toLowerCase().includes(q) : false;
          const catMatch = prod.category ? prod.category.toLowerCase().includes(q) : false;
          const variantMatch = Array.isArray(prod.variants) && prod.variants.some(v => v.size && v.size.toLowerCase().includes(q));
          return nameMatch || catMatch || variantMatch;
        });

        return (
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                    INVENTORY EDITOR
                  </span>
                  <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                    Variant Stock, Price & Delete Controller
                  </h2>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Edit MRP, selling prices, and live stock. Delete discontinued packaging sizes or zero-out inventory in one click.
                </p>
              </div>

              {/* Inventory Summary KPIs */}
              <div className="flex items-center gap-2 flex-wrap">
                <div className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                  <span className="text-[10px] text-slate-400 block font-semibold uppercase">Total Sizes</span>
                  <strong className="text-slate-900 font-mono-nums">{totalVariants} variants</strong>
                </div>
                <div className="px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs">
                  <span className="text-[10px] text-emerald-600 block font-semibold uppercase">Stock on Hand</span>
                  <strong className="text-emerald-800 font-mono-nums">{totalStockUnits} units</strong>
                </div>
                <div className="px-3 py-1.5 rounded-xl bg-rose-50 border border-rose-200 text-xs">
                  <span className="text-[10px] text-rose-600 block font-semibold uppercase">Out of Stock</span>
                  <strong className="text-rose-800 font-mono-nums">{outOfStockVariants} sizes</strong>
                </div>
              </div>
            </div>

            {/* Search Filter Bar */}
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="relative flex-1 min-w-[260px] max-w-md">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={stockSearchQuery}
                  onChange={e => setStockSearchQuery(e.target.value)}
                  placeholder="Filter by product name, category, or size (e.g. 5L, Floor, 250ml)..."
                  className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-colors"
                />
              </div>

              {stockSearchQuery && (
                <button
                  type="button"
                  onClick={() => setStockSearchQuery('')}
                  className="text-xs text-slate-500 hover:text-slate-800 underline font-medium"
                >
                  Clear filter ({filteredStockProducts.length} products found)
                </button>
              )}
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[10px]">
                    <th className="py-2.5 px-3">Product Name & Master Actions</th>
                    <th className="py-2.5 px-3">Variant / Size</th>
                    <th className="py-2.5 px-3">MRP (₹)</th>
                    <th className="py-2.5 px-3">Selling Price (₹)</th>
                    <th className="py-2.5 px-3">Offer Label</th>
                    <th className="py-2.5 px-3">Current Stock</th>
                    <th className="py-2.5 px-3">Availability Status</th>
                    <th className="py-2.5 px-3">Quick Stock Adjust</th>
                    <th className="py-2.5 px-3 text-right">Sold Qty</th>
                    <th className="py-2.5 px-3 text-center">Delete / Reset</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredStockProducts.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="py-8 text-center text-slate-400">
                        No inventory matching &quot;{stockSearchQuery}&quot;. Clear filter to view all products.
                      </td>
                    </tr>
                  ) : (
                    filteredStockProducts.flatMap(prod => {
                      const variants = Array.isArray(prod?.variants) && prod.variants.length > 0 ? prod.variants : [];
                      if (variants.length === 0) {
                        return (
                          <tr key={`${prod.id}-empty`} className="hover:bg-slate-50/70">
                            <td className="py-3 px-3 font-bold text-slate-900 align-top border-r border-slate-100 bg-slate-50/40">
                              <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-amber-500" />
                                <span>{prod.name}</span>
                              </div>
                              <span className="text-[10px] text-slate-400 block ml-4">
                                {prod.category} · No sizes defined
                              </span>
                              <div className="mt-2.5 pt-2 border-t border-slate-200 flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleOpenAddVariant(prod)}
                                  className="text-[11px] text-emerald-700 hover:text-emerald-800 font-bold flex items-center gap-0.5 hover:underline"
                                >
                                  <Plus className="w-3 h-3" />
                                  <span>Add Size</span>
                                </button>
                                <span className="text-slate-300">·</span>
                                <button
                                  type="button"
                                  onClick={() => setDeleteConfirmTarget({
                                    type: 'product',
                                    productId: prod.id,
                                    name: prod.name
                                  })}
                                  className="text-[11px] text-rose-600 hover:text-rose-700 font-semibold flex items-center gap-0.5 hover:underline"
                                >
                                  <Trash2 className="w-3 h-3" />
                                  <span>Delete Product</span>
                                </button>
                              </div>
                            </td>
                            <td colSpan={8} className="py-3 px-3 text-slate-400 italic">
                              No packaging sizes defined yet. Click &quot;Add Size&quot; to configure variants.
                            </td>
                            <td className="py-3 px-3 text-center">
                              <button
                                type="button"
                                onClick={() => setDeleteConfirmTarget({
                                  type: 'product',
                                  productId: prod.id,
                                  name: prod.name
                                })}
                                className="p-1.5 rounded-lg border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-600 shadow-2xs"
                                title="Delete this empty product"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        );
                      }

                      return variants.map((v, idx) => (
                        <tr key={`${prod.id}-${v.variantId}`} className="hover:bg-slate-50/70">
                          {idx === 0 ? (
                            <td
                              rowSpan={variants.length}
                              className="py-3 px-3 font-bold text-slate-900 align-top border-r border-slate-100 bg-slate-50/40"
                            >
                              <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                                <span>{prod.name}</span>
                              </div>
                              <span className="text-[10px] text-slate-400 block ml-4">
                                {prod.category} · {variants.length} {variants.length === 1 ? 'size' : 'sizes'}
                              </span>
                              <div className="mt-2.5 pt-2 border-t border-slate-200 flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleOpenAddVariant(prod)}
                                  className="text-[11px] text-emerald-700 hover:text-emerald-800 font-bold flex items-center gap-0.5 hover:underline"
                                >
                                  <Plus className="w-3 h-3" />
                                  <span>Add Size</span>
                                </button>
                                <span className="text-slate-300">·</span>
                                <button
                                  type="button"
                                  onClick={() => setDeleteConfirmTarget({
                                    type: 'product',
                                    productId: prod.id,
                                    name: prod.name
                                  })}
                                  className="text-[11px] text-rose-600 hover:text-rose-700 font-semibold flex items-center gap-0.5 hover:underline"
                                  title="Delete product and all its inventory variants"
                                >
                                  <Trash2 className="w-3 h-3" />
                                  <span>Delete Product</span>
                                </button>
                              </div>
                            </td>
                          ) : null}

                          <td className="py-3 px-3 font-semibold text-slate-800">{v.size}</td>

                          <td className="py-3 px-3">
                            <input
                              type="number"
                              defaultValue={v.mrp}
                              onBlur={e =>
                                handleVariantPriceUpdate(prod.id, v.variantId, 'mrp', e.target.value)
                              }
                              className="w-18 px-2 py-1 border border-slate-200 rounded font-mono-nums focus:outline-none focus:border-emerald-600"
                            />
                          </td>

                          <td className="py-3 px-3">
                            <input
                              type="number"
                              defaultValue={v.sellingPrice}
                              onBlur={e =>
                                handleVariantPriceUpdate(
                                  prod.id,
                                  v.variantId,
                                  'sellingPrice',
                                  e.target.value
                                )
                              }
                              className="w-18 px-2 py-1 border border-slate-200 rounded font-mono-nums font-bold text-emerald-700 focus:outline-none focus:border-emerald-600"
                            />
                          </td>

                          <td className="py-3 px-3">
                            <input
                              type="text"
                              defaultValue={v.offer}
                              onBlur={e =>
                                handleVariantPriceUpdate(prod.id, v.variantId, 'offer', e.target.value)
                              }
                              className="w-24 px-2 py-1 border border-slate-200 rounded text-[11px] focus:outline-none focus:border-emerald-600"
                            />
                          </td>

                          <td className="py-3 px-3">
                            <span
                              className={`font-mono-nums font-bold px-2 py-0.5 rounded ${
                                v.stockQuantity === 0
                                  ? 'bg-rose-100 text-rose-800'
                                  : v.stockQuantity < 5
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-emerald-100 text-emerald-800'
                              }`}
                            >
                              {v.stockQuantity} units
                            </span>
                          </td>

                          <td className="py-3 px-3">
                            <button
                              type="button"
                              onClick={() =>
                                handleToggleVariantStockStatus(
                                  prod.id,
                                  v.variantId,
                                  v.status,
                                  v.stockQuantity
                                )
                              }
                              className={`px-2.5 py-1 rounded text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 whitespace-nowrap ${
                                v.status === 'OUT_OF_STOCK' || v.stockQuantity === 0
                                  ? 'bg-rose-100 text-rose-800 border border-rose-300 hover:bg-rose-200'
                                  : 'bg-emerald-100 text-emerald-800 border border-emerald-300 hover:bg-emerald-200'
                              }`}
                              title="Click to toggle OUT OF STOCK / AVAILABLE"
                            >
                              <span
                                className={`w-2 h-2 rounded-full ${
                                  v.status === 'OUT_OF_STOCK' || v.stockQuantity === 0
                                    ? 'bg-rose-600'
                                    : 'bg-emerald-600 animate-pulse'
                                }`}
                              />
                              <span>
                                {v.status === 'OUT_OF_STOCK' || v.stockQuantity === 0
                                  ? 'OUT OF STOCK'
                                  : 'AVAILABLE'}
                              </span>
                            </button>
                          </td>

                          <td className="py-3 px-3">
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() =>
                                  handleQuickStockAdjust(prod.id, v.variantId, v.stockQuantity, -5)
                                }
                                className="px-1.5 py-0.5 bg-slate-100 hover:bg-slate-200 rounded text-[11px] font-semibold text-slate-700"
                              >
                                -5
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  handleQuickStockAdjust(prod.id, v.variantId, v.stockQuantity, -1)
                                }
                                className="px-1.5 py-0.5 bg-slate-100 hover:bg-slate-200 rounded text-[11px] font-semibold text-slate-700"
                              >
                                -1
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  handleQuickStockAdjust(prod.id, v.variantId, v.stockQuantity, +1)
                                }
                                className="px-1.5 py-0.5 bg-slate-100 hover:bg-slate-200 rounded text-[11px] font-semibold text-slate-700"
                              >
                                +1
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  handleQuickStockAdjust(prod.id, v.variantId, v.stockQuantity, +5)
                                }
                                className="px-1.5 py-0.5 bg-slate-100 hover:bg-slate-200 rounded text-[11px] font-semibold text-slate-700"
                              >
                                +5
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  handleQuickStockAdjust(prod.id, v.variantId, v.stockQuantity, +10)
                                }
                                className="px-1.5 py-0.5 bg-slate-100 hover:bg-slate-200 rounded text-[11px] font-semibold text-slate-700"
                              >
                                +10
                              </button>
                            </div>
                          </td>

                          <td className="py-3 px-3 text-right font-mono-nums text-slate-500">
                            {v.soldQuantity || 0}
                          </td>

                          {/* CUSTOMIZE, ZERO & DELETE OPTIONS */}
                          <td className="py-3 px-3 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              {/* Customize / Edit Variant Button */}
                              <button
                                type="button"
                                onClick={() => handleOpenEditVariant(prod, v)}
                                className="px-2.5 py-1 rounded-lg border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-[11px] font-bold flex items-center gap-1 transition-colors shadow-2xs"
                                title={`Customize / Edit ${v.size} (Stock, Price, MRP, Offer)`}
                              >
                                <Edit2 className="w-3 h-3 text-emerald-600" />
                                <span>Edit</span>
                              </button>

                              {/* Zero-Out Stock Button */}
                              <button
                                type="button"
                                onClick={() => handleZeroStock(prod.id, v.variantId, `${prod.name} (${v.size})`)}
                                disabled={v.stockQuantity === 0}
                                className="p-1.5 rounded-lg border border-slate-200 hover:border-amber-400 hover:bg-amber-50 text-slate-400 hover:text-amber-700 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                                title="Reset stock to 0 (Mark Out of Stock)"
                              >
                                <Ban className="w-3.5 h-3.5" />
                              </button>

                              {/* Delete Variant Button */}
                              <button
                                type="button"
                                onClick={() => setDeleteConfirmTarget({
                                  type: 'variant',
                                  productId: prod.id,
                                  variantId: v.variantId,
                                  name: `${prod.name} (${v.size})`
                                })}
                                className="p-1.5 rounded-lg border border-rose-200 bg-rose-50/60 hover:bg-rose-100 text-rose-600 hover:text-rose-700 transition-colors shadow-2xs"
                                title={`Delete "${v.size}" variant from inventory`}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ));
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        );
      })()}

      {/* TAB 4: CUSTOMERS DIRECTORY (OWNER ONLY) */}
      {activeTab === 'customers' && (
        <div className="space-y-6 animate-fade-in">
          {/* Header Card */}
          <div className="bg-gradient-to-r from-slate-900 to-emerald-950 p-6 rounded-2xl text-white flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase tracking-wider flex items-center gap-1">
                  <Lock className="w-3 h-3 text-emerald-400" />
                  Owner Eyes Only • Confidential
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight font-display">
                Customers Directory
              </h2>
              <p className="text-slate-300 text-xs sm:text-sm">
                Complete list of client contacts, WhatsApp numbers, total orders placed, and lifetime spend. Customers never see this information.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/15 text-center min-w-[90px]">
                <div className="text-2xl font-extrabold text-white font-mono-nums">
                  {customers.length}
                </div>
                <div className="text-[10px] uppercase font-bold text-slate-300">
                  Total Clients
                </div>
              </div>
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/15 text-center min-w-[90px]">
                <div className="text-2xl font-extrabold text-emerald-300 font-mono-nums">
                  {customers.filter(c => c.verified).length}
                </div>
                <div className="text-[10px] uppercase font-bold text-emerald-200">
                  Verified VIPs
                </div>
              </div>
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/15 text-center min-w-[110px]">
                <div className="text-2xl font-extrabold text-emerald-300 font-mono-nums">
                  ₹{customers.reduce((sum, c) => sum + (c.deliveredRevenue ?? c.totalSpent ?? 0), 0).toLocaleString()}
                </div>
                <div className="text-[10px] uppercase font-bold text-emerald-200">
                  Order Revenue
                </div>
              </div>
            </div>
          </div>

          {/* Search & Filter Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={customerSearchQuery}
                onChange={e => setCustomerSearchQuery(e.target.value)}
                placeholder="Search by customer name, phone number, address..."
                className="w-full pl-9 pr-3 py-2 text-xs bg-white rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
              />
            </div>

            <div className="text-xs text-slate-500 font-medium">
              Showing {filteredCustomers.length} customer records · Sorted by Delivered Order Revenue
            </div>
          </div>

          {/* Customers Table */}
          {filteredCustomers.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
              <Users className="w-10 h-10 mx-auto text-slate-300 mb-2" />
              <h3 className="text-sm font-semibold text-slate-800">No customers found</h3>
              <p className="text-xs text-slate-500 mt-1">
                {customerSearchQuery ? 'No customers match your search.' : 'When clients order via your public links, their contact details and order history will automatically appear here for the owner.'}
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="py-3 px-4">Customer Name</th>
                      <th className="py-3 px-4">WhatsApp / Phone</th>
                      <th className="py-3 px-4">Delivery Address</th>
                      <th className="py-3 px-4 text-center">Orders</th>
                      <th className="py-3 px-4 text-right">Delivered Order Revenue</th>
                      <th className="py-3 px-4 text-center">VIP Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredCustomers.map(cust => (
                      <tr key={cust.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4 font-semibold text-slate-900">
                          {cust.name}
                          {cust.sourceUrl && (
                            <span className="block text-[10px] text-slate-400 font-mono">
                              Ref: {cust.sourceUrl}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 font-mono-nums text-slate-700">
                          {cust.phone}
                        </td>
                        <td className="py-3 px-4 text-slate-600 max-w-xs truncate" title={cust.address}>
                          {cust.address}
                        </td>
                        <td className="py-3 px-4 text-center font-mono-nums">
                          <span className="font-bold text-slate-900">{cust.totalOrders} total</span>
                          <span className="block text-[10px] text-emerald-700 font-semibold">
                            {cust.deliveredOrders || 0} delivered
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="font-mono-nums font-extrabold text-emerald-700 text-sm">
                            ₹{(cust.deliveredRevenue ?? cust.totalSpent ?? 0).toLocaleString()}
                          </div>
                          <span className="text-[10px] text-slate-400 font-medium">Delivered Revenue</span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <button
                            type="button"
                            onClick={() => handleToggleCustomerVerified(cust.id)}
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold border transition-colors inline-flex items-center gap-1 ${
                              cust.verified
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                                : 'bg-slate-100 text-slate-600 border-slate-300 hover:bg-slate-200'
                            }`}
                          >
                            {cust.verified ? (
                              <>
                                <UserCheck className="w-3 h-3 text-emerald-600" />
                                <span>Verified VIP</span>
                              </>
                            ) : (
                              <>
                                <UserX className="w-3 h-3 text-slate-400" />
                                <span>Standard</span>
                              </>
                            )}
                          </button>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <a
                              href={`https://wa.me/${cust.phone.replace(/[^0-9]/g, '')}`}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1.5 hover:bg-emerald-50 text-emerald-700 rounded transition-colors"
                              title="Message on WhatsApp"
                            >
                              <MessageCircle className="w-4 h-4" />
                            </a>
                            <button
                              type="button"
                              onClick={() => {
                                const url = `${window.location.origin}/order?ref=${encodeURIComponent(cust.name.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase())}`;
                                navigator.clipboard.writeText(url);
                                showNotification('success', `Copied personal order link for ${cust.name}!`);
                              }}
                              className="p-1.5 hover:bg-slate-100 text-slate-600 rounded transition-colors"
                              title="Copy Personal Order Link"
                            >
                              <Copy className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-slate-50 border-t-2 border-slate-200 font-bold text-slate-900">
                    <tr>
                      <td colSpan={4} className="py-3 px-4 text-right uppercase tracking-wider text-[11px] text-slate-600">
                        Total Customer Delivered Revenue:
                      </td>
                      <td className="py-3 px-4 text-right font-mono-nums font-black text-emerald-700 text-sm">
                        ₹{customers.reduce((sum, c) => sum + (c.deliveredRevenue ?? c.totalSpent ?? 0), 0).toLocaleString()}
                      </td>
                      <td colSpan={2}></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 5: TOTAL REVENUE (AUTOMATIC ORDER DELIVERED LEDGER) */}
      {activeTab === 'revenue' && (
        <div className="space-y-6 animate-fade-in">
          {/* Header Card */}
          <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 p-6 sm:p-8 rounded-3xl text-white shadow-xl relative overflow-hidden">
            <div className="relative z-10 space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold border border-emerald-500/30">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                Automatic Order-Based Revenue • Zero Duplicates Guaranteed
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight font-display">
                Total Revenue & Delivered Orders Ledger
              </h2>
              <p className="text-slate-300 text-xs sm:text-sm max-w-2xl leading-relaxed">
                Total Revenue is <strong>automatically generated ONLY when an order becomes Delivered</strong>. 
                Pending, Confirmed, Packaging, and Out-for-Delivery orders contribute ₹0 until delivery is verified. 
                Every transaction uses the customer's <strong>locked checkout total</strong> and is permanently protected against duplicate counting.
              </p>
            </div>
          </div>

          {/* KPI Dashboard Metrics (Requirement 7) */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {/* Total Revenue */}
            <div className="bg-white p-5 rounded-2xl border-2 border-emerald-500 shadow-sm relative overflow-hidden">
              <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
                <span className="font-bold text-slate-900 flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-emerald-600" />
                  Total Revenue
                </span>
                <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-100 text-emerald-800 rounded-full">
                  Delivered Only
                </span>
              </div>
              <div className="text-3xl font-black text-emerald-700 font-mono-nums mt-2">
                ₹{stats?.totalSales.toLocaleString() || '0'}
              </div>
              <div className="text-[11px] text-emerald-800 font-semibold mt-1 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse" />
                Sum of {stats?.deliveredOrders || 0} delivered orders
              </div>
            </div>

            {/* Delivered Orders */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
                <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Delivered Orders
                </span>
              </div>
              <div className="text-3xl font-black text-slate-900 font-mono-nums mt-2">
                {stats?.deliveredOrders || 0}
              </div>
              <div className="text-[11px] text-emerald-700 font-semibold mt-1">
                Active revenue contributors
              </div>
            </div>

            {/* Total Orders */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
                <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                  <ShoppingBag className="w-4 h-4 text-slate-600" />
                  Total Orders
                </span>
              </div>
              <div className="text-3xl font-black text-slate-900 font-mono-nums mt-2">
                {stats?.totalOrders || orders.length}
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                Lifetime customer orders
              </div>
            </div>

            {/* Pending Orders */}
            <div className={`p-5 rounded-2xl border shadow-xs transition-colors ${
              (stats?.pendingOrders || 0) > 0 ? 'bg-amber-50/70 border-amber-300' : 'bg-white border-slate-200'
            }`}>
              <div className="flex items-center justify-between text-slate-600 text-xs font-medium">
                <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-amber-600" />
                  Pending Orders
                </span>
              </div>
              <div className="text-3xl font-black text-amber-900 font-mono-nums mt-2">
                {stats?.pendingOrders || 0}
              </div>
              <div className="text-[11px] text-amber-800 font-semibold mt-1">
                ₹0 Revenue (Awaiting Delivery)
              </div>
            </div>

            {/* Cancelled Orders */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
                <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                  <XCircle className="w-4 h-4 text-rose-500" />
                  Cancelled Orders
                </span>
              </div>
              <div className="text-3xl font-black text-slate-900 font-mono-nums mt-2">
                {stats?.cancelledOrders || 0}
              </div>
              <div className="text-[11px] text-slate-400 mt-1">
                ₹0 Revenue (Stock Restored)
              </div>
            </div>
          </div>

          {/* Traceable Delivered Revenue Transactions Ledger (Requirement 6) */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 uppercase tracking-wider">
                    Traceable Ledger
                  </span>
                  <h3 className="text-base font-bold text-slate-900 font-display">
                    {revenueSubView === 'orders' ? 'Order-by-Order Revenue Transactions' : 'Customer Revenue Breakdown'}
                  </h3>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  {revenueSubView === 'orders'
                    ? 'Every delivered order is uniquely recorded. Total Revenue = Sum of all valid delivered transactions.'
                    : 'Delivered revenue contributed by each client. Trace lifetime financial value and revenue share per customer.'}
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs">
                  <button
                    type="button"
                    onClick={() => setRevenueSubView('orders')}
                    className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
                      revenueSubView === 'orders'
                        ? 'bg-white text-emerald-800 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <ShoppingBag className="w-3.5 h-3.5" />
                    <span>Orders</span>
                    <span className="px-1.5 py-0.2 bg-emerald-100 text-emerald-800 rounded-full text-[10px] font-mono-nums">
                      {revenueTransactions.length > 0 ? revenueTransactions.length : orders.filter(o => o.status === 'DELIVERED').length}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setRevenueSubView('customers')}
                    className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
                      revenueSubView === 'customers'
                        ? 'bg-white text-emerald-800 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Users className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Customers</span>
                    <span className="px-1.5 py-0.2 bg-emerald-100 text-emerald-800 rounded-full text-[10px] font-mono-nums">
                      {customers.filter(c => (c.deliveredRevenue ?? c.totalSpent ?? 0) > 0).length}
                    </span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={loadData}
                  disabled={loading}
                  className="px-3 py-1.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                  <span>Refresh</span>
                </button>
              </div>
            </div>

            {/* VIEW 1: CUSTOMERS REVENUE BREAKDOWN */}
            {revenueSubView === 'customers' && (
              <div>
                {customers.filter(c => (c.deliveredRevenue ?? c.totalSpent ?? 0) > 0).length === 0 ? (
                  <div className="py-12 text-center text-slate-400">
                    <Users className="w-12 h-12 mx-auto text-slate-300 mb-2 stroke-1" />
                    <h4 className="text-sm font-bold text-slate-700">No Customer Revenue Recorded Yet</h4>
                    <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                      When customer orders are marked as Delivered, their revenue contribution will appear here.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                        <tr>
                          <th className="py-3 px-4">Customer Name</th>
                          <th className="py-3 px-4">WhatsApp / Phone</th>
                          <th className="py-3 px-4 text-center">Total Orders</th>
                          <th className="py-3 px-4 text-center">Delivered Orders</th>
                          <th className="py-3 px-4 text-right">Delivered Revenue</th>
                          <th className="py-3 px-4 text-center">Revenue Share</th>
                          <th className="py-3 px-4 text-center">VIP Status</th>
                          <th className="py-3 px-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {customers
                          .filter(c => (c.deliveredRevenue ?? c.totalSpent ?? 0) > 0 || c.totalOrders > 0)
                          .sort((a, b) => (b.deliveredRevenue ?? b.totalSpent ?? 0) - (a.deliveredRevenue ?? a.totalSpent ?? 0))
                          .map(cust => {
                            const rev = cust.deliveredRevenue ?? cust.totalSpent ?? 0;
                            const totalRev = stats?.totalSales || 1;
                            const share = totalRev > 0 ? ((rev / totalRev) * 100).toFixed(1) : '0';
                            return (
                              <tr key={cust.id} className="hover:bg-slate-50/80 transition-colors">
                                <td className="py-3 px-4 font-semibold text-slate-900">
                                  {cust.name}
                                  {cust.sourceUrl && (
                                    <span className="block text-[10px] text-slate-400 font-mono">
                                      Ref: {cust.sourceUrl}
                                    </span>
                                  )}
                                </td>
                                <td className="py-3 px-4 font-mono-nums text-slate-700">
                                  {cust.phone}
                                </td>
                                <td className="py-3 px-4 text-center font-mono-nums font-bold text-slate-800">
                                  {cust.totalOrders}
                                </td>
                                <td className="py-3 px-4 text-center">
                                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                    {cust.deliveredOrders || 0} Delivered
                                  </span>
                                </td>
                                <td className="py-3 px-4 text-right font-mono-nums font-black text-emerald-700 text-sm">
                                  ₹{rev.toLocaleString()}
                                </td>
                                <td className="py-3 px-4 text-center font-mono-nums text-slate-600 font-semibold">
                                  {rev > 0 ? `${share}%` : '0%'}
                                </td>
                                <td className="py-3 px-4 text-center">
                                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                    cust.verified
                                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-300'
                                      : 'bg-slate-100 text-slate-600'
                                  }`}>
                                    {cust.verified ? 'VIP' : 'Standard'}
                                  </span>
                                </td>
                                <td className="py-3 px-4 text-right">
                                  <div className="flex items-center justify-end gap-1.5">
                                    <a
                                      href={`https://wa.me/${cust.phone.replace(/[^0-9]/g, '')}`}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="p-1.5 hover:bg-emerald-50 text-emerald-700 rounded transition-colors"
                                      title="Message on WhatsApp"
                                    >
                                      <MessageCircle className="w-4 h-4" />
                                    </a>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const url = `${window.location.origin}/order?ref=${encodeURIComponent(cust.name.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase())}`;
                                        navigator.clipboard.writeText(url);
                                        showNotification('success', `Copied personal order link for ${cust.name}!`);
                                      }}
                                      className="p-1.5 hover:bg-slate-100 text-slate-600 rounded transition-colors"
                                      title="Copy Personal Order Link"
                                    >
                                      <Copy className="w-4 h-4" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                      </tbody>
                      <tfoot className="bg-slate-50 border-t-2 border-slate-200 font-bold text-slate-900">
                        <tr>
                          <td colSpan={4} className="py-3 px-4 text-right uppercase tracking-wider text-[11px] text-slate-600">
                            Total Customer Delivered Revenue:
                          </td>
                          <td className="py-3 px-4 text-right font-mono-nums font-black text-emerald-700 text-base">
                            ₹{stats?.totalSales.toLocaleString() || '0'}
                          </td>
                          <td colSpan={3}></td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* VIEW 2: ORDER-BY-ORDER TRANSACTIONS */}
            {revenueSubView === 'orders' && (
              <div>
                {revenueTransactions.length === 0 && orders.filter(o => o.status === 'DELIVERED').length === 0 ? (
                  <div className="py-12 text-center text-slate-400">
                    <TrendingUp className="w-12 h-12 mx-auto text-slate-300 mb-2 stroke-1" />
                    <h4 className="text-sm font-bold text-slate-700">No Delivered Orders Yet</h4>
                    <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                      When you update an order status to <strong>Delivered</strong> in the Customer Orders tab,
                      its locked order total will automatically record here and increase Total Revenue.
                    </p>
                    <button
                      type="button"
                      onClick={() => setActiveTab('orders')}
                      className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
                    >
                      <ShoppingBag className="w-3.5 h-3.5" />
                      <span>Go to Customer Orders</span>
                    </button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                        <tr>
                          <th className="py-3 px-4">Transaction ID</th>
                          <th className="py-3 px-4">Order ID</th>
                          <th className="py-3 px-4">Customer</th>
                          <th className="py-3 px-4 text-right">Saved Order Total</th>
                          <th className="py-3 px-4 text-center">Status</th>
                          <th className="py-3 px-4 text-center">Revenue Counted</th>
                          <th className="py-3 px-4 text-right">Revenue Contribution</th>
                          <th className="py-3 px-4 text-right">Delivery Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {(revenueTransactions.length > 0
                          ? revenueTransactions
                          : orders
                              .filter(o => o.status === 'DELIVERED')
                              .map(o => ({
                                id: `REV-${o.id}`,
                                orderId: o.id,
                                customerName: o.customerName,
                                customerPhone: o.customerPhone,
                                orderTotal: Number(o.grandTotal) || 0,
                                revenueAmount: Number(o.customRevenue !== null && o.customRevenue !== undefined ? o.customRevenue : o.grandTotal) || 0,
                                status: 'DELIVERED' as const,
                                revenueCounted: true,
                                deliveredAt: o.deliveredAt || o.updatedAt,
                                createdAt: o.deliveredAt || o.updatedAt
                              }))
                        ).map(tx => (
                          <tr key={tx.id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="py-3 px-4 font-mono font-semibold text-slate-800">
                              {tx.id}
                            </td>
                            <td className="py-3 px-4">
                              <span className="font-mono font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                {tx.orderId}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <div className="font-semibold text-slate-900">{tx.customerName}</div>
                              <div className="text-[11px] text-slate-500 font-mono">{tx.customerPhone}</div>
                            </td>
                            <td className="py-3 px-4 text-right font-mono-nums font-semibold text-slate-800">
                              ₹{Number(tx.orderTotal).toLocaleString()}
                            </td>
                            <td className="py-3 px-4 text-center">
                              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                tx.status === 'DELIVERED'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-slate-100 text-slate-600'
                              }`}>
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                {tx.status}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-center">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                                <Check className="w-3 h-3 text-emerald-600" />
                                Yes
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right font-mono-nums font-extrabold text-emerald-700 text-sm">
                              +₹{Number(tx.revenueAmount).toLocaleString()}
                            </td>
                            <td className="py-3 px-4 text-right text-slate-500 font-mono text-[11px]">
                              {tx.deliveredAt ? new Date(tx.deliveredAt).toLocaleString() : 'Just now'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-slate-50 border-t-2 border-slate-200 font-bold text-slate-900">
                        <tr>
                          <td colSpan={6} className="py-3 px-4 text-right uppercase tracking-wider text-[11px] text-slate-600">
                            Total Delivered Revenue Sum:
                          </td>
                          <td className="py-3 px-4 text-right font-mono-nums font-black text-emerald-700 text-base">
                            ₹{stats?.totalSales.toLocaleString() || '0'}
                          </td>
                          <td></td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Revenue Integrity Rules Guarantee Card */}
          <div className="bg-slate-50 rounded-2xl border border-slate-200 p-5 space-y-3">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Automated Revenue System Guarantees
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              <div className="p-3 bg-white rounded-xl border border-slate-200">
                <strong className="text-slate-900 block font-semibold mb-1">1. Delivered-Only Trigger</strong>
                <p className="text-slate-500 text-[11px] leading-relaxed">
                  Revenue is ₹0 when an order is placed, Pending, Accepted, or Packaging. Revenue increases ONLY when marked Delivered.
                </p>
              </div>

              <div className="p-3 bg-white rounded-xl border border-slate-200">
                <strong className="text-slate-900 block font-semibold mb-1">2. Zero Duplicate Protection</strong>
                <p className="text-slate-500 text-[11px] leading-relaxed">
                  If status changes Delivered → Delivered or Delivered → Processing → Delivered, revenue is counted only once.
                </p>
              </div>

              <div className="p-3 bg-white rounded-xl border border-slate-200">
                <strong className="text-slate-900 block font-semibold mb-1">3. Historical Price Lock</strong>
                <p className="text-slate-500 text-[11px] leading-relaxed">
                  Revenue strictly uses the locked order total saved at checkout, completely immune to future product price updates.
                </p>
              </div>

              <div className="p-3 bg-white rounded-xl border border-slate-200">
                <strong className="text-slate-900 block font-semibold mb-1">4. Permanent Persistence</strong>
                <p className="text-slate-500 text-[11px] leading-relaxed">
                  Persisted safely in the database and synced to Firestore. Preserved across page reloads, logouts, and server restarts.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ADD / EDIT PRODUCT */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900 font-display">
              {editingProduct ? `Edit ${storeSettings.brandName} Product` : `Add New ${storeSettings.brandName} Product`}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Configure product details, exact photo, status, and variants.
            </p>

            <form onSubmit={handleSaveProduct} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Product Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={productForm.name}
                  onChange={e => setProductForm({ ...productForm, name: e.target.value })}
                  placeholder={`e.g. ${storeSettings.brandName} Floor Cleaner`}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Category</label>
                  <select
                    value={productForm.category}
                    onChange={e => setProductForm({ ...productForm, category: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:border-emerald-600"
                  >
                    <option value="Floor Care">Floor Care</option>
                    <option value="Disinfection">Disinfection</option>
                    <option value="Glass Care">Glass Care</option>
                    <option value="Sanitary">Sanitary</option>
                    <option value="Kitchen">Kitchen</option>
                    <option value="Commercial">Commercial</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Product Status</label>
                  <select
                    value={productForm.status}
                    onChange={e =>
                      setProductForm({ ...productForm, status: e.target.value as ProductStatus })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:border-emerald-600 font-semibold"
                  >
                    <option value="UPCOMING">UPCOMING (Not orderable yet)</option>
                    <option value="LIVE">LIVE (Visible & orderable)</option>
                    <option value="OUT_OF_STOCK">OUT OF STOCK</option>
                    <option value="INACTIVE">INACTIVE (Hidden)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Tagline / Key Highlight</label>
                <input
                  type="text"
                  value={productForm.tagline}
                  onChange={e => setProductForm({ ...productForm, tagline: e.target.value })}
                  placeholder="e.g. 24hr long-lasting citrus fragrance & 99.9% germ kill"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={productForm.description}
                  onChange={e => setProductForm({ ...productForm, description: e.target.value })}
                  placeholder="Detailed formula description and benefits"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:border-emerald-600"
                />
              </div>

              {/* Exact Photo Upload Section */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="font-semibold text-slate-800 block mb-1">
                  Product Photo (Exact Uploaded Image)
                </span>
                <p className="text-[11px] text-slate-500 mb-2">
                  Upload the exact product bottle image. Displays pristine without AI alteration.
                </p>

                <div className="flex items-center gap-3">
                  {productForm.image && (
                    <div className="w-14 h-14 bg-white rounded-lg border border-slate-200 p-1 shrink-0 flex items-center justify-center overflow-hidden">
                      <img
                        src={productForm.image}
                        alt="Product preview"
                        className="w-full h-full object-contain"
                      />
                    </div>
                  )}

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={actionLoading === 'upload-photo'}
                    className="px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>
                      {actionLoading === 'upload-photo'
                        ? 'Uploading Exact Photo...'
                        : 'Choose Photo From Device'}
                    </span>
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading === 'save-product'}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold shadow-xs flex items-center gap-1.5"
                >
                  <span>{editingProduct ? 'Save Changes' : 'Create Product'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CUSTOMIZE / EDIT OR ADD VARIANT */}
      {isVariantModalOpen && editingVariantProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-200">
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 uppercase tracking-wider">
                  {editingVariantTarget ? 'Customize / Edit' : 'Add Size'}
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-1">
                  {editingVariantTarget ? `Edit ${editingVariantTarget.size}` : 'Add Variant Size'}
                </h3>
                <span className="text-xs text-slate-500 block truncate">
                  Product: {editingVariantProduct.name}
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsVariantModalOpen(false);
                  setEditingVariantTarget(null);
                }}
                className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveVariant} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Size / Volume *</label>
                <input
                  type="text"
                  required
                  value={variantForm.size}
                  onChange={e => setVariantForm({ ...variantForm, size: e.target.value })}
                  placeholder="e.g. 250 ML, 500 ML, 1 Litre, 5 Litre"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:border-emerald-600 bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">MRP (₹) *</label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={variantForm.mrp}
                    onChange={e =>
                      setVariantForm({ ...variantForm, mrp: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:border-emerald-600 font-mono-nums bg-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Selling Price (₹) *
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={variantForm.sellingPrice}
                    onChange={e =>
                      setVariantForm({ ...variantForm, sellingPrice: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:border-emerald-600 font-mono-nums font-bold text-emerald-700 bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Offer Label / Tag</label>
                <input
                  type="text"
                  value={variantForm.offer}
                  onChange={e => setVariantForm({ ...variantForm, offer: e.target.value })}
                  placeholder="e.g. ₹15 OFF (15% OFF)"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:border-emerald-600 bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Stock Quantity *</label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={variantForm.stockQuantity}
                    onChange={e =>
                      setVariantForm({ ...variantForm, stockQuantity: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:border-emerald-600 font-mono-nums bg-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Availability Status</label>
                  <select
                    value={variantForm.status}
                    onChange={e =>
                      setVariantForm({
                        ...variantForm,
                        status: e.target.value as 'ACTIVE' | 'OUT_OF_STOCK'
                      })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:border-emerald-600 bg-white font-semibold"
                  >
                    <option value="ACTIVE">In Stock (Active)</option>
                    <option value="OUT_OF_STOCK">Out of Stock</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsVariantModalOpen(false);
                    setEditingVariantTarget(null);
                  }}
                  className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold shadow-xs active:scale-95 transition-all"
                >
                  {editingVariantTarget ? 'Save Changes' : 'Add Size'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CUSTOMIZE TOTAL REVENUE (ADMIN ONLY) */}
      {isRevenueModalOpen && stats && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-200">
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 uppercase tracking-wider">
                  Admin Exclusive Control
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-1">
                  Customize Total Revenue
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsRevenueModalOpen(false)}
                className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-500 mt-3 leading-relaxed">
              Manually set your business Total Revenue figure (e.g. accounting for counter sales, B2B wholesale consignments, or manual milestones).
              This customized revenue is <strong className="text-slate-800">strictly private to Admin</strong> and will never be exposed to customers.
            </p>

            <form
              onSubmit={e => {
                e.preventDefault();
                handleSaveCustomRevenue(Number(customRevenueInput));
              }}
              className="mt-4 space-y-4 text-xs"
            >
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Custom Total Revenue Amount (₹)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-slate-400 text-sm">
                    ₹
                  </span>
                  <input
                    type="number"
                    min={0}
                    required
                    value={customRevenueInput}
                    onChange={e => setCustomRevenueInput(e.target.value)}
                    placeholder="Enter revenue e.g. 50000"
                    className="w-full pl-8 pr-3 py-2 text-sm font-bold font-mono-nums rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 bg-white"
                  />
                </div>
              </div>

              {/* Quick Amount Presets */}
              <div>
                <span className="text-[11px] font-semibold text-slate-500 block mb-1.5">
                  Quick Amount Presets:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {[25000, 50000, 100000, 250000, 500000].map(val => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setCustomRevenueInput(String(val))}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-mono-nums font-semibold"
                    >
                      ₹{val.toLocaleString()}
                    </button>
                  ))}
                </div>
              </div>

              {/* Current Auto-Calculated vs Custom info box */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1 text-[11px]">
                <div className="flex justify-between text-slate-600">
                  <span>Auto-Calculated from Accepted Orders:</span>
                  <span className="font-mono-nums font-bold">₹{stats.calculatedSales.toLocaleString()}</span>
                </div>
                {stats.isCustomRevenue && (
                  <div className="flex justify-between text-emerald-800 font-semibold">
                    <span>Current Active Custom Revenue:</span>
                    <span className="font-mono-nums font-bold">₹{stats.totalSales.toLocaleString()}</span>
                  </div>
                )}
              </div>

              <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-2 border-t border-slate-100">
                <button
                  type="button"
                  disabled={isSavingRevenue}
                  onClick={() => handleSaveCustomRevenue(null)}
                  className="w-full sm:w-auto px-3 py-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 text-xs font-semibold"
                >
                  Reset to Orders Value
                </button>

                <div className="w-full sm:w-auto flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsRevenueModalOpen(false)}
                    className="flex-1 sm:flex-none px-3.5 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-semibold text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingRevenue || !customRevenueInput}
                    className="flex-1 sm:flex-none px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-xs text-xs flex items-center justify-center gap-1.5 active:scale-95 disabled:opacity-50"
                  >
                    {isSavingRevenue ? 'Saving...' : 'Save Revenue'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* INVENTORY / PRODUCT DELETE CONFIRMATION MODAL */}
      {deleteConfirmTarget && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center text-rose-600 shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Confirm {deleteConfirmTarget.type === 'variant' ? 'Variant' : 'Product'} Deletion
                </h3>
                <p className="text-xs text-slate-500">
                  Permanent action · Cannot be undone
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-700 bg-slate-50 p-3.5 rounded-xl border border-slate-200 leading-relaxed">
              Are you sure you want to permanently delete{' '}
              <strong className="text-rose-700 font-bold">{deleteConfirmTarget.name}</strong> from your active store inventory?
              {deleteConfirmTarget.type === 'product' && (
                <span className="block mt-1 text-slate-500 font-normal">
                  All sizing variants, prices, and photo links associated with this product will also be removed.
                </span>
              )}
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDeleteConfirmTarget(null)}
                className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-colors shadow-xs flex items-center gap-1.5 active:scale-95"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Permanently</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
