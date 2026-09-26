/**
 * BD SHOPS — Comprehensive Bangladesh Districts & Upazilas/Thanas Dataset
 * Covers all 64 Districts organized by 8 Divisions with complete Upazilas list for e-commerce shipping.
 */

export interface DistrictInfo {
  name: string;
  bnName: string;
  division: string;
  upazilas: string[];
}

export const BD_DIVISIONS = [
  'ঢাকা (Dhaka)',
  'চট্টগ্রাম (Chattogram)',
  'রাজশাহী (Rajshahi)',
  'খুলনা (Khulna)',
  'বরিশাল (Barishal)',
  'সিলেট (Sylhet)',
  'রংপুর (Rangpur)',
  'ময়মনসিংহ (Mymensingh)',
] as const;

export const BD_ALL_DISTRICTS: DistrictInfo[] = [
  // 1. DHAKA DIVISION (13 Districts)
  {
    name: 'Dhaka',
    bnName: 'ঢাকা',
    division: 'ঢাকা (Dhaka)',
    upazilas: [
      'উত্তরা (Uttara)', 'ধানমন্ডি (Dhanmondi)', 'মিরপুর (Mirpur)', 'গুলশান (Gulshan)', 'বনানী (Banani)',
      'মোহাম্মদপুর (Mohammadpur)', 'বাড্ডা (Badda)', 'খিলগাঁও (Khilgaon)', 'যাত্রাবাড়ী (Jatrabari)', 'উত্তরা খান (Uttarkhan)',
      'দক্ষিণ খান (Dakkhinkhan)', 'সাভার (Savar)', 'ধামরাই (Dhamrai)', 'কেরানীগঞ্জ (Keraniganj)', 'দোহার (Dohar)', 'নবাবগঞ্জ (Nawabganj)',
      'মতিঝিল (Motijheel)', 'পল্টন (Paltan)', 'শাহবাগ (Shahbagh)', 'রমনা (Ramna)', 'তেজগাঁও (Tejgaon)', 'ক্যান্টনমেন্ট (Cantonment)'
    ]
  },
  {
    name: 'Gazipur',
    bnName: 'গাজীপুর',
    division: 'ঢাকা (Dhaka)',
    upazilas: ['গাজীপুর সদর', 'কালিয়াকৈর', 'কালীগঞ্জ', 'কাপাসিয়া', 'শ্রীপুর', 'টঙ্গী']
  },
  {
    name: 'Narayanganj',
    bnName: 'নারায়ণগঞ্জ',
    division: 'ঢাকা (Dhaka)',
    upazilas: ['নারায়ণগঞ্জ সদর', 'বন্দর', 'রূপগঞ্জ', 'সোনারগাঁও', 'আড়াইহাজার']
  },
  {
    name: 'Narsingdi',
    bnName: 'নরসিংদী',
    division: 'ঢাকা (Dhaka)',
    upazilas: ['নরসিংদী সদর', 'পলাশ', 'শিবপুর', 'বেলবো', 'মনোহরদী', 'রায়পুরা']
  },
  {
    name: 'Munshiganj',
    bnName: 'মুন্সিগঞ্জ',
    division: 'ঢাকা (Dhaka)',
    upazilas: ['মুন্সিগঞ্জ সদর', 'টংগীবাড়ী', 'সিরাজদিখান', 'লৌহজং', 'শ্রীনগর', 'গজারিয়া']
  },
  {
    name: 'Manikganj',
    bnName: 'মানিকগঞ্জ',
    division: 'ঢাকা (Dhaka)',
    upazilas: ['মানিকগঞ্জ সদর', 'সিংগাইর', 'সাটুরিয়া', 'ঘিওর', 'দৌলতপুর', 'হরিরামপুর', 'শিবালয়']
  },
  {
    name: 'Tangail',
    bnName: 'টাঙ্গাইল',
    division: 'ঢাকা (Dhaka)',
    upazilas: ['টাঙ্গাইল সদর', 'কালিহাতী', 'ঘাটাইল', 'সখীপুর', 'বাসাইল', 'মির্জাপুর', 'মধুপুর', 'ধনবাড়ী', 'দে科学পুর', 'গোপালপুর', 'নাগরপুর', 'ভুয়াপুর']
  },
  {
    name: 'Kishoreganj',
    bnName: 'কিশোরগঞ্জ',
    division: 'ঢাকা (Dhaka)',
    upazilas: ['কিশোরগঞ্জ সদর', 'ভৈরব', 'বাজিতপুর', 'হোসেনপুর', 'পাকুন্দিয়া', 'কটিয়াদী', 'করিমগঞ্জ', 'তাড়াইল', 'ইটনা', 'মিঠামইন', 'অষ্টগ্রাম', 'নিকলী', 'কুলিয়ারচর']
  },
  {
    name: 'Faridpur',
    bnName: 'ফরিদপুর',
    division: 'ঢাকা (Dhaka)',
    upazilas: ['ফরিদপুর সদর', 'বোয়ালমারী', 'আলফাডাঙা', 'মধুখালী', 'নগরকান্দা', 'সালথা', 'ভাঙ্গা', 'সদরপুর', 'চরভদ্রাসন']
  },
  {
    name: 'Madaripur',
    bnName: 'মাদারীপুর',
    division: 'ঢাকা (Dhaka)',
    upazilas: ['মাদারীপুর সদর', 'শিবচর', 'কালকিনি', 'রাজৈর', 'ডাসার']
  },
  {
    name: 'Gopalganj',
    bnName: 'গোপালগঞ্জ',
    division: 'ঢাকা (Dhaka)',
    upazilas: ['গোপালগঞ্জ সদর', 'টুঙ্গিপাড়া', 'কোটালীপাড়া', 'মুকসুদপুর', 'কাশিয়ানী']
  },
  {
    name: 'Rajbari',
    bnName: 'রাজবাড়ী',
    division: 'ঢাকা (Dhaka)',
    upazilas: ['রাজবাড়ী সদর', 'পাংশা', 'কালুখালী', 'বালিয়াকান্দি', 'গোয়ালন্দ']
  },
  {
    name: 'Shariatpur',
    bnName: 'শরীয়তপুর',
    division: 'ঢাকা (Dhaka)',
    upazilas: ['শরীয়তপুর সদর', 'নড়িয়া', 'জাজিরা', 'গোসাইরহাট', 'ভেদরগঞ্জ', 'ডামুড্যা']
  },

  // 2. CHATTOGRAM DIVISION (11 Districts)
  {
    name: 'Chattogram',
    bnName: 'চট্টগ্রাম',
    division: 'চট্টগ্রাম (Chattogram)',
    upazilas: ['চট্টগ্রাম সদর/কোতোয়ালী', 'পাহাড়তলী', 'পাঁচলাইশ', 'হালিশহর', 'খুলশী', 'পটিয়া', 'হাটহাজারী', 'রাউজান', 'রাঙ্গুনিয়া', 'সীতাকুণ্ড', 'মিরসরাই', 'বোয়ালখালী', 'বাঁশখালী', 'আনোয়ারা', 'চন্দনাইশ', 'সাতকানিয়া', 'লোহাগাড়া', 'সন্দ্বীপ']
  },
  {
    name: 'Coxsbazar',
    bnName: 'কক্সবাজার',
    division: 'চট্টগ্রাম (Chattogram)',
    upazilas: ['কক্সবাজার সদর', 'উখিয়া', 'টেকনাফ', 'চকরিয়া', 'পেকুয়া', 'মহেশখালী', 'কুতুবদিয়া', 'ঈদগাঁও', 'রামু']
  },
  {
    name: 'Cumilla',
    bnName: 'কুমিল্লা',
    division: 'চট্টগ্রাম (Chattogram)',
    upazilas: ['কুমিল্লা সদর', 'সদর দক্ষিণ', 'দাউদকান্দি', 'চান্দিনা', 'লাকসাম', 'চৌদ্দগ্রাম', 'দেবিদ্বার', 'হোমনা', 'মুরাদনগর', 'বুড়িচং', 'ব্রাহ্মণপাড়া', 'মনোহরগঞ্জ', 'মেঘনা', 'তিতাস', 'নাঙ্গলকোট', 'বরুড়া', 'লালমাই']
  },
  {
    name: 'Feni',
    bnName: 'ফেনী',
    division: 'চট্টগ্রাম (Chattogram)',
    upazilas: ['ফেনী সদর', 'দাগনভূঞা', 'ছাগলনাইয়া', 'পরশুরাম', 'ফুলগাজী', 'সোনাগাজী']
  },
  {
    name: 'Brahmanbaria',
    bnName: 'ব্রাহ্মণবাড়িয়া',
    division: 'চট্টগ্রাম (Chattogram)',
    upazilas: ['ব্রাহ্মণবাড়িয়া সদর', 'আখাউড়া', 'আশুগঞ্জ', 'কসবা', 'নবীনগর', 'নাসিরনগর', 'বাঞ্ছারামপুর', 'সরাইল', 'বিজয়নগর']
  },
  {
    name: 'Noakhali',
    bnName: 'নোয়াখালী',
    division: 'চট্টগ্রাম (Chattogram)',
    upazilas: ['নোয়াখালী সদর (সুধারাম)', 'বেগমগঞ্জ (চৌমুহনী)', 'সেনবাগ', 'কোম্পানীগঞ্জ', 'চাটখিল', 'হাঁতিয়া', 'কবিরহাট', 'সুবর্ণচর', 'সোনাইমুড়ী']
  },
  {
    name: 'Chandpur',
    bnName: 'চাঁদপুর',
    division: 'চট্টগ্রাম (Chattogram)',
    upazilas: ['চাঁদপুর সদর', 'হাজীগঞ্জ', 'মতলব উত্তর', 'মতলব দক্ষিণ', 'শাহরাস্তি', 'ফরিদগঞ্জ', 'হাইমচর', 'কচুয়া']
  },
  {
    name: 'Lakshmipur',
    bnName: 'লক্ষ্মীপুর',
    division: 'চট্টগ্রাম (Chattogram)',
    upazilas: ['লক্ষ্মীপুর সদর', 'রায়পুর', 'রামগঞ্জ', 'রামগতি', 'কমলনগর']
  },
  {
    name: 'Rangamati',
    bnName: 'রাঙ্গামাটি',
    division: 'চট্টগ্রাম (Chattogram)',
    upazilas: ['রাঙ্গামাটি সদর', 'কাপ্তাই', 'কাউখালী', 'বাঘাইছড়ি', 'লংগদু', 'নানিয়ারচর', 'রাজস্থলী', 'বিলাইছড়ি', 'জুরাছড়ি', 'বরকল']
  },
  {
    name: 'Khagrachhari',
    bnName: 'খাগড়াছড়ি',
    division: 'চট্টগ্রাম (Chattogram)',
    upazilas: ['খাগড়াছড়ি সদর', 'দিঘীনালা', 'পানছড়ি', 'মহালছড়ি', 'মাটিরাঙ্গা', 'মানিকছড়ি', 'রামগড়', 'লক্ষ্মীছড়ি', 'গুযামারা']
  },
  {
    name: 'Bandarban',
    bnName: 'বান্দরবান',
    division: 'চট্টগ্রাম (Chattogram)',
    upazilas: ['বান্দরবান সদর', 'রোয়াংছড়ি', 'রুমা', 'থানচি', 'লামা', 'আলীকদম', 'নাইক্ষ্যংছড়ি']
  },

  // 3. RAJSHAHI DIVISION (8 Districts)
  {
    name: 'Rajshahi',
    bnName: 'রাজশাহী',
    division: 'রাজশাহী (Rajshahi)',
    upazilas: ['বোয়ালিয়া', 'রাজশাহী সদর', 'পবা', 'গোদাগাড়ী', 'তানোর', 'মোহনপুর', 'বাগমারা', 'দুর্গাপুর', 'পুঠিয়া', 'চারঘাট', 'বাঘা']
  },
  {
    name: 'Bogra',
    bnName: 'বগুড়া',
    division: 'রাজশাহী (Rajshahi)',
    upazilas: ['বগুড়া সদর', 'শাজাহানপুর', 'শেরপুর', 'শিবগঞ্জ', 'গাবতলী', 'ধুনট', 'নন্দীগ্রাম', 'কাহালু', 'দুপচাঁচিয়া', 'আদমদীঘি', 'সারিয়াকান্দি', 'সোনারায়']
  },
  {
    name: 'Pabna',
    bnName: 'পাবনা',
    division: 'রাজশাহী (Rajshahi)',
    upazilas: ['পাবনা সদর', 'ঈশ্বরদী', 'আটঘরিয়া', 'চাটমোহর', 'ভাঙ্গুড়া', 'ফরিদপুর', 'বেড়া', 'সাঁথিয়া', 'সুজানগর']
  },
  {
    name: 'Sirajganj',
    bnName: 'সিরাজগঞ্জ',
    division: 'রাজশাহী (Rajshahi)',
    upazilas: ['সিরাজগঞ্জ সদর', 'শাহজাদপুর', 'উল্লাপাড়া', 'বেলকুচি', 'কামারখন্দ', 'কাজীপুর', 'রায়গঞ্জ', 'তাড়াশ', 'চৌহালী']
  },
  {
    name: 'Natore',
    bnName: 'নাটোর',
    division: 'রাজশাহী (Rajshahi)',
    upazilas: ['নাটোর সদর', 'সিংড়া', 'বড়াইগ্রাম', 'গুরুদাসপুর', 'লালপুর', 'বাগাতিপাড়া', 'নলডাঙ্গা']
  },
  {
    name: 'Naogaon',
    bnName: 'নওগাঁ',
    division: 'রাজশাহী (Rajshahi)',
    upazilas: ['নওগাঁ সদর', 'মহাদেবপুর', 'মান্দা', 'বদলগাছী', 'পত্নীতলা', 'ধামইরহাট', 'নিয়ামতপুর', 'সাপাহার', 'পোরশা', 'রাণীনগর', 'আত্রাই']
  },
  {
    name: 'Chapainawabganj',
    bnName: 'চাঁপাইনবাবগঞ্জ',
    division: 'রাজশাহী (Rajshahi)',
    upazilas: ['চাঁপাইনবাবগঞ্জ সদর', 'শিবগঞ্জ', 'গোমস্তাপুর', 'নাচোল', 'ভোলাহাট']
  },
  {
    name: 'Joypurhat',
    bnName: 'জয়পুরহাট',
    division: 'রাজশাহী (Rajshahi)',
    upazilas: ['জয়পুরহাট সদর', 'পাঁচবিবি', 'কালাই', 'ক্ষেতলাল', 'আক্কেলপুর']
  },

  // 4. KHULNA DIVISION (10 Districts)
  {
    name: 'Khulna',
    bnName: 'খুলনা',
    division: 'খুলনা (Khulna)',
    upazilas: ['খুলনা সদর', 'সোনাডাঙ্গা', 'খালিশপুর', 'দৌলতপুর', 'খানজাহান আলী', 'বটিয়াঘাটা', 'ডুমুরিয়া', 'ফুলাতলা', 'দিঘলিয়া', 'রূপসা', 'তেরখাদা', 'পাইকগাছা', 'কয়রা', 'দাকোপ']
  },
  {
    name: 'Jashore',
    bnName: 'যশোর',
    division: 'খুলনা (Khulna)',
    upazilas: ['যশোর সদর', 'ঝিকরগাছা', 'শার্শা', 'চৌগাছা', 'মণিরামপুর', 'কেশবপুর', 'বাঘারপাড়া', 'অভয়নগর']
  },
  {
    name: 'Kushtia',
    bnName: 'কুষ্টিয়া',
    division: 'খুলনা (Khulna)',
    upazilas: ['কুষ্টিয়া সদর', 'কুমারখালী', 'খোকসা', 'মিরপুর', 'ভেড়ামারা', 'দৌলতপুর']
  },
  {
    name: 'Jhenaidah',
    bnName: 'ঝিনাইদহ',
    division: 'খুলনা (Khulna)',
    upazilas: ['ঝিনাইদহ সদর', 'কালীগঞ্জ', 'শৈলকুপা', 'হরিণাকুণ্ডু', 'কোটচাঁদপুর', 'মহেশপুর']
  },
  {
    name: 'Satkhira',
    bnName: 'সাতক্ষীরা',
    division: 'খুলনা (Khulna)',
    upazilas: ['সাতক্ষীরা সদর', 'কলারোয়া', 'তালা', 'দেবহাটা', 'কালীগঞ্জ', 'আশাশুনি', 'শ্যামনগর']
  },
  {
    name: 'Bagerhat',
    bnName: 'বাগেরহাট',
    division: 'খুলনা (Khulna)',
    upazilas: ['বাগেরহাট সদর', 'ফকিরহাট', 'মোল্লাহাট', 'চিতলমারী', 'কচুয়া', 'রামপাল', 'মোংলা', 'মোড়েলগঞ্জ', 'শরণখোলা']
  },
  {
    name: 'Chuadanga',
    bnName: 'চুয়াডাঙ্গা',
    division: 'খুলনা (Khulna)',
    upazilas: ['চুয়াডাঙ্গা সদর', 'আলমডাঙ্গা', 'দামুড়হুদা', 'জীবননগর']
  },
  {
    name: 'Meherpur',
    bnName: 'মেহেরপুর',
    division: 'খুলনা (Khulna)',
    upazilas: ['মেহেরপুর সদর', 'গাংনী', 'মুজিবনগর']
  },
  {
    name: 'Narail',
    bnName: 'নড়াইল',
    division: 'খুলনা (Khulna)',
    upazilas: ['নড়াইল সদর', 'লোহাগড়া', 'কালিয়া']
  },
  {
    name: 'Magura',
    bnName: 'মাগুরা',
    division: 'খুলনা (Khulna)',
    upazilas: ['মাগুরা সদর', 'শ্রীপুর', 'শালিখা', 'মহম্মদপুর']
  },

  // 5. BARISHAL DIVISION (6 Districts)
  {
    name: 'Barishal',
    bnName: 'বরিশাল',
    division: 'বরিশাল (Barishal)',
    upazilas: ['বরিশাল সদর', 'বাকেরগঞ্জ', 'বাবুগঞ্জ', 'উজিরপুর', 'গৌরনদী', 'আগৈলঝাড়া', 'মুলাদী', 'মেহেন্দিগঞ্জ', 'হিজলা', 'বানারীপাড়া']
  },
  {
    name: 'Patuakhali',
    bnName: 'পটুয়াখালী',
    division: 'বরিশাল (Barishal)',
    upazilas: ['পটুয়াখালী সদর', 'গলাচিপা', 'দশমিনা', 'বাউফল', 'মির্জাগঞ্জ', 'দুমকী', 'কলাপাড়া (কুয়াকাটা)', 'রাঙ্গাবালী']
  },
  {
    name: 'Bhola',
    bnName: 'ভোলা',
    division: 'বরিশাল (Barishal)',
    upazilas: ['ভোলা সদর', 'বোরহানউদ্দিন', 'দৌলতখান', 'তজুমদ্দিন', 'লালমোহন', 'চরফ্যাশন', 'মনপুরা']
  },
  {
    name: 'Pirojpur',
    bnName: 'পিরোজপুর',
    division: 'বরিশাল (Barishal)',
    upazilas: ['পিরোজপুর সদর', 'নেছারাবাদ (স্বরূপকাঠি)', 'কাউখালী', 'ভান্ডারিয়া', 'মঠবাড়িয়া', 'নাজিরপুর', 'ইন্দুরকানী']
  },
  {
    name: 'Barguna',
    bnName: 'বরগুনা',
    division: 'বরিশাল (Barishal)',
    upazilas: ['বরগুনা সদর', 'আমতলী', 'পাথরঘাটা', 'বেতাগী', 'বামনা', 'তালতলী']
  },
  {
    name: 'Jhalokathi',
    bnName: 'ঝালকাঠি',
    division: 'বরিশাল (Barishal)',
    upazilas: ['ঝালকাঠি সদর', 'নলছিটি', 'রাজাপুর', 'কাঠালিয়া']
  },

  // 6. SYLHET DIVISION (4 Districts)
  {
    name: 'Sylhet',
    bnName: 'সিলেট',
    division: 'সিলেট (Sylhet)',
    upazilas: ['সিলেট সদর/কোতোয়ালী', 'দক্ষিণ সুরমা', 'গোলাপগঞ্জ', 'বীনিবাজার', 'জৈন্তাপুর', 'কানাইঘাট', 'জকিগঞ্জ', 'কোম্পানীগঞ্জ', 'গোয়াইনঘাট', 'ফেঞ্চুগঞ্জ', 'বলাগঞ্জ', 'বিশ্বনাথ', 'ওসমানীনগর']
  },
  {
    name: 'Moulvibazar',
    bnName: 'মৌলভীবাজার',
    division: 'সিলেট (Sylhet)',
    upazilas: ['মৌলভীবাজার সদর', 'শ্রীমঙ্গল', 'কমলগঞ্জ', 'কুলাউড়া', 'বড়লেখা', 'জুড়ী', 'রাজনগর']
  },
  {
    name: 'Habiganj',
    bnName: 'হবিগঞ্জ',
    division: 'সিলেট (Sylhet)',
    upazilas: ['হবিগঞ্জ সদর', 'নবীগঞ্জ', 'বাহুবল', 'চুনারুঘাট', 'মাধবপুর', 'লাখাই', 'আজমিরীগঞ্জ', 'বানিয়াচং', 'শায়েস্তাগঞ্জ']
  },
  {
    name: 'Sunamganj',
    bnName: 'সুনামগঞ্জ',
    division: 'সিলেট (Sylhet)',
    upazilas: ['সুনামগঞ্জ সদর', 'ছাতক', 'দোয়ারাবাজার', 'জগন্নাথপুর', 'দক্ষিণ সুনামগঞ্জ (শান্তিগঞ্জ)', 'দিরই', 'শাল্লা', 'বিশ্বম্ভরপুর', 'তাহিরপুর', 'জামালগঞ্জ', 'ধর্মপাশা', 'মধ্যনগর']
  },

  // 7. RANGPUR DIVISION (8 Districts)
  {
    name: 'Rangpur',
    bnName: 'রংপুর',
    division: 'রংপুর (Rangpur)',
    upazilas: ['রংপুর সদর', 'মিঠাপুকুর', 'পীরগঞ্জ', 'পীরগাছা', 'কাউনিয়া', 'গঙ্গাচড়া', 'বদরগঞ্জ', 'তারাগঞ্জ']
  },
  {
    name: 'Dinajpur',
    bnName: 'দিনাজপুর',
    division: 'রংপুর (Rangpur)',
    upazilas: ['দিনাজপুর সদর', 'বীরগঞ্জ', 'কাহারোল', 'বোচাগঞ্জ', 'বিরল', 'ফুলবাড়ী', 'পার্বতীপুর', 'নবাবগঞ্জ', 'বিরামপুর', 'হাকিমপুর', 'ঘোড়াঘাট', 'চিরিরবন্দর', 'খানসামা']
  },
  {
    name: 'Gaibandha',
    bnName: 'গাইবান্ধা',
    division: 'রংপুর (Rangpur)',
    upazilas: ['গাইবান্ধা সদর', 'গোবিন্দগঞ্জ', 'সুন্দরগঞ্জ', 'সাদুল্লাপুর', 'পলাশবাড়ী', 'সাঘাটা', 'ফুলছড়ি']
  },
  {
    name: 'Kurigram',
    bnName: 'কুড়িগ্রাম',
    division: 'রংপুর (Rangpur)',
    upazilas: ['কুড়িগ্রাম সদর', 'উলিপুর', 'নাগেশ্বরী', 'ফুলবাড়ী', 'ভুরুঙ্গামারী', 'রাজারহাট', 'চিলমারী', 'রৌমারী', 'চর রাজিবপুর']
  },
  {
    name: 'Nilphamari',
    bnName: 'নীলফামারী',
    division: 'রংপুর (Rangpur)',
    upazilas: ['নীলফামারী সদর', 'সৈয়দপুর', 'ডিমলা', 'ডুমুরিয়া', 'জলঢাকা', 'কিশোরগঞ্জ']
  },
  {
    name: 'Lalmonirhat',
    bnName: 'লালমনিরহাট',
    division: 'রংপুর (Rangpur)',
    upazilas: ['লালমনিরহাট সদর', 'আদিতমারী', 'কালীগঞ্জ', 'হাতীবান্ধা', 'পাটগ্রাম']
  },
  {
    name: 'Thakurgaon',
    bnName: 'ঠাকুরগাঁও',
    division: 'রংপুর (Rangpur)',
    upazilas: ['ঠাকুরগাঁও সদর', 'পীরগঞ্জ', 'রাণীশংকৈল', 'বালিয়াডাংগী', 'হরিপুর']
  },
  {
    name: 'Panchagarh',
    bnName: 'পঞ্চগড়',
    division: 'রংপুর (Rangpur)',
    upazilas: ['পঞ্চগড় সদর', 'তেঁতুলিয়া', 'বোদা', 'দেবীগঞ্জ', 'আটোয়ারী']
  },

  // 8. MYMENSINGH DIVISION (4 Districts)
  {
    name: 'Mymensingh',
    bnName: 'ময়মনসিংহ',
    division: 'ময়মনসিংহ (Mymensingh)',
    upazilas: ['ময়মনসিংহ সদর', 'মুক্তাগাছা', 'ফুলবাড়ীয়া', 'ত্রিশাল', 'ভালুকা', 'গফরগাঁও', 'নন্দাইল', 'ঈশ্বরগঞ্জ', 'ধোবাউড়া', 'হালুয়াঘাট', 'ফুলপুর', 'তারাকান্দা']
  },
  {
    name: 'Jamalpur',
    bnName: 'জামালপুর',
    division: 'ময়মনসিংহ (Mymensingh)',
    upazilas: ['জামালপুর সদর', 'সরিষাবাড়ী', 'মেলান্দহ', 'ইসলামপুর', 'দেওয়ানগঞ্জ', 'মাদারগঞ্জ', 'বক্সীগঞ্জ']
  },
  {
    name: 'Netrokona',
    bnName: 'নেত্রকোণা',
    division: 'ময়মনসিংহ (Mymensingh)',
    upazilas: ['নেত্রকোণা সদর', 'পূর্বধলা', 'দুর্গাপুর', 'কলমাকান্দা', 'কেন্দুয়া', 'আটপাড়া', 'মদন', 'খালিয়াজুরী', 'মোহনগঞ্জ', 'বারহাট্টা']
  },
  {
    name: 'Sherpur',
    bnName: 'শেরপুর',
    division: 'ময়মনসিংহ (Mymensingh)',
    upazilas: ['শেরপুর সদর', 'নালীতাবাড়ী', 'শ্রীবরদী', 'ঝিনাইগাতী', 'নকলা']
  }
];

/**
 * Gets list of 64 districts in Bengali
 */
export const BD_64_DISTRICTS_BN = BD_ALL_DISTRICTS.map((d) => d.bnName);

/**
 * Helper to fetch upazilas for a given district name
 */
export function getUpazilasForDistrict(districtBnName: string): string[] {
  const match = BD_ALL_DISTRICTS.find((d) => d.bnName === districtBnName || d.name === districtBnName);
  return match ? match.upazilas : ['সদর (Sadar)', 'অন্যান্য এলাকা'];
}
