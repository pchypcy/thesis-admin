export const getCurrentLang = () => {
    return localStorage.getItem('lang') || 'TH';
};

export const getAppFont = (lang) => {
    return lang === 'TH' ? "'IBM Plex Sans Thai', sans-serif" : "'Product Sans', 'Google Sans', sans-serif";
};

export const switchLanguage = (newLang) => {
    localStorage.setItem('lang', newLang);
    window.location.reload(); 
};

export const translations = {
    EN: {
        //Bottom Nav
        navHome: "Home", navRank: "Rank", navRewards: "Rewards", navProfile: "Profile",
        
        // Welcome
        welTitle: "InGreen", welSub: "Your personal guide to \n sustainable and healthy shopping.", welBtn: "Get Started",
        
        // Quiz
        qTitle1: "Discover your eco-persona and", qTitle2: "set up your health shield", qBtn: "Get Started", q1: "What matters most when buying food?", q2: "How do you usually handle trash?", q3: "Price vs Quality, what's your pick?", q1a1: "Ingredients & Health", q1a2: "Eco-Friendly Packaging", q1a3: "Trends & Reviews", q2a1: "Always separate & recycle", q2a2: "Focus on eating clean", q2a3: "Just toss it in the bin", q3a1: "Pay more for Safety", q3a2: "Pay more for the Planet", q3a3: "Cheapest option first", shieldTitle: "Activate Health Shield?", shieldSub: "Select concerns to get personalized alerts", h1: "I watch my Sugar (Diabetes)", h2: "I watch Sodium (Pressure/Kidney)", h3: "I have Food Allergies (Gluten/Nuts)", continueBtn: "Continue to Login",
        
        // Login
        sugarWatch: "Sugar Watch", sodiumWatch: "Sodium Watch", allergies: "Allergies", fillFields: "Please fill all fields", loginFailed: "Login failed", profileReady: "Your Profile Ready!", welcomeBack: "Welcome Back", signInSub: "Sign in to continue your green journey", username: "Username", password: "Password", processing: "Processing...", signIn: "Sign In", createAcc: "Create Account", newHere: "New here? Create Account", alreadyHave: "Already have an account? Login", errorPrefix: "Error: ",
        
        // Home
        welcome: "Welcome back,", headline1: "Let's check your", headline1_br: "products 🌱", searchPlaceholder: "Search Stores", searchBtn: "Search", scanItemsToday: "Scan items today", quickActions: "Quick Actions", scanNow: "Scan Now", viewHistory: "History", nearbyShops: "Nearby Green Shops", viewAll: "View All", start: "START", view: "VIEW",
        
        // Dashboard
        dashTitle: "Dashboard", points: "Points", nextTarget: "NEXT: CORE LOHAS", scanText1: "Scan ", scanText2: " more items", scanText3: " (approx.) to level up!", impactTitle: "Your Impact", chemAvoided: "Chemicals Avoided", plasticSaved: "Plastics Saved", badgesTitle: "Badges & Awards", badge1: "Detective", badge2: "Recycler", badgeLocked: "Locked", lvl: "Level",
        
        // Scan
        scanTitle: "Scan Product", scanGuide: "Align barcode within the frame", manualBtn: "Enter code manually", modalTitle: "Enter Barcode", modalSub: "Type the product code manually", placeholder: "e.g. 88xxxxxxx", cancel: "Cancel", check: "Check", scanError: "Error scanning product", scanning: "Looking up product...", searchBarcode: "Looking up barcode...",
        
        // Result (General)
        resTitle: "Product Details", verified: "Verified Green", caution: "Caution: Processed", sugar: "SUGAR", sodium: "SODIUM", fat: "FAT", resShield: "Health Shield Alert", ingTitle: "Ingredients", tapDetails: "Tap for details", noIng: "No ingredients data.", disassemble: "Disassemble Packaging", tapEarn: "Tap to earn points", label: "LABEL", plus30: "+30 Points!", revealMeaning: "Tap highlighted words to reveal meaning", risk: "Risk", impact: "Impact", analysis: "⚠️ Health Analysis:", dataSource: "DATA SOURCE", gotIt: "Got it", bonusEarned: "You earned +10 Points!", factCheck: "Fact Check", sampleProduct: "Sample Product",
        
        // Result (Detailed Insights from Dictionary)
        highSugar: 'High Sugar Alert', highSugarDesc: 'Sugar is too high for your diabetic condition',
        highSodium: 'High Sodium Alert', highSodiumDesc: 'Sodium is too high for your health condition',
        allergyAlert: 'Allergen Alert', allergyDesc: 'Found ingredient matching your allergy',
        healthConflict: 'Health Conflict', highSugarDeduct: 'High Sugar Level', notEcoDeduct: 'Not Eco-friendly',
        excellentMatch: 'Excellent Match!', fairMatch: 'Fair Match, Eat in Moderation', poorMatch: 'Poor Match, Avoid!',
        prefMatchTitle: 'Suitability for you', 
        safeEcoDesc: 'Safe for your health profile and matches your eco-lifestyle.',
        warningEcoDesc: 'Detected factors that might affect your health goals.',
        ecoBadge: 'Eco-Friendly', healthQuality: 'Health', environment: 'Eco',
        energy: 'Calories', carbs: 'Carbohydrates', protein: 'Protein',
        sugarLabel: 'Sugar', sodiumLabel: 'Sodium',
        analysisTitle: 'Ingredients Analysis', additivesTitle: 'Additives',
        fullIngredients: 'Ingredients:', noFullText: 'No full text available', allergenTag: 'Allergens:',
        mainIngredients: 'Main Ingredients', recycleBin: 'Recyclable Waste', organicBin: 'Biodegradable',
        generalBin: 'General Waste', colorYellow: 'Yellow', colorGreen: 'Green', colorBlue: 'Blue',
        noPackageData: 'No packaging data found', earnedPoints: 'Earned +30 Eco Points!',
        calcBreakdown: 'Algorithm Analysis', baseScore: 'Base Score', deduct: 'Deduct',
        ecoReason: 'Recyclable packaging helps reduce waste.',
        aiInsightTitle: 'Summary & Recommendations',
        productInsights: 'Detailed Insights',
        
        // History
        histTitle: "Activity History", balance: "Balance", recent: "Recent Transactions", noHistory: "No history yet", pts: "pts", loadingHist: "Loading history...",
        
        // Rewards
        rewTitle: "Rewards Store", rewHeader: "Redeem Points", rewSub: "Exclusive deals for eco-warriors", tabAll: "All", tabCafe: "Cafe", tabFood: "Food", tabEcoShop: "Eco-Shop", btnRedeem: "Redeem", btnLocked: "Locked", successTitle: "Success!", successSub: "Coupon is ready to use", yourCode: "YOUR CODE", closeBtn: "Close",
        
        // Profile
        profTitle: "Profile", accSettings: "Account Settings", langLabel: "Language", menuHist: "Scan History", menuNoti: "Notification", menuSupport: "Support", logout: "Logout"
    },
    TH: {
        //Bottom Nav
        navHome: "หน้าแรก", navRank: "จัดอันดับ", navRewards: "รางวัล", navProfile: "โปรไฟล์",
        
        // Welcome
        welTitle: "InGreen", welSub: "คู่มือส่วนตัวสู่การเลือกซื้อที่ยั่งยืน\nและดีต่อสุขภาพของคุณ", welBtn: "เริ่มต้นใช้งาน",
        
        // Quiz
        qTitle1: "คู่มือส่วนตัวสู่การเลือกซื้อที่ยั่งยืน", qTitle2: "และดีต่อสุขภาพของคุณ", qBtn: "เริ่มต้นใช้งาน", q1: "อะไรสำคัญที่สุดเวลาคุณเลือกซื้ออาหาร?", q2: "ปกติคุณจัดการขยะอย่างไร?", q3: "ระหว่างราคากับคุณภาพ คุณเลือกอะไร?", q1a1: "ส่วนผสมและสุขภาพต้องมาก่อน", q1a2: "บรรจุภัณฑ์ต้องเป็นมิตรกับสิ่งแวดล้อม", q1a3: "ดูตามกระแสและรีวิว", q2a1: "แยกขยะและรีไซเคิลเสมอ", q2a2: "เน้นกินคลีนและดูแลสุขภาพ", q2a3: "ทิ้งลงถังขยะไปเลยไม่ได้คิดมาก", q3a1: "ยอมจ่ายแพงเพื่อความปลอดภัย", q3a2: "ยอมจ่ายแพงเพื่อช่วยโลก", q3a3: "เลือกของถูกไว้ก่อนเสมอ", shieldTitle: "เปิดใช้งานเกราะป้องกันสุขภาพ?", shieldSub: "เลือกสิ่งที่คุณกังวลเพื่อรับการแจ้งเตือน", h1: "ฉันควบคุมน้ำตาล", h2: "ฉันควบคุมโซเดียม", h3: "ฉันแพ้อาหาร เช่น กลูเตน ถั่ว", continueBtn: "ดำเนินการต่อ",
        
        // Login
        sugarWatch: "เฝ้าระวังน้ำตาล", sodiumWatch: "เฝ้าระวังโซเดียม", allergies: "เฝ้าระวังภูมิแพ้", fillFields: "กรุณากรอกข้อมูลให้ครบถ้วน", loginFailed: "เข้าสู่ระบบล้มเหลว", profileReady: "เริ่มต้นใช้งาน", welcomeBack: "ยินดีต้อนรับกลับ", signInSub: "เข้าสู่ระบบเพื่อเริ่มเส้นทางของคุณ", username: "ชื่อผู้ใช้", password: "รหัสผ่าน", processing: "กำลังประมวลผล...", signIn: "เข้าสู่ระบบ", createAcc: "สร้างบัญชีใหม่", newHere: "ผู้ใช้ใหม่? สร้างบัญชีเลย", alreadyHave: "มีบัญชีอยู่แล้ว? เข้าสู่ระบบ", errorPrefix: "ข้อผิดพลาด: ",
        
        // Home
        welcome: "ยินดีต้อนรับ,", headline1: "มาตรวจสอบสินค้า", headline1_br: "ของคุณกัน 🌱", searchPlaceholder: "ค้นหาร้านค้า...", searchBtn: "ค้นหา", scanItemsToday: "สแกนสินค้าวันนี้", quickActions: "เริ่มต้นใช้งาน", scanNow: "สแกนเลย", viewHistory: "ประวัติ", nearbyShops: "ร้านค้ารักษ์โลกใกล้คุณ", viewAll: "ดูทั้งหมด", start: "เริ่มเลย", view: "ดูข้อมูล",
        
        // Dashboard
        dashTitle: "แดชบอร์ด", points: "แต้ม", nextTarget: "เป้าหมายถัดไป: CORE LOHAS", scanText1: "สแกนอีก ", scanText2: " ชิ้น", scanText3: " (โดยประมาณ) เพื่ออัปเลเวล!", impactTitle: "ผลลัพธ์ของคุณ", chemAvoided: "สารเคมีที่เลี่ยงได้", plasticSaved: "พลาสติกที่ลดได้", badgesTitle: "รางวัล & ความสำเร็จ", badge1: "นักสืบฉลาก", badge2: "นักรีไซเคิล", badgeLocked: "ยังไม่ปลดล็อค", lvl: "เลเวล",
        
        // Scan
        scanTitle: "สแกนสินค้า", scanGuide: "วางบาร์โค้ดให้อยู่ภายในกรอบ", manualBtn: "กรอกรหัสด้วยตัวเอง", modalTitle: "กรอกบาร์โค้ด", modalSub: "พิมพ์รหัสสินค้าที่ระบุบนบรรจุภัณฑ์", placeholder: "เช่น 88xxxxxxx", cancel: "ยกเลิก", check: "ตรวจสอบ", scanError: "เกิดข้อผิดพลาดในการดึงข้อมูล", scanning: "กำลังค้นหาข้อมูลสินค้า...", searchBarcode: "กำลังค้นหาบาร์โค้ด...",
        
        // Result (General)
        resTitle: "รายละเอียดสินค้า", verified: "ผ่านการรับรองสีเขียว", caution: "ควรระวัง: ผ่านการแปรรูป", sugar: "น้ำตาล", sodium: "โซเดียม", fat: "ไขมัน", resShield: "การแจ้งเตือนสุขภาพ", ingTitle: "ส่วนประกอบ", tapDetails: "แตะเพื่อดูรายละเอียด", noIng: "ไม่มีข้อมูลส่วนประกอบ", disassemble: "แยกชิ้นส่วนบรรจุภัณฑ์", tapEarn: "แตะเพื่อรับแต้ม", label: "ฉลาก", plus30: "+30 แต้ม!", revealMeaning: "แตะที่คำไฮไลท์เพื่อดูความหมาย", risk: "ความเสี่ยง", impact: "ผลกระทบ", analysis: "⚠️ วิเคราะห์สุขภาพ:", dataSource: "แหล่งข้อมูล", gotIt: "เข้าใจแล้ว", bonusEarned: "คุณได้รับแต้มโบนัส +10!", factCheck: "ข้อเท็จจริง", sampleProduct: "สินค้าตัวอย่าง",
        
        // Result (Detailed Insights from Dictionary)
        highSugar: 'แจ้งเตือนน้ำตาลสูง', highSugarDesc: 'สินค้ามีน้ำตาลสูงเกินเกณฑ์สำหรับผู้ป่วยเบาหวาน',
        highSodium: 'แจ้งเตือนโซเดียมสูง', highSodiumDesc: 'โซเดียมสูงเกินไปสำหรับสภาวะความดัน/โรคไตของคุณ',
        allergyAlert: 'แจ้งเตือนภูมิแพ้', allergyDesc: 'พบส่วนผสมที่ตรงกับอาการแพ้ของคุณ',
        healthConflict: 'ขัดแย้งกับสุขภาพ', highSugarDeduct: 'ปริมาณน้ำตาลค่อนข้างสูง', notEcoDeduct: 'บรรจุภัณฑ์ไม่เป็นมิตรต่อโลก',
        excellentMatch: 'เหมาะสมกับคุณดีเยี่ยม', fairMatch: 'ทานได้ แต่ควรระวังปริมาณ', poorMatch: 'ขัดแย้งกับเป้าหมายสุขภาพ!',
        prefMatchTitle: 'ความเหมาะสมกับคุณ', 
        safeEcoDesc: 'ปลอดภัยต่อสุขภาพของคุณ และตอบโจทย์ไลฟ์สไตล์รักษ์โลก',
        warningEcoDesc: 'ตรวจพบปัจจัยที่อาจส่งผลต่อสุขภาพหรือเป้าหมายของคุณ',
        ecoBadge: 'Eco-Friendly', healthQuality: 'สุขภาพ', environment: 'รักษ์โลก',
        energy: 'พลังงาน', carbs: 'คาร์โบไฮเดรต', protein: 'โปรตีน',
        sugarLabel: 'น้ำตาล', sodiumLabel: 'โซเดียม',
        analysisTitle: 'การวิเคราะห์ส่วนผสม', additivesTitle: 'วัตถุเจือปนอาหาร',
        fullIngredients: 'ส่วนประกอบทั้งหมด:', noFullText: 'ไม่มีข้อมูลฉลากเต็ม', allergenTag: 'สารก่อภูมิแพ้:',
        mainIngredients: 'ส่วนประกอบหลัก', recycleBin: 'ขยะรีไซเคิล', organicBin: 'ขยะเปียก/ย่อยสลายได้',
        generalBin: 'ขยะทั่วไป', colorYellow: 'เหลือง', colorGreen: 'เขียว', colorBlue: 'น้ำเงิน',
        noPackageData: 'ไม่พบข้อมูลบรรจุภัณฑ์', earnedPoints: 'ได้รับ +30 แต้มรักษ์โลก!',
        calcBreakdown: 'สัดส่วนการคำนวณคะแนน', baseScore: 'คะแนนเริ่มต้น', deduct: 'หัก',
        ecoReason: 'บรรจุภัณฑ์รีไซเคิลได้ ช่วยลดขยะ',
        aiInsightTitle: 'ข้อสรุปและคำแนะนำ',
        productInsights: 'รายละเอียดข้อควรระวัง',
        
        // History
        histTitle: "ประวัติการใช้งาน", balance: "แต้มสะสมทั้งหมด", recent: "รายการล่าสุด", noHistory: "ยังไม่มีรายการประวัติ", pts: "แต้ม", loadingHist: "กำลังโหลดข้อมูล...",
        
        // Rewards
        rewTitle: "ร้านค้ารางวัล", rewHeader: "แลกคะแนน", rewSub: "ดีลพิเศษสำหรับสายรักษ์โลก", tabAll: "ทั้งหมด", tabCafe: "คาเฟ่", tabFood: "อาหาร", tabEcoShop: "รักษ์โลก", btnRedeem: "แลกสิทธิ์", btnLocked: "ยังไม่ปลดล็อค", successTitle: "สำเร็จ!", successSub: "คูปองของคุณพร้อมใช้งานแล้ว", yourCode: "รหัสของคุณ", closeBtn: "ปิดหน้าต่าง",
        
        // Profile
        profTitle: "โปรไฟล์", accSettings: "ตั้งค่าบัญชี", langLabel: "ภาษา", menuHist: "ประวัติการสแกน", menuNoti: "การแจ้งเตือน", menuSupport: "ศูนย์ช่วยเหลือ", logout: "ออกจากระบบ"
    }
};