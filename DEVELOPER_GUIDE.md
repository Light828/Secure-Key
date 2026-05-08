# Developer Quick Reference Guide

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ (for frontend)
- Java 21 (for backend)
- MySQL 8.0+ (running on port 3306)
- Maven 3.9.9
- Git

### First Time Setup

```bash
# Clone repository
git clone https://github.com/222881633-Titus-L/Secure-Key.git
cd Secure-Key

# Install frontend dependencies
npm install

# Backend is already in spring-server/ with pom.xml
```

### Running the Project

```bash
# Terminal 1 - Start Frontend
npm run dev
# Opens at http://localhost:8081

# Terminal 2 - Start Backend
cd spring-server
set JAVA_HOME=C:\Program Files\Microsoft\jdk-21.0.10.7-hotspot
mvn spring-boot:run -DskipTests
# Runs at http://localhost:8082/api

# Database - MySQL should be running on port 3306
# Database: securekey_locksmith_db (created automatically)
```

---

## 📁 File Structure Quick Reference

### Key Frontend Files
```
src/
├── routes/              # Page components
├── components/          # Reusable components
├── hooks/              # Custom hooks (use-auth, use-mobile)
├── lib/                # API clients & utilities
├── integrations/       # Third-party services (Supabase)
├── router.tsx          # Router configuration
└── styles.css          # Global styles
```

### Key Backend Files
```
spring-server/src/main/java/com/locksmith/platform/
├── controller/         # @RestController endpoints
├── service/            # @Service business logic
├── repository/         # @Repository data access
├── entity/             # @Entity JPA classes
├── model/              # Domain model classes
├── dto/                # Data Transfer Objects
├── config/             # @Configuration classes
└── SpringServerApplication.java  # Main class
```

---

## 🔌 Common API Calls

### Authentication

**Login**
```javascript
// Frontend
const response = await fetch('http://localhost:8082/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'password123'
  })
});
const { accessToken, user } = await response.json();
localStorage.setItem('authToken', accessToken);
```

**Get Current User**
```javascript
const response = await fetch('http://localhost:8082/api/auth/me', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
  }
});
const user = await response.json();
```

### Products

**Get All Products**
```javascript
const response = await fetch('http://localhost:8082/api/products');
const products = await response.json();
```

**Get Product Details**
```javascript
const response = await fetch('http://localhost:8082/api/products/1');
const product = await response.json();
```

### Cart

**Get Cart**
```javascript
const response = await fetch('http://localhost:8082/api/cart', {
  headers: { 'Authorization': `Bearer ${token}` }
});
const cart = await response.json();
```

**Add to Cart**
```javascript
const response = await fetch('http://localhost:8082/api/cart/items', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    productId: 1,
    quantity: 2
  })
});
```

### Orders

**Create Order**
```javascript
const response = await fetch('http://localhost:8082/api/orders', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    items: [
      { productId: 1, quantity: 2 },
      { productId: 3, quantity: 1 }
    ],
    deliveryAddress: '123 Main St',
    latitude: -25.87,
    longitude: 29.2,
    paymentMethod: 'stripe'
  })
});
const order = await response.json();
```

**Get Orders**
```javascript
const response = await fetch('http://localhost:8082/api/orders', {
  headers: { 'Authorization': `Bearer ${token}` }
});
const orders = await response.json();
```

**Track Order**
```javascript
const response = await fetch('http://localhost:8082/api/orders/1001/track', {
  headers: { 'Authorization': `Bearer ${token}` }
});
const orderStatus = await response.json();
```

---

## 💾 Database Common Queries

### View All Users
```sql
SELECT id, email, full_name, phone, role, is_verified, created_at 
FROM users;
```

### View Orders with Details
```sql
SELECT o.id, o.order_number, o.status, o.total_amount, 
       u.email, u.full_name, o.created_at
FROM orders o
JOIN users u ON o.user_id = u.id
ORDER BY o.created_at DESC;
```

### View Cart Items for User
```sql
SELECT ci.id, p.name, p.price, ci.quantity, (p.price * ci.quantity) as subtotal
FROM cart_items ci
JOIN products p ON ci.product_id = p.id
WHERE ci.user_id = 1;
```

### Get Order Details
```sql
SELECT o.*, 
       oi.product_id, oi.quantity, oi.unit_price,
       p.name as product_name
FROM orders o
LEFT JOIN order_items oi ON o.id = oi.order_id
LEFT JOIN products p ON oi.product_id = p.id
WHERE o.id = 1001;
```

### Reset User Password (Development Only)
```sql
UPDATE users 
SET password_hash = '$2a$10$...' 
WHERE email = 'user@example.com';
```

---

## 🔧 Common Development Tasks

### Add New API Endpoint

1. **Create DTO** (if needed)
```java
// src/main/java/com/locksmith/platform/dto/MyRequest.java
public class MyRequest {
    private String field1;
    private Integer field2;
    // getters, setters, constructor
}
```

2. **Create Controller Method**
```java
// In appropriate controller
@PostMapping("/my-endpoint")
@PreAuthorize("hasAnyRole('USER', 'ADMIN')")
public ResponseEntity<?> myMethod(@RequestBody MyRequest request) {
    // Call service
    return ResponseEntity.ok(result);
}
```

3. **Implement Service Logic**
```java
// In corresponding service
public MyResponse handleMyRequest(MyRequest request) {
    // Business logic
    // Save to database via repository
    return response;
}
```

4. **Test with Frontend**
```javascript
// In React component or service
const response = await fetch('http://localhost:8082/api/my-endpoint', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify(requestData)
});
```

### Add New Database Table

1. **Create Entity Class**
```java
@Entity
@Table(name = "my_table")
public class MyEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false)
    private String name;
    
    // getters, setters
}
```

2. **Create Repository**
```java
@Repository
public interface MyRepository extends JpaRepository<MyEntity, Long> {
    List<MyEntity> findByName(String name);
}
```

3. **Hibernate will auto-create table** (if `ddl-auto: update`)

### Add New Frontend Page

1. **Create Route Component**
```typescript
// src/routes/my-page.tsx
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/my-page')({
  component: () => <MyPageComponent />
})

function MyPageComponent() {
  return <div>My Page Content</div>
}
```

2. **Add Navigation Link**
```typescript
// In Navbar.tsx
<Link to="/my-page">My Page</Link>
```

3. **Component automatically appears** in the app

---

## 🐛 Common Issues & Solutions

### Issue: `ERR_CONNECTION_REFUSED` when calling API
**Solution:** Backend not running on port 8082
```bash
cd spring-server
set JAVA_HOME=C:\Program Files\Microsoft\jdk-21.0.10.7-hotspot
mvn spring-boot:run -DskipTests
```

### Issue: `No database selected` error
**Solution:** Database not created or wrong credentials
```bash
# Create database manually if needed
mysql -u root -p
CREATE DATABASE securekey_locksmith_db;
```

### Issue: Maven compilation error (file permissions)
**Solution:** Clear cache and retry
```bash
cd spring-server
mvn clean
del target -r
mvn install -DskipTests
```

### Issue: JWT Token expired
**Solution:** Refresh token automatically
```javascript
// Frontend should auto-refresh expired tokens
// See useQuery configuration in api.ts
```

### Issue: CORS error when calling API
**Solution:** Already configured in backend (CorsConfig.java)
**Check:** CORS allowed origins include localhost:8081

---

## 📊 Testing Stripe Payments

### Test Card Numbers
```
Visa:                 4242 4242 4242 4242
Mastercard:           5555 5555 5555 4444
American Express:     3782 822463 10005
Visa (debit):         4000 0566 5566 5556
```

### Test Expiry & CVC
- Any future expiry date (e.g., 12/25)
- Any 3-digit CVC (e.g., 123)

### Webhook Testing
```bash
# Install stripe-cli
stripe listen --forward-to localhost:8082/api/payment/stripe/webhook

# Trigger test events
stripe trigger payment_intent.succeeded
```

---

## 🔐 Environment Variables

### Frontend (.env in root)
```env
VITE_API_BASE_URL=http://localhost:8082
VITE_SUPABASE_URL=https://zftknaszzfjrzvgavvdz.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGci...
STRIPE_PUBLIC_KEY=pk_test_...
GOOGLE_MAPS_API_KEY=AIzaSy...
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
```

---

## 📚 Useful Resources

### Frontend
- [React Documentation](https://react.dev)
- [TanStack Router](https://tanstack.com/router)
- [TailwindCSS](https://tailwindcss.com)
- [Radix UI](https://www.radix-ui.com)
- [React Hook Form](https://react-hook-form.com)

### Backend
- [Spring Boot Guide](https://spring.io/projects/spring-boot)
- [Spring Data JPA](https://spring.io/projects/spring-data-jpa)
- [Spring Security](https://spring.io/projects/spring-security)
- [Maven Documentation](https://maven.apache.org)

### Database
- [MySQL Documentation](https://dev.mysql.com/doc)
- [SQL Tutorial](https://www.w3schools.com/sql)
- [JPA Relationships](https://docs.jboss.org/hibernate/orm/6.0/userguide/html_single/Hibernate_User_Guide.html)

### Payment
- [Stripe API Docs](https://stripe.com/docs)
- [Stripe Testing](https://stripe.com/docs/testing)

---

## 🎯 Code Style & Conventions

### Frontend
- **Components:** PascalCase (MyComponent.tsx)
- **Variables:** camelCase (myVariable)
- **Constants:** UPPER_SNAKE_CASE (MY_CONSTANT)
- **Folders:** kebab-case (my-folder/)

### Backend
- **Classes:** PascalCase (MyClass.java)
- **Variables:** camelCase (myVariable)
- **Constants:** UPPER_SNAKE_CASE (MY_CONSTANT)
- **Methods:** camelCase (myMethod())
- **Packages:** lowercase (com.locksmith.platform)

---

## 🔄 Git Workflow

```bash
# Create feature branch
git checkout -b feature/my-feature

# Make changes
git add .
git commit -m "feat: add my feature"

# Push to GitHub
git push origin feature/my-feature

# Create Pull Request on GitHub
# After review, merge to main
git checkout main
git pull
git merge feature/my-feature
```

---

## 📈 Performance Tips

### Frontend
- Use React.memo() for expensive components
- Lazy load routes with @tanstack/react-router
- Optimize images (use WebP format)
- Enable production build for better performance
- Use React DevTools Profiler to find bottlenecks

### Backend
- Add database indexes on frequently queried columns
- Use pagination for large result sets
- Cache frequently accessed data (Redis)
- Profile Spring Boot with Spring Boot Actuator
- Monitor memory with VisualVM

### Database
- Add indexes on foreign keys
- Analyze query plans with EXPLAIN
- Regular backups to prevent data loss
- Monitor slow query log

---

## 📞 Debugging Tips

### Frontend Debugging
```javascript
// Console logging
console.log('Variable:', myVar);
console.error('Error:', error);
console.table(arrayOfObjects);

// React Developer Tools (Chrome Extension)
// Check component props and state

// Network Tab
// View all API requests and responses
```

### Backend Debugging
```bash
# Run with debug mode
mvn -X spring-boot:run -DskipTests

# Check logs
tail -f logs/spring.log

# Attach IDE debugger
# Set breakpoints in IntelliJ/Eclipse
```

### Database Debugging
```sql
-- Slow queries
SET GLOBAL slow_query_log = 'ON';
SET GLOBAL long_query_time = 2;

-- Check active queries
SHOW PROCESSLIST;

-- Check locks
SHOW OPEN TABLES WHERE In_use > 0;
```

---

## 🚀 Deployment Checklist

### Before Deployment
- [ ] Run linting: `npm run lint` & `mvn verify`
- [ ] Run all tests: `npm test` & `mvn test`
- [ ] Update version numbers
- [ ] Create database backups
- [ ] Review environment variables
- [ ] Test payment gateway in production mode
- [ ] Test email sending
- [ ] Verify CORS settings

### Deployment Steps
- [ ] Build frontend: `npm run build`
- [ ] Build backend: `mvn clean package`
- [ ] Update database schema migrations
- [ ] Deploy to server
- [ ] Verify all endpoints responding
- [ ] Monitor error logs
- [ ] Test key workflows (login, order, payment)

---

**Last Updated:** May 7, 2026  
**Difficulty Level:** Intermediate  
**Maintenance:** Ongoing
