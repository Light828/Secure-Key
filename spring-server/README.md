# Spring Boot Backend

This folder contains the Java backend for the Locksmith Platform.

## Open in IntelliJ IDEA

1. Open IntelliJ IDEA.
2. Choose `File > Open`.
3. Select the `spring-server` folder.
4. Let IntelliJ import the Maven project.
5. Confirm the project SDK is Java 21.

## Run

1. Make sure MySQL is running and the `securekey_locksmith_db` database exists.
2. Set `paypal.client-id` and `paypal.client-secret` in `src/main/resources/application.properties` or as environment variables.
3. Run the `SpringServerApplication` main class.
4. The server starts on `http://localhost:8080/api`.

## Endpoints

- `GET /api/health`
- `GET /api/products`
- `POST /api/auth/register`
- `POST /api/auth/verify`
- `POST /api/auth/login`
- `GET /api/cart`
- `POST /api/cart/add`
- `PATCH /api/cart/{itemId}`
- `DELETE /api/cart/{itemId}`
- `POST /api/orders/create-paypal-order`
- `POST /api/orders/capture-paypal-order`
- `GET /api/orders/my-orders`
- `GET /api/admin/products`
- `POST /api/admin/products`
- `PATCH /api/admin/products/{id}`
- `GET /api/admin/orders`
- `PATCH /api/admin/orders/{id}/status`