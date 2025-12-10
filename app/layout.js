export const metadata = {
  title: 'Cevex.gg Key System',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, background: '#0a0a0a', color: 'white' }}>
        {children}
      </body>
    </html>
  );
}
