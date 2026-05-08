# Project Architecture Diagrams

## System Architecture

```mermaid
graph TB
    subgraph Frontend["🖥️ FRONTEND (Port 8081)"]
        React["React 19 + TypeScript<br/>TanStack Router"]
        UI["UI Components<br/>Radix UI + TailwindCSS"]
        State["State Management<br/>React Query + Hooks"]
    end

    subgraph Client["📱 CLIENT SERVICES"]
        Auth["Auth Client<br/>JWT Token Management"]
        API["API Client<br/>HTTP Requests"]
        Utils["Utils & Helpers<br/>Validation, Formatting"]
    end

    subgraph Backend["🔧 BACKEND (Port 8082)"]
        Controller["Controllers<br/>HTTP Request Handlers"]
        Service["Services<br/>Business Logic"]
        Repo["Repositories<br/>Data Access"]
    end

    subgraph Database["🗄️ DATABASE (Port 3306)"]
        MySQL["MySQL 8<br/>securekey_locksmith_db"]
        Tables["Tables: Users, Products,<br/>Orders, Cart, Payments"]
    end

    subgraph External["🌐 EXTERNAL SERVICES"]
        Stripe["Stripe<br/>Payment Processing"]
        Gmail["Gmail SMTP<br/>Email Sending"]
        Maps["Google Maps<br/>Distance Calculation"]
    end

    React --> UI
    React --> State
    React --> Auth
    React --> API
    Auth --> Controller
    API --> Controller
    Utils --> Service
    Controller --> Service
    Service --> Repo
    Repo --> MySQL
    MySQL --> Tables
    Service --> Stripe
    Service --> Gmail
    Service --> Maps
```

## Frontend Component Hierarchy

```mermaid
graph TD
    App["__root.tsx<br/>Main App Layout"]
    
    App --> Nav["Navbar Component"]
    App --> Routes["Router Outlet"]
    App --> Footer["Footer Component"]
    
    Routes --> Home["index.tsx<br/>Home Page"]
    Routes --> Shop["shop.tsx<br/>Product Shop"]
    Routes --> Services["services.tsx<br/>Services"]
    Routes --> Pricing["pricing.tsx<br/>Pricing"]
    Routes --> Gallery["gallery.tsx<br/>Gallery"]
    Routes --> Cart["cart.tsx<br/>Shopping Cart"]
    Routes --> Auth["auth.tsx<br/>Login/Signup"]
    Routes --> Admin["admin.tsx<br/>Admin Dashboard"]
    Routes --> Contact["contact.tsx<br/>Contact Form"]
    Routes --> FAQ["faq.tsx<br/>FAQ Page"]
    Routes --> About["about.tsx<br/>About Page"]
    
    Home --> Hero["Hero Section"]
    Home --> Featured["Featured Products"]
    Home --> CTA["Call-to-Action"]
    
    Shop --> ProductCard["Product Cards"]
    Shop --> Filter["Filters"]
    Shop --> CartBtn["Add to Cart"]
    
    Cart --> Items["Cart Items"]
    Cart --> Checkout["Checkout"]
    Cart --> Stripe["Stripe Checkout"]
```

## Backend Layers

```mermaid
graph LR
    subgraph HTTP["HTTP Layer"]
        Request["HTTP Request"]
    end
    
    subgraph Ctrl["Controller Layer"]
        AuthCtrl["AuthController"]
        CartCtrl["CartController"]
        OrderCtrl["OrderController"]
        PaymentCtrl["PaymentController"]
        ProductCtrl["ProductController"]
        AdminCtrl["AdminController"]
    end
    
    subgraph Svc["Service Layer"]
        AuthSvc["AuthService"]
        CartSvc["CartService"]
        OrderSvc["OrderService"]
        PaymentSvc["PaymentService"]
        DistSvc["DistanceCalculationService"]
        NotifSvc["NotificationService"]
    end
    
    subgraph Repo["Repository Layer"]
        UserRepo["UserRepository"]
        CartRepo["CartItemRepository"]
        OrderRepo["OrderRepository"]
        ProductRepo["ProductRepository"]
    end
    
    subgraph DB["Database Layer"]
        UserTable["users"]
        CartTable["cart_items"]
        OrderTable["orders"]
        ProductTable["products"]
    end
    
    Request --> Ctrl
    Ctrl --> Svc
    Svc --> Repo
    Repo --> DB
    Svc -.->|External| Stripe["Stripe API"]
    Svc -.->|External| Gmail["Gmail SMTP"]
    Svc -.->|External| Maps["Google Maps"]
```

## Authentication Flow

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant Backend
    participant Database
    participant Gmail
    
    User->>Frontend: 1. Fill signup form
    Frontend->>Frontend: 2. Validate with Zod
    Frontend->>Backend: 3. POST /api/auth/signup
    Backend->>Backend: 4. Hash password
    Backend->>Database: 5. Save user to DB
    Database-->>Backend: User ID
    Backend->>Backend: 6. Generate verification token
    Backend->>Gmail: 7. Send verification email
    Gmail-->>User: Verification link
    Backend-->>Frontend: 8. Return tokens + user data
    Frontend->>Frontend: 9. Store tokens
    Frontend->>User: 10. Redirect to verify page
    User->>Frontend: 11. Click email link
    Frontend->>Backend: 12. POST /api/auth/verify-email
    Backend->>Database: 13. Update user.verified = true
    Backend-->>Frontend: 14. Success response
    Frontend->>User: 15. Redirect to dashboard
```

## Order Processing Flow

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant Backend
    participant Database
    participant Stripe
    participant Gmail
    
    User->>Frontend: 1. Add products to cart
    Frontend->>Frontend: 2. Update cart state
    User->>Frontend: 3. Click checkout
    Frontend->>Backend: 4. POST /api/orders
    Backend->>Backend: 5. Validate order
    Backend->>Backend: 6. Calculate distance
    Backend->>Backend: 7. Calculate delivery fee
    Backend->>Database: 8. Create order + items
    Database-->>Backend: Order ID
    Backend->>Stripe: 9. Create checkout session
    Stripe-->>Backend: Checkout URL
    Backend-->>Frontend: 10. Return checkout URL
    Frontend->>Stripe: 11. Redirect to checkout
    User->>Stripe: 12. Enter payment details
    Stripe->>Stripe: 13. Process payment
    Stripe->>Backend: 14. POST /api/payment/webhook
    Backend->>Database: 15. Update order.status = CONFIRMED
    Backend->>Gmail: 16. Send order confirmation
    Gmail-->>User: Order confirmation email
    Backend-->>Stripe: 17. Acknowledge webhook
    Frontend->>Backend: 18. Poll order status
    Backend-->>Frontend: Order confirmed
    Frontend->>User: 19. Show success page
```

## Database Schema Relationships

```mermaid
erDiagram
    USERS ||--o{ ORDERS : places
    USERS ||--o{ CART_ITEMS : has
    USERS ||--o{ EMAIL_VERIFICATIONS : has
    USERS ||--o{ PASSWORD_RESETS : requests
    
    PRODUCTS ||--o{ CART_ITEMS : added_to
    PRODUCTS ||--o{ ORDER_ITEMS : contains
    
    ORDERS ||--o{ ORDER_ITEMS : includes
    ORDERS ||--o{ ORDER_LOCATION_HISTORY : tracks
    
    USERS {
        bigint id PK
        string email UK
        string password_hash
        string full_name
        string phone
        string address
        decimal latitude
        decimal longitude
        boolean is_verified
        enum role
        timestamp created_at
        timestamp updated_at
    }
    
    PRODUCTS {
        bigint id PK
        string name
        text description
        decimal price
        string category
        string image_url
        int stock_quantity
        boolean is_active
        timestamp created_at
        timestamp updated_at
    }
    
    ORDERS {
        bigint id PK
        bigint user_id FK
        string order_number UK
        enum status
        decimal total_amount
        string payment_method
        enum payment_status
        text delivery_address
        decimal delivery_latitude
        decimal delivery_longitude
        text notes
        timestamp created_at
        timestamp updated_at
    }
    
    ORDER_ITEMS {
        bigint id PK
        bigint order_id FK
        bigint product_id FK
        int quantity
        decimal unit_price
        decimal subtotal
    }
    
    CART_ITEMS {
        bigint id PK
        bigint user_id FK
        bigint product_id FK
        int quantity
        timestamp added_at
    }
    
    ORDER_LOCATION_HISTORY {
        bigint id PK
        bigint order_id FK
        decimal latitude
        decimal longitude
        string status
        timestamp recorded_at
    }
    
    EMAIL_VERIFICATIONS {
        bigint id PK
        bigint user_id FK
        string token UK
        timestamp expires_at
        boolean verified
    }
    
    PASSWORD_RESETS {
        bigint id PK
        bigint user_id FK
        string token UK
        timestamp expires_at
        boolean used
    }
```

## Request/Response Cycle

```mermaid
graph LR
    subgraph Client["Client<br/>(React)"]
        Component["React Component"]
        Hook["useQuery/useMutation<br/>React Hook"]
        Fetch["fetch/axios"]
    end
    
    subgraph Network["HTTP Network"]
        Request["HTTP Request<br/>with JWT Token"]
        Response["HTTP Response<br/>JSON Data"]
    end
    
    subgraph Server["Server<br/>(Spring Boot)"]
        Filter["JwtAuthenticationFilter"]
        Ctrl["Controller"]
        Svc["Service"]
        Repo["Repository"]
    end
    
    subgraph DB["Database"]
        Query["SQL Query"]
        Result["Result Set"]
    end
    
    Component -->|1. Call function| Hook
    Hook -->|2. Create request| Fetch
    Fetch -->|3. Send HTTP| Request
    Request -->|4. Receive| Filter
    Filter -->|5. Validate JWT| Ctrl
    Ctrl -->|6. Process| Svc
    Svc -->|7. Query data| Repo
    Repo -->|8. Execute| Query
    Query -->|9. Return rows| Result
    Result -->|10. Map to DTO| Svc
    Svc -->|11. Return data| Ctrl
    Ctrl -->|12. Build response| Response
    Response -->|13. Receive| Fetch
    Fetch -->|14. Update state| Hook
    Hook -->|15. Trigger re-render| Component
```

## State Management

```mermaid
graph TD
    User["User State<br/>use-auth.ts"]
    Cart["Cart State<br/>React Query"]
    Auth["Auth Context<br/>JWT Tokens"]
    
    User -->|Signup/Login| Backend["Backend API"]
    Backend -->|Return User + Tokens| Auth
    Auth -->|Store Tokens| LocalStorage["Local Storage"]
    
    Cart -->|Add Item| CartService["Cart Service"]
    CartService -->|Update Local State| Cart
    CartService -->|Sync with Server| Backend
    
    Auth -->|Attach Token| Request["HTTP Request"]
    Request -->|Include Header| Backend
    Backend -->|Validate| Protected["Protected Route"]
    
    Cart -->|Display| Component["Cart Component"]
    User -->|Display| Component
    Auth -->|Show/Hide| Component
```

## Error Handling Flow

```mermaid
graph TD
    Request["HTTP Request"]
    Try["Try Block"]
    Success{"Status<br/>200?"}
    Error{"Error<br/>Type?"}
    
    Request --> Try
    Try -->|Success| Success
    Success -->|Yes| Return["Return Data<br/>to Component"]
    Success -->|No| Error
    
    Error -->|400/422| Validation["Validation Error<br/>Display form errors"]
    Error -->|401| Unauthorized["Unauthorized<br/>Clear tokens<br/>Redirect to login"]
    Error -->|403| Forbidden["Forbidden<br/>Show permission denied"]
    Error -->|404| NotFound["Not Found<br/>Show 404 page"]
    Error -->|500| Server["Server Error<br/>Show error toast"]
    
    Validation --> Component["Update Component<br/>Show Error Messages"]
    Unauthorized --> Component
    Forbidden --> Component
    NotFound --> Component
    Server --> Component
```

## Deployment Architecture (Recommended)

```mermaid
graph TB
    subgraph CDN["CDN Layer"]
        Static["Static Assets<br/>CSS, JS, Images"]
    end
    
    subgraph LoadBalancer["Load Balancer"]
        LB["NGINX/HAProxy<br/>Port 80/443"]
    end
    
    subgraph FrontendServers["Frontend Servers"]
        Frontend1["Vite Dev Server 1"]
        Frontend2["Vite Dev Server 2"]
        Frontend3["Vite Dev Server N"]
    end
    
    subgraph BackendServers["Backend Servers"]
        Backend1["Spring Boot 1<br/>Port 8082"]
        Backend2["Spring Boot 2<br/>Port 8082"]
        Backend3["Spring Boot N<br/>Port 8082"]
    end
    
    subgraph Cache["Cache Layer"]
        Redis["Redis Cluster<br/>Session + Data Cache"]
    end
    
    subgraph Database["Database Cluster"]
        Primary["MySQL Primary<br/>Port 3306"]
        Replica["MySQL Replica<br/>Read-only"]
    end
    
    User["Users"]
    
    User -->|HTTPS| LB
    LB --> Frontend1
    LB --> Frontend2
    LB --> Frontend3
    LB --> Backend1
    LB --> Backend2
    LB --> Backend3
    
    Frontend1 --> CDN
    Frontend2 --> CDN
    Frontend3 --> CDN
    
    Backend1 --> Redis
    Backend2 --> Redis
    Backend3 --> Redis
    
    Backend1 --> Primary
    Backend2 --> Primary
    Backend3 --> Primary
    Primary --> Replica
```

## Technology Stack Versions

```mermaid
graph LR
    subgraph Frontend["Frontend Stack"]
        React["React 19.2.0"]
        TS["TypeScript 5.8.3"]
        Vite["Vite 7.3.1"]
        TanStack["TanStack<br/>Router 1.168.0"]
        Query["React Query 5.83.0"]
        Tailwind["TailwindCSS 4.2.1"]
    end
    
    subgraph Backend["Backend Stack"]
        SpringBoot["Spring Boot 3.4.5"]
        Java["Java 21"]
        Maven["Maven 3.9.9"]
        JPA["Spring Data JPA"]
        Security["Spring Security"]
    end
    
    subgraph Database["Database Stack"]
        MySQL["MySQL 8.0+"]
        InnoDB["InnoDB Engine"]
    end
    
    subgraph External["External Services"]
        Stripe["Stripe v1"]
        PayPal["PayPal SDK"]
        Gmail["Gmail SMTP"]
        GMaps["Google Maps API"]
    end
```

---

**Last Updated:** May 7, 2026  
**Diagram Format:** Mermaid  
**Complexity Level:** Enterprise
