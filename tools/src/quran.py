# Qur'anic Arabic path. Ayah text and audio are fetched at runtime; only meanings are written here.
import json
H=lambda en,ur:{"en":en,"ur":ur}
def w(id,ar,tr,en,ur,hook=None,kind="word"):
    d={"id":id,"kind":kind,"ar":ar,"tr":tr,"en":en,"ur":ur}
    if hook: d["hook"]=H(*hook)
    return d
def ay(id,ref,tr,en,ur): return {"id":id,"kind":"ayah","quran":ref,"ar":"","tr":tr,"en":en,"ur":ur}
items=[]; units=[]
def unit(uid,en,ur,its,refs=()):
    items.extend(its); units.append({"id":uid,"title":{"en":en,"ur":ur},"items":list(refs)+[x["id"] for x in its]})
unit("q-fatiha","Al-Fatiha","سورۃ الفاتحہ",[],[f"um-fat{i}" for i in range(1,8)])
unit("q-salah","Words of the salah","نماز کے الفاظ",[
 w("qd-subhanallah","سُبْحَانَ اللَّهِ","subhanallah","Glory be to Allah","اللہ پاک ہے",kind="dua"),
 w("qd-alhamdulillah","الْحَمْدُ لِلَّهِ","al-hamdu lillah","All praise is for Allah","سب تعریف اللہ کے لیے ہے",kind="dua"),
 w("qd-akbar","اللَّهُ أَكْبَرُ","allahu akbar","Allah is the Greatest","اللہ سب سے بڑا ہے",kind="dua"),
 w("qd-tahleel","لَا إِلَٰهَ إِلَّا اللَّهُ","la ilaha illallah","There is no god but Allah","اللہ کے سوا کوئی معبود نہیں",kind="dua"),
 w("qd-istighfar","أَسْتَغْفِرُ اللَّهَ","astaghfirullah","I seek Allah's forgiveness","میں اللہ سے معافی مانگتا ہوں",kind="dua"),
 w("qd-ruku","سُبْحَانَ رَبِّيَ الْعَظِيمِ","subhana rabbiya l-'adheem","Glory be to my Lord, the Magnificent (in ruku')","پاک ہے میرا رب عظمت والا (رکوع)",kind="dua"),
 w("qd-sujood","سُبْحَانَ رَبِّيَ الْأَعْلَى","subhana rabbiya l-a'la","Glory be to my Lord, the Most High (in sujud)","پاک ہے میرا رب سب سے بلند (سجدہ)",kind="dua"),
 w("qd-samia","سَمِعَ اللَّهُ لِمَنْ حَمِدَهُ","sami'a llahu liman hamidah","Allah hears whoever praises Him","اللہ نے سن لی جس نے اس کی تعریف کی",kind="dua"),
 w("qd-rabbana","رَبَّنَا وَلَكَ الْحَمْدُ","rabbana wa laka l-hamd","Our Lord, and to You belongs all praise","اے ہمارے رب، تیرے ہی لیے سب تعریف ہے",kind="dua"),
])
unit("q-words1","Qur'an words 1","قرآنی الفاظ 1",[],[f"qw-{k}" for k in "allah rabb qala yawm ard sama kitab ilm rahma haqq".split()])
unit("q-words2","Qur'an words 2","قرآنی الفاظ 2",[],[f"qw-{k}" for k in "nas qalb noor salah janna nar amanu amilu salihat kafaru".split()])
unit("q-ikhlas","Surah Al-Ikhlas","سورۃ الاخلاص",[
 ay("q-112-1","112:1","qul huwa llahu ahad","Say: He is Allah, the One.","کہہ دیجیے: وہ اللہ ایک ہے۔"),
 ay("q-112-2","112:2","allahu s-samad","Allah, the Eternal Refuge.","اللہ بے نیاز ہے۔"),
 ay("q-112-3","112:3","lam yalid wa lam yulad","He neither begets nor is born.","نہ اس کی کوئی اولاد ہے اور نہ وہ کسی کی اولاد ہے۔"),
 ay("q-112-4","112:4","wa lam yakun lahu kufuwan ahad","And there is none comparable to Him.","اور کوئی اس کا ہمسر نہیں۔"),
])
unit("q-words3","Small but frequent words","چھوٹے مگر عام الفاظ",[
 w("qw-min","مِنْ","min","From, of","سے",("Same as Urdu ‘min’ in ‘minjumla’.","’من جملہ‘ والا ’من‘")),
 w("qw-fi","فِي","fi","In","میں",("‘Fi sabeelillah’ = in the way of Allah.","’فی سبیل اللہ‘")),
 w("qw-ala","عَلَى","'ala","On, upon","پر",("‘Assalamu alaykum’ = peace upon you.","’السلام علیکم‘ = آپ پر سلامتی")),
 w("qw-ila","إِلَى","ila","To, towards","کی طرف",("‘Inna ilayhi raji’un’ = to Him we return.","’انا الیہ راجعون‘")),
 w("qw-la","لَا","la","No, not","نہیں"),
 w("qw-inna","إِنَّ","inna","Indeed, truly","بے شک",("‘Inna lillahi’ = indeed to Allah…","’انا للہ‘")),
 w("qw-alladhina","الَّذِينَ","alladheena","Those who","وہ لوگ جو"),
 w("qw-huwa","هُوَ","huwa","He","وہ",("‘Qul huwa llahu ahad’.","’قل ہو اللہ احد‘")),
 w("qw-hum","هُمْ","hum","They","وہ سب"),
 w("qw-kana","كَانَ","kana","He was","وہ تھا"),
 w("qw-kull","كُلّ","kull","All, every","ہر، سب",("Urdu ‘kul’ (total).","اردو ’کُل‘")),
 w("qw-qul","قُلْ","qul","Say!","کہہ دیجیے",("The first word of the last four surahs that start ‘Qul’.","’قل‘ والی سورتیں")),
])
unit("q-names","Names and attributes of Allah","اللہ کے نام اور صفات",[
 w("qw-aleem","عَلِيم","'aleem","All-Knowing","سب جاننے والا",("Same root as ‘ilm’ and ‘aalim’.","’علم‘ اور ’عالم‘ کا مادہ")),
 w("qw-hakeem","حَكِيم","hakeem","All-Wise","حکمت والا",("Urdu ‘hakeem’ and ‘hikmat’.","’حکیم‘ اور ’حکمت‘")),
 w("qw-ghafoor","غَفُور","ghafoor","Most Forgiving","بہت بخشنے والا",("‘Maghfirat’ (forgiveness).","’مغفرت‘ کا مادہ")),
 w("qw-raheem","رَحِيم","raheem","Most Merciful","نہایت رحم والا",("‘Raheem’, as in the Bismillah.","بسم اللہ والا ’رحیم‘")),
 w("qw-rahman","الرَّحْمَٰن","ar-rahman","The Most Gracious","بڑا مہربان"),
 w("qw-qadeer","قَدِير","qadeer","All-Powerful","ہر چیز پر قادر",("‘Qudrat’ (power).","’قدرت‘ کا مادہ")),
 w("qw-samee","سَمِيع","samee'","All-Hearing","سب سننے والا"),
 w("qw-baseer","بَصِير","baseer","All-Seeing","سب دیکھنے والا",("‘Basarat’ (sight).","’بصارت‘ کا مادہ")),
])
unit("q-falaq","Surah Al-Falaq","سورۃ الفلق",[
 ay("q-113-1","113:1","qul a'oodhu bi-rabbi l-falaq","Say: I seek refuge in the Lord of the daybreak","کہہ دیجیے: میں صبح کے رب کی پناہ مانگتا ہوں"),
 ay("q-113-2","113:2","min sharri ma khalaq","from the evil of what He created,","اس کی مخلوق کے شر سے"),
 ay("q-113-3","113:3","wa min sharri ghasiqin idha waqab","and from the evil of darkness when it settles,","اور اندھیری رات کے شر سے جب وہ چھا جائے"),
 ay("q-113-4","113:4","wa min sharri n-naffathati fi l-'uqad","and from the evil of those who blow on knots,","اور گرہوں میں پھونکنے والیوں کے شر سے"),
 ay("q-113-5","113:5","wa min sharri hasidin idha hasad","and from the evil of an envier when he envies.","اور حسد کرنے والے کے شر سے جب وہ حسد کرے"),
])
unit("q-words4","This world and the next","دنیا اور آخرت",[
 w("qw-dunya","الدُّنْيَا","ad-dunya","This world","دنیا"),
 w("qw-akhira","الْآخِرَة","al-akhira","The Hereafter","آخرت"),
 w("qw-mawt","مَوْت","mawt","Death","موت"),
 w("qw-hayat","حَيَاة","hayat","Life","زندگی",("Urdu ‘hayaat’.","اردو ’حیات‘")),
 w("qw-huda","هُدًى","huda","Guidance","ہدایت",("‘Hidayat’ is the same root.","’ہدایت‘ کا مادہ")),
 w("qw-sirat","صِرَاط","sirat","Path","راستہ",("‘Sirat-ul-mustaqeem’ in Al-Fatiha.","فاتحہ کا ’صراط مستقیم‘")),
 w("qw-adhab","عَذَاب","'adhab","Punishment","عذاب"),
 w("qw-ajr","أَجْر","ajr","Reward","اجر",("Urdu ‘ajr’ (reward).","اردو ’اجر‘")),
 w("qw-khayr","خَيْر","khayr","Good","بھلائی",("Urdu ‘khair’.","اردو ’خیر‘")),
 w("qw-deen","دِين","deen","Religion; judgement","دین؛ جزا",("‘Yawm ad-deen’ = Day of Judgement.","’یوم الدین‘")),
])
unit("q-nas","Surah An-Nas","سورۃ الناس",[
 ay("q-114-1","114:1","qul a'oodhu bi-rabbi n-nas","Say: I seek refuge in the Lord of mankind,","کہہ دیجیے: میں لوگوں کے رب کی پناہ مانگتا ہوں"),
 ay("q-114-2","114:2","maliki n-nas","the King of mankind,","لوگوں کے بادشاہ کی"),
 ay("q-114-3","114:3","ilahi n-nas","the God of mankind,","لوگوں کے معبود کی"),
 ay("q-114-4","114:4","min sharri l-waswasi l-khannas","from the evil of the whisperer who withdraws,","وسوسہ ڈالنے والے، پیچھے ہٹ جانے والے کے شر سے"),
 ay("q-114-5","114:5","alladhi yuwaswisu fi sudoori n-nas","who whispers in the hearts of mankind,","جو لوگوں کے دلوں میں وسوسہ ڈالتا ہے"),
 ay("q-114-6","114:6","mina l-jinnati wa n-nas","from among the jinn and mankind.","جنوں میں سے ہو یا انسانوں میں سے"),
])
unit("q-words5","Virtues","اچھی صفات",[
 w("qw-sabr","صَبْر","sabr","Patience","صبر"),
 w("qw-shukr","شُكْر","shukr","Gratitude","شکر"),
 w("qw-dhikr","ذِكْر","dhikr","Remembrance","ذکر",("Urdu ‘zikr’; Arabic ذ = dh.","اردو ’ذکر‘؛ عربی میں ذ = dh")),
 w("qw-taqwa","تَقْوَى","taqwa","God-consciousness","تقویٰ"),
 w("qw-tawba","تَوْبَة","tawba","Repentance","توبہ"),
 w("qw-iman","إِيمَان","iman","Faith","ایمان"),
 w("qw-ihsan","إِحْسَان","ihsan","Excellence, doing good","احسان"),
 w("qw-adl","عَدْل","'adl","Justice","عدل، انصاف",("Urdu ‘adl’ and ‘adaalat’.","’عدل‘ اور ’عدالت‘")),
])
unit("q-kawthar","Surah Al-Kawthar","سورۃ الکوثر",[
 ay("q-108-1","108:1","inna a'taynaka l-kawthar","Indeed, We have given you al-Kawthar (abundance).","بے شک ہم نے آپ کو کوثر عطا کی"),
 ay("q-108-2","108:2","fa-salli li-rabbika wa nhar","So pray to your Lord and sacrifice.","پس اپنے رب کے لیے نماز پڑھیں اور قربانی کریں"),
 ay("q-108-3","108:3","inna shani'aka huwa l-abtar","Indeed, your enemy is the one cut off.","بے شک آپ کا دشمن ہی بے نام و نشان ہے"),
])
unit("q-words6","Creation","کائنات",[
 w("qw-shams","شَمْس","shams","Sun","سورج",("‘Shamsi’ calendar = solar.","’شمسی‘ سال")),
 w("qw-qamar","قَمَر","qamar","Moon","چاند",("‘Qamari’ calendar = lunar.","’قمری‘ سال")),
 w("qw-layl","لَيْل","layl","Night","رات"),
 w("qw-nahar","نَهَار","nahar","Daytime","دن"),
 w("qw-bahr","بَحْر","bahr","Sea","سمندر",("‘Bahr-e-Arab’ = Arabian Sea.","’بحیرۂ عرب‘")),
 w("qw-nafs","نَفْس","nafs","Soul, self","نفس، جان"),
 w("qw-insan","إِنْسَان","insan","Human being","انسان"),
 w("qw-rasool","رَسُول","rasool","Messenger","رسول"),
])
unit("q-asr","Surah Al-Asr","سورۃ العصر",[
 ay("q-103-1","103:1","wal-'asr","By time,","زمانے کی قسم"),
 ay("q-103-2","103:2","inna l-insana la-fee khusr","indeed, mankind is in loss,","بے شک انسان خسارے میں ہے"),
 ay("q-103-3","103:3","illa lladheena amanu wa 'amilu s-salihati wa tawasaw bil-haqqi wa tawasaw bis-sabr","except those who believe, do good deeds, and urge one another to the truth and to patience.","سوائے ان کے جو ایمان لائے، نیک عمل کیے، اور ایک دوسرے کو حق اور صبر کی تلقین کی"),
])
pack={"id":"quran","title":{"en":"Qur'anic Arabic","ur":"قرآنی عربی"},"units":units,"items":items}
pack["planned"]=sum(len(u["items"]) for u in units)
json.dump(pack,open('content/quran.json','w'),ensure_ascii=False,indent=1)
print('quran', len(items), pack['planned'])
