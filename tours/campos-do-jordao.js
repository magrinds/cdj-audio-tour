// Campos do Jordão: built-in tour for Right Here, Right Now.
// Hook functions run inside the app and may use its globals (played, lastFix, dist, queue).
(window.TOUR_DEFS = window.TOUR_DEFS || {})['campos-do-jordao'] = (function(){
const STOPS = [
 { id:"drive1", name:"Drive up to Alto da Boa Vista (museum)", lat:-22.7194257, lng:-45.5611975, radius:0, walk:false, mapLabel:"Hotel",
   text:`Welcome to Campos do Jordão, the highest city in Brazil, at roughly one thousand six hundred and twenty eight meters. That's higher than Denver. As we climb out of Capivari, look at the chalets, the half-timbered facades, and the French hotel names. It's a deliberate European illusion, but the town has a very Brazilian story underneath.
The name first. The land once belonged to a brigadier named Jordão. He bought a ranch called Fazenda Bonsucesso and renamed it Natal, but everyone simply called it "os Campos do Jordão": Jordão's fields. Back then it was customary to attach the owner's name to the property. So, loosely translated, you are staying in Jordan's Pasture.
The official founding came in 1874, when Mateus da Costa Pinto formed a small settlement called Vila de São Mateus de Imbiri, named after a nearby stream. It took a long time to grow up. Campos do Jordão only became its own independent municipality in 1934.
Now look up at the trees. Those tall pines shaped like candelabras are Araucarias, the signature tree of the Serra da Mantiqueira mountains. Their seed, called pinhão, is a beloved winter snack here, boiled or roasted. It's out of season in November, but if you see pinhão on a menu, now you know.
Our first stop is an outdoor sculpture museum set in native forest. Enjoy the ride.` },

 { id:"jaguaribe", name:"Vila Jaguaribe (drive-by)", lat:-22.7287426, lng:-45.583387, radius:350, walk:false, mapLabel:"Jaguaribe", before:"felicia",
   text:`We're rolling through Vila Jaguaribe, one of the oldest parts of town. Historians say the city started from this little village and spread along the valley of the Capivari stream, which created the neighborhoods you know today.
And here's a fun one. Capivari comes from the Tupi language and means river of the capybaras, the giant guinea pigs of South America. So the fanciest shopping street in the Brazilian Switzerland is named after a rodent the size of a Labrador.
In the sanatorium years, Jaguaribe and Abernéssia were packed with boarding houses for patients. Some were run by families who rented every spare room, because the hospitals never had enough beds. Keep an eye out for older wooden houses with deep porches. Porches mattered here: patients were prescribed hours of rest in the open mountain air, wrapped in blankets, every single day.` },
 { id:"mantiqueira", name:"Climbing the Mantiqueira", lat:-22.7365, lng:-45.6045, radius:400, walk:false, mapLabel:"", before:"felicia",
   text:`We're climbing now on Avenida Adhemar de Barros, toward the Alto da Boa Vista, the "high good view." Watch your ears pop.
These mountains are the Serra da Mantiqueira, and the name is pure poetry. It comes from the Tupi language and is usually translated as "the mountain that weeps," or "the mountain that cries." The tears are water. These hills are full of springs and streams that feed rivers for millions of people in São Paulo, Minas Gerais, and Rio de Janeiro.
The Mantiqueira runs for hundreds of kilometers along the border of three states, and its peaks rise to almost three thousand meters. On a clear day from up here you can look down into the Paraíba Valley, the industrial corridor between São Paulo and Rio.
Up ahead, our first stop: a museum where the art lives outdoors, in the forest.` },
 { id:"mercado", name:"Mercado Municipal (drive-by)", lat:-22.7385814, lng:-45.5927793, radius:150, walk:false, mapLabel:"", after:"felicia",
   text:`On your side, that's the Municipal Market of Campos do Jordão. Let's be honest: it has seen better days, and locals have been asking for a renovation for years. But markets like this are where the real town shops, away from the Capivari price tags. In season you'll find mountain produce, cheeses, cured meats, and pinhão by the sack in winter.` },
 { id:"teresinha", name:"Igreja Santa Teresinha", lat:-22.7399843, lng:-45.5917832, radius:120, walk:false, mapLabel:"", after:"felicia",
   text:`Nearby is the parish church of Santa Teresinha, the main church of Abernéssia, dedicated to Saint Thérèse of Lisieux, the French nun known as the Little Flower. Visitors say it looks simple from the outside, but the inside is a surprise, with a beautiful ceiling and colorful stained glass windows. If the door is open and you have five minutes, peek in.` },

 { id:"felicia", name:"Museu Felícia Leirner", lat:-22.743852, lng:-45.632977, radius:130, walk:true, mapLabel:"Museum",
   text:`Welcome to the Felícia Leirner Museum. Nearly ninety sculptures, in bronze, white cement, and granite, are set outdoors along these forest paths.
The artist's story is wonderful. Felícia, Feiga in the original Polish, was born in Warsaw in 1904 to a family of modest means. Her son remembered that she sang in the chorus of the Warsaw Opera, and that's where his father fell in love with her. She arrived in Brazil in 1927.
Here's the inspiring part. For two decades she was a São Paulo wife and mother of three. Then, at age forty four, she began studying sculpture with Victor Brecheret, the most famous modernist sculptor in Brazil. Fifteen years later, in 1963, she won Best Brazilian Sculptor at the São Paulo Biennial. Her work is now in collections including the Hermitage in Russia. Never too late.
Why here? In 1962, shaken by her husband's death, she moved from São Paulo to Campos do Jordão and brought her work with her. She donated the sculptures, and this museum officially opened in 1979. She lived here until she died in 1996, at ninety two.
As you walk, notice how the pieces change. In the 1950s her themes were motherhood and family. Later she moved into abstraction. She placed many pieces herself, choosing spots in the forest that suited each one. She also wrote poetry, published after her death.
And look around at the forest itself. This is a remnant of the Atlantic Forest, the Mata Atlântica, which once covered Brazil's coast and is now one of the most threatened ecosystems on Earth. You are walking through something rare.` },

 { id:"auditorio", name:"Auditório Claudio Santoro", lat:-22.7427005, lng:-45.6336612, radius:70, walk:true, mapLabel:"",
   text:`That big building of glass and stone is the Claudio Santoro Auditorium. It seats eight hundred and fourteen people, and it's the main stage of the Campos do Jordão International Winter Festival, the biggest classical music event in Latin America.
The festival actually started in 1970 inside the Governor's Palace, which we'll pass on the way down. It grew so popular that it needed its own hall. Construction began here in 1975, and the auditorium opened in 1979.
The namesake has a dramatic story. Claudio Santoro was a composer and conductor born in Manaus, deep in the Amazon. On March twenty seventh, 1989, he was in Brasília conducting the dress rehearsal for the season's first concert, a tribute to the two hundredth anniversary of the French Revolution, when he suffered a massive heart attack on stage. He was sixty nine. He died doing exactly what he loved. That same year, this auditorium and the National Theater in Brasília were both renamed in his honor.
A fun fact for bossa nova fans: Santoro wrote thirteen songs with the poet Vinícius de Moraes, the lyricist of The Girl from Ipanema.
If the doors are open, peek inside. The steep seating gives every seat a great view of the stage.` },

 { id:"palacio", name:"Palácio Boa Vista (drive-by)", lat:-22.7359333, lng:-45.6127636, radius:350, walk:false, mapLabel:"Palácio",
   text:`Coming up is the Palácio Boa Vista, the official winter residence of the Governor of São Paulo. It's closed on Mondays and Tuesdays, so today we're admiring it from the road.
It was a twenty six year construction project. Work started in 1938, ordered by Adhemar de Barros, who was then the federally appointed administrator of São Paulo. It was finished only in 1964, and Adhemar inaugurated it himself on July twenty first, 1964, by then as the elected governor.
Adhemar de Barros is one of the most colorful figures in Brazilian politics. He was a populist builder, and his supporters' unofficial slogan was "rouba, mas faz," which means "he steals, but he gets things done." Brazilians still use that phrase today for that type of politician. Starting a palace as an appointee and finishing it a quarter century later as governor is a fitting monument to the man. And yes, the avenue we're driving on is named after him too.
Inside are about three thousand two hundred square meters, thirty five spaces and one hundred and five rooms, with furniture from the seventeenth to the twentieth centuries, porcelain, silver, heavy velvet curtains, and art including Tarsila do Amaral, Brazil's most famous modernist painter. A funny detail: because the governor still uses it, especially on weekends, phones and cameras are not allowed inside.
In 1970 it was declared a public monument and opened to visitors, and that same year its grand hall hosted the first winter concerts, which grew into the festival we just learned about. If you're still in town Wednesday through Sunday, the guided tour is free.` },

 { id:"tb", after:"felicia", name:"The tuberculosis story (drive down)", lat:-22.7365, lng:-45.6045, radius:400, walk:false, mapLabel:"",
   text:`As we drive downhill, here's the big story nobody tells you in Capivari. This town exists because of tuberculosis.
In the early twentieth century, the sanitarian doctor Emílio Ribas, who had studied the disease in Europe, decided the cold, dry mountain air of the Mantiqueira was the ideal place for sanatoriums. The fresh air was the treatment.
The problem was getting sick people up the mountain. Before the railway, the climb was made on foot, on horseback, or in litters carried by enslaved people. So Ribas and his colleague Victor Godinho built a railway. It opened on November fifteenth, 1914, and runs forty seven kilometers, climbing from five hundred and fifty five meters in the Paraíba Valley to nearly one thousand six hundred meters here. A medical footnote: despite Ribas doing much of the pioneering work, history mostly credits Oswaldo Cruz for those public health campaigns. The railway is in the news again, by the way. The state is handing it to a private operator, with plans to bring back the Maria Fumaça steam train.
The town filled with patients. By the mid 1940s there were fourteen sanatoriums, plus dozens of boarding houses that were never enough. The town was even run as a special "sanitary prefecture" starting in 1926. There's a famous Brazilian novel, Floradas na Serra, about the lives of patients recovering in these boarding houses.
Then, from the 1950s on, antibiotics defeated tuberculosis, and the town lost its reason to exist. So it reinvented itself as a mountain resort, and leaned into Swiss and German architecture to attract tourists. The Brazilian Switzerland is the rebrand of a former hospital town.` },

 { id:"abernessia", after:"felicia", name:"Vila Abernéssia", lat:-22.7382467, lng:-45.5919284, radius:300, walk:false, mapLabel:"Abernéssia",
   text:`Welcome to Abernéssia, the Scottish neighborhood. This district was built by a Scottish engineer named Robert John Reid, born in Aberdeen and educated at Oxford. He was a very tall man, and he used to walk around town wearing a traditional kilt. Picture that in rural Brazil a hundred years ago.
The name Abernéssia doesn't exist in Scotland. Reid invented it. A local historian says it blends Aberdeen, where Reid was born, Inverness, and Escócia, the Portuguese word for Scotland. The area used to be called simply Vila Nova, the New Village. Then Reid donated land for the train station and insisted it carry the same name as his own property. Classic move: donate the land, name the station.
He was paid for his surveying work in land, and as that historian put it, he became very rich in land, but at the time land up here was worth almost nothing. His heirs probably feel differently today.
Look for the Abernéssia train station. It first opened in 1919 and was rebuilt in 1975, in a style that recalls old Scottish railway stations.
This is the real working town. City hall, the courthouse, the municipal market, pharmacies and shops are here, and this is also where most of the old sanatoriums stood. Capivari's Swiss look is the top layer. Underneath is this older town of Scots, doctors, and patients.
Today the local economy runs almost entirely on tourism, especially in July, when the Winter Festival and the cold weather crowds from São Paulo fill the town. Local specialties include trout farmed in the mountain streams, artisanal chocolate, and craft beer. Enjoy lunch.` },

 { id:"mosteiro", name:"Mosteiro de São João", lat:-22.7362131, lng:-45.5958014, radius:90, walk:true, mapLabel:"Mosteiro",
   text:`Welcome to the Monastery of Saint John, home to Benedictine nuns. They belong to the oldest religious order in the Western world, founded by Saint Benedict in Italy in the year 529.
The monastery was founded in 1964, the same year the Governor's Palace up the hill was finished, on the very same avenue. That year the governor got his palace and the nuns got their monastery.
The Benedictine motto is "ora et labora," pray and work, and the shop is the work part. By tradition, the nuns live from their own labor: cookies, breads, cakes, jams, and handicrafts. There's a social side too. Through a "Mothers' Club," women from low income families learn crafts and help the nuns make the sweets sold in the shop.
A shopping tip for anyone watching saturated fat: the nuns' jams, called geleias, are essentially fat free. Pair them with plain bread rather than the butter cakes. The shop also sells famous handmade chocolates made by Trappist nuns in Santa Catarina, so that's nun to nun chocolate, from more than five hundred kilometers away.
Wander down the path through the cypress grove to the little lake and the grotto. It's a place made for slowing down.
And if you're still in town at a quarter to six this evening, the nuns sing Vespers in the chapel, with Gregorian chant in Latin, Greek, and Portuguese. It's free and open to everyone. The shop closes for a break from about a quarter to three until half past three, so shop first.
Thank you for joining the tour. I hope Campos do Jordão now feels like more than chocolate and chalets.` }
];




const MUSEUM = [
 {id:"m_start", name:"How to walk the museum", look:"Look for: the map board and phase signs", text:`Welcome to the walking part of the museum. Here's how it works. The sculptures are laid out along forest paths in five sections, one for each phase of Felícia's career, and the artist herself chose where many of them stand. Signs mark each phase and show how steep each path is. There are a few climbs, so take it slow. Every sculpture has a small plaque with its name, material, and phase, and some have QR codes with more information. Tap the next track in the Museum walk list each time you reach a new phase sign. The whole loop takes about an hour at an easy pace. And remember: this is a living garden, with more than a hundred species of Mantiqueira plants, so look up as often as you look at the art.`},
 {id:"m_figurative", name:"Phase 1 · Figurative (1950 to 1958)", look:"Look for: bronze figures, mothers and children", text:`This is where it all began: the Figurative phase, from 1950 to 1958, mostly in bronze. Remember, Felícia only started sculpting at forty four, studying with Victor Brecheret, the sculptor behind the giant Monument to the Bandeirantes in São Paulo's Ibirapuera Park. You can feel his influence in these smooth, heavy, monumental forms.
Her subjects here are human, and very personal: mothers, children, couples, families. She had spent twenty years raising three children, and that life is right here in bronze. Look at how the figures lean into each other, and how arms and bodies merge into a single shape.
She was good, and fast. In 1955 she won an acquisition prize from the Museum of Modern Art in Rio de Janeiro, and by 1957 her sculptures had entered the collections of the São Paulo Museum of Art, MASP, and the Museum of Modern Art in Paris.`, quiz:{ask:"In this first phase, what were Felícia's favorite subjects?", ans:"People: mothers, children, couples and families."}},
 {id:"m_toward", name:"Phase 2 · Toward abstraction (1958 to 1961)", look:"Look for: figures starting to dissolve into shapes", text:`Now watch the people start to disappear. This is the phase called A Caminho da Abstração, on the way to abstraction, from 1958 to 1961.
What changed? The São Paulo Biennial. Starting in 1951, this huge international exhibition brought the newest European and American art to Brazil, and it shook up a whole generation of artists. Felícia exhibited there, saw abstract art up close, and began to loosen her grip on the human figure.
Play a game here: in each sculpture, try to find the person who is still hiding inside. Sometimes it's a head, sometimes the curve of a back, sometimes just a gesture. A few years earlier these would have been obvious figures. Now they're halfway to pure form.`},
 {id:"m_abstract", name:"Phase 3 · Abstract (1963 to 1965)", look:"Look for: sculptures set in alleys and semicircles", text:`Welcome to the Abstract phase, 1963 to 1965. The figures are gone. What's left is pure form, texture, and rhythm.
Notice how these pieces are displayed, in alleys and semicircles, surrounded by Mantiqueira plants. Walk around them. Abstract sculpture changes completely depending on where you stand, and on the light through the trees.
This is the phase of her biggest honor. In 1963, at the São Paulo Biennial, the same exhibition that had transformed her style, Felícia was named Best Brazilian Sculptor. Not bad for someone who had picked up her first sculpting tools just fifteen years earlier.
It was also a time of grief and change. In 1962 her husband died, and she left São Paulo to live here in Campos do Jordão, closer to nature. Keep that in mind for the next phase, because nature is about to take over her work.`, quiz:{ask:"What award did Felícia win at the 1963 São Paulo Biennial?", ans:"Best Brazilian Sculptor."}},
 {id:"m_organic", name:"Phase 4 · Organic (1966 to 1970)", look:"Look for: white reinforced-cement shapes like seeds and stones", text:`This is the Organic phase, from 1966 to 1970, and the material changes too: reinforced cement instead of bronze.
By now Felícia was living up here in the mountains, and you can see it. These shapes feel grown rather than made. Look for forms that remind you of seeds, pods, river stones, bones, or shells. Nothing here has a straight edge, because almost nothing in a forest does.
Here's a detail many visitors miss: these sculptures are a lot of work to keep. They stand outdoors all year in mountain rain, sun, and frost, so the museum runs a permanent conservation program to keep them from wearing away.
Nearby you may also find a series called Bichos, which means critters, or little animals. See which creatures you can spot among the trees.`},
 {id:"m_recortes", name:"Phase 5 · Recortes na Paisagem (1980 to 1982)", look:"Look for: cut-out shapes among the Araucaria pines", text:`The final phase, and the one made for this exact place: Recortes na Paisagem, cut-outs in the landscape, from 1980 to 1982. Felícia was in her late seventies when she made them.
These pieces stand among the Araucaria pines on purpose. Try this: crouch down and look through the openings and gaps in each sculpture. They frame the forest, the sky, and the mountains like windows. The landscape becomes part of the artwork, and the artwork becomes a way of looking at the landscape.
It's a beautiful ending to a career that began with bronze mothers and children in a São Paulo studio. Thirty years later, the subject is this mountain itself. She finished her work for the museum in 1982, and lived here until she died in 1996, at ninety two.`, quiz:{ask:"What does Recortes na Paisagem mean?", ans:"Cut-outs in the landscape. The sculptures frame the forest like windows."}},
 {id:"m_concha", name:"The acoustic shell and the view", look:"Look for: Pedra do Baú on the horizon", text:`Before you leave, find the concha acústica, the outdoor acoustic shell. It's used for concerts and cultural events, and on a clear day it has one of the best views on the property.
Look to the horizon for Pedra do Baú, a huge granite rock formation shaped a bit like a trunk or a chest. Baú means trunk in Portuguese. At almost two thousand meters, it's one of the most famous landmarks of the Mantiqueira, and climbers come from all over Brazil to scale it on iron rungs fixed into the rock.
Take a moment here. You've just walked through thirty years of one woman's life, from Warsaw to Campos do Jordão. When you're ready, head back toward the auditorium, and don't forget to arrange your ride back down.`}
];

const LOOKDETAIL = {
 m_start:{sign:"Start at the map board near the entrance. Phase signs name each section and show how steep the path is.", art:"Every sculpture has a small plaque: name, material, and phase. Some have QR codes."},
 m_figurative:{sign:"Sign: <b>Fase Figurativa</b> (1950 to 1958)", art:"Dark bronze human figures: mothers with children, couples, families, with smooth heavy forms and bodies merging together."},
 m_toward:{sign:"Sign: <b>A Caminho da Abstração</b> (1958 to 1961)", art:"Figures dissolving into shapes. Hunt for the hidden person: a head, a curved back, a gesture."},
 m_abstract:{sign:"Sign: <b>Fase Abstrata</b> (1963 to 1965)", art:"Pure shapes, no figures, set along alleys and in semicircles among Mantiqueira plants. Walk all the way around them."},
 m_organic:{sign:"Sign: <b>Fase Orgânica</b> (1966 to 1970)", art:"White or gray reinforced cement, rounded like seeds, pods, river stones or shells. Nearby, look for the <b>Bichos</b> (little animals) series."},
 m_recortes:{sign:"Sign: <b>Recortes na Paisagem</b> (1980 to 1982)", art:"Pieces with openings and cut-outs, standing among the Araucaria pines. Crouch and look through the gaps to frame the forest."},
 m_concha:{sign:"Find the <b>concha acústica</b>, the outdoor acoustic shell.", art:"On the horizon: <b>Pedra do Baú</b>, a giant granite block shaped like a trunk, almost 2,000 m high."}
};
const ORDER=['drive1','jaguaribe','mantiqueira','felicia','auditorio','palacio','tb','abernessia','mercado','teresinha','mosteiro'];
STOPS.sort((a,b)=>ORDER.indexOf(a.id)-ORDER.indexOf(b.id));
const FILLERS = [
 {id:"f_ribas", name:"Story: the doctor who let mosquitoes bite him", text:`While we drive, a story about Emílio Ribas, the doctor behind this town's railway. In the early 1900s, many doctors still believed yellow fever spread through dirty clothes and bedding. Ribas believed the real culprit was a mosquito. To prove it, he and fellow volunteers let themselves be bitten by mosquitoes that had fed on yellow fever patients. They got sick, they survived, and the experiment helped convince Brazil to fight the mosquito instead of burning patients' sheets. Today São Paulo's main infectious disease hospital is named after him: the Instituto Emílio Ribas.`},
 {id:"f_araucaria", name:"Story: the tree and the forgetful bird", text:`Look out the window for the Araucaria pines, the ones shaped like candelabras. Their family is ancient. Their ancestors were around in the age of the dinosaurs. Today the Paraná pine is critically endangered, after a century of logging. There's a lovely legend about how these forests spread. A bird called the gralha azul, the azure jay, buries pinhão seeds to eat later, then forgets where it hid many of them. The forgotten seeds sprout. So, the story goes, a forgetful blue bird has been planting these forests for thousands of years.`},
 {id:"f_food", name:"Story: what to eat in the mountains", text:`Let's talk food. Mountain food here is cold weather food, and Brazilians drive hours for it. Fondue, of cheese and of chocolate, is practically a religion in July. Trout is raised in the cold mountain streams and shows up grilled, smoked, or in pâté. Chocolate shops line Capivari, and craft beer is big too. And in winter, the star is pinhão, the Araucaria seed: boiled, roasted on a wood stove, or ground into a sweet paçoca. For anyone watching saturated fat, grilled trout is your best friend on these menus.`},
 {id:"f_winter", name:"Story: Brazil's winter capital", text:`Here's the strange thing about Campos do Jordão: most of Brazil is warm all year, so cold is the attraction. In July, during school holidays and the Winter Festival, the town's population can multiply, roads jam, and hotel prices soar. Paulistanos come up to wear the wool coats they never get to use at home, sit by fireplaces, and eat fondue. Some winter nights the temperature drops below freezing and the fields turn white with frost. You're here in spring, which means fewer crowds, lower prices, and the hydrangeas starting to bloom.`},
 {id:"f_swiss", name:"Story: how a hospital town became Switzerland", text:`Think about the timeline. In the 1940s, this was a town of sanatoriums, coughing patients, and boarding houses. Healthy visitors were nervous to come. When antibiotics arrived and tuberculosis retreated, the town needed a new identity, fast. Developers and city leaders leaned into a European fantasy: chalets, half timbering, Swiss and German names, fondue. It worked brilliantly. The nickname "the Brazilian Switzerland" stuck. But every time you see a postcard chalet, remember it's a costume, worn by a town that was built to heal.`},
 {id:"f_cafe", name:"Story: coffee with milk politics", text:`Look at a map and you'll see we're right near the border between São Paulo and Minas Gerais. Those two states once ran Brazil between them. In the early republic, from the 1890s to 1930, power famously alternated between São Paulo, the coffee giant, and Minas Gerais, the dairy and cattle state. Brazilians nicknamed it the politics of café com leite, coffee with milk. The arrangement collapsed in 1930, when Getúlio Vargas took power in a revolution and went on to rule Brazil for most of the next fifteen years.`},
 {id:"f_1932", name:"Story: São Paulo's war of 1932", text:`Two years after Vargas took power, São Paulo rebelled. In July 1932 the state rose up demanding a new constitution, in what's called the Constitutionalist Revolution. It was a real war, with trenches, artillery, and volunteers, and some of the fighting was in these very mountains: the Mantiqueira passes on the border with Minas Gerais, including the famous railway tunnel near Cruzeiro, were front lines. São Paulo lost within three months, but Vargas did call a constitutional assembly. July ninth is still a state holiday here.`},
 {id:"f_hydrangea", name:"Story: the flowers that change color", text:`Keep an eye out for hortênsias, hydrangeas, which love this mountain climate and start blooming around now, in spring. Here's the magic trick: the same plant can be blue or pink depending on the soil. In acidic soil, the plant can absorb aluminum, and the flowers turn blue. In more alkaline soil, they turn pink. So the color of a hydrangea is basically a soil test you can see from the road.`},
 {id:"f_boil", name:"Story: why pasta takes longer up here", text:`A fun bit of altitude science. At sea level, water boils at one hundred degrees Celsius. Up here, at about sixteen hundred meters, the air pressure is lower, so water boils at around ninety five degrees. That means your pasta and beans cook in slightly cooler water and take longer. It's also why mountain cooks love pressure cookers, which are in nearly every Brazilian kitchen anyway. And pilots will appreciate this: the thinner air is the same reason engines and wings lose performance at high-altitude airports.`},
 {id:"f_embraer", name:"Story: the aerospace valley below us", text:`Down in the Paraíba Valley, about an hour from here, is São José dos Campos, the heart of Brazil's aerospace industry. It's home to Embraer, founded in 1969, now one of the world's biggest makers of regional jets, and to ITA, the Aeronautics Institute of Technology, one of Brazil's toughest engineering schools. Brazil's national space research institute, INPE, is there too. So the valley that once carried tuberculosis patients up this mountain by train now builds airplanes that fly all over the world.`},
 {id:"f_pix", name:"Story: how Brazil pays", text:`You'll notice almost nobody here pays with cash. That's thanks to Pix, an instant payment system launched by Brazil's Central Bank in November 2020. You scan a QR code or type a phone number, and the money arrives in seconds, for free, any hour of the day. It spread incredibly fast. Street vendors, taxis, and tiny market stalls all take it. Many Brazilians now use it more than credit cards, and other countries study it as a model.`},
 {id:"f_capybara", name:"Story: the capybara, mascot of Capivari", text:`Back to the animal that named Capivari. The capybara is the largest rodent in the world, often weighing over fifty kilos. It's semi-aquatic, with slightly webbed feet, and can stay underwater for several minutes to hide from predators. Capybaras are famously calm and social. Online they've become known as the chillest animal on Earth, often photographed with birds, monkeys, or even other animals sitting on their backs. So when you walk through fancy Capivari tonight, remember: it's named after a giant, relaxed guinea pig.`},
 {id:"f_cafezinho", name:"Story: the cafezinho", text:`If you visit someone in Brazil, or even an office or a shop, there's a good chance you'll be offered a cafezinho, a little coffee. It's a small, strong, usually very sweet black coffee, and offering one is a basic gesture of hospitality. Saying yes is polite, and it often starts a conversation. Brazil has been the world's largest coffee producer for more than a century, so the cafezinho is the national handshake. Tip for the low sugar crowd: ask for it "sem açúcar," without sugar.`}
];


const WALKSTORIES = [
 {id:"w_route", name:"Walk: Abernéssia on foot", text:`Here's your walking route through Abernéssia. The monastery sits at number 330 on Avenida Doutor Adhemar de Barros, the same avenue that climbs all the way up to the Governor's Palace. Walk downhill along it and the numbers drop. At number 26, near the bottom, is the Municipal Market. From there the Abernéssia train station is just a block away on Avenida Doutor Januário Miraglia, the main street of the working town. The church of Santa Teresinha is a short walk further, on Rua Tadeu Rangel Pestana. All of it fits in about fifteen minutes of easy, mostly downhill walking. The walking guide arrow at the top of the app will point the way.`},
 {id:"w_calcada", name:"Walk: watch the sidewalks", text:`A practical tip while we walk. In many Brazilian towns, each property owner is responsible for the sidewalk in front of their building. So the sidewalk can change every few meters: smooth stone, then broken tile, then a steep ramp into a garage, then a tree root. Locals walk looking down for a reason. Take it slow, especially downhill, and watch for steps and drainage gaps.`},
 {id:"w_signs", name:"Walk: reading the street", text:`Let's learn to read the street signs as we walk. Padaria is a bakery, and in Brazil it's also a café and snack bar. Farmácia is a pharmacy, and Drogaria means the same thing. Lanchonete is a snack bar. Açougue is a butcher. Mercado or supermercado is a grocery store. Rua is street, Avenida is avenue, and Praça is a square. And if you see "Aberto," it's open. "Fechado" means closed.`},
 {id:"w_padaria", name:"Walk: padaria culture", text:`If you pass a padaria, it's worth a peek inside. Brazilians stand at the counter for a quick pingado, coffee with a splash of milk, and a pão na chapa, a roll toasted on the griddle with butter. The famous pão de queijo, cheese bread, comes from the neighboring state of Minas Gerais, just across these mountains. For the low saturated fat crowd, the better padaria picks are a plain pão francês, fresh fruit juice, or a black coffee, and go easy on the cheese bread and the butter.`}
];

const QUIZ = {
 drive1:{ask:"Who was listening? Who is the town named after?", ans:"Brigadier Jordão, who owned the land. You're staying in Jordan's Pasture!"},
 felicia:{ask:"How old was Felícia when she started sculpting? Twenty four, forty four, or sixty four?", ans:"Forty four. Never too late!"},
 auditorio:{ask:"Which famous bossa nova lyricist wrote songs with Claudio Santoro?", ans:"Vinícius de Moraes, who wrote The Girl from Ipanema."},
 palacio:{ask:"How long did it take to build the palace? Six, sixteen, or twenty six years?", ans:"Twenty six years, from 1938 to 1964."},
 tb:{ask:"What was the mountain railway originally built to carry?", ans:"Tuberculosis patients, up to the sanatoriums."},
 abernessia:{ask:"The made up name Abernéssia blends which two Scottish places?", ans:"Aberdeen and Inverness, plus Escócia, Portuguese for Scotland."},
 jaguaribe:{ask:"What animal is the Capivari stream named after?", ans:"The capybara, the world's largest rodent!"},
 mantiqueira:{ask:"The Tupi name Mantiqueira is often translated as what?", ans:"The mountain that weeps, for all its springs and streams."},
 mosteiro:{ask:"What does the Benedictine motto, ora et labora, mean?", ans:"Pray and work. The shop is the work part!"}
};
const LOOK = { jaguaribe:"Look for: old wooden houses with deep porches", mantiqueira:"Look for: views down into the Paraíba Valley", mercado:"Look for: the Municipal Market on Av. Adhemar de Barros", teresinha:"Look for: the parish church of Santa Teresinha", drive1:"Look for: tall candelabra-shaped Araucaria pines", felicia:"Look for: bronze and cement shapes among the trees", auditorio:"Look for: the glass and stone concert hall",
  palacio:"Look for: the Tudor-style palace with its tower", tb:"Look for: old sanatorium buildings and the rail line", abernessia:"Look for: the Abernéssia train station", mosteiro:"Look for: the cypress grove, lake and grotto" };
const AR = (x,y,s)=>`<g transform="translate(${x},${y}) scale(${s})"><rect x="-2" y="-60" width="4" height="60" fill="#5a4030"/><path d="M0,-62 q-30,-4 -40,4 M0,-62 q30,-4 40,4 M0,-50 q-26,-2 -34,6 M0,-50 q26,-2 34,6" stroke="#2f5a3a" stroke-width="7" fill="none" stroke-linecap="round"/><ellipse cx="0" cy="-66" rx="26" ry="6" fill="#2f5a3a"/></g>`;
const SKY = (a,b)=>`<defs><linearGradient id="sk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs><rect width="400" height="225" fill="url(#sk)"/>`;
const HILLS = `<path d="M0,150 L60,95 L110,130 L170,80 L240,135 L300,90 L360,125 L400,100 L400,225 L0,225Z" fill="#7a9c86"/><path d="M0,175 Q100,140 200,170 T400,160 L400,225 L0,225Z" fill="#5c8569"/>`;
const SCENES = {
 drive1:{c:"Climbing out of Capivari", ox:"30%", oy:"60%", tx:"3%", ty:"-2%", svg:`${SKY('#9cc6e8','#e9f2f6')}<circle cx="330" cy="45" r="18" fill="#ffd77a"/>${HILLS}
   <g><path d="M70,190 l30,-25 l30,25z" fill="#8a3b2b"/><rect x="76" y="190" width="48" height="26" fill="#f2e6d0"/><path d="M76,195h48M100,190v26M76,205h48" stroke="#5a3a2a" stroke-width="2"/></g>
   <g><path d="M250,195 l26,-22 l26,22z" fill="#8a3b2b"/><rect x="255" y="195" width="42" height="22" fill="#f6efe2"/><path d="M255,200h42M276,195v22" stroke="#5a3a2a" stroke-width="2"/></g>
   ${AR(170,200,1.1)}${AR(350,205,0.9)}${AR(30,210,0.8)}`},
 felicia:{c:"Sculptures in the Atlantic Forest", ox:"60%", oy:"55%", tx:"-4%", ty:"-1%", svg:`${SKY('#bcd9c4','#e8f1ea')}<rect y="150" width="400" height="75" fill="#6f9a72"/>${AR(40,170,1.2)}${AR(360,165,1.3)}${AR(300,150,0.8)}
   <path d="M150,200 q-10,-60 20,-80 q30,20 15,80z" fill="#8b6b4a"/><circle cx="168" cy="130" r="10" fill="#8b6b4a"/>
   <path d="M215,205 c0,-40 50,-40 50,-80 c10,30 -10,60 10,80z" fill="#d9d4c7" stroke="#b8b2a3"/>
   <ellipse cx="200" cy="208" rx="120" ry="6" fill="#557a58" opacity=".6"/>`},
 auditorio:{c:"Auditório Claudio Santoro", ox:"50%", oy:"45%", tx:"-2%", ty:"2%", svg:`${SKY('#a9cbe3','#eef4f7')}${HILLS}
   <path d="M90,170 L200,95 L310,170Z" fill="#7d6a58"/><path d="M110,170 L200,110 L290,170Z" fill="#9ec4d8" opacity=".9"/>
   <path d="M140,170V145M170,170V125M200,170V110M230,170V125M260,170V145" stroke="#5c4d40" stroke-width="2"/>
   <rect x="80" y="170" width="240" height="20" fill="#6b5a4a"/>${AR(50,200,1)}${AR(355,200,1.1)}
   <g fill="#1d2420"><text x="150" y="88" font-size="14">♪</text><text x="245" y="80" font-size="18">♫</text></g>`},
 palacio:{c:"Palácio Boa Vista", ox:"45%", oy:"50%", tx:"2%", ty:"-2%", svg:`${SKY('#8fb9de','#eaf1f6')}<rect y="175" width="400" height="50" fill="#6e9670"/>
   <rect x="100" y="110" width="200" height="70" fill="#efe6d6"/><path d="M95,112 L200,80 L305,112Z" fill="#8a3b2b"/>
   <rect x="185" y="55" width="30" height="125" fill="#e6dcc9"/><path d="M180,58 L200,35 L220,58Z" fill="#8a3b2b"/>
   <g stroke="#5a3a2a" stroke-width="3"><path d="M100,130h200M100,155h200M130,110v70M160,110v70M240,110v70M270,110v70"/></g>
   <rect x="192" y="150" width="16" height="30" fill="#5a3a2a"/>${AR(40,190,1.1)}${AR(360,192,1.2)}`},
 tb:{c:"The sanatorium railway, 1914", ox:"40%", oy:"60%", tx:"-4%", ty:"-1%", svg:`${SKY('#d8cdb8','#f3eee4')}${HILLS}
   <path d="M0,195 L400,175" stroke="#4a3a2e" stroke-width="4"/><path d="M0,201 L400,181" stroke="#4a3a2e" stroke-width="2"/>
   <g transform="translate(120,150) rotate(-3)"><rect x="0" y="10" width="80" height="30" rx="4" fill="#2f2f2f"/><rect x="55" y="-8" width="25" height="24" fill="#3a3a3a"/><rect x="12" y="-6" width="10" height="18" fill="#2f2f2f"/>
   <circle cx="18" cy="44" r="8" fill="#555"/><circle cx="62" cy="44" r="8" fill="#555"/><rect x="85" y="12" width="70" height="26" rx="3" fill="#8a3b2b"/><path d="M92,18h12M112,18h12M132,18h12" stroke="#f3e2b0" stroke-width="6"/></g>
   <g fill="#fff" opacity=".85"><circle cx="138" cy="130" r="9"/><circle cx="152" cy="116" r="12"/><circle cx="172" cy="100" r="15"/></g>
   <rect x="300" y="120" width="70" height="45" fill="#f4efe4"/><path d="M295,122 L335,100 L375,122Z" fill="#7a6a5a"/><path d="M308,132h12M330,132h12M352,132h12M308,148h12M330,148h12M352,148h12" stroke="#7aa3c2" stroke-width="7"/>`},
 abernessia:{c:"Vila Abernéssia, a Scottish legacy", ox:"55%", oy:"55%", tx:"3%", ty:"-2%", svg:`${SKY('#a3c3d9','#edf2f5')}<rect y="185" width="400" height="40" fill="#9a9a90"/>
   <rect x="120" y="120" width="160" height="65" fill="#e8dcc8"/><path d="M112,122 L200,88 L288,122Z" fill="#5d4a3c"/><path d="M120,140h160" stroke="#5d4a3c" stroke-width="3"/>
   <rect x="150" y="150" width="20" height="35" fill="#5d4a3c"/><rect x="230" y="150" width="20" height="35" fill="#5d4a3c"/><rect x="185" y="145" width="30" height="16" fill="#7aa3c2"/>
   <text x="200" y="135" text-anchor="middle" font-size="10" font-weight="700" fill="#3a2a20">ABERNÉSSIA</text>
   <g transform="translate(330,150)"><circle cx="0" cy="0" r="7" fill="#e7c09a"/><rect x="-6" y="7" width="12" height="16" fill="#2d4a7a"/><path d="M-8,23 h16 l2,12 h-20z" fill="#b22222"/><path d="M-8,27h20M-4,23v12M3,23v12" stroke="#1d3a6a" stroke-width="2"/><rect x="-5" y="35" width="3" height="12" fill="#e7c09a"/><rect x="2" y="35" width="3" height="12" fill="#e7c09a"/></g>
   ${AR(50,200,1)}`},
 mosteiro:{c:"Mosteiro de São João", ox:"50%", oy:"55%", tx:"-3%", ty:"-2%", svg:`${SKY('#c9dcea','#f3f6f2')}<rect y="170" width="400" height="55" fill="#6f9a72"/>
   <g fill="#2f4a36"><path d="M40,175 q12,-90 24,0z"/><path d="M75,175 q12,-100 24,0z"/><path d="M320,175 q12,-95 24,0z"/><path d="M355,175 q12,-85 24,0z"/></g>
   <rect x="150" y="115" width="100" height="60" fill="#f1ebdf"/><path d="M142,118 L200,85 L258,118Z" fill="#8a3b2b"/><rect x="192" y="60" width="16" height="28" fill="#f1ebdf"/><path d="M200,45v15M193,52h14" stroke="#5a3a2a" stroke-width="3"/>
   <path d="M190,175v-25a10,10 0 0 1 20,0v25z" fill="#5a3a2a"/><ellipse cx="290" cy="200" rx="50" ry="10" fill="#7fb0c9"/><ellipse cx="290" cy="198" rx="30" ry="4" fill="#cfe6f0" opacity=".7"/>`}
};
const SCENE_ALIAS={jaguaribe:'drive1',mantiqueira:'tb',mercado:'abernessia',teresinha:'mosteiro'};
const PHOTO_Q = { m_start:"Museu Felícia Leirner", m_figurative:"Felícia Leirner bronze escultura", m_toward:"Felícia Leirner escultura museu", m_abstract:"Felícia Leirner escultura abstrata", m_organic:"Felícia Leirner escultura cimento", m_recortes:"Felícia Leirner Recortes na Paisagem", m_concha:"Pedra do Baú", w_route:"Abernéssia Campos do Jordão", drive1:"Capivari Campos do Jordão", jaguaribe:"Campos do Jordão cidade", mantiqueira:"Serra da Mantiqueira Campos do Jordão",
 felicia:"Museu Felícia Leirner", auditorio:"Auditório Claudio Santoro", palacio:"Palácio Boa Vista Campos do Jordão",
 tb:"Estrada de Ferro Campos do Jordão", abernessia:"Abernéssia Campos do Jordão", mercado:"Mercado Municipal Campos do Jordão",
 teresinha:"Santa Teresinha Campos do Jordão", mosteiro:"Mosteiro São João Campos do Jordão", f_araucaria:"Araucaria angustifolia forest",
 f_swiss:"Capivari Campos do Jordão", f_winter:"Campos do Jordão inverno", f_food:"Campos do Jordão Capivari restaurante", f_ribas:"Estrada de Ferro Campos do Jordão trem" };
const WALK = [
  {id:"mosteiro", name:"Mosteiro de São João", lat:-22.7362131, lng:-45.5958014},
  {id:"teresinha", name:"Igreja Santa Teresinha", lat:-22.7399843, lng:-45.5917832},
  {id:"mercado", name:"Mercado Municipal", lat:-22.7385814, lng:-45.5927793},
  {id:"estacao", name:"Estação Abernéssia", lat:-22.7382467, lng:-45.5919284},
  {id:"cezas", name:"Ceza's Restaurante", lat:-22.7338056, lng:-45.5860889},
  {id:"joao", name:"Restaurante do João", lat:-22.7400725, lng:-45.5925829},
  {id:"terra", name:"Terra Brasil Restaurante", lat:-22.7374672, lng:-45.5915418},
  {id:"museum", name:"Museu Felícia Leirner entrance", lat:-22.743852, lng:-45.632977},
  {id:"hotel", name:"Hotel Le Renard", lat:-22.7194257, lng:-45.5611975}
];
const DEST = {
  hotel:{name:"Hotel Le Renard", note:"Back to the hotel", lat:-22.7194257, lng:-45.5611975},
  museum:{name:"Museu Felícia Leirner", note:"Up in Alto da Boa Vista · open Tue to Sun, 9h to 18h", lat:-22.743852, lng:-45.632977, remote:true},
  palacio:{name:"Palácio Boa Vista", note:"Closed Mon and Tue · free tours Wed to Sun 10h to 12h, 14h to 17h", lat:-22.7359333, lng:-45.6127636},
  mosteiro:{name:"Mosteiro de São João (Abernéssia)", note:"Shop: 9h30 to 11h45, 13h30 to 14h45, 15h30 to 17h20", lat:-22.7362131, lng:-45.5958014},
  cezas:{name:"Ceza's Restaurante", note:"Lunch · pay-by-weight buffet · 11h to 15h30", lat:-22.7338056, lng:-45.5860889},
  joao:{name:"Restaurante do João", note:"Lunch · grilled plates · 8h to 16h", lat:-22.7400725, lng:-45.5925829},
  terra:{name:"Terra Brasil Restaurante", note:"Lunch · prato feito · 9h30 to 16h", lat:-22.7374672, lng:-45.5915418}
};
const uberUrl=d=>`https://m.uber.com/ul/?action=setPickup&pickup=my_location&dropoff[latitude]=${d.lat}&dropoff[longitude]=${d.lng}&dropoff[nickname]=${encodeURIComponent(d.name)}`;
const mapsUrl=d=>`https://www.google.com/maps/dir/?api=1&destination=${d.lat},${d.lng}&travelmode=driving`;

const PT_ASK = "Você pode voltar para nos buscar às ___? Podemos combinar pelo WhatsApp?";
const WARN_GO = d => `<b>⚠️ Return rides may be hard to get.</b> ${d.name} is on the outskirts, and Uber pickups there aren't guaranteed, especially on weekdays. Before you leave the car:<br>• Ask your driver to come back at a set time and swap WhatsApp numbers:<br><span class="pt">"${PT_ASK}"</span> (Can you come back to pick us up at ___? Can we arrange it on WhatsApp?)<br>• Or schedule the return with Uber Reserve, if the app offers it (needs about 2 hours' notice).<br>• Backup: the 99 app, or call Le Renard's front desk, <a href="tel:+551236692220">(12) 3669-2220</a>, to send a taxi. A phone call needs only regular cell signal, not data.`;
const WARN_HERE = `<b>⚠️ You're at a spot where pickups can be slow.</b> Request your ride about 15 minutes before you want to leave, and check you have signal. If no car accepts, try the 99 app or call Le Renard, <a href="tel:+551236692220">(12) 3669-2220</a>, for a taxi. A phone call needs only regular cell signal, not data.`;
function rideWarning(k){
  const d=DEST[k];
  if(d.remote) return WARN_GO(d);
  const atRemote = lastFix && Object.values(DEST).some(v=>v.remote && dist(lastFix.lat,lastFix.lng,v.lat,v.lng)<700);
  if(atRemote || (played.has('felicia') && !played.has('palacio') && k==='mosteiro')) return WARN_HERE;
  return '';
}
function nextRide(){
  if(!played.has('felicia')) return 'museum';
  if(!played.has('mosteiro')) return 'mosteiro';
  return 'hotel';
}
function onFinish(id){
  if(id==='mosteiro' && !played.has('w_route') && !queue.includes('w_route')) queue.push('w_route');
  if(id==='felicia' && !played.has('m_start') && !queue.includes('m_start')) queue.unshift('m_start');
}
function walkStoriesOk(c){ return played.has('felicia') && dist(c.latitude,c.longitude,-22.743852,-45.632977)>500; }
function sceneFallback(id){ id=String(id); return id.startsWith('f_')?'drive1': id.startsWith('m_')?'felicia': id.startsWith('w_')?'abernessia': null; }
function photoFallback(id){ return String(id).startsWith('m_') ? 'felicia' : null; }
const H='-22.7194257,-45.5611975', M='-22.743852,-45.632977', MO='-22.7362131,-45.5958014';
return {
  id:'campos-do-jordao', title:'Campos do Jordão', city:'Campos do Jordão, São Paulo state, Brazil', country:'Brazil', tz:'America/Sao_Paulo',
  blurb:'Sculpture museum in the forest, the governor\'s palace, the tuberculosis story, Abernéssia and the Benedictine nuns. About 3 hours with Uber hops.',
  storePrefix:'cdj_', album:'campos-do-jordao', startId:'drive1', builtin:true,
  trip:"Guests are staying at Hotel Le Renard in Capivari, Campos do Jordão (Av. Macedo Soares area). The tour's first stop, 'Drive up to Alto da Boa Vista', starts at the hotel, so being near it means being at the hotel. Today's tour: Uber up to the Felícia Leirner outdoor sculpture museum and Auditório Claudio Santoro in Alto da Boa Vista, past the Palácio Boa Vista, then down to Abernéssia and the Benedictine Mosteiro de São João, then back to the hotel.",
  guestNotes:'One guest prefers low saturated fat food; when recommending food, favor lighter options.',
  stops:STOPS, fillers:FILLERS, walkStories:WALKSTORIES,
  groups:[{key:'museum', title:'🗿 Museum walk', items:MUSEUM, near:{lat:-22.743852,lng:-45.632977,r:500}, letters:true}],
  quiz:QUIZ, look:LOOK, lookDetail:LOOKDETAIL, scenes:SCENES, sceneAlias:SCENE_ALIAS, photoQ:PHOTO_Q,
  walk:WALK, walkExclude:['hotel','museum'], dest:DEST,
  rideWarning, nextRide, onFinish, walkStoriesOk, sceneFallback, photoFallback,
  mapRoute:['drive1','jaguaribe','abernessia','mantiqueira','palacio','felicia','palacio','tb','mosteiro','abernessia'], labelBelow:['abernessia'],
  gmap:{ embed:`https://maps.google.com/maps?saddr=${H}&daddr=${M}+to:${MO}+to:${H}&output=embed`,
         open:`https://www.google.com/maps/dir/?api=1&origin=${H}&destination=${H}&waypoints=${encodeURIComponent(M+'|'+MO)}&travelmode=driving`,
         note:'Route: hotel, museum, monastery, back to hotel.' },
  stopsTip:'Tip: long-press any stop to reset it. In the museum, tap ▶ at each phase sign.',
  walkFootnote:'Inside the museum, follow the phase signs; GPS can\'t tell the forest paths apart.',
  testPhrase:'Bem-vindo! Welcome to Campos do Jordão.'
};
})();
