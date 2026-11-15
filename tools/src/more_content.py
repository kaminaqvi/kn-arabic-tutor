# Additional Umrah units and Qur'an surahs. Run from the repo root after the other content scripts.
import json
H=lambda en,ur:{"en":en,"ur":ur}
def it(id,kind,ar,tr,en,ur,hook=None,**kw):
    d={"id":id,"kind":kind,"ar":ar,"tr":tr,"en":en,"ur":ur}; d.update(kw)
    if hook: d["hook"]=H(*hook)
    return d
W=lambda *a,**k: it(a[0],"word",*a[1:],**k)
P=lambda *a,**k: it(a[0],"phrase",*a[1:],**k)

# ---------- Umrah ----------
p='content/umrah.json'; pack=json.load(open(p))
have={x['id'] for x in pack['items']}
def unit(uid,en,ur,items):
    if any(u['id']==uid for u in pack['units']): return
    for x in items:
        assert x['id'] not in have, x['id']; have.add(x['id']); pack['items'].append(x)
    pack['units'].append({"id":uid,"title":{"en":en,"ur":ur},"items":[x['id'] for x in items]})
unit("day28","Asking questions","سوال پوچھنا",[
 W("um-meen","مِينْ؟","meen?","Who? (spoken)","کون؟",msa="مَنْ؟"),
 W("um-eesh","إِيشْ؟","eesh?","What? (spoken)","کیا؟",msa="مَاذَا؟"),
 W("um-leesh","لِيشْ؟","leesh?","Why? (spoken)","کیوں؟",msa="لِمَاذَا؟"),
 W("um-kayf","كَيْفْ؟","kayf?","How?","کیسے؟",("As in ‘kaifiyat’ (condition).","’کیفیت‘ کا مادہ")),
 W("um-mata","مَتَى؟","mata?","When?","کب؟"),
 W("um-kam","كَمْ؟","kam?","How many? How much?","کتنے؟ کتنا؟"),
 P("um-eeshhada","إِيشْ هَادَا؟","eesh hada?","What is this?","یہ کیا ہے؟"),
 P("um-leeshmagfool","لِيشْ مَقْفُولْ؟","leesh magfool?","Why is it closed?","یہ کیوں بند ہے؟",("‘Qufl’ = lock, as in Urdu ‘qufl’.","’قفل‘ = تالا")),
])
unit("day29","The days of Hajj","حج کے دن",[
 W("um-mina","مِنَى","mina","Mina","منیٰ"),
 W("um-arafat","عَرَفَات","'arafat","Arafat","عرفات"),
 W("um-muzdalifa","مُزْدَلِفَة","muzdalifa","Muzdalifah","مزدلفہ"),
 W("um-jamarat","الْجَمَرَاتْ","al-jamarat","The Jamarat (stoning pillars)","جمرات"),
 P("um-ramy","رَمْيُ الْجَمَرَاتْ","ramyu l-jamarat","Stoning the Jamarat","رمیِ جمرات"),
 P("um-yawmarafa","يَوْمُ عَرَفَة","yawmu 'arafa","The Day of Arafah","یومِ عرفہ"),
 W("um-hady","الْهَدْيْ","al-hady","The sacrificial animal","ہدی (قربانی کا جانور)"),
 P("um-ifada","طَوَافُ الْإِفَاضَة","tawafu l-ifada","Tawaf al-Ifadah","طوافِ زیارت (افاضہ)"),
 P("um-wada","طَوَافُ الْوَدَاعْ","tawafu l-wada'","The farewell tawaf","طوافِ وداع",("‘Wida’’ = farewell, as in ‘alvida’.","’وداع‘، جیسے ’الوداع‘")),
 W("um-khayma","خَيْمَة","khayma","Tent","خیمہ",("Urdu ‘khaima’.","اردو ’خیمہ‘")),
])
unit("day30","Visiting places in Makkah","مکہ کی زیارتیں",[
 P("um-jabalnoor","جَبَلُ النُّورْ","jabalu n-noor","Jabal an-Nour (Mountain of Light)","جبلِ نور"),
 P("um-hira","غَارُ حِرَاءْ","gharu hira'","The Cave of Hira","غارِ حرا"),
 P("um-thawr","جَبَلُ ثَوْرْ","jabalu thawr","Mount Thawr","جبلِ ثور"),
 P("um-taneem","مَسْجِدُ التَّنْعِيمْ","masjidu t-tan'eem","Tan'eem Mosque (Masjid Aisha)","مسجدِ تنعیم (مسجدِ عائشہ)"),
 P("um-azoor","أَبْغَى أَزُورْ غَارْ حِرَاءْ","abgha azoor ghar hira'","I want to visit the Cave of Hira","میں غارِ حرا کی زیارت کرنا چاہتا ہوں",("‘Ziyarat’ is the same root.","’زیارت‘ کا مادہ")),
 P("um-burj","بُرْجُ السَّاعَة","burju s-sa'a","The Clock Tower","کلاک ٹاور",("‘Burj’ = tower, as in ‘burj’ in Urdu.","’برج‘ = مینار")),
 P("um-baabmalik","بَابُ الْمَلِكْ عَبْدِ الْعَزِيزْ","babu l-malik 'abdi l-'azeez","King Abdulaziz Gate","باب الملک عبدالعزیز"),
])
unit("day31","Colours and clothes","رنگ اور کپڑے",[
 W("um-abyad","أَبْيَضْ","abyad","White","سفید",("‘Bayaz’ (white notebook) is the same root.","’بیاض‘ کا مادہ")),
 W("um-aswad","أَسْوَدْ","aswad","Black","کالا",("As in ‘Hajar-e-Aswad’ (the Black Stone).","’حجرِ اسود‘")),
 W("um-akhdar","أَخْضَرْ","akhdar","Green","سبز",("As in ‘Gumbad-e-Khazra’ (the Green Dome).","’گنبدِ خضریٰ‘")),
 W("um-ahmar","أَحْمَرْ","ahmar","Red","سرخ",("‘Ahmar’, as in ‘Bahr-e-Ahmar’ (the Red Sea).","’بحرِ احمر‘")),
 W("um-azraq","أَزْرَقْ","azraq","Blue","نیلا"),
 W("um-asfar","أَصْفَرْ","asfar","Yellow","پیلا"),
 W("um-thob","ثُوبْ","thob","Thobe (long robe)","لمبا کرتا (ثوب)"),
 W("um-naal","نَعَالْ","na'al","Sandals","چپل",("Urdu ‘naalain’ (sandals).","اردو ’نعلین‘")),
 W("um-izar","إِزَارْ","izar","Lower ihram cloth","ازار (احرام کی نچلی چادر)"),
 W("um-rida","رِدَاءْ","rida'","Upper ihram cloth","ردا (احرام کی اوپری چادر)",("Urdu ‘rida’ (shawl).","اردو ’ردا‘")),
])
unit("day32","Bigger numbers","بڑی گنتی",[
 W("um-arbaeen","أَرْبَعِينْ","arba'een","Forty (40, ٤٠)","چالیس (٤٠)",accept=["40","٤٠"]),
 W("um-sitteen","سِتِّينْ","sitteen","Sixty (60, ٦٠)","ساٹھ (٦٠)",accept=["60","٦٠"]),
 W("um-sabeen","سَبْعِينْ","sab'een","Seventy (70, ٧٠)","ستر (٧٠)",accept=["70","٧٠"]),
 W("um-tamaneen","ثَمَانِينْ","tamaneen","Eighty (80, ٨٠)","اسی (٨٠)",accept=["80","٨٠"]),
 W("um-tiseen","تِسْعِينْ","tis'een","Ninety (90, ٩٠)","نوے (٩٠)",accept=["90","٩٠"]),
 W("um-meetayn","مِيتَيْنْ","meetayn","Two hundred (200)","دو سو (٢٠٠)",accept=["200","٢٠٠"]),
 W("um-khamsmiya","خَمْسْمِيَّة","khamsmiya","Five hundred (500)","پانچ سو (٥٠٠)",accept=["500","٥٠٠"]),
])
unit("day33","Feelings and needs","احساسات اور ضرورتیں",[
 P("um-juan","أَنَا جُوعَانْ","ana ju'an","I am hungry (man)","مجھے بھوک لگی ہے",ar_f="أَنَا جُوعَانَة",tr_f="ana ju'ana",en_f="I am hungry (woman)"),
 P("um-atshan","أَنَا عَطْشَانْ","ana 'atshan","I am thirsty (man)","مجھے پیاس لگی ہے",ar_f="أَنَا عَطْشَانَة",tr_f="ana 'atshana",en_f="I am thirsty (woman)",hook=("‘Atash’ = thirst, as in Urdu.","’عطش‘ = پیاس")),
 P("um-bardan","أَنَا بَرْدَانْ","ana bardan","I am cold (man)","مجھے سردی لگ رہی ہے",ar_f="أَنَا بَرْدَانَة",tr_f="ana bardana",en_f="I am cold (woman)",hook=("‘Bard’ = cold, as in ‘barf’-like ‘baraf’.","’برد‘ = ٹھنڈک")),
 P("um-nasan","أَنَا نَعْسَانْ","ana na'san","I am sleepy (man)","مجھے نیند آ رہی ہے",ar_f="أَنَا نَعْسَانَة",tr_f="ana na'sana",en_f="I am sleepy (woman)"),
 P("um-mabsoot","أَنَا مَبْسُوطْ","ana mabsoot","I am happy (man)","میں خوش ہوں",ar_f="أَنَا مَبْسُوطَة",tr_f="ana mabsoota",en_f="I am happy (woman)"),
 P("um-artah","أَبْغَى أَرْتَاحْ","abgha artah","I want to rest","میں آرام کرنا چاہتا ہوں",("‘Raahat’ (comfort).","’راحت‘ کا مادہ")),
 P("um-mumushkila","مُو مُشْكِلَة","mu mushkila","No problem","کوئی مسئلہ نہیں",("‘Mushkil’, as in Urdu.","’مشکل‘ اردو کی طرح")),
])
pack['planned']=sum(len(u['items']) for u in pack['units'])
json.dump(pack,open(p,'w'),ensure_ascii=False,indent=1)
print('umrah', len(pack['items']), 'units', len(pack['units']))

# ---------- Qur'an ----------
p='content/quran.json'; q=json.load(open(p))
qhave={x['id'] for x in q['items']}
def ay(id,ref,tr,en,ur): return {"id":id,"kind":"ayah","quran":ref,"ar":"","tr":tr,"en":en,"ur":ur}
def qunit(uid,en,ur,items):
    if any(u['id']==uid for u in q['units']): return
    for x in items: assert x['id'] not in qhave, x['id']; qhave.add(x['id']); q['items'].append(x)
    q['units'].append({"id":uid,"title":{"en":en,"ur":ur},"items":[x['id'] for x in items]})
qunit("q-fil","Surah Al-Fil","سورۃ الفیل",[
 ay("q-105-1","105:1","alam tara kayfa fa'ala rabbuka bi-ashabi l-feel","Have you not seen how your Lord dealt with the people of the elephant?","کیا آپ نے نہیں دیکھا کہ آپ کے رب نے ہاتھی والوں کے ساتھ کیا کیا؟"),
 ay("q-105-2","105:2","alam yaj'al kaydahum fee tadleel","Did He not make their plan go astray?","کیا اس نے ان کی چال کو ناکام نہیں کر دیا؟"),
 ay("q-105-3","105:3","wa arsala 'alayhim tayran ababeel","And He sent against them birds in flocks,","اور ان پر پرندوں کے جھنڈ بھیجے"),
 ay("q-105-4","105:4","tarmeehim bi-hijaratin min sijjeel","striking them with stones of baked clay,","جو ان پر پکی مٹی کے پتھر پھینکتے تھے"),
 ay("q-105-5","105:5","fa-ja'alahum ka-'asfin ma'kool","and He made them like eaten straw.","پھر انہیں کھائے ہوئے بھوسے کی طرح کر دیا"),
])
qunit("q-quraysh","Surah Quraysh","سورۃ قریش",[
 ay("q-106-1","106:1","li-eelafi quraysh","For the security of Quraysh,","قریش کے مانوس رکھنے کی وجہ سے"),
 ay("q-106-2","106:2","eelafihim rihlata sh-shita'i wa s-sayf","their security in the journeys of winter and summer,","سردی اور گرمی کے سفر سے ان کو مانوس رکھنے کی وجہ سے"),
 ay("q-106-3","106:3","fal-ya'budoo rabba hadha l-bayt","so let them worship the Lord of this House,","پس انہیں اس گھر کے رب کی عبادت کرنی چاہیے"),
 ay("q-106-4","106:4","alladhee at'amahum min joo'in wa amanahum min khawf","who fed them against hunger and made them safe from fear.","جس نے انہیں بھوک میں کھانا دیا اور خوف سے امن دیا"),
])
qunit("q-maun","Surah Al-Ma'un","سورۃ الماعون",[
 ay("q-107-1","107:1","ara'ayta lladhee yukadhdhibu bid-deen","Have you seen the one who denies the Judgement?","کیا آپ نے اسے دیکھا جو روزِ جزا کو جھٹلاتا ہے؟"),
 ay("q-107-2","107:2","fa-dhalika lladhee yadu''u l-yateem","That is the one who pushes away the orphan","یہی وہ ہے جو یتیم کو دھکے دیتا ہے"),
 ay("q-107-3","107:3","wa la yahuddu 'ala ta'ami l-miskeen","and does not encourage feeding the poor.","اور مسکین کو کھانا کھلانے کی ترغیب نہیں دیتا"),
 ay("q-107-4","107:4","fa-waylun lil-musalleen","So woe to those who pray","پس ان نمازیوں کے لیے خرابی ہے"),
 ay("q-107-5","107:5","alladheena hum 'an salatihim sahoon","who are heedless of their prayer,","جو اپنی نماز سے غافل ہیں"),
 ay("q-107-6","107:6","alladheena hum yura'oon","who only show off,","جو دکھاوا کرتے ہیں"),
 ay("q-107-7","107:7","wa yamna'oona l-ma'oon","and withhold small kindnesses.","اور معمولی چیزیں بھی دینے سے روکتے ہیں"),
])
qunit("q-kafirun","Surah Al-Kafirun","سورۃ الکافرون",[
 ay("q-109-1","109:1","qul ya ayyuha l-kafiroon","Say: O disbelievers,","کہہ دیجیے: اے کافرو"),
 ay("q-109-2","109:2","la a'budu ma ta'budoon","I do not worship what you worship,","میں اس کی عبادت نہیں کرتا جس کی تم عبادت کرتے ہو"),
 ay("q-109-3","109:3","wa la antum 'abidoona ma a'bud","nor do you worship what I worship,","اور نہ تم اس کی عبادت کرتے ہو جس کی میں عبادت کرتا ہوں"),
 ay("q-109-4","109:4","wa la ana 'abidun ma 'abadtum","nor will I worship what you have worshipped,","اور نہ میں اس کی عبادت کرنے والا ہوں جس کی تم نے عبادت کی"),
 ay("q-109-5","109:5","wa la antum 'abidoona ma a'bud","nor will you worship what I worship.","اور نہ تم اس کی عبادت کرنے والے ہو جس کی میں عبادت کرتا ہوں"),
 ay("q-109-6","109:6","lakum deenukum wa liya deen","To you your religion, and to me mine.","تمہارے لیے تمہارا دین اور میرے لیے میرا دین"),
])
qunit("q-nasr","Surah An-Nasr","سورۃ النصر",[
 ay("q-110-1","110:1","idha ja'a nasru llahi wal-fath","When the help of Allah and the victory come,","جب اللہ کی مدد اور فتح آ جائے"),
 ay("q-110-2","110:2","wa ra'ayta n-nasa yadkhuloona fee deeni llahi afwaja","and you see people entering Allah's religion in crowds,","اور آپ لوگوں کو اللہ کے دین میں فوج در فوج داخل ہوتے دیکھیں"),
 ay("q-110-3","110:3","fa-sabbih bi-hamdi rabbika wastaghfirh, innahu kana tawwaba","then glorify the praise of your Lord and ask His forgiveness. He is ever accepting of repentance.","تو اپنے رب کی حمد کے ساتھ تسبیح کیجیے اور اس سے مغفرت مانگیے، بے شک وہ بڑا توبہ قبول کرنے والا ہے"),
])
qunit("q-masad","Surah Al-Masad","سورۃ المسد",[
 ay("q-111-1","111:1","tabbat yada abee lahabin wa tabb","May the hands of Abu Lahab perish, and he has perished.","ابو لہب کے دونوں ہاتھ ٹوٹ جائیں اور وہ ہلاک ہو گیا"),
 ay("q-111-2","111:2","ma aghna 'anhu maluhu wa ma kasab","His wealth and what he earned will not help him.","نہ اس کا مال اس کے کام آیا اور نہ جو اس نے کمایا"),
 ay("q-111-3","111:3","sayasla naran dhata lahab","He will burn in a fire of blazing flame,","وہ عنقریب بھڑکتی آگ میں داخل ہوگا"),
 ay("q-111-4","111:4","wamra'atuhu hammalata l-hatab","and his wife too, the carrier of firewood.","اور اس کی بیوی بھی، جو لکڑیاں اٹھانے والی ہے"),
 ay("q-111-5","111:5","fee jeediha hablun min masad","Around her neck is a rope of palm fibre.","اس کی گردن میں مونج کی رسی ہے"),
])
qunit("q-kursi","Ayat al-Kursi","آیۃ الکرسی",[
 ay("q-2-255","2:255","allahu la ilaha illa huwa l-hayyu l-qayyum…","Allah: there is no god but Him, the Ever-Living, the Sustainer of all. Neither drowsiness nor sleep overtakes Him. To Him belongs all that is in the heavens and the earth… His Throne extends over the heavens and the earth, and guarding them does not tire Him. He is the Most High, the Most Great.","اللہ، اس کے سوا کوئی معبود نہیں، وہ زندہ ہے، سب کو تھامنے والا ہے۔ نہ اسے اونگھ آتی ہے نہ نیند۔ آسمانوں اور زمین میں جو کچھ ہے اسی کا ہے… اس کی کرسی آسمانوں اور زمین پر چھائی ہوئی ہے اور ان کی حفاظت اسے نہیں تھکاتی۔ وہ بلند اور عظمت والا ہے۔"),
])
q['planned']=sum(len(u['items']) for u in q['units'])
json.dump(q,open(p,'w'),ensure_ascii=False,indent=1)
print('quran', len(q['items']), 'units', len(q['units']))
