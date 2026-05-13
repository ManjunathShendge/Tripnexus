-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_TripItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tripPlanId" TEXT NOT NULL,
    "restaurantId" TEXT,
    "touristPlaceId" TEXT,
    "transportOptionId" TEXT,
    "bookingStatus" TEXT NOT NULL DEFAULT 'SAVED',
    "bookedAt" DATETIME,
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
INSERT INTO "new_TripItem" ("createdAt", "dayNumber", "id", "note", "restaurantId", "sortOrder", "timeSlot", "touristPlaceId", "transportOptionId", "tripPlanId") SELECT "createdAt", "dayNumber", "id", "note", "restaurantId", "sortOrder", "timeSlot", "touristPlaceId", "transportOptionId", "tripPlanId" FROM "TripItem";
DROP TABLE "TripItem";
ALTER TABLE "new_TripItem" RENAME TO "TripItem";
CREATE INDEX "TripItem_tripPlanId_idx" ON "TripItem"("tripPlanId");
CREATE INDEX "TripItem_restaurantId_idx" ON "TripItem"("restaurantId");
CREATE INDEX "TripItem_touristPlaceId_idx" ON "TripItem"("touristPlaceId");
CREATE INDEX "TripItem_transportOptionId_idx" ON "TripItem"("transportOptionId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
