import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Phone, MapPin, Instagram } from 'lucide-react';

const LOGO_URL = 'https://customer-assets.emergentagent.com/job_d4760f84-12d2-4078-a43e-316fd20cb244/artifacts/t0cs5j68_Untitled%20design%20%281%29.png';

export const metadata = {
  title: 'Patidar Auto - Digital Visiting Card',
  description: 'Contact Patidar Auto for professional two-wheeler and four-wheeler service in Rajkot.',
};

export default function DigitalVisitingCard() {
  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="bg-white border-0 shadow-xl rounded-3xl overflow-hidden max-w-md w-full">
        <CardContent className="p-8">
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <img src={LOGO_URL} alt="Patidar Auto" className="h-24 w-auto" />
          </div>

          {/* Business Name */}
          <h1 className="text-2xl font-bold text-gray-900 text-center mb-2">Patidar Auto</h1>
          <p className="text-gray-500 text-center text-sm mb-6">Two-Wheeler & Four-Wheeler Service</p>

          {/* Divider */}
          <div className="h-px bg-gray-100 my-6"></div>

          {/* Address */}
          <div className="flex items-start gap-4 mb-4">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <MapPin className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="font-medium text-gray-900">Address</p>
              <p className="text-gray-500 text-sm">
                Patidar Auto,<br />
                Opp. Sorathiya Hall,<br />
                Mavdi, Rajkot – 360005
              </p>
            </div>
          </div>

          {/* Phone */}
          <a href="tel:+918200809405" className="flex items-start gap-4 mb-4 hover:bg-gray-50 -mx-2 px-2 py-2 rounded-xl transition-colors">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Phone className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="font-medium text-gray-900">Phone</p>
              <p className="text-primary font-medium">+91 8200809405</p>
            </div>
          </a>

          {/* Instagram */}
          <a href="https://instagram.com/patidar_auto_mavdi" target="_blank" rel="noopener noreferrer" className="flex items-start gap-4 mb-6 hover:bg-gray-50 -mx-2 px-2 py-2 rounded-xl transition-colors">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Instagram className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="font-medium text-gray-900">Instagram</p>
              <p className="text-primary font-medium">@patidar_auto_mavdi</p>
            </div>
          </a>

          {/* Divider */}
          <div className="h-px bg-gray-100 my-6"></div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <a href="tel:+918200809405">
              <Button className="w-full rounded-xl" size="lg">
                <Phone className="w-4 h-4 mr-2" /> Call Now
              </Button>
            </a>
            <a href="https://share.google/nYY7oj0Qd0rq8QcDD" target="_blank" rel="noopener noreferrer">
              <Button variant="outline" className="w-full rounded-xl" size="lg">
                <MapPin className="w-4 h-4 mr-2" /> Directions
              </Button>
            </a>
          </div>

          {/* Website Link */}
          <div className="mt-6 text-center">
            <a href="/" className="text-sm text-gray-400 hover:text-primary transition-colors">
              Visit our website →
            </a>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
