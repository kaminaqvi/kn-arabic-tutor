# Kids content: picture words, letters, colours, numbers, family, body, Islamic words and duas.
import json
def k(id,ar,tr,en,ur,pic,**kw):
    d={"id":"k-"+id,"kind":"pic","ar":ar,"tr":tr,"en":en,"ur":ur,"pic":pic}; d.update(kw); return d
letters=[
 ("asad","أ","أَسَد","asad","Lion","شیر","🦁"),("batta","ب","بَطَّة","batta","Duck","بطخ","🦆"),
 ("tuffaha","ت","تُفَّاحَة","tuffaha","Apple","سیب","🍎"),("thalab","ث","ثَعْلَب","tha'lab","Fox","لومڑی","🦊"),
 ("jamal","ج","جَمَل","jamal","Camel","اونٹ","🐪"),("hisan","ح","حِصَان","hisan","Horse","گھوڑا","🐴"),
 ("kharoof","خ","خَرُوف","kharoof","Sheep","بھیڑ","🐑"),("dubb","د","دُبّ","dubb","Bear","ریچھ","🐻"),
 ("dhura","ذ","ذُرَة","dhura","Corn","مکئی","🌽"),("reesha","ر","رِيشَة","reesha","Feather","پر","🪶"),
 ("zarafa","ز","زَرَافَة","zarafa","Giraffe","زرافہ","🦒"),("samaka","س","سَمَكَة","samaka","Fish","مچھلی","🐟"),
 ("shams","ش","شَمْس","shams","Sun","سورج","☀️"),("saqr","ص","صَقْر","saqr","Falcon","باز","🦅"),
 ("difda","ض","ضِفْدَع","difda'","Frog","مینڈک","🐸"),("taira","ط","طَائِرَة","ta'ira","Aeroplane","ہوائی جہاز","✈️"),
 ("dharf","ظ","ظَرْف","dharf","Envelope","لفافہ","✉️"),("inab","ع","عِنَب","'inab","Grapes","انگور","🍇"),
 ("ghayma","غ","غَيْمَة","ghayma","Cloud","بادل","☁️"),("feel","ف","فِيل","feel","Elephant","ہاتھی","🐘"),
 ("qitta","ق","قِطَّة","qitta","Cat","بلی","🐱"),("kalb","ك","كَلْب","kalb","Dog","کتا","🐶"),
 ("laymoon","ل","لَيْمُون","laymoon","Lemon","لیموں","🍋"),("mawz","م","مَوْز","mawz","Banana","کیلا","🍌"),
 ("nahla","ن","نَحْلَة","nahla","Bee","شہد کی مکھی","🐝"),("hilal","ه","هِلَال","hilal","Crescent moon","ہلال","🌙"),
 ("warda","و","وَرْدَة","warda","Rose","گلاب","🌹"),("yad","ي","يَد","yad","Hand","ہاتھ","✋"),
]
items=[]; units=[]
def unit(uid,en,ur,its,buddy):
    items.extend(its); units.append({"id":uid,"title":{"en":en,"ur":ur},"icon":buddy,"items":[x["id"] for x in its]})
L=[k(i,w,tr,en,ur,pic,letter=l) for i,l,w,tr,en,ur,pic in letters]
for n in range(0,28,4):
    a=L[n:n+4]; unit(f"k-letters{n//4+1}",{"en":f"Letters {a[0]['letter']} to {a[-1]['letter']}","ur":f"حروف {a[0]['letter']} سے {a[-1]['letter']}"}["en"],f"حروف {a[0]['letter']} سے {a[-1]['letter']}",a,a[0]['pic'])
nums=[("1","١","وَاحِد","wahid","One","ایک"),("2","٢","اِثْنَان","ithnan","Two","دو"),("3","٣","ثَلَاثَة","thalatha","Three","تین"),("4","٤","أَرْبَعَة","arba'a","Four","چار"),("5","٥","خَمْسَة","khamsa","Five","پانچ"),("6","٦","سِتَّة","sitta","Six","چھ"),("7","٧","سَبْعَة","sab'a","Seven","سات"),("8","٨","ثَمَانِيَة","thamaniya","Eight","آٹھ"),("9","٩","تِسْعَة","tis'a","Nine","نو"),("10","١٠","عَشَرَة","'ashara","Ten","دس")]
N=[k("n"+e,ar,tr,en,ur,a,accept=[e,a],num=int(e)) for e,a,ar,tr,en,ur in nums]
unit("k-numbers1","Numbers 1 to 5","گنتی ایک سے پانچ",N[:5],"🔢")
unit("k-numbers2","Numbers 6 to 10","گنتی چھ سے دس",N[5:],"🔟")
C=[k("ahmar","أَحْمَر","ahmar","Red","سرخ","🔴",color="#E5484D"),k("azraq","أَزْرَق","azraq","Blue","نیلا","🔵",color="#3E7BFA"),k("akhdar","أَخْضَر","akhdar","Green","سبز","🟢",color="#2FA36B"),
   k("asfar","أَصْفَر","asfar","Yellow","پیلا","🟡",color="#F5C518"),k("abyad","أَبْيَض","abyad","White","سفید","⚪",color="#FFFFFF"),k("aswad","أَسْوَد","aswad","Black","کالا","⚫",color="#222222")]
unit("k-colours","Colours","رنگ",C,"🎨")
F=[k("ab","أَب","ab","Father","ابو","👨"),k("umm","أُمّ","umm","Mother","امی","👩"),k("akh","أَخ","akh","Brother","بھائی","👦"),k("ukht","أُخْت","ukht","Sister","بہن","👧"),k("jadd","جَدّ","jadd","Grandfather","دادا / نانا","👴"),k("jadda","جَدَّة","jadda","Grandmother","دادی / نانی","👵"),k("tifl","طِفْل","tifl","Baby","بچہ","👶")]
unit("k-family","My family","میرا خاندان",F,"🏠")
B=[k("ayn","عَيْن","'ayn","Eye","آنکھ","👁️"),k("udhun","أُذُن","udhun","Ear","کان","👂"),k("anf","أَنْف","anf","Nose","ناک","👃"),k("fam","فَم","fam","Mouth","منہ","👄"),k("rijl","رِجْل","rijl","Leg","ٹانگ","🦵"),k("qalb","قَلْب","qalb","Heart","دل","❤️")]
unit("k-body","My body","میرا جسم",B,"🙂")
I=[k("salam","السَّلَامُ عَلَيْكُمْ","as-salamu 'alaykum","Peace be upon you","السلام علیکم","👋",kind="kphrase"),
   k("shukran","شُكْرًا","shukran","Thank you","شکریہ","🙏"),k("masjid","مَسْجِد","masjid","Mosque","مسجد","🕌"),
   k("kaaba","الْكَعْبَة","al-ka'ba","The Ka'bah","کعبہ","🕋"),k("quran","الْقُرْآن","al-qur'an","The Qur'an","قرآن","📖"),
   k("najma","نَجْمَة","najma","Star","ستارہ","⭐"),k("maa","مَاء","ma'","Water","پانی","💧"),k("kitab","كِتَاب","kitab","Book","کتاب","📚")]
for x in I:
    if x.get("kind")=="kphrase": x["kind"]="pic"
unit("k-islam","Words we love","پیارے الفاظ",I,"🕌")
D=[k("bismillah","بِسْمِ اللَّهِ","bismillah","In the name of Allah (before eating)","اللہ کے نام سے (کھانے سے پہلے)","🍽️",dua=True),
   k("alhamdulillah","الْحَمْدُ لِلَّهِ","al-hamdu lillah","All praise is for Allah (after eating)","سب تعریف اللہ کے لیے (کھانے کے بعد)","😊",dua=True),
   k("sleep","بِاسْمِكَ اللَّهُمَّ أَمُوتُ وَأَحْيَا","bismika llahumma amootu wa ahya","In Your name, O Allah, I die and I live (before sleeping)","اے اللہ، تیرے نام سے مرتا اور جیتا ہوں (سونے سے پہلے)","😴",dua=True),
   k("wake","الْحَمْدُ لِلَّهِ الَّذِي أَحْيَانَا بَعْدَ مَا أَمَاتَنَا وَإِلَيْهِ النُّشُورُ","al-hamdu lillahi lladhee ahyana ba'da ma amatana wa ilayhi n-nushoor","Praise be to Allah who gave us life after death, and to Him is the return (on waking up)","سب تعریف اللہ کی جس نے ہمیں مارنے کے بعد زندہ کیا اور اسی کی طرف لوٹنا ہے (جاگنے پر)","🌅",dua=True),
   k("inshallah","إِنْ شَاءَ اللَّهُ","in sha' allah","If Allah wills","ان شاء اللہ","🤲",dua=True),
   k("mashallah","مَا شَاءَ اللَّهُ","ma sha' allah","What Allah has willed (how wonderful!)","ما شاء اللہ","🌟",dua=True)]
unit("k-duas","Little duas","چھوٹی دعائیں",D,"🤲")
units.append({"id":"k-ikhlas","title":{"en":"Surah Al-Ikhlas","ur":"سورۃ الاخلاص"},"icon":"📖","items":["q-112-1","q-112-2","q-112-3","q-112-4"]})
# put numbers/colours/family/islam early, letters spread through
order=["k-islam","k-letters1","k-numbers1","k-letters2","k-colours","k-letters3","k-family","k-letters4","k-numbers2","k-letters5","k-body","k-letters6","k-duas","k-letters7","k-ikhlas"]
units=[next(u for u in units if u["id"]==i) for i in order]
for u in units:
    if isinstance(u["title"],str): pass
pack={"id":"kids","title":{"en":"Kids","ur":"بچے"},"units":units,"items":items,"planned":sum(len(u["items"]) for u in units)}
json.dump(pack,open('content/kids.json','w'),ensure_ascii=False,indent=1)
print('kids items',len(items),'units',len(units))
