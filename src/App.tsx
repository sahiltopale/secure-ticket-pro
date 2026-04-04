import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { WalletProvider } from "@/contexts/WalletContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ChatbotButton from "@/components/ChatbotButton";
import Events from "@/pages/Events";
import EventDetails from "@/pages/EventDetails";
import MyTickets from "@/pages/MyTickets";
import AdminDashboard from "@/pages/AdminDashboard";
import VerifyTicket from "@/pages/VerifyTicket";
import VerifyTicketPage from "@/pages/VerifyTicketPage";
import Auth from "@/pages/Auth";
import Contact from "@/pages/Contact";
import Help from "@/pages/Help";
import About from "@/pages/About";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <WalletProvider>
              <div className="flex flex-col min-h-screen">
                <Navbar />
                <main className="flex-1">
                  <Routes>
                    <Route path="/" element={<Events />} />
                    <Route path="/event/:id" element={<EventDetails />} />
                    <Route path="/my-tickets" element={<MyTickets />} />
                    <Route path="/admin" element={<AdminDashboard />} />
                    <Route path="/verify" element={<VerifyTicket />} />
                    <Route path="/verify/:ticketId" element={<VerifyTicketPage />} />
                    <Route path="/auth" element={<Auth />} />
                    <Route path="/contact" element={<Contact />} />
                    <Route path="/help" element={<Help />} />
                    <Route path="/about" element={<About />} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </main>
                <Footer />
                <ChatbotButton />
              </div>
            </WalletProvider>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
