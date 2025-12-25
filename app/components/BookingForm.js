'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { toast } from 'sonner';
import { CheckCircle, Car, Bike } from 'lucide-react';

const SERVICE_TYPES = [
  'General Service',
  'Engine Work',
  'Brake Service',
  'Electrical Work',
  'Total Loss Recovery',
  'Accident Repair',
  'Other'
];

export default function BookingForm({ onClose }) {
  const [bookingStep, setBookingStep] = useState(1);
  const [formData, setFormData] = useState({
    customerName: '',
    mobile: '',
    vehicleType: '',
    vehicleBrand: '',
    vehicleModel: '',
    vehicleNumber: '',
    serviceType: '',
    otherDescription: '',
    preferredDate: '',
    preferredTime: '',
    additionalNotes: ''
  });
  const [bookingResult, setBookingResult] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateForm = () => {
    const required = ['customerName', 'mobile', 'vehicleType', 'vehicleBrand', 'vehicleModel', 'vehicleNumber', 'serviceType', 'preferredDate', 'preferredTime'];
    for (const field of required) {
      if (!formData[field]) {
        toast.error('Please fill in all required fields');
        return false;
      }
    }
    if (formData.serviceType === 'Other' && !formData.otherDescription) {
      toast.error('Please describe the service needed');
      return false;
    }
    if (!/^[0-9]{10}$/.test(formData.mobile)) {
      toast.error('Please enter a valid 10-digit mobile number');
      return false;
    }
    return true;
  };

  const handleReview = () => {
    if (validateForm()) {
      setBookingStep(2);
    }
  };

  const handleSubmitBooking = async () => {
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await response.json();
      if (data.success) {
        setBookingResult(data);
        setBookingStep(3);
        toast.success('Booking confirmed!');
      } else {
        toast.error(data.error || 'Failed to create booking');
      }
    } catch (error) {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetBooking = () => {
    setFormData({
      customerName: '',
      mobile: '',
      vehicleType: '',
      vehicleBrand: '',
      vehicleModel: '',
      vehicleNumber: '',
      serviceType: '',
      otherDescription: '',
      preferredDate: '',
      preferredTime: '',
      additionalNotes: ''
    });
    setBookingStep(1);
    setBookingResult(null);
    onClose();
  };

  return (
    <div className="min-h-screen bg-white pt-20 pb-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Progress Indicator */}
        <div className="flex items-center justify-center mb-8">
          {[1, 2, 3].map((step) => (
            <div key={step} className="flex items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-medium transition-all ${
                bookingStep >= step ? 'bg-primary text-white' : 'bg-gray-100 text-gray-400'
              }`}>
                {bookingStep > step ? <CheckCircle className="w-5 h-5" /> : step}
              </div>
              {step < 3 && (
                <div className={`w-16 h-1 mx-2 rounded transition-all ${
                  bookingStep > step ? 'bg-primary' : 'bg-gray-100'
                }`} />
              )}
            </div>
          ))}
        </div>

        <Card className="border-0 shadow-lg rounded-3xl">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-2xl font-semibold">
              {bookingStep === 1 && 'Book Your Service'}
              {bookingStep === 2 && 'Review Your Details'}
              {bookingStep === 3 && 'Booking Confirmed!'}
            </CardTitle>
            <CardDescription>
              {bookingStep === 1 && 'Fill in your vehicle and service details'}
              {bookingStep === 2 && 'Please verify all information before confirming'}
              {bookingStep === 3 && 'We will contact you shortly'}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 md:p-8">
            {/* Step 1: Form */}
            {bookingStep === 1 && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="customerName">Customer Name *</Label>
                    <Input
                      id="customerName"
                      placeholder="Enter your name"
                      value={formData.customerName}
                      onChange={(e) => handleInputChange('customerName', e.target.value)}
                      className="rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="mobile">Mobile Number *</Label>
                    <Input
                      id="mobile"
                      placeholder="10-digit mobile number"
                      value={formData.mobile}
                      onChange={(e) => handleInputChange('mobile', e.target.value.replace(/\D/g, '').slice(0, 10))}
                      className="rounded-xl"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Vehicle Type *</Label>
                  <RadioGroup
                    value={formData.vehicleType}
                    onValueChange={(value) => handleInputChange('vehicleType', value)}
                    className="flex gap-4"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="Two Wheeler" id="two" />
                      <Label htmlFor="two" className="flex items-center cursor-pointer">
                        <Bike className="w-4 h-4 mr-2" /> Two Wheeler
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="Four Wheeler" id="four" />
                      <Label htmlFor="four" className="flex items-center cursor-pointer">
                        <Car className="w-4 h-4 mr-2" /> Four Wheeler
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="vehicleBrand">Vehicle Brand *</Label>
                    <Input
                      id="vehicleBrand"
                      placeholder="e.g., Honda, Maruti"
                      value={formData.vehicleBrand}
                      onChange={(e) => handleInputChange('vehicleBrand', e.target.value)}
                      className="rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="vehicleModel">Vehicle Model *</Label>
                    <Input
                      id="vehicleModel"
                      placeholder="e.g., Activa, Swift"
                      value={formData.vehicleModel}
                      onChange={(e) => handleInputChange('vehicleModel', e.target.value)}
                      className="rounded-xl"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="vehicleNumber">Vehicle Number *</Label>
                  <Input
                    id="vehicleNumber"
                    placeholder="e.g., GJ-01-AB-1234"
                    value={formData.vehicleNumber}
                    onChange={(e) => handleInputChange('vehicleNumber', e.target.value.toUpperCase())}
                    className="rounded-xl"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Service Type *</Label>
                  <Select value={formData.serviceType} onValueChange={(value) => handleInputChange('serviceType', value)}>
                    <SelectTrigger className="rounded-xl">
                      <SelectValue placeholder="Select service type" />
                    </SelectTrigger>
                    <SelectContent>
                      {SERVICE_TYPES.map((type) => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {formData.serviceType === 'Other' && (
                  <div className="space-y-2">
                    <Label htmlFor="otherDescription">Describe the Service Needed *</Label>
                    <Textarea
                      id="otherDescription"
                      placeholder="Please describe what service you need"
                      value={formData.otherDescription}
                      onChange={(e) => handleInputChange('otherDescription', e.target.value)}
                      className="rounded-xl"
                    />
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="preferredDate">Preferred Date *</Label>
                    <Input
                      id="preferredDate"
                      type="date"
                      min={new Date().toISOString().split('T')[0]}
                      value={formData.preferredDate}
                      onChange={(e) => handleInputChange('preferredDate', e.target.value)}
                      className="rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Preferred Time Slot *</Label>
                    <Select value={formData.preferredTime} onValueChange={(value) => handleInputChange('preferredTime', value)}>
                      <SelectTrigger className="rounded-xl">
                        <SelectValue placeholder="Select time slot" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="9:00 AM">9:00 AM</SelectItem>
                        <SelectItem value="10:00 AM">10:00 AM</SelectItem>
                        <SelectItem value="11:00 AM">11:00 AM</SelectItem>
                        <SelectItem value="12:00 PM">12:00 PM</SelectItem>
                        <SelectItem value="1:00 PM">1:00 PM</SelectItem>
                        <SelectItem value="2:00 PM">2:00 PM</SelectItem>
                        <SelectItem value="3:00 PM">3:00 PM</SelectItem>
                        <SelectItem value="4:00 PM">4:00 PM</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-sm text-primary font-medium">🚗 Pickup service available</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="additionalNotes">Additional Notes / Problem Description</Label>
                  <Textarea
                    id="additionalNotes"
                    placeholder="Describe any specific issues or requests"
                    value={formData.additionalNotes}
                    onChange={(e) => handleInputChange('additionalNotes', e.target.value)}
                    className="rounded-xl"
                    rows={3}
                  />
                </div>

                <div className="flex gap-4 pt-4">
                  <Button variant="outline" onClick={onClose} className="flex-1 rounded-xl">
                    Cancel
                  </Button>
                  <Button onClick={handleReview} className="flex-1 rounded-xl">
                    Review Details
                  </Button>
                </div>
              </div>
            )}

            {/* Step 2: Review */}
            {bookingStep === 2 && (
              <div className="space-y-6">
                <div className="bg-gray-50 rounded-2xl p-6 space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">Customer Name</p>
                      <p className="font-medium">{formData.customerName}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Mobile</p>
                      <p className="font-medium">{formData.mobile}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Vehicle Type</p>
                      <p className="font-medium">{formData.vehicleType}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Vehicle</p>
                      <p className="font-medium">{formData.vehicleBrand} {formData.vehicleModel}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Vehicle Number</p>
                      <p className="font-medium">{formData.vehicleNumber}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Service Type</p>
                      <p className="font-medium">{formData.serviceType}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Date</p>
                      <p className="font-medium">{new Date(formData.preferredDate).toLocaleDateString('en-IN', { dateStyle: 'long' })}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Time Slot</p>
                      <p className="font-medium">{formData.preferredTime}</p>
                    </div>
                  </div>
                  {formData.serviceType === 'Other' && formData.otherDescription && (
                    <div>
                      <p className="text-gray-500 text-sm">Service Description</p>
                      <p className="font-medium text-sm">{formData.otherDescription}</p>
                    </div>
                  )}
                  {formData.additionalNotes && (
                    <div>
                      <p className="text-gray-500 text-sm">Additional Notes</p>
                      <p className="font-medium text-sm">{formData.additionalNotes}</p>
                    </div>
                  )}
                </div>

                <div className="flex gap-4 pt-4">
                  <Button variant="outline" onClick={() => setBookingStep(1)} className="flex-1 rounded-xl">
                    Edit Details
                  </Button>
                  <Button onClick={handleSubmitBooking} disabled={isSubmitting} className="flex-1 rounded-xl">
                    {isSubmitting ? 'Confirming...' : 'Confirm Booking'}
                  </Button>
                </div>
              </div>
            )}

            {/* Step 3: Confirmation */}
            {bookingStep === 3 && bookingResult && (
              <div className="text-center space-y-6">
                <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto">
                  <CheckCircle className="w-10 h-10 text-green-600" />
                </div>
                <div>
                  <p className="text-gray-500 mb-2">Booking ID</p>
                  <p className="text-2xl font-bold text-primary">{bookingResult.bookingId}</p>
                </div>
                <div className="bg-gray-50 rounded-2xl p-6 text-left space-y-3 text-sm">
                  <p><span className="text-gray-500">Name:</span> {formData.customerName}</p>
                  <p><span className="text-gray-500">Mobile:</span> {formData.mobile}</p>
                  <p><span className="text-gray-500">Vehicle:</span> {formData.vehicleBrand} {formData.vehicleModel} ({formData.vehicleNumber})</p>
                  <p><span className="text-gray-500">Service:</span> {formData.serviceType}</p>
                  <p><span className="text-gray-500">Date & Time:</span> {new Date(formData.preferredDate).toLocaleDateString('en-IN', { dateStyle: 'long' })} at {formData.preferredTime}</p>
                </div>
                <p className="text-gray-600">
                  Your service slot has been successfully booked.<br />We will contact you shortly to confirm.
                </p>
                <Button onClick={resetBooking} className="rounded-xl px-8">
                  Back to Home
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
