// Всё содержание сайта: смыслы, связи, объекты и помещения.
// Правки текстов и связей делаются здесь, код трогать не нужно.

export const STATUS = {
  fact: { label: 'Есть', hint: 'Подтверждено источником', color: '#7fb069' },
  work: { label: 'Строится', hint: 'Работы идут', color: '#e0b04c' },
  plan: { label: 'В планах', hint: 'Объявленный или заложенный план', color: '#6fb1d6' },
  idea: { label: 'Идея проекта', hint: 'Предложение для школы', color: '#d9a0c0' },
  check: { label: 'Уточняем', hint: 'Нужен источник или подтверждение', color: '#e0795a' },
};

const SRC = {
  strategy: { t: 'Распоряжение Правительства РФ № 2431-р от 08.09.2026' },
  kremlin: { t: 'Перечень поручений Президента, kremlin.ru', u: 'https://www.kremlin.ru/acts/assignments/orders/81076' },
  ano: { t: 'АНО «Креативная экономика» о поручениях, текст из брифа' },
  expedition: { t: 'Итоги креативной экспедиции А. Старкова в Чишминский район' },
  rodnik: { t: 'Родник плюс, 11.08.2025', u: 'https://rodnikplus.ru/news/novosti/2025-08-11/ot-kuptsa-2-0-do-moskvy-chishminskiy-rayon-predstavlyaet-kreativnuyu-bashkiriyu-4345269' },
  sterlitamak: { t: 'Башинформ, 17.07.2025', u: 'https://www.bashinform.ru/news/social/2025-07-17/v-bashkirii-poyavitsya-akademiya-kreativnyh-industriy-i-dom-tyubeteyki-4316373' },
  creastan: { t: 'Креативный Башкортостан, creastan.ru', u: 'https://creastan.ru/' },
  council: { t: 'Глава Республики Башкортостан, 02.11.2026', u: 'https://glavarb.ru/ru/news/event/zasedanie-respublikanskogo-soveta-po-razvitiyu-kreativnyh-industriy_2026-93507/' },
  interfax: { t: 'Интерфакс-Россия', u: 'https://www.interfax-russia.ru/volga/news/u-bashkirii-est-vse-chtoby-stat-vedushchim-kreativnym-regionom-strany-habirov' },
  mongush: { t: 'Башинформ, 02.11.2026', u: 'https://www.bashinform.ru/news/economy/2026-11-02/radiy-habirov-vstretilsya-s-prezidentom-edinogo-tsentra-kreativnoy-ekonomiki-4670769' },
  moskvichka: { t: 'Москвичка, 27.09.2025', u: 'https://moskvichka.ru/article/trends/my-risuem-realnost-v-kotoroj-hotim-zhit-kak-kreativnye-industrii-menyayut-obraz-sela' },
  kunakbaev: { t: 'Башинформ, 19.12.2006', u: 'https://www.bashinform.ru/news/politics/2006-12-19/chulpan-chishminskaya-i-esche-17-mgnoveniy-schastya-sabirzyana-kunakbaeva-2045527' },
  chulpan: { t: 'Agro Web, сорт Чулпан', u: 'https://www.cnshb.ru/aw/russian/show.asp?page=sci\\iv008' },
  crest: { t: 'Геральдика.ру, герб района', u: 'https://geraldika.ru/symbols/19137' },
  district: { t: 'Администрация Чишминского района', u: 'https://chishmy.bashkortostan.ru/district/' },
  milk: { t: 'Культура.РФ', u: 'https://www.culture.ru/events/4906301/prazdnichnaya-programma-chishmy-stolica-kislogo-moloka' },
  sugar: { t: 'Финмаркет', u: 'https://www.finmarket.ru/news/6646010' },
  tura: { t: 'Википедия, мавзолей Тура-хана', u: 'https://ru.wikipedia.org/wiki/Мавзолей_Тура-хана' },
  ruwiki: { t: 'Рувики, Евразийский музей кочевых цивилизаций', u: 'https://ru.ruwiki.ru/wiki/Евразийский_музей_кочевых_цивилизаций_«Тура-хан»' },
  museum: { t: 'Башинформ, 31.07.2026', u: 'https://www.bashinform.ru/news/culture/2026-07-31/radiy-habirov-podelilsya-planami-evraziyskogo-muzeya-kochevyh-tsivilizatsiy-4660344' },
  land: { t: 'Новости Mail, участок музея', u: 'https://news.mail.ru/incident/65445929/' },
  vt: { t: 'Википедия, Верхние Термы', u: 'https://en.wikipedia.org/wiki/Verkhniye_Termy' },
  heroes: { t: 'Школа городских героев, описание программы', u: 'https://kashirskij-r20.gosweb.gosuslugi.ru/netcat_files/userfiles/Informatsiya_dlya_grazhdan/K_svedeniyu_grazhdan/2023/Gorodskie_geroi.docx' },
  starkov: { t: 'Живые города, А. Старков', u: 'https://xn--80addedeo5cat1j.xn--p1ai/starkov_a' },
  producers: { t: 'Концепция сообщества «Продюсеры территорий»' },
  shki: { t: 'ШКИ Уфа, ВКонтакте', u: 'https://vk.ru/shki_ufa02' },
  brief: { t: 'Бриф проекта' },
};

export const CORE = {
  id: 'core',
  title: 'Продовольственная безопасность и развитие сельских территорий',
  short: 'Продовольственная безопасность и развитие села',
  text: 'Главная цель школы: сохранить жизнь на селе и уверенность в своей еде. Путь к этому лежит через креативную экономику. Здесь её понимают как умение решать задачи нестандартно. Красивый брендинг лишь малая часть дела.',
  status: 'idea',
  src: [SRC.brief],
};

export const PETALS = [
  { id: 'land', title: 'Земля и селекция', color: '#7cb35a', tint: '#d7e9b0', lead: 'Откуда здесь хлеб и почему это важно.' },
  { id: 'agro', title: 'Агрокреаномика', color: '#e3b52f', tint: '#fbeab0', lead: 'Креативная экономика приходит в поле и на ферму.' },
  { id: 'people', title: 'Кадры', color: '#2fb3a0', tint: '#b5ece2', lead: 'Кто здесь учится и зачем остаётся.' },
  { id: 'request', title: 'Запрос и решение', color: '#e0653f', tint: '#f9c8b6', lead: 'Как завод и студент находят общий язык.' },
  { id: 'taste', title: 'Туризм и вкус', color: '#ee8f3a', tint: '#fcd9b0', lead: 'Зачем сюда ехать и что здесь есть.' },
  { id: 'neighbors', title: 'Соседи', color: '#8d7fe0', tint: '#d9d2fa', lead: 'Тура-хан, музей и две деревни рядом.' },
  { id: 'summer', title: 'Лето и арт-поле', color: '#e8689a', tint: '#fbcbdd', lead: 'Каждое лето оставляет след на поле.' },
  { id: 'economy', title: 'Креативная экономика', color: '#4a93e0', tint: '#bcdcfa', lead: 'Страна и республика уже выбрали это направление.' },
];

// status: fact, work, plan, idea, check. place: объект на модели.
export const NODES = [
  // Земля и селекция
  { id: 'station', p: 'land', title: 'Чишминская опытная станция', status: 'fact', big: 1, text: 'С 1933 года здесь работал селекционер Сабирзян Кунакбаев. За свою жизнь он вывел 19 сортов ржи, пшеницы, гречихи и тритикале.', src: [SRC.kunakbaev] },
  { id: 'chulpan', p: 'land', title: 'Рожь Чулпан', status: 'fact', big: 1, text: 'Первый в мире короткостебельный высокоурожайный сорт озимой ржи. Кунакбаев вывел его в конце 1970-х. Чулпан сеяли в 80 регионах России и СНГ, на площади больше 3,5 млн гектаров.', src: [SRC.chulpan, SRC.kunakbaev] },
  { id: 'first', p: 'land', title: 'Первая селекция в республике', status: 'check', text: 'В брифе Чишмы названы первым районом Башкортостана, где занялись селекцией. Работа станции подтверждена, а само первенство пока ищем в источниках.', src: [SRC.brief] },
  { id: 'crest', p: 'land', title: 'Журавль на гербе', status: 'fact', text: 'На гербе района журавль, знак движения вперёд. На флаге белый журавль и семь волнистых полос синего, белого и зелёного цвета.', src: [SRC.crest, SRC.district] },
  { id: 'milk', p: 'land', title: 'Столица кислого молока', status: 'fact', text: 'В войну и после неё чишминские женщины возили молоко в Уфу. По дороге оно скисало, и горожане всё равно благодарили: оно спасало от голода. Район помнит об этом и устраивает праздник.', src: [SRC.milk] },
  { id: 'railway', p: 'land', title: 'Станция Чишмы', status: 'fact', text: 'История железной дороги входит в базовые сюжеты района. Экспедиция советует строить на них креативный бренд Чишмов.', src: [SRC.expedition] },
  { id: 'localmuseum', p: 'land', title: 'Районный музей', status: 'idea', text: 'Экспедиция советует открыть при музее бюро экскурсоводов. Школа может готовить для него маршруты и молодых гидов.', src: [SRC.expedition] },

  // Агрокреаномика
  { id: 'agrokrea', p: 'agro', title: 'Что такое агрокреаномика', status: 'fact', big: 1, text: 'Соединение креативной экономики и АПК. О ней заговорили на сессии Российской креативной недели в 2025 году. Встречается и написание «агрокреономика».', src: [SRC.moskvichka] },
  { id: 'testbed', p: 'agro', title: 'Экспериментальная площадка', status: 'idea', big: 1, text: 'Итоги экспедиции называют район экспериментальной площадкой агрокреаномики и советуют занять здесь лидерство. Школа может стать домом этой площадки.', src: [SRC.expedition], place: 'school' },
  { id: 'ruralurban', p: 'agro', title: 'Сельская урбанистика', status: 'idea', text: 'Как устроить село, чтобы в нём хотелось жить. Экспедиция ставит эту тему рядом с агрокреаномикой. Участок школы становится первым примером.', src: [SRC.expedition], place: 'plot' },
  { id: 'image', p: 'agro', title: 'Новый образ села', status: 'fact', text: 'Участники сессии спорят со стереотипом о фермере «по колено в грязи». Журнал «Огород» снимает модные съёмки на фермах, и номера привлекают людей из индустрии моды.', src: [SRC.moskvichka] },
  { id: 'products', p: 'agro', title: 'Новые продукты', status: 'fact', text: 'АПК, туризм и креативные индустрии вместе дают новые продукты, от чистой еды до биодобавок.', src: [SRC.moskvichka] },
  { id: 'farmers', p: 'agro', title: 'Школа фермеров', status: 'fact', text: 'Программа Россельхозбанка при поддержке Минсельхоза идёт в 56 регионах на базе аграрных вузов. Чаще всего выбирают сыроделие, пчеловодство и агротуризм.', src: [SRC.moskvichka] },
  { id: 'greenhouse', p: 'agro', title: 'Опытные грядки', status: 'idea', text: 'Теплицы и грядки рядом со школой. Студенты пробуют здесь сорта и упаковку, а гости видят, как растёт еда.', src: [SRC.brief], place: 'greenhouse' },

  // Кадры
  { id: 'college', p: 'people', title: 'Чишминский агроколледж', status: 'check', big: 1, text: 'В брифе школа связана с агропромышленным колледжем: здесь можно открыть его факультеты. Название и программы уточняем.', src: [SRC.brief], place: 'school' },
  { id: 'shki', p: 'people', title: 'Школа креативных индустрий', status: 'fact', big: 1, text: 'ШКИ в Уфе учит подростков креативным профессиям. Школа в Верхних Термах может принимать её выездные занятия.', src: [SRC.shki] },
  { id: 'campus', p: 'people', title: 'Уфимский кампус', status: 'plan', big: 1, text: 'Межвузовский кампус в Уфе задуман как место обмена студентами между регионами и странами. Школа становится его выездной площадкой: сюда приезжают студенты и стартапы.', src: [SRC.brief] },
  { id: 'youth', p: 'people', title: 'Юношество', status: 'idea', text: 'Вовлечь юношество в креативные индустрии: это отдельный пункт в итогах экспедиции. Подростки района пробуют новые профессии рядом с домом.', src: [SRC.expedition] },
  { id: 'realtasks', p: 'people', title: 'Учёба на реальных задачах', status: 'fact', text: 'Стратегия просит развивать при кластерах учебные программы, стажировки и наставничество, чтобы обучение шло на реальных задачах.', src: [SRC.strategy] },
  { id: 'workshops', p: 'people', title: 'Мастерские', status: 'idea', text: 'Инженерная и художественная мастерские, 3D-печать, медиастудия. Здесь идея становится вещью, которую можно показать заказчику.', src: [SRC.brief], place: 'interior' },

  // Запрос и решение
  { id: 'mechanism', p: 'request', title: 'Как работает запрос', status: 'idea', big: 1, text: 'Предприятие приходит в школу и учится формулировать задачу для креативного сообщества. Молодёжь берёт запрос, переформулирует его и предлагает решение.', src: [SRC.brief], place: 'interior' },
  { id: 'sugar', p: 'request', title: 'Чишминский сахарный завод', status: 'fact', big: 1, text: 'Крупнейший из двух сахарных заводов Башкирии. В 2025 году завод выпустил 127 тысяч тонн сахара. Такие предприятия и становятся заказчиками школы.', src: [SRC.sugar] },
  { id: 'traditional', p: 'request', title: 'Традиционные отрасли', status: 'fact', text: 'Стратегия ждёт от креативных продуктов эффекта для разных секторов экономики, включая традиционные отрасли. Сельское хозяйство и заводы района стоят в этом ряду первыми.', src: [SRC.strategy] },
  { id: 'farms', p: 'request', title: 'Хозяйства района', status: 'idea', text: 'Фермеры и агропредприятия приходят со своими задачами: как продать продукт, как найти работников, как рассказать о себе.', src: [SRC.brief] },
  { id: 'teams', p: 'request', title: 'Команды студентов', status: 'idea', text: 'Запрос попадает к тем, кто учится здесь весь год на креативных специальностях или приезжает на форумы.', src: [SRC.brief] },
  { id: 'example', p: 'request', title: 'Пример запроса', status: 'idea', text: 'Хозяйство хочет продавать катык в Уфе. Команда придумывает имя, упаковку и поездку на ферму. Это пример для понимания механизма, а не готовый проект.', src: [SRC.brief] },

  // Туризм и вкус
  { id: 'impressions', p: 'taste', title: 'Экономика впечатлений', status: 'idea', big: 1, text: 'Сюжеты и символы района становятся основой для маршрутов, объектов и продуктов. Экспедиция называет это первым шагом стратегии.', src: [SRC.expedition] },
  { id: 'gastro', p: 'taste', title: 'Гастрономия района', status: 'idea', big: 1, text: 'Каша по-караякуповски, рожь Чулпан, чишминский горох, катык, масло, сахар. На этих продуктах можно строить местную кухню.', src: [SRC.expedition], place: 'interior' },
  { id: 'agrotour', p: 'taste', title: 'Агротуризм', status: 'plan', text: 'Пять гостевых домиков рядом с цветущим садом. Гости живут на участке и видят, как устроена жизнь школы.', src: [SRC.brief], place: 'cabins' },
  { id: 'orchard', p: 'taste', title: 'Яблоневый сад', status: 'plan', text: 'Сад цветёт весной и кормит осенью. Гости приезжают на цветение, а урожай идёт на кухню школы.', src: [SRC.brief], place: 'orchard' },
  { id: 'islamic', p: 'taste', title: 'Исламский туризм', status: 'idea', text: 'Экспедиция называет район центром исламского туризма мирового значения и советует занять здесь лидерство. Рядом стоит мавзолей Тура-хана.', src: [SRC.expedition] },
  { id: 'crafts', p: 'taste', title: 'Ремёсла и дизайн', status: 'fact', text: 'Рукоделие, народные промыслы, мода и дизайн входят в план поддержки. Мастера района уже продают свои изделия на фестивалях республики.', src: [SRC.expedition, SRC.rodnik] },

  // Соседи
  { id: 'tura', p: 'neighbors', title: 'Мавзолей Тура-хана', status: 'fact', big: 1, text: 'Памятник федерального значения, построен не раньше XIV века. Это самый сохранившийся мусульманский монументальный памятник Башкортостана. От школы до него 2,2 км.', src: [SRC.tura], place: 'tura' },
  { id: 'visit', p: 'neighbors', title: 'Визит-центр «Тура-хан»', status: 'fact', big: 1, text: 'Открыт 6 июля 2024 года и стал первой частью музея. К мавзолею от него ведёт деревянная тропа длиной 620 м.', src: [SRC.ruwiki], place: 'visit' },
  { id: 'nomad', p: 'neighbors', title: 'Евразийский музей кочевых цивилизаций', status: 'work', big: 1, text: 'Основной корпус ещё не построен. Глава республики сказал в июле 2026 года: заканчивают проект, коммуникации ведут в этом году, фундамент начнут в следующем. Экспозиция пройдёт от приручения лошади до Золотой Орды и дальше.', src: [SRC.museum], place: 'museum' },
  { id: 'museumevents', p: 'neighbors', title: 'События музея', status: 'plan', text: 'Рядом с музеем планируют амфитеатр для больших событий. Школа может принимать их участников и вести общую программу.', src: [SRC.museum], place: 'museum' },
  { id: 'vt', p: 'neighbors', title: 'Верхние Термы', status: 'fact', big: 1, text: 'Деревня, где стоит школа. По переписи 2010 года здесь жили 303 человека. Жители становятся первыми партнёрами школы: приходят на занятия, в мастерские и на общие праздники.', src: [SRC.vt], place: 'village' },
  { id: 'nt', p: 'neighbors', title: 'Нижние Термы', status: 'fact', text: 'Соседняя деревня ниже по Слаку, рядом с мавзолеем Тура-хана. Вместе с Верхними Термами это ближайшие соседи школы.', src: [SRC.tura], place: 'nt' },

  // Лето и арт-поле
  { id: 'year', p: 'summer', title: 'Учебный год и лето', status: 'idea', big: 1, text: 'В учебный год здесь учатся студенты. Летом школа переходит на смены и начинается креативная движуха.', src: [SRC.brief] },
  { id: 'heroes', p: 'summer', title: 'Школа городских героев', status: 'idea', big: 1, text: 'Программа урбаниста Александра Старкова учит городской коммуникации и работе с жителями. В школе она идёт как летняя смена.', src: [SRC.heroes, SRC.starkov] },
  { id: 'artobject', p: 'summer', title: 'Общий арт-объект', status: 'idea', big: 1, text: 'Каждая смена и каждый выпуск заканчивают работу общим объектом. Он переезжает на поле и остаётся там.', src: [SRC.brief], place: 'artfield' },
  { id: 'artfield', p: 'summer', title: 'Арт-поле', status: 'plan', big: 1, text: 'Поле рядом с дорогой, напротив школы. С каждым годом объектов больше, и поле становится летописью школы.', src: [SRC.brief], place: 'artfield' },
  { id: 'shifts', p: 'summer', title: 'Выездные смены', status: 'plan', text: 'Студенты и стартапы приезжают из Уфы и других городов на короткие смены и живут в домиках у сада.', src: [SRC.brief], place: 'cabins' },
  { id: 'circle', p: 'summer', title: 'Лобное место', status: 'plan', text: 'Круг на поляне в кольце деревьев. Здесь собираются жители, защищают проекты и закрывают смены.', src: [SRC.brief], place: 'lobnoe' },

  // Креативная экономика
  { id: 'strategy', p: 'economy', title: 'Стратегия до 2036 года', status: 'fact', big: 1, text: 'Правительство утвердило её 8 сентября 2026 года. Россия выбирает децентрализованную модель: развитие «от крупных городов до сельских поселений». Школа в деревне попадает в эту логику точно.', src: [SRC.strategy] },
  { id: 'orders', p: 'economy', title: 'Поручения президента', status: 'fact', big: 1, text: 'Перечень вышел по итогам встречи 10 августа 2026 года в Улан-Удэ. Правительству поручено рассмотреть системную поддержку креативных индустрий при благоустройстве опорных населённых пунктов. Мастер-планы войдут в законодательство.', src: [SRC.kremlin] },
  { id: 'masterplan', p: 'economy', title: 'Мастер-план как сценарий жизни', status: 'fact', text: 'АНО «Креативная экономика» объясняет поручение так: проектировать нужно среду для человека, а мастер-план задаёт территории новые экономические роли. Экспедиция советует сделать такой план для Чишминского района.', src: [SRC.ano, SRC.expedition] },
  { id: 'integrator', p: 'economy', title: 'Индустрии как интегратор', status: 'fact', text: 'Креативные индустрии приносят новые решения в традиционные секторы, от туризма до сельского хозяйства. Каждая деревня ищет свой культурный код и свою нишу.', src: [SRC.ano] },
  { id: 'seven', p: 'economy', title: 'Семь пилотных территорий', status: 'fact', big: 1, text: 'Уфа, Стерлитамак, Агидель, Сибай, Белорецкий, Бирский и Чишминский районы. На них республика отрабатывает управление креативными индустриями и создаёт кластеры.', src: [SRC.rodnik, SRC.sterlitamak] },
  { id: 'firstday', p: 'economy', title: 'День креативных индустрий', status: 'fact', text: 'Чишминцы первыми в Башкирии провели такой день. Он прошёл в визит-центре «Тура-хан», там же назначили советника главы района по креативным индустриям.', src: [SRC.rodnik], place: 'visit' },
  { id: 'council', p: 'economy', title: 'Совет при главе республики', status: 'fact', text: 'Республиканский совет по развитию креативных индустрий собрался 2 ноября 2026 года. В креативной сфере Башкирии сегодня работают больше 10 тысяч предпринимателей.', src: [SRC.council, SRC.mongush] },
  { id: 'creastan', p: 'economy', title: 'Креативный Башкортостан', status: 'fact', text: 'Дирекция ведёт реестр и сопровождает проекты. На сайте указаны финансовая поддержка до 5 млн рублей и оформление земли без торгов.', src: [SRC.creastan] },
  { id: 'leader', p: 'economy', title: 'Ведущий креативный регион', status: 'fact', text: 'Глава республики ставит цель: Башкирия должна стать ведущим креативным регионом страны.', src: [SRC.interfax] },
  { id: 'producers', p: 'economy', title: 'Продюсеры территорий', status: 'fact', big: 1, text: 'Сообщество людей, которые развивают города и сёла через проекты в туризме, культуре, образовании и предпринимательстве. Экспедиция советует району работать с ним напрямую.', src: [SRC.producers, SRC.expedition] },
  { id: 'cluster', p: 'economy', title: 'Распределённый кластер', status: 'idea', text: 'Экспедиция предлагает создать в посёлке Чишмы распределённый креативно-туристический кластер. Школа в Верхних Термах продолжает эту сеть в деревне.', src: [SRC.expedition] },
];

// Связи между смыслами. Внутри лепестка и через лепестки.
export const LINKS = [
  ['station', 'chulpan'], ['station', 'first'], ['station', 'college'], ['chulpan', 'gastro'], ['chulpan', 'testbed'], ['crest', 'railway'], ['crest', 'localmuseum'],
  ['milk', 'gastro'], ['milk', 'localmuseum'], ['railway', 'impressions'], ['localmuseum', 'impressions'], ['first', 'agrokrea'],
  ['agrokrea', 'testbed'], ['agrokrea', 'image'], ['agrokrea', 'products'], ['agrokrea', 'farmers'], ['agrokrea', 'ruralurban'], ['agrokrea', 'core'], ['testbed', 'greenhouse'], ['testbed', 'mechanism'],
  ['ruralurban', 'masterplan'], ['ruralurban', 'vt'], ['image', 'teams'], ['products', 'gastro'], ['products', 'farms'], ['farmers', 'college'], ['greenhouse', 'orchard'],
  ['college', 'workshops'], ['college', 'realtasks'], ['college', 'teams'], ['shki', 'youth'], ['shki', 'workshops'], ['campus', 'shifts'], ['campus', 'realtasks'], ['campus', 'heroes'], ['youth', 'vt'], ['youth', 'teams'], ['realtasks', 'strategy'], ['realtasks', 'mechanism'],
  ['mechanism', 'sugar'], ['mechanism', 'farms'], ['mechanism', 'teams'], ['mechanism', 'example'], ['mechanism', 'traditional'], ['mechanism', 'core'], ['sugar', 'gastro'], ['sugar', 'traditional'], ['traditional', 'strategy'], ['traditional', 'integrator'], ['example', 'gastro'], ['teams', 'workshops'], ['farms', 'gastro'],
  ['impressions', 'gastro'], ['impressions', 'crafts'], ['impressions', 'agrotour'], ['impressions', 'tura'], ['impressions', 'core'], ['agrotour', 'orchard'], ['agrotour', 'shifts'], ['islamic', 'tura'], ['islamic', 'impressions'], ['crafts', 'workshops'], ['crafts', 'firstday'],
  ['tura', 'visit'], ['tura', 'nomad'], ['tura', 'nt'], ['visit', 'nomad'], ['visit', 'firstday'], ['visit', 'museumevents'], ['nomad', 'museumevents'], ['museumevents', 'artobject'], ['museumevents', 'circle'], ['vt', 'nt'], ['vt', 'circle'], ['vt', 'core'],
  ['year', 'heroes'], ['year', 'shifts'], ['year', 'artobject'], ['year', 'teams'], ['heroes', 'producers'], ['heroes', 'circle'], ['artobject', 'artfield'], ['artobject', 'workshops'], ['artfield', 'vt'], ['circle', 'shifts'], ['year', 'core'],
  ['strategy', 'orders'], ['strategy', 'seven'], ['strategy', 'core'], ['orders', 'masterplan'], ['orders', 'integrator'], ['masterplan', 'cluster'], ['integrator', 'agrokrea'], ['seven', 'firstday'], ['seven', 'council'], ['seven', 'cluster'], ['council', 'creastan'], ['council', 'leader'], ['creastan', 'producers'], ['producers', 'cluster'], ['producers', 'seven'], ['firstday', 'producers'], ['cluster', 'impressions'],
  ['land-root', 'core'],
].filter(([a]) => a !== 'land-root');

// Объекты на модели. x и y в метрах от школы, y на север.
export const PLACES = {
  school: {
    title: 'Школа', status: 'plan', tag: 'Школьная улица, 16', img: 'assets/school-now.webp', imgNote: 'Школа сегодня, ноябрь 2026',
    text: 'Типовая двухэтажная кирпичная школа, площадь застройки 947 м². В модели она уже такая, как на визуализации: светлый кирпич, большие окна в тёмных рамах, деревянный вход по центру, вывеска на фасаде. Внутри залы, лектории и мастерские.',
    facts: [['Этажей', '2'], ['Застройка', '947 м²'], ['Участок', 'около 3,3 га'], ['Высота над морем', '168 м']],
    action: 'interior', meanings: ['testbed', 'college', 'mechanism'], x: 14, y: 12, h: 13, group: 'plot',
  },
  sport: {
    title: 'Спортплощадка', status: 'plan', img: null,
    text: 'Площадка рядом со школой: мяч, турники, скамейки в тени. Здесь же тихое место отдыха с навесом. Старые спортивные рамы остаются, их подкрасим.',
    facts: [['Размер', 'около 40 × 30 м']], meanings: ['youth', 'vt'], x: -26, y: 19, h: 5, group: 'plot',
  },
  flags: {
    title: 'Флагштоки', status: 'plan',
    text: 'Три флага перед входом: Россия, Башкортостан и Чишминский район с белым журавлём.',
    meanings: ['crest'], x: -18, y: -24, h: 11, group: 'plot',
  },
  orchard: {
    title: 'Яблоневый сад', status: 'plan', img: 'assets/garden.webp', imgNote: 'Сад и теплицы, из концепт-визуализации',
    text: 'Полоса цветущих яблонь к югу от школы, между двумя рядами старых деревьев. Часть деревьев здесь уже растёт, остальные досаживаем рядами. Весной сад цветёт, осенью кормит кухню школы.',
    facts: [['Размер', 'около 26 × 112 м'], ['Яблонь', 'около 90']], meanings: ['orchard', 'agrotour', 'greenhouse'], x: 14, y: -90, h: 8, group: 'plot',
  },
  cabins: {
    title: 'Гостевые домики', status: 'plan', img: 'assets/room-stay.webp', imgNote: 'Жильё, из концепт-визуализации',
    text: 'Пять домиков-треугольников в ряд, справа от сада. Такие ставят в агротуризме. Сюда заселяются участники смен, студенты и гости музея.',
    facts: [['Домиков', '5'], ['Размер домика', '6 × 8 м'], ['Вид', 'окнами на сад']], meanings: ['agrotour', 'shifts', 'campus'], x: 52, y: -92, h: 8, group: 'plot',
  },
  lobnoe: {
    title: 'Лобное место', status: 'plan', img: 'assets/fire.webp', imgNote: 'Вечер у костра, из концепт-визуализации',
    text: 'Поляна в кольце деревьев в южной части участка. В центре круглая площадка для сходов, выступлений и защиты проектов. Вокруг аккуратные ряды скамей.',
    facts: [['Круг', '20 м в диаметре']], meanings: ['circle', 'vt', 'museumevents'], x: 34, y: -212, h: 4, group: 'plot',
  },
  court: {
    title: 'Корт', status: 'plan',
    text: 'Первый корт на поляне рядом с лобным местом. Тип покрытия и размер выберем после разговора с жителями.',
    facts: [['Размер', '20 × 10 м']], meanings: ['youth'], x: 0, y: -240, h: 5, group: 'plot',
  },
  drain: {
    title: 'Дренаж', status: 'plan',
    text: 'Участок падает от школы на юг примерно на 9 метров. Вода с кровли и двора уходит в лотки вокруг школы, дальше по открытой канаве вдоль сада и собирается в дождевом пруду у южной границы.',
    facts: [['Перепад', 'с 168 до 159 м'], ['Длина канавы', 'около 270 м']], meanings: ['ruralurban'], x: 44, y: -150, h: 2, group: 'plot', layer: 'drain',
  },
  greenhouse: {
    title: 'Теплицы и грядки', status: 'idea', img: 'assets/garden.webp', imgNote: 'Сад и теплицы, из концепт-визуализации',
    text: 'Двор рядом с большим залом. Опытные грядки и две теплицы: здесь студенты пробуют сорта и угощают гостей.',
    meanings: ['greenhouse', 'gastro'], x: 38, y: 31, h: 4, group: 'plot',
  },
  terrace: {
    title: 'Терраса', status: 'idea', img: 'assets/fire.webp', imgNote: 'Вечер у костра, из концепт-визуализации',
    text: 'Терраса во дворе у кухни, под лёгким навесом. Здесь обедают, спорят о проектах и сидят вечером под гирляндой.',
    meanings: ['gastro', 'year'], x: 37, y: 15, h: 4, group: 'plot',
  },
  artfield: {
    title: 'Арт-поле', status: 'plan',
    text: 'Всё поле рядом с дорогой отдано под арт-объекты участников. Каждая летняя смена и каждый выпуск ставят здесь свою работу. Передвиньте год и посмотрите, как поле растёт. Объекты в модели сделаны по мотивам арт-парка «Таврида», это примеры масштаба и настроения.',
    facts: [['Площадь', 'больше 2 га']], action: 'years', meanings: ['artfield', 'artobject', 'year'], x: 175, y: -18, h: 12, group: 'plot',
  },
  village: {
    title: 'Верхние Термы', status: 'fact',
    text: 'Деревня Еремеевского сельсовета, 15 км от Чишмов. Школа стоит на её северном краю, рядом со Школьной улицей. Внизу течёт Слак.',
    facts: [['Жителей', '303, перепись 2010']], meanings: ['vt', 'ruralurban'], x: 40, y: -470, h: 10, group: 'area',
  },
  tura: {
    title: 'Мавзолей Тура-хана', status: 'fact', tag: 'XIV век',
    text: 'Памятник федерального значения. Из школы сюда 2,2 км. Основание 6,6 × 6,6 м, высота сейчас 6,4 м, верхний купол утрачен.',
    facts: [['Статус', 'федеральный'], ['От школы', '2,2 км']], meanings: ['tura', 'islamic', 'nt'], x: 2161, y: -420, h: 9, group: 'tura',
  },
  visit: {
    title: 'Визит-центр «Тура-хан»', status: 'fact', tag: 'Открыт в 2024',
    text: 'Первая часть будущего музея. Здание врезано в склон: по деревянной кровле поднимаются, как на смотровую площадку. Фасад из реек, за ними стекло. Отсюда к мавзолею идёт деревянная тропа длиной 620 м. Здесь прошёл первый в республике День креативных индустрий.',
    facts: [['Тропа', '620 м'], ['Открыт', '6 июля 2024']], meanings: ['visit', 'firstday', 'museumevents'], x: 2156, y: -678, h: 9, group: 'tura',
  },
  museum: {
    title: 'Будущий музей', status: 'work', tag: 'Евразийский музей кочевых цивилизаций',
    text: 'Основной корпус музея строится в стороне от визит-центра. По проекту бюро «Архтамга» это здание, врезанное в склон, с зелёными кровлями и стеклянными фасадами. В модели место и форма условные, по опубликованным рендерам.',
    meanings: ['nomad', 'museumevents'], x: 2046, y: -606, h: 18, group: 'tura',
  },
  nt: {
    title: 'Нижние Термы', status: 'fact', tag: 'За краем модели, вниз по Слаку',
    text: 'Соседняя деревня лежит восточнее, ниже по течению Слака. На модель она не попала, поэтому показываем направление.',
    meanings: ['nt'], x: 2700, y: -760, h: 6, group: 'tura',
  },
};

// Помещения школы. u вдоль фасада, v вглубь, метры от юго-западного угла.
export const ROOMS = [
  { id: 'eng', floor: 1, kind: 'eng', title: 'Инженерная мастерская', u: [0, 12.4], v: [0, 6.8], text: 'Верстаки, станки, сварка и электрика. Здесь делают то, что можно потрогать: прототипы для хозяйств и детали арт-объектов.', meanings: ['workshops', 'artobject'], img: 'assets/room-workshop.webp' },
  { id: 'hall', floor: 1, kind: 'hall', title: 'Входной холл', u: [12.4, 22], v: [0, 6.8], text: 'Сюда входит каждый гость. Стойка, карта района и выставка работ текущей смены.', meanings: ['vt'] },
  { id: 'cowork', floor: 1, kind: 'cowork', title: 'Коворкинг и библиотека', u: [22, 41.7], v: [0, 6.8], text: 'Длинные столы, стеллажи с книгами о земле, еде и территориях. Здесь работают команды и встречаются с заказчиками.', meanings: ['mechanism', 'teams'], img: 'assets/room-library.webp' },
  { id: 'print', floor: 1, kind: 'print', title: 'Мастерская 3D-печати', u: [2.6, 14], v: [9.4, 16], text: 'Принтеры и стол для сборки. Макеты, упаковка, запчасти для сельхозтехники, детали выставок.', meanings: ['workshops'], img: 'assets/room-workshop.webp' },
  { id: 'foyer', floor: 1, kind: 'foyer', title: 'Фойе большого зала', u: [14, 25], v: [9.4, 16], text: 'Перерывы, кофе, разговоры в кулуарах. Отсюда двери ведут в большой зал.', meanings: ['year'] },
  { id: 'kitchen', floor: 1, kind: 'kitchen', title: 'Кухня и столовая', u: [25, 39.1], v: [9.4, 16], text: 'Общий стол и учебная кухня. Готовим из местных продуктов: рожь, горох, катык, яблоки из сада.', meanings: ['gastro', 'orchard'], img: 'assets/room-kitchen.webp' },
  { id: 'bighall', floor: 1, kind: 'bighall', title: 'Большой зал', u: [14, 25], v: [16, 38], text: 'Конференции, форумы, кино и защита проектов. Бывший спортзал с высоким потолком и деревянными фермами.', meanings: ['mechanism', 'heroes'], img: 'assets/room-hall.webp' },
  { id: 'lecture', floor: 2, kind: 'lecture', title: 'Лекторий', u: [0, 14], v: [0, 6.8], text: 'Амфитеатр на 40 мест. Лекции, разборы и гости из Уфы.', meanings: ['realtasks', 'campus'], img: 'assets/room-class.webp' },
  { id: 'class', floor: 2, kind: 'class', title: 'Аудитория', u: [14, 26], v: [0, 6.8], text: 'Столы собираются в группы. Здесь могут идти занятия агроколледжа и школы креативных индустрий.', meanings: ['college', 'shki'], img: 'assets/room-class.webp' },
  { id: 'project', floor: 2, kind: 'project', title: 'Проектная мастерская', u: [26, 41.7], v: [0, 6.8], text: 'Большой стол, стены для заметок, макеты. Здесь запрос превращается в решение.', meanings: ['mechanism', 'example'], img: 'assets/room-workshop.webp' },
  { id: 'art', floor: 2, kind: 'art', title: 'Художественная мастерская', u: [2.6, 14], v: [9.4, 16], text: 'Мольберты, краски и северный свет. Отсюда выходят эскизы арт-объектов для поля.', meanings: ['artobject', 'crafts'] },
  { id: 'media', floor: 2, kind: 'media', title: 'Медиастудия', u: [14, 25], v: [9.4, 16], text: 'Съёмка, звук, монтаж. Студенты снимают новый образ села.', meanings: ['image'] },
  { id: 'stay', floor: 2, kind: 'stay', title: 'Жильё', u: [25, 39.1], v: [9.4, 16], text: 'Три комнаты для преподавателей и гостей смены. Основное жильё стоит в домиках у сада.', meanings: ['shifts'], img: 'assets/room-stay.webp' },
];

export const STOPS = [
  { id: 'home', title: 'Главный вид' },
  { id: 'area', title: 'Весь район' },
  { id: 'plot', title: 'Участок' },
  { id: 'school', title: 'Школа' },
  { id: 'garden', title: 'Сад и домики' },
  { id: 'circle', title: 'Лобное место' },
  { id: 'art', title: 'Арт-поле' },
  { id: 'tura', title: 'Тура-хан' },
];

export const THESIS = {
  lead: 'Проект школы в Верхних Термах: как сохранить село и уверенность в своей еде через креативную экономику.',
  steps: [
    'Предприятия района приходят в школу и учатся формулировать запрос.',
    'Студенты и участники смен берут запрос и предлагают решение.',
    'Каждое лето оставляет на поле общий арт-объект.',
  ],
};
