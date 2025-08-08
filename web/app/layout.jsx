import './globals.css';
import React from 'react';
import Providers from './providers.jsx';
import Navbar from '../components/Navbar.jsx';

export const metadata = { title: 'InstaClone' };

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <Navbar />
          <main className="container">{children}</main>
        </Providers>
      </body>
    </html>
  );
}

