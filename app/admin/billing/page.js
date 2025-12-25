'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import {
  Plus, Receipt, RefreshCw, FileText, Trash2, X,
  ChevronDown, ChevronUp, CreditCard, Banknote, Download
} from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const LOGO_URL = 'https://customer-assets.emergentagent.com/job_d4760f84-12d2-4078-a43e-316fd20cb244/artifacts/t0cs5j68_Untitled%20design%20%281%29.png';

const PAYMENT_STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-800',
  partial: 'bg-orange-100 text-orange-800',
  paid: 'bg-green-100 text-green-800'
};

export default function BillingPage() {
  const [billings, setBillings] = useState([]);
  const [jobCards, setJobCards] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJobCardSelect, setShowJobCardSelect] = useState(false);
  const [selectedJobCard, setSelectedJobCard] = useState(null);
  const [expandedBilling, setExpandedBilling] = useState(null);

  // Form state
  const [inventoryItems, setInventoryItems] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [discount, setDiscount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [billingsRes, jobCardsRes, inventoryRes] = await Promise.all([
        fetch('/api/billing'),
        fetch('/api/job-cards'),
        fetch('/api/inventory')
      ]);

      const billingsData = await billingsRes.json();
      const jobCardsData = await jobCardsRes.json();
      const inventoryData = await inventoryRes.json();

      setBillings(billingsData.billings || []);
      // Filter job cards that are finalized but not billed yet
      const billedJobCardIds = (billingsData.billings || []).map(b => b.job_card_id);
      const availableJobCards = (jobCardsData.jobCards || []).filter(
        jc => jc.status === 'finalized' && !billedJobCardIds.includes(jc.id)
      );
      setJobCards(availableJobCards);
      setInventory(inventoryData.inventory || []);
    } catch (error) {
      toast.error('Failed to fetch data');
    } finally {
      setIsLoading(false);
    }
  };

  const openJobCardSelector = () => {
    setShowJobCardSelect(true);
  };

  const selectJobCardForBilling = (jobCard) => {
    setSelectedJobCard(jobCard);
    setInventoryItems([]);
    setExpenses([]);
    setDiscount(0);
    setPaymentMethod('');
    setNotes('');
    setShowJobCardSelect(false);
    setShowCreateModal(true);
  };

  const addInventoryItem = () => {
    setInventoryItems([...inventoryItems, { inventoryId: '', quantity: 1, unitPrice: 0, itemName: '' }]);
  };

  const removeInventoryItem = (index) => {
    setInventoryItems(inventoryItems.filter((_, i) => i !== index));
  };

  const updateInventoryItem = (index, field, value) => {
    const updated = [...inventoryItems];
    updated[index][field] = value;

    // Auto-fill price when selecting item
    if (field === 'inventoryId') {
      const item = inventory.find(i => i.id === value);
      if (item) {
        updated[index].unitPrice = item.selling_price || item.purchase_price;
        updated[index].itemName = item.item_name;
      }
    }

    setInventoryItems(updated);
  };

  const addExpense = () => {
    setExpenses([...expenses, { expenseName: '', amount: 0 }]);
  };

  const removeExpense = (index) => {
    setExpenses(expenses.filter((_, i) => i !== index));
  };

  const updateExpense = (index, field, value) => {
    const updated = [...expenses];
    updated[index][field] = value;
    setExpenses(updated);
  };

  const calculateTotals = () => {
    const jobCardTotal = parseFloat(selectedJobCard?.total_estimated_amount) || 0;
    const inventoryTotal = inventoryItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
    const expensesTotal = expenses.reduce((sum, exp) => sum + (parseFloat(exp.amount) || 0), 0);
    const finalAmount = jobCardTotal + inventoryTotal - discount;

    return { jobCardTotal, inventoryTotal, expensesTotal, finalAmount };
  };

  const handleCreateBilling = async () => {
    if (!selectedJobCard) return;

    const totals = calculateTotals();

    try {
      const response = await fetch('/api/billing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobCardId: selectedJobCard.id,
          jobCardTotal: totals.jobCardTotal,
          inventoryTotal: totals.inventoryTotal,
          expensesTotal: totals.expensesTotal,
          discount: discount,
          finalAmount: totals.finalAmount,
          paymentStatus: 'pending',
          paymentMethod: paymentMethod,
          notes: notes,
          items: inventoryItems.filter(item => item.inventoryId).map(item => ({
            inventoryId: item.inventoryId,
            itemName: item.itemName || inventory.find(i => i.id === item.inventoryId)?.item_name || 'Unknown',
            quantity: parseInt(item.quantity),
            unitPrice: parseFloat(item.unitPrice),
            totalPrice: item.quantity * item.unitPrice
          })),
          expenses: expenses.filter(exp => exp.expenseName).map(exp => ({
            expenseName: exp.expenseName,
            amount: parseFloat(exp.amount) || 0,
            notes: exp.notes
          }))
        })
      });

      const data = await response.json();
      if (data.success) {
        toast.success('Bill created successfully!');
        setShowCreateModal(false);
        setSelectedJobCard(null);
        fetchData();
      } else {
        toast.error(data.error || 'Failed to create bill');
      }
    } catch (error) {
      toast.error('Something went wrong');
    }
  };

  const handleUpdatePaymentStatus = async (billingId, newStatus, method = null) => {
    try {
      const response = await fetch(`/api/billing/${billingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentStatus: newStatus, paymentMethod: method })
      });

      const data = await response.json();
      if (data.success) {
        toast.success('Payment status updated!');
        fetchData();
      } else {
        toast.error('Failed to update status');
      }
    } catch (error) {
      toast.error('Something went wrong');
    }
  };

  const handleDeleteBilling = async (billingId) => {
    try {
      const response = await fetch(`/api/billing/${billingId}`, {
        method: 'DELETE'
      });

      const data = await response.json();
      if (data.success) {
        toast.success('Bill deleted successfully!');
        fetchData();
      } else {
        toast.error('Failed to delete bill');
      }
    } catch (error) {
      toast.error('Something went wrong');
    }
  };

  // Generate PDF Bill - Professional Format
  const generatePDF = async (billing) => {
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 15;
      
      // ===== LOAD AND ADD LOGO =====
      // Load logo image
      const logoUrl = LOGO_URL;
      let logoLoaded = false;
      
      try {
        const response = await fetch(logoUrl);
        const blob = await response.blob();
        const reader = new FileReader();
        
        await new Promise((resolve, reject) => {
          reader.onload = () => {
            try {
              // Add logo at top right corner
              doc.addImage(reader.result, 'PNG', pageWidth - 45, 10, 30, 30);
              logoLoaded = true;
              resolve();
            } catch (e) {
              resolve(); // Continue without logo if it fails
            }
          };
          reader.onerror = () => resolve(); // Continue without logo
          reader.readAsDataURL(blob);
        });
      } catch (e) {
        console.log('Logo loading failed, continuing without logo');
      }
      
      // ===== HEADER SECTION =====
      // Company Name - Large and Bold (shifted left if logo is present)
      doc.setFontSize(28);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(31, 41, 55);
      doc.text('PATIDAR AUTO', margin, 22);
      
      // Tagline
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(107, 114, 128);
      doc.text('Two-Wheeler & Four-Wheeler Service', margin, 30);
      
      // Address
      doc.setFontSize(9);
      doc.text('Opp. Sorathiya Hall, Mavdi, Rajkot - 360005', margin, 36);
      doc.text('Phone: +91 8200809405 | Instagram: @patidar_auto_mavdi', margin, 41);
      
      // Header Line
      doc.setDrawColor(59, 130, 246);
      doc.setLineWidth(1);
      doc.line(margin, 46, pageWidth - margin, 46);
      
      // ===== INVOICE TITLE =====
      doc.setFillColor(59, 130, 246);
      doc.rect(pageWidth / 2 - 30, 50, 60, 10, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('TAX INVOICE', pageWidth / 2, 57, { align: 'center' });
      
      // ===== BILL INFO BOX =====
      doc.setTextColor(31, 41, 55);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      
      // Bill details - Left side
      let yPos = 70;
      doc.text('Bill Details', margin, yPos);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      yPos += 7;
      doc.text('Bill No: ' + (billing.bill_number || 'N/A'), margin, yPos);
      yPos += 5;
      doc.text('Date: ' + new Date(billing.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }), margin, yPos);
      yPos += 5;
      doc.text('Job Card: ' + (billing.job_cards?.job_card_number || 'N/A'), margin, yPos);
      
      // Customer details - Right side
      const booking = billing.job_cards?.bookings;
      const rightX = pageWidth / 2 + 10;
      yPos = 70;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text('Customer Details', rightX, yPos);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      yPos += 7;
      doc.text('Name: ' + (booking?.customer_name || 'N/A'), rightX, yPos);
      yPos += 5;
      doc.text('Mobile: ' + (booking?.mobile || 'N/A'), rightX, yPos);
      yPos += 5;
      doc.text('Vehicle: ' + (booking?.vehicle_brand || '') + ' ' + (booking?.vehicle_model || ''), rightX, yPos);
      yPos += 5;
      doc.text('Reg. No: ' + (booking?.vehicle_number || 'N/A'), rightX, yPos);
      yPos += 5;
      doc.text('Service Type: ' + (booking?.service_type || 'N/A'), rightX, yPos);
      
      // Separator Line
      yPos = 100;
      doc.setDrawColor(220, 220, 220);
      doc.setLineWidth(0.5);
      doc.line(margin, yPos, pageWidth - margin, yPos);
      
      // ===== SERVICE CHARGES TABLE =====
      yPos += 8;
      
      const jobCardItems = billing.job_cards?.job_card_items || [];
      if (jobCardItems.length > 0) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.setTextColor(31, 41, 55);
        doc.text('Service Charges', margin, yPos);
        yPos += 5;
        
        const serviceData = jobCardItems.map((item, i) => [
          String(i + 1),
          item.problem_description || 'Service',
          item.category || '-',
          'Rs. ' + parseFloat(item.estimated_price || 0).toFixed(2)
        ]);
        
        autoTable(doc, {
          startY: yPos,
          head: [['#', 'Description', 'Category', 'Amount (Rs.)']],
          body: serviceData,
          theme: 'striped',
          headStyles: { 
            fillColor: [59, 130, 246], 
            textColor: 255,
            fontSize: 9,
            fontStyle: 'bold',
            halign: 'center'
          },
          bodyStyles: {
            fontSize: 9,
            textColor: [50, 50, 50]
          },
          columnStyles: {
            0: { cellWidth: 12, halign: 'center' },
            1: { cellWidth: 80 },
            2: { cellWidth: 35, halign: 'center' },
            3: { cellWidth: 35, halign: 'right' }
          },
          margin: { left: margin, right: margin }
        });
        
        yPos = doc.lastAutoTable.finalY + 8;
      }
      
      // ===== PARTS/MATERIALS TABLE =====
      const billingItems = billing.billing_items || [];
      if (billingItems.length > 0) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.setTextColor(31, 41, 55);
        doc.text('Parts / Materials Used', margin, yPos);
        yPos += 5;
        
        const partsData = billingItems.map((item, i) => [
          String(i + 1),
          item.item_name || 'Part',
          String(item.quantity || 1),
          'Rs. ' + parseFloat(item.unit_price || 0).toFixed(2),
          'Rs. ' + parseFloat(item.total_price || 0).toFixed(2)
        ]);
        
        autoTable(doc, {
          startY: yPos,
          head: [['#', 'Item Name', 'Qty', 'Rate (Rs.)', 'Amount (Rs.)']],
          body: partsData,
          theme: 'striped',
          headStyles: { 
            fillColor: [59, 130, 246], 
            textColor: 255,
            fontSize: 9,
            fontStyle: 'bold',
            halign: 'center'
          },
          bodyStyles: {
            fontSize: 9,
            textColor: [50, 50, 50]
          },
          columnStyles: {
            0: { cellWidth: 12, halign: 'center' },
            1: { cellWidth: 65 },
            2: { cellWidth: 18, halign: 'center' },
            3: { cellWidth: 32, halign: 'right' },
            4: { cellWidth: 35, halign: 'right' }
          },
          margin: { left: margin, right: margin }
        });
        
        yPos = doc.lastAutoTable.finalY + 8;
      }
      
      // ===== SUMMARY SECTION =====
      const summaryStartX = pageWidth - 85;
      
      // Summary Box border
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.3);
      doc.rect(summaryStartX - 5, yPos - 2, 75, 52);
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(31, 41, 55);
      
      // Service Charges
      const serviceTotal = parseFloat(billing.job_card_total || 0);
      doc.text('Service Charges:', summaryStartX, yPos + 6);
      doc.text('Rs. ' + serviceTotal.toFixed(2), pageWidth - margin - 5, yPos + 6, { align: 'right' });
      
      // Parts Total
      const partsTotal = parseFloat(billing.inventory_total || 0);
      if (partsTotal > 0) {
        doc.text('Parts Total:', summaryStartX, yPos + 14);
        doc.text('Rs. ' + partsTotal.toFixed(2), pageWidth - margin - 5, yPos + 14, { align: 'right' });
      }
      
      // Subtotal
      const subtotal = serviceTotal + partsTotal;
      doc.text('Subtotal:', summaryStartX, yPos + 22);
      doc.text('Rs. ' + subtotal.toFixed(2), pageWidth - margin - 5, yPos + 22, { align: 'right' });
      
      // Discount
      const discountAmt = parseFloat(billing.discount || 0);
      if (discountAmt > 0) {
        doc.setTextColor(220, 38, 38);
        doc.text('Discount:', summaryStartX, yPos + 30);
        doc.text('- Rs. ' + discountAmt.toFixed(2), pageWidth - margin - 5, yPos + 30, { align: 'right' });
        doc.setTextColor(31, 41, 55);
      }
      
      // Grand Total Line
      doc.setDrawColor(59, 130, 246);
      doc.setLineWidth(0.5);
      doc.line(summaryStartX, yPos + 35, pageWidth - margin, yPos + 35);
      
      // Grand Total
      const finalAmt = parseFloat(billing.final_amount || 0);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(59, 130, 246);
      doc.text('GRAND TOTAL:', summaryStartX, yPos + 44);
      doc.text('Rs. ' + finalAmt.toFixed(2), pageWidth - margin - 5, yPos + 44, { align: 'right' });
      
      yPos += 60;
      
      // ===== PAYMENT STATUS =====
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      const isPaid = billing.payment_status === 'paid';
      const isPartial = billing.payment_status === 'partial';
      if (isPaid) {
        doc.setTextColor(34, 197, 94);
      } else if (isPartial) {
        doc.setTextColor(249, 115, 22);
      } else {
        doc.setTextColor(239, 68, 68);
      }
      const statusText = isPaid ? 'PAID' : isPartial ? 'PARTIALLY PAID' : 'PAYMENT PENDING';
      const paymentMethodText = billing.payment_method ? ' via ' + billing.payment_method.toUpperCase() : '';
      doc.text('Payment Status: ' + statusText + paymentMethodText, margin, yPos);
      
      // ===== FOOTER =====
      const footerY = pageHeight - 35;
      
      // Footer Line
      doc.setDrawColor(220, 220, 220);
      doc.setLineWidth(0.3);
      doc.line(margin, footerY - 10, pageWidth - margin, footerY - 10);
      
      // Thank you message
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(59, 130, 246);
      doc.text('Thank you for choosing Patidar Auto!', pageWidth / 2, footerY, { align: 'center' });
      
      // Contact info
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(107, 114, 128);
      doc.text('For queries: +91 8200809405 | Follow us: @patidar_auto_mavdi', pageWidth / 2, footerY + 7, { align: 'center' });
      
      // Terms
      doc.setFontSize(7);
      doc.text('Terms: All disputes subject to Rajkot jurisdiction. Warranty as per manufacturer guidelines.', pageWidth / 2, footerY + 14, { align: 'center' });
      
      // ===== SAVE PDF =====
      // Open PDF in new window for download
      const pdfBlob = doc.output('blob');
      const pdfUrl = URL.createObjectURL(pdfBlob);
      const newWindow = window.open(pdfUrl, '_blank');
      if (newWindow) {
        newWindow.onload = () => {
          setTimeout(() => {
            newWindow.document.title = 'Patidar_Auto_Bill_' + billing.bill_number + '.pdf';
          }, 100);
        };
      }
      // Also try direct download
      const downloadLink = document.createElement('a');
      downloadLink.href = pdfUrl;
      downloadLink.download = 'Patidar_Auto_Bill_' + billing.bill_number + '.pdf';
      downloadLink.style.display = 'none';
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      setTimeout(() => URL.revokeObjectURL(pdfUrl), 1000);
      toast.success('Bill PDF opened! Use Ctrl+S or the Print menu to save.');
      
    } catch (error) {
      console.error('PDF generation error:', error);
      toast.error('Failed to generate PDF: ' + error.message);
    }
  };

  const totals = selectedJobCard ? calculateTotals() : { jobCardTotal: 0, inventoryTotal: 0, expensesTotal: 0, finalAmount: 0 };

  return (
    <div className="p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Billing</h1>
            <p className="text-gray-500 text-sm mt-1">Generate bills from job cards</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={fetchData} variant="outline" className="rounded-xl">
              <RefreshCw className="w-4 h-4 mr-2" /> Refresh
            </Button>
            <Button onClick={openJobCardSelector} className="rounded-xl">
              <Plus className="w-4 h-4 mr-2" /> Create Bill
            </Button>
          </div>
        </div>

        {/* Job Cards Ready for Billing */}
        {jobCards.length > 0 && (
          <Card className="border-0 shadow-sm rounded-2xl mb-6 bg-blue-50/50">
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <FileText className="w-5 h-5 mr-2 text-blue-600" />
                Job Cards Ready for Billing ({jobCards.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {jobCards.map((jobCard) => (
                  <div
                    key={jobCard.id}
                    onClick={() => selectJobCardForBilling(jobCard)}
                    className="p-4 bg-white border border-blue-100 rounded-xl hover:border-primary hover:shadow-md cursor-pointer transition-all"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-gray-900">{jobCard.job_card_number}</span>
                      <Badge className="bg-blue-100 text-blue-800">₹{jobCard.total_estimated_amount}</Badge>
                    </div>
                    <p className="text-sm text-gray-600">{jobCard.bookings?.customer_name}</p>
                    <p className="text-xs text-gray-400">{jobCard.bookings?.vehicle_brand} {jobCard.bookings?.vehicle_model}</p>
                    <p className="text-xs text-gray-400 mt-1">{jobCard.bookings?.vehicle_number}</p>
                    <Button size="sm" className="w-full mt-3 rounded-lg">
                      <Receipt className="w-4 h-4 mr-1" /> Generate Bill
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* No Job Cards Message */}
        {jobCards.length === 0 && !isLoading && (
          <Card className="border-0 shadow-sm rounded-2xl mb-6 bg-yellow-50/50">
            <CardContent className="p-6 text-center">
              <FileText className="w-12 h-12 text-yellow-500 mx-auto mb-3" />
              <h3 className="font-medium text-gray-900 mb-1">No Job Cards Ready for Billing</h3>
              <p className="text-sm text-gray-500">
                Create a job card from a booking and mark it as "Finalized" to generate a bill.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Billings List */}
        <Card className="border-0 shadow-sm rounded-2xl">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">All Bills</CardTitle>
              <Badge variant="outline">{billings.length} total</Badge>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-12">
                <RefreshCw className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
                <p className="text-gray-500">Loading bills...</p>
              </div>
            ) : billings.length === 0 ? (
              <div className="text-center py-12">
                <Receipt className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No bills yet</p>
                <p className="text-gray-400 text-sm">Create a bill from a finalized job card</p>
              </div>
            ) : (
              <div className="space-y-4">
                {billings.map((billing) => (
                  <div
                    key={billing.id}
                    className="border border-gray-100 rounded-2xl overflow-hidden"
                  >
                    <div
                      className="p-4 cursor-pointer hover:bg-gray-50"
                      onClick={() => setExpandedBilling(expandedBilling === billing.id ? null : billing.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                            <Receipt className="w-5 h-5 text-green-600" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-gray-900">{billing.bill_number}</span>
                              <Badge className={`${PAYMENT_STATUS_COLORS[billing.payment_status]} border-0`}>
                                {billing.payment_status}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-500">
                              {billing.job_cards?.bookings?.customer_name} • {billing.job_cards?.job_card_number}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="text-xl font-bold text-gray-900">₹{billing.final_amount}</p>
                            <p className="text-xs text-gray-400">
                              {new Date(billing.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          {expandedBilling === billing.id ? (
                            <ChevronUp className="w-5 h-5 text-gray-400" />
                          ) : (
                            <ChevronDown className="w-5 h-5 text-gray-400" />
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Expanded View */}
                    {expandedBilling === billing.id && (
                      <div className="border-t border-gray-100 p-4 bg-gray-50/50">
                        {/* Customer & Vehicle Info */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 text-sm">
                          <div>
                            <p className="text-gray-400">Customer</p>
                            <p className="font-medium">{billing.job_cards?.bookings?.customer_name}</p>
                          </div>
                          <div>
                            <p className="text-gray-400">Mobile</p>
                            <p className="font-medium">{billing.job_cards?.bookings?.mobile}</p>
                          </div>
                          <div>
                            <p className="text-gray-400">Vehicle</p>
                            <p className="font-medium">{billing.job_cards?.bookings?.vehicle_brand} {billing.job_cards?.bookings?.vehicle_model}</p>
                          </div>
                          <div>
                            <p className="text-gray-400">Reg. No</p>
                            <p className="font-medium">{billing.job_cards?.bookings?.vehicle_number}</p>
                          </div>
                        </div>

                        {/* Bill Breakdown */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                          <div className="bg-white p-3 rounded-xl">
                            <p className="text-gray-400 text-sm">Service Charges</p>
                            <p className="font-semibold">₹{billing.job_card_total}</p>
                          </div>
                          <div className="bg-white p-3 rounded-xl">
                            <p className="text-gray-400 text-sm">Parts Used</p>
                            <p className="font-semibold">₹{billing.inventory_total}</p>
                          </div>
                          <div className="bg-white p-3 rounded-xl">
                            <p className="text-gray-400 text-sm">Discount</p>
                            <p className="font-semibold text-red-600">-₹{billing.discount}</p>
                          </div>
                          <div className="bg-primary/10 p-3 rounded-xl">
                            <p className="text-gray-400 text-sm">Final Amount</p>
                            <p className="font-bold text-primary">₹{billing.final_amount}</p>
                          </div>
                        </div>

                        {/* Service Items */}
                        {billing.job_cards?.job_card_items?.length > 0 && (
                          <div className="mb-4">
                            <p className="text-sm font-medium text-gray-500 mb-2">Service Charges</p>
                            <div className="space-y-2">
                              {billing.job_cards.job_card_items.map((item, i) => (
                                <div key={i} className="flex justify-between items-center p-2 bg-white rounded-lg text-sm">
                                  <div>
                                    <span>{item.problem_description}</span>
                                    <span className="text-xs text-gray-400 ml-2">({item.category})</span>
                                  </div>
                                  <span className="font-medium">₹{item.estimated_price}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Parts Used */}
                        {billing.billing_items?.length > 0 && (
                          <div className="mb-4">
                            <p className="text-sm font-medium text-gray-500 mb-2">Parts Used</p>
                            <div className="space-y-2">
                              {billing.billing_items.map((item, i) => (
                                <div key={i} className="flex justify-between items-center p-2 bg-white rounded-lg text-sm">
                                  <span>{item.item_name} x{item.quantity}</span>
                                  <span className="font-medium">₹{item.total_price}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Actions */}
                        <div className="flex gap-2 flex-wrap">
                          {billing.payment_status !== 'paid' && (
                            <>
                              <Button
                                size="sm"
                                onClick={() => handleUpdatePaymentStatus(billing.id, 'paid', 'cash')}
                                className="rounded-lg bg-green-600 hover:bg-green-700"
                              >
                                <Banknote className="w-4 h-4 mr-1" /> Paid (Cash)
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => handleUpdatePaymentStatus(billing.id, 'paid', 'upi')}
                                className="rounded-lg"
                              >
                                <CreditCard className="w-4 h-4 mr-1" /> Paid (UPI)
                              </Button>
                            </>
                          )}
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => generatePDF(billing)}
                            className="rounded-lg"
                          >
                            <Download className="w-4 h-4 mr-1" /> Download PDF
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="rounded-lg text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="w-4 h-4 mr-1" /> Delete
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="rounded-2xl">
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Bill?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete bill <strong>{billing.bill_number}</strong>?
                                  This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  className="bg-red-600 hover:bg-red-700 rounded-xl"
                                  onClick={() => handleDeleteBilling(billing.id)}
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
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

      {/* Job Card Selector Modal */}
      <Dialog open={showJobCardSelect} onOpenChange={setShowJobCardSelect}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Select Job Card for Billing</DialogTitle>
          </DialogHeader>
          {jobCards.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No finalized job cards available</p>
              <p className="text-sm text-gray-400 mt-1">Create and finalize a job card first</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
              {jobCards.map((jobCard) => (
                <div
                  key={jobCard.id}
                  onClick={() => selectJobCardForBilling(jobCard)}
                  className="p-4 border border-gray-200 rounded-xl hover:border-primary hover:bg-primary/5 cursor-pointer transition-all"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-gray-900">{jobCard.job_card_number}</span>
                    <Badge variant="outline">₹{jobCard.total_estimated_amount}</Badge>
                  </div>
                  <p className="text-sm text-gray-600">{jobCard.bookings?.customer_name}</p>
                  <p className="text-xs text-gray-400">{jobCard.bookings?.vehicle_brand} {jobCard.bookings?.vehicle_model} • {jobCard.bookings?.vehicle_number}</p>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Create Billing Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Bill - {selectedJobCard?.job_card_number}</DialogTitle>
          </DialogHeader>

          {selectedJobCard && (
            <div className="space-y-6">
              {/* Job Card & Customer Info */}
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-gray-400">Customer</p>
                    <p className="font-medium">{selectedJobCard.bookings?.customer_name}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Mobile</p>
                    <p className="font-medium">{selectedJobCard.bookings?.mobile}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Vehicle</p>
                    <p className="font-medium">{selectedJobCard.bookings?.vehicle_brand} {selectedJobCard.bookings?.vehicle_model}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Reg. No</p>
                    <p className="font-medium">{selectedJobCard.bookings?.vehicle_number}</p>
                  </div>
                </div>
              </div>

              {/* Job Card Charges */}
              <div>
                <Label className="mb-2 block">Service Charges (from Job Card)</Label>
                <div className="bg-gray-50 rounded-xl p-4">
                  {selectedJobCard.job_card_items?.map((item, i) => (
                    <div key={i} className="flex justify-between py-2 border-b border-gray-200 last:border-0">
                      <div>
                        <span className="text-sm">{item.problem_description}</span>
                        <span className="text-xs text-gray-400 ml-2">({item.category})</span>
                      </div>
                      <span className="font-medium">₹{item.estimated_price}</span>
                    </div>
                  ))}
                  <div className="flex justify-between pt-3 font-semibold text-primary">
                    <span>Service Subtotal</span>
                    <span>₹{selectedJobCard.total_estimated_amount}</span>
                  </div>
                </div>
              </div>

              {/* Inventory Items */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>Parts / Materials Used (Optional)</Label>
                  <Button variant="outline" size="sm" onClick={addInventoryItem} className="rounded-lg">
                    <Plus className="w-4 h-4 mr-1" /> Add Part
                  </Button>
                </div>
                {inventoryItems.length > 0 && (
                  <div className="space-y-2">
                    {inventoryItems.map((item, index) => (
                      <div key={index} className="grid grid-cols-12 gap-2 items-center">
                        <div className="col-span-5">
                          <Select
                            value={item.inventoryId}
                            onValueChange={(v) => updateInventoryItem(index, 'inventoryId', v)}
                          >
                            <SelectTrigger className="rounded-lg">
                              <SelectValue placeholder="Select part" />
                            </SelectTrigger>
                            <SelectContent>
                              {inventory.map((inv) => (
                                <SelectItem key={inv.id} value={inv.id}>
                                  {inv.item_name} (Stock: {inv.quantity_in_stock})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="col-span-2">
                          <Input
                            type="number"
                            placeholder="Qty"
                            value={item.quantity}
                            onChange={(e) => updateInventoryItem(index, 'quantity', parseInt(e.target.value) || 1)}
                            className="rounded-lg"
                          />
                        </div>
                        <div className="col-span-3">
                          <Input
                            type="number"
                            placeholder="Price"
                            value={item.unitPrice}
                            onChange={(e) => updateInventoryItem(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                            className="rounded-lg"
                          />
                        </div>
                        <div className="col-span-1 text-right font-medium text-sm">
                          ₹{(item.quantity * item.unitPrice) || 0}
                        </div>
                        <div className="col-span-1">
                          <Button variant="ghost" size="icon" onClick={() => removeInventoryItem(index)} className="text-red-500">
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Expenses */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>Additional Expenses (Internal - not shown to customer)</Label>
                  <Button variant="outline" size="sm" onClick={addExpense} className="rounded-lg">
                    <Plus className="w-4 h-4 mr-1" /> Add Expense
                  </Button>
                </div>
                {expenses.length > 0 && (
                  <div className="space-y-2">
                    {expenses.map((exp, index) => (
                      <div key={index} className="grid grid-cols-12 gap-2 items-center">
                        <div className="col-span-7">
                          <Input
                            placeholder="Expense name"
                            value={exp.expenseName}
                            onChange={(e) => updateExpense(index, 'expenseName', e.target.value)}
                            className="rounded-lg"
                          />
                        </div>
                        <div className="col-span-3">
                          <Input
                            type="number"
                            placeholder="Amount"
                            value={exp.amount}
                            onChange={(e) => updateExpense(index, 'amount', e.target.value)}
                            className="rounded-lg"
                          />
                        </div>
                        <div className="col-span-2">
                          <Button variant="ghost" size="icon" onClick={() => removeExpense(index)} className="text-red-500">
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Discount */}
              <div>
                <Label>Discount (₹)</Label>
                <Input
                  type="number"
                  value={discount}
                  onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                  placeholder="Enter discount amount"
                  className="rounded-xl mt-1"
                />
              </div>

              {/* Notes */}
              <div>
                <Label>Notes (Optional)</Label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Any additional notes..."
                  className="rounded-xl mt-1"
                  rows={2}
                />
              </div>

              {/* Summary */}
              <div className="bg-primary/5 rounded-xl p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Service Charges</span>
                  <span>₹{totals.jobCardTotal}</span>
                </div>
                {totals.inventoryTotal > 0 && (
                  <div className="flex justify-between text-sm">
                    <span>Parts Total</span>
                    <span>₹{totals.inventoryTotal}</span>
                  </div>
                )}
                {discount > 0 && (
                  <div className="flex justify-between text-sm text-red-600">
                    <span>Discount</span>
                    <span>-₹{discount}</span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-bold border-t pt-2">
                  <span>Final Amount</span>
                  <span className="text-primary">₹{totals.finalAmount}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 justify-end">
                <Button variant="outline" onClick={() => setShowCreateModal(false)} className="rounded-xl">
                  Cancel
                </Button>
                <Button onClick={handleCreateBilling} className="rounded-xl">
                  <Receipt className="w-4 h-4 mr-2" /> Generate Bill
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
