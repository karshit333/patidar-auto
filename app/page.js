'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import BookingForm from './components/BookingForm';
import {
  Wrench, Car, Bike, Phone, MapPin, Instagram, Clock, CheckCircle,
  Shield, Users, ChevronRight, Menu, X, Cog, Zap, Settings, AlertTriangle
} from 'lucide-react';

const LOGO_URL = 'https://customer-assets.emergentagent.com/job_d4760f84-12d2-4078-a43e-316fd20cb244/artifacts/t0cs5j68_Untitled%20design%20%281%29.png';

const TWO_WHEELER_SERVICES = [
  { name: 'General Service', desc: 'Complete checkup, oil change, filter cleaning', icon: Settings },
  { name: 'Engine Repair', desc: 'Full engine diagnostics and repair', icon: Cog },
  { name: 'Brake & Suspension', desc: 'Brake pad replacement, suspension tuning', icon: AlertTriangle },
  { name: 'Electrical Work', desc: 'Wiring, battery, lights, and horn repair', icon: Zap },
  { name: 'Accident Repair', desc: 'Body work, denting, painting', icon: Wrench },
  { name: 'Total Loss Recovery', desc: 'Complete vehicle restoration', icon: Shield },
];

const FOUR_WHEELER_SERVICES = [
  { name: 'General Service', desc: 'Oil change, filter replacement, inspection', icon: Settings },
  { name: 'Engine Diagnostics', desc: 'Computer diagnostics and repair', icon: Cog },
  { name: 'Accident Repair', desc: 'Collision repair and restoration', icon: AlertTriangle },
  { name: 'Body Work', desc: 'Denting, painting, and finishing', icon: Wrench },
  { name: 'Total Loss Recovery', desc: 'Complete vehicle rebuilding', icon: Shield },
];

export default function HomePage() {
  const [currentView, setCurrentView] = useState('home');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const scrollToSection = (id) => {
    setCurrentView('home');
    setMobileMenuOpen(false);
    setTimeout(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  // Navigation Component
  const Navigation = () => (
    <nav className="fixed top-0 left-0 right-0 bg-white/95 backdrop-blur-md z-50 border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center cursor-pointer" onClick={() => { setCurrentView('home'); window.scrollTo(0, 0); }}>
            <img src={LOGO_URL} alt="Patidar Auto" className="h-12 w-auto" />
          </div>
          
          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-8">
            <button onClick={() => scrollToSection('services')} className="text-gray-600 hover:text-gray-900 transition-colors text-sm font-medium">Services</button>
            <button onClick={() => scrollToSection('about')} className="text-gray-600 hover:text-gray-900 transition-colors text-sm font-medium">About</button>
            <button onClick={() => scrollToSection('contact')} className="text-gray-600 hover:text-gray-900 transition-colors text-sm font-medium">Contact</button>
            <Button onClick={() => setCurrentView('booking')} className="bg-primary hover:bg-primary/90 text-white rounded-full px-6">
              Book Service
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button className="md:hidden p-2" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 animate-fadeIn">
          <div className="px-4 py-4 space-y-3">
            <button onClick={() => scrollToSection('services')} className="block w-full text-left py-2 text-gray-600">Services</button>
            <button onClick={() => scrollToSection('about')} className="block w-full text-left py-2 text-gray-600">About</button>
            <button onClick={() => scrollToSection('contact')} className="block w-full text-left py-2 text-gray-600">Contact</button>
            <Button onClick={() => { setCurrentView('booking'); setMobileMenuOpen(false); }} className="w-full bg-primary text-white rounded-full">
              Book Service
            </Button>
          </div>
        </div>
      )}
    </nav>
  );

  // Hero Section
  const HeroSection = () => (
    <section className="pt-24 pb-16 md:pt-32 md:pb-24 px-4">
      <div className="max-w-7xl mx-auto text-center">
        <div className="animate-fadeIn">
          <h1 className="text-4xl md:text-6xl font-semibold text-gray-900 leading-tight mb-6">
            Reliable Two-Wheeler &<br className="hidden md:block" /> Four-Wheeler Service You Can Trust
          </h1>
          <p className="text-lg md:text-xl text-gray-500 max-w-2xl mx-auto mb-10">
            Professional garage services with experienced mechanics, honest pricing, and quality workmanship. Your vehicle deserves the best care.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              onClick={() => setCurrentView('booking')} 
              size="lg" 
              className="bg-primary hover:bg-primary/90 text-white rounded-full px-8 py-6 text-lg font-medium"
            >
              Book a Service Slot
              <ChevronRight className="ml-2 w-5 h-5" />
            </Button>
            <Button 
              onClick={() => scrollToSection('services')} 
              variant="outline" 
              size="lg" 
              className="rounded-full px-8 py-6 text-lg font-medium border-gray-300"
            >
              View Services
            </Button>
          </div>
        </div>

        {/* Trust Badges */}
        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto animate-slideUp stagger-2">
          {[
            { icon: Shield, label: 'Quality Assured' },
            { icon: Clock, label: 'Timely Service' },
            { icon: Users, label: 'Expert Mechanics' },
            { icon: CheckCircle, label: 'Honest Pricing' }
          ].map((item, i) => (
            <div key={i} className="flex flex-col items-center p-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                <item.icon className="w-6 h-6 text-primary" />
              </div>
              <span className="text-sm font-medium text-gray-700">{item.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );

  // Services Section
  const ServicesSection = () => (
    <section id="services" className="py-16 md:py-24 px-4 bg-gray-50/50">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-semibold text-gray-900 mb-4">Our Services</h2>
          <p className="text-gray-500 max-w-xl mx-auto">Comprehensive vehicle care for all your needs</p>
        </div>

        {/* Two-Wheeler Services */}
        <div className="mb-16">
          <div className="flex items-center justify-center mb-8">
            <Bike className="w-8 h-8 text-primary mr-3" />
            <h3 className="text-2xl font-semibold text-gray-900">Two-Wheeler Services</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {TWO_WHEELER_SERVICES.map((service, i) => (
              <Card key={i} className="bg-white border-0 shadow-sm hover:shadow-md transition-all duration-300 rounded-2xl">
                <CardContent className="p-6">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                    <service.icon className="w-6 h-6 text-primary" />
                  </div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">{service.name}</h4>
                  <p className="text-gray-500 text-sm">{service.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Four-Wheeler Services */}
        <div>
          <div className="flex items-center justify-center mb-8">
            <Car className="w-8 h-8 text-primary mr-3" />
            <h3 className="text-2xl font-semibold text-gray-900">Four-Wheeler Services</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {FOUR_WHEELER_SERVICES.map((service, i) => (
              <Card key={i} className="bg-white border-0 shadow-sm hover:shadow-md transition-all duration-300 rounded-2xl">
                <CardContent className="p-6">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                    <service.icon className="w-6 h-6 text-primary" />
                  </div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">{service.name}</h4>
                  <p className="text-gray-500 text-sm">{service.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <div className="text-center mt-12">
          <Button onClick={() => setCurrentView('booking')} size="lg" className="rounded-full px-8">
            Book Your Service Now
          </Button>
        </div>
      </div>
    </section>
  );

  // About Section
  const AboutSection = () => (
    <section id="about" className="py-16 md:py-24 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl md:text-4xl font-semibold text-gray-900 mb-6">About Patidar Auto</h2>
            <div className="space-y-4 text-gray-600">
              <p>
                At Patidar Auto, we believe in providing honest, reliable, and professional vehicle service. With years of experience in the automotive industry, our skilled mechanics treat every vehicle with the care it deserves.
              </p>
              <p>
                We specialize in both two-wheeler and four-wheeler services, from routine maintenance to complex repairs. Our commitment to quality workmanship and transparent pricing has earned us the trust of countless customers.
              </p>
            </div>
            <div className="mt-8 grid grid-cols-2 gap-6">
              {[
                { label: 'Experienced Mechanics', desc: 'Skilled professionals' },
                { label: 'Honest Pricing', desc: 'No hidden charges' },
                { label: 'Quality Parts', desc: 'Genuine components' },
                { label: 'Customer First', desc: 'Your satisfaction matters' }
              ].map((item, i) => (
                <div key={i}>
                  <h4 className="font-semibold text-gray-900">{item.label}</h4>
                  <p className="text-sm text-gray-500">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="flex justify-center">
            <div className="bg-gray-50 rounded-3xl p-8 w-full max-w-md">
              <img src={LOGO_URL} alt="Patidar Auto" className="w-full max-w-xs mx-auto" />
              <p className="text-center text-gray-500 mt-6 text-sm">Your trusted vehicle service partner</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );

  // Contact Section
  const ContactSection = () => (
    <section id="contact" className="py-16 md:py-24 px-4 bg-gray-50/50">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-semibold text-gray-900 mb-4">Contact Us</h2>
          <p className="text-gray-500">Get in touch or visit our garage</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          <Card className="bg-white border-0 shadow-sm rounded-2xl text-center">
            <CardContent className="p-6">
              <a href="tel:+918200809405" className="block">
                <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Phone className="w-7 h-7 text-primary" />
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">Call Us</h4>
                <p className="text-primary font-medium">+91 8200809405</p>
              </a>
            </CardContent>
          </Card>

          <Card className="bg-white border-0 shadow-sm rounded-2xl text-center">
            <CardContent className="p-6">
              <a href="https://instagram.com/patidar_auto_mavdi" target="_blank" rel="noopener noreferrer" className="block">
                <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Instagram className="w-7 h-7 text-primary" />
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">Instagram</h4>
                <p className="text-primary font-medium">@patidar_auto_mavdi</p>
              </a>
            </CardContent>
          </Card>

          <Card className="bg-white border-0 shadow-sm rounded-2xl text-center">
            <CardContent className="p-6">
              <a href="https://share.google/nYY7oj0Qd0rq8QcDD" target="_blank" rel="noopener noreferrer" className="block">
                <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <MapPin className="w-7 h-7 text-primary" />
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">Location</h4>
                <p className="text-primary font-medium">View on Maps</p>
              </a>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );

  // Footer
  const Footer = () => (
    <footer className="bg-white border-t border-gray-100 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center mb-6 md:mb-0">
            <img src={LOGO_URL} alt="Patidar Auto" className="h-12 w-auto" />
            <span className="ml-3 text-gray-500">Your trusted vehicle service partner</span>
          </div>
          <div className="flex items-center space-x-6">
            <a href="tel:+918200809405" className="text-gray-500 hover:text-primary transition-colors">
              <Phone className="w-5 h-5" />
            </a>
            <a href="https://instagram.com/patidar_auto_mavdi" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-primary transition-colors">
              <Instagram className="w-5 h-5" />
            </a>
            <a href="https://share.google/nYY7oj0Qd0rq8QcDD" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-primary transition-colors">
              <MapPin className="w-5 h-5" />
            </a>
            <a href="/dvc" className="text-gray-500 hover:text-primary transition-colors text-sm font-medium">
              Digital Card
            </a>
          </div>
        </div>
        <div className="mt-8 pt-8 border-t border-gray-100 text-center text-gray-400 text-sm">
          <p>&copy; {new Date().getFullYear()} Patidar Auto. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );

  // Main Render
  return (
    <main className="min-h-screen bg-white">
      <Navigation />
      
      {currentView === 'home' && (
        <>
          <HeroSection />
          <ServicesSection />
          <AboutSection />
          <ContactSection />
          <Footer />
        </>
      )}

      {currentView === 'booking' && <BookingForm onClose={() => setCurrentView('home')} />}
    </main>
  );
}
