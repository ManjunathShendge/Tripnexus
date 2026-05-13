const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const bcrypt = require("bcryptjs");

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is required for Prisma seeding.");
}

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function upsertUser({ email, name, role, phone }) {
  const hashedPassword = await bcrypt.hash("Password@123", 10);
  const isSeedUser = email.endsWith("@foodapp.local");

  return prisma.user.upsert({
    where: { email },
    update: {
      name,
      role,
      phone,
      password: hashedPassword,
      isSeedUser,
    },
    create: {
      email,
      name,
      role,
      phone,
      password: hashedPassword,
      isSeedUser,
    },
  });
}

async function upsertRestaurantWithData({
  ownerId,
  vendorId,
  customerId,
  orderNumber,
  restaurant,
  menuItems,
  rating,
  reviewComment,
}) {
  const existing = await prisma.restaurant.findFirst({
    where: { email: restaurant.email },
    select: { id: true },
  });

  const upsertedRestaurant = existing
    ? await prisma.restaurant.update({
        where: { id: existing.id },
        data: {
          ...restaurant,
          ownerId,
          vendorId,
        },
      })
    : await prisma.restaurant.create({
        data: {
          ...restaurant,
          ownerId,
          vendorId,
        },
      });

  for (const item of menuItems) {
    const existingMenuItem = await prisma.menuItem.findFirst({
      where: {
        restaurantId: upsertedRestaurant.id,
        name: item.name,
      },
      select: { id: true },
    });

    if (existingMenuItem) {
      await prisma.menuItem.update({
        where: { id: existingMenuItem.id },
        data: item,
      });
    } else {
      await prisma.menuItem.create({
        data: {
          ...item,
          restaurantId: upsertedRestaurant.id,
        },
      });
    }
  }

  const order = await prisma.order.upsert({
    where: { orderNumber },
    update: {
      userId: customerId,
      restaurantId: upsertedRestaurant.id,
      totalAmount: 28.5,
      deliveryFee: restaurant.deliveryFee,
      tax: 2.5,
      grandTotal: 31,
      paymentMethod: "UPI",
      deliveryAddress: "221B Baker Street, Bengaluru",
      status: "DELIVERED",
      paymentStatus: "SUCCESS",
    },
    create: {
      orderNumber,
      userId: customerId,
      restaurantId: upsertedRestaurant.id,
      totalAmount: 28.5,
      deliveryFee: restaurant.deliveryFee,
      tax: 2.5,
      grandTotal: 31,
      paymentMethod: "UPI",
      deliveryAddress: "221B Baker Street, Bengaluru",
      status: "DELIVERED",
      paymentStatus: "SUCCESS",
    },
  });

  await prisma.review.upsert({
    where: { orderId: order.id },
    update: {
      userId: customerId,
      restaurantId: upsertedRestaurant.id,
      rating,
      comment: reviewComment,
    },
    create: {
      orderId: order.id,
      userId: customerId,
      restaurantId: upsertedRestaurant.id,
      rating,
      comment: reviewComment,
    },
  });
}

async function upsertTouristPlace(data) {
  return prisma.touristPlace.upsert({
    where: { slug: data.slug },
    update: data,
    create: data,
  });
}

async function upsertTransportOption(data) {
  return prisma.transportOption.upsert({
    where: { slug: data.slug },
    update: data,
    create: data,
  });
}

async function upsertAccommodation(data) {
  return prisma.accommodation.upsert({
    where: { slug: data.slug },
    update: data,
    create: data,
  });
}

async function upsertGuideService(data) {
  return prisma.guideService.upsert({
    where: { slug: data.slug },
    update: data,
    create: data,
  });
}

async function main() {
  const owner = await upsertUser({
    email: "owner@foodapp.local",
    name: "Aarav Owner",
    role: "RESTAURANT_OWNER",
    phone: "+911111111111",
  });

  const customer = await upsertUser({
    email: "customer@foodapp.local",
    name: "Maya Customer",
    role: "CUSTOMER",
    phone: "+922222222222",
  });

  const vendorNorth = await prisma.vendor.upsert({
    where: { slug: "north-city-foods" },
    update: {
      name: "North City Foods",
      businessType: "FOOD_AND_DINING",
      tagline: "Trusted city kitchens for visiting travelers.",
      isActive: true,
    },
    create: {
      name: "North City Foods",
      slug: "north-city-foods",
      businessType: "FOOD_AND_DINING",
      tagline: "Trusted city kitchens for visiting travelers.",
      isActive: true,
    },
  });

  const vendorUrban = await prisma.vendor.upsert({
    where: { slug: "urban-kitchens" },
    update: {
      name: "Urban Kitchens",
      businessType: "FOOD_AND_DINING",
      tagline: "Quick dining picks across major tourist zones.",
      isActive: true,
    },
    create: {
      name: "Urban Kitchens",
      slug: "urban-kitchens",
      businessType: "FOOD_AND_DINING",
      tagline: "Quick dining picks across major tourist zones.",
      isActive: true,
    },
  });

  const vendorTransit = await prisma.vendor.upsert({
    where: { slug: "cityhop-mobility" },
    update: {
      name: "CityHop Mobility",
      businessType: "TRANSPORT_OPERATOR",
      tagline: "Airport pickups and local cab support for travelers.",
      supportPhone: "+91-90000-30001",
      isActive: true,
    },
    create: {
      name: "CityHop Mobility",
      slug: "cityhop-mobility",
      businessType: "TRANSPORT_OPERATOR",
      tagline: "Airport pickups and local cab support for travelers.",
      supportPhone: "+91-90000-30001",
      isActive: true,
    },
  });

  const vendorStay = await prisma.vendor.upsert({
    where: { slug: "harbor-view-stays" },
    update: {
      name: "Harbor View Stays",
      businessType: "HOSPITALITY_STAY",
      tagline: "Comfortable stays for city explorers and short breaks.",
      supportPhone: "+91-90000-40001",
      supportEmail: "stay@foodapp.local",
      isActive: true,
    },
    create: {
      name: "Harbor View Stays",
      slug: "harbor-view-stays",
      businessType: "HOSPITALITY_STAY",
      tagline: "Comfortable stays for city explorers and short breaks.",
      supportPhone: "+91-90000-40001",
      supportEmail: "stay@foodapp.local",
      isActive: true,
    },
  });

  const vendorGuide = await prisma.vendor.upsert({
    where: { slug: "heritage-trails-guide" },
    update: {
      name: "Heritage Trails Guide",
      businessType: "TOUR_GUIDE",
      tagline: "Story-led walking tours with multilingual local guides.",
      supportPhone: "+91-90000-50001",
      supportEmail: "guide@foodapp.local",
      isActive: true,
    },
    create: {
      name: "Heritage Trails Guide",
      slug: "heritage-trails-guide",
      businessType: "TOUR_GUIDE",
      tagline: "Story-led walking tours with multilingual local guides.",
      supportPhone: "+91-90000-50001",
      supportEmail: "guide@foodapp.local",
      isActive: true,
    },
  });

  await prisma.vendorUser.upsert({
    where: {
      vendorId_userId: {
        vendorId: vendorNorth.id,
        userId: owner.id,
      },
    },
    update: {
      role: "OWNER",
    },
    create: {
      vendorId: vendorNorth.id,
      userId: owner.id,
      role: "OWNER",
    },
  });

  await prisma.vendorUser.upsert({
    where: {
      vendorId_userId: {
        vendorId: vendorTransit.id,
        userId: owner.id,
      },
    },
    update: { role: "OWNER" },
    create: {
      vendorId: vendorTransit.id,
      userId: owner.id,
      role: "OWNER",
    },
  });

  await prisma.vendorUser.upsert({
    where: {
      vendorId_userId: {
        vendorId: vendorStay.id,
        userId: owner.id,
      },
    },
    update: { role: "OWNER" },
    create: {
      vendorId: vendorStay.id,
      userId: owner.id,
      role: "OWNER",
    },
  });

  await prisma.vendorUser.upsert({
    where: {
      vendorId_userId: {
        vendorId: vendorGuide.id,
        userId: owner.id,
      },
    },
    update: { role: "OWNER" },
    create: {
      vendorId: vendorGuide.id,
      userId: owner.id,
      role: "OWNER",
    },
  });

  await prisma.vendorUser.upsert({
    where: {
      vendorId_userId: {
        vendorId: vendorUrban.id,
        userId: owner.id,
      },
    },
    update: {
      role: "MANAGER",
    },
    create: {
      vendorId: vendorUrban.id,
      userId: owner.id,
      role: "MANAGER",
    },
  });

  const restaurants = [
    {
      vendorSlug: "north-city-foods",
      orderNumber: "SAMPLE-ORDER-1001",
      restaurant: {
        name: "Spice Route Kitchen",
        description: "North Indian curries, kebabs, and fresh naan.",
        cuisineType: ["Indian", "North Indian", "Mughlai"],
        address: "MG Road, Bengaluru",
        city: "Bengaluru",
        state: "Karnataka",
        latitude: 12.9751,
        longitude: 77.6066,
        phone: "+91-90000-10001",
        email: "spiceroute@foodapp.local",
        image: null,
        isActive: true,
        isOpen: true,
        minOrder: 149,
        deliveryFee: 29,
        estimatedTime: "30-35 mins",
      },
      menuItems: [
        {
          name: "Butter Chicken",
          description: "Creamy tomato gravy with grilled chicken.",
          price: 14.5,
          category: "Main Course",
          image: null,
          isAvailable: true,
          isVeg: false,
          spicyLevel: 2,
        },
        {
          name: "Garlic Naan",
          description: "Soft naan bread with garlic butter.",
          price: 2.8,
          category: "Breads",
          image: null,
          isAvailable: true,
          isVeg: true,
          spicyLevel: 0,
        },
      ],
      rating: 5,
      reviewComment: "Rich flavors and fast delivery.",
    },
    {
      vendorSlug: "north-city-foods",
      orderNumber: "SAMPLE-ORDER-1002",
      restaurant: {
        name: "Tokyo Bento Lab",
        description: "Fresh sushi bowls, ramen, and Japanese comfort food.",
        cuisineType: ["Japanese", "Asian"],
        address: "Indiranagar 100ft Road, Bengaluru",
        city: "Bengaluru",
        state: "Karnataka",
        latitude: 12.9719,
        longitude: 77.6412,
        phone: "+91-90000-10002",
        email: "tokyobento@foodapp.local",
        image: null,
        isActive: true,
        isOpen: true,
        minOrder: 199,
        deliveryFee: 39,
        estimatedTime: "25-30 mins",
      },
      menuItems: [
        {
          name: "Chicken Katsu Bowl",
          description: "Crispy chicken with sticky rice and slaw.",
          price: 12.9,
          category: "Bowls",
          image: null,
          isAvailable: true,
          isVeg: false,
          spicyLevel: 1,
        },
        {
          name: "Veggie Ramen",
          description: "Miso broth ramen with seasonal vegetables.",
          price: 10.5,
          category: "Ramen",
          image: null,
          isAvailable: true,
          isVeg: true,
          spicyLevel: 1,
        },
      ],
      rating: 4,
      reviewComment: "Great ramen broth and neat packaging.",
    },
    {
      vendorSlug: "urban-kitchens",
      orderNumber: "SAMPLE-ORDER-1003",
      restaurant: {
        name: "Pasta Republic",
        description: "Handmade pasta, pizzas, and Italian desserts.",
        cuisineType: ["Italian", "Continental"],
        address: "Bandra West, Mumbai",
        city: "Mumbai",
        state: "Maharashtra",
        latitude: 19.0596,
        longitude: 72.8295,
        phone: "+91-90000-10003",
        email: "pastarepublic@foodapp.local",
        image: null,
        isActive: true,
        isOpen: false,
        minOrder: 249,
        deliveryFee: 19,
        estimatedTime: "35-40 mins",
      },
      menuItems: [
        {
          name: "Arrabbiata Penne",
          description: "Penne tossed in spicy tomato garlic sauce.",
          price: 11.9,
          category: "Pasta",
          image: null,
          isAvailable: true,
          isVeg: true,
          spicyLevel: 3,
        },
        {
          name: "Margherita Pizza",
          description: "Classic mozzarella, basil, and tomato pizza.",
          price: 13.5,
          category: "Pizza",
          image: null,
          isAvailable: true,
          isVeg: true,
          spicyLevel: 0,
        },
      ],
      rating: 5,
      reviewComment: "Excellent pasta and very reasonable delivery fee.",
    },
    {
      vendorSlug: "urban-kitchens",
      orderNumber: "SAMPLE-ORDER-1004",
      restaurant: {
        name: "Green Bowl Co.",
        description: "Salads, grain bowls, smoothies, and healthy bites.",
        cuisineType: ["Healthy", "Salads", "Vegan Friendly"],
        address: "Khan Market, New Delhi",
        city: "New Delhi",
        state: "Delhi",
        latitude: 28.599,
        longitude: 77.2262,
        phone: "+91-90000-10004",
        email: "greenbowl@foodapp.local",
        image: null,
        isActive: true,
        isOpen: true,
        minOrder: 99,
        deliveryFee: 9,
        estimatedTime: "20-25 mins",
      },
      menuItems: [
        {
          name: "Protein Power Bowl",
          description: "Quinoa, chickpeas, avocado, greens, lemon dressing.",
          price: 9.9,
          category: "Bowls",
          image: null,
          isAvailable: true,
          isVeg: true,
          spicyLevel: 0,
        },
        {
          name: "Tropical Smoothie",
          description: "Mango, pineapple, banana and coconut water.",
          price: 4.5,
          category: "Beverages",
          image: null,
          isAvailable: true,
          isVeg: true,
          spicyLevel: 0,
        },
      ],
      rating: 4,
      reviewComment: "Fresh ingredients and super quick delivery.",
    },
  ];

  for (const item of restaurants) {
    const vendorId =
      item.vendorSlug === "north-city-foods" ? vendorNorth.id : vendorUrban.id;

    await upsertRestaurantWithData({
      ownerId: owner.id,
      vendorId,
      customerId: customer.id,
      ...item,
    });
  }

  const touristPlaces = [
    {
      name: "Cubbon Park",
      slug: "cubbon-park-bengaluru",
      description: "A large green escape in the heart of Bengaluru, great for morning walks and relaxed sightseeing.",
      category: "PARK",
      address: "Cubbon Park, Bengaluru",
      city: "Bengaluru",
      state: "Karnataka",
      latitude: 12.9763,
      longitude: 77.5929,
      phone: null,
      website: null,
      image: null,
      isActive: true,
      isFeatured: true,
      rating: 4.6,
      priceLabel: "Free",
      estimatedVisitTime: "1-2 hours",
      familyFriendly: true,
      tags: ["nature", "walking", "family", "photography"],
      vendorId: null,
    },
    {
      name: "Bangalore Palace",
      slug: "bangalore-palace",
      description: "A heritage landmark known for Tudor-style architecture and royal interiors.",
      category: "LANDMARK",
      address: "Vasanth Nagar, Bengaluru",
      city: "Bengaluru",
      state: "Karnataka",
      latitude: 12.9987,
      longitude: 77.592,
      phone: "+91-90000-20001",
      website: null,
      image: null,
      isActive: true,
      isFeatured: true,
      rating: 4.4,
      priceLabel: "Paid Entry",
      estimatedVisitTime: "1-2 hours",
      familyFriendly: true,
      tags: ["heritage", "history", "architecture"],
      vendorId: vendorNorth.id,
    },
    {
      name: "Gateway of India",
      slug: "gateway-of-india-mumbai",
      description: "Iconic waterfront monument and a major entry point for harbor-side exploration.",
      category: "LANDMARK",
      address: "Apollo Bandar, Colaba, Mumbai",
      city: "Mumbai",
      state: "Maharashtra",
      latitude: 18.922,
      longitude: 72.8347,
      phone: null,
      website: null,
      image: null,
      isActive: true,
      isFeatured: true,
      rating: 4.7,
      priceLabel: "Free",
      estimatedVisitTime: "45-90 mins",
      familyFriendly: true,
      tags: ["waterfront", "landmark", "photography"],
      vendorId: vendorUrban.id,
    },
    {
      name: "Prince of Wales Museum",
      slug: "prince-of-wales-museum-mumbai",
      description: "A major museum for art, archaeology, and curated cultural exhibits.",
      category: "MUSEUM",
      address: "Fort, Mumbai",
      city: "Mumbai",
      state: "Maharashtra",
      latitude: 18.9269,
      longitude: 72.8325,
      phone: "+91-90000-20002",
      website: null,
      image: null,
      isActive: true,
      isFeatured: false,
      rating: 4.5,
      priceLabel: "Paid Entry",
      estimatedVisitTime: "2-3 hours",
      familyFriendly: true,
      tags: ["museum", "history", "indoor"],
      vendorId: vendorUrban.id,
    },
    {
      name: "Khan Market Walk",
      slug: "khan-market-walk-delhi",
      description: "Boutique shopping, cafes, and a popular stop for visitors exploring central Delhi.",
      category: "SHOPPING",
      address: "Khan Market, New Delhi",
      city: "New Delhi",
      state: "Delhi",
      latitude: 28.6005,
      longitude: 77.2269,
      phone: null,
      website: null,
      image: null,
      isActive: true,
      isFeatured: false,
      rating: 4.3,
      priceLabel: "Free Entry",
      estimatedVisitTime: "1-3 hours",
      familyFriendly: true,
      tags: ["shopping", "cafes", "walkable"],
      vendorId: null,
    },
  ];

  for (const place of touristPlaces) {
    await upsertTouristPlace(place);
  }

  const transportOptions = [
    {
      name: "CityHop Private Cab",
      slug: "cityhop-private-cab-bengaluru",
      type: "PRIVATE_CAB",
      description: "Point-to-point city cab service for airport transfers and nearby sightseeing.",
      operatorName: "CityHop Mobility",
      serviceArea: "Bengaluru Central and Airport Route",
      address: "MG Road Service Point, Bengaluru",
      city: "Bengaluru",
      state: "Karnataka",
      latitude: 12.9754,
      longitude: 77.6058,
      phone: "+91-90000-30001",
      website: null,
      pricingNotes: "Airport transfer from Rs. 899, city ride from Rs. 249",
      hours: "24x7",
      isActive: true,
      isFeatured: true,
      vendorId: vendorNorth.id,
    },
    {
      name: "Metro Green Line Access",
      slug: "metro-green-line-bengaluru",
      type: "METRO",
      description: "Fast access to major city junctions with tourist-friendly station connectivity.",
      operatorName: "Namma Metro",
      serviceArea: "Bengaluru Metro Network",
      address: "MG Road Station, Bengaluru",
      city: "Bengaluru",
      state: "Karnataka",
      latitude: 12.9757,
      longitude: 77.6097,
      phone: null,
      website: null,
      pricingNotes: "Token fares vary by distance",
      hours: "5:00 AM - 11:00 PM",
      isActive: true,
      isFeatured: true,
      vendorId: null,
    },
    {
      name: "Harbor Link Ferry",
      slug: "harbor-link-ferry-mumbai",
      type: "FERRY",
      description: "Harbor-side ferry access for visitors heading to island and waterfront attractions.",
      operatorName: "Harbor Link",
      serviceArea: "South Mumbai Waterfront",
      address: "Gateway Jetty, Mumbai",
      city: "Mumbai",
      state: "Maharashtra",
      latitude: 18.9217,
      longitude: 72.8345,
      phone: "+91-90000-30002",
      website: null,
      pricingNotes: "Tourist ferry tickets from Rs. 120",
      hours: "8:00 AM - 8:00 PM",
      isActive: true,
      isFeatured: false,
      vendorId: vendorUrban.id,
    },
    {
      name: "Airport Express Transfer",
      slug: "airport-express-transfer-delhi",
      type: "AIRPORT_TRANSFER",
      description: "Scheduled airport transfer service for tourists arriving with luggage and fixed stop needs.",
      operatorName: "Capital Transit Connect",
      serviceArea: "Delhi Airport to Central Delhi",
      address: "IGI Airport Pickup Zone, New Delhi",
      city: "New Delhi",
      state: "Delhi",
      latitude: 28.5562,
      longitude: 77.1,
      phone: "+91-90000-30003",
      website: null,
      pricingNotes: "Shared transfer from Rs. 350, private transfer from Rs. 1200",
      hours: "24x7",
      isActive: true,
      isFeatured: true,
      vendorId: null,
    },
  ];

  for (const option of transportOptions) {
    await upsertTransportOption(option);
  }

  await upsertAccommodation({
    name: "Harbor View Lodge",
    slug: "harbor-view-lodge-mumbai",
    type: "LODGE",
    description: "Traveler-friendly lodge with quick access to South Mumbai landmarks and ferry points.",
    address: "Colaba Causeway, Mumbai",
    city: "Mumbai",
    state: "Maharashtra",
    latitude: 18.9211,
    longitude: 72.8319,
    phone: "+91-90000-40001",
    email: "stay@foodapp.local",
    website: null,
    pricePerNight: 52,
    amenities: ["Wifi", "Breakfast", "Airport pickup", "Family rooms"],
    roomCount: 18,
    checkInTime: "1:00 PM",
    checkOutTime: "11:00 AM",
    isActive: true,
    isFeatured: true,
    vendorId: vendorStay.id,
  });

  await upsertGuideService({
    name: "Old City Heritage Walks",
    slug: "old-city-heritage-walks-delhi",
    description: "Small-group storytelling walks focused on monuments, bazaars, and local food history.",
    city: "New Delhi",
    state: "Delhi",
    phone: "+91-90000-50001",
    email: "guide@foodapp.local",
    website: null,
    languages: ["English", "Hindi", "French"],
    specialties: ["Heritage walk", "Street food stories", "Photography stops"],
    yearsExperience: 7,
    hourlyRate: 18,
    fullDayRate: 95,
    isLicensed: true,
    isActive: true,
    isFeatured: true,
    vendorId: vendorGuide.id,
  });

  const restaurantCount = await prisma.restaurant.count();
  const menuItemCount = await prisma.menuItem.count();
  const reviewCount = await prisma.review.count();
  const vendorCount = await prisma.vendor.count();
  const membershipCount = await prisma.vendorUser.count();
  const touristPlaceCount = await prisma.touristPlace.count();
  const transportOptionCount = await prisma.transportOption.count();
  const accommodationCount = await prisma.accommodation.count();
  const guideServiceCount = await prisma.guideService.count();

  console.log("Seeding complete.");
  console.log(`Restaurants: ${restaurantCount}`);
  console.log(`Menu items: ${menuItemCount}`);
  console.log(`Reviews: ${reviewCount}`);
  console.log(`Vendors: ${vendorCount}`);
  console.log(`Vendor memberships: ${membershipCount}`);
  console.log(`Tourist places: ${touristPlaceCount}`);
  console.log(`Transport options: ${transportOptionCount}`);
  console.log(`Accommodations: ${accommodationCount}`);
  console.log(`Guide services: ${guideServiceCount}`);
  console.log("Sample login:");
  console.log("owner@foodapp.local / Password@123");
  console.log("customer@foodapp.local / Password@123");
}

main()
  .catch((error) => {
    console.error("Seeding failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
