

# Authentix — Event Ticketing Platform

## Overview
A professional, blockchain-ready event ticketing web app with QR-based verification, admin/user roles, analytics dashboard, and MetaMask wallet integration. Built with React + Tailwind CSS + Supabase.

---

## 1. Brand & Design System
- **Name**: Authentix
- Custom favicon (ticket/shield icon, no Lovable branding)
- Modern color palette: deep indigo primary, teal accents, dark background option
- Smooth animations: fade-in on scroll, hover scale effects, card transitions
- Fully responsive (mobile-first)

## 2. Database Schema (Supabase/PostgreSQL)
- **profiles**: name, email, wallet_address
- **user_roles**: user_id, role (admin/user enum)
- **events**: title, description, date, price, total_seats, available_seats, image_url, created_by
- **tickets**: user_id, event_id, ticket_id (unique), qr_code_data, wallet_address, nft_token_id (nullable), is_used, booking_date
- RLS policies for role-based access using `has_role()` security definer function

## 3. Authentication
- Email/password signup & login via Supabase Auth
- Auto-create profile on signup with default "user" role
- Protected routes for admin pages

## 4. Pages & Navigation

**Navbar**: Logo (Authentix), Events, My Tickets, Contact, Help, About Us, Login/Register, Connect Wallet button

| Page | Description |
|------|-------------|
| **Home/Events** | Event card grid with search & filters (date, price, category) |
| **Event Details** | Full event info, seat availability, Book Ticket modal |
| **My Tickets** | User's booked tickets with QR codes displayed |
| **Admin Dashboard** | Analytics cards (revenue, tickets sold, users), bar/pie charts, event CRUD, all bookings table |
| **Ticket Verification** | QR scanner using html5-qrcode, validates ticket via Supabase, marks as used |
| **Contact** | Contact form |
| **Help** | FAQ accordion |
| **About Us** | Project description + 4-member team section with placeholder names/images |

## 5. Core Features

### Ticket Booking Flow
- User selects event → opens booking modal → confirms → ticket created with unique ID → QR code generated containing ticketId + eventId + walletAddress → available_seats decremented

### QR Code System
- Generate QR codes using `qrcode.react` library
- QR Scanner page using `html5-qrcode` for camera access
- Scan → extract data → verify against database → show ✅ Valid or ❌ Invalid/Already Used → mark ticket as used

### Admin Dashboard
- Total Revenue, Tickets Sold, Total Users cards
- Charts: tickets per event (bar), revenue per event (pie) using Recharts
- Event management: create, edit, delete events
- View all bookings with user details

### MetaMask Wallet Integration
- "Connect Wallet" button using `window.ethereum`
- Display connected wallet address in navbar
- Store wallet address with user profile and tickets
- Sample Solidity ERC721 smart contract file included in project

## 6. AI Feature Placeholders
- Chatbot assistant floating UI button (placeholder)
- Event recommendation section on home page (placeholder)
- Fraud detection badge on admin dashboard (placeholder)

## 7. About Us Page
- Project description paragraph about blockchain-ready ticketing
- Team grid with 4 members: placeholder names, roles (Full Stack Dev, Frontend Dev, Backend Dev, Blockchain Dev), placeholder avatar images

## 8. Edge Functions
- **verify-ticket**: POST endpoint to validate and mark tickets as used
- **analytics**: GET endpoint for admin dashboard stats

