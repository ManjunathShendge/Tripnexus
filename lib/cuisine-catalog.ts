export type CuisineEntry = {
  name: string;
  signatureDishes: string[];
};

export type CuisineRegion = {
  region: string;
  cuisines: CuisineEntry[];
};

export type StarterMenuItem = {
  name: string;
  description: string;
  category: string;
  price: number;
  isVeg: boolean;
  spicyLevel: number;
};

export const CUISINE_LIBRARY: CuisineRegion[] = [
  {
    region: "North India",
    cuisines: [
      { name: "Punjabi", signatureDishes: ["Butter Chicken", "Aloo Paratha"] },
      { name: "Kashmiri", signatureDishes: ["Rogan Josh", "Kashmiri Pulao"] },
      { name: "Himachali", signatureDishes: ["Dham Meal", "Madra"] },
      { name: "Uttarakhand", signatureDishes: ["Kafuli", "Jhangora Kheer"] },
      { name: "Haryanvi", signatureDishes: ["Bajra Khichdi", "Kadhi Pakora"] },
      { name: "Delhi Street", signatureDishes: ["Chole Bhature", "Aloo Tikki Chaat"] },
      { name: "Mughlai", signatureDishes: ["Chicken Korma", "Seekh Kebab"] },
      { name: "Awadhi", signatureDishes: ["Galouti Kebab", "Awadhi Biryani"] },
    ],
  },
  {
    region: "West India",
    cuisines: [
      { name: "Gujarati", signatureDishes: ["Khandvi", "Undhiyu"] },
      { name: "Rajasthani", signatureDishes: ["Dal Baati Churma", "Gatte ki Sabzi"] },
      { name: "Maharashtrian", signatureDishes: ["Vada Pav", "Misal Pav"] },
      { name: "Goan", signatureDishes: ["Goan Fish Curry", "Prawn Balchao"] },
      { name: "Parsi", signatureDishes: ["Dhansak", "Patra ni Machhi"] },
      { name: "Sindhi", signatureDishes: ["Sindhi Kadhi", "Sai Bhaji"] },
    ],
  },
  {
    region: "South India",
    cuisines: [
      { name: "Tamil", signatureDishes: ["Masala Dosa", "Sambar Rice"] },
      { name: "Kerala", signatureDishes: ["Appam with Stew", "Kerala Fish Fry"] },
      { name: "Karnataka", signatureDishes: ["Bisi Bele Bath", "Mysore Pak"] },
      { name: "Andhra", signatureDishes: ["Andhra Chicken Curry", "Gongura Pachadi"] },
      { name: "Telangana", signatureDishes: ["Hyderabadi Biryani", "Mirchi ka Salan"] },
      { name: "Chettinad", signatureDishes: ["Chettinad Chicken", "Pepper Prawn"] },
      { name: "Udupi", signatureDishes: ["Udupi Sambar", "Neer Dosa"] },
      { name: "Hyderabadi", signatureDishes: ["Haleem", "Dum Biryani"] },
    ],
  },
  {
    region: "East India",
    cuisines: [
      { name: "Bengali", signatureDishes: ["Shorshe Ilish", "Chingri Malai Curry"] },
      { name: "Odia", signatureDishes: ["Dalma", "Chhena Poda"] },
      { name: "Bihari", signatureDishes: ["Litti Chokha", "Sattu Paratha"] },
      { name: "Jharkhandi", signatureDishes: ["Dhuska", "Rugra"] },
    ],
  },
  {
    region: "Northeast India",
    cuisines: [
      { name: "Assamese", signatureDishes: ["Masor Tenga", "Khar"] },
      { name: "Naga", signatureDishes: ["Smoked Pork", "Bamboo Shoot Curry"] },
      { name: "Manipuri", signatureDishes: ["Eromba", "Kangshoi"] },
      { name: "Mizo", signatureDishes: ["Bai", "Sawhchiar"] },
      { name: "Arunachali", signatureDishes: ["Thukpa", "Zan"] },
      { name: "Meghalayan", signatureDishes: ["Jadoh", "Dohneiiong"] },
      { name: "Sikkimese", signatureDishes: ["Momos", "Thenthuk"] },
      { name: "Tripuri", signatureDishes: ["Mui Borok", "Wahan Mosdeng"] },
    ],
  },
  {
    region: "Central India",
    cuisines: [
      { name: "Madhya Pradesh", signatureDishes: ["Poha", "Bhutte ka Kees"] },
      { name: "Chhattisgarhi", signatureDishes: ["Faraa", "Chila"] },
    ],
  },
  {
    region: "Community and Fusion",
    cuisines: [
      { name: "Bohri", signatureDishes: ["Bohri Biryani", "Mutton Samosa"] },
      { name: "Anglo-Indian", signatureDishes: ["Railway Mutton Curry", "Deviled Chops"] },
      { name: "Street Food", signatureDishes: ["Pani Puri", "Pav Bhaji"] },
      { name: "North Indian Thali", signatureDishes: ["Veg Thali", "Mini Thali"] },
    ],
  },
  {
    region: "Global",
    cuisines: [
      { name: "Italian", signatureDishes: ["Margherita Pizza", "Arrabbiata Pasta"] },
      { name: "Japanese", signatureDishes: ["Chicken Katsu Bowl", "Veg Ramen"] },
      { name: "Mexican", signatureDishes: ["Bean Burrito", "Chicken Tacos"] },
      { name: "Thai", signatureDishes: ["Green Curry", "Pad Thai"] },
      { name: "Chinese", signatureDishes: ["Hakka Noodles", "Chilli Paneer"] },
      { name: "Mediterranean", signatureDishes: ["Falafel Bowl", "Grilled Chicken Pita"] },
      { name: "American", signatureDishes: ["Cheese Burger", "Loaded Fries"] },
    ],
  },
];

function guessCategory(dishName: string): string {
  const name = dishName.toLowerCase();
  if (name.includes("biryani") || name.includes("pulao") || name.includes("rice")) return "Rice";
  if (name.includes("pizza")) return "Pizza";
  if (name.includes("pasta") || name.includes("ramen") || name.includes("noodle") || name.includes("thukpa")) return "Noodles & Pasta";
  if (name.includes("kebab") || name.includes("chicken") || name.includes("pork") || name.includes("fish") || name.includes("prawn")) return "Main Course";
  if (name.includes("chaat") || name.includes("pav") || name.includes("momo") || name.includes("samosa")) return "Snacks";
  if (name.includes("kheer") || name.includes("pak") || name.includes("poda")) return "Dessert";
  return "Specials";
}

function guessIsVeg(dishName: string): boolean {
  const name = dishName.toLowerCase();
  const nonVegKeywords = ["chicken", "mutton", "fish", "pork", "prawn", "ilish", "machhi"];
  return !nonVegKeywords.some((keyword) => name.includes(keyword));
}

function guessSpicyLevel(cuisineName: string): number {
  const name = cuisineName.toLowerCase();
  if (name.includes("naga") || name.includes("andhra") || name.includes("telangana") || name.includes("chettinad")) return 4;
  if (name.includes("mughlai") || name.includes("goan") || name.includes("hyderabadi")) return 3;
  return 2;
}

export function buildStarterMenuFromCuisines(selectedCuisines: string[]): StarterMenuItem[] {
  const selectedSet = new Set(selectedCuisines.map((cuisine) => cuisine.toLowerCase().trim()));
  const dishMap = new Map<string, StarterMenuItem>();

  for (const region of CUISINE_LIBRARY) {
    for (const cuisine of region.cuisines) {
      if (!selectedSet.has(cuisine.name.toLowerCase())) continue;

      for (const dish of cuisine.signatureDishes.slice(0, 2)) {
        const key = dish.toLowerCase();
        if (dishMap.has(key)) continue;

        const isVeg = guessIsVeg(dish);
        const basePrice = isVeg ? 7.9 : 10.9;
        const spicyLevel = guessSpicyLevel(cuisine.name);

        dishMap.set(key, {
          name: dish,
          description: `Popular ${cuisine.name} preparation.`,
          category: guessCategory(dish),
          price: Number((basePrice + Math.random() * 5).toFixed(2)),
          isVeg,
          spicyLevel,
        });
      }
    }
  }

  return Array.from(dishMap.values()).slice(0, 24);
}
