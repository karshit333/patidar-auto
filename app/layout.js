import './globals.css';
import { Toaster } from 'sonner';

export const metadata = {
  title: 'Patidar Auto - Reliable Two-Wheeler & Four-Wheeler Service',
  description: 'Professional garage services for two-wheelers and four-wheelers. Book your service slot today for general service, engine work, brake service, electrical work, and accident repair.',
  keywords: 'garage, auto service, two-wheeler service, four-wheeler service, bike repair, car repair, Patidar Auto',
  openGraph: {
    title: 'Patidar Auto - Reliable Vehicle Service',
    description: 'Professional garage services you can trust',
    type: 'website',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {children}
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}
