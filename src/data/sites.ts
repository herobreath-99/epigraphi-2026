export interface Landmark {
  id: string;
  nameAr: string;
  nameEn: string;
  nameFr: string;
  descAr: string;
  descEn: string;
  descFr: string;
  lat: number;
  lng: number;
  era?: string;
  icon?: string;
}

export interface Site {
  name: string;
  nameEn: string;
  lat: number;
  lng: number;
  desc: string;
  descEn: string;
  descFr: string;
  type: string;
  count: number;
  /** Radius in meters within which user is considered "at" this site */
  radiusM: number;
  landmarks: Landmark[];
}

export const sites: Site[] = [
  {
    name: "تيمقاد (Timgad)", nameEn: "Timgad", lat: 35.4849, lng: 6.4685,
    desc: "مدينة رومانية أسسها تراجان عام 100 م", descEn: "Roman city founded by Trajan in 100 AD", descFr: "Cité romaine fondée par Trajan en 100 ap. J.-C.",
    type: "Latin", count: 2500, radiusM: 2000,
    landmarks: [
      { id: "timgad-arch", nameAr: "قوس تراجان", nameEn: "Arch of Trajan", nameFr: "Arc de Trajan", descAr: "قوس النصر الشهير الذي بُني تكريماً للإمبراطور تراجان مؤسس المدينة عام 100 م. يبلغ ارتفاعه 12 متراً ويعد رمز المدينة.", descEn: "The famous triumphal arch built in honor of Emperor Trajan, founder of the city in 100 AD. Standing 12m tall, it is the symbol of the city.", descFr: "Le célèbre arc de triomphe construit en l'honneur de l'empereur Trajan, fondateur de la cité en 100 ap. J.-C. Haut de 12m, c'est le symbole de la ville.", lat: 35.4856, lng: 6.4700, era: "100 AD", icon: "🏛️" },
      { id: "timgad-theater", nameAr: "المسرح الروماني", nameEn: "Roman Theater", nameFr: "Théâtre romain", descAr: "مسرح يتسع لـ 3500 متفرج، بُني في القرن الثاني الميلادي. كان مركزاً للعروض المسرحية والاحتفالات في المدينة.", descEn: "A theater seating 3,500 spectators, built in the 2nd century AD. It was the center of theatrical performances and celebrations.", descFr: "Un théâtre de 3 500 places, construit au IIe siècle. Il était le centre des représentations théâtrales et des célébrations.", lat: 35.4840, lng: 6.4670, era: "2nd century AD", icon: "🎭" },
      { id: "timgad-library", nameAr: "المكتبة", nameEn: "Library", nameFr: "Bibliothèque", descAr: "واحدة من أقدم المكتبات العامة في العالم الروماني. تضم رفوفاً محفورة في الجدران لحفظ اللفائف.", descEn: "One of the oldest public libraries in the Roman world. Features niches carved into walls to store scrolls.", descFr: "L'une des plus anciennes bibliothèques publiques du monde romain. Elle comporte des niches sculptées dans les murs pour les rouleaux.", lat: 35.4852, lng: 6.4678, era: "3rd century AD", icon: "📚" },
      { id: "timgad-market", nameAr: "السوق (ماسيلوم)", nameEn: "Market (Macellum)", nameFr: "Marché (Macellum)", descAr: "سوق المدينة المركزي حيث كانت تُباع المنتجات الزراعية والحرفية.", descEn: "The central city market where agricultural and artisanal products were sold.", descFr: "Le marché central de la cité où étaient vendus les produits agricoles et artisanaux.", lat: 35.4847, lng: 6.4690, era: "2nd century AD", icon: "🏪" },
      { id: "timgad-baths", nameAr: "الحمامات الكبرى", nameEn: "Great Baths", nameFr: "Grands Thermes", descAr: "مجمع حمامات ضخم يضم غرف ساخنة وباردة ومعتدلة، وكان مركزاً اجتماعياً هاماً.", descEn: "A massive bath complex with hot, cold, and warm rooms, serving as an important social center.", descFr: "Un vaste complexe thermal avec des salles chaudes, froides et tièdes, servant de centre social important.", lat: 35.4844, lng: 6.4695, era: "2nd century AD", icon: "🏊" },
      { id: "timgad-cardo", nameAr: "الشارع الرئيسي (كاردو)", nameEn: "Main Street (Cardo Maximus)", nameFr: "Rue principale (Cardo Maximus)", descAr: "الشارع الرئيسي للمدينة بعرض 14 متراً، مبلط بالحجارة ومحاط بأعمدة من الجانبين.", descEn: "The main street of the city, 14m wide, paved with stone and lined with columns on both sides.", descFr: "La rue principale de la cité, large de 14m, pavée de pierre et bordée de colonnes des deux côtés.", lat: 35.4849, lng: 6.4685, era: "100 AD", icon: "🛤️" },
    ]
  },
  {
    name: "جميلة (Djemila)", nameEn: "Djemila", lat: 36.3214, lng: 5.7369,
    desc: "مدينة رومانية على ارتفاع 900م", descEn: "Roman city at 900m altitude", descFr: "Cité romaine à 900m d'altitude",
    type: "Latin / Early Christian", count: 800, radiusM: 1500,
    landmarks: [
      { id: "djemila-forum", nameAr: "الساحة الكبرى (الفوروم)", nameEn: "Great Forum", nameFr: "Grand Forum", descAr: "ساحة المدينة الرئيسية محاطة بالمعابد والمباني العامة.", descEn: "The main city square surrounded by temples and public buildings.", descFr: "La place principale de la cité entourée de temples et de bâtiments publics.", lat: 36.3218, lng: 5.7372, era: "2nd century AD", icon: "🏛️" },
      { id: "djemila-baptistery", nameAr: "المعمودية المسيحية", nameEn: "Christian Baptistery", nameFr: "Baptistère chrétien", descAr: "من أجمل المعموديات في شمال أفريقيا، تعود للقرن الخامس.", descEn: "One of the most beautiful baptisteries in North Africa, dating to the 5th century.", descFr: "L'un des plus beaux baptistères d'Afrique du Nord, datant du Ve siècle.", lat: 36.3210, lng: 5.7365, era: "5th century AD", icon: "⛪" },
      { id: "djemila-theater", nameAr: "المسرح", nameEn: "Theater", nameFr: "Théâtre", descAr: "مسرح يتسع لـ 3000 متفرج يطل على منظر طبيعي خلاب.", descEn: "A theater seating 3,000 spectators overlooking a stunning natural landscape.", descFr: "Un théâtre de 3 000 places surplombant un paysage naturel époustouflant.", lat: 36.3220, lng: 5.7380, era: "2nd century AD", icon: "🎭" },
    ]
  },
  {
    name: "تيبازة (Tipaza)", nameEn: "Tipaza", lat: 36.5892, lng: 2.4483,
    desc: "ميناء فينيقي ثم روماني", descEn: "Phoenician then Roman port", descFr: "Port phénicien puis romain",
    type: "Punic / Latin", count: 450, radiusM: 1500,
    landmarks: [
      { id: "tipaza-basilica", nameAr: "البازيليكا الملكية", nameEn: "Royal Basilica", nameFr: "Basilique royale", descAr: "أكبر بازيليكا مسيحية في شمال أفريقيا القديمة.", descEn: "The largest Christian basilica in ancient North Africa.", descFr: "La plus grande basilique chrétienne de l'Afrique du Nord antique.", lat: 36.5895, lng: 2.4490, era: "4th century AD", icon: "⛪" },
      { id: "tipaza-nymphaeum", nameAr: "نبع الحوريات", nameEn: "Nymphaeum", nameFr: "Nymphée", descAr: "نافورة مقدسة مزخرفة كانت مكرسة لحوريات الماء.", descEn: "An ornate sacred fountain dedicated to water nymphs.", descFr: "Une fontaine sacrée ornée dédiée aux nymphes des eaux.", lat: 36.5888, lng: 2.4475, era: "2nd century AD", icon: "⛲" },
    ]
  },
  {
    name: "قالمة (Calama)", nameEn: "Guelma", lat: 36.4622, lng: 7.4264,
    desc: "مدينة نوميدية ثم رومانية", descEn: "Numidian then Roman city", descFr: "Cité numide puis romaine",
    type: "Numidian / Latin", count: 600, radiusM: 1500, landmarks: []
  },
  {
    name: "لامبيسيس (Lambaesis)", nameEn: "Lambaesis", lat: 35.4935, lng: 6.2585,
    desc: "المعسكر الرئيسي للفيلق الثالث أوغسطس", descEn: "HQ of Legio III Augusta", descFr: "QG de la Legio III Augusta",
    type: "Latin Military", count: 1800, radiusM: 1500,
    landmarks: [
      { id: "lambaesis-praetorium", nameAr: "البرايتوريوم", nameEn: "Praetorium", nameFr: "Prétoire", descAr: "مقر قيادة الفيلق الثالث أوغسطس، من أفضل المباني العسكرية الرومانية المحفوظة.", descEn: "Headquarters of Legio III Augusta, one of the best preserved Roman military buildings.", descFr: "Quartier général de la Legio III Augusta, l'un des bâtiments militaires romains les mieux conservés.", lat: 35.4938, lng: 6.2590, era: "2nd century AD", icon: "⚔️" },
      { id: "lambaesis-temple", nameAr: "معبد إسكولاب", nameEn: "Temple of Aesculapius", nameFr: "Temple d'Esculape", descAr: "معبد مكرس لإله الطب الروماني.", descEn: "A temple dedicated to the Roman god of medicine.", descFr: "Un temple dédié au dieu romain de la médecine.", lat: 35.4930, lng: 6.2580, era: "2nd century AD", icon: "🏥" },
    ]
  },
  {
    name: "هيبو ريجيوس (Hippone)", nameEn: "Annaba", lat: 36.8965, lng: 7.7525,
    desc: "مدينة القديس أوغسطينوس", descEn: "City of Saint Augustine", descFr: "Ville de Saint Augustin",
    type: "Latin / Christian", count: 350, radiusM: 1500, landmarks: []
  },
  {
    name: "شرشال (Caesarea)", nameEn: "Cherchell", lat: 36.6064, lng: 2.1928,
    desc: "عاصمة موريتانيا القيصرية", descEn: "Capital of Mauretania Caesariensis", descFr: "Capitale de la Maurétanie Césarienne",
    type: "Greek / Latin", count: 700, radiusM: 1500, landmarks: []
  },
  {
    name: "مادوروس (Madauros)", nameEn: "M'daourouch", lat: 36.0769, lng: 7.8165,
    desc: "مسقط رأس أبوليوس", descEn: "Birthplace of Apuleius", descFr: "Lieu de naissance d'Apulée",
    type: "Latin", count: 300, radiusM: 1000, landmarks: []
  },
  {
    name: "تيديس (Tiddis)", nameEn: "Tiddis", lat: 36.2886, lng: 6.5553,
    desc: "مدينة نوميدية محصنة", descEn: "Fortified Numidian city", descFr: "Cité numide fortifiée",
    type: "Libyco-Berber / Latin", count: 200, radiusM: 1000, landmarks: []
  },
  {
    name: "ثيفيست (Tébessa)", nameEn: "Tébessa", lat: 35.4039, lng: 8.1204,
    desc: "مدينة عسكرية رومانية", descEn: "Roman military city", descFr: "Cité militaire romaine",
    type: "Latin / Christian", count: 550, radiusM: 1500, landmarks: []
  },
];

/** Build lookup index for scan matching */
export const siteCoords: Record<string, [number, number]> = {};
sites.forEach((s) => { siteCoords[s.nameEn.toLowerCase()] = [s.lat, s.lng]; });
siteCoords["timgad"] = [35.4849, 6.4685]; siteCoords["djemila"] = [36.3214, 5.7369]; siteCoords["tipaza"] = [36.5892, 2.4483];
siteCoords["guelma"] = [36.4622, 7.4264]; siteCoords["lambaesis"] = [35.4935, 6.2585]; siteCoords["hippo regius"] = [36.8965, 7.7525];
siteCoords["caesarea"] = [36.6064, 2.1928]; siteCoords["madauros"] = [36.0769, 7.8165]; siteCoords["tiddis"] = [36.2886, 6.5553];
siteCoords["theveste"] = [35.4039, 8.1204]; siteCoords["tébessa"] = [35.4039, 8.1204];

/** Haversine distance in meters */
export function distanceM(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** Find nearest site within range */
export function findNearbySite(lat: number, lng: number): { site: Site; distance: number } | null {
  let best: { site: Site; distance: number } | null = null;
  for (const site of sites) {
    const d = distanceM(lat, lng, site.lat, site.lng);
    if (d <= site.radiusM && (!best || d < best.distance)) {
      best = { site, distance: d };
    }
  }
  return best;
}

/** Find coords for a scan (for map) */
export function findCoordsForScan(scan: { site?: string | null; analysis?: { site?: string | null } | null }): [number, number] | null {
  const site = (scan.site ?? scan.analysis?.site ?? "").toLowerCase().trim();
  if (site && siteCoords[site]) return siteCoords[site];
  for (const key of Object.keys(siteCoords)) { if (site.includes(key) || key.includes(site)) return siteCoords[key]; }
  return null;
}
