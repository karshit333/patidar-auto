'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import {
  Plus, Package, RefreshCw, Edit, Trash2, AlertTriangle,
  ShoppingCart, Search, Filter
} from 'lucide-react';

export default function InventoryPage() {
  const [inventory, setInventory] = useState([]);
  const [categories, setCategories] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showItemModal, setShowItemModal] = useState(false);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [filterCategory, setFilterCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showLowStock, setShowLowStock] = useState(false);

  // Form states
  const [itemForm, setItemForm] = useState({
    itemName: '',
    categoryId: '',
    vehicleCompatibility: 'Both',
    purchasePrice: '',
    sellingPrice: '',
    quantityInStock: '',
    minStockAlert: '5'
  });

  const [purchaseForm, setPurchaseForm] = useState({
    inventoryId: '',
    quantity: '',
    purchasePrice: '',
    supplier: '',
    purchaseDate: new Date().toISOString().split('T')[0],
    notes: ''
  });

  const [newCategoryName, setNewCategoryName] = useState('');

  useEffect(() => {
    fetchData();
  }, [filterCategory, showLowStock]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterCategory !== 'all') params.set('categoryId', filterCategory);
      if (showLowStock) params.set('lowStock', 'true');

      const [inventoryRes, categoriesRes, purchasesRes] = await Promise.all([
        fetch(`/api/inventory?${params.toString()}`),
        fetch('/api/inventory/categories'),
        fetch('/api/purchases')
      ]);

      const inventoryData = await inventoryRes.json();
      const categoriesData = await categoriesRes.json();
      const purchasesData = await purchasesRes.json();

      setInventory(inventoryData.inventory || []);
      setCategories(categoriesData.categories || []);
      setPurchases(purchasesData.purchases || []);
    } catch (error) {
      toast.error('Failed to fetch data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveItem = async () => {
    if (!itemForm.itemName) {
      toast.error('Item name is required');
      return;
    }

    try {
      const url = editingItem ? `/api/inventory/${editingItem.id}` : '/api/inventory';
      const method = editingItem ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemName: itemForm.itemName,
          categoryId: itemForm.categoryId || null,
          vehicleCompatibility: itemForm.vehicleCompatibility,
          purchasePrice: parseFloat(itemForm.purchasePrice) || 0,
          sellingPrice: parseFloat(itemForm.sellingPrice) || 0,
          quantityInStock: parseInt(itemForm.quantityInStock) || 0,
          minStockAlert: parseInt(itemForm.minStockAlert) || 5
        })
      });

      const data = await response.json();
      if (data.success) {
        toast.success(editingItem ? 'Item updated!' : 'Item added!');
        setShowItemModal(false);
        resetItemForm();
        fetchData();
      } else {
        toast.error(data.error || 'Failed to save item');
      }
    } catch (error) {
      toast.error('Something went wrong');
    }
  };

  const handleDeleteItem = async (itemId) => {
    if (!confirm('Are you sure you want to delete this item?')) return;

    try {
      const response = await fetch(`/api/inventory/${itemId}`, { method: 'DELETE' });
      const data = await response.json();
      if (data.success) {
        toast.success('Item deleted');
        fetchData();
      } else {
        toast.error('Failed to delete item');
      }
    } catch (error) {
      toast.error('Something went wrong');
    }
  };

  const handleAddPurchase = async () => {
    if (!purchaseForm.inventoryId || !purchaseForm.quantity || !purchaseForm.purchasePrice) {
      toast.error('Please fill in required fields');
      return;
    }

    try {
      const response = await fetch('/api/purchases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inventoryId: purchaseForm.inventoryId,
          quantity: parseInt(purchaseForm.quantity),
          purchasePrice: parseFloat(purchaseForm.purchasePrice),
          supplier: purchaseForm.supplier,
          purchaseDate: purchaseForm.purchaseDate,
          notes: purchaseForm.notes
        })
      });

      const data = await response.json();
      if (data.success) {
        toast.success('Purchase added! Stock updated.');
        setShowPurchaseModal(false);
        resetPurchaseForm();
        fetchData();
      } else {
        toast.error(data.error || 'Failed to add purchase');
      }
    } catch (error) {
      toast.error('Something went wrong');
    }
  };

  const handleAddCategory = async () => {
    if (!newCategoryName) {
      toast.error('Category name is required');
      return;
    }

    try {
      const response = await fetch('/api/inventory/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newCategoryName })
      });

      const data = await response.json();
      if (data.success) {
        toast.success('Category added!');
        setShowCategoryModal(false);
        setNewCategoryName('');
        fetchData();
      } else {
        toast.error(data.error || 'Failed to add category');
      }
    } catch (error) {
      toast.error('Something went wrong');
    }
  };

  const openEditModal = (item) => {
    setEditingItem(item);
    setItemForm({
      itemName: item.item_name,
      categoryId: item.category_id || '',
      vehicleCompatibility: item.vehicle_compatibility,
      purchasePrice: item.purchase_price?.toString() || '',
      sellingPrice: item.selling_price?.toString() || '',
      quantityInStock: item.quantity_in_stock?.toString() || '',
      minStockAlert: item.min_stock_alert?.toString() || '5'
    });
    setShowItemModal(true);
  };

  const resetItemForm = () => {
    setEditingItem(null);
    setItemForm({
      itemName: '',
      categoryId: '',
      vehicleCompatibility: 'Both',
      purchasePrice: '',
      sellingPrice: '',
      quantityInStock: '',
      minStockAlert: '5'
    });
  };

  const resetPurchaseForm = () => {
    setPurchaseForm({
      inventoryId: '',
      quantity: '',
      purchasePrice: '',
      supplier: '',
      purchaseDate: new Date().toISOString().split('T')[0],
      notes: ''
    });
  };

  const filteredInventory = inventory.filter(item =>
    item.item_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const lowStockItems = inventory.filter(item => item.quantity_in_stock <= item.min_stock_alert);

  return (
    <div className="p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Inventory</h1>
            <p className="text-gray-500 text-sm mt-1">Manage stock and purchases</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowCategoryModal(true)} className="rounded-xl">
              <Plus className="w-4 h-4 mr-2" /> Category
            </Button>
            <Button variant="outline" onClick={() => setShowPurchaseModal(true)} className="rounded-xl">
              <ShoppingCart className="w-4 h-4 mr-2" /> Add Purchase
            </Button>
            <Button onClick={() => { resetItemForm(); setShowItemModal(true); }} className="rounded-xl">
              <Plus className="w-4 h-4 mr-2" /> Add Item
            </Button>
          </div>
        </div>

        {/* Low Stock Alert */}
        {lowStockItems.length > 0 && (
          <Card className="border-0 shadow-sm rounded-2xl mb-6 bg-yellow-50 border-l-4 border-l-yellow-400">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-yellow-600" />
                <div>
                  <p className="font-medium text-yellow-800">Low Stock Alert</p>
                  <p className="text-sm text-yellow-700">
                    {lowStockItems.length} item(s) are running low on stock
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowLowStock(!showLowStock)}
                  className="ml-auto rounded-lg border-yellow-400 text-yellow-700"
                >
                  {showLowStock ? 'Show All' : 'View Low Stock'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="inventory" className="space-y-6">
          <TabsList className="bg-gray-100 rounded-xl p-1">
            <TabsTrigger value="inventory" className="rounded-lg">Inventory</TabsTrigger>
            <TabsTrigger value="purchases" className="rounded-lg">Purchase History</TabsTrigger>
          </TabsList>

          {/* Inventory Tab */}
          <TabsContent value="inventory">
            {/* Filters */}
            <Card className="border-0 shadow-sm rounded-2xl mb-6">
              <CardContent className="p-4">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      placeholder="Search items..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 rounded-xl"
                    />
                  </div>
                  <Select value={filterCategory} onValueChange={setFilterCategory}>
                    <SelectTrigger className="w-48 rounded-xl">
                      <SelectValue placeholder="All Categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button variant="outline" onClick={fetchData} className="rounded-xl">
                    <RefreshCw className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Inventory Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {isLoading ? (
                <div className="col-span-full text-center py-12">
                  <RefreshCw className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
                  <p className="text-gray-500">Loading inventory...</p>
                </div>
              ) : filteredInventory.length === 0 ? (
                <div className="col-span-full text-center py-12">
                  <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No items found</p>
                </div>
              ) : (
                filteredInventory.map((item) => (
                  <Card key={item.id} className={`border-0 shadow-sm rounded-2xl ${
                    item.quantity_in_stock <= item.min_stock_alert ? 'ring-2 ring-yellow-400' : ''
                  }`}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-semibold text-gray-900">{item.item_name}</h3>
                          <p className="text-sm text-gray-500">{item.inventory_categories?.name || 'Uncategorized'}</p>
                        </div>
                        <Badge variant="outline" className="rounded-full">
                          {item.vehicle_compatibility}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
                        <div>
                          <p className="text-gray-400">Purchase Price</p>
                          <p className="font-medium">₹{item.purchase_price}</p>
                        </div>
                        <div>
                          <p className="text-gray-400">Selling Price</p>
                          <p className="font-medium">₹{item.selling_price}</p>
                        </div>
                        <div className="col-span-2">
                          <p className="text-gray-400">Stock</p>
                          <p className={`font-semibold text-lg ${
                            item.quantity_in_stock <= item.min_stock_alert ? 'text-yellow-600' : 'text-green-600'
                          }`}>
                            {item.quantity_in_stock} units
                            {item.quantity_in_stock <= item.min_stock_alert && (
                              <span className="text-xs ml-2 text-yellow-600">(Low)</span>
                            )}
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditModal(item)}
                          className="flex-1 rounded-lg"
                        >
                          <Edit className="w-3 h-3 mr-1" /> Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteItem(item.id)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          {/* Purchases Tab */}
          <TabsContent value="purchases">
            <Card className="border-0 shadow-sm rounded-2xl">
              <CardHeader>
                <CardTitle className="text-lg">Purchase History</CardTitle>
              </CardHeader>
              <CardContent>
                {purchases.length === 0 ? (
                  <div className="text-center py-12">
                    <ShoppingCart className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">No purchases recorded</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {purchases.map((purchase) => (
                      <div key={purchase.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                        <div>
                          <p className="font-medium text-gray-900">{purchase.inventory?.item_name}</p>
                          <p className="text-sm text-gray-500">
                            {purchase.supplier || 'No supplier'} • {new Date(purchase.purchase_date).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-gray-900">{purchase.quantity} units</p>
                          <p className="text-sm text-gray-500">₹{purchase.purchase_price} each</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Add/Edit Item Modal */}
      <Dialog open={showItemModal} onOpenChange={setShowItemModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingItem ? 'Edit Item' : 'Add New Item'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Item Name *</Label>
              <Input
                value={itemForm.itemName}
                onChange={(e) => setItemForm({ ...itemForm, itemName: e.target.value })}
                className="rounded-xl mt-1"
              />
            </div>
            <div>
              <Label>Category</Label>
              <Select value={itemForm.categoryId} onValueChange={(v) => setItemForm({ ...itemForm, categoryId: v })}>
                <SelectTrigger className="rounded-xl mt-1">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Vehicle Compatibility</Label>
              <Select value={itemForm.vehicleCompatibility} onValueChange={(v) => setItemForm({ ...itemForm, vehicleCompatibility: v })}>
                <SelectTrigger className="rounded-xl mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Both">Both</SelectItem>
                  <SelectItem value="2W">Two Wheeler Only</SelectItem>
                  <SelectItem value="4W">Four Wheeler Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Purchase Price</Label>
                <Input
                  type="number"
                  value={itemForm.purchasePrice}
                  onChange={(e) => setItemForm({ ...itemForm, purchasePrice: e.target.value })}
                  className="rounded-xl mt-1"
                />
              </div>
              <div>
                <Label>Selling Price</Label>
                <Input
                  type="number"
                  value={itemForm.sellingPrice}
                  onChange={(e) => setItemForm({ ...itemForm, sellingPrice: e.target.value })}
                  className="rounded-xl mt-1"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Initial Stock</Label>
                <Input
                  type="number"
                  value={itemForm.quantityInStock}
                  onChange={(e) => setItemForm({ ...itemForm, quantityInStock: e.target.value })}
                  className="rounded-xl mt-1"
                />
              </div>
              <div>
                <Label>Low Stock Alert</Label>
                <Input
                  type="number"
                  value={itemForm.minStockAlert}
                  onChange={(e) => setItemForm({ ...itemForm, minStockAlert: e.target.value })}
                  className="rounded-xl mt-1"
                />
              </div>
            </div>
            <div className="flex gap-2 pt-4">
              <Button variant="outline" onClick={() => setShowItemModal(false)} className="flex-1 rounded-xl">
                Cancel
              </Button>
              <Button onClick={handleSaveItem} className="flex-1 rounded-xl">
                {editingItem ? 'Update' : 'Add Item'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Purchase Modal */}
      <Dialog open={showPurchaseModal} onOpenChange={setShowPurchaseModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Purchase Entry</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Select Item *</Label>
              <Select value={purchaseForm.inventoryId} onValueChange={(v) => setPurchaseForm({ ...purchaseForm, inventoryId: v })}>
                <SelectTrigger className="rounded-xl mt-1">
                  <SelectValue placeholder="Select item" />
                </SelectTrigger>
                <SelectContent>
                  {inventory.map((item) => (
                    <SelectItem key={item.id} value={item.id}>{item.item_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Quantity *</Label>
                <Input
                  type="number"
                  value={purchaseForm.quantity}
                  onChange={(e) => setPurchaseForm({ ...purchaseForm, quantity: e.target.value })}
                  className="rounded-xl mt-1"
                />
              </div>
              <div>
                <Label>Purchase Price *</Label>
                <Input
                  type="number"
                  value={purchaseForm.purchasePrice}
                  onChange={(e) => setPurchaseForm({ ...purchaseForm, purchasePrice: e.target.value })}
                  className="rounded-xl mt-1"
                />
              </div>
            </div>
            <div>
              <Label>Supplier</Label>
              <Input
                value={purchaseForm.supplier}
                onChange={(e) => setPurchaseForm({ ...purchaseForm, supplier: e.target.value })}
                className="rounded-xl mt-1"
              />
            </div>
            <div>
              <Label>Purchase Date</Label>
              <Input
                type="date"
                value={purchaseForm.purchaseDate}
                onChange={(e) => setPurchaseForm({ ...purchaseForm, purchaseDate: e.target.value })}
                className="rounded-xl mt-1"
              />
            </div>
            <div className="flex gap-2 pt-4">
              <Button variant="outline" onClick={() => setShowPurchaseModal(false)} className="flex-1 rounded-xl">
                Cancel
              </Button>
              <Button onClick={handleAddPurchase} className="flex-1 rounded-xl">
                Add Purchase
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Category Modal */}
      <Dialog open={showCategoryModal} onOpenChange={setShowCategoryModal}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Add Category</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Category Name</Label>
              <Input
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="e.g., Engine Parts"
                className="rounded-xl mt-1"
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowCategoryModal(false)} className="flex-1 rounded-xl">
                Cancel
              </Button>
              <Button onClick={handleAddCategory} className="flex-1 rounded-xl">
                Add
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
