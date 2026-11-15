# Umrah path content for Releases 3-6. Run from the repo root: python3 tools/src/umrah_r3_r6.py
import json
p='content/umrah.json'; pack=json.load(open(p))
existing={x['id'] for x in pack['items']}
pack['units']=[u for u in pack['units'] if not u['id'].startswith('r3') ]
H=lambda en,ur:{"en":en,"ur":ur}
def it(id,kind,ar,tr,en,ur,**kw):
    d={"id":id,"kind":kind,"ar":ar,"tr":tr,"en":en,"ur":ur}; d.update(kw); return d
def unit(uid,ten,tur,items):
    pack['units'].append({"id":uid,"title":{"en":ten,"ur":tur},"items":[x["id"] for x in items]})
    for x in items:
        if x['id'] in existing: raise SystemExit('dup '+x['id'])
        existing.add(x['id']); pack['items'].append(x)

unit("day14","At the restaurant","ریسٹورنٹ میں",[
 it("um-menu","phrase","عَطْنِي الْمِنْيُو لَوْ سَمَحْتْ","'atni al-menyu law samaht","Give me the menu, please","مینو دے دیں، براہِ کرم"),
 it("um-abghahada","phrase","أَبْغَى هَادَا","abgha hada","I want this one","مجھے یہ چاہیے"),
 it("um-wahidkaman","phrase","وَاحِدْ كَمَانْ","wahid kaman","One more","ایک اور"),
 it("um-bidoonsukkar","phrase","بِدُونْ سُكَّرْ","bidoon sukkar","Without sugar","چینی کے بغیر",hook=H("‘Sukkar’ sounds like ‘shakkar’.","’سکر‘ اور ’شکر‘ ایک جیسے")),
 it("um-bidoonharr","phrase","بِدُونْ حَارّْ","bidoon harr","Not spicy","مرچ کے بغیر"),
 it("um-safari","word","سَفَرِي","safari","Takeaway (Saudi)","ساتھ لے جانے کے لیے",hook=H("From ‘safar’ (journey): food for the road.","’سفر‘ سے: راستے کا کھانا")),
 it("um-mahalli","word","مَحَلِّي","mahalli","Eat in (Saudi)","یہیں کھائیں گے",hook=H("From ‘mahal’ (place), as in Urdu ‘mahal-e-waqoo’.","’محل‘ (جگہ) سے")),
 it("um-kifaya","word","كِفَايَة","kifaya","Enough","کافی ہے",hook=H("Urdu ‘kifayat’ and ‘kaafi’.","اردو ’کفایت‘ اور ’کافی‘")),
 it("um-hisab","phrase","الْحِسَابْ لَوْ سَمَحْتْ","al-hisab law samaht","The bill, please","بل دے دیں، براہِ کرم",hook=H("Urdu ‘hisaab’.","اردو ’حساب‘")),
 it("um-lazeez","word","لَذِيذْ","lazeez","Delicious","مزیدار",hook=H("Urdu ‘lazeez’.","اردو ’لذیذ‘")),
])
unit("day15","Food and drink","کھانا پینا",[
 it("um-dajaj","word","دَجَاجْ","dajaj","Chicken","مرغی"),
 it("um-laham","word","لَحَمْ","laham","Meat","گوشت",hook=H("Urdu ‘lahm’ in ‘lahmi’ dishes.","’لحم‘ = گوشت")),
 it("um-ruzz","word","رُزّْ","ruzz","Rice","چاول"),
 it("um-samak","word","سَمَكْ","samak","Fish","مچھلی"),
 it("um-aseer","word","عَصِيرْ","'aseer","Juice","جوس"),
 it("um-haleeb","word","حَلِيبْ","haleeb","Milk","دودھ",hook=H("‘Haleem’ is different; think ‘halib’ = milking.","حلیب = دودھ")),
 it("um-tamr","word","تَمْرْ","tamr","Dates (fruit)","کھجور",hook=H("‘Tamar Hindi’ = ‘Indian date’ (tamarind).","’تمر ہندی‘ = املی")),
 it("um-kabsa","word","كَبْسَة","kabsa","Kabsa (Saudi rice dish)","کبسہ (سعودی چاول)"),
 it("um-abghakabsa","phrase","أَبْغَى كَبْسَة دَجَاجْ","abgha kabsa dajaj","I want chicken kabsa","مجھے مرغی کا کبسہ چاہیے"),
 it("um-gahwaarabi","phrase","قَهْوَة عَرَبِي وَتَمْرْ","gahwa 'arabi wa tamr","Arabic coffee and dates","عربی قہوہ اور کھجور"),
])
unit("day16","Shopping","خریداری",[
 it("um-bas","phrase","بَسْ أَتْفَرَّجْ","bas atfarraj","Just looking","بس دیکھ رہا ہوں",hook=H("‘Bas’ = only, as in Urdu.","’بس‘ اردو کی طرح")),
 it("um-indak","phrase","عِنْدَكْ هَادَا؟","'indak hada?","Do you have this? (to a man)","کیا آپ کے پاس یہ ہے؟",ar_f="عِنْدِكْ هَادَا؟",tr_f="'indik hada?",en_f="Do you have this? (to a woman)"),
 it("um-kamsiruh","phrase","كَمْ سِعْرُهْ؟","kam si'ruh?","How much is it?","اس کی قیمت کتنی ہے؟",hook=H("‘Si’r’ = price, as in Urdu ‘nirkh’… think ‘sa’ar’.","’سعر‘ = قیمت")),
 it("um-akhirsir","phrase","آخِرْ سِعْرْ؟","akhir si'r?","Last price? (best price)","آخری قیمت؟",hook=H("‘Akhir’ = last, as in Urdu ‘aakhir’.","’آخر‘ اردو کی طرح")),
 it("um-nazzil","phrase","نَزِّلْ شْوَيَّة","nazzil shwayya","Lower it a little (to a man)","تھوڑا کم کریں",ar_f="نَزِّلِي شْوَيَّة",tr_f="nazzili shwayya",en_f="Lower it a little (to a woman)",hook=H("‘Nuzool’ = coming down.","’نزول‘ = نیچے آنا")),
 it("um-magas","word","مَقَاسْ","magas","Size (Saudi say q as g)","سائز",hook=H("‘Qiyas’ = measure.","’قیاس‘ = اندازہ")),
 it("um-akbar","word","أَكْبَرْ","akbar","Bigger","بڑا",hook=H("As in ‘Allahu Akbar’.","جیسے ’اللہ اکبر‘")),
 it("um-asghar","word","أَصْغَرْ","asghar","Smaller","چھوٹا",hook=H("Urdu ‘sagheer’ (small).","اردو ’صغیر‘")),
 it("um-lontani","phrase","لَوْنْ ثَانِي","lon tani","Another colour","دوسرا رنگ",hook=H("‘Sani’ = second, as in Urdu ‘saani’.","’ثانی‘ = دوسرا")),
 it("um-khalas","phrase","خَلَاصْ، آخُذُهْ","khalas, akhudhuh","Okay, I'll take it","ٹھیک ہے، میں لے لیتا ہوں",hook=H("‘Khalas’ = done, like Urdu ‘khalaas’.","’خلاص‘ = بس، ختم")),
 it("um-adfa","phrase","أَدْفَعْ بِالْبَطَاقَة؟","adfa' bil-bitaqa?","Can I pay by card?","کیا میں کارڈ سے ادائیگی کر سکتا ہوں؟"),
])
unit("day17","Gifts and souvenirs","تحفے",[
 it("um-hadiyya","word","هَدِيَّة","hadiyya","Gift","تحفہ",hook=H("Urdu ‘hadiya’.","اردو ’ہدیہ‘")),
 it("um-miswak","word","مِسْوَاكْ","miswak","Miswak (tooth stick)","مسواک"),
 it("um-itr","word","عِطْرْ","'itr","Perfume, attar","عطر"),
 it("um-sajjada","word","سَجَّادَة","sajjada","Prayer mat","جائے نماز",hook=H("Urdu ‘sajjada’, from ‘sajda’.","’سجادہ‘، ’سجدہ‘ سے")),
 it("um-sibha","word","سِبْحَة","sibha","Prayer beads","تسبیح",hook=H("From ‘subhanallah’.","’سبحان اللہ‘ سے")),
 it("um-mushaf","word","مُصْحَفْ","mushaf","Copy of the Qur'an","قرآن کا نسخہ"),
 it("um-zamzam","word","زَمْزَمْ","zamzam","Zamzam water","آبِ زمزم"),
 it("um-abaya","word","عَبَايَة","'abaya","Abaya (cloak)","عبایا"),
 it("um-kees","word","كِيسْ","kees","Bag (shopping bag)","تھیلی"),
])
unit("day18","Masjid an-Nabawi","مسجدِ نبوی",[
 it("um-nabawi","phrase","الْمَسْجِدُ النَّبَوِيّْ","al-masjid an-nabawi","The Prophet's Mosque","مسجدِ نبوی"),
 it("um-fenbabsalam","phrase","فِينْ بَابْ السَّلَامْ؟","fen bab as-salam?","Where is Bab as-Salam (gate)?","باب السلام کہاں ہے؟"),
 it("um-rawda","word","الرَّوْضَة","ar-rawda","The Rawdah","ریاض الجنۃ (روضہ)"),
 it("um-tasreeh","phrase","عِنْدِي تَصْرِيحْ لِلرَّوْضَة","'indi tasreeh lir-rawda","I have a permit for the Rawdah","میرے پاس روضہ کا اجازت نامہ ہے",hook=H("‘Tasreeh’ = permission, as in Urdu ‘tasreeh’ (explanation) — different meaning.","’تصریح‘ یہاں اجازت نامہ ہے")),
 it("um-qubba","phrase","الْقُبَّةُ الْخَضْرَاءْ","al-qubbatu l-khadra'","The Green Dome","گنبدِ خضریٰ",hook=H("Urdu ‘Gumbad-e-Khazra’.","اردو ’گنبدِ خضریٰ‘")),
 it("um-musalla","phrase","مُصَلَّى النِّسَاءْ","musalla an-nisa'","Women's prayer area","خواتین کی نماز کی جگہ",hook=H("‘Musalla’ = prayer place, as in Urdu.","’مصلیٰ‘ اردو کی طرح")),
 it("um-salamrasool","dua","السَّلَامُ عَلَيْكَ يَا رَسُولَ اللَّهِ","as-salamu 'alayka ya rasoolallah","Peace be upon you, O Messenger of Allah","السلام علیک یا رسول اللہ"),
 it("um-baqee","word","الْبَقِيعْ","al-baqee'","Al-Baqi' (cemetery)","جنت البقیع"),
 it("um-quba","phrase","مَسْجِدْ قُبَاءْ","masjid quba'","Quba Mosque","مسجدِ قبا"),
 it("um-uhud","phrase","جَبَلْ أُحُدْ","jabal uhud","Mount Uhud","جبلِ احد",hook=H("‘Jabal’ = mountain (Jabal-ut-Tariq = Gibraltar).","’جبل‘ = پہاڑ")),
])
unit("day19","Prayer and the masjid","نماز اور مسجد",[
 it("um-adhan","word","الْأَذَانْ","al-adhan","The call to prayer","اذان"),
 it("um-iqama","word","الْإِقَامَة","al-iqama","The call to stand for prayer","اقامت"),
 it("um-fajr","phrase","صَلَاةُ الْفَجْرْ","salat al-fajr","Fajr prayer","فجر کی نماز"),
 it("um-dhuhr","word","الظُّهْرْ","adh-dhuhr","Dhuhr (midday prayer)","ظہر",hook=H("Urdu ‘zuhr’; Arabic ظ is a heavy dh.","اردو ’ظہر‘؛ عربی میں ظ بھاری ذ")),
 it("um-asr","word","الْعَصْرْ","al-'asr","Asr (afternoon prayer)","عصر"),
 it("um-maghrib","word","الْمَغْرِبْ","al-maghrib","Maghrib (sunset prayer)","مغرب"),
 it("um-isha","word","الْعِشَاءْ","al-'isha'","Isha (night prayer)","عشاء"),
 it("um-mataadhan","phrase","مَتَى الْأَذَانْ؟","mata al-adhan?","When is the adhan?","اذان کب ہے؟"),
 it("um-wudu","word","الْوُضُوءْ","al-wudu'","Ablution","وضو"),
 it("um-feehmakan","phrase","فِيهْ مَكَانْ؟","feeh makan?","Is there space?","جگہ ہے؟",hook=H("‘Makan’ = place, as in Urdu ‘makaan’ (house).","’مکان‘ = جگہ")),
])
unit("day20","Reading signs","سائن بورڈ پڑھنا",[
 it("um-s-makhraj","sign","مَخْرَج","makhraj","Exit","باہر جانے کا راستہ",hook=H("Urdu ‘makhraj’ (outlet), from ‘kharij’ (out).","’خارج‘ سے")),
 it("um-s-madkhal","sign","مَدْخَل","madkhal","Entrance","داخلہ",hook=H("From ‘dakhil’ (enter), as in Urdu ‘daakhla’.","’داخل‘ سے")),
 it("um-s-rijal","sign","رِجَال","rijal","Men","مرد",hook=H("Urdu ‘rijaal’ (men).","اردو ’رجال‘")),
 it("um-s-nisa","sign","نِسَاء","nisa'","Women","خواتین",hook=H("Surah An-Nisa = ‘The Women’.","سورۃ النساء")),
 it("um-s-miyah","sign","دَوْرَاتُ الْمِيَاه","dawrat al-miyah","Toilets (on signs)","بیت الخلا"),
 it("um-s-tasweer","sign","مَمْنُوعُ التَّصْوِير","mamnoo' at-tasweer","No photography","تصویر کھینچنا منع ہے",hook=H("‘Mamnoo’’ = forbidden (Urdu ‘mamnoo’’); ‘tasveer’ = picture.","’ممنوع‘ اور ’تصویر‘ اردو کی طرح")),
 it("um-s-mawaqif","sign","مَوَاقِف","mawaqif","Parking","پارکنگ",hook=H("From ‘waqf’ (stop), as in ‘mauqif’ (position).","’موقف‘ سے")),
 it("um-s-maftooh","sign","مَفْتُوح","maftooh","Open","کھلا",hook=H("From ‘fatah’ (opening).","’فتح‘ سے")),
 it("um-s-mughlaq","sign","مُغْلَق","mughlaq","Closed","بند"),
 it("um-s-tawari","sign","طَوَارِئ","tawari'","Emergency","ایمرجنسی"),
 it("um-s-istilamat","sign","اِسْتِعْلَامَات","isti'lamat","Information desk","معلومات کاؤنٹر",hook=H("From ‘ilm’ (knowledge), as in ‘ittila’’ (notice).","’علم‘ اور ’اطلاع‘ سے")),
])
unit("day21","Ihram and the miqat","احرام اور میقات",[
 it("um-meeqat","word","الْمِيقَاتْ","al-meeqat","The miqat (boundary for ihram)","میقات"),
 it("um-ihram","word","الْإِحْرَامْ","al-ihram","Ihram","احرام"),
 it("um-niyya","word","النِّيَّة","an-niyya","Intention","نیت"),
 it("um-labbaykumra","dua","لَبَّيْكَ اللَّهُمَّ عُمْرَةً","labbayka llahumma 'umratan","Here I am, O Allah, for Umrah","حاضر ہوں اے اللہ، عمرے کے لیے"),
 it("um-abyarali","phrase","أَبْيَارْ عَلِي","abyar 'ali","Abyar Ali (the miqat of Madinah)","ابیارِ علی (مدینہ کی میقات)"),
 it("um-kambaqi","phrase","كَمْ بَاقِي عَلَى الْمِيقَاتْ؟","kam baqi 'ala l-meeqat?","How far is it to the miqat?","میقات کتنی دور ہے؟",hook=H("‘Baqi’ = remaining, as in Urdu ‘baaqi’.","’باقی‘ اردو کی طرح")),
 it("um-ghusl","word","غُسْلْ","ghusl","Ritual bath","غسل"),
])
unit("day22","The Haram and tawaf","حرم اور طواف",[
 it("um-masjidharam","phrase","الْمَسْجِدُ الْحَرَامْ","al-masjid al-haram","The Sacred Mosque (Makkah)","مسجدِ حرام"),
 it("um-kaaba","word","الْكَعْبَة","al-ka'ba","The Ka'bah","کعبہ"),
 it("um-tawaf","word","الطَّوَافْ","at-tawaf","Tawaf (circling the Ka'bah)","طواف"),
 it("um-shawt","phrase","سَبْعَةُ أَشْوَاطْ","sab'atu ashwat","Seven rounds","سات چکر"),
 it("um-hajaraswad","phrase","الْحَجَرُ الْأَسْوَدْ","al-hajar al-aswad","The Black Stone","حجرِ اسود"),
 it("um-bismillahakbar","dua","بِسْمِ اللَّهِ وَاللَّهُ أَكْبَرُ","bismillahi wallahu akbar","In the name of Allah, Allah is the Greatest (at the Black Stone)","اللہ کے نام سے، اللہ سب سے بڑا ہے"),
 it("um-rukn","phrase","الرُّكْنُ الْيَمَانِي","ar-ruknu l-yamani","The Yemeni Corner","رکنِ یمانی"),
 {"id":"um-rabbana","kind":"ayah","quran":"2:201","ar":"","tr":"rabbana atina fi d-dunya hasanatan wa fi l-akhirati hasanatan wa qina 'adhaba n-nar","en":"Our Lord, give us good in this world and good in the Hereafter, and protect us from the punishment of the Fire.","ur":"اے ہمارے رب، ہمیں دنیا میں بھی بھلائی دے اور آخرت میں بھی بھلائی، اور ہمیں آگ کے عذاب سے بچا۔"},
 it("um-maqam","phrase","مَقَامُ إِبْرَاهِيمْ","maqamu ibraheem","The Station of Ibrahim","مقامِ ابراہیم"),
 it("um-mataf","phrase","صَحْنُ الْمَطَافْ","sahn al-mataf","The tawaf courtyard","مطاف کا صحن",hook=H("‘Sahn’ = courtyard, as in Urdu.","’صحن‘ اردو کی طرح")),
])
unit("day23","Sa'i and finishing Umrah","سعی اور عمرہ مکمل",[
 it("um-sai","word","السَّعْيْ","as-sa'i","Sa'i (walking between Safa and Marwah)","سعی",hook=H("‘Sa’i’ = effort, as in Urdu ‘sa’i’.","’سعی‘ = کوشش")),
 it("um-safa","word","الصَّفَا","as-safa","Safa (hill)","صفا"),
 it("um-marwa","word","الْمَرْوَة","al-marwa","Marwah (hill)","مروہ"),
 it("um-halq","word","الْحَلْقْ","al-halq","Shaving the head","حلق (سر منڈوانا)"),
 it("um-taqseer","word","التَّقْصِيرْ","at-taqseer","Shortening the hair","تقصیر (بال چھوٹے کرنا)"),
 it("um-fenhallaq","phrase","فِينْ الْحَلَّاقْ؟","fen al-hallaq?","Where is the barber?","حجام کہاں ہے؟"),
 it("um-taqabbal","phrase","تَقَبَّلَ اللَّهُ","taqabbal allah","May Allah accept it","اللہ قبول فرمائے"),
 it("um-umramaqbula","phrase","عُمْرَة مَقْبُولَة","'umra maqbula","May your Umrah be accepted","عمرہ مقبول ہو"),
])
unit("day24","Help and health","مدد اور صحت",[
 it("um-saidni","phrase","سَاعِدْنِي لَوْ سَمَحْتْ","sa'idni law samaht","Help me, please (to a man)","میری مدد کریں",ar_f="سَاعْدِينِي لَوْ سَمَحْتِ",tr_f="sa'deeni law samahti",en_f="Help me, please (to a woman)"),
 it("um-diit","phrase","ضِعْتْ","di't","I'm lost","میں راستہ بھول گیا",hook=H("Urdu ‘zaaya’ (lost, wasted) is the same root.","’ضائع‘ کا مادہ")),
 it("um-qareebharam","phrase","فُنْدُقِي قَرِيبْ مِنَ الْحَرَمْ","funduqi qareeb min al-haram","My hotel is near the Haram","میرا ہوٹل حرم کے قریب ہے"),
 it("um-tabaan","phrase","أَنَا تَعْبَانْ","ana ta'ban","I am tired / unwell (man)","میں تھکا ہوا / بیمار ہوں",ar_f="أَنَا تَعْبَانَة",tr_f="ana ta'bana",en_f="I am tired / unwell (woman)"),
 it("um-suda","phrase","عِنْدِي صُدَاعْ","'indi suda'","I have a headache","میرے سر میں درد ہے"),
 it("um-mustashfa","word","مُسْتَشْفَى","mustashfa","Hospital","ہسپتال",hook=H("From ‘shifa’ (cure).","’شفا‘ سے")),
 it("um-saydaliyya","word","صَيْدَلِيَّة","saydaliyya","Pharmacy","دواخانہ"),
 it("um-dawa","word","دَوَاءْ","dawa'","Medicine","دوا",hook=H("Urdu ‘dawa’.","اردو ’دوا‘")),
 it("um-isaf","word","إِسْعَافْ","is'af","Ambulance","ایمبولینس"),
 it("um-shurta","word","الشُّرْطَة","ash-shurta","Police","پولیس"),
 it("um-dajawwali","phrase","ضَاعْ جَوَّالِي","da' jawwali","I lost my phone","میرا فون کھو گیا"),
 it("um-harrmarra","phrase","حَرّْ مَرَّة","harr marra","It's very hot","بہت گرمی ہے",hook=H("‘Harr’ = heat, as in Urdu ‘haraarat’.","’حرارت‘ کا مادہ")),
])
unit("day25","Travel between cities","شہروں کے درمیان سفر",[
 it("um-qitar","phrase","قِطَارُ الْحَرَمَيْنْ","qitar al-haramayn","The Haramain train","حرمین ٹرین",hook=H("‘Qataar’ = a line/row, as in Urdu.","’قطار‘ اردو کی طرح")),
 it("um-mahatta","word","مَحَطَّة","mahatta","Station","اسٹیشن"),
 it("um-tadhkara","word","تَذْكَرَة","tadhkara","Ticket","ٹکٹ",hook=H("Urdu ‘tazkira’ is the same word (a note).","اردو ’تذکرہ‘ یہی لفظ ہے")),
 it("um-makka","word","مَكَّة","makka","Makkah","مکہ"),
 it("um-madina","word","الْمَدِينَة","al-madina","Madinah","مدینہ"),
 it("um-jidda","word","جِدَّة","jidda","Jeddah","جدہ"),
 it("um-kamsaa","phrase","كَمْ سَاعَة لِمَكَّة؟","kam sa'a li-makka?","How many hours to Makkah?","مکہ کتنے گھنٹے کا ہے؟",hook=H("‘Sa’at’ = hour, as in Urdu.","’ساعت‘ = گھنٹہ")),
 it("um-matayitla","phrase","مَتَى يِطْلَعْ؟","mata yitla'?","When does it leave?","یہ کب نکلتی ہے؟",hook=H("‘Tulu’’ = rising/going out, as in ‘tulu-e-aftab’.","’طلوع‘ کا مادہ")),
 it("um-bas2","word","بَاصْ","bas","Bus","بس"),
 it("um-magad","word","مَقْعَدْ","mag'ad","Seat","سیٹ",hook=H("Same root as ‘qa’ida’ (sitting).","’قعدہ‘ کا مادہ")),
])
unit("day26","Time and days","وقت اور دن",[
 it("um-alyom","word","الْيَوْمْ","al-yom","Today","آج",hook=H("‘Yaum’ = day.","’یوم‘ = دن")),
 it("um-bukra","word","بُكْرَة","bukra","Tomorrow","کل (آنے والا)"),
 it("um-ams","word","أَمْسْ","ams","Yesterday","کل (گزرا ہوا)"),
 it("um-alheen","word","الْحِينْ","al-heen","Now (Saudi)","ابھی",msa="الْآنَ"),
 it("um-badayn","word","بَعْدَيْنْ","ba'dayn","Later","بعد میں",hook=H("Urdu ‘baad’ (after).","اردو ’بعد‘")),
 it("um-kamassaa","phrase","كَمِ السَّاعَة؟","kam as-sa'a?","What time is it?","کیا وقت ہوا ہے؟"),
 it("um-dageega","word","دَقِيقَة","dageega","Minute (Saudi say q as g)","منٹ",hook=H("Urdu ‘daqeeqa’ (a fine detail; a minute).","اردو ’دقیقہ‘")),
 it("um-kamdageega","phrase","كَمْ دَقِيقَة؟","kam dageega?","How many minutes?","کتنے منٹ؟"),
 it("um-subh","word","الصُّبْحْ","as-subh","Morning","صبح",hook=H("Urdu ‘subah’.","اردو ’صبح‘")),
 it("um-layl","word","بِاللَّيْلْ","bil-layl","At night","رات کو",hook=H("‘Layl’ = night, as in ‘Laila’ and ‘Lailat-ul-Qadr’.","’لیل‘ = رات، لیلۃ القدر")),
])
unit("day27","Blessings and courtesy","دعائیں اور آداب",[
 it("um-insha","phrase","إِنْ شَاءَ اللَّهُ","in sha' allah","If Allah wills","ان شاء اللہ"),
 it("um-masha","phrase","مَا شَاءَ اللَّهُ","ma sha' allah","What Allah has willed (praise)","ما شاء اللہ"),
 it("um-jazak","phrase","جَزَاكَ اللَّهُ خَيْرًا","jazaka llahu khayran","May Allah reward you (to a man)","اللہ آپ کو جزائے خیر دے",ar_f="جَزَاكِ اللَّهُ خَيْرًا",tr_f="jazaki llahu khayran",en_f="May Allah reward you (to a woman)"),
 it("um-barakallah","phrase","بَارَكَ اللَّهُ فِيكْ","baraka llahu feek","May Allah bless you (to a man)","اللہ آپ کو برکت دے",ar_f="بَارَكَ اللَّهُ فِيكِي",tr_f="baraka llahu feeki",en_f="May Allah bless you (to a woman)"),
 it("um-allahyihfazak","phrase","اللَّهْ يِحْفَظَكْ","allah yihfadhak","May Allah protect you (to a man)","اللہ آپ کی حفاظت کرے",ar_f="اللَّهْ يِحْفَظِكْ",tr_f="allah yihfadhik",en_f="May Allah protect you (to a woman)",hook=H("‘Hifazat’ (protection).","’حفاظت‘ کا مادہ")),
 it("um-yateek","phrase","اللَّهْ يِعْطِيكْ الْعَافْيَة","allah ya'teek al-'afya","Thank you for your effort (God give you health)","اللہ آپ کو صحت دے (شکریہ)",hook=H("‘Afiyat’ = well-being, as in Urdu.","’عافیت‘ اردو کی طرح")),
 it("um-maaleesh","word","مَعْلِيشْ","ma'leesh","Never mind / sorry","کوئی بات نہیں"),
 it("um-asif","word","آسِفْ","asif","Sorry (man)","معاف کیجیے",ar_f="آسْفَة",tr_f="asfa",en_f="Sorry (woman)"),
 it("um-tafaddal","word","تَفَضَّلْ","tafaddal","Please, go ahead / here you are (to a man)","تشریف لائیں / یہ لیجیے",ar_f="تَفَضَّلِي",tr_f="tafaddali",en_f="Please, go ahead (to a woman)"),
 it("um-fenmasad","phrase","فِينْ الْمِصْعَدْ؟","fen al-mis'ad?","Where is the lift?","لفٹ کہاں ہے؟"),
])
pack['planned']=sum(len(u['items']) for u in pack['units'])
json.dump(pack,open(p,'w'),ensure_ascii=False,indent=1)
print('umrah items', len(pack['items']), 'slots', pack['planned'], 'units', len(pack['units']))
