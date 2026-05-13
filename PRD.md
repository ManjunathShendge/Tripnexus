# Product Requirements Document (PRD)

## Project Overview
This is a multi-tenant food and travel marketplace built with Next.js and Supabase/Postgres.
It supports:
- customer ordering from restaurants
- restaurant/vendor management
- order checkout and delivery tracking
- tourism services including stays, transport, guides, and trip planning
- authentication via Supabase Auth
- deployment on Netlify

---

## Goals
1. Provide a marketplace for food ordering and travel services.
2. Allow vendors to manage restaurants, accommodations, transport, and guided experiences.
3. Support customer order flow with carts, payments, delivery tracking, and reviews.
4. Enable trip planning with saved restaurants, tourist places, transport and accommodation options.

---

## Key Functional Requirements

### Customer-facing
- Browse restaurants, nearby listings, stays, transport, and tourist places.
- Add menu items to cart and place orders.
- Select payment method and track payment status.
- Track delivery status and view delivery partner details.
- Leave reviews for orders/restaurants.
- Save trip plans and itinerary items.

### Vendor-facing
- Create and manage vendor profiles and business types.
- Manage restaurants, menu items, transport options, accommodations, and guide services.
- Manage vendor staff and roles using `VendorUser`.

### Authentication & Access
- Use Supabase Auth for login/signup.
- Support user roles: `CUSTOMER`, `RESTAURANT_OWNER`, `DELIVERY_PARTNER`, `ADMIN`.
- Link application users with Supabase auth records via `User.authUserId`.

---

## Database Architecture

### Platform and Access
- Database: Supabase Postgres
- ORM: Prisma
- Runtime DB URL: `DATABASE_URL`
- Schema operations DB URL: `DIRECT_URL`
- Deployment flow: `prisma generate && prisma db push && next build`

### Core Data Models

#### `User`
- Primary entity for application users.
- Fields: `id`, `authUserId`, `email`, `name`, `phone`, `password`, `role`, `image`, timestamps.
- Relations:
  - `restaurants` owned by user
  - `orders`
  - `reviews`
  - `addresses`
  - `cartItems`
  - `deliveryOrders`
  - `vendorMemberships`
  - `tripPlans`
  - `accommodationBookingRequests`

#### `Vendor`
- Business entity with category and contact details.
- Fields: `id`, `name`, `slug`, `businessType`, `tagline`, `supportPhone`, `supportEmail`, `isActive`, timestamps.
- Relations:
  - `restaurants`
  - `members`
  - `touristPlaces`
  - `transportOptions`
  - `accommodations`
  - `guideServices`

#### `VendorUser`
- Join table linking `User` and `Vendor`.
- Fields: `vendorId`, `userId`, `role`.
- Unique constraint: `[vendorId, userId]`.

#### `Restaurant`
- Restaurant catalog and merchant listing.
- Fields: `name`, `description`, `cuisineType` (JSON), address, geo coordinates, `isOpen`, `minOrder`, `deliveryFee`, `estimatedTime`, owner/vendor links.
- Relations:
  - `owner` (`User`)
  - `vendor`
  - `menuItems`
  - `orders`
  - `reviews`
  - `tripItems`

#### `MenuItem`
- Menu items sold by restaurants.
- Fields: `name`, `price`, `category`, `isAvailable`, `isVeg`, `spicyLevel`, `restaurantId`.
- Relations:
  - `restaurant`
  - `orderItems`
  - `cartItems`

#### `Order` & `OrderItem`
- `Order` captures checkout and delivery details.
  - Fields: `orderNumber`, `userId`, `restaurantId`, `totalAmount`, `deliveryFee`, `tax`, `grandTotal`, `status`, `paymentStatus`, `paymentMethod`, `deliveryAddress`, geo coordinates.
- `OrderItem` stores each ordered menu item.
  - Fields: `menuItemId`, `quantity`, `price`, `totalPrice`, `specialInstructions`.

#### `CartItem`
- Saved shopping cart items per user.
- Unique per `(userId, menuItemId)`.

#### `Payment`
- Payment record for each order.
- One-to-one with `Order` via unique `orderId`.
- Fields: `amount`, `stripePaymentId`, `status`.

#### `Delivery`
- Delivery tracking per order.
- One-to-one with `Order`.
- Fields: `deliveryPartnerId`, `status`, `pickupTime`, `deliveredTime`, `currentLatitude`, `currentLongitude`, `trackingUrl`.

#### `Address`
- User saved addresses with default address support.

#### `Review`
- One review per order for restaurant feedback.
- Unique `orderId`.
- Fields: `rating`, `comment`.

---

## Travel & Trip Models

#### `TouristPlace`
- Attraction listings with category, tags, geo location, and vendor association.

#### `TransportOption`
- Travel services and transport operators with type, service area, pricing, and vendor association.

#### `Accommodation`
- Stays with amenities, pricing, vendor relationship, and availability.

#### `AccommodationBookingRequest`
- Booking inquiry workflow for accommodations.
- Fields: `guestName`, `guestEmail`, `checkInDate`, `checkOutDate`, `status`.

#### `GuideService`
- Tour guide offerings with languages, specialties, rates, and vendor links.

#### `TripPlan`
- User trip itineraries.
- Fields: `title`, `destinationCity`, `startDate`, `endDate`, `isDefault`.

#### `TripItem`
- Itinerary line items referencing restaurants, tourist places, transport, or bookings.
- Fields: `bookingStatus`, `bookedAt`, `dayNumber`, `timeSlot`, `note`, `sortOrder`.

---

## DB Constraints and Indexing
- `String @id @default(cuid())` is used for primary keys.
- Unique fields:
  - `User.email`, `User.phone`
  - `Restaurant.slug`, `Vendor.slug`
  - `Order.orderNumber`
  - `Payment.orderId`, `Delivery.orderId`, `Review.orderId`
  - `CartItem` composite `[userId, menuItemId]`
  - unique slugs across travel models
- Indexes exist for common query fields:
  - `Restaurant.vendorId`, `Restaurant.state`
  - `TouristPlace.category`, `city`, `state`, `vendorId`
  - `TransportOption.type`, `city`, `state`, `vendorId`
  - `Accommodation.type`, `city`, `state`, `vendorId`
  - `AccommodationBookingRequest.status`, `userId`
  - `TripPlan.userId`

---

## Technical Notes
- `lib/prisma.ts` creates a Prisma client using `@prisma/adapter-pg`.
- `DATABASE_URL` must be configured for runtime.
- `DIRECT_URL` is used for schema operations and Prisma push.
- Netlify build runs `prisma generate && prisma db push && next build`.

## Deployment & Environment
- Deployment target: Netlify.
- Database host: Supabase Postgres.
- Authentication: Supabase Auth.
- Payment integration: Razorpay and Stripe.
- Required environment variables:
  - `DATABASE_URL`
  - `DIRECT_URL`
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
  - `RAZORPAY_KEY_ID`
  - `RAZORPAY_KEY_SECRET`

---

## Summary
This product is a combined food ordering and travel marketplace with a Postgres-backed Prisma schema. The database is central to the app, handling user accounts, multi-vendor support, restaurant/menu/order/payment/delivery flow, plus travel booking and trip planning.
