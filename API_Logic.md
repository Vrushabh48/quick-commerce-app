#APIs and business logic for each API

#V1

# API BUSINESS LOGIC SPECIFICATION (v1)

This document defines **approved, production-grade API business logic**.
Anything not written here is **out of scope** and must not be implemented ad-hoc.

---

## USER AUTHENTICATION & ACCOUNT

---

## 1. Signup  
**POST** `/auth/signup`  
**Responsibility:** Create a new user account and initialize an authenticated session.

### Business Logic
1. Validate request body:
   - Valid email format
   - Password meets security requirements
   - Role (if provided) is allowed  
   → If validation fails, return **400 Bad Request (Invalid inputs)**

2. Normalize input:
   - Convert email to lowercase
   - Trim whitespaces

3. Check email uniqueness:
   - If email already exists, return **409 Conflict (Email already exists)**

4. Hash password using a secure hashing algorithm (bcrypt/argon2)

5. Create user record in database

6. Create authentication session linked to the user

7. Generate tokens **bound to the session**:
   - Short-lived access token
   - Long-lived refresh token

8. Persist refresh token securely:
   - Store **hashed refresh token** linked to session

9. Return response:
   - **201 Created**
   - access token
   - refresh token
   - minimal user profile

**Status:** ✅ Approved

---

## 2. Login  
**POST** `/auth/login`  
**Responsibility:** Authenticate an existing user and initialize a new session.

### Business Logic
1. Validate request body  
   → If invalid, return **400 Bad Request (Invalid inputs)**

2. Normalize email (lowercase, trim)

3. Fetch user by email:
   - If user does not exist, return **404 Not Found (User not found)**

4. Verify password:
   - Compare provided password with stored hash
   - If mismatch, return **401 Unauthorized (Wrong password)**

5. Check user account status:
   - If inactive/blocked, return **403 Forbidden**

6. Create new authentication session linked to the user

7. Generate tokens **bound to the session**:
   - Short-lived access token
   - Long-lived refresh token

8. Persist refresh token securely:
   - Store **hashed refresh token** linked to session

9. Return response:
   - **201 Created**
   - access token
   - refresh token
   - minimal user profile

**Status:** ✅ Approved  
**Note:** Password must **never** be re-hashed and compared manually.

---

## 3. Refresh Access Token  
**POST** `/auth/refresh/token`  
**Responsibility:** Issue a new access token using a valid refresh token.

### Business Logic
1. Validate refresh token presence  
   → If missing, return **401 Unauthorized**

2. Verify refresh token signature and expiration  
   → If invalid, return **401 Unauthorized**

3. Fetch session using refresh token identifier
   - If session not found or revoked, return **401 Unauthorized**

4. Rotate refresh token:
   - Invalidate old refresh token
   - Generate new refresh token
   - Store hashed new refresh token linked to same session

5. Generate new access token bound to session

6. Update session `lastUsedAt`

7. Return response:
   - **200 OK**
   - new access token
   - new refresh token

**Status:** ✅ Approved  
**Security Requirement:** Refresh token rotation is mandatory.

---

## 4. Logout  
**POST** `/auth/logout`  
**Responsibility:** Terminate the current authentication session.

### Business Logic
1. Authenticate request using access token

2. Identify active session from token

3. Revoke session:
   - Mark session as revoked
   - Invalidate refresh token

4. Return response:
   - **204 No Content**

**Status:** ✅ Approved

---

## USER PROFILE

---

## 5. Update Profile Details  
**PUT** `/api/user/profile`  
**Responsibility:** Update editable user profile information.

### Business Logic
1. Authenticate request

2. Validate input fields (name, phone, etc.)
   → If invalid, return **400 Bad Request**

3. Update allowed fields only

4. Persist changes

5. Return response:
   - **200 OK**
   - updated profile

**Status:** ✅ Approved

---

## 6. Change Password  
**PUT** `/api/user/change-password`  
**Responsibility:** Securely change user password.

### Business Logic
1. Authenticate request

2. Validate input:
   - old password
   - new password meets security policy

3. Verify old password
   → If mismatch, return **401 Unauthorized**

4. Hash new password

5. Update password in database

6. Revoke all existing sessions except current one

7. Return response:
   - **200 OK**

**Status:** ✅ Approved

---

## ADDRESS MANAGEMENT

---

## 7. Add Address  
**POST** `/api/user/address`  
**Responsibility:** Add a new delivery address for the user.

### Business Logic
1. Authenticate request

2. Validate address fields
   → If invalid, return **400 Bad Request**

3. Persist address linked to user

4. Return response:
   - **201 Created**
   - address data

**Status:** ✅ Approved

---

## 8. Edit Address  
**PUT** `/api/user/address/:id`  
**Responsibility:** Update an existing address.

### Business Logic
1. Authenticate request

2. Fetch address by ID
   - If not found or not owned by user, return **404 Not Found**

3. Validate updated fields

4. Persist changes

5. Return response:
   - **200 OK**
   - updated address

**Status:** ✅ Approved

---

## PRODUCT & CART

---

## 9. Browse Products  
**GET** `/api/products`  
**Responsibility:** Retrieve available products for browsing.

### Business Logic
1. Fetch active products

2. Apply filters (category, price, availability)

3. Apply pagination

4. Return response:
   - **200 OK**
   - product list

**Status:** ✅ Approved

---

## 10. Add Item to Cart  
**POST** `/api/cart/add`  
**Responsibility:** Add a product to the user’s cart.

### Business Logic
1. Authenticate request

2. Validate product ID and quantity

3. Check product availability
   → If unavailable, return **409 Conflict**

4. Create or update cart item

5. Recalculate cart totals

6. Return response:
   - **200 OK**
   - updated cart

**Status:** ✅ Approved

---

## ORDER & PAYMENT

---

## 11. Create Order  
**POST** `/api/order/neworder`  
**Responsibility:** Convert cart into an order.

### Business Logic
1. Authenticate request

2. Fetch user cart
   → If empty, return **400 Bad Request**

3. Validate delivery address

4. Lock product prices and availability

5. Create order with status `PENDING_PAYMENT`

6. Return response:
   - **201 Created**
   - order summary

**Status:** ✅ Approved

---

## 12. Complete Payment  
**POST** `/api/payment/complete`  
**Responsibility:** Process and confirm payment for an order.

### Business Logic
1. Authenticate request

2. Validate order and payment intent

3. Process payment via gateway

4. On success:
   - Update order status to `PAID`
   - Generate invoice

5. On failure:
   - Update order status to `PAYMENT_FAILED`

6. Return response:
   - **200 OK**
   - payment status

**Status:** ✅ Approved

---

## DELIVERY

---

## 13. Track Rider  
**GET** `/api/order/:orderId/track`  
**Responsibility:** Provide real-time delivery tracking.

### Business Logic
1. Authenticate request

2. Validate order ownership

3. Fetch rider’s last known location

4. Return response:
   - **200 OK**
   - location and ETA

**Status:** ✅ Approved

---
# STORE, ADMIN & DELIVERY PARTNER — API BUSINESS LOGIC (v1)

This section extends the core system into **store operations, admin control, and delivery partner workflows**.  
All APIs below are **production-grade in design** and **event-driven by intent**.

---

# STORE (MERCHANT)

---

## 14. Receive Orders  
**GET** `/api/store/orders/incoming`  
**Responsibility:** Allow store to view new orders awaiting action.

### Business Logic
1. Authenticate store account
2. Verify store status is `ACTIVE`
3. Fetch orders with status `PLACED`
4. Sort by creation time
5. Return response:
   - **200 OK**
   - list of incoming orders

### Events
- None (read-only)

---

## 15. Accept Order  
**POST** `/api/store/orders/:orderId/accept`  
**Responsibility:** Accept responsibility for fulfilling an order.

### Business Logic
1. Authenticate store
2. Fetch order by ID
   - If not found, return **404 Not Found**
3. Verify order belongs to store
4. Verify order status is `PLACED`
   - Else return **409 Conflict**
5. Update order status → `ACCEPTED_BY_STORE`
6. Reserve inventory
7. Emit event: `ORDER_ACCEPTED_BY_STORE`
8. Return response:
   - **200 OK**
   - updated order state

---

## 16. Update Order Status  
**PATCH** `/api/store/orders/:orderId/status`  
**Responsibility:** Progress order through preparation stages.

### Allowed Status Transitions
- `ACCEPTED_BY_STORE` → `PREPARING`
- `PREPARING` → `READY_FOR_PICKUP`

### Business Logic
1. Authenticate store
2. Validate requested status transition
3. Update order status
4. Emit event: `ORDER_STATUS_UPDATED`
5. Return response:
   - **200 OK**

---

## 17. Add Store Inventory  
**POST** `/api/store/inventory`  
**Responsibility:** Add new inventory items for store.

### Business Logic
1. Authenticate store
2. Validate product & quantity
3. Create inventory record linked to store
4. Emit event: `INVENTORY_ADDED`
5. Return response:
   - **201 Created**
   - inventory item

---

## 18. Update Store Status  
**PATCH** `/api/store/status`  
**Responsibility:** Toggle store availability.

### Business Logic
1. Authenticate store
2. Validate status (`OPEN | CLOSED`)
3. Update store status
4. Emit event: `STORE_STATUS_UPDATED`
5. Return response:
   - **200 OK**

---

# ADMIN

---

## 19. Add New Store  
**POST** `/api/admin/stores`  
**Responsibility:** Register a new store in the system.

### Business Logic
1. Authenticate admin
2. Validate store details
3. Create store with status `INACTIVE`
4. Emit event: `STORE_CREATED`
5. Return response:
   - **201 Created**

---

## 20. Manage Stores  
**PATCH** `/api/admin/stores/:storeId`  
**Responsibility:** Update store metadata or status.

### Business Logic
1. Authenticate admin
2. Fetch store
3. Apply allowed updates
4. Emit event: `STORE_UPDATED`
5. Return response:
   - **200 OK**

---

## 21. Add New Category  
**POST** `/api/admin/categories`  
**Responsibility:** Create product categories.

### Business Logic
1. Authenticate admin
2. Validate category name uniqueness
3. Create category
4. Emit event: `CATEGORY_CREATED`
5. Return response:
   - **201 Created**

---

## 22. Add New Product  
**POST** `/api/admin/products`  
**Responsibility:** Add new products to catalog.

### Business Logic
1. Authenticate admin
2. Validate product details
3. Link product to category
4. Create product
5. Emit event: `PRODUCT_CREATED`
6. Return response:
   - **201 Created**

---

## 23. Track Inventory  
**GET** `/api/admin/inventory`  
**Responsibility:** View inventory across stores.

### Business Logic
1. Authenticate admin
2. Fetch inventory records
3. Apply filters (store, product, low stock)
4. Return response:
   - **200 OK**

---

## 24. Track Riders  
**GET** `/api/admin/riders`  
**Responsibility:** Monitor delivery partner status and location.

### Business Logic
1. Authenticate admin
2. Fetch riders with:
   - availability
   - last known location
3. Return response:
   - **200 OK**

---

## 25. View Orders  
**GET** `/api/admin/orders`  
**Responsibility:** View all system orders.

### Business Logic
1. Authenticate admin
2. Fetch orders
3. Apply filters (status, store, date)
4. Return response:
   - **200 OK**

---

# DELIVERY PARTNER (RIDER)

---

## 26. Update Active / Inactive Status  
**PATCH** `/api/rider/status`  
**Responsibility:** Set rider account availability.

### Business Logic
1. Authenticate rider
2. Update status (`ACTIVE | INACTIVE`)
3. Emit event: `RIDER_STATUS_UPDATED`
4. Return response:
   - **200 OK**

---

## 27. Go Online / Offline  
**PATCH** `/api/rider/availability`  
**Responsibility:** Control whether rider can receive orders.

### Business Logic
1. Authenticate rider
2. Update availability (`ONLINE | OFFLINE`)
3. Emit event: `RIDER_AVAILABILITY_UPDATED`
4. Return response:
   - **200 OK**

---

## 28. Accept / Reject Order  
**POST** `/api/rider/orders/:orderId/respond`  
**Responsibility:** Accept or reject delivery assignment.

### Business Logic
1. Authenticate rider
2. Fetch assigned order
3. If accepted:
   - Update order status → `OUT_FOR_DELIVERY`
   - Emit event: `ORDER_PICKED_UP`
4. If rejected:
   - Unassign rider
   - Emit event: `RIDER_REJECTED_ORDER`
5. Return response:
   - **200 OK**

---

## 29. Deliver Order  
**POST** `/api/rider/orders/:orderId/deliver`  
**Responsibility:** Mark order as delivered.

### Business Logic
1. Authenticate rider
2. Validate order ownership
3. Update order status → `DELIVERED`
4. Capture delivery timestamp
5. Emit event: `ORDER_DELIVERED`
6. Return response:
   - **200 OK**

---

# ADDITIONAL REQUIRED FEATURES

---

## 30. Cancel Order (User / Store / Admin)
- Controlled cancellation rules
- Refund workflow
- Event: `ORDER_CANCELLED`

## 31. Low Inventory Alerts
- Triggered when stock < threshold
- Notification to store & admin

## 32. Rider Assignment Engine
- Auto-assign nearest available rider
- Event-driven matching

## 33. Audit Logs (Admin-Level)
- Immutable logs for:
  - Order changes
  - Status overrides
  - Inventory changes

---

# GLOBAL RULES

## Authentication
- All protected APIs require a valid access token
- Access token must include `userId`, `role`, `sessionId`

## Authorization
- USER: profile, cart, orders, addresses
- STORE: store orders, inventory, store status
- RIDER: assigned deliveries only
- ADMIN: full system access

Requests violating role boundaries return **403 Forbidden**.

## Idempotency
- Order creation and payment APIs must support idempotency keys
- Duplicate requests with same key must not create duplicate records


## ORDER STATE MACHINE

PLACED
→ ACCEPTED_BY_STORE
→ PREPARING
→ READY_FOR_PICKUP
→ OUT_FOR_DELIVERY
→ DELIVERED

Failure / exit states:
- CANCELLED
- PAYMENT_FAILED


## CART MANAGEMENT

### View Cart
**GET** `/api/cart`
- Fetch active cart for user
- Return cart items and totals

### Update Cart Item
**PUT** `/api/cart/item/:itemId`
- Update quantity
- Recalculate totals

### Remove Cart Item
**DELETE** `/api/cart/item/:itemId`
- Remove item from cart
- Recalculate totals

### Clear Cart
**DELETE** `/api/cart`
- Remove all items


## USER ORDERS

### View Order History
**GET** `/api/user/orders`
- Fetch user orders
- Apply pagination

### View Order Details
**GET** `/api/user/orders/:orderId`
- Validate ownership
- Return order details

### Cancel Order
**POST** `/api/user/orders/:orderId/cancel`
- Validate cancellable state
- Trigger refund if paid
- Emit event: ORDER_CANCELLED


## NOTIFICATIONS

### Get Notifications
**GET** `/api/notifications`
- Fetch user notifications
- Paginated

### Mark Notification as Read
**PATCH** `/api/notifications/:id/read`
- Mark notification as read


# AUTHENTICATION & ROLE-BASED AUTHORIZATION MIDDLEWARE (v1)

This document defines **authentication middleware** and **role-based authorization middleware**.  
All protected APIs **must** use these middleware layers. Any deviation is considered a **security vulnerability**.

---

## AUTHENTICATION MIDDLEWARE

---

## `authenticateRequest`

### Responsibility
Validate the access token, verify the session, and attach authenticated context to the request.

---

### Input
- HTTP Header  
  `Authorization: Bearer <access_token>`

---

### Middleware Logic

1. Extract access token from the `Authorization` header  
   → If missing, return **401 Unauthorized**

2. Verify JWT signature and expiration  
   → If invalid or expired, return **401 Unauthorized**

3. Decode JWT payload and extract:
   - `sub` → userId
   - `sessionId`
   - `role`

4. Fetch session from session store using `sessionId`
   - If session does not exist, is revoked, or expired  
     → return **401 Unauthorized**

5. Attach authenticated context to the request object:
```ts
req.auth = {
  userId,
  role,
  sessionId
};
```

# ROLE-BASED AUTHORIZATION MIDDLEWARE (v1)

This document defines the **role-based authorization middleware** used to restrict access to APIs based on the authenticated user's role.  
All protected routes **must** enforce these rules. Any violation is a security defect.

---

## `authorizeRoles(allowedRoles[])`

### Responsibility
Ensure that only users with permitted roles can access a given API endpoint.

---

### Preconditions
- The request must already be authenticated using `authenticateRequest`
- The authentication middleware must attach an `auth` object to the request

Example authenticated context:
```ts
req.auth = {
  userId: "uuid",
  role: "USER | STORE | ADMIN | RIDER",
  sessionId: "uuid"
};
```