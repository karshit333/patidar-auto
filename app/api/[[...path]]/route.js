import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '@/lib/supabase';

// Helper to add CORS headers
function corsHeaders(response) {
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  return response;
}

// ==================== HEALTH CHECK ====================
async function handleHealthCheck() {
  return corsHeaders(NextResponse.json({ status: 'ok', timestamp: new Date().toISOString() }));
}

// ==================== BOOKINGS ====================
async function handleCreateBooking(request) {
  try {
    const body = await request.json();
    const bookingId = `PA-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    
    const bookingData = {
      id: uuidv4(),
      booking_id: bookingId,
      customer_name: body.customerName,
      mobile: body.mobile,
      vehicle_type: body.vehicleType,
      vehicle_brand: body.vehicleBrand,
      vehicle_model: body.vehicleModel,
      vehicle_number: body.vehicleNumber,
      service_type: body.serviceType,
      other_description: body.otherDescription || null,
      preferred_date: body.preferredDate,
      preferred_time: body.preferredTime,
      additional_notes: body.additionalNotes || null,
      status: 'pending',
      created_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('bookings')
      .insert([bookingData])
      .select();

    if (error) {
      console.error('Supabase error:', error);
      return corsHeaders(NextResponse.json({ error: 'Failed to create booking', details: error.message }, { status: 500 }));
    }

    return corsHeaders(NextResponse.json({ success: true, booking: data[0], bookingId }));
  } catch (error) {
    console.error('Create booking error:', error);
    return corsHeaders(NextResponse.json({ error: 'Internal server error' }, { status: 500 }));
  }
}

async function handleGetBookings(request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const vehicleType = searchParams.get('vehicleType');
    const serviceType = searchParams.get('serviceType');
    const date = searchParams.get('date');

    let query = supabase.from('bookings').select('*').order('created_at', { ascending: false });

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }
    if (vehicleType && vehicleType !== 'all') {
      query = query.eq('vehicle_type', vehicleType);
    }
    if (serviceType && serviceType !== 'all') {
      query = query.eq('service_type', serviceType);
    }
    if (date) {
      query = query.eq('preferred_date', date);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Supabase error:', error);
      return corsHeaders(NextResponse.json({ error: 'Failed to fetch bookings' }, { status: 500 }));
    }

    return corsHeaders(NextResponse.json({ bookings: data || [] }));
  } catch (error) {
    console.error('Get bookings error:', error);
    return corsHeaders(NextResponse.json({ error: 'Internal server error' }, { status: 500 }));
  }
}

async function handleGetBookingById(bookingId) {
  try {
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .single();

    if (error) {
      return corsHeaders(NextResponse.json({ error: 'Booking not found' }, { status: 404 }));
    }

    return corsHeaders(NextResponse.json({ booking: data }));
  } catch (error) {
    return corsHeaders(NextResponse.json({ error: 'Internal server error' }, { status: 500 }));
  }
}

async function handleUpdateBookingStatus(request, bookingId) {
  try {
    const body = await request.json();
    const { status } = body;

    const { data, error } = await supabase
      .from('bookings')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', bookingId)
      .select();

    if (error) {
      return corsHeaders(NextResponse.json({ error: 'Failed to update booking' }, { status: 500 }));
    }

    return corsHeaders(NextResponse.json({ success: true, booking: data[0] }));
  } catch (error) {
    return corsHeaders(NextResponse.json({ error: 'Internal server error' }, { status: 500 }));
  }
}

async function handleDeleteBooking(bookingId) {
  try {
    const { error } = await supabase
      .from('bookings')
      .delete()
      .eq('id', bookingId);

    if (error) {
      return corsHeaders(NextResponse.json({ error: 'Failed to delete booking' }, { status: 500 }));
    }

    return corsHeaders(NextResponse.json({ success: true, message: 'Booking deleted successfully' }));
  } catch (error) {
    return corsHeaders(NextResponse.json({ error: 'Internal server error' }, { status: 500 }));
  }
}

// ==================== STATS ====================
async function handleGetStats() {
  try {
    const { data: bookings, error } = await supabase
      .from('bookings')
      .select('status, vehicle_type, service_type');

    if (error) {
      return corsHeaders(NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 }));
    }

    const stats = {
      total: bookings?.length || 0,
      pending: bookings?.filter(b => b.status === 'pending').length || 0,
      confirmed: bookings?.filter(b => b.status === 'confirmed').length || 0,
      completed: bookings?.filter(b => b.status === 'completed').length || 0,
      twoWheeler: bookings?.filter(b => b.vehicle_type === 'Two Wheeler').length || 0,
      fourWheeler: bookings?.filter(b => b.vehicle_type === 'Four Wheeler').length || 0
    };

    return corsHeaders(NextResponse.json({ stats }));
  } catch (error) {
    return corsHeaders(NextResponse.json({ error: 'Internal server error' }, { status: 500 }));
  }
}

// ==================== ADMIN AUTH ====================
async function handleAdminLogin(request) {
  try {
    const body = await request.json();
    const { username, password } = body;

    const adminUsername = process.env.ADMIN_USERNAME || 'admin';
    const adminPassword = process.env.ADMIN_PASSWORD || 'jaydeep123';

    if (username === adminUsername && password === adminPassword) {
      const token = uuidv4();
      return corsHeaders(NextResponse.json({ 
        success: true, 
        token,
        message: 'Login successful' 
      }));
    }

    return corsHeaders(NextResponse.json({ error: 'Invalid credentials' }, { status: 401 }));
  } catch (error) {
    return corsHeaders(NextResponse.json({ error: 'Internal server error' }, { status: 500 }));
  }
}

// ==================== JOB CARDS ====================
async function handleCreateJobCard(request) {
  try {
    const body = await request.json();
    const jobCardNumber = `JC-${Date.now().toString(36).toUpperCase()}`;

    let bookingId = body.bookingId;

    // Handle walk-in customer - create a booking first
    if (body.isWalkIn && body.walkInCustomer) {
      const walkIn = body.walkInCustomer;
      const newBookingId = `WI-${Date.now().toString(36).toUpperCase()}`;
      
      const bookingData = {
        id: uuidv4(),
        booking_id: newBookingId,
        customer_name: walkIn.customerName,
        mobile: walkIn.mobile,
        vehicle_type: walkIn.vehicleType,
        vehicle_brand: walkIn.vehicleBrand,
        vehicle_model: walkIn.vehicleModel || '',
        vehicle_number: walkIn.vehicleNumber || '',
        service_type: walkIn.serviceType || 'General Service',
        preferred_date: new Date().toISOString().split('T')[0],
        preferred_time: 'Walk-in',
        status: 'confirmed',
        created_at: new Date().toISOString()
      };

      const { data: newBooking, error: bookingError } = await supabase
        .from('bookings')
        .insert([bookingData])
        .select();

      if (bookingError) {
        console.error('Booking creation error:', bookingError);
        return corsHeaders(NextResponse.json({ error: 'Failed to create walk-in booking' }, { status: 500 }));
      }

      bookingId = newBooking[0].id;
    }

    // Check if job card already exists for this booking (only for non-walk-in)
    if (!body.isWalkIn && bookingId) {
      const { data: existing } = await supabase
        .from('job_cards')
        .select('id')
        .eq('booking_id', bookingId)
        .single();

      if (existing) {
        return corsHeaders(NextResponse.json({ error: 'Job card already exists for this booking' }, { status: 400 }));
      }
    }

    const jobCardData = {
      id: uuidv4(),
      booking_id: bookingId,
      job_card_number: jobCardNumber,
      categories: body.categories || [],
      total_estimated_amount: body.totalEstimatedAmount || 0,
      status: body.status || 'finalized',
      created_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('job_cards')
      .insert([jobCardData])
      .select();

    if (error) {
      console.error('Supabase error:', error);
      return corsHeaders(NextResponse.json({ error: 'Failed to create job card' }, { status: 500 }));
    }

    // Insert job card items
    if (body.items && body.items.length > 0) {
      const itemsData = body.items.map(item => ({
        id: uuidv4(),
        job_card_id: data[0].id,
        category: item.category,
        problem_description: item.problemDescription,
        estimated_price: item.estimatedPrice || 0,
        created_at: new Date().toISOString()
      }));

      await supabase.from('job_card_items').insert(itemsData);
    }

    return corsHeaders(NextResponse.json({ success: true, jobCard: data[0] }));
  } catch (error) {
    console.error('Create job card error:', error);
    return corsHeaders(NextResponse.json({ error: 'Internal server error' }, { status: 500 }));
  }
}

async function handleGetJobCards(request) {
  try {
    const { searchParams } = new URL(request.url);
    const bookingId = searchParams.get('bookingId');
    const status = searchParams.get('status');

    let query = supabase
      .from('job_cards')
      .select(`
        *,
        bookings (
          id, booking_id, customer_name, mobile, vehicle_type, 
          vehicle_brand, vehicle_model, vehicle_number, preferred_date
        ),
        job_card_items (*)
      `)
      .order('created_at', { ascending: false });

    if (bookingId) {
      query = query.eq('booking_id', bookingId);
    }
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Supabase error:', error);
      return corsHeaders(NextResponse.json({ error: 'Failed to fetch job cards' }, { status: 500 }));
    }

    return corsHeaders(NextResponse.json({ jobCards: data || [] }));
  } catch (error) {
    return corsHeaders(NextResponse.json({ error: 'Internal server error' }, { status: 500 }));
  }
}

async function handleGetJobCardById(jobCardId) {
  try {
    const { data, error } = await supabase
      .from('job_cards')
      .select(`
        *,
        bookings (*),
        job_card_items (*)
      `)
      .eq('id', jobCardId)
      .single();

    if (error) {
      return corsHeaders(NextResponse.json({ error: 'Job card not found' }, { status: 404 }));
    }

    return corsHeaders(NextResponse.json({ jobCard: data }));
  } catch (error) {
    return corsHeaders(NextResponse.json({ error: 'Internal server error' }, { status: 500 }));
  }
}

async function handleUpdateJobCard(request, jobCardId) {
  try {
    const body = await request.json();

    // Check if job card is already billed
    const { data: existing } = await supabase
      .from('job_cards')
      .select('status')
      .eq('id', jobCardId)
      .single();

    if (existing?.status === 'billed') {
      return corsHeaders(NextResponse.json({ error: 'Cannot edit a billed job card' }, { status: 400 }));
    }

    const { data, error } = await supabase
      .from('job_cards')
      .update({
        categories: body.categories,
        total_estimated_amount: body.totalEstimatedAmount,
        status: body.status || 'draft',
        updated_at: new Date().toISOString()
      })
      .eq('id', jobCardId)
      .select();

    if (error) {
      return corsHeaders(NextResponse.json({ error: 'Failed to update job card' }, { status: 500 }));
    }

    // Delete existing items and insert new ones
    await supabase.from('job_card_items').delete().eq('job_card_id', jobCardId);

    if (body.items && body.items.length > 0) {
      const itemsData = body.items.map(item => ({
        id: uuidv4(),
        job_card_id: jobCardId,
        category: item.category,
        problem_description: item.problemDescription,
        estimated_price: item.estimatedPrice || 0,
        created_at: new Date().toISOString()
      }));

      await supabase.from('job_card_items').insert(itemsData);
    }

    return corsHeaders(NextResponse.json({ success: true, jobCard: data[0] }));
  } catch (error) {
    return corsHeaders(NextResponse.json({ error: 'Internal server error' }, { status: 500 }));
  }
}

async function handleDeleteJobCard(jobCardId) {
  try {
    const { error } = await supabase
      .from('job_cards')
      .delete()
      .eq('id', jobCardId);

    if (error) {
      return corsHeaders(NextResponse.json({ error: 'Failed to delete job card' }, { status: 500 }));
    }

    return corsHeaders(NextResponse.json({ success: true }));
  } catch (error) {
    return corsHeaders(NextResponse.json({ error: 'Internal server error' }, { status: 500 }));
  }
}

// ==================== INVENTORY ====================
async function handleGetInventoryCategories() {
  try {
    const { data, error } = await supabase
      .from('inventory_categories')
      .select('*')
      .order('name');

    if (error) {
      return corsHeaders(NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 }));
    }

    return corsHeaders(NextResponse.json({ categories: data || [] }));
  } catch (error) {
    return corsHeaders(NextResponse.json({ error: 'Internal server error' }, { status: 500 }));
  }
}

async function handleCreateInventoryCategory(request) {
  try {
    const body = await request.json();

    const { data, error } = await supabase
      .from('inventory_categories')
      .insert([{ id: uuidv4(), name: body.name }])
      .select();

    if (error) {
      return corsHeaders(NextResponse.json({ error: 'Failed to create category' }, { status: 500 }));
    }

    return corsHeaders(NextResponse.json({ success: true, category: data[0] }));
  } catch (error) {
    return corsHeaders(NextResponse.json({ error: 'Internal server error' }, { status: 500 }));
  }
}

async function handleGetInventory(request) {
  try {
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get('categoryId');
    const lowStock = searchParams.get('lowStock');

    let query = supabase
      .from('inventory')
      .select(`
        *,
        inventory_categories (id, name)
      `)
      .order('item_name');

    if (categoryId && categoryId !== 'all') {
      query = query.eq('category_id', categoryId);
    }

    const { data, error } = await query;

    if (error) {
      return corsHeaders(NextResponse.json({ error: 'Failed to fetch inventory' }, { status: 500 }));
    }

    let items = data || [];
    if (lowStock === 'true') {
      items = items.filter(item => item.quantity_in_stock <= item.min_stock_alert);
    }

    return corsHeaders(NextResponse.json({ inventory: items }));
  } catch (error) {
    return corsHeaders(NextResponse.json({ error: 'Internal server error' }, { status: 500 }));
  }
}

async function handleCreateInventoryItem(request) {
  try {
    const body = await request.json();

    const itemData = {
      id: uuidv4(),
      item_name: body.itemName,
      category_id: body.categoryId || null,
      vehicle_compatibility: body.vehicleCompatibility || 'Both',
      purchase_price: body.purchasePrice || 0,
      selling_price: body.sellingPrice || 0,
      quantity_in_stock: body.quantityInStock || 0,
      min_stock_alert: body.minStockAlert || 5,
      created_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('inventory')
      .insert([itemData])
      .select();

    if (error) {
      return corsHeaders(NextResponse.json({ error: 'Failed to create inventory item' }, { status: 500 }));
    }

    return corsHeaders(NextResponse.json({ success: true, item: data[0] }));
  } catch (error) {
    return corsHeaders(NextResponse.json({ error: 'Internal server error' }, { status: 500 }));
  }
}

async function handleUpdateInventoryItem(request, itemId) {
  try {
    const body = await request.json();

    const { data, error } = await supabase
      .from('inventory')
      .update({
        item_name: body.itemName,
        category_id: body.categoryId,
        vehicle_compatibility: body.vehicleCompatibility,
        purchase_price: body.purchasePrice,
        selling_price: body.sellingPrice,
        quantity_in_stock: body.quantityInStock,
        min_stock_alert: body.minStockAlert,
        updated_at: new Date().toISOString()
      })
      .eq('id', itemId)
      .select();

    if (error) {
      return corsHeaders(NextResponse.json({ error: 'Failed to update inventory item' }, { status: 500 }));
    }

    return corsHeaders(NextResponse.json({ success: true, item: data[0] }));
  } catch (error) {
    return corsHeaders(NextResponse.json({ error: 'Internal server error' }, { status: 500 }));
  }
}

async function handleDeleteInventoryItem(itemId) {
  try {
    const { error } = await supabase
      .from('inventory')
      .delete()
      .eq('id', itemId);

    if (error) {
      return corsHeaders(NextResponse.json({ error: 'Failed to delete inventory item' }, { status: 500 }));
    }

    return corsHeaders(NextResponse.json({ success: true }));
  } catch (error) {
    return corsHeaders(NextResponse.json({ error: 'Internal server error' }, { status: 500 }));
  }
}

// ==================== PURCHASES ====================
async function handleCreatePurchase(request) {
  try {
    const body = await request.json();

    const purchaseData = {
      id: uuidv4(),
      inventory_id: body.inventoryId,
      quantity: body.quantity,
      purchase_price: body.purchasePrice,
      supplier: body.supplier || null,
      purchase_date: body.purchaseDate || new Date().toISOString().split('T')[0],
      notes: body.notes || null,
      created_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('purchases')
      .insert([purchaseData])
      .select();

    if (error) {
      return corsHeaders(NextResponse.json({ error: 'Failed to create purchase' }, { status: 500 }));
    }

    // Update inventory quantity
    const { data: inventory } = await supabase
      .from('inventory')
      .select('quantity_in_stock')
      .eq('id', body.inventoryId)
      .single();

    await supabase
      .from('inventory')
      .update({ 
        quantity_in_stock: (inventory?.quantity_in_stock || 0) + body.quantity,
        updated_at: new Date().toISOString()
      })
      .eq('id', body.inventoryId);

    return corsHeaders(NextResponse.json({ success: true, purchase: data[0] }));
  } catch (error) {
    return corsHeaders(NextResponse.json({ error: 'Internal server error' }, { status: 500 }));
  }
}

async function handleGetPurchases(request) {
  try {
    const { searchParams } = new URL(request.url);
    const inventoryId = searchParams.get('inventoryId');

    let query = supabase
      .from('purchases')
      .select(`
        *,
        inventory (id, item_name)
      `)
      .order('purchase_date', { ascending: false });

    if (inventoryId) {
      query = query.eq('inventory_id', inventoryId);
    }

    const { data, error } = await query;

    if (error) {
      return corsHeaders(NextResponse.json({ error: 'Failed to fetch purchases' }, { status: 500 }));
    }

    return corsHeaders(NextResponse.json({ purchases: data || [] }));
  } catch (error) {
    return corsHeaders(NextResponse.json({ error: 'Internal server error' }, { status: 500 }));
  }
}

// ==================== BILLING ====================
async function handleCreateBilling(request) {
  try {
    const body = await request.json();
    const billNumber = `BILL-${Date.now().toString(36).toUpperCase()}`;

    // Check if billing already exists for this job card
    const { data: existing } = await supabase
      .from('billing')
      .select('id')
      .eq('job_card_id', body.jobCardId)
      .single();

    if (existing) {
      return corsHeaders(NextResponse.json({ error: 'Billing already exists for this job card' }, { status: 400 }));
    }

    const billingData = {
      id: uuidv4(),
      job_card_id: body.jobCardId,
      bill_number: billNumber,
      job_card_total: body.jobCardTotal || 0,
      inventory_total: body.inventoryTotal || 0,
      expenses_total: body.expensesTotal || 0,
      discount: body.discount || 0,
      final_amount: body.finalAmount || 0,
      payment_status: body.paymentStatus || 'pending',
      payment_method: body.paymentMethod || null,
      notes: body.notes || null,
      created_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('billing')
      .insert([billingData])
      .select();

    if (error) {
      console.error('Supabase error:', error);
      return corsHeaders(NextResponse.json({ error: 'Failed to create billing' }, { status: 500 }));
    }

    // Insert billing items (inventory used)
    if (body.items && body.items.length > 0) {
      const itemsData = body.items.map(item => ({
        id: uuidv4(),
        billing_id: data[0].id,
        inventory_id: item.inventoryId || null,
        item_name: item.itemName,
        quantity: item.quantity || 1,
        unit_price: item.unitPrice || 0,
        total_price: item.totalPrice || 0,
        created_at: new Date().toISOString()
      }));

      await supabase.from('billing_items').insert(itemsData);

      // Reduce inventory stock
      for (const item of body.items) {
        if (item.inventoryId) {
          const { data: inv } = await supabase
            .from('inventory')
            .select('quantity_in_stock')
            .eq('id', item.inventoryId)
            .single();

          await supabase
            .from('inventory')
            .update({ 
              quantity_in_stock: Math.max(0, (inv?.quantity_in_stock || 0) - item.quantity),
              updated_at: new Date().toISOString()
            })
            .eq('id', item.inventoryId);
        }
      }
    }

    // Insert expenses
    if (body.expenses && body.expenses.length > 0) {
      const expensesData = body.expenses.map(exp => ({
        id: uuidv4(),
        billing_id: data[0].id,
        expense_name: exp.expenseName,
        amount: exp.amount,
        notes: exp.notes || null,
        created_at: new Date().toISOString()
      }));

      await supabase.from('expenses').insert(expensesData);
    }

    // Update job card status to billed
    await supabase
      .from('job_cards')
      .update({ status: 'billed', updated_at: new Date().toISOString() })
      .eq('id', body.jobCardId);

    return corsHeaders(NextResponse.json({ success: true, billing: data[0] }));
  } catch (error) {
    console.error('Create billing error:', error);
    return corsHeaders(NextResponse.json({ error: 'Internal server error' }, { status: 500 }));
  }
}

async function handleGetBillings(request) {
  try {
    const { searchParams } = new URL(request.url);
    const jobCardId = searchParams.get('jobCardId');
    const paymentStatus = searchParams.get('paymentStatus');

    let query = supabase
      .from('billing')
      .select(`
        *,
        job_cards (
          *,
          bookings (*),
          job_card_items (*)
        ),
        billing_items (*),
        expenses (*)
      `)
      .order('created_at', { ascending: false });

    if (jobCardId) {
      query = query.eq('job_card_id', jobCardId);
    }
    if (paymentStatus && paymentStatus !== 'all') {
      query = query.eq('payment_status', paymentStatus);
    }

    const { data, error } = await query;

    if (error) {
      return corsHeaders(NextResponse.json({ error: 'Failed to fetch billings' }, { status: 500 }));
    }

    return corsHeaders(NextResponse.json({ billings: data || [] }));
  } catch (error) {
    return corsHeaders(NextResponse.json({ error: 'Internal server error' }, { status: 500 }));
  }
}

async function handleGetBillingById(billingId) {
  try {
    const { data, error } = await supabase
      .from('billing')
      .select(`
        *,
        job_cards (
          *,
          bookings (*),
          job_card_items (*)
        ),
        billing_items (*),
        expenses (*)
      `)
      .eq('id', billingId)
      .single();

    if (error) {
      return corsHeaders(NextResponse.json({ error: 'Billing not found' }, { status: 404 }));
    }

    return corsHeaders(NextResponse.json({ billing: data }));
  } catch (error) {
    return corsHeaders(NextResponse.json({ error: 'Internal server error' }, { status: 500 }));
  }
}

async function handleUpdateBillingStatus(request, billingId) {
  try {
    const body = await request.json();

    const { data, error } = await supabase
      .from('billing')
      .update({
        payment_status: body.paymentStatus,
        payment_method: body.paymentMethod,
        updated_at: new Date().toISOString()
      })
      .eq('id', billingId)
      .select();

    if (error) {
      return corsHeaders(NextResponse.json({ error: 'Failed to update billing' }, { status: 500 }));
    }

    return corsHeaders(NextResponse.json({ success: true, billing: data[0] }));
  } catch (error) {
    return corsHeaders(NextResponse.json({ error: 'Internal server error' }, { status: 500 }));
  }
}

async function handleDeleteBilling(billingId) {
  try {
    // First, get the billing record to find the job_card_id
    const { data: billing, error: fetchError } = await supabase
      .from('billing')
      .select('job_card_id')
      .eq('id', billingId)
      .single();

    if (fetchError || !billing) {
      return corsHeaders(NextResponse.json({ error: 'Billing not found' }, { status: 404 }));
    }

    const jobCardId = billing.job_card_id;

    // Delete the billing record
    const { error } = await supabase
      .from('billing')
      .delete()
      .eq('id', billingId);

    if (error) {
      return corsHeaders(NextResponse.json({ error: 'Failed to delete billing' }, { status: 500 }));
    }

    // Reset the job card status back to 'finalized' so it can be re-billed
    if (jobCardId) {
      await supabase
        .from('job_cards')
        .update({ status: 'finalized', updated_at: new Date().toISOString() })
        .eq('id', jobCardId);
    }

    return corsHeaders(NextResponse.json({ success: true, message: 'Billing deleted successfully' }));
  } catch (error) {
    return corsHeaders(NextResponse.json({ error: 'Internal server error' }, { status: 500 }));
  }
}

// ==================== STAFF ====================
async function handleGetStaff(request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    let query = supabase
      .from('staff')
      .select('*')
      .order('name');

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) {
      return corsHeaders(NextResponse.json({ error: 'Failed to fetch staff' }, { status: 500 }));
    }

    return corsHeaders(NextResponse.json({ staff: data || [] }));
  } catch (error) {
    return corsHeaders(NextResponse.json({ error: 'Internal server error' }, { status: 500 }));
  }
}

async function handleCreateStaff(request) {
  try {
    const body = await request.json();

    const staffData = {
      id: uuidv4(),
      name: body.name,
      role: body.role,
      mobile: body.mobile || null,
      monthly_salary: body.monthlySalary || 0,
      joining_date: body.joiningDate || new Date().toISOString().split('T')[0],
      status: 'active',
      created_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('staff')
      .insert([staffData])
      .select();

    if (error) {
      return corsHeaders(NextResponse.json({ error: 'Failed to create staff' }, { status: 500 }));
    }

    return corsHeaders(NextResponse.json({ success: true, staff: data[0] }));
  } catch (error) {
    return corsHeaders(NextResponse.json({ error: 'Internal server error' }, { status: 500 }));
  }
}

async function handleUpdateStaff(request, staffId) {
  try {
    const body = await request.json();

    const { data, error } = await supabase
      .from('staff')
      .update({
        name: body.name,
        role: body.role,
        mobile: body.mobile,
        monthly_salary: body.monthlySalary,
        status: body.status,
        updated_at: new Date().toISOString()
      })
      .eq('id', staffId)
      .select();

    if (error) {
      return corsHeaders(NextResponse.json({ error: 'Failed to update staff' }, { status: 500 }));
    }

    return corsHeaders(NextResponse.json({ success: true, staff: data[0] }));
  } catch (error) {
    return corsHeaders(NextResponse.json({ error: 'Internal server error' }, { status: 500 }));
  }
}

async function handleDeleteStaff(staffId) {
  try {
    const { error } = await supabase
      .from('staff')
      .delete()
      .eq('id', staffId);

    if (error) {
      return corsHeaders(NextResponse.json({ error: 'Failed to delete staff' }, { status: 500 }));
    }

    return corsHeaders(NextResponse.json({ success: true }));
  } catch (error) {
    return corsHeaders(NextResponse.json({ error: 'Internal server error' }, { status: 500 }));
  }
}

// ==================== ATTENDANCE ====================
async function handleGetAttendance(request) {
  try {
    const { searchParams } = new URL(request.url);
    const staffId = searchParams.get('staffId');
    const month = searchParams.get('month'); // Format: YYYY-MM
    const date = searchParams.get('date');

    let query = supabase
      .from('attendance')
      .select(`
        *,
        staff (id, name, role)
      `)
      .order('date', { ascending: false });

    if (staffId) {
      query = query.eq('staff_id', staffId);
    }
    if (date) {
      query = query.eq('date', date);
    }
    if (month) {
      const startDate = `${month}-01`;
      const endDate = `${month}-31`;
      query = query.gte('date', startDate).lte('date', endDate);
    }

    const { data, error } = await query;

    if (error) {
      return corsHeaders(NextResponse.json({ error: 'Failed to fetch attendance' }, { status: 500 }));
    }

    return corsHeaders(NextResponse.json({ attendance: data || [] }));
  } catch (error) {
    return corsHeaders(NextResponse.json({ error: 'Internal server error' }, { status: 500 }));
  }
}

async function handleMarkAttendance(request) {
  try {
    const body = await request.json();

    // Upsert attendance (insert or update)
    const { data, error } = await supabase
      .from('attendance')
      .upsert({
        id: uuidv4(),
        staff_id: body.staffId,
        date: body.date,
        status: body.status, // present, absent, half_day
        notes: body.notes || null,
        created_at: new Date().toISOString()
      }, {
        onConflict: 'staff_id,date'
      })
      .select();

    if (error) {
      console.error('Supabase error:', error);
      return corsHeaders(NextResponse.json({ error: 'Failed to mark attendance' }, { status: 500 }));
    }

    return corsHeaders(NextResponse.json({ success: true, attendance: data[0] }));
  } catch (error) {
    return corsHeaders(NextResponse.json({ error: 'Internal server error' }, { status: 500 }));
  }
}

async function handleGetSalarySummary(request) {
  try {
    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month'); // Format: YYYY-MM

    if (!month) {
      return corsHeaders(NextResponse.json({ error: 'Month is required' }, { status: 400 }));
    }

    // Get all staff
    const { data: staffList } = await supabase
      .from('staff')
      .select('*')
      .eq('status', 'active');

    // Get attendance for the month
    const startDate = `${month}-01`;
    const endDate = `${month}-31`;
    const { data: attendanceList } = await supabase
      .from('attendance')
      .select('*')
      .gte('date', startDate)
      .lte('date', endDate);

    // Calculate salary for each staff
    const summary = (staffList || []).map(staff => {
      const staffAttendance = (attendanceList || []).filter(a => a.staff_id === staff.id);
      const presentDays = staffAttendance.filter(a => a.status === 'present').length;
      const halfDays = staffAttendance.filter(a => a.status === 'half_day').length;
      const absentDays = staffAttendance.filter(a => a.status === 'absent').length;
      
      const totalWorkingDays = presentDays + (halfDays * 0.5);
      const perDaySalary = staff.monthly_salary / 30;
      const calculatedSalary = Math.round(perDaySalary * totalWorkingDays);

      return {
        staff,
        presentDays,
        halfDays,
        absentDays,
        totalWorkingDays,
        monthlySalary: staff.monthly_salary,
        calculatedSalary
      };
    });

    return corsHeaders(NextResponse.json({ summary }));
  } catch (error) {
    return corsHeaders(NextResponse.json({ error: 'Internal server error' }, { status: 500 }));
  }
}

// ==================== ROUTE HANDLERS ====================
export async function GET(request, { params }) {
  const path = params?.path?.join('/') || '';

  if (path === 'health' || path === '') return handleHealthCheck();
  if (path === 'bookings') return handleGetBookings(request);
  if (path.match(/^bookings\/[^/]+$/)) return handleGetBookingById(path.split('/')[1]);
  if (path === 'stats') return handleGetStats();
  if (path === 'job-cards') return handleGetJobCards(request);
  if (path.match(/^job-cards\/[^/]+$/)) return handleGetJobCardById(path.split('/')[1]);
  if (path === 'inventory/categories') return handleGetInventoryCategories();
  if (path === 'inventory') return handleGetInventory(request);
  if (path === 'purchases') return handleGetPurchases(request);
  if (path === 'billing') return handleGetBillings(request);
  if (path.match(/^billing\/[^/]+$/)) return handleGetBillingById(path.split('/')[1]);
  if (path === 'staff') return handleGetStaff(request);
  if (path === 'attendance') return handleGetAttendance(request);
  if (path === 'salary-summary') return handleGetSalarySummary(request);

  return corsHeaders(NextResponse.json({ error: 'Not found' }, { status: 404 }));
}

export async function POST(request, { params }) {
  const path = params?.path?.join('/') || '';

  if (path === 'bookings') return handleCreateBooking(request);
  if (path === 'admin/login') return handleAdminLogin(request);
  if (path === 'job-cards') return handleCreateJobCard(request);
  if (path === 'inventory/categories') return handleCreateInventoryCategory(request);
  if (path === 'inventory') return handleCreateInventoryItem(request);
  if (path === 'purchases') return handleCreatePurchase(request);
  if (path === 'billing') return handleCreateBilling(request);
  if (path === 'staff') return handleCreateStaff(request);
  if (path === 'attendance') return handleMarkAttendance(request);

  return corsHeaders(NextResponse.json({ error: 'Not found' }, { status: 404 }));
}

export async function PUT(request, { params }) {
  const path = params?.path?.join('/') || '';

  if (path.match(/^bookings\/[^/]+$/)) return handleUpdateBookingStatus(request, path.split('/')[1]);
  if (path.match(/^job-cards\/[^/]+$/)) return handleUpdateJobCard(request, path.split('/')[1]);
  if (path.match(/^inventory\/[^/]+$/)) return handleUpdateInventoryItem(request, path.split('/')[1]);
  if (path.match(/^billing\/[^/]+$/)) return handleUpdateBillingStatus(request, path.split('/')[1]);
  if (path.match(/^staff\/[^/]+$/)) return handleUpdateStaff(request, path.split('/')[1]);

  return corsHeaders(NextResponse.json({ error: 'Not found' }, { status: 404 }));
}

export async function DELETE(request, { params }) {
  const path = params?.path?.join('/') || '';

  if (path.match(/^bookings\/[^/]+$/)) return handleDeleteBooking(path.split('/')[1]);
  if (path.match(/^job-cards\/[^/]+$/)) return handleDeleteJobCard(path.split('/')[1]);
  if (path.match(/^inventory\/[^/]+$/)) return handleDeleteInventoryItem(path.split('/')[1]);
  if (path.match(/^billing\/[^/]+$/)) return handleDeleteBilling(path.split('/')[1]);
  if (path.match(/^staff\/[^/]+$/)) return handleDeleteStaff(path.split('/')[1]);

  return corsHeaders(NextResponse.json({ error: 'Not found' }, { status: 404 }));
}

export async function OPTIONS(request) {
  return corsHeaders(new NextResponse(null, { status: 200 }));
}
