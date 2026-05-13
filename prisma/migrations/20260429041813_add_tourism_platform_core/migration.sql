-- CreateTable
CREATE TABLE "TouristPlace" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "city" TEXT,
    "state" TEXT,
    "latitude" REAL NOT NULL,
    "longitude" REAL NOT NULL,
    "phone" TEXT,
    "website" TEXT,
    "image" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "rating" REAL,
    "priceLabel" TEXT,
    "estimatedVisitTime" TEXT,
    "familyFriendly" BOOLEAN NOT NULL DEFAULT false,
    "tags" JSONB NOT NULL,
    "vendorId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "TouristPlace_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TransportOption" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT,
    "operatorName" TEXT,
    "serviceArea" TEXT,
    "address" TEXT,
    "city" TEXT,
    "state" TEXT,
    "latitude" REAL,
    "longitude" REAL,
    "phone" TEXT,
    "website" TEXT,
    "pricingNotes" TEXT,
    "hours" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "vendorId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "TransportOption_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TripPlan" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "destinationCity" TEXT,
    "startDate" DATETIME,
    "endDate" DATETIME,
    "notes" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "TripPlan_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TripItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tripPlanId" TEXT NOT NULL,
    "restaurantId" TEXT,
    "touristPlaceId" TEXT,
    "transportOptionId" TEXT,
    "dayNumber" INTEGER,
    "timeSlot" TEXT,
    "note" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TripItem_tripPlanId_fkey" FOREIGN KEY ("tripPlanId") REFERENCES "TripPlan" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TripItem_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "Restaurant" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TripItem_touristPlaceId_fkey" FOREIGN KEY ("touristPlaceId") REFERENCES "TouristPlace" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TripItem_transportOptionId_fkey" FOREIGN KEY ("transportOptionId") REFERENCES "TransportOption" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "TouristPlace_slug_key" ON "TouristPlace"("slug");

-- CreateIndex
CREATE INDEX "TouristPlace_category_idx" ON "TouristPlace"("category");

-- CreateIndex
CREATE INDEX "TouristPlace_city_idx" ON "TouristPlace"("city");

-- CreateIndex
CREATE INDEX "TouristPlace_state_idx" ON "TouristPlace"("state");

-- CreateIndex
CREATE INDEX "TouristPlace_vendorId_idx" ON "TouristPlace"("vendorId");

-- CreateIndex
CREATE UNIQUE INDEX "TransportOption_slug_key" ON "TransportOption"("slug");

-- CreateIndex
CREATE INDEX "TransportOption_type_idx" ON "TransportOption"("type");

-- CreateIndex
CREATE INDEX "TransportOption_city_idx" ON "TransportOption"("city");

-- CreateIndex
CREATE INDEX "TransportOption_state_idx" ON "TransportOption"("state");

-- CreateIndex
CREATE INDEX "TransportOption_vendorId_idx" ON "TransportOption"("vendorId");

-- CreateIndex
CREATE INDEX "TripPlan_userId_idx" ON "TripPlan"("userId");

-- CreateIndex
CREATE INDEX "TripItem_tripPlanId_idx" ON "TripItem"("tripPlanId");

-- CreateIndex
CREATE INDEX "TripItem_restaurantId_idx" ON "TripItem"("restaurantId");

-- CreateIndex
CREATE INDEX "TripItem_touristPlaceId_idx" ON "TripItem"("touristPlaceId");

-- CreateIndex
CREATE INDEX "TripItem_transportOptionId_idx" ON "TripItem"("transportOptionId");
