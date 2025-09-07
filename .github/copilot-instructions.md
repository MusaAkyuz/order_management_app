This is next-js application which is using tailwind css for styling.
Application is simple order management system.
It has following features:

1. Creates orders with multiple products and their quantities.
2. Manages products inventory and prices pages. This information is stored with date.
3. Displays orders with total price and date.
4. Uses sqllite database to store data.
5. There is no need for authentication and authorization.
6. There are customers which can be individuals or companies.

# GitHub Copilot Instructions

Use tailwind css for styling.
Use next-js for frontend and backend.
Use sqllite for database.
Use prisma as ORM.
Use react-query for data fetching and caching.
Use react-hook-form for form handling and validation.
Use zod for schema validation.
Use navigation bar for navigating between pages.

# Style Rules

Input ve Select komponentleri small olsun ve placeholder ve value değerleri koyu gri olsun
Çok açık gri yapma

# Database Schema

## Customer Table

- id, name, email, phone, address, taxNumber
- isCompany (boolean) - distinguishes between individual/corporate customers
- isActive (soft delete), createdAt, updatedAt

## ProductType Table

- id, name, description
- Categories: "Adet ile Satılan" (sold by piece), "Kilo ile Satılan" (sold by weight)

## Product Table

- id, name, currentPrice, stock, description
- typeId (foreign key to ProductType)
- isActive, createdAt, updatedAt

## OrderStatus Table

- id, name, description, color
- Fixed statuses: "Beklemede" (yellow), "Teslim Edildi" (green), "İptal Edildi" (red)

## Order Table

- id, totalPrice, laborCost, deliveryFee, address, description
- customerId (foreign key), statusId (foreign key)
- isActive, createdAt, updatedAt

## OrderItem Table

- id, quantity, price
- orderId (foreign key), productId (foreign key)
- isActive

## Transaction Table

- id, action, description, details
- Optional foreign keys: customerId, orderId, productId
- Logs all system activities (order created, delivered, cancelled, etc.)
- createdAt
