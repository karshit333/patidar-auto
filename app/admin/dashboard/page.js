'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import {
  LogOut, RefreshCw, Calendar, Car, Bike, Clock, Trash2,
  Phone, User, Wrench, Filter, ChevronDown, ChevronUp, CalendarDays, FileText
} from 'lucide-react';

const LOGO_URL = 'https://customer-assets.emergentagent.com/job_d4760f84-12d2-4078-a43e-316fd20cb244/artifacts/t0cs5j68_Untitled%20design%20%281%29.png';

const STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800'
};

// Helper to get date strings
const getDateString = (daysOffset = 0) => {
  const date = new Date();
  date.setDate(date.getDate() + daysOffset);
  return date.toISOString().split('T')[0];
};

export default function AdminDashboard() {
  const router = useRouter();
  const [bookings, setBookings] = useState([]);
  const [jobCards, setJobCards] = useState([]);
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState('all'); // 'today', 'tomorrow', 'all', 'custom'
  const [filters, setFilters] = useState({
    status: 'all',
    vehicleType: 'all',
    serviceType: 'all',
    date: ''
  });
  const [expandedBooking, setExpandedBooking] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  useEffect(() => {
    // Check auth
    const token = localStorage.getItem('adminToken');
    if (!token) {
      window.location.href = '/admin';
      return;
    }
    fetchData();
  }, [filters, dateFilter]);

  // Update date filter based on quick filter selection
  useEffect(() => {
    if (dateFilter === 'today') {
      setFilters(prev => ({ ...prev, date: getDateString(0) }));
    } else if (dateFilter === 'tomorrow') {
      setFilters(prev => ({ ...prev, date: getDateString(1) }));
    } else if (dateFilter === 'all') {
      setFilters(prev => ({ ...prev, date: '' }));
    }
    // 'custom' - don't change, let user pick
  }, [dateFilter]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (filters.status !== 'all') queryParams.set('status', filters.status);
      if (filters.vehicleType !== 'all') queryParams.set('vehicleType', filters.vehicleType);
      if (filters.serviceType !== 'all') queryParams.set('serviceType', filters.serviceType);
      if (filters.date) queryParams.set('date', filters.date);

      const [bookingsRes, statsRes, jobCardsRes] = await Promise.all([
        fetch(`/api/bookings?${queryParams.toString()}`),
        fetch('/api/stats'),
        fetch('/api/job-cards')
      ]);

      const bookingsData = await bookingsRes.json();
      const statsData = await statsRes.json();
      const jobCardsData = await jobCardsRes.json();

      setBookings(bookingsData.bookings || []);
      setStats(statsData.stats || null);
      setJobCards(jobCardsData.jobCards || []);
    } catch (error) {
      toast.error('Failed to fetch data');
    } finally {
      setIsLoading(false);
    }
  };

  const getJobCardForBooking = (bookingId) => {
    return jobCards.find(jc => jc.booking_id === bookingId);
  };

  const updateStatus = async (bookingId, newStatus) => {
    try {
      const response = await fetch(`/api/bookings/${bookingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await response.json();
      if (data.success) {
        toast.success('Status updated successfully');
        fetchData();
      } else {
        toast.error('Failed to update status');
      }
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const deleteBooking = async (bookingId) => {
    try {
      const response = await fetch(`/api/bookings/${bookingId}`, {
        method: 'DELETE'
      });
      const data = await response.json();
      if (data.success) {
        toast.success('Booking deleted successfully');
        setDeleteId(null);
        fetchData();
      } else {
        toast.error('Failed to delete booking');
      }
    } catch (error) {
      toast.error('Failed to delete booking');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    window.location.href = '/admin';
  };

  const resetFilters = () => {
    setDateFilter('all');
    setFilters({
      status: 'all',
      vehicleType: 'all',
      serviceType: 'all',
      date: ''
    });
  };

  // Count bookings for today and tomorrow
  const todayStr = getDateString(0);
  const tomorrowStr = getDateString(1);
  const todayCount = bookings.filter(b => b.preferred_date === todayStr).length;
  const tomorrowCount = bookings.filter(b => b.preferred_date === tomorrowStr).length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <img src={LOGO_URL} alt="Patidar Auto" className="h-10 w-auto" />
              <span className="ml-3 text-lg font-semibold text-gray-900">Admin Dashboard</span>
            </div>
            <div className="flex items-center gap-4">
              <Button variant="outline" size="sm" onClick={fetchData} className="rounded-lg">
                <RefreshCw className="w-4 h-4 mr-2" /> Refresh
              </Button>
              <Button variant="ghost" size="sm" onClick={handleLogout} className="rounded-lg text-red-600 hover:text-red-700 hover:bg-red-50">
                <LogOut className="w-4 h-4 mr-2" /> Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
            <Card className="border-0 shadow-sm rounded-2xl">
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
                <div className="text-sm text-gray-500">Total Bookings</div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm rounded-2xl">
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
                <div className="text-sm text-gray-500">Pending</div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm rounded-2xl">
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-blue-600">{stats.confirmed}</div>
                <div className="text-sm text-gray-500">Confirmed</div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm rounded-2xl">
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
                <div className="text-sm text-gray-500">Completed</div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm rounded-2xl">
              <CardContent className="p-4">
                <div className="flex items-center">
                  <Bike className="w-5 h-5 text-primary mr-2" />
                  <div className="text-2xl font-bold text-gray-900">{stats.twoWheeler}</div>
                </div>
                <div className="text-sm text-gray-500">Two Wheeler</div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm rounded-2xl">
              <CardContent className="p-4">
                <div className="flex items-center">
                  <Car className="w-5 h-5 text-primary mr-2" />
                  <div className="text-2xl font-bold text-gray-900">{stats.fourWheeler}</div>
                </div>
                <div className="text-sm text-gray-500">Four Wheeler</div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Quick Date Filters */}
        <Card className="border-0 shadow-sm rounded-2xl mb-6">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold flex items-center">
              <CalendarDays className="w-5 h-5 mr-2" /> Quick Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              <Button
                variant={dateFilter === 'today' ? 'default' : 'outline'}
                onClick={() => setDateFilter('today')}
                className="rounded-xl"
              >
                <Calendar className="w-4 h-4 mr-2" />
                Today's Bookings
                {dateFilter !== 'today' && stats && (
                  <Badge variant="secondary" className="ml-2">{todayCount}</Badge>
                )}
              </Button>
              <Button
                variant={dateFilter === 'tomorrow' ? 'default' : 'outline'}
                onClick={() => setDateFilter('tomorrow')}
                className="rounded-xl"
              >
                <Calendar className="w-4 h-4 mr-2" />
                Tomorrow's Bookings
                {dateFilter !== 'tomorrow' && stats && (
                  <Badge variant="secondary" className="ml-2">{tomorrowCount}</Badge>
                )}
              </Button>
              <Button
                variant={dateFilter === 'all' ? 'default' : 'outline'}
                onClick={() => setDateFilter('all')}
                className="rounded-xl"
              >
                All Bookings
              </Button>
              <Button
                variant={dateFilter === 'custom' ? 'default' : 'outline'}
                onClick={() => setDateFilter('custom')}
                className="rounded-xl"
              >
                Custom Date
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Advanced Filters */}
        <Card className="border-0 shadow-sm rounded-2xl mb-6">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold flex items-center">
                <Filter className="w-5 h-5 mr-2" /> Advanced Filters
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setShowFilters(!showFilters)} className="md:hidden">
                {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </Button>
            </div>
          </CardHeader>
          <CardContent className={`${showFilters ? 'block' : 'hidden'} md:block`}>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <Select value={filters.status} onValueChange={(value) => setFilters({ ...filters, status: value })}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filters.vehicleType} onValueChange={(value) => setFilters({ ...filters, vehicleType: value })}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="Vehicle Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Vehicles</SelectItem>
                  <SelectItem value="Two Wheeler">Two Wheeler</SelectItem>
                  <SelectItem value="Four Wheeler">Four Wheeler</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filters.serviceType} onValueChange={(value) => setFilters({ ...filters, serviceType: value })}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="Service Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Services</SelectItem>
                  <SelectItem value="General Service">General Service</SelectItem>
                  <SelectItem value="Engine Work">Engine Work</SelectItem>
                  <SelectItem value="Brake Service">Brake Service</SelectItem>
                  <SelectItem value="Electrical Work">Electrical Work</SelectItem>
                  <SelectItem value="Total Loss Recovery">Total Loss Recovery</SelectItem>
                  <SelectItem value="Accident Repair">Accident Repair</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>

              {dateFilter === 'custom' && (
                <Input
                  type="date"
                  value={filters.date}
                  onChange={(e) => setFilters({ ...filters, date: e.target.value })}
                  className="rounded-xl"
                />
              )}

              <Button variant="outline" onClick={resetFilters} className="rounded-xl">
                Reset All
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Bookings List */}
        <Card className="border-0 shadow-sm rounded-2xl">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold">
                Service Bookings
                {dateFilter === 'today' && ' - Today'}
                {dateFilter === 'tomorrow' && ' - Tomorrow'}
              </CardTitle>
              <Badge variant="outline" className="text-sm">
                {bookings.length} booking{bookings.length !== 1 ? 's' : ''}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-12">
                <RefreshCw className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
                <p className="text-gray-500">Loading bookings...</p>
              </div>
            ) : bookings.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No bookings found</p>
                {dateFilter === 'today' && <p className="text-gray-400 text-sm mt-1">No bookings scheduled for today</p>}
                {dateFilter === 'tomorrow' && <p className="text-gray-400 text-sm mt-1">No bookings scheduled for tomorrow</p>}
              </div>
            ) : (
              <div className="space-y-4">
                {bookings.map((booking) => (
                  <div
                    key={booking.id}
                    className="border border-gray-100 rounded-2xl overflow-hidden hover:border-gray-200 transition-all"
                  >
                    <div
                      className="p-4 cursor-pointer"
                      onClick={() => setExpandedBooking(expandedBooking === booking.id ? null : booking.id)}
                    >
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-start gap-4">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                            {booking.vehicle_type === 'Two Wheeler' ? (
                              <Bike className="w-5 h-5 text-primary" />
                            ) : (
                              <Car className="w-5 h-5 text-primary" />
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-semibold text-gray-900">{booking.booking_id}</span>
                              <Badge className={`${STATUS_COLORS[booking.status]} border-0`}>
                                {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                              </Badge>
                              {getJobCardForBooking(booking.id) && (
                                <Badge className="bg-purple-100 text-purple-800 border-0">
                                  <FileText className="w-3 h-3 mr-1" />
                                  Job Card
                                </Badge>
                              )}
                              {booking.preferred_date === todayStr && (
                                <Badge className="bg-green-100 text-green-800 border-0">Today</Badge>
                              )}
                              {booking.preferred_date === tomorrowStr && (
                                <Badge className="bg-blue-100 text-blue-800 border-0">Tomorrow</Badge>
                              )}
                            </div>
                            <div className="text-sm text-gray-500 mt-1">
                              {booking.customer_name} • {booking.vehicle_brand} {booking.vehicle_model}
                            </div>
                            <div className="text-sm text-gray-400 mt-1 flex items-center gap-4">
                              <span className="flex items-center"><Calendar className="w-3 h-3 mr-1" /> {new Date(booking.preferred_date).toLocaleDateString('en-IN')}</span>
                              <span className="flex items-center"><Clock className="w-3 h-3 mr-1" /> {booking.preferred_time}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {!getJobCardForBooking(booking.id) && (
                            <Button
                              variant="default"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                router.push(`/admin/job-cards?bookingId=${booking.id}`);
                              }}
                              className="rounded-xl bg-primary"
                            >
                              <FileText className="w-4 h-4 mr-1" />
                              Create Job Card
                            </Button>
                          )}
                          {getJobCardForBooking(booking.id) && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                router.push('/admin/job-cards');
                              }}
                              className="rounded-xl"
                            >
                              <FileText className="w-4 h-4 mr-1" />
                              View Job Card
                            </Button>
                          )}
                          
                          <Select
                            value={booking.status}
                            onValueChange={(value) => updateStatus(booking.id, value)}
                          >
                            <SelectTrigger className="w-36 rounded-xl" onClick={(e) => e.stopPropagation()}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">Pending</SelectItem>
                              <SelectItem value="confirmed">Confirmed</SelectItem>
                              <SelectItem value="completed">Completed</SelectItem>
                            </SelectContent>
                          </Select>

                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-red-500 hover:text-red-700 hover:bg-red-50 rounded-xl"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="rounded-2xl">
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Booking?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete booking <strong>{booking.booking_id}</strong>?
                                  This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  className="bg-red-600 hover:bg-red-700 rounded-xl"
                                  onClick={() => deleteBooking(booking.id)}
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>

                          {expandedBooking === booking.id ? (
                            <ChevronUp className="w-5 h-5 text-gray-400" />
                          ) : (
                            <ChevronDown className="w-5 h-5 text-gray-400" />
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Expanded Details */}
                    {expandedBooking === booking.id && (
                      <div className="px-4 pb-4 border-t border-gray-100 pt-4 bg-gray-50/50">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                          <div className="space-y-3">
                            <div className="flex items-center text-gray-600">
                              <User className="w-4 h-4 mr-2 text-gray-400" />
                              <span className="font-medium">{booking.customer_name}</span>
                            </div>
                            <div className="flex items-center text-gray-600">
                              <Phone className="w-4 h-4 mr-2 text-gray-400" />
                              <a href={`tel:${booking.mobile}`} className="text-primary hover:underline">{booking.mobile}</a>
                            </div>
                          </div>
                          <div className="space-y-3">
                            <div className="text-gray-600">
                              <span className="text-gray-400">Vehicle:</span> {booking.vehicle_brand} {booking.vehicle_model}
                            </div>
                            <div className="text-gray-600">
                              <span className="text-gray-400">Number:</span> {booking.vehicle_number}
                            </div>
                            <div className="text-gray-600">
                              <span className="text-gray-400">Type:</span> {booking.vehicle_type}
                            </div>
                          </div>
                          <div className="space-y-3">
                            <div className="flex items-center text-gray-600">
                              <Wrench className="w-4 h-4 mr-2 text-gray-400" />
                              <span>{booking.service_type}</span>
                            </div>
                            {booking.service_type === 'Other' && booking.other_description && (
                              <div className="text-gray-600">
                                <span className="text-gray-400">Description:</span> {booking.other_description}
                              </div>
                            )}
                            {booking.additional_notes && (
                              <div className="text-gray-600">
                                <span className="text-gray-400">Notes:</span> {booking.additional_notes}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="mt-4 pt-4 border-t border-gray-200 flex justify-between items-center">
                          <span className="text-xs text-gray-400">
                            Created: {new Date(booking.created_at).toLocaleString('en-IN')}
                          </span>
                          <a
                            href={`tel:${booking.mobile}`}
                            className="text-primary text-sm font-medium hover:underline flex items-center"
                          >
                            <Phone className="w-4 h-4 mr-1" /> Call Customer
                          </a>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
