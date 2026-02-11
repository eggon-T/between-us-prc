import "./globals.css";

export const metadata = {
    title: "Between Us PRC 💘",
    description: "Anonymous Valentine matchmaking for your college. Select your crushes, find mutual matches!",
};

export default function RootLayout({ children }) {
    return (
        <html lang="en">
            <head>
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
                <link
                    href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Outfit:wght@400;500;600;700;800&display=swap"
                    rel="stylesheet"
                />
            </head>
            <body className="antialiased">
                {/* Floating decorative hearts */}
                <div className="floating-heart" style={{ top: '10%', left: '5%', animationDelay: '0s' }}>💗</div>
                <div className="floating-heart" style={{ top: '20%', right: '10%', animationDelay: '1s', fontSize: '1.5rem' }}>💕</div>
                <div className="floating-heart" style={{ top: '60%', left: '8%', animationDelay: '2s', fontSize: '1.8rem' }}>💖</div>
                <div className="floating-heart" style={{ top: '75%', right: '5%', animationDelay: '3s' }}>💗</div>
                <div className="floating-heart" style={{ top: '40%', left: '80%', animationDelay: '4s', fontSize: '1.2rem' }}>💘</div>

                <div className="relative z-10 min-h-screen">
                    {children}
                </div>
            </body>
        </html>
    );
}
