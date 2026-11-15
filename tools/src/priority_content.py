# Priority content for pilgrims: Umrah duas, practical needs, salah texts, dhikr, more short surahs.
import json
H=lambda en,ur:{"en":en,"ur":ur}
def it(id,kind,ar,tr,en,ur,hook=None,**kw):
    d={"id":id,"kind":kind,"ar":ar,"tr":tr,"en":en,"ur":ur}; d.update(kw)
    if hook: d["hook"]=H(*hook)
    return d
W=lambda *a,**k: it(a[0],"word",*a[1:],**k)
P=lambda *a,**k: it(a[0],"phrase",*a[1:],**k)
D=lambda *a,**k: it(a[0],"dua",*a[1:],**k)
def ay(id,ref,tr,en,ur): return {"id":id,"kind":"ayah","quran":ref,"ar":"","tr":tr,"en":en,"ur":ur}

def add(path, units_spec, insert_after=None):
    pack=json.load(open(path)); have={x['id'] for x in pack['items']}
    new_units=[]
    for uid,en,ur,items,refs in units_spec:
        if any(u['id']==uid for u in pack['units']): continue
        for x in items: assert x['id'] not in have, x['id']; have.add(x['id']); pack['items'].append(x)
        new_units.append({"id":uid,"title":{"en":en,"ur":ur},"items":list(refs)+[x['id'] for x in items]})
    if insert_after:
        idx=next((i for i,u in enumerate(pack['units']) if u['id']==insert_after), len(pack['units'])-1)+1
        pack['units'][idx:idx]=new_units
    else: pack['units'].extend(new_units)
    pack['planned']=sum(len(u['items']) for u in pack['units'])
    json.dump(pack,open(path,'w'),ensure_ascii=False,indent=1)
    print(path, len(pack['items']), 'items', len(pack['units']), 'units')

# ---------- Umrah path: placed right after the Umrah steps so they arrive before the trip ----------
add('content/umrah.json',[
 ("u-duas","Duas for the journey and the masjid","سفر اور مسجد کی دعائیں",[
  D("ud-enter","اللَّهُمَّ افْتَحْ لِي أَبْوَابَ رَحْمَتِكَ","allahumma ftah lee abwaba rahmatik","O Allah, open for me the doors of Your mercy (entering the masjid)","اے اللہ، میرے لیے اپنی رحمت کے دروازے کھول دے (مسجد میں داخل ہوتے وقت)",("‘Abwab’ = doors (‘baab’); ‘rahmat’ = mercy.","’ابواب‘ = دروازے، ’رحمت‘")),
  D("ud-leave","اللَّهُمَّ إِنِّي أَسْأَلُكَ مِنْ فَضْلِكَ","allahumma innee as'aluka min fadlik","O Allah, I ask You of Your bounty (leaving the masjid)","اے اللہ، میں تجھ سے تیرا فضل مانگتا ہوں (مسجد سے نکلتے وقت)",("‘Fazl’ = bounty, as in Urdu.","’فضل‘ اردو کی طرح")),
  D("ud-abda","أَبْدَأُ بِمَا بَدَأَ اللَّهُ بِهِ","abda'u bima bada'a llahu bih","I begin with what Allah began with (at Safa)","میں اس سے شروع کرتا ہوں جس سے اللہ نے شروع کیا (صفا پر)",("‘Ibtida’ = beginning.","’ابتدا‘ کا مادہ")),
  ay("ud-safa","2:158","inna s-safa wal-marwata min sha'a'iri llah…","Indeed, Safa and Marwah are among the symbols of Allah… (recited at Safa)","بے شک صفا اور مروہ اللہ کی نشانیوں میں سے ہیں… (صفا پر پڑھی جاتی ہے)"),
  ay("ud-travel1","43:13","subhana lladhee sakhkhara lana hadha wa ma kunna lahu muqrineen","Glory be to Him who has made this subject to us, and we could not have done it ourselves (travel dua)","پاک ہے وہ جس نے اسے ہمارے قابو میں کر دیا، ورنہ ہم اسے قابو میں نہ کر سکتے تھے (سفر کی دعا)"),
  ay("ud-travel2","43:14","wa inna ila rabbina la-munqaliboon","And to our Lord we will surely return (travel dua)","اور بے شک ہم اپنے رب کی طرف لوٹنے والے ہیں (سفر کی دعا)"),
  D("ud-baqi","السَّلَامُ عَلَيْكُمْ أَهْلَ الدِّيَارِ مِنَ الْمُؤْمِنِينَ وَالْمُسْلِمِينَ","as-salamu 'alaykum ahla d-diyari mina l-mu'mineena wal-muslimeen","Peace be upon you, people of these dwellings, believers and Muslims (at a graveyard such as Al-Baqi')","سلام ہو تم پر اے ان گھروں والو، مومنو اور مسلمانو (قبرستان، جیسے البقیع میں)"),
  D("ud-zamzam","بِسْمِ اللَّهِ","bismillah","In the name of Allah (before drinking Zamzam, and before eating)","اللہ کے نام سے (زمزم پینے اور کھانے سے پہلے)"),
 ],[]),
 ("u-phone","Phone, internet and money","فون، انٹرنیٹ اور پیسے",[
  P("up-sim","أَبْغَى شَرِيحَة إِنْتَرْنِتْ","abgha shareeha internet","I want an internet SIM card","مجھے انٹرنیٹ والی سم چاہیے"),
  W("up-shahin","شَاحِنْ","shahin","Phone charger","چارجر"),
  P("up-feehwifi","فِيهْ وَايْ فَايْ؟","feeh way fay?","Is there Wi-Fi?","وائی فائی ہے؟"),
  W("up-sarrafa","صَرَّافَة","sarrafa","Money exchange","کرنسی ایکسچینج",("‘Sarraf’ = money changer, as in Urdu ‘sarraf’.","اردو ’صراف‘")),
  P("up-asrif","أَبْغَى أَصْرِفْ دُولَارْ","abgha asrif dolar","I want to change dollars","مجھے ڈالر تبدیل کرنے ہیں"),
  W("up-kash","كَاشْ","kash","Cash","نقد"),
  W("up-sarraf","صَرَّافْ آلِي","sarraf ali","Cash machine (ATM)","اے ٹی ایم"),
  P("up-nusuk","عِنْدِي مُشْكِلَة فِي تَطْبِيقْ نُسُكْ","'indi mushkila fi tatbeeq nusuk","I have a problem with the Nusuk app","مجھے نسک ایپ میں مسئلہ ہے"),
 ],[]),
 ("u-health","Health and emergencies","صحت اور ہنگامی حالات",[
  P("uh-isaf","اتَّصِلْ بِالْإِسْعَافْ!","ittasil bil-is'af!","Call an ambulance!","ایمبولینس بلائیں!"),
  P("uh-allergy","عِنْدِي حَسَاسِيَّة","'indi hasasiyya","I have an allergy","مجھے الرجی ہے",("Urdu ‘hassasiyat’ (sensitivity).","اردو ’حساسیت‘")),
  P("uh-sukkari","عِنْدِي سُكَّرِي","'indi sukkari","I have diabetes","مجھے شوگر ہے",("‘Sukkar’ = sugar.","’سکر‘ = شکر")),
  P("uh-daght","عِنْدِي ضَغْطْ","'indi daght","I have high blood pressure","مجھے بلڈ پریشر ہے"),
  P("uh-wheelchair","أَحْتَاجْ كُرْسِي مُتَحَرِّكْ","ahtaj kursi mutaharrik","I need a wheelchair","مجھے وہیل چیئر چاہیے",("‘Kursi’ = chair; ‘harakat’ = movement.","’کرسی‘ اور ’حرکت‘")),
  P("uh-lostchild","ضَاعْ وَلَدِي","da' waladi","My child is lost","میرا بچہ گم ہو گیا"),
  P("uh-lostmother","ضَاعَتْ أُمِّي","da'at ummi","My mother is lost","میری امی گم ہو گئی ہیں"),
  P("uh-hurts","هِنَا يُوجَعْنِي","hina yooja'ni","It hurts here","یہاں درد ہو رہا ہے"),
  W("uh-doctor","دُكْتُورْ","duktoor","Doctor","ڈاکٹر"),
  P("uh-qibla","فِينْ الْقِبْلَة؟","fen al-qibla?","Which way is the qibla?","قبلہ کس طرف ہے؟"),
 ],[]),
], insert_after="day23")

# ---------- Qur'anic Arabic path ----------
add('content/quran.json',[
 ("q-salahtexts","Understanding the salah","نماز کو سمجھنا",[
  D("qs-thana","سُبْحَانَكَ اللَّهُمَّ وَبِحَمْدِكَ، وَتَبَارَكَ اسْمُكَ، وَتَعَالَى جَدُّكَ، وَلَا إِلَٰهَ غَيْرُكَ","subhanaka llahumma wa bihamdik, wa tabaraka smuk, wa ta'ala jadduk, wa la ilaha ghayruk","Glory be to You, O Allah, and praise. Blessed is Your name, exalted is Your majesty, and there is no god but You (opening of the salah)","اے اللہ، تو پاک ہے اور تیری حمد ہے، تیرا نام بابرکت ہے، تیری شان بلند ہے اور تیرے سوا کوئی معبود نہیں (ثنا)"),
  D("qs-tash1","التَّحِيَّاتُ لِلَّهِ وَالصَّلَوَاتُ وَالطَّيِّبَاتُ","at-tahiyyatu lillahi was-salawatu wat-tayyibat","All greetings, prayers and good words are for Allah (tashahhud, part 1)","تمام قولی، بدنی اور مالی عبادتیں اللہ کے لیے ہیں (التحیات، حصہ 1)"),
  D("qs-tash2","السَّلَامُ عَلَيْكَ أَيُّهَا النَّبِيُّ وَرَحْمَةُ اللَّهِ وَبَرَكَاتُهُ","as-salamu 'alayka ayyuha n-nabiyyu wa rahmatu llahi wa barakatuh","Peace be upon you, O Prophet, and the mercy of Allah and His blessings (part 2)","اے نبی، آپ پر سلام اور اللہ کی رحمت اور اس کی برکتیں (حصہ 2)"),
  D("qs-tash3","السَّلَامُ عَلَيْنَا وَعَلَى عِبَادِ اللَّهِ الصَّالِحِينَ","as-salamu 'alayna wa 'ala 'ibadi llahi s-saliheen","Peace be upon us and upon the righteous servants of Allah (part 3)","سلام ہو ہم پر اور اللہ کے نیک بندوں پر (حصہ 3)"),
  D("qs-tash4","أَشْهَدُ أَنْ لَا إِلَٰهَ إِلَّا اللَّهُ وَأَشْهَدُ أَنَّ مُحَمَّدًا عَبْدُهُ وَرَسُولُهُ","ash-hadu an la ilaha illa llah, wa ash-hadu anna muhammadan 'abduhu wa rasooluh","I bear witness that there is no god but Allah, and that Muhammad is His servant and messenger (part 4)","میں گواہی دیتا ہوں کہ اللہ کے سوا کوئی معبود نہیں اور محمد اس کے بندے اور رسول ہیں (حصہ 4)"),
  D("qs-durood1","اللَّهُمَّ صَلِّ عَلَى مُحَمَّدٍ وَعَلَى آلِ مُحَمَّدٍ كَمَا صَلَّيْتَ عَلَى إِبْرَاهِيمَ وَعَلَى آلِ إِبْرَاهِيمَ إِنَّكَ حَمِيدٌ مَجِيدٌ","allahumma salli 'ala muhammadin wa 'ala ali muhammad, kama sallayta 'ala ibraheema wa 'ala ali ibraheem, innaka hameedun majeed","O Allah, send prayers on Muhammad and his family, as You sent prayers on Ibrahim and his family. You are Praiseworthy, Glorious (durood, part 1)","اے اللہ، محمد اور آلِ محمد پر رحمت بھیج جیسے تو نے ابراہیم اور آلِ ابراہیم پر رحمت بھیجی، بے شک تو قابلِ تعریف، بزرگی والا ہے (درود، حصہ 1)"),
  D("qs-durood2","اللَّهُمَّ بَارِكْ عَلَى مُحَمَّدٍ وَعَلَى آلِ مُحَمَّدٍ كَمَا بَارَكْتَ عَلَى إِبْرَاهِيمَ وَعَلَى آلِ إِبْرَاهِيمَ إِنَّكَ حَمِيدٌ مَجِيدٌ","allahumma barik 'ala muhammadin wa 'ala ali muhammad, kama barakta 'ala ibraheema wa 'ala ali ibraheem, innaka hameedun majeed","O Allah, bless Muhammad and his family, as You blessed Ibrahim and his family. You are Praiseworthy, Glorious (durood, part 2)","اے اللہ، محمد اور آلِ محمد پر برکت نازل فرما جیسے تو نے ابراہیم اور آلِ ابراہیم پر برکت نازل فرمائی، بے شک تو قابلِ تعریف، بزرگی والا ہے (درود، حصہ 2)"),
  D("qs-taslim","السَّلَامُ عَلَيْكُمْ وَرَحْمَةُ اللَّهِ","as-salamu 'alaykum wa rahmatu llah","Peace and the mercy of Allah be upon you (ending the salah)","تم پر سلامتی اور اللہ کی رحمت ہو (سلام پھیرتے وقت)"),
 ],[]),
 ("q-dhikr","Daily dhikr and short duas","روزانہ کے اذکار اور مختصر دعائیں",[
  D("qd-anta","اللَّهُمَّ أَنْتَ السَّلَامُ وَمِنْكَ السَّلَامُ تَبَارَكْتَ يَا ذَا الْجَلَالِ وَالْإِكْرَامِ","allahumma anta s-salam wa minka s-salam, tabarakta ya dha l-jalali wal-ikram","O Allah, You are Peace and from You comes peace. Blessed are You, Owner of majesty and honour (after salah)","اے اللہ، تو سلامتی والا ہے اور تجھ ہی سے سلامتی ہے، تو بابرکت ہے اے جلال اور عزت والے (نماز کے بعد)"),
  D("qd-subhanbihamdih","سُبْحَانَ اللَّهِ وَبِحَمْدِهِ","subhana llahi wa bihamdih","Glory be to Allah and praise be to Him","اللہ پاک ہے اپنی تعریف کے ساتھ"),
  D("qd-hawqala","لَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللَّهِ","la hawla wa la quwwata illa billah","There is no power and no strength except with Allah","اللہ کے سوا نہ کوئی طاقت ہے نہ قوت",("‘Quwwat’ = strength, as in Urdu.","’قوت‘ اردو کی طرح")),
  D("qd-hasbuna","حَسْبُنَا اللَّهُ وَنِعْمَ الْوَكِيلُ","hasbuna llahu wa ni'ma l-wakeel","Allah is enough for us, and He is the best guardian","ہمارے لیے اللہ کافی ہے اور وہ بہترین کارساز ہے",("‘Wakeel’ = one who looks after your affairs.","’وکیل‘ = کارساز")),
  D("qd-rabbighfir","رَبِّ اغْفِرْ لِي","rabbi ghfir lee","My Lord, forgive me","اے میرے رب، مجھے معاف کر دے",("Same root as ‘maghfirat’.","’مغفرت‘ کا مادہ")),
  D("qd-afw","اللَّهُمَّ إِنَّكَ عَفُوٌّ تُحِبُّ الْعَفْوَ فَاعْفُ عَنِّي","allahumma innaka 'afuwwun tuhibbu l-'afwa fa'fu 'annee","O Allah, You are Pardoning and love to pardon, so pardon me","اے اللہ، تو معاف کرنے والا ہے، معافی کو پسند کرتا ہے، پس مجھے معاف کر دے",("‘Afw’ = pardon, as in ‘maafi’.","’عفو‘ = معافی")),
  D("qd-bismillah","بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ","bismillahi r-rahmani r-raheem","In the name of Allah, the Most Gracious, the Most Merciful","اللہ کے نام سے جو بڑا مہربان، نہایت رحم والا ہے"),
  ay("qd-parents","17:24","…wa qul rabbi rhamhuma kama rabbayanee sagheera","…and say: My Lord, have mercy on them as they raised me when I was small (dua for parents)","…اور کہو: اے میرے رب، ان دونوں پر رحم فرما جیسے انہوں نے بچپن میں میری پرورش کی (والدین کے لیے دعا)"),
 ],[]),
 ("q-qadr","Surah Al-Qadr","سورۃ القدر",[
  ay("q-97-1","97:1","inna anzalnahu fee laylati l-qadr","Indeed, We sent it down on the Night of Decree.","بے شک ہم نے اسے شبِ قدر میں نازل کیا"),
  ay("q-97-2","97:2","wa ma adraka ma laylatu l-qadr","And what will make you know what the Night of Decree is?","اور تمہیں کیا معلوم کہ شبِ قدر کیا ہے؟"),
  ay("q-97-3","97:3","laylatu l-qadri khayrun min alfi shahr","The Night of Decree is better than a thousand months.","شبِ قدر ہزار مہینوں سے بہتر ہے"),
  ay("q-97-4","97:4","tanazzalu l-mala'ikatu war-roohu feeha bi-idhni rabbihim min kulli amr","The angels and the Spirit descend in it by permission of their Lord, for every matter.","اس میں فرشتے اور روح اپنے رب کے حکم سے ہر کام کے لیے اترتے ہیں"),
  ay("q-97-5","97:5","salamun hiya hatta matla'i l-fajr","Peace it is, until the rising of the dawn.","وہ رات سراسر سلامتی ہے، فجر طلوع ہونے تک"),
 ],[]),
 ("q-zalzala","Surah Az-Zalzalah","سورۃ الزلزال",[
  ay("q-99-1","99:1","idha zulzilati l-ardu zilzalaha","When the earth is shaken with its great quake,","جب زمین پوری شدت سے ہلا دی جائے گی"),
  ay("q-99-2","99:2","wa akhrajati l-ardu athqalaha","and the earth brings out its burdens,","اور زمین اپنے بوجھ نکال باہر پھینکے گی"),
  ay("q-99-3","99:3","wa qala l-insanu ma laha","and man says, ‘What is wrong with it?’","اور انسان کہے گا اسے کیا ہو گیا ہے؟"),
  ay("q-99-4","99:4","yawma'idhin tuhaddithu akhbaraha","that Day it will tell its news,","اس دن وہ اپنی خبریں بیان کرے گی"),
  ay("q-99-5","99:5","bi-anna rabbaka awha laha","because your Lord has inspired it.","کیونکہ تمہارے رب نے اسے یہی حکم دیا ہوگا"),
  ay("q-99-6","99:6","yawma'idhin yasduru n-nasu ashtatan li-yuraw a'malahum","That Day people will come out in groups to be shown their deeds.","اس دن لوگ الگ الگ گروہوں میں نکلیں گے تاکہ انہیں ان کے اعمال دکھائے جائیں"),
  ay("q-99-7","99:7","fa-man ya'mal mithqala dharratin khayran yarah","So whoever does an atom's weight of good will see it,","پس جس نے ذرہ برابر نیکی کی ہوگی وہ اسے دیکھ لے گا"),
  ay("q-99-8","99:8","wa man ya'mal mithqala dharratin sharran yarah","and whoever does an atom's weight of evil will see it.","اور جس نے ذرہ برابر برائی کی ہوگی وہ اسے دیکھ لے گا"),
 ],[]),
 ("q-qaria","Surah Al-Qari'ah","سورۃ القارعہ",[
  ay("q-101-1","101:1","al-qari'ah","The Striking Calamity!","کھڑکھڑانے والی"),
  ay("q-101-2","101:2","ma l-qari'ah","What is the Striking Calamity?","کیا ہے وہ کھڑکھڑانے والی؟"),
  ay("q-101-3","101:3","wa ma adraka ma l-qari'ah","And what will make you know what the Striking Calamity is?","اور تمہیں کیا معلوم کہ وہ کھڑکھڑانے والی کیا ہے؟"),
  ay("q-101-4","101:4","yawma yakoonu n-nasu kal-farashi l-mabthooth","The Day people will be like scattered moths,","جس دن لوگ بکھرے ہوئے پروانوں کی طرح ہوں گے"),
  ay("q-101-5","101:5","wa takoonu l-jibalu kal-'ihni l-manfoosh","and the mountains like fluffed wool.","اور پہاڑ دھنکی ہوئی اون کی طرح ہوں گے"),
  ay("q-101-6","101:6","fa-amma man thaqulat mawazeenuh","Then as for the one whose scales are heavy,","تو جس کے پلڑے بھاری ہوں گے"),
  ay("q-101-7","101:7","fa-huwa fee 'eeshatin radiyah","he will be in a pleasing life.","وہ پسندیدہ زندگی میں ہوگا"),
  ay("q-101-8","101:8","wa amma man khaffat mawazeenuh","But as for the one whose scales are light,","اور جس کے پلڑے ہلکے ہوں گے"),
  ay("q-101-9","101:9","fa-ummuhu hawiyah","his refuge will be an abyss.","اس کا ٹھکانا ہاویہ ہوگا"),
  ay("q-101-10","101:10","wa ma adraka ma hiyah","And what will make you know what that is?","اور تمہیں کیا معلوم کہ وہ کیا ہے؟"),
  ay("q-101-11","101:11","narun hamiyah","A blazing fire.","دہکتی ہوئی آگ"),
 ],[]),
 ("q-takathur","Surah At-Takathur","سورۃ التکاثر",[
  ay("q-102-1","102:1","alhakumu t-takathur","Competing for more distracts you","تمہیں کثرت کی چاہت نے غافل کر دیا"),
  ay("q-102-2","102:2","hatta zurtumu l-maqabir","until you visit the graves.","یہاں تک کہ تم قبروں تک جا پہنچے"),
  ay("q-102-3","102:3","kalla sawfa ta'lamoon","No! You will come to know.","ہرگز نہیں، تم جلد جان لو گے"),
  ay("q-102-4","102:4","thumma kalla sawfa ta'lamoon","Again no! You will come to know.","پھر ہرگز نہیں، تم جلد جان لو گے"),
  ay("q-102-5","102:5","kalla law ta'lamoona 'ilma l-yaqeen","No! If only you knew with certainty,","ہرگز نہیں، کاش تم یقینی علم سے جانتے"),
  ay("q-102-6","102:6","la-tarawunna l-jaheem","you will surely see the Hellfire.","تم ضرور جہنم کو دیکھو گے"),
  ay("q-102-7","102:7","thumma la-tarawunnaha 'ayna l-yaqeen","Then you will surely see it with the eye of certainty.","پھر تم اسے یقین کی آنکھ سے دیکھو گے"),
  ay("q-102-8","102:8","thumma la-tus'alunna yawma'idhin 'ani n-na'eem","Then on that Day you will be asked about the pleasures.","پھر اس دن تم سے نعمتوں کے بارے میں ضرور پوچھا جائے گا"),
 ],[]),
 ("q-humaza","Surah Al-Humazah","سورۃ الہمزہ",[
  ay("q-104-1","104:1","waylun li-kulli humazatin lumazah","Woe to every slanderer and backbiter,","ہر طعنہ دینے والے، عیب جو کے لیے خرابی ہے"),
  ay("q-104-2","104:2","alladhee jama'a malan wa 'addadah","who collects wealth and counts it,","جس نے مال جمع کیا اور اسے گن گن کر رکھا"),
  ay("q-104-3","104:3","yahsabu anna malahu akhladah","thinking that his wealth will make him last forever.","وہ سمجھتا ہے کہ اس کا مال اسے ہمیشہ رکھے گا"),
  ay("q-104-4","104:4","kalla la-yumbadhanna fi l-hutamah","No! He will surely be thrown into the Crusher.","ہرگز نہیں، وہ ضرور حطمہ میں پھینکا جائے گا"),
  ay("q-104-5","104:5","wa ma adraka ma l-hutamah","And what will make you know what the Crusher is?","اور تمہیں کیا معلوم کہ حطمہ کیا ہے؟"),
  ay("q-104-6","104:6","naru llahi l-mooqadah","The fire of Allah, kindled,","اللہ کی بھڑکائی ہوئی آگ"),
  ay("q-104-7","104:7","allatee tattali'u 'ala l-af'idah","which rises over the hearts.","جو دلوں تک جا پہنچے گی"),
  ay("q-104-8","104:8","innaha 'alayhim mu'sadah","It will be closed in upon them","وہ ان پر بند کر دی جائے گی"),
  ay("q-104-9","104:9","fee 'amadin mumaddadah","in extended columns.","لمبے لمبے ستونوں میں"),
 ],[]),
], insert_after="q-salah")
