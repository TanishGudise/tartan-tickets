import "./globals.css";

export const metadata = { title: "Tartan Tickets", description: "Club event tickets for CMU students" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header className="top">
          <a href="/" className="brand">Tartan Tickets</a>
        </header>
        <main>{children}</main>
      </body>
    </html>
  );
}
