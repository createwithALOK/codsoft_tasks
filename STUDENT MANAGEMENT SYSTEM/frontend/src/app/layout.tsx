import type { Metadata } from 'next';
import { Toaster } from 'react-hot-toast';
import './globals.css';

export const metadata: Metadata = {
  title: 'EduManage — Student Management System',
  description: 'A full-stack education management platform for managing students, teachers, attendance, examinations, fees, and academic records.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: { borderRadius: '10px', background: '#1f2937', color: '#fff' },
          }}
        />
      </body>
    </html>
  );
}
