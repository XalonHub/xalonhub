# XalonHub 🚀

XalonHub is a premium, multi-platform ecosystem designed to revolutionize the salon and beauty services industry. It provides a seamless experience for both customers and service providers through a unified architecture.

## 🏗️ Architecture

The project is built as a monorepo-style architecture with clear separation of concerns:

- **`apps/xalon-web`**: Next.js-powered customer platform for discovery and booking.
- **`apps/xalon`**: Mobile application (Expo) for on-the-go access.
- **`apps/xalonhub`**: Partner and Administrator dashboard for service management.
- **`backend/`**: Centralized Express.js API serving all platforms.

## ✨ Key Features

- **Unified Booking System**: High-performance scheduling engine for "At Home" and "At Salon" services.
- **Dynamic Catalog**: Real-time service discovery with advanced filtering and search.
- **Partner KYC & Management**: Robust onboarding flow for salons and independent professionals.
- **Premium Aesthetics**: Modern, responsive UI built with Framer Motion and custom design tokens.
- **Secure Payments**: Integrated payment processing via Paytm.

## 🛠️ Technology Stack

- **Frontend**: [Next.js](https://nextjs.org/), [React](https://reactjs.org/), [Framer Motion](https://www.framer.com/motion/)
- **Backend**: [Node.js](https://nodejs.org/), [Express](https://expressjs.com/)
- **Database & ORM**: [Prisma](https://www.prisma.io/)
- **Media**: [Cloudinary](https://cloudinary.com/) for optimized image management
- **Payments**: Paytm Integration

## 🚀 Getting Started

To launch the entire ecosystem locally:

1.  Ensure you have **Node.js** and **npm** installed.
2.  Navigate to the root directory.
3.  Run the startup script:
    ```powershell
    ./start-apps.ps1
    ```

---
*Built with ❤️ by the XalonHub Team*
