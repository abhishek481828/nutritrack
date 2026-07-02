// ─── Nutrition knowledge base ──────────────────────────────────────
const FOOD_CALORIES = {
  apple:       52,   banana:      89,   orange:      47,   mango:       60,
  grapes:      69,   watermelon:  30,   strawberry:  32,   avocado:    160,
  egg:         155,  chicken:    165,   beef:        250,  salmon:     208,
  tuna:        144,  tofu:        76,   paneer:      265,  shrimp:      99,
  rice:        130,  bread:      265,   pasta:       131,  oats:       389,
  potato:       77,  broccoli:    55,   spinach:     23,   carrot:      41,
  tomato:       18,  cucumber:    16,   milk:         61,  yogurt:      59,
  cheese:      402,  butter:     717,   olive_oil:   884,  almonds:    579,
  peanuts:     567,  walnuts:    654,   dal:         116,  roti:       297,
  idli:         39,  dosa:       168,   upma:        178,  sambar:      44,
};

const FOOD_PROTEIN = {
  chicken: 31, egg: 13, salmon: 20, tuna: 26, beef: 26, tofu: 8, paneer: 18,
  lentils: 9,  almonds: 21, peanuts: 26, greek_yogurt: 10, milk: 3, cheese: 25,
  shrimp: 24, dal: 9, oats: 13, quinoa: 14,
};

// ─── Category detection helpers ─────────────────────────────────────
const detect = (msg, keywords) =>
  keywords.some((k) => msg.includes(k));

const extractFood = (msg) => {
  const words = msg.split(/\s+/);
  for (const word of words) {
    const cleaned = word.replace(/[^a-z_]/g, '');
    if (FOOD_CALORIES[cleaned]) return cleaned;
    // handle "olive oil" → "olive_oil"
    const compound = cleaned + '_' + words[words.indexOf(word) + 1];
    if (FOOD_CALORIES[compound]) return compound;
  }
  return null;
};

// ─── Category detectors ─────────────────────────────────────────────
const detectWeightLoss = (msg) =>
  detect(msg, ['lose weight', 'weight loss', 'slim', 'fat loss', 'lose fat', 'cut weight', 'diet', 'cutting']);

const detectMuscleGain = (msg) =>
  detect(msg, ['gain muscle', 'build muscle', 'muscle gain', 'bulk', 'bulking', 'strength', 'growth']);

const detectHealthyDiet = (msg) =>
  detect(msg, ['healthy', 'healthy diet', 'eating well', 'nutrition plan', 'diet plan', 'meal plan']);

const detectProteinIntake = (msg) =>
  detect(msg, ['protein', 'proteins', 'high-protein', 'high protein', 'amino acid']);

// ─── Response generator ─────────────────────────────────────────────
const generateReply = (message) => {
  const msg = message.toLowerCase().trim();

  // ── Greetings ────────────────────────────────────────────────────
  if (detect(msg, ['hello', 'hi', 'hey', 'howdy', 'greetings'])) {
    return `Hi there! 👋 I'm your nutrition assistant. Ask me about calories in foods, macros, weight loss tips, or what to eat for your goals!`;
  }

  // ── Thanks / Bye ─────────────────────────────────────────────────
  if (detect(msg, ['thank', 'thanks', 'bye', 'goodbye', 'great', 'perfect'])) {
    return `Glad I could help! 😊 Stay consistent with your nutrition goals. Feel free to ask anything anytime!`;
  }

  // ════════════════════════════════════════════════════════════════════
  // CATEGORY: WEIGHT LOSS 🏃
  // ════════════════════════════════════════════════════════════════════
  if (detectWeightLoss(msg)) {
    if (detect(msg, ['how', 'tips', 'advice', 'strategy', 'guide'])) {
      return `⚖️ **Weight loss strategy:**\n1. Create a **500 kcal deficit daily** → lose ~0.5kg/week\n2. Eat **high-protein** to keep muscle while losing fat\n3. Fill half your plate with **vegetables** (low calorie, high volume)\n4. Drink **2.5–3L water** daily — often thirst feels like hunger\n5. Avoid sugary drinks, ultra-processed foods, fried items\n6. Walk **8,000–10,000 steps/day** minimum\n7. Sleep **7–9 hours** — poor sleep increases hunger hormones\n\n💡 **Pro tip:** Use the Dashboard to track your daily goal!`;
    }
    if (detect(msg, ['slow', 'stuck', 'plateau', 'not working'])) {
      return `📊 **Weight loss plateau fixes:**\n1. Increase activity — add 20 min walks or strength training\n2. Check portion sizes — calories may drift higher than expected\n3. Reduce deficit slightly (400 kcal instead of 500) — hormones stabilize\n4. Increase protein — helps preserve muscle during plateau\n5. Stay hydrated — dehydration masks weight loss\n6. Track everything for 3 days to see actual intake\n\n⚠️ Plateaus are **normal** and temporary (1–3 weeks). Stay consistent!`;
    }
    return `⚖️ **Expert weight loss tips:**\n• **Calorie deficit** is key — eat less than you burn\n• **Protein first** — prioritize chicken, eggs, fish (preserve muscle)\n• **Fiber-rich foods** — vegetables, oats, legumes (stay full longer)\n• **Drink water** — replace sugary drinks with water or tea\n• **Move more** — aim for 8,000+ steps daily\n• **Sleep well** — affects hunger hormones and metabolism\n• **Be patient** — healthy pace is 0.5–1kg per week`;
  }

  // ════════════════════════════════════════════════════════════════════
  // CATEGORY: MUSCLE GAIN 💪
  // ════════════════════════════════════════════════════════════════════
  if (detectMuscleGain(msg)) {
    if (detect(msg, ['how', 'tips', 'advice', 'strategy', 'guide', 'plan'])) {
      return `💪 **Muscle building protocol:**\n1. Eat in a **calorie surplus** (200–300 kcal/day)\n2. Consume **1.6–2.2g protein per kg** body weight\n3. Do **strength training 3–4x/week** (compound: squat, deadlift, bench)\n4. Eat **within 30–60 min after workout** (muscle recovery window)\n5. Best foods: chicken, eggs, salmon, paneer, dal, oats\n6. Sleep **7–9 hours** — muscle grows during rest!\n7. Track progress — take photos, measure, note strength gains\n\n📈 Realistic gain: 0.5–1kg muscle per month for beginners`;
    }
    if (detect(msg, ['food', 'eat', 'diet'])) {
      return `🍗 **Best muscle-building foods:**\n• **Chicken** — 31g protein, lean, affordable\n• **Eggs** — complete amino acids, cheap\n• **Salmon** — protein + omega-3 for recovery\n• **Paneer** — 18g protein, high fat (energy)\n• **Dal/Lentils** — plant protein, carbs for workout fuel\n• **Oats** — complex carbs to fuel training\n• **Greek yogurt** — protein + probiotics\n• **Almonds/Peanuts** — healthy fats for hormones\n\nMix & match for variety while hitting 1.6–2.2g protein/kg daily.`;
    }
    return `💪 **Muscle gain essentials:**\n• **Protein:** 1.6–2.2g per kg body weight daily\n• **Calories:** Eat 200–300 kcal above maintenance\n• **Training:** Progressive strength training 3–4x/week\n• **Recovery:** Sleep 7–9 hours — that's when muscles grow!\n• **Consistency:** Show up to the gym AND eat enough\n\n🎯 Track your lifts to ensure progressive overload!`;
  }

  // ════════════════════════════════════════════════════════════════════
  // CATEGORY: PROTEIN INTAKE 🥩
  // ════════════════════════════════════════════════════════════════════
  if (detectProteinIntake(msg)) {
    if (detect(msg, ['high', 'best', 'top', 'rich', 'good source', 'foods', 'sources']) || detect(msg, ['list', 'which', 'where'])) {
      return `💪 **Top protein sources (per 100g):**\n\n**Animal-based:**\n• Chicken breast — 31g ⭐\n• Tuna — 26g ⭐\n• Beef — 26g ⭐\n• Salmon — 20g ⭐\n• Paneer — 18g ⭐\n• Eggs — 13g\n\n**Plant-based:**\n• Hemp seeds — 31g ⭐\n• Peanuts — 26g\n• Lentils/Dal — 9g\n• Tofu — 8g\n• Quinoa — 14g\n\n💡 Pro tip: Mix plant + animal for **complete amino acids**!`;
    }
    if (detect(msg, ['how much', 'need', 'daily', 'requirement', 'target'])) {
      return `📊 **Daily protein targets:**\n\n• **General:** 0.8g per kg body weight\n• **Active people:** 1.2–1.6g per kg\n• **Muscle building:** 1.6–2.2g per kg\n• **Weight loss:** 1.8–2.2g per kg (preserve muscle)\n\n**Example:** 70kg person gaining muscle needs 70 × 1.8 = **126g protein/day**\n\n✅ Spread across 4–5 meals for better absorption!`;
    }
    if (detect(msg, ['when', 'timing', 'post workout', 'best time'])) {
      return `⏰ **Protein timing strategy:**\n• **Post-workout** (30–60 min): 25–40g protein — muscle repair window\n• **Breakfast:** 25–30g protein — reduces hunger all day\n• **Lunch/Dinner:** 25–35g protein — main meals\n• **Snack:** 10–15g protein — Greek yogurt, nuts, eggs\n\n💡 Consistent daily intake matters more than timing!`;
    }
    const food = extractFood(msg);
    if (food && FOOD_PROTEIN[food]) {
      return `💪 **${food.replace(/_/g, ' ')}** contains approximately **${FOOD_PROTEIN[food]}g protein per 100g**.\n\nThis is a ${FOOD_PROTEIN[food] > 20 ? '⭐ excellent' : FOOD_PROTEIN[food] > 10 ? '✅ good' : '👍 decent'} protein source!\n\nAim for **1.6–2.2g protein per kg** body weight daily.`;
    }
    return `💪 **Protein guide:**\nProtein is essential for **muscle repair, recovery, and growth**. \n\nDaily targets:\n• Sedentary: 0.8g/kg\n• Active: 1.2–1.6g/kg\n• Muscle building: 1.6–2.2g/kg\n\nAsking "best high-protein foods" or "how much protein daily"?`;
  }

  // ════════════════════════════════════════════════════════════════════
  // CATEGORY: HEALTHY DIET 🥗
  // ════════════════════════════════════════════════════════════════════
  if (detectHealthyDiet(msg)) {
    return `🥗 **Healthy eating framework:**\n• **50% vegetables** — fiber, vitamins, low calories\n• **25% lean protein** — chicken, fish, eggs, legumes\n• **25% complex carbs** — oats, brown rice, sweet potato\n• **Healthy fats** — olive oil, nuts, avocado\n\n**Daily habits:**\n✅ Eat 5+ servings of vegetables\n✅ Choose whole grains over refined\n✅ Limit added sugars to <25g/day\n✅ Drink 2–3L water\n✅ Minimize processed foods\n\nAsk about **meal ideas, macros, or specific foods**!`;
  }

  // ── Calories in a specific food ──────────────────────────────────
  if (detect(msg, ['calorie', 'kcal', 'how many cal'])) {
    const food = extractFood(msg);
    if (food && FOOD_CALORIES[food]) {
      return `🍽️ **${food.replace('_', ' ')}** contains approximately **${FOOD_CALORIES[food]} kcal per 100g**. This can vary slightly based on preparation method.`;
    }
    return `I know the calories for: ${Object.keys(FOOD_CALORIES).slice(0, 12).join(', ')}, and more. Try asking: "how many calories in chicken?"`;
  }

  // ── Carbs ────────────────────────────────────────────────────────
  if (detect(msg, ['carb', 'carbs', 'carbohydrate'])) {
    if (detect(msg, ['avoid', 'bad', 'cut', 'reduce', 'less'])) {
      return `🚫 **Carbs to limit:**\n• White bread & white rice\n• Sugary drinks & sodas\n• Candy and pastries\n• Processed snacks\n\n✅ **Healthy carb choices:**\n• Oats, quinoa, brown rice\n• Sweet potatoes\n• Fruits (in moderation)\n• Legumes and lentils`;
    }
    return `🌾 **About carbohydrates:**\nCarbs are your primary energy source. Aim for **45–65%** of total calories from carbs. Choose complex carbs like oats, quinoa, sweet potatoes, and whole grains over simple/refined carbs.`;
  }

  // ── Fats ─────────────────────────────────────────────────────────
  if (detect(msg, ['fat', 'fats', 'fatty'])) {
    if (detect(msg, ['healthy', 'good', 'best'])) {
      return `🥑 **Healthy fat sources:**\n• Avocado\n• Olive oil\n• Nuts (almonds, walnuts)\n• Fatty fish (salmon, mackerel)\n• Seeds (chia, flax)\n\nAim for **20–35%** of total calories from healthy fats. Avoid trans fats completely.`;
    }
    return `Dietary fats are essential for hormone production and vitamin absorption. Healthy fats (unsaturated) are found in avocados, nuts, and olive oil. Limit saturated fats and avoid trans fats.`;
  }

  // ── Daily calorie needs ──────────────────────────────────────────
  if (detect(msg, ['how many calorie', 'daily calorie', 'calorie need', 'calorie requirement', 'calorie intake', 'calorie goal', 'should i eat'])) {
    return `📊 **Daily calorie needs vary by goal:**\n• **Lose weight:** 1,500–1,800 kcal (for average adult)\n• **Maintain weight:** 1,800–2,200 kcal\n• **Gain muscle:** 2,200–2,800 kcal\n\nA rough formula: multiply your **body weight in kg × 30** for maintenance calories, then adjust ±300–500 kcal for your goal. Use the **Dashboard** to see your personalized target!`;
  }

  // ── Hydration / water ────────────────────────────────────────────
  if (detect(msg, ['water', 'hydrat', 'drink', 'fluid'])) {
    return `💧 **Hydration tips:**\n• Drink **2–3L of water** daily (more if active or in hot weather)\n• Start your morning with **500ml of water**\n• Thirst is already a sign of mild dehydration\n• Herbal teas and coconut water count\n• Limit coffee & alcohol — they're diuretics\n\n👉 A good rule: drink enough so your urine is pale yellow.`;
  }

  // ── Breakfast suggestions ────────────────────────────────────────
  if (detect(msg, ['breakfast', 'morning meal', 'morning food'])) {
    return `🍳 **Healthy breakfast ideas:**\n• **High protein:** Eggs (any style) + whole wheat toast\n• **Quick:** Greek yogurt + berries + granola\n• **Filling:** Oatmeal + banana + nut butter\n• **Indian:** Moong dal chilla + chutney or Poha\n• **Light:** Smoothie with spinach, banana, protein powder\n\nAim for **25–30g protein** at breakfast to reduce hunger all day!`;
  }

  // ── Lunch suggestions ───────────────────────────────────────────
  if (detect(msg, ['lunch', 'afternoon meal'])) {
    return `🥗 **Healthy lunch ideas:**\n• Grilled chicken/fish + brown rice + vegetables\n• Dal + roti + salad (classic balanced Indian meal)\n• Quinoa bowl with chickpeas and roasted veggies\n• Tuna/egg salad wrap\n• Lentil soup + whole grain bread\n\nMake lunch your **biggest meal** if you're more active during the day.`;
  }

  // ── Dinner suggestions ───────────────────────────────────────────
  if (detect(msg, ['dinner', 'supper', 'evening meal', 'night meal'])) {
    return `🌙 **Healthy dinner ideas:**\n• Baked salmon + steamed broccoli + sweet potato\n• Palak paneer + 1 roti (light, nutritious)\n• Stir-fried tofu + vegetables + brown rice\n• Chicken soup with vegetables\n• Grilled fish + salad\n\nKeep dinner **lighter than lunch**. Stop eating 2–3 hours before bed for better sleep.`;
  }

  // ── Snack suggestions ────────────────────────────────────────────
  if (detect(msg, ['snack', 'snacks', 'between meal'])) {
    return `🥜 **Healthy snack ideas:**\n• Handful of almonds or walnuts (~150 kcal)\n• Greek yogurt + honey\n• Apple + peanut butter\n• Hummus + carrot/cucumber sticks\n• Boiled eggs\n• Roasted chana (chickpeas)\n\nKeep snacks under **200 kcal** and high in protein or fiber.`;
  }

  // ── Sugar ────────────────────────────────────────────────────────
  if (detect(msg, ['sugar', 'sweet', 'sweetener'])) {
    return `🍬 **Sugar guidelines:**\n• WHO recommends max **25g (6 tsp) of added sugar per day**\n• Natural sugars in fruit are fine (come with fiber)\n• Avoid: sodas, packaged juices, candy, pastries\n• Better alternatives: dates, honey (in moderation), stevia\n\nHigh sugar intake is linked to weight gain, diabetes, and energy crashes.`;
  }

  // ── Vitamins / supplements ───────────────────────────────────────
  if (detect(msg, ['vitamin', 'supplement', 'mineral', 'deficiency'])) {
    return `💊 **Key nutrition supplements:**\n• **Vitamin D** — most people are deficient; take 1000–2000 IU/day\n• **Omega-3** — for heart health; from fish or flaxseed oil\n• **Magnesium** — sleep and muscle function\n• **B12** — essential for vegetarians/vegans\n• **Iron** — especially for menstruating women\n\n⚠️ Always consult a doctor before starting supplements.`;
  }

  // ── BMI ──────────────────────────────────────────────────────────
  if (detect(msg, ['bmi', 'body mass index'])) {
    return `📏 **BMI (Body Mass Index):**\nBMI = weight(kg) ÷ height(m)²\n\n• Below 18.5 → Underweight\n• 18.5–24.9 → Normal weight ✅\n• 25–29.9 → Overweight\n• 30+ → Obese\n\n⚠️ BMI doesn't account for muscle mass. Athletes often have high BMI but low body fat. Use it as a rough guide only.`;
  }

  // ── Metabolism ───────────────────────────────────────────────────
  if (detect(msg, ['metabolism', 'metabolic', 'metabolis'])) {
    return `⚡ **Boosting metabolism:**\n• Eat enough protein — it has a high **thermic effect**\n• Do **strength training** — muscle burns more calories at rest\n• Don't skip meals — very low calories slow metabolism\n• Stay hydrated — even mild dehydration slows metabolic rate\n• Get enough sleep — sleep deprivation lowers metabolism\n• Drink green tea or black coffee (moderate amounts)`;
  }

  // ── Vegetarian / vegan protein ───────────────────────────────────
  if (detect(msg, ['vegetarian', 'vegan', 'plant-based', 'plant based', 'no meat'])) {
    return `🌱 **Plant-based protein sources:**\n• Lentils/Dal — 9g/100g\n• Chickpeas — 9g/100g\n• Tofu — 8g/100g\n• Paneer — 18g/100g (vegetarian)\n• Quinoa — 14g/100g\n• Peanuts/Peanut butter — 26g/100g\n• Hemp seeds — 31g/100g\n• Edamame — 11g/100g\n\nCombine different plant proteins to get all **essential amino acids**.`;
  }

  // ── Intermittent fasting ─────────────────────────────────────────
  if (detect(msg, ['intermittent', 'fasting', 'if diet', '16:8', 'skip meal'])) {
    return `⏰ **Intermittent Fasting (IF):**\n• Most popular: **16:8** — fast 16 hrs, eat in an 8-hr window\n• Helps reduce overall calorie intake naturally\n• Can improve insulin sensitivity\n• Works best when you eat nutritious meals during the eating window\n• Not suitable for: pregnant women, diabetics (without doctor supervision), those with eating disorder history\n\nStart with **12:12** if you're new to it.`;
  }

  // ── Pre/post workout ────────────────────────────────────────────
  if (detect(msg, ['pre workout', 'pre-workout', 'before workout', 'before gym'])) {
    return `🏋️ **Pre-workout nutrition:**\n• Eat **1–2 hours before** training\n• Focus on **complex carbs + moderate protein**\n• Examples: oats + banana, rice + chicken, whole wheat toast + eggs\n• Stay hydrated — drink 500ml water before exercise\n• Avoid heavy/fatty meals right before training`;
  }

  if (detect(msg, ['post workout', 'post-workout', 'after workout', 'after gym', 'after exercise'])) {
    return `🥛 **Post-workout nutrition:**\n• Eat within **30–60 minutes** after training\n• Focus on **protein + fast carbs** to replenish glycogen\n• Examples: protein shake + banana, chicken + white rice, Greek yogurt + fruit\n• Aim for **20–40g protein** post-workout\n• This is the most important meal for muscle recovery!`;
  }

  // ── What is (macros / calories general) ─────────────────────────
  if (detect(msg, ['what is calorie', 'what are calorie', 'what is macro', 'what are macro', 'explain'])) {
    return `📚 **Nutrition basics:**\n\n**Calories** — unit of energy from food. 1g protein = 4 kcal, 1g carbs = 4 kcal, 1g fat = 9 kcal.\n\n**Macronutrients:**\n• 🥩 Protein — builds/repairs muscle, keeps you full\n• 🌾 Carbs — primary energy source, fuels the brain\n• 🥑 Fat — hormones, vitamin absorption, brain function\n\nA balanced diet hits all three in the right ratios for your goal.`;
  }

  // ── Help / capabilities ──────────────────────────────────────────
  if (detect(msg, ['help', 'what can you', 'what do you', 'capabilities', 'topics'])) {
    return `🤖 **I can help you with:**\n• 🍎 Calories in specific foods (ask: "calories in chicken")\n• 💪 Protein sources and recommendations\n• ⚖️ Weight loss tips and strategies\n• 🏋️ Muscle gain and bulking\n• 🍳 Meal ideas (breakfast, lunch, dinner, snacks)\n• 💧 Hydration tips\n• 📏 BMI explained\n• 🌱 Vegetarian/vegan nutrition\n• ⏰ Intermittent fasting\n• 🏃 Pre & post workout nutrition\n• 🍬 Sugar guidelines\n• 💊 Vitamins & supplements\n\nJust ask a question!`;
  }

  // ── Default fallback with suggestions ────────────────────────────
  return `🤔 I'm not sure about that. Try asking me about:\n\n• **Weight loss** — "tips for losing weight"\n• **Muscle gain** — "how to build muscle"\n• **Healthy diet** — "what should I eat?"\n• **Protein** — "best protein sources" or "how much protein?"\n• **Calories** — "how many calories in eggs?"\n• **Meals** — "breakfast ideas" or "lunch suggestions"\n\nType **"help"** to see all topics!`;
};

// ─── Controller ─────────────────────────────────────────────────────
const chat = (req, res) => {
  const { message } = req.body;

  if (!message || typeof message !== 'string' || message.trim().length === 0) {
    return res.status(400).json({ success: false, message: 'Please enter a message.' });
  }

  if (message.trim().length > 500) {
    return res.status(400).json({ success: false, message: 'Message too long (max 500 chars).' });
  }

  const reply = generateReply(message);
  res.status(200).json({ success: true, reply });
};

module.exports = { chat, generateReply };
