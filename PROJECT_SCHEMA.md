# SecureKey Locksmith Platform - Complete Project Schema

## Project Overview

**Project Name:** Secure-Key Locksmith Platform  
**Purpose:** 24/7 emergency locksmith service platform for Witbank/eMalahleni  
**Type:** Full-stack web application with e-commerce and service booking  
**Stack:** React + TypeScript (Frontend) | Spring Boot 3.4.5 (Backend) | MySQL 8 (Database)  
**Deployment:** Frontend (Vite dev server), Backend (Spring Boot), Database (MySQL local)

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                              │
│  React 19 + TypeScript | TanStack Router | TailwindCSS          │
│  (Port 8081 - Vite Dev Server)                                  │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                    HTTP REST API
                    (Port 8082)
                           │
┌──────────────────────────┴──────────────────────────────────────┐
│                     SERVER LAYER                                │
│  Spring Boot 3.4.5 | Java 21 | Spring Data JPA                 │
│  Controllers → Services → Repositories → Entities              │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                    JDBC Connection
                    (Port 3306)
                           │
┌──────────────────────────┴──────────────────────────────────────┐
│                     DATABASE LAYER                              │
│  MySQL 8 | InnoDB | Relational Schema                          │
│  Database: securekey_locksmith_db                              │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📦 Technology Stack

### Frontend
- **Framework:** React 19.2.0
- **Language:** TypeScript 5.8.3
- **Build Tool:** Vite 7.3.1
- **Routing:** TanStack Router 1.168.0
- **State Management:** TanStack React Query 5.83.0
- **Styling:** TailwindCSS 4.2.1
- **UI Components:** Radix UI (40+ component libraries)
- **Forms:** React Hook Form 7.71.2 + Zod 3.24.2 (validation)
- **Payment:** Stripe.js 5.0.1
- **PDF Generation:** jsPDF 4.2.1 + jsPDF-AutoTable 5.0.7
- **Backend Integration:** Supabase 2.104.0
- **Charts:** Recharts 2.15.4
- **Animations:** Framer Motion 12.38.0
- **Toast Notifications:** Sonner 2.0.7

### Backend
- **Framework:** Spring Boot 3.4.5
- **Java Version:** Java 21
- **ORM:** Spring Data JPA
- **Database:** MySQL Connector J (runtime)
- **Payment:** Stripe Java SDK 26.6.0
- **Mail:** Spring Boot Mail Starter
- **Security:** Spring Security Crypto
- **Build:** Apache Maven 3.9.9
- **Testing:** JUnit (Spring Boot Test)

### Database
- **Type:** MySQL 8.0+
- **Engine:** InnoDB
- **Database Name:** securekey_locksmith_db
- **Credentials:** root/root (dev)
- **Connection:** jdbc:mysql://localhost:3306/securekey_locksmith_db

---

## 📁 Frontend Project Structure

```
src/
├── routes/                    # TanStack Router pages
│   ├── __root.tsx            # Root layout
│   ├── index.tsx             # Home page
│   ├── shop.tsx              # Product shop
│   ├── services.tsx          # Services page
│   ├── pricing.tsx           # Pricing page
│   ├── gallery.tsx           # Gallery showcase
│   ├── cart.tsx              # Shopping cart
│   ├── auth.tsx              # Authentication (login/signup)
│   ├── admin.tsx             # Admin dashboard
│   ├── admin-shop.tsx        # Admin shop management
│   ├── contact.tsx           # Contact form
│   ├── faq.tsx               # FAQ page
│   ├── about.tsx             # About page
│   └── verify-account.tsx    # Email verification
│
├── components/               # Reusable React components
│   ├── Navbar.tsx           # Navigation bar
│   ├── Footer.tsx           # Footer
│   ├── GalleryLightbox.tsx  # Image lightbox
│   ├── WhatsAppButton.tsx   # WhatsApp CTA
│   ├── StripeTestCards.tsx  # Stripe test cards reference
│   └── ui/                  # Radix UI component wrappers (40+ files)
│       ├── button.tsx
│       ├── input.tsx
│       ├── dialog.tsx
│       ├── form.tsx
│       ├── table.tsx
│       ├── card.tsx
│       ├── select.tsx
│       └── ... (38 more UI components)
│
├── hooks/                    # Custom React hooks
│   ├── use-auth.ts          # Authentication state
│   └── use-mobile.tsx       # Mobile detection
│
├── lib/                      # Utility functions & API clients
│   ├── api.ts               # HTTP client
│   ├── auth-client.ts       # Auth API wrapper
│   ├── enquiries.ts         # Enquiry management
│   ├── order-status.ts      # Order status tracking
│   ├── pdf-report.ts        # PDF generation
│   ├── shop-api.ts          # Shop API wrapper
│   └── utils.ts             # General utilities
│
├── integrations/            # Third-party integrations
│   └── supabase/            # Supabase auth & DB
│
├── assets/                  # Static assets
│
├── router.tsx               # Router configuration (auto-generated)
├── routeTree.gen.ts        # Route tree (auto-generated)
├── styles.css              # Global styles
└── components.json         # shadcn/ui config
```

---

## 🔧 Backend Project Structure

```
spring-server/
├── src/main/java/com/locksmith/platform/
│   │
│   ├── SpringServerApplication.java      # Main application entry
│   │
│   ├── controller/                       # HTTP Request Handlers
│   │   ├── AuthController.java           # Authentication (login/signup/verify)
│   │   ├── CartController.java           # Shopping cart operations
│   │   ├── OrderController.java          # Order management
│   │   ├── PaymentController.java        # Payment processing
│   │   ├── ProductController.java        # Product catalog
│   │   ├── AdminController.java          # Admin operations
│   │   ├── HealthController.java         # Health checks
│   │   └── ApiExceptionHandler.java      # Global error handling
│   │
│   ├── service/                          # Business Logic Layer
│   │   ├── AuthService.java              # Auth logic & JWT
│   │   ├── CartService.java              # Cart calculations
│   │   ├── OrderService.java             # Order processing
│   │   ├── PaymentService.java           # Payment gateway
│   │   ├── OrderNotificationService.java # Email notifications
│   │   ├── StripeService.java            # Stripe integration
│   │   ├── PayPalService.java            # PayPal integration
│   │   ├── JwtService.java               # JWT token management
│   │   ├── DistanceCalculationService.java # Location/distance calc
│   │   └── OrderStatusChangedEvent.java  # Event publishing
│   │
│   ├── repository/                       # Database Access Layer
│   │   ├── UserRepository.java           # User CRUD
│   │   ├── ProductRepository.java        # Product CRUD
│   │   ├── OrderRepository.java          # Order CRUD
│   │   ├── CartItemRepository.java       # Cart item access
│   │   ├── OrderItemRepository.java      # Order item access
│   │   ├── PasswordResetRepository.java  # Password reset tokens
│   │   ├── EmailVerificationRepository.java # Verification tokens
│   │   └── OrderLocationHistoryRepository.java # Location tracking
│   │
│   ├── entity/                           # JPA Entity Classes
│   │   ├── OrderEntity.java              # Order entity
│   │   ├── OrderItemEntity.java          # Order items
│   │   ├── CartItemEntity.java           # Cart items
│   │   ├── OrderLocationHistoryEntity.java # Order location history
│   │   └── ... (model classes)
│   │
│   ├── model/                            # Domain Models
│   │   ├── User.java                     # User entity
│   │   ├── Product.java                  # Product entity
│   │   ├── PasswordReset.java            # Password reset token
│   │   └── EmailVerification.java        # Email verification token
│   │
│   ├── dto/                              # Data Transfer Objects
│   │   ├── CartResponse.java
│   │   ├── CartItemView.java
│   │   ├── OrderSummaryView.java
│   │   ├── AdminOrderView.java
│   │   ├── AdminOrderItemView.java
│   │   └── OrderLocationHistoryView.java
│   │
│   ├── config/                           # Configuration Classes
│   │   ├── AppConfiguration.java         # App-wide config
│   │   ├── CorsConfig.java               # CORS settings
│   │   ├── StaticResourceConfig.java     # Static resource serving
│   │   └── SeedDataConfig.java           # Database seeding
│   │
│   └── auth/                             # Authentication utilities
│       └── JwtAuthenticationFilter.java  # JWT filter
│
├── src/main/resources/
│   ├── application.yml                   # Default config
│   ├── application-dev.yml               # Dev profile
│   ├── application-prod.yml              # Prod profile
│   ├── db/migration/                     # Database migrations
│   └── static/                           # Static files
│
├── pom.xml                              # Maven dependencies
├── target/                              # Build output
│   ├── classes/                         # Compiled classes
│   ├── lib/                             # Dependencies
│   └── spring-server-0.0.1-SNAPSHOT.jar # Executable JAR
│
└── uploads/                             # User uploads
```

---

## 📊 Database Schema

### Core Entities

#### **users** table
```sql
CREATE TABLE users (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    phone VARCHAR(20),
    address TEXT,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    is_verified BOOLEAN DEFAULT false,
    role ENUM('USER', 'ADMIN') DEFAULT 'USER',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

#### **products** table
```sql
CREATE TABLE products (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    category VARCHAR(100),
    image_url VARCHAR(500),
    stock_quantity INT DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

#### **orders** table
```sql
CREATE TABLE orders (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    order_number VARCHAR(50) UNIQUE,
    status ENUM('PENDING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED') DEFAULT 'PENDING',
    total_amount DECIMAL(10, 2),
    payment_method VARCHAR(50),
    payment_status ENUM('PENDING', 'COMPLETED', 'FAILED') DEFAULT 'PENDING',
    delivery_address TEXT,
    delivery_latitude DECIMAL(10, 8),
    delivery_longitude DECIMAL(11, 8),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);
```

#### **order_items** table
```sql
CREATE TABLE order_items (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    order_id BIGINT NOT NULL,
    product_id BIGINT NOT NULL,
    quantity INT NOT NULL,
    unit_price DECIMAL(10, 2),
    subtotal DECIMAL(10, 2),
    FOREIGN KEY (order_id) REFERENCES orders(id),
    FOREIGN KEY (product_id) REFERENCES products(id)
);
```

#### **cart_items** table
```sql
CREATE TABLE cart_items (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    product_id BIGINT NOT NULL,
    quantity INT NOT NULL,
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (product_id) REFERENCES products(id),
    UNIQUE KEY unique_cart_item (user_id, product_id)
);
```

#### **email_verifications** table
```sql
CREATE TABLE email_verifications (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP,
    verified BOOLEAN DEFAULT false,
    FOREIGN KEY (user_id) REFERENCES users(id)
);
```

#### **password_resets** table
```sql
CREATE TABLE password_resets (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP,
    used BOOLEAN DEFAULT false,
    FOREIGN KEY (user_id) REFERENCES users(id)
);
```

#### **order_location_history** table
```sql
CREATE TABLE order_location_history (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    order_id BIGINT NOT NULL,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    status VARCHAR(100),
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id)
);
```

---

## 🔌 API Endpoints

### Authentication Endpoints
```
POST   /api/auth/signup              # Register new user
POST   /api/auth/login               # User login
POST   /api/auth/logout              # User logout
POST   /api/auth/verify-email        # Verify email
POST   /api/auth/resend-verification # Resend verification
POST   /api/auth/forgot-password     # Request password reset
POST   /api/auth/reset-password      # Reset password
GET    /api/auth/me                  # Get current user
POST   /api/auth/refresh-token       # Refresh JWT token
```

### Product Endpoints
```
GET    /api/products                 # List all products
GET    /api/products/{id}            # Get product details
POST   /api/products                 # Create product (admin)
PUT    /api/products/{id}            # Update product (admin)
DELETE /api/products/{id}            # Delete product (admin)
```

### Cart Endpoints
```
GET    /api/cart                     # Get user's cart
POST   /api/cart/items               # Add item to cart
PUT    /api/cart/items/{id}          # Update cart item quantity
DELETE /api/cart/items/{id}          # Remove item from cart
DELETE /api/cart                     # Clear entire cart
```

### Order Endpoints
```
GET    /api/orders                   # Get user's orders
POST   /api/orders                   # Create new order
GET    /api/orders/{id}              # Get order details
PUT    /api/orders/{id}              # Update order status
GET    /api/orders/{id}/location     # Get order location history
POST   /api/orders/{id}/location     # Add location update
GET    /api/orders/{id}/track        # Track order in real-time
```

### Payment Endpoints
```
POST   /api/payment/stripe/checkout  # Create Stripe session
POST   /api/payment/stripe/webhook   # Stripe webhook handler
POST   /api/payment/paypal/checkout  # Create PayPal order
GET    /api/payment/paypal/confirm   # Confirm PayPal payment
```

### Admin Endpoints
```
GET    /api/admin/orders             # All orders (paginated)
GET    /api/admin/users              # All users (paginated)
GET    /api/admin/dashboard/stats    # Dashboard statistics
PUT    /api/admin/orders/{id}/status # Update order status
GET    /api/admin/reports            # Generate reports
```

### Health Check
```
GET    /api/health                   # Server health status
GET    /api/health/details           # Detailed health info
```

---

## 🔐 Authentication & Security

### JWT Token Flow
```
┌─────────────┐                    ┌──────────────┐
│   User      │                    │   Server     │
│             │                    │              │
│  1. Login   │──────────────────→ │ Validate     │
│  (email/pwd)│                    │ credentials  │
│             │ ←───────────────── │              │
│ 2. Receive  │   JWT Token        │ Generate JWT │
│    Token    │   (access +        │ with         │
│             │    refresh)        │ expiry       │
│             │                    │              │
│ 3. Store    │                    │              │
│    Token    │                    │              │
└─────────────┘                    └──────────────┘
```

### Token Structure
- **Access Token:** Short-lived (15-60 min), includes user ID & role
- **Refresh Token:** Long-lived (7-30 days), for obtaining new access tokens
- **Claims:** `iss`, `sub` (user ID), `role`, `iat`, `exp`

### Security Features
- Password hashing with Spring Security Crypto (BCrypt)
- Email verification tokens (time-limited)
- Password reset tokens (one-time use)
- CORS configuration (allowed origins: localhost, production domain)
- Request validation (Zod on frontend, Spring validation on backend)

---

## 🔄 Data Flow Examples

### User Registration Flow
```
1. Frontend: User fills signup form
   ↓
2. Frontend: Validate with Zod schema
   ↓
3. Frontend: POST /api/auth/signup with email, password, name
   ↓
4. Backend: AuthController receives request
   ↓
5. Backend: AuthService validates & creates user
   ↓
6. Backend: User saved to MySQL via UserRepository
   ↓
7. Backend: Generate email verification token
   ↓
8. Backend: Send verification email via SMTP
   ↓
9. Backend: Return JWT tokens + user data
   ↓
10. Frontend: Store tokens in secure storage
    ↓
11. Frontend: Redirect to email verification page
    ↓
12. User: Clicks email verification link
    ↓
13. Backend: POST /api/auth/verify-email validates token
    ↓
14. Backend: Mark user as verified, update database
    ↓
15. Frontend: Redirect to dashboard
```

### Order Placement Flow
```
1. Frontend: User adds products to cart (CartService)
   ↓
2. Frontend: Reviews order & enters delivery address
   ↓
3. Frontend: POST /api/orders with cart items & address
   ↓
4. Backend: OrderController receives request
   ↓
5. Backend: OrderService validates order
   ↓
6. Backend: Calculate distance & delivery fee (DistanceCalculationService)
   ↓
7. Backend: Create Order & OrderItems in MySQL
   ↓
8. Backend: Return order details with payment URL
   ↓
9. Frontend: Redirect to Stripe/PayPal checkout
   ↓
10. User: Complete payment
    ↓
11. Payment Gateway: Send webhook confirmation
    ↓
12. Backend: PaymentController receives webhook
    ↓
13. Backend: Update order status to 'CONFIRMED'
    ↓
14. Backend: Send order confirmation email
    ↓
15. Frontend: Show order confirmation page
```

---

## 🎨 Frontend Features

### Pages
- **Home:** Hero section, service highlights, CTA buttons
- **Shop:** Product listing, filtering, search, cart integration
- **Services:** Service offerings, pricing, booking
- **Pricing:** Service & product pricing tiers
- **Gallery:** Image gallery with lightbox
- **Cart:** Shopping cart with checkout
- **Auth:** Login & signup forms, password reset
- **Admin:** Dashboard, order management, product management
- **Contact:** Contact form with email integration
- **FAQ:** Frequently asked questions
- **About:** Company information

### Components
- Responsive navigation bar
- Product cards with images
- Shopping cart sidebar
- Order tracking with real-time updates
- Admin dashboard with statistics
- Form validation with error messages
- Toast notifications for user feedback
- WhatsApp integration button
- PDF invoice generation

---

## ⚙️ Backend Features

### Core Functionality
- User authentication (signup/login/email verification)
- Product management (CRUD operations)
- Shopping cart management
- Order processing & tracking
- Payment integration (Stripe, PayPal)
- Email notifications (SMTP via Gmail)
- Distance calculation (lat/long based delivery fees)
- Order location history tracking
- Admin dashboard with statistics
- Error handling & validation

### Background Processes
- Order status change notifications
- Email verification sending
- Password reset email sending
- Payment reconciliation
- Order location updates

---

## 🚀 Environment Configuration

### Frontend (.env)
```env
VITE_API_BASE_URL=http://localhost:8082
VITE_SUPABASE_URL=https://zftknaszzfjrzvgavvdz.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJh...
GOOGLE_MAPS_API_KEY=AIzaSy...
STRIPE_PUBLIC_KEY=pk_test_...
```

### Backend (application-dev.yml)
```yaml
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/securekey_locksmith_db
    username: root
    password: root
  jpa:
    hibernate:
      ddl-auto: update
  mail:
    host: smtp.gmail.com
    port: 587
    username: matheb239@gmail.com
    password: lkkvmcnltcklaxuq
server:
  port: 8082
  servlet:
    context-path: /api
```

---

## 📈 Scalability & Future Enhancements

### Current Limitations
- Single server deployment
- No caching layer
- No CDN for static assets
- Limited payment gateways

### Recommended Enhancements
- Add Redis caching for frequently accessed data
- Implement database indexing for large datasets
- Add GraphQL layer for flexible queries
- Microservices architecture (separate services for orders, payments, etc.)
- Message queue (RabbitMQ/Kafka) for async processing
- Containerization (Docker) for deployment
- Kubernetes orchestration for scaling
- Multi-region deployment
- Advanced analytics & reporting

---

## 🧪 Development Commands

### Frontend
```bash
# Install dependencies
npm install

# Start dev server (port 8081)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint

# Format code
npm run format
```

### Backend
```bash
# Build project
mvn clean package -DskipTests

# Run Spring Boot
mvn spring-boot:run -DskipTests

# Run tests
mvn test

# Generate executable JAR
mvn clean package
```

---

## 📝 API Integration Examples

### Login Request/Response
```
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}

Response 200:
{
  "accessToken": "eyJhbGc...",
  "refreshToken": "eyJhbGc...",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "fullName": "John Doe",
    "role": "USER"
  }
}
```

### Create Order Request/Response
```
POST /api/orders
Content-Type: application/json
Authorization: Bearer {accessToken}

{
  "items": [
    {"productId": 1, "quantity": 2},
    {"productId": 3, "quantity": 1}
  ],
  "deliveryAddress": "123 Main St",
  "latitude": -25.87,
  "longitude": 29.2,
  "paymentMethod": "stripe"
}

Response 201:
{
  "id": 1001,
  "orderNumber": "ORD-20260507-1001",
  "status": "PENDING",
  "totalAmount": 1250.50,
  "items": [...],
  "paymentUrl": "https://checkout.stripe.com/...",
  "createdAt": "2026-05-07T18:30:00Z"
}
```

---

## 📞 Support & Maintenance

### Development Team Contact
- Backend Issues: Spring Boot configuration, API endpoints
- Frontend Issues: React components, routing, styling
- Database Issues: MySQL queries, schema migrations

### Known Issues
- Maven compiler file permission issues on Windows (see troubleshooting)
- Backend startup requires database pre-configuration
- Email verification relies on Gmail SMTP credentials

---

**Last Updated:** May 7, 2026  
**Project Status:** In Development  
**Frontend Status:** ✅ Operational (Port 8081)  
**Backend Status:** ⚠️ Requires database compilation fix  
**Database Status:** ✅ Running (Port 3306)
