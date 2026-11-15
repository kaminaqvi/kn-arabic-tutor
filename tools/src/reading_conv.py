# General reading (MSA) and Everyday conversation (Saudi) paths.
import json
H=lambda en,ur:{"en":en,"ur":ur}
def it(id,kind,ar,tr,en,ur,hook=None,**kw):
    d={"id":id,"kind":kind,"ar":ar,"tr":tr,"en":en,"ur":ur}; d.update(kw)
    if hook: d["hook"]=H(*hook)
    return d
def build(pid,title,units_spec):
    items=[]; units=[]
    for uid,en,ur,its,refs in units_spec:
        items.extend(its); units.append({"id":uid,"title":{"en":en,"ur":ur},"items":list(refs)+[x["id"] for x in its]})
    pack={"id":pid,"title":title,"units":units,"items":items,"planned":sum(len(u["items"]) for u in units)}
    json.dump(pack,open(f'content/{pid}.json','w'),ensure_ascii=False,indent=1)
    print(pid,len(items),pack['planned'])

W=lambda id,ar,tr,en,ur,hook=None,**kw: it(id,"word",ar,tr,en,ur,hook,**kw)
P=lambda id,ar,tr,en,ur,hook=None,**kw: it(id,"phrase",ar,tr,en,ur,hook,**kw)

build("reading",{"en":"General reading","ur":"عام پڑھائی"},[
 ("r-people","People and places","لوگ اور جگہیں",[
  W("rd-rajul","رَجُل","rajul","Man","آدمی",("‘Rijal’ (men) is its plural.","جمع ’رجال‘")),
  W("rd-imraa","اِمْرَأَة","imra'a","Woman","عورت"),
  W("rd-walad","وَلَد","walad","Boy, child","لڑکا، بچہ",("‘Walid’ (father) and ‘aulad’ (children).","’والد‘ اور ’اولاد‘")),
  W("rd-bint","بِنْت","bint","Girl, daughter","لڑکی، بیٹی",("As in ‘Bint-e-Ali’.","جیسے ’بنتِ علی‘")),
  W("rd-ab","أَب","ab","Father","باپ",("‘Abba’, ‘Abu’.","’ابا‘، ’ابو‘")),
  W("rd-umm","أُمّ","umm","Mother","ماں",("‘Ummi’, ‘Ummul-Mo’mineen’.","’امی‘، ’ام المؤمنین‘")),
  W("rd-madrasa","مَدْرَسَة","madrasa","School","اسکول، مدرسہ",("Urdu ‘madrassa’.","اردو ’مدرسہ‘")),
  W("rd-madina","مَدِينَة","madina","City","شہر",("Madinah = ‘The City’.","مدینہ = ’شہر‘")),
  W("rd-souq","سُوق","sooq","Market","بازار"),
  W("rd-masjid","مَسْجِد","masjid","Mosque","مسجد"),
  W("rd-shari","شَارِع","shari'","Street","سڑک",("Urdu ‘shahrah’ (highway) is related in sense.","’شارع‘ = سڑک")),
  W("rd-bayt","بَيْت","bayt","House","گھر",("‘Baith’ (sitting) helps remember it.","’بیٹھنا‘ سے یاد رکھیں")),
 ],[]),
 ("r-past","Verbs: what happened","فعل: کیا ہوا",[
  W("rd-dhahaba","ذَهَبَ","dhahaba","He went","وہ گیا",("Root of ‘mazhab’ (the way one goes).","’مذہب‘ کا مادہ")),
  W("rd-jaa","جَاءَ","ja'a","He came","وہ آیا"),
  W("rd-akala","أَكَلَ","akala","He ate","اس نے کھایا",("‘Akl’ = food.","’اکل‘ = کھانا")),
  W("rd-shariba","شَرِبَ","shariba","He drank","اس نے پیا",("Root of ‘sharbat’.","’شربت‘ کا مادہ")),
  W("rd-kataba","كَتَبَ","kataba","He wrote","اس نے لکھا",("Root of ‘kitab’ and ‘maktab’.","’کتاب‘ اور ’مکتب‘ کا مادہ")),
  W("rd-qaraa","قَرَأَ","qara'a","He read","اس نے پڑھا",("Root of ‘Qur’an’ and ‘qari’.","’قرآن‘ اور ’قاری‘ کا مادہ")),
  W("rd-jalasa","جَلَسَ","jalasa","He sat","وہ بیٹھا",("Root of ‘jalsa’ (gathering).","’جلسہ‘ کا مادہ")),
  W("rd-kharaja","خَرَجَ","kharaja","He went out","وہ باہر نکلا",("Root of ‘kharij’ (out).","’خارج‘ کا مادہ")),
  W("rd-dakhala","دَخَلَ","dakhala","He entered","وہ داخل ہوا",("Root of ‘dakhil’.","’داخل‘ کا مادہ")),
  W("rd-fataha","فَتَحَ","fataha","He opened","اس نے کھولا",("Root of ‘fateh’ and ‘Fatiha’.","’فتح‘ اور ’فاتحہ‘ کا مادہ")),
  W("rd-samia","سَمِعَ","sami'a","He heard","اس نے سنا",("Root of ‘sama’at’ (hearing).","’سماعت‘ کا مادہ")),
  W("rd-arafa","عَرَفَ","'arafa","He knew, recognised","اس نے پہچانا",("Root of ‘ma’rifat’ and ‘ta’aruf’.","’معرفت‘ اور ’تعارف‘ کا مادہ")),
 ],[]),
 ("r-present","Verbs: I, you, he, we","فعل: میں، تم، وہ، ہم",[
  W("rd-adhhabu","أَذْهَبُ","adh-habu","I go","میں جاتا ہوں",("أَ at the start = I.","شروع میں أَ = میں")),
  W("rd-tadhhabu","تَذْهَبُ","tadh-habu","You go","تم جاتے ہو",("تَ at the start = you.","شروع میں تَ = تم")),
  W("rd-yadhhabu","يَذْهَبُ","yadh-habu","He goes","وہ جاتا ہے",("يَ at the start = he.","شروع میں يَ = وہ")),
  W("rd-nadhhabu","نَذْهَبُ","nadh-habu","We go","ہم جاتے ہیں",("نَ at the start = we.","شروع میں نَ = ہم")),
  W("rd-ureedu","أُرِيدُ","ureedu","I want","میں چاہتا ہوں",("Root of ‘irada’ (intention).","’ارادہ‘ کا مادہ")),
  W("rd-arifu","أَعْرِفُ","a'rifu","I know","میں جانتا ہوں"),
  P("rd-laarifu","لَا أَعْرِفُ","la a'rifu","I don't know","میں نہیں جانتا"),
  W("rd-afhamu","أَفْهَمُ","afhamu","I understand","میں سمجھتا ہوں",("Root of ‘fahm’.","’فہم‘ کا مادہ")),
 ],[]),
 ("r-describe","Describing words","صفت",[
  W("rd-kabeer","كَبِير","kabeer","Big","بڑا",("‘Kabeer’, as in Urdu.","اردو ’کبیر‘")),
  W("rd-sagheer","صَغِير","sagheer","Small","چھوٹا",("‘Sagheer’, as in Urdu.","اردو ’صغیر‘")),
  W("rd-jadeed","جَدِيد","jadeed","New","نیا",("Urdu ‘jadeed’ (modern).","اردو ’جدید‘")),
  W("rd-qadeem","قَدِيم","qadeem","Old","پرانا",("Urdu ‘qadeem’.","اردو ’قدیم‘")),
  W("rd-jameel","جَمِيل","jameel","Beautiful","خوبصورت",("‘Jamal’ (beauty).","’جمال‘ کا مادہ")),
  W("rd-taweel","طَوِيل","taweel","Long, tall","لمبا",("Urdu ‘taveel’.","اردو ’طویل‘")),
  W("rd-qaseer","قَصِير","qaseer","Short","چھوٹا، کوتاہ",("‘Qasr’ = shortening the prayer.","’قصر‘ نماز")),
  W("rd-katheer","كَثِير","katheer","Many, a lot","بہت",("Urdu ‘kaseer’ (abundant).","اردو ’کثیر‘")),
  W("rd-qaleel","قَلِيل","qaleel","Few, a little","تھوڑا",("Urdu ‘qaleel’.","اردو ’قلیل‘")),
  W("rd-sahl","سَهْل","sahl","Easy","آسان",("‘Sahulat’ (facility).","’سہولت‘ کا مادہ")),
  W("rd-saab","صَعْب","sa'b","Difficult","مشکل"),
 ],[]),
 ("r-signs","Reading signs","سائن بورڈ",[],["um-s-makhraj","um-s-madkhal","um-s-rijal","um-s-nisa","um-s-miyah","um-s-tasweer","um-s-mawaqif","um-s-maftooh","um-s-mughlaq","um-s-tawari","um-s-istilamat"]),
 ("r-sentences","First sentences","پہلے جملے",[
  P("rd-s1","ذَهَبَ الْوَلَدُ إِلَى الْمَدْرَسَةِ","dhahaba l-waladu ila l-madrasati","The boy went to school","لڑکا اسکول گیا"),
  P("rd-s2","الْبَيْتُ كَبِيرٌ","al-baytu kabeerun","The house is big","گھر بڑا ہے"),
  P("rd-s3","قَرَأَتِ الْبِنْتُ الْكِتَابَ","qara'ati l-bintu l-kitab","The girl read the book","لڑکی نے کتاب پڑھی",("A ت after the verb shows a female doer.","فعل کے بعد ت = مؤنث")),
  P("rd-s4","أَيْنَ الْمَسْجِدُ؟","ayna l-masjidu?","Where is the mosque?","مسجد کہاں ہے؟",("Textbook ‘ayna’ = Saudi ‘fen’.","کتابی ’أین‘ = سعودی ’فین‘")),
  P("rd-s5","هَذَا كِتَابٌ جَدِيدٌ","hadha kitabun jadeed","This is a new book","یہ نئی کتاب ہے"),
  P("rd-s6","الْمَدِينَةُ جَمِيلَةٌ","al-madinatu jameela","The city is beautiful","شہر خوبصورت ہے"),
  P("rd-s7","شَرِبَ الرَّجُلُ الْمَاءَ","shariba r-rajulu l-ma'","The man drank the water","آدمی نے پانی پیا"),
  P("rd-s8","أُرِيدُ أَنْ أَتَعَلَّمَ الْعَرَبِيَّةَ","ureedu an ata'allama l-'arabiyya","I want to learn Arabic","میں عربی سیکھنا چاہتا ہوں",("‘Ta’allum’ = learning, as in ‘ta’leem’.","’تعلیم‘ کا مادہ")),
 ],[]),
 ("r-news","News words","خبروں کے الفاظ",[
  W("rd-akhbar","أَخْبَار","akhbar","News","خبریں",("Urdu ‘akhbaar’ (newspaper).","اردو ’اخبار‘")),
  W("rd-hukooma","حُكُومَة","hukooma","Government","حکومت"),
  W("rd-raees","رَئِيس","ra'ees","President, head","صدر، سربراہ",("Urdu ‘raees’ (chief, rich man).","اردو ’رئیس‘")),
  W("rd-wazeer","وَزِير","wazeer","Minister","وزیر"),
  W("rd-dawla","دَوْلَة","dawla","State, country","ریاست، ملک",("Urdu ‘daulat’ (wealth) is the same root.","’دولت‘ کا مادہ")),
  W("rd-alam","عَالَم","'alam","World","دنیا، عالم",("Urdu ‘aalam’.","اردو ’عالم‘")),
  W("rd-iqtisad","اِقْتِصَاد","iqtisad","Economy","معیشت",("Urdu ‘iqtisadiyat’.","اردو ’اقتصادیات‘")),
  W("rd-intikhabat","اِنْتِخَابَات","intikhabat","Elections","انتخابات"),
  W("rd-taqs","طَقْس","taqs","Weather","موسم"),
  W("rd-yawmi","يَوْمِيّ","yawmi","Daily","روزانہ",("From ‘yawm’ (day).","’یوم‘ سے")),
 ],[]),
])

build("conversation",{"en":"Everyday conversation","ur":"روزمرہ گفتگو"},[
 ("c-intro","Introductions","تعارف",[
  P("cv-tasharrafna","تِشَرَّفْنَا","tisharrafna","Nice to meet you","آپ سے مل کر خوشی ہوئی",("‘Sharaf’ = honour.","’شرف‘ = عزت")),
  P("cv-minfen","مِنْ فِينْ إِنْتَ؟","min fen inta?","Where are you from? (to a man)","آپ کہاں سے ہیں؟",ar_f="مِنْ فِينْ إِنْتِي؟",tr_f="min fen inti?",en_f="Where are you from? (to a woman)"),
  P("cv-askun","أَسْكُنْ فِي كَرَاتْشِي","askun fi karachi","I live in Karachi","میں کراچی میں رہتا ہوں",("‘Sakin’ = resident, as in Urdu ‘saakin’.","اردو ’ساکن‘")),
  P("cv-umri","عُمْرِي ثَلَاثِينْ سَنَة","'umri talateen sana","I am thirty years old","میری عمر تیس سال ہے",("‘Umr’ = age.","’عمر‘")),
 ],["um-salam","um-kayfak","um-hamdulillah","um-ismi","um-eeshismak","um-pakistan"]),
 ("c-family","Family","خاندان",[
  W("cv-ahli","أَهْلِي","ahli","My family","میرے گھر والے",("‘Ahl-e-khana’.","’اہلِ خانہ‘")),
  W("cv-abuya","أَبُويَا","abuya","My father (spoken)","میرے والد"),
  W("cv-ummi","أُمِّي","ummi","My mother","میری امی",("‘Ammi’.","’امی‘")),
  W("cv-akhuya","أَخُويَا","akhuya","My brother (spoken)","میرا بھائی",("‘Akhi’ / ‘ukhuwwat’ (brotherhood).","’اخوت‘")),
  W("cv-ukhti","أُخْتِي","ukhti","My sister","میری بہن"),
  W("cv-zawjati","زَوْجَتِي","zawjati","My wife","میری بیوی",("‘Zauja’.","’زوجہ‘")),
  W("cv-zawji","زَوْجِي","zawji","My husband","میرے شوہر"),
  W("cv-iyali","عِيَالِي","'iyali","My children (Saudi)","میرے بچے",("Urdu ‘ayaal’ (dependants).","اردو ’عیال‘")),
  P("cv-mutazawwij","أَنَا مُتَزَوِّجْ","ana mutazawwij","I am married (man)","میں شادی شدہ ہوں",ar_f="أَنَا مُتَزَوِّجَة",tr_f="ana mutazawwija",en_f="I am married (woman)"),
  P("cv-indiwaladayn","عِنْدِي وَلَدَيْنْ وَبِنْتْ","'indi waladayn wa bint","I have two sons and a daughter","میرے دو بیٹے اور ایک بیٹی ہے"),
 ],[]),
 ("c-work","Work and study","کام اور پڑھائی",[
  P("cv-shughlak","إِيشْ شُغْلَكْ؟","eesh shughlak?","What is your job? (to a man)","آپ کیا کام کرتے ہیں؟",("‘Shughl’ = work, as in Urdu ‘mashghala’.","’مشغلہ‘ کا مادہ"),ar_f="إِيشْ شُغْلِكْ؟",tr_f="eesh shughlik?",en_f="What is your job? (to a woman)"),
  P("cv-ashtaghil","أَشْتَغِلْ فِي شَرِكَة","ashtaghil fi sharika","I work in a company","میں ایک کمپنی میں کام کرتا ہوں",("‘Shirkat’ (partnership, company).","’شرکت‘")),
  W("cv-muhandis","مُهَنْدِسْ","muhandis","Engineer","انجینئر"),
  W("cv-duktoor","دُكْتُورْ","duktoor","Doctor","ڈاکٹر"),
  W("cv-mudarris","مُدَرِّسْ","mudarris","Teacher","استاد",("Urdu ‘mudarris’ (teacher), from ‘dars’.","’مدرس‘، ’درس‘ سے")),
  W("cv-talib","طَالِبْ","talib","Student","طالب علم",("Urdu ‘talib-e-ilm’.","’طالب علم‘")),
  W("cv-maktab","مَكْتَبْ","maktab","Office","دفتر",("Urdu ‘maktab’ (school/office).","اردو ’مکتب‘")),
  P("cv-mashghool","أَنَا مَشْغُولْ","ana mashghool","I am busy (man)","میں مصروف ہوں",("Urdu ‘mashghool’.","اردو ’مشغول‘"),ar_f="أَنَا مَشْغُولَة",tr_f="ana mashghoola",en_f="I am busy (woman)"),
 ],[]),
 ("c-talk","Small talk","گپ شپ",[
  P("cv-jawwhilw","الْجَوّْ حِلْو","al-jaww hilw","The weather is nice","موسم اچھا ہے"),
  P("cv-rayak","إِيشْ رَأْيَكْ؟","eesh ra'yak?","What do you think? (to a man)","آپ کی کیا رائے ہے؟",("‘Ra’ay’ = opinion, as in Urdu ‘raaye’.","’رائے‘"),ar_f="إِيشْ رَأْيِكْ؟",tr_f="eesh ra'yik?",en_f="What do you think? (to a woman)"),
  W("cv-wallahi","وَاللَّهِ؟","wallahi?","Really?","سچ میں؟"),
  W("cv-akeed","أَكِيدْ","akeed","Sure, of course","ضرور",("Urdu ‘taakeed’ (emphasis).","’تاکید‘ کا مادہ")),
  W("cv-tamam","تَمَامْ","tamam","Fine, perfect","ٹھیک، بہترین",("Urdu ‘tamaam’ (complete).","اردو ’تمام‘")),
  W("cv-tayyib","طَيِّبْ","tayyib","Okay, good","اچھا، ٹھیک",("‘Tayyib’ = pure, good.","’طیب‘ = پاک")),
  W("cv-yani","يَعْنِي","ya'ni","I mean, that is","یعنی",("Urdu ‘yani’.","اردو ’یعنی‘")),
  P("cv-zaymatibgha","زَيْ مَا تِبْغَى","zay ma tibgha","As you like","جیسے آپ چاہیں"),
  P("cv-mubattal","مُو بَطَّالْ","mu battal","Not bad","برا نہیں",("‘Batil’ = useless.","’باطل‘")),
 ],[]),
 ("c-likes","Likes and feelings","پسند اور احساسات",[
  W("cv-ahibb","أَحِبّْ","ahibb","I like, I love","مجھے پسند ہے",("‘Muhabbat’ and ‘habib’.","’محبت‘ اور ’حبیب‘")),
  P("cv-ahibbgahwa","أَحِبّْ الْقَهْوَة","ahibb al-gahwa","I like coffee","مجھے قہوہ پسند ہے"),
  P("cv-maahibb","مَا أَحِبّْ الْحَارّْ","ma ahibb al-harr","I don't like spicy food","مجھے مرچ والا پسند نہیں"),
  W("cv-hilw","حِلْو","hilw","Nice, sweet","اچھا، میٹھا",("Urdu ‘halwa’ (sweet dish).","اردو ’حلوہ‘")),
  W("cv-mumtaz","مُمْتَازْ","mumtaz","Excellent","بہترین",("Urdu ‘mumtaz’ (distinguished).","اردو ’ممتاز‘")),
  P("cv-farhan","أَنَا فَرْحَانْ","ana farhan","I am happy (man)","میں خوش ہوں",ar_f="أَنَا فَرْحَانَة",tr_f="ana farhana",en_f="I am happy (woman)",hook=("‘Farhat’ (joy).","’فرحت‘")),
  P("cv-zaalan","أَنَا زَعْلَانْ","ana za'lan","I am upset (man)","میں ناراض ہوں",ar_f="أَنَا زَعْلَانَة",tr_f="ana za'lana",en_f="I am upset (woman)"),
 ],[]),
 ("c-plans","Phone and plans","فون اور منصوبے",[
  P("cv-ragamjawwal","إِيشْ رَقَمْ جَوَّالَكْ؟","eesh ragam jawwalak?","What is your phone number? (to a man)","آپ کا موبائل نمبر کیا ہے؟",ar_f="إِيشْ رَقَمْ جَوَّالِكْ؟",tr_f="eesh ragam jawwalik?",en_f="What is your phone number? (to a woman)"),
  P("cv-attasil","أَتَّصِلْ عَلَيْكْ","attasil 'aleek","I'll call you","میں آپ کو فون کروں گا",("‘Ittisal’ = contact.","’اتصال‘ کا مادہ")),
  P("cv-nitgabal","نِتْقَابَلْ بُكْرَة؟","nitgabal bukra?","Shall we meet tomorrow?","کل ملیں؟",("‘Muqabla’ = meeting face to face.","’مقابلہ‘ کا مادہ")),
  P("cv-fennitgabal","فِينْ نِتْقَابَلْ؟","fen nitgabal?","Where shall we meet?","کہاں ملیں؟"),
  W("cv-fadi","فَاضِي","fadi","Free (not busy)","فارغ"),
  P("cv-ashoofak","أَشُوفَكْ بَعْدَيْنْ","ashoofak ba'dayn","See you later (to a man)","بعد میں ملتے ہیں",ar_f="أَشُوفِكْ بَعْدَيْنْ",tr_f="ashoofik ba'dayn",en_f="See you later (to a woman)"),
 ],["um-masalama","um-insha"]),
])
