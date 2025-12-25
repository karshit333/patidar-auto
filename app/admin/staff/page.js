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
  Plus, Users, RefreshCw, Edit, Trash2, UserCheck, UserX,
  Calendar, Clock, ChevronLeft, ChevronRight, Phone
} from 'lucide-react';

const ATTENDANCE_STATUS = {
  present: { label: 'Present', color: 'bg-green-500', bgColor: 'bg-green-100' },
  absent: { label: 'Absent', color: 'bg-red-500', bgColor: 'bg-red-100' },
  half_day: { label: 'Half Day', color: 'bg-yellow-500', bgColor: 'bg-yellow-100' }
};

export default function StaffPage() {
  const [staff, setStaff] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [salarySummary, setSalarySummary] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showStaffModal, setShowStaffModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  const [staffForm, setStaffForm] = useState({
    name: '',
    role: '',
    mobile: '',
    monthlySalary: '',
    joiningDate: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    fetchData();
  }, [selectedMonth]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [staffRes, attendanceRes, salaryRes] = await Promise.all([
        fetch('/api/staff'),
        fetch(`/api/attendance?month=${selectedMonth}`),
        fetch(`/api/salary-summary?month=${selectedMonth}`)
      ]);

      const staffData = await staffRes.json();
      const attendanceData = await attendanceRes.json();
      const salaryData = await salaryRes.json();

      setStaff(staffData.staff || []);
      setAttendance(attendanceData.attendance || []);
      setSalarySummary(salaryData.summary || []);
    } catch (error) {
      toast.error('Failed to fetch data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveStaff = async () => {
    if (!staffForm.name || !staffForm.role) {
      toast.error('Name and role are required');
      return;
    }

    try {
      const url = editingStaff ? `/api/staff/${editingStaff.id}` : '/api/staff';
      const method = editingStaff ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: staffForm.name,
          role: staffForm.role,
          mobile: staffForm.mobile,
          monthlySalary: parseFloat(staffForm.monthlySalary) || 0,
          joiningDate: staffForm.joiningDate,
          status: editingStaff?.status || 'active'
        })
      });

      const data = await response.json();
      if (data.success) {
        toast.success(editingStaff ? 'Staff updated!' : 'Staff added!');
        setShowStaffModal(false);
        resetStaffForm();
        fetchData();
      } else {
        toast.error(data.error || 'Failed to save staff');
      }
    } catch (error) {
      toast.error('Something went wrong');
    }
  };

  const handleDeleteStaff = async (staffId) => {
    if (!confirm('Are you sure you want to delete this staff member?')) return;

    try {
      const response = await fetch(`/api/staff/${staffId}`, { method: 'DELETE' });
      const data = await response.json();
      if (data.success) {
        toast.success('Staff deleted');
        fetchData();
      } else {
        toast.error('Failed to delete staff');
      }
    } catch (error) {
      toast.error('Something went wrong');
    }
  };

  const handleMarkAttendance = async (staffId, status) => {
    try {
      const response = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          staffId,
          date: selectedDate,
          status
        })
      });

      const data = await response.json();
      if (data.success) {
        toast.success('Attendance marked!');
        fetchData();
      } else {
        toast.error(data.error || 'Failed to mark attendance');
      }
    } catch (error) {
      toast.error('Something went wrong');
    }
  };

  const openEditModal = (member) => {
    setEditingStaff(member);
    setStaffForm({
      name: member.name,
      role: member.role,
      mobile: member.mobile || '',
      monthlySalary: member.monthly_salary?.toString() || '',
      joiningDate: member.joining_date
    });
    setShowStaffModal(true);
  };

  const resetStaffForm = () => {
    setEditingStaff(null);
    setStaffForm({
      name: '',
      role: '',
      mobile: '',
      monthlySalary: '',
      joiningDate: new Date().toISOString().split('T')[0]
    });
  };

  const getAttendanceForStaff = (staffId, date) => {
    return attendance.find(a => a.staff_id === staffId && a.date === date);
  };

  // Generate days of the month
  const getDaysInMonth = () => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const daysInMonth = new Date(year, month, 0).getDate();
    return Array.from({ length: daysInMonth }, (_, i) => {
      const day = i + 1;
      return `${selectedMonth}-${day.toString().padStart(2, '0')}`;
    });
  };

  const changeMonth = (delta) => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const newDate = new Date(year, month - 1 + delta, 1);
    setSelectedMonth(newDate.toISOString().slice(0, 7));
  };

  return (
    <div className="p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Staff Management</h1>
            <p className="text-gray-500 text-sm mt-1">Manage technicians and attendance</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={fetchData} variant="outline" className="rounded-xl">
              <RefreshCw className="w-4 h-4 mr-2" /> Refresh
            </Button>
            <Button onClick={() => { resetStaffForm(); setShowStaffModal(true); }} className="rounded-xl">
              <Plus className="w-4 h-4 mr-2" /> Add Staff
            </Button>
          </div>
        </div>

        <Tabs defaultValue="staff" className="space-y-6">
          <TabsList className="bg-gray-100 rounded-xl p-1">
            <TabsTrigger value="staff" className="rounded-lg">Staff List</TabsTrigger>
            <TabsTrigger value="attendance" className="rounded-lg">Attendance</TabsTrigger>
            <TabsTrigger value="salary" className="rounded-lg">Salary Summary</TabsTrigger>
          </TabsList>

          {/* Staff List Tab */}
          <TabsContent value="staff">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {isLoading ? (
                <div className="col-span-full text-center py-12">
                  <RefreshCw className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
                  <p className="text-gray-500">Loading staff...</p>
                </div>
              ) : staff.length === 0 ? (
                <div className="col-span-full text-center py-12">
                  <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No staff members yet</p>
                </div>
              ) : (
                staff.map((member) => (
                  <Card key={member.id} className="border-0 shadow-sm rounded-2xl">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                            <Users className="w-6 h-6 text-primary" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900">{member.name}</h3>
                            <p className="text-sm text-gray-500">{member.role}</p>
                          </div>
                        </div>
                        <Badge variant={member.status === 'active' ? 'default' : 'secondary'}>
                          {member.status}
                        </Badge>
                      </div>

                      <div className="space-y-2 text-sm mb-4">
                        {member.mobile && (
                          <div className="flex items-center text-gray-600">
                            <Phone className="w-4 h-4 mr-2 text-gray-400" />
                            <a href={`tel:${member.mobile}`} className="text-primary">{member.mobile}</a>
                          </div>
                        )}
                        <div className="flex items-center text-gray-600">
                          <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                          Joined: {new Date(member.joining_date).toLocaleDateString()}
                        </div>
                        <div className="flex items-center text-gray-600">
                          <span className="font-medium">Salary: ₹{member.monthly_salary}/month</span>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditModal(member)}
                          className="flex-1 rounded-lg"
                        >
                          <Edit className="w-3 h-3 mr-1" /> Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteStaff(member.id)}
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

          {/* Attendance Tab */}
          <TabsContent value="attendance">
            <Card className="border-0 shadow-sm rounded-2xl">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Daily Attendance</CardTitle>
                  <div className="flex items-center gap-2">
                    <Input
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="rounded-lg w-40"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {staff.length === 0 ? (
                  <div className="text-center py-12">
                    <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">Add staff members first</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {staff.filter(s => s.status === 'active').map((member) => {
                      const todayAttendance = getAttendanceForStaff(member.id, selectedDate);
                      return (
                        <div key={member.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                              <Users className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{member.name}</p>
                              <p className="text-sm text-gray-500">{member.role}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {todayAttendance && (
                              <Badge className={`${ATTENDANCE_STATUS[todayAttendance.status]?.bgColor} ${ATTENDANCE_STATUS[todayAttendance.status]?.color.replace('bg-', 'text-')} border-0 mr-2`}>
                                {ATTENDANCE_STATUS[todayAttendance.status]?.label}
                              </Badge>
                            )}
                            <Button
                              size="sm"
                              variant={todayAttendance?.status === 'present' ? 'default' : 'outline'}
                              onClick={() => handleMarkAttendance(member.id, 'present')}
                              className="rounded-lg"
                            >
                              <UserCheck className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant={todayAttendance?.status === 'half_day' ? 'default' : 'outline'}
                              onClick={() => handleMarkAttendance(member.id, 'half_day')}
                              className="rounded-lg bg-yellow-500 hover:bg-yellow-600 text-white"
                            >
                              ½
                            </Button>
                            <Button
                              size="sm"
                              variant={todayAttendance?.status === 'absent' ? 'destructive' : 'outline'}
                              onClick={() => handleMarkAttendance(member.id, 'absent')}
                              className="rounded-lg"
                            >
                              <UserX className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Salary Summary Tab */}
          <TabsContent value="salary">
            <Card className="border-0 shadow-sm rounded-2xl">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Salary Summary</CardTitle>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" onClick={() => changeMonth(-1)} className="rounded-lg">
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <span className="font-medium px-4">
                      {new Date(selectedMonth + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                    </span>
                    <Button variant="outline" size="icon" onClick={() => changeMonth(1)} className="rounded-lg">
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {salarySummary.length === 0 ? (
                  <div className="text-center py-12">
                    <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">No salary data for this month</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="text-left text-sm text-gray-500 border-b">
                          <th className="pb-3 font-medium">Staff</th>
                          <th className="pb-3 font-medium text-center">Present</th>
                          <th className="pb-3 font-medium text-center">Half Day</th>
                          <th className="pb-3 font-medium text-center">Absent</th>
                          <th className="pb-3 font-medium text-center">Working Days</th>
                          <th className="pb-3 font-medium text-right">Monthly</th>
                          <th className="pb-3 font-medium text-right">Payable</th>
                        </tr>
                      </thead>
                      <tbody>
                        {salarySummary.map((item) => (
                          <tr key={item.staff.id} className="border-b last:border-0">
                            <td className="py-4">
                              <div>
                                <p className="font-medium text-gray-900">{item.staff.name}</p>
                                <p className="text-sm text-gray-500">{item.staff.role}</p>
                              </div>
                            </td>
                            <td className="py-4 text-center">
                              <Badge className="bg-green-100 text-green-800 border-0">{item.presentDays}</Badge>
                            </td>
                            <td className="py-4 text-center">
                              <Badge className="bg-yellow-100 text-yellow-800 border-0">{item.halfDays}</Badge>
                            </td>
                            <td className="py-4 text-center">
                              <Badge className="bg-red-100 text-red-800 border-0">{item.absentDays}</Badge>
                            </td>
                            <td className="py-4 text-center font-medium">{item.totalWorkingDays}</td>
                            <td className="py-4 text-right text-gray-500">₹{item.monthlySalary}</td>
                            <td className="py-4 text-right font-bold text-primary">₹{item.calculatedSalary}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="bg-gray-50">
                          <td colSpan={6} className="py-4 font-semibold text-right">Total Payable:</td>
                          <td className="py-4 text-right font-bold text-primary text-lg">
                            ₹{salarySummary.reduce((sum, item) => sum + item.calculatedSalary, 0)}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Add/Edit Staff Modal */}
      <Dialog open={showStaffModal} onOpenChange={setShowStaffModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingStaff ? 'Edit Staff' : 'Add New Staff'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Name *</Label>
              <Input
                value={staffForm.name}
                onChange={(e) => setStaffForm({ ...staffForm, name: e.target.value })}
                className="rounded-xl mt-1"
              />
            </div>
            <div>
              <Label>Role *</Label>
              <Input
                value={staffForm.role}
                onChange={(e) => setStaffForm({ ...staffForm, role: e.target.value })}
                placeholder="e.g., Mechanic, Helper"
                className="rounded-xl mt-1"
              />
            </div>
            <div>
              <Label>Mobile Number</Label>
              <Input
                value={staffForm.mobile}
                onChange={(e) => setStaffForm({ ...staffForm, mobile: e.target.value })}
                className="rounded-xl mt-1"
              />
            </div>
            <div>
              <Label>Monthly Salary (₹)</Label>
              <Input
                type="number"
                value={staffForm.monthlySalary}
                onChange={(e) => setStaffForm({ ...staffForm, monthlySalary: e.target.value })}
                className="rounded-xl mt-1"
              />
            </div>
            <div>
              <Label>Joining Date</Label>
              <Input
                type="date"
                value={staffForm.joiningDate}
                onChange={(e) => setStaffForm({ ...staffForm, joiningDate: e.target.value })}
                className="rounded-xl mt-1"
              />
            </div>
            <div className="flex gap-2 pt-4">
              <Button variant="outline" onClick={() => setShowStaffModal(false)} className="flex-1 rounded-xl">
                Cancel
              </Button>
              <Button onClick={handleSaveStaff} className="flex-1 rounded-xl">
                {editingStaff ? 'Update' : 'Add Staff'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
