'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import {
  Plus, Trash2, FileText, Car, Bike, Phone, Calendar,
  ChevronDown, ChevronUp, X, ClipboardList, RefreshCw
} from 'lucide-react';

const PROBLEM_CATEGORIES = [
  'Engine',
  'Body',
  'Silencer / Exhaust',
  'Electrical',
  'Brake & Suspension',
  'Modification',
  'Service / Maintenance',
  'Accident / Damage',
  'Other'
];

const STATUS_COLORS = {
  draft: 'bg-gray-100 text-gray-800',
  finalized: 'bg-blue-100 text-blue-800',
  billed: 'bg-green-100 text-green-800'
};

export default function JobCardsPage() {
  const searchParams = useSearchParams();
  const [jobCards, setJobCards] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [editingJobCard, setEditingJobCard] = useState(null);
  const [expandedCard, setExpandedCard] = useState(null);
  const [isWalkIn, setIsWalkIn] = useState(false);

  // Form state
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [lineItems, setLineItems] = useState([{ category: '', problemDescription: '', estimatedPrice: '' }]);
  
  // Walk-in customer form state
  const [walkInCustomer, setWalkInCustomer] = useState({
    customerName: '',
    mobile: '',
    vehicleType: 'Two Wheeler',
    vehicleBrand: '',
    vehicleModel: '',
    vehicleNumber: '',
    serviceType: 'General Service'
  });

  useEffect(() => {
    fetchData();
  }, []);

  // Auto-open create modal if bookingId is in URL
  useEffect(() => {
    const bookingId = searchParams.get('bookingId');
    if (bookingId && bookings.length > 0) {
      const booking = bookings.find(b => b.id === bookingId);
      if (booking && !jobCards.some(jc => jc.booking_id === bookingId)) {
        openCreateModal(booking);
      }
    }
  }, [searchParams, bookings, jobCards]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [jobCardsRes, bookingsRes] = await Promise.all([
        fetch('/api/job-cards'),
        fetch('/api/bookings')
      ]);
      const jobCardsData = await jobCardsRes.json();
      const bookingsData = await bookingsRes.json();
      setJobCards(jobCardsData.jobCards || []);
      setBookings(bookingsData.bookings || []);
    } catch (error) {
      toast.error('Failed to fetch data');
    } finally {
      setIsLoading(false);
    }
  };

  const calculateTotal = () => {
    return lineItems.reduce((sum, item) => sum + (parseFloat(item.estimatedPrice) || 0), 0);
  };

  const addLineItem = () => {
    setLineItems([...lineItems, { category: '', problemDescription: '', estimatedPrice: '' }]);
  };

  const removeLineItem = (index) => {
    if (lineItems.length > 1) {
      setLineItems(lineItems.filter((_, i) => i !== index));
    }
  };

  const updateLineItem = (index, field, value) => {
    const updated = [...lineItems];
    updated[index][field] = value;
    setLineItems(updated);
  };

  const toggleCategory = (category) => {
    if (selectedCategories.includes(category)) {
      setSelectedCategories(selectedCategories.filter(c => c !== category));
    } else {
      setSelectedCategories([...selectedCategories, category]);
    }
  };

  const openCreateModal = (booking) => {
    // Check if job card already exists
    const existingJobCard = jobCards.find(jc => jc.booking_id === booking.id);
    if (existingJobCard) {
      openEditModal(existingJobCard);
      return;
    }

    setIsWalkIn(false);
    setSelectedBooking(booking);
    setEditingJobCard(null);
    setSelectedCategories([]);
    setLineItems([{ category: '', problemDescription: '', estimatedPrice: '' }]);
    setShowCreateModal(true);
  };

  const openWalkInModal = () => {
    setIsWalkIn(true);
    setSelectedBooking(null);
    setEditingJobCard(null);
    setSelectedCategories([]);
    setLineItems([{ category: '', problemDescription: '', estimatedPrice: '' }]);
    setWalkInCustomer({
      customerName: '',
      mobile: '',
      vehicleType: 'Two Wheeler',
      vehicleBrand: '',
      vehicleModel: '',
      vehicleNumber: '',
      serviceType: 'General Service'
    });
    setShowCreateModal(true);
  };

  const openEditModal = (jobCard) => {
    setIsWalkIn(false);
    setSelectedBooking(jobCard.bookings);
    setEditingJobCard(jobCard);
    setSelectedCategories(jobCard.categories || []);
    setLineItems(
      jobCard.job_card_items?.length > 0
        ? jobCard.job_card_items.map(item => ({
            category: item.category,
            problemDescription: item.problem_description,
            estimatedPrice: item.estimated_price?.toString() || ''
          }))
        : [{ category: '', problemDescription: '', estimatedPrice: '' }]
    );
    setShowCreateModal(true);
  };

  const handleSaveJobCard = async (status = 'draft') => {
    if (lineItems.some(item => !item.category || !item.problemDescription)) {
      toast.error('Please fill in all line items');
      return;
    }

    // Validate walk-in customer details
    if (isWalkIn) {
      if (!walkInCustomer.customerName || !walkInCustomer.mobile || !walkInCustomer.vehicleBrand) {
        toast.error('Please fill in customer name, mobile, and vehicle brand');
        return;
      }
    }

    try {
      const payload = {
        bookingId: isWalkIn ? null : selectedBooking?.id,
        categories: selectedCategories,
        totalEstimatedAmount: calculateTotal(),
        status,
        items: lineItems.map(item => ({
          category: item.category,
          problemDescription: item.problemDescription,
          estimatedPrice: parseFloat(item.estimatedPrice) || 0
        })),
        // Walk-in customer data
        isWalkIn: isWalkIn,
        walkInCustomer: isWalkIn ? walkInCustomer : null
      };

      const url = editingJobCard ? `/api/job-cards/${editingJobCard.id}` : '/api/job-cards';
      const method = editingJobCard ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      if (data.success) {
        toast.success(editingJobCard ? 'Job card updated!' : 'Job card created!');
        setShowCreateModal(false);
        fetchData();
      } else {
        toast.error(data.error || 'Failed to save job card');
      }
    } catch (error) {
      toast.error('Something went wrong');
    }
  };

  const handleDeleteJobCard = async (jobCardId) => {
    if (!confirm('Are you sure you want to delete this job card?')) return;

    try {
      const response = await fetch(`/api/job-cards/${jobCardId}`, { method: 'DELETE' });
      const data = await response.json();
      if (data.success) {
        toast.success('Job card deleted');
        fetchData();
      } else {
        toast.error('Failed to delete job card');
      }
    } catch (error) {
      toast.error('Something went wrong');
    }
  };

  // Get bookings without job cards
  const availableBookings = bookings.filter(
    booking => !jobCards.some(jc => jc.booking_id === booking.id)
  );

  return (
    <div className="p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Job Cards</h1>
            <p className="text-gray-500 text-sm mt-1">Manage service job cards</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={openWalkInModal} className="rounded-xl bg-primary">
              <Plus className="w-4 h-4 mr-2" /> Create Job Card
            </Button>
            <Button onClick={fetchData} variant="outline" className="rounded-xl">
              <RefreshCw className="w-4 h-4 mr-2" /> Refresh
            </Button>
          </div>
        </div>

        {/* Bookings Available for Job Card */}
        {availableBookings.length > 0 && (
          <Card className="border-0 shadow-sm rounded-2xl mb-6">
            <CardHeader>
              <CardTitle className="text-lg">Create Job Card from Booking</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {availableBookings.slice(0, 6).map((booking) => (
                  <div
                    key={booking.id}
                    onClick={() => openCreateModal(booking)}
                    className="p-4 border border-gray-100 rounded-xl hover:border-primary hover:bg-primary/5 cursor-pointer transition-all"
                  >
                    <div className="flex items-center gap-3">
                      {booking.vehicle_type === 'Two Wheeler' ? (
                        <Bike className="w-8 h-8 text-primary" />
                      ) : (
                        <Car className="w-8 h-8 text-primary" />
                      )}
                      <div>
                        <p className="font-medium text-gray-900">{booking.booking_id}</p>
                        <p className="text-sm text-gray-500">{booking.customer_name}</p>
                        <p className="text-xs text-gray-400">{booking.vehicle_brand} {booking.vehicle_model}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Job Cards List */}
        <Card className="border-0 shadow-sm rounded-2xl">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">All Job Cards</CardTitle>
              <Badge variant="outline">{jobCards.length} total</Badge>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-12">
                <RefreshCw className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
                <p className="text-gray-500">Loading job cards...</p>
              </div>
            ) : jobCards.length === 0 ? (
              <div className="text-center py-12">
                <ClipboardList className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No job cards yet</p>
                <p className="text-gray-400 text-sm">Create one from a booking above</p>
              </div>
            ) : (
              <div className="space-y-4">
                {jobCards.map((jobCard) => (
                  <div
                    key={jobCard.id}
                    className="border border-gray-100 rounded-2xl overflow-hidden"
                  >
                    <div
                      className="p-4 cursor-pointer hover:bg-gray-50"
                      onClick={() => setExpandedCard(expandedCard === jobCard.id ? null : jobCard.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <FileText className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-gray-900">{jobCard.job_card_number}</span>
                              <Badge className={`${STATUS_COLORS[jobCard.status]} border-0`}>
                                {jobCard.status}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-500">
                              {jobCard.bookings?.customer_name} • {jobCard.bookings?.vehicle_brand} {jobCard.bookings?.vehicle_model}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="font-semibold text-gray-900">₹{jobCard.total_estimated_amount}</p>
                            <p className="text-xs text-gray-400">{jobCard.job_card_items?.length || 0} items</p>
                          </div>
                          {expandedCard === jobCard.id ? (
                            <ChevronUp className="w-5 h-5 text-gray-400" />
                          ) : (
                            <ChevronDown className="w-5 h-5 text-gray-400" />
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Expanded View */}
                    {expandedCard === jobCard.id && (
                      <div className="border-t border-gray-100 p-4 bg-gray-50/50">
                        {/* Booking Info */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 text-sm">
                          <div>
                            <p className="text-gray-400">Customer</p>
                            <p className="font-medium">{jobCard.bookings?.customer_name}</p>
                          </div>
                          <div>
                            <p className="text-gray-400">Mobile</p>
                            <a href={`tel:${jobCard.bookings?.mobile}`} className="font-medium text-primary">
                              {jobCard.bookings?.mobile}
                            </a>
                          </div>
                          <div>
                            <p className="text-gray-400">Vehicle</p>
                            <p className="font-medium">{jobCard.bookings?.vehicle_brand} {jobCard.bookings?.vehicle_model}</p>
                          </div>
                          <div>
                            <p className="text-gray-400">Number</p>
                            <p className="font-medium">{jobCard.bookings?.vehicle_number}</p>
                          </div>
                        </div>

                        {/* Categories */}
                        {jobCard.categories?.length > 0 && (
                          <div className="mb-4">
                            <p className="text-gray-400 text-sm mb-2">Categories</p>
                            <div className="flex flex-wrap gap-2">
                              {jobCard.categories.map((cat, i) => (
                                <Badge key={i} variant="outline" className="rounded-full">{cat}</Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Line Items */}
                        <div className="mb-4">
                          <p className="text-gray-400 text-sm mb-2">Work Items</p>
                          <div className="space-y-2">
                            {jobCard.job_card_items?.map((item, i) => (
                              <div key={i} className="flex justify-between items-start p-3 bg-white rounded-xl">
                                <div>
                                  <p className="font-medium text-gray-900">{item.problem_description}</p>
                                  <p className="text-xs text-gray-400">{item.category}</p>
                                </div>
                                <p className="font-semibold text-gray-900">₹{item.estimated_price}</p>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2">
                          {jobCard.status !== 'billed' && (
                            <>
                              <Button
                                variant="outline"
                                onClick={() => openEditModal(jobCard)}
                                className="rounded-xl"
                              >
                                Edit Job Card
                              </Button>
                              <Button
                                variant="ghost"
                                onClick={() => handleDeleteJobCard(jobCard.id)}
                                className="rounded-xl text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="w-4 h-4 mr-2" /> Delete
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Create/Edit Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingJobCard ? 'Edit Job Card' : isWalkIn ? 'Create Job Card (Walk-in Customer)' : 'Create Job Card'}
            </DialogTitle>
          </DialogHeader>

          {/* Walk-in Customer Form */}
          {isWalkIn && !editingJobCard && (
            <div className="space-y-6">
              <div className="bg-blue-50 rounded-xl p-4">
                <p className="text-sm font-medium text-blue-700 mb-3">Walk-in Customer Details</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Customer Name *</Label>
                    <Input
                      value={walkInCustomer.customerName}
                      onChange={(e) => setWalkInCustomer({...walkInCustomer, customerName: e.target.value})}
                      placeholder="Enter customer name"
                      className="mt-1 rounded-xl"
                    />
                  </div>
                  <div>
                    <Label>Mobile Number *</Label>
                    <Input
                      value={walkInCustomer.mobile}
                      onChange={(e) => setWalkInCustomer({...walkInCustomer, mobile: e.target.value})}
                      placeholder="Enter mobile number"
                      className="mt-1 rounded-xl"
                    />
                  </div>
                  <div>
                    <Label>Vehicle Type</Label>
                    <Select
                      value={walkInCustomer.vehicleType}
                      onValueChange={(value) => setWalkInCustomer({...walkInCustomer, vehicleType: value})}
                    >
                      <SelectTrigger className="mt-1 rounded-xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Two Wheeler">Two Wheeler</SelectItem>
                        <SelectItem value="Four Wheeler">Four Wheeler</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Vehicle Brand *</Label>
                    <Input
                      value={walkInCustomer.vehicleBrand}
                      onChange={(e) => setWalkInCustomer({...walkInCustomer, vehicleBrand: e.target.value})}
                      placeholder="e.g., Honda, Maruti"
                      className="mt-1 rounded-xl"
                    />
                  </div>
                  <div>
                    <Label>Vehicle Model</Label>
                    <Input
                      value={walkInCustomer.vehicleModel}
                      onChange={(e) => setWalkInCustomer({...walkInCustomer, vehicleModel: e.target.value})}
                      placeholder="e.g., Activa, Swift"
                      className="mt-1 rounded-xl"
                    />
                  </div>
                  <div>
                    <Label>Vehicle Number</Label>
                    <Input
                      value={walkInCustomer.vehicleNumber}
                      onChange={(e) => setWalkInCustomer({...walkInCustomer, vehicleNumber: e.target.value})}
                      placeholder="e.g., GJ03AB1234"
                      className="mt-1 rounded-xl"
                    />
                  </div>
                  <div>
                    <Label>Service Type</Label>
                    <Select
                      value={walkInCustomer.serviceType}
                      onValueChange={(value) => setWalkInCustomer({...walkInCustomer, serviceType: value})}
                    >
                      <SelectTrigger className="mt-1 rounded-xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="General Service">General Service</SelectItem>
                        <SelectItem value="Oil Change">Oil Change</SelectItem>
                        <SelectItem value="Repair">Repair</SelectItem>
                        <SelectItem value="Washing">Washing</SelectItem>
                        <SelectItem value="Body Work">Body Work</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Problem Categories */}
              <div>
                <Label className="mb-3 block">Problem Categories</Label>
                <div className="flex flex-wrap gap-2">
                  {PROBLEM_CATEGORIES.map((category) => (
                    <Badge
                      key={category}
                      variant={selectedCategories.includes(category) ? 'default' : 'outline'}
                      className={`cursor-pointer transition-all rounded-full px-4 py-2 ${
                        selectedCategories.includes(category) ? '' : 'hover:bg-gray-100'
                      }`}
                      onClick={() => toggleCategory(category)}
                    >
                      {category}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Line Items */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <Label>Work Items</Label>
                  <Button variant="outline" size="sm" onClick={addLineItem} className="rounded-lg">
                    <Plus className="w-4 h-4 mr-1" /> Add Item
                  </Button>
                </div>

                <div className="space-y-3">
                  {lineItems.map((item, index) => (
                    <div key={index} className="grid grid-cols-12 gap-3 items-start p-3 bg-gray-50 rounded-xl">
                      <div className="col-span-3">
                        <Label className="text-xs text-gray-500 mb-1 block">Category</Label>
                        <Select
                          value={item.category}
                          onValueChange={(value) => updateLineItem(index, 'category', value)}
                        >
                          <SelectTrigger className="rounded-lg">
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                          <SelectContent>
                            {PROBLEM_CATEGORIES.map((cat) => (
                              <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="col-span-5">
                        <Label className="text-xs text-gray-500 mb-1 block">Problem Description</Label>
                        <Textarea
                          value={item.problemDescription}
                          onChange={(e) => updateLineItem(index, 'problemDescription', e.target.value)}
                          placeholder="Describe the problem or work needed"
                          className="rounded-lg min-h-[40px] resize-none"
                          rows={1}
                        />
                      </div>
                      <div className="col-span-3">
                        <Label className="text-xs text-gray-500 mb-1 block">Est. Price (₹)</Label>
                        <Input
                          type="number"
                          value={item.estimatedPrice}
                          onChange={(e) => updateLineItem(index, 'estimatedPrice', e.target.value)}
                          placeholder="0"
                          className="rounded-lg"
                        />
                      </div>
                      <div className="col-span-1 flex items-end justify-center h-full pb-2">
                        {lineItems.length > 1 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeLineItem(index)}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Total */}
              <div className="bg-gray-100 rounded-xl p-4 flex justify-between items-center">
                <span className="font-medium text-gray-700">Total Estimated Amount</span>
                <span className="text-2xl font-bold text-primary">₹{calculateTotal().toLocaleString()}</span>
              </div>

              {/* Actions */}
              <div className="flex gap-3 justify-end">
                <Button variant="outline" onClick={() => setShowCreateModal(false)} className="rounded-xl">
                  Cancel
                </Button>
                <Button onClick={() => handleSaveJobCard('finalized')} className="rounded-xl bg-primary hover:bg-primary/90">
                  <FileText className="w-4 h-4 mr-2" /> Generate Job Card
                </Button>
              </div>
            </div>
          )}

          {selectedBooking && (
            <div className="space-y-6">
              {/* Booking Info (Read-only) */}
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-sm font-medium text-gray-500 mb-3">Booking Details</p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-gray-400">Customer</p>
                    <p className="font-medium">{selectedBooking.customer_name}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Mobile</p>
                    <p className="font-medium">{selectedBooking.mobile}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Vehicle Type</p>
                    <p className="font-medium">{selectedBooking.vehicle_type}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Brand & Model</p>
                    <p className="font-medium">{selectedBooking.vehicle_brand} {selectedBooking.vehicle_model}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Vehicle Number</p>
                    <p className="font-medium">{selectedBooking.vehicle_number}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Booking ID</p>
                    <p className="font-medium">{selectedBooking.booking_id}</p>
                  </div>
                </div>
              </div>

              {/* Problem Categories */}
              <div>
                <Label className="mb-3 block">Problem Categories</Label>
                <div className="flex flex-wrap gap-2">
                  {PROBLEM_CATEGORIES.map((category) => (
                    <Badge
                      key={category}
                      variant={selectedCategories.includes(category) ? 'default' : 'outline'}
                      className={`cursor-pointer transition-all rounded-full px-4 py-2 ${
                        selectedCategories.includes(category) ? '' : 'hover:bg-gray-100'
                      }`}
                      onClick={() => toggleCategory(category)}
                    >
                      {category}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Line Items */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <Label>Work Items</Label>
                  <Button variant="outline" size="sm" onClick={addLineItem} className="rounded-lg">
                    <Plus className="w-4 h-4 mr-1" /> Add Item
                  </Button>
                </div>
                <div className="space-y-3">
                  {lineItems.map((item, index) => (
                    <div key={index} className="grid grid-cols-12 gap-3 items-start">
                      <div className="col-span-3">
                        <Select
                          value={item.category}
                          onValueChange={(value) => updateLineItem(index, 'category', value)}
                        >
                          <SelectTrigger className="rounded-xl">
                            <SelectValue placeholder="Category" />
                          </SelectTrigger>
                          <SelectContent>
                            {PROBLEM_CATEGORIES.map((cat) => (
                              <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="col-span-6">
                        <Input
                          placeholder="Problem description"
                          value={item.problemDescription}
                          onChange={(e) => updateLineItem(index, 'problemDescription', e.target.value)}
                          className="rounded-xl"
                        />
                      </div>
                      <div className="col-span-2">
                        <Input
                          type="number"
                          placeholder="₹ Price"
                          value={item.estimatedPrice}
                          onChange={(e) => updateLineItem(index, 'estimatedPrice', e.target.value)}
                          className="rounded-xl"
                        />
                      </div>
                      <div className="col-span-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeLineItem(index)}
                          disabled={lineItems.length === 1}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Total */}
              <div className="bg-primary/5 rounded-xl p-4 flex justify-between items-center">
                <span className="font-medium text-gray-700">Total Estimated Amount</span>
                <span className="text-2xl font-bold text-primary">₹{calculateTotal().toLocaleString()}</span>
              </div>

              {/* Actions */}
              <div className="flex gap-3 justify-end">
                <Button variant="outline" onClick={() => setShowCreateModal(false)} className="rounded-xl">
                  Cancel
                </Button>
                <Button onClick={() => handleSaveJobCard('finalized')} className="rounded-xl bg-primary hover:bg-primary/90">
                  <FileText className="w-4 h-4 mr-2" /> {editingJobCard ? 'Update Job Card' : 'Generate Job Card'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
