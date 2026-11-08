import { Recipe } from '../types';

/**
 * Tunisian home cooking (50 recipes by Chef Souhed).
 * No photo yet (image_url empty): the app shows the brand visual until one is added from the backoffice.
 */
export const tunisianRecipes: Recipe[] = [
  {
    id: 'rec_tn_01_mosli_de_poisson_aux_legumes',
    slug: 'mosli-de-poisson-aux-legumes',
    name_fr: 'Mosli de poisson aux légumes',
    name_derja: 'Mosli bel 7out w el khodhra',
    name_ar: 'مصلي الحوت بالخضرة',
    description_fr:
      "Des tranches de poisson cuites à l'étouffée au four sur un lit de pommes de terre, tomates et piments, parfumées au carvi et à l'ail : tout le goût de la mer dans un seul plat.",
    description_derja:
      'Trancheet 7out yetaybou fel four mghattyin fo9 frech batata, tmatem w felfel, b ri7et el karwiya wel thoum.',
    description_ar:
      'شرائح سمك تُطهى على البخار داخل الفرن فوق طبقة من البطاطا والطماطم والفلفل، معطّرة بالكروية والثوم.',
    image_url: '',
    prep_time_minutes: 20,
    cook_time_minutes: 50,
    base_servings: 4,
    estimated_cost_tnd: 21,
    category: 'plat_principal',
    cuisine_type: 'traditionnelle',
    difficulty: 'moyen',
    ingredients: [
      { ingredient_id: 'ing_poisson_frais', quantity_base: 800, unit: 'g', role: 'key' },
      { ingredient_id: 'ing_pomme_de_terre', quantity_base: 600, unit: 'g', role: 'key' },
      { ingredient_id: 'ing_tomate', quantity_base: 3, unit: 'pièces', role: 'secondary' },
      {
        ingredient_id: 'ing_piment',
        quantity_base: 3,
        unit: 'pièces',
        role: 'secondary',
        substitutes: ['ing_poivron'],
      },
      { ingredient_id: 'ing_oignon', quantity_base: 1, unit: 'pièce', role: 'secondary' },
      { ingredient_id: 'ing_citron', quantity_base: 1, unit: 'pièce', role: 'secondary' },
      {
        ingredient_id: 'ing_persil',
        quantity_base: 0.5,
        unit: 'botte',
        is_optional: true,
        role: 'secondary',
        substitutes: ['ing_coriandre'],
      },
      { ingredient_id: 'ing_ail', quantity_base: 4, unit: 'gousses', role: 'staple' },
      { ingredient_id: 'ing_tabel_karwiya', quantity_base: 1, unit: 'c.à.c', role: 'staple' },
      { ingredient_id: 'ing_curcuma', quantity_base: 0.5, unit: 'c.à.c', role: 'staple' },
      { ingredient_id: 'ing_piment_moulu', quantity_base: 1, unit: 'c.à.c', role: 'staple' },
      { ingredient_id: 'ing_huile_olive', quantity_base: 4, unit: 'c.à.s', role: 'staple' },
      { ingredient_id: 'ing_sel_poivre', quantity_base: 1, unit: 'pincée', role: 'staple' },
    ],
    steps: [
      {
        step_number: 1,
        instruction_fr:
          "Écaillez et videz le poisson, coupez-le en tranches de 3 cm et frottez-les avec l'ail pilé, le carvi, le curcuma, le piment moulu, le sel, le jus d'un demi-citron et 1 c.à.s d'huile. Laissez mariner 20 minutes au frais.",
        instruction_derja:
          'Na77i el 9cher w ndhaf el 7out, 9assou tranchet 3 cm w fawa7hom bel thoum el mad9ou9, karwiya, korkom, felfel a7mar, mel7, nos 9ares w mgharfa zit. Khallih 20 d9i9a fel frigo.',
        instruction_ar:
          'نظّف السمك من القشور والأحشاء وقطّعه شرائح بسمك 3 سم، ثم تبّله بالثوم المدقوق والكروية والكركم والفلفل الأحمر والملح وعصير نصف ليمونة وملعقة زيت، واتركه ينقع 20 دقيقة في الثلاجة.',
      },
      {
        step_number: 2,
        instruction_fr:
          "Préchauffez le four à 190°C. Coupez les pommes de terre en rondelles de 5 mm, l'oignon en lamelles et les tomates en quartiers ; fendez les piments sur la longueur.",
        instruction_derja:
          'Sakhan el four 3la 190°C. 9oss el batata rouwed 5 mm, el bsal chra2e7, el tmatem 4 9ta3 w chou9 el felfel 3la toulou.',
        instruction_ar:
          'سخّن الفرن على 190 درجة. قطّع البطاطا دوائر بسمك نصف سنتيمتر والبصل شرائح والطماطم أرباعاً، وافتح الفلفل بالطول.',
      },
      {
        step_number: 3,
        instruction_fr:
          "Dans un plat en terre (tajine ou gdra), étalez l'oignon puis les pommes de terre, salez, arrosez de 2 c.à.s d'huile et d'un demi-verre d'eau mélangé au reste de la marinade.",
        instruction_derja:
          'F tajine mta3 fokhar, 7ott el bsal fel 9a3 w ba3d el batata, mallah w zid 2 mgharef zit w nos kes ma mkhallet b ba9iet el tchermila.',
        instruction_ar:
          'في طاجين من الفخار، افرش البصل ثم البطاطا، وملّح وأضف ملعقتين من الزيت ونصف كأس ماء ممزوجاً ببقية التتبيلة.',
      },
      {
        step_number: 4,
        instruction_fr:
          "Couvrez hermétiquement de papier aluminium et enfournez 25 minutes, jusqu'à ce que les pommes de terre commencent à s'attendrir.",
        instruction_derja: 'Ghatti mlih bel papier aluminium w da55al lil four 25 d9i9a 7atta el batata tebda tratteb.',
        instruction_ar: 'غطِّ الطاجين بإحكام بورق الألمنيوم وأدخله الفرن 25 دقيقة حتى تبدأ البطاطا في الليونة.',
      },
      {
        step_number: 5,
        instruction_fr:
          "Disposez les tranches de poisson sur les pommes de terre, puis les tomates et les piments autour. Recouvrez et prolongez la cuisson 20 minutes : la chair doit se détacher de l'arête.",
        instruction_derja:
          'Saff trancheet el 7out fo9 el batata w 7ott el tmatem wel felfel dourou. 3awed ghatti w khalli 20 d9i9a o5ra 7atta el l7am yetfasakh 3al 7assek.',
        instruction_ar:
          'رتّب شرائح السمك فوق البطاطا وضع الطماطم والفلفل حولها، ثم غطِّ من جديد واترك 20 دقيقة أخرى حتى ينفصل اللحم عن الشوك.',
      },
      {
        step_number: 6,
        instruction_fr:
          "Retirez l'aluminium pour les 5 dernières minutes afin de dorer le dessus, parsemez de persil ciselé et servez avec des quartiers de citron.",
        instruction_derja:
          'Na77i el aluminium fel 5 d9aye9 lekhrin bech yet7ammer mel fo9, rouch ma3dnous mhafhef w sarbih m3a 9ta3 9ares.',
        instruction_ar:
          'انزع ورق الألمنيوم في الدقائق الخمس الأخيرة ليتحمّر الوجه، ثم رشّ البقدونس المفروم وقدّمه مع قطع الليمون.',
      },
    ],
    chef_tip: {
      fr: "Choisissez un poisson à chair ferme (mérou, loup, pageot) et gardez les tranches avec la peau : elles resteront entières pendant la cuisson à l'étouffée.",
      derja:
        'Khayyer 7out l7amou sa7i7 kima el mennani walla el 9arous, w khalli el jeld 3al tranchet bech mayetfattetch fel four.',
      ar: 'اختر سمكاً متماسك اللحم كالمناني أو القاروص، واترك الجلد على الشرائح حتى لا تتفتت أثناء الطهي.',
    },
    is_published: true,
    is_healthy: true,
  },
  {
    id: 'rec_tn_02_nwasser_au_poulet',
    slug: 'nwasser-au-poulet',
    name_fr: 'Nwasser au poulet',
    name_derja: 'Nwasser bel djej',
    name_ar: 'نواصر بالدجاج',
    description_fr:
      "Petits carrés de pâte cuits à la vapeur au-dessus d'une sauce rouge au poulet et pois chiches, puis arrosés de bouillon : un plat d'hiver réconfortant de la cuisine de grand-mère.",
    description_derja:
      'Nwasser yfawrou fo9 mar9et djej 7amra bel 7oms, w ba3d yetsa9aw bel mar9a: makla mta3 chta w mta3 jaddetna.',
    description_ar:
      'مربعات عجين صغيرة تُطهى على البخار فوق مرقة دجاج حمراء بالحمص، ثم تُسقى بالمرق: طبق شتوي دافئ من مطبخ الجدّات.',
    image_url: '',
    prep_time_minutes: 20,
    cook_time_minutes: 70,
    base_servings: 4,
    estimated_cost_tnd: 15,
    category: 'plat_principal',
    cuisine_type: 'traditionnelle',
    difficulty: 'moyen',
    ingredients: [
      { ingredient_id: 'ing_nwasser', quantity_base: 500, unit: 'g', role: 'key' },
      { ingredient_id: 'ing_poulet', quantity_base: 800, unit: 'g', role: 'key' },
      { ingredient_id: 'ing_pois_chiches', quantity_base: 100, unit: 'g', role: 'secondary' },
      { ingredient_id: 'ing_oignon', quantity_base: 1, unit: 'pièce', role: 'secondary' },
      { ingredient_id: 'ing_piment', quantity_base: 2, unit: 'pièces', is_optional: true, role: 'secondary' },
      { ingredient_id: 'ing_beurre', quantity_base: 20, unit: 'g', is_optional: true, role: 'secondary' },
      { ingredient_id: 'ing_tomate_concentree', quantity_base: 2, unit: 'c.à.s', role: 'staple' },
      { ingredient_id: 'ing_harissa', quantity_base: 1, unit: 'c.à.c', role: 'staple' },
      { ingredient_id: 'ing_ail', quantity_base: 3, unit: 'gousses', role: 'staple' },
      { ingredient_id: 'ing_tabel_karwiya', quantity_base: 1, unit: 'c.à.c', role: 'staple' },
      { ingredient_id: 'ing_curcuma', quantity_base: 0.5, unit: 'c.à.c', role: 'staple' },
      { ingredient_id: 'ing_piment_moulu', quantity_base: 1, unit: 'c.à.c', role: 'staple' },
      { ingredient_id: 'ing_huile_olive', quantity_base: 4, unit: 'c.à.s', role: 'staple' },
      { ingredient_id: 'ing_sel_poivre', quantity_base: 1, unit: 'pincée', role: 'staple' },
    ],
    steps: [
      {
        step_number: 1,
        instruction_fr:
          "La veille, faites tremper les pois chiches secs dans un grand volume d'eau. Le jour même, découpez le poulet en 8 morceaux et râpez l'oignon.",
        instruction_derja:
          'Mel lila, ban9a3 el 7oms fi barcha ma. Nhar el tabkha, 9oss el djej 8 9ta3 w a7kek el bsal.',
        instruction_ar:
          'انقع الحمص الجاف في كمية وافرة من الماء من الليلة السابقة. ويوم الطهي، قطّع الدجاج ثماني قطع وابشر البصلة.',
      },
      {
        step_number: 2,
        instruction_fr:
          "Dans le bas du couscoussier, faites revenir le poulet avec l'oignon râpé et l'huile 5 minutes, ajoutez l'ail pilé, la tomate concentrée diluée, l'harissa et les épices, puis laissez compoter 3 minutes.",
        instruction_derja:
          'Fi 9a3 el kaskas, 9alli el djej m3a el bsal el m7akek wel zit 5 d9aye9, zid el thoum, tmatem ma3jouna mdawba, hrisa wel fowye7 w khalliha tet9alla 3 d9aye9.',
        instruction_ar:
          'في الجزء السفلي من الكسكاس، حمّر الدجاج مع البصل المبشور والزيت خمس دقائق، ثم أضف الثوم المدقوق والطماطم المعجونة المذوبة والهريسة والتوابل واتركها تتقلّى ثلاث دقائق.',
      },
      {
        step_number: 3,
        instruction_fr:
          "Versez 1,5 L d'eau chaude, ajoutez les pois chiches égouttés et les piments entiers, puis laissez frémir à couvert 30 minutes.",
        instruction_derja:
          'Marra9 b litro w nos ma skhoun, zid el 7oms msaffi wel felfel kemel w khalliha teghli mghattya 30 d9i9a.',
        instruction_ar:
          'أضف لتراً ونصف لتر من الماء الساخن مع الحمص المصفّى والفلفل الكامل، واترك المرق يغلي مغطّى 30 دقيقة.',
      },
      {
        step_number: 4,
        instruction_fr:
          "Pendant ce temps, mouillez les nwasser de quelques cuillères d'eau salée et d'un filet d'huile en les frottant entre les mains, puis placez-les dans le haut du couscoussier pour 20 minutes de vapeur.",
        instruction_derja:
          'Fi nafs el wa9t, bakhbakh el nwasser b chwaya ma bel mel7 w 9tar zit w 7akkhom bin yeddik, w 7otthom fel kaskas yfawrou 20 d9i9a.',
        instruction_ar:
          'في الأثناء، رشّ النواصر بقليل من الماء المملّح وخيط زيت وافركها بين يديك، ثم ضعها في أعلى الكسكاس لتُطهى على البخار 20 دقيقة.',
      },
      {
        step_number: 5,
        instruction_fr:
          "Videz les nwasser dans un grand plat, aérez-les avec un peu d'eau froide pour séparer les carrés, puis remettez-les 15 minutes sur la vapeur.",
        instruction_derja:
          'Fragh el nwasser f 9as3a, ferrekhom b chwaya ma bered bech yetfar9ou, w raja3hom yfawrou 15 d9i9a o5ra.',
        instruction_ar:
          'أفرغ النواصر في قصعة وفكّكها بقليل من الماء البارد لتنفصل المربعات، ثم أعدها على البخار 15 دقيقة أخرى.',
      },
      {
        step_number: 6,
        instruction_fr:
          'Mélangez les nwasser chauds avec le beurre et 2 louches de sauce, laissez-les boire 5 minutes, puis servez en dôme avec le poulet, les pois chiches et les piments par-dessus.',
        instruction_derja:
          'Khallat el nwasser el skhounin bel zebda w zouz mghaaref mar9a, khallihom yochorbou 5 d9aye9 w sarbi m3a el djej, el 7oms wel felfel mel fo9.',
        instruction_ar:
          'اخلط النواصر الساخنة بالزبدة ومغرفتين من المرق، واتركها تتشرّب خمس دقائق، ثم قدّمها مع الدجاج والحمص والفلفل فوقها.',
      },
    ],
    chef_tip: {
      fr: "Ne noyez jamais les nwasser d'un coup : arrosez-les louche par louche, car ils gonflent vite et deviennent pâteux si la sauce est versée en excès.",
      derja:
        'Ma tsobbch el mar9a el kol 3al nwasser marra wa7da: as9ihom mgharfa b mgharfa, 5ater yentfkhou fisa3 w yweliw 3jina.',
      ar: 'لا تغمر النواصر بالمرق دفعة واحدة، بل اسقها مغرفة بمغرفة لأنها تنتفخ بسرعة وتصبح عجيناً إذا زاد المرق.',
    },
    is_published: true,
    is_healthy: false,
  },
  {
    id: 'rec_tn_03_marqa_jelbana_bel_l7am',
    slug: 'ragout-de-petits-pois-a-l-agneau',
    name_fr: "Ragoût de petits pois à l'agneau",
    name_derja: 'Mar9et jelbana bel l7am',
    name_ar: 'مرقة الجلبانة باللحم',
    description_fr:
      "Un ragoût printanier où l'agneau fondant mijote avec des petits pois frais, carottes et pommes de terre dans une sauce rouge au carvi : à saucer avec du pain tabouna.",
    description_derja:
      'Mar9a mta3 rbi3: l7am 3allouch yetayyeb m3a jelbana fresh, sfennerya w batata f salsa 7amra bel karwiya, tetghammes bel khobz tabouna.',
    description_ar:
      'مرقة ربيعية يُطهى فيها لحم الضأن الطري مع الجلبانة الطازجة والجزر والبطاطا في صلصة حمراء بالكروية، تُؤكل بخبز الطابونة.',
    image_url: '',
    prep_time_minutes: 20,
    cook_time_minutes: 75,
    base_servings: 4,
    estimated_cost_tnd: 30,
    category: 'plat_principal',
    cuisine_type: 'traditionnelle',
    difficulty: 'facile',
    ingredients: [
      { ingredient_id: 'ing_agneau', quantity_base: 500, unit: 'g', role: 'key', substitutes: ['ing_boeuf'] },
      { ingredient_id: 'ing_petits_pois', quantity_base: 600, unit: 'g', role: 'key' },
      { ingredient_id: 'ing_carotte', quantity_base: 2, unit: 'pièces', role: 'secondary' },
      { ingredient_id: 'ing_pomme_de_terre', quantity_base: 300, unit: 'g', role: 'secondary' },
      { ingredient_id: 'ing_oignon', quantity_base: 1, unit: 'pièce', role: 'secondary' },
      { ingredient_id: 'ing_artichaut', quantity_base: 2, unit: 'pièces', is_optional: true, role: 'secondary' },
      { ingredient_id: 'ing_persil', quantity_base: 0.5, unit: 'botte', is_optional: true, role: 'secondary' },
      { ingredient_id: 'ing_tomate_concentree', quantity_base: 2, unit: 'c.à.s', role: 'staple' },
      { ingredient_id: 'ing_harissa', quantity_base: 1, unit: 'c.à.c', role: 'staple' },
      { ingredient_id: 'ing_ail', quantity_base: 3, unit: 'gousses', role: 'staple' },
      { ingredient_id: 'ing_tabel_karwiya', quantity_base: 1, unit: 'c.à.c', role: 'staple' },
      { ingredient_id: 'ing_curcuma', quantity_base: 0.5, unit: 'c.à.c', role: 'staple' },
      { ingredient_id: 'ing_huile_olive', quantity_base: 4, unit: 'c.à.s', role: 'staple' },
      { ingredient_id: 'ing_sel_poivre', quantity_base: 1, unit: 'pincée', role: 'staple' },
    ],
    steps: [
      {
        step_number: 1,
        instruction_fr:
          "Coupez l'agneau en morceaux de 4 cm et faites-le dorer 6 minutes dans l'huile chaude avec l'oignon haché, dans une marmite à fond épais.",
        instruction_derja:
          '9oss el l7am morsewet 4 cm w 7ammrou 6 d9aye9 fel zit el skhoun m3a el bsal m9assas, f tanjra 9a3ha 7rech.',
        instruction_ar:
          'قطّع لحم الضأن قطعاً بحجم 4 سم وحمّره ست دقائق في الزيت الساخن مع البصل المفروم في قدر ذات قاع سميك.',
      },
      {
        step_number: 2,
        instruction_fr:
          "Ajoutez l'ail pilé, la tomate concentrée, l'harissa, le carvi-coriandre, le curcuma, le sel et le poivre ; remuez 2 minutes jusqu'à ce que l'huile remonte en surface.",
        instruction_derja:
          'Zid el thoum, tmatem ma3jouna, hrisa, tabel w karwiya, korkom, mel7 w felfel ak7el, w 7arrek 2 d9aye9 7atta el zit yetla3 mel fo9.',
        instruction_ar:
          'أضف الثوم المدقوق والطماطم المعجونة والهريسة والتابل والكروية والكركم والملح والفلفل الأسود، وقلّب دقيقتين حتى يطفو الزيت على السطح.',
      },
      {
        step_number: 3,
        instruction_fr:
          "Mouillez avec 1 L d'eau chaude, couvrez et laissez mijoter 40 minutes à feu doux jusqu'à ce que la viande commence à être tendre.",
        instruction_derja:
          'Marra9 b litro ma skhoun, ghatti w khalliha teghli 3la nar hadya 40 d9i9a 7atta el l7am yebda yratteb.',
        instruction_ar: 'أضف لتراً من الماء الساخن، وغطِّ القدر واتركه على نار هادئة 40 دقيقة حتى يبدأ اللحم في النضج.',
      },
      {
        step_number: 4,
        instruction_fr:
          "Ajoutez les carottes en rondelles, les pommes de terre en cubes et les cœurs d'artichaut citronnés ; poursuivez 15 minutes.",
        instruction_derja:
          'Zid el sfennerya rouwed, el batata ka3bet wel 9alb mta3 el 9oknariya m9arsa bel 9ares, w khalli 15 d9i9a.',
        instruction_ar: 'أضف الجزر دوائر والبطاطا مكعبات وقلوب القنارية المرشوشة بالليمون، واترك 15 دقيقة.',
      },
      {
        step_number: 5,
        instruction_fr:
          'Versez les petits pois écossés en dernier et laissez cuire 12 à 15 minutes à découvert : ils doivent rester bien verts et la sauce nappante.',
        instruction_derja:
          'Zid el jelbana fel lekher w khalliha tib 12 l 15 d9i9a bla ghta: lezem tob9a khadhra w el mar9a t9atter chwaya.',
        instruction_ar:
          'أضف الجلبانة المقشّرة في الأخير واتركها تنضج من 12 إلى 15 دقيقة دون غطاء، حتى تبقى خضراء ويتماسك المرق قليلاً.',
      },
      {
        step_number: 6,
        instruction_fr: "Rectifiez l'assaisonnement, parsemez de persil haché et servez bien chaud avec du pain.",
        instruction_derja: 'Dho9 el mel7, rouch ma3dnous m9assas w sarbiha skhouna m3a el khobz.',
        instruction_ar: 'تذوّق وعدّل الملح، ثم رشّ البقدونس المفروم وقدّمها ساخنة مع الخبز.',
      },
    ],
    chef_tip: {
      fr: "Hors saison, les petits pois surgelés font très bien l'affaire : ajoutez-les directement sans décongeler, 8 minutes avant la fin seulement.",
      derja:
        'Ki ma tal9ach jelbana fresh, el jelbana el mjalda tnajjem: 7ottha kif ma hiya bla ma tdhawbha, 8 d9aye9 9bal ma tetfi.',
      ar: 'إذا لم تجد الجلبانة الطازجة، فالمجمّدة تفي بالغرض: أضفها مباشرة دون إذابة قبل ثماني دقائق فقط من نهاية الطهي.',
    },
    is_published: true,
    is_healthy: false,
  },
  {
    id: 'rec_tn_04_fricasse_tunisien',
    slug: 'fricasse-tunisien',
    name_fr: 'Fricassé tunisien',
    name_derja: 'Fricassé tounsi',
    name_ar: 'فريكاسي تونسي',
    description_fr:
      'De petits pains moelleux frits puis fourrés de thon, pomme de terre, œuf dur, olives et harissa : le casse-croûte de rue préféré des Tunisiens.',
    description_derja:
      'Khobzet sghar mrattbin me9liyin, m3abbyin thon, batata, 3adhma masmou9a, zaytoun w hrisa: el casse-croûte el a7la fel chera3 el tounsi.',
    description_ar:
      'خبيزات صغيرة طرية مقلية ومحشوة بالتن والبطاطا والبيض المسلوق والزيتون والهريسة: أشهر أكلة شارع في تونس.',
    image_url: '',
    prep_time_minutes: 100,
    cook_time_minutes: 25,
    base_servings: 4,
    estimated_cost_tnd: 6.2,
    category: 'entree',
    cuisine_type: 'traditionnelle',
    difficulty: 'moyen',
    ingredients: [
      { ingredient_id: 'ing_farine', quantity_base: 500, unit: 'g', role: 'secondary' },
      { ingredient_id: 'ing_levure', quantity_base: 1, unit: 'sachet', role: 'key' },
      { ingredient_id: 'ing_thon_boite', quantity_base: 2, unit: 'boîtes', role: 'key' },
      { ingredient_id: 'ing_oeuf', quantity_base: 4, unit: 'pièces', role: 'secondary' },
      { ingredient_id: 'ing_pomme_de_terre', quantity_base: 300, unit: 'g', role: 'secondary' },
      { ingredient_id: 'ing_olives', quantity_base: 80, unit: 'g', role: 'secondary' },
      { ingredient_id: 'ing_capres', quantity_base: 1, unit: 'c.à.s', is_optional: true, role: 'secondary' },
      { ingredient_id: 'ing_citron', quantity_base: 1, unit: 'pièce', role: 'secondary' },
      { ingredient_id: 'ing_sucre', quantity_base: 1, unit: 'c.à.c', role: 'staple' },
      { ingredient_id: 'ing_harissa', quantity_base: 2, unit: 'c.à.s', role: 'staple' },
      {
        ingredient_id: 'ing_huile_vegetale',
        quantity_base: 500,
        unit: 'ml',
        role: 'staple',
        substitutes: ['ing_huile_olive'],
      },
      { ingredient_id: 'ing_sel_poivre', quantity_base: 1, unit: 'pincée', role: 'staple' },
    ],
    steps: [
      {
        step_number: 1,
        instruction_fr:
          "Mélangez la farine, la levure, le sucre, 1 c.à.c de sel, 1 œuf et 3 c.à.s d'huile, puis ajoutez environ 25 cl d'eau tiède petit à petit. Pétrissez 10 minutes jusqu'à obtenir une pâte souple qui ne colle plus.",
        instruction_derja:
          'Khallat el faryna, el khmira, el sokkor, mgharfa sghira mel7, 3adhma w 3 mgharef zit, w zid 25 cl ma dafi chwaya b chwaya. A3jen 10 d9aye9 7atta el 3jina tweli rtiba w ma tetle99ech.',
        instruction_ar:
          'اخلط الفارينة والخميرة والسكر وملعقة صغيرة من الملح وبيضة وثلاث ملاعق زيت، ثم أضف حوالي ربع لتر من الماء الدافئ تدريجياً، واعجن عشر دقائق حتى تصبح العجينة لينة ولا تلتصق.',
      },
      {
        step_number: 2,
        instruction_fr:
          "Couvrez et laissez lever 1 heure dans un endroit tiède, jusqu'à ce que la pâte double de volume.",
        instruction_derja: 'Ghatti el 3jina w khalliha tekhmar sa3a f blasa dafya 7atta tetdhe3ef.',
        instruction_ar: 'غطِّ العجينة واتركها تختمر ساعة في مكان دافئ حتى يتضاعف حجمها.',
      },
      {
        step_number: 3,
        instruction_fr:
          'Dégazez la pâte, divisez-la en 12 boules, façonnez de petits boudins de 10 cm et laissez-les reposer 20 minutes sur un plateau huilé.',
        instruction_derja:
          'Nefes el 3jina, 9assemha 12 kwira, a3mel menha 9tayes sghar 10 cm w khallihom yertahou 20 d9i9a fo9 sinia madhouna.',
        instruction_ar:
          'أفرغ الهواء من العجينة وقسّمها اثنتي عشرة كرة، وشكّل منها لفائف صغيرة بطول 10 سم، واتركها ترتاح عشرين دقيقة على صينية مدهونة.',
      },
      {
        step_number: 4,
        instruction_fr:
          "Pendant ce temps, faites cuire les pommes de terre en cubes 12 minutes à l'eau salée et les 3 œufs restants 10 minutes ; écalez et tranchez les œufs.",
        instruction_derja:
          'Fi nafs el wa9t, sla9 el batata ka3bet 12 d9i9a fel ma wel mel7, w el 3 3dhamat el ba9yin 10 d9aye9; 9echer-hom w 9oss-hom rouwed.',
        instruction_ar:
          'في الأثناء، اسلق البطاطا مكعبات 12 دقيقة في ماء مملّح، واسلق البيضات الثلاث المتبقية عشر دقائق، ثم قشّرها وقطّعها شرائح.',
      },
      {
        step_number: 5,
        instruction_fr:
          "Faites chauffer l'huile à 170°C et faites frire les pains 2 minutes de chaque côté jusqu'à ce qu'ils soient bien dorés et gonflés. Égouttez sur du papier absorbant.",
        instruction_derja:
          'Sakhan el zit 3la 170°C w i9li el khobzet d9i9tin men kol jiha 7atta yet7ammrou w yentfkhou. 7otthom 3la papier absorbant.',
        instruction_ar:
          'سخّن الزيت إلى 170 درجة واقلِ الخبيزات دقيقتين من كل جانب حتى تنتفخ وتتحمّر، ثم ضعها على ورق ماص.',
      },
      {
        step_number: 6,
        instruction_fr:
          "Diluez l'harissa avec le jus de citron et 1 c.à.s d'huile. Ouvrez chaque fricassé, badigeonnez l'intérieur de cette sauce, puis garnissez de pomme de terre, thon émietté, œuf, olives et câpres.",
        instruction_derja:
          'Dawweb el hrisa b 3asret el 9ares w mgharfa zit. 7ell kol fricassé, adhen da5lou bel hrisa w 3abbih batata, thon mfarrak, 3adhma, zaytoun w kabbara.',
        instruction_ar:
          'ذوّب الهريسة بعصير الليمون وملعقة زيت. افتح كل فريكاسي وادهن داخله بهذه الصلصة، ثم احشه بالبطاطا والتن المفتّت والبيض والزيتون والكبار.',
      },
    ],
    chef_tip: {
      fr: "Si l'huile n'est pas assez chaude, les fricassés boivent le gras ; testez avec un petit morceau de pâte qui doit remonter aussitôt en grésillant.",
      derja:
        'Ki el zit ma ykounech skhoun yeser, el fricassé yochrob el zit; jarreb b 9ta3a sghira mel 3jina, lezem tetla3 toul w hiya tchachi.',
      ar: 'إذا لم يكن الزيت ساخناً بما يكفي تتشرّب الخبيزات الدهن، فجرّبه بقطعة صغيرة من العجين يجب أن تطفو فوراً وهي تطقطق.',
    },
    is_published: true,
    is_healthy: false,
  },
  {
    id: 'rec_tn_05_kamounia_au_buf',
    slug: 'kamounia-au-boeuf',
    name_fr: 'Kamounia au bœuf',
    name_derja: 'Kamounia bel l7am',
    name_ar: 'كمونية باللحم',
    description_fr:
      "Un ragoût de bœuf mijoté longuement dans une sauce épaisse au cumin, à l'ail et à la tomate, intense et parfumé, typique du Sahel tunisien.",
    description_derja:
      'Mar9et l7am bagri tetayyeb 3la mahlha f salsa ta9la bel kammoun, thoum w tmatem, ri7etha t7ell el 9alb, kima ya3mlouha fel Sa7el.',
    description_ar:
      'مرقة لحم بقري تُطهى طويلاً في صلصة كثيفة بالكمون والثوم والطماطم، قوية النكهة كما تُطبخ في الساحل التونسي.',
    image_url: '',
    prep_time_minutes: 15,
    cook_time_minutes: 95,
    base_servings: 4,
    estimated_cost_tnd: 28,
    category: 'plat_principal',
    cuisine_type: 'traditionnelle',
    difficulty: 'moyen',
    ingredients: [
      { ingredient_id: 'ing_boeuf', quantity_base: 600, unit: 'g', role: 'key', substitutes: ['ing_agneau'] },
      { ingredient_id: 'ing_cumin', quantity_base: 2, unit: 'c.à.s', role: 'key' },
      { ingredient_id: 'ing_oignon', quantity_base: 1, unit: 'pièce', role: 'secondary' },
      { ingredient_id: 'ing_foie', quantity_base: 200, unit: 'g', is_optional: true, role: 'secondary' },
      { ingredient_id: 'ing_persil', quantity_base: 0.5, unit: 'botte', is_optional: true, role: 'secondary' },
      { ingredient_id: 'ing_ail', quantity_base: 6, unit: 'gousses', role: 'staple' },
      { ingredient_id: 'ing_tomate_concentree', quantity_base: 2, unit: 'c.à.s', role: 'staple' },
      { ingredient_id: 'ing_harissa', quantity_base: 1, unit: 'c.à.c', role: 'staple' },
      { ingredient_id: 'ing_piment_moulu', quantity_base: 1, unit: 'c.à.c', role: 'staple' },
      { ingredient_id: 'ing_coriandre_graines', quantity_base: 1, unit: 'c.à.c', role: 'staple' },
      { ingredient_id: 'ing_huile_olive', quantity_base: 5, unit: 'c.à.s', role: 'staple' },
      { ingredient_id: 'ing_sel_poivre', quantity_base: 1, unit: 'pincée', role: 'staple' },
    ],
    steps: [
      {
        step_number: 1,
        instruction_fr:
          "Torréfiez à sec le cumin et les graines de coriandre 1 minute dans une poêle, puis pilez-les au mortier avec l'ail et une pincée de sel jusqu'à obtenir une pâte.",
        instruction_derja:
          '7ammes el kammoun wel 9osbor 1 d9i9a f me9la bla zit, w od9hom fel mehraz m3a el thoum w rachet mel7 7atta ywalliw 3jina.',
        instruction_ar:
          'حمّص الكمون وبذور القصبر دقيقة في مقلاة دون زيت، ثم ادقّها في المهراس مع الثوم وقليل من الملح حتى تصبح عجينة.',
      },
      {
        step_number: 2,
        instruction_fr:
          "Coupez le bœuf en cubes de 3 cm et saisissez-le dans l'huile 5 minutes avec l'oignon haché finement.",
        instruction_derja: '9oss el l7am ka3bet 3 cm w 9allih fel zit 5 d9aye9 m3a el bsal m9assas rgi9.',
        instruction_ar: 'قطّع لحم البقر مكعبات بحجم 3 سم وقلّه في الزيت خمس دقائق مع البصل المفروم ناعماً.',
      },
      {
        step_number: 3,
        instruction_fr:
          "Ajoutez la tomate concentrée, l'harissa, le piment moulu et la moitié de la pâte de cumin-ail ; faites revenir 2 minutes en remuant.",
        instruction_derja:
          'Zid tmatem ma3jouna, hrisa, felfel a7mar wel nos mel 3jinet el kammoun wel thoum, w 9alli d9i9tin w enti t7arrek.',
        instruction_ar: 'أضف الطماطم المعجونة والهريسة والفلفل الأحمر المطحون ونصف عجينة الكمون والثوم، وقلّب دقيقتين.',
      },
      {
        step_number: 4,
        instruction_fr:
          "Versez 75 cl d'eau chaude, couvrez et laissez mijoter à feu doux 1 h 15 en remuant de temps en temps, jusqu'à ce que la viande se coupe à la cuillère.",
        instruction_derja:
          'Zid 75 cl ma skhoun, ghatti w khalliha 3la nar hadya sa3a w rob3 w 7arrek mel wa9t lel wa9t, 7atta el l7am yet9ass bel mgharfa.',
        instruction_ar:
          'أضف ثلاثة أرباع لتر من الماء الساخن، وغطِّ القدر واتركه على نار هادئة ساعة وربعاً مع التحريك من حين لآخر، حتى يُقطع اللحم بالملعقة.',
      },
      {
        step_number: 5,
        instruction_fr:
          'Si vous utilisez du foie, coupez-le en dés et ajoutez-le 10 minutes avant la fin avec le reste de la pâte de cumin : la sauce doit être épaisse et brillante.',
        instruction_derja:
          'Ken 3andek kebda, 9oss-ha ka3bet w zidha 10 d9aye9 9bal ma tetfi m3a ba9iet 3jinet el kammoun: el salsa lezem tkoun ta9la w tlamma3.',
        instruction_ar:
          'إذا استعملت الكبدة فقطّعها مكعبات وأضفها قبل عشر دقائق من النهاية مع بقية عجينة الكمون، حتى تصبح الصلصة كثيفة ولامعة.',
      },
      {
        step_number: 6,
        instruction_fr: 'Parsemez de persil haché et servez avec du pain frais pour saucer.',
        instruction_derja: 'Rouch ma3dnous m9assas w sarbiha m3a khobz fresh lel tghmis.',
        instruction_ar: 'رشّ البقدونس المفروم وقدّمها مع خبز طازج للتغميس.',
      },
    ],
    chef_tip: {
      fr: "Le secret de la kamounia, c'est d'ajouter le cumin en deux fois : au début pour la profondeur, à la fin pour garder son parfum vif.",
      derja:
        'El sirr mta3 el kamounia: el kammoun yet7att 3la marrtin, fel loul bech ya3ti 3om9 lel salsa w fel lekher bech ri7tou tob9a 9wiya.',
      ar: 'سرّ الكمونية أن يُضاف الكمون على مرّتين: في البداية ليمنح الصلصة عمقاً، وفي النهاية ليحتفظ برائحته القوية.',
    },
    is_published: true,
    is_healthy: false,
  },
  {
    id: 'rec_tn_06_mloukhia_au_poulet',
    slug: 'mloukhia-au-poulet',
    name_fr: 'Mloukhia au poulet',
    name_derja: 'Mloukhia bel djej',
    name_ar: 'ملوخية بالدجاج',
    description_fr:
      "La sauce noire et veloutée de corète, mijotée des heures avec du poulet et des épices, servie lors des grandes occasions et du Nouvel An de l'Hégire.",
    description_derja:
      'El mloukhia el ka7la el ta9la, tetayyeb sway3 twal m3a el djej wel fowye7, makla mta3 el mounasbet w ras el 3am el hijri.',
    description_ar: 'صلصة الملوخية السوداء المخملية تُطهى ساعات مع الدجاج والتوابل، طبق المناسبات ورأس السنة الهجرية.',
    image_url: '',
    prep_time_minutes: 15,
    cook_time_minutes: 180,
    base_servings: 4,
    estimated_cost_tnd: 19,
    category: 'plat_principal',
    cuisine_type: 'traditionnelle',
    difficulty: 'moyen',
    ingredients: [
      { ingredient_id: 'ing_mloukhiya_poudre', quantity_base: 1, unit: 'sachet', role: 'key' },
      { ingredient_id: 'ing_poulet', quantity_base: 800, unit: 'g', role: 'key', substitutes: ['ing_boeuf'] },
      { ingredient_id: 'ing_huile_olive', quantity_base: 200, unit: 'ml', role: 'staple' },
      { ingredient_id: 'ing_ail', quantity_base: 4, unit: 'gousses', role: 'staple' },
      { ingredient_id: 'ing_tabel_karwiya', quantity_base: 2, unit: 'c.à.c', role: 'staple' },
      { ingredient_id: 'ing_tomate_concentree', quantity_base: 1, unit: 'c.à.c', role: 'staple' },
      { ingredient_id: 'ing_sel_poivre', quantity_base: 1, unit: 'pincée', role: 'staple' },
    ],
    steps: [
      {
        step_number: 1,
        instruction_fr:
          "Dans une grande marmite, délayez la poudre de mloukhia dans l'huile d'olive à froid jusqu'à obtenir une pâte lisse, sans grumeaux.",
        instruction_derja:
          'F tanjra kbira, dawweb ghobret el mloukhia fel zit zitouna w hiya bérda 7atta tweli 3jina mlassa bla 7bob.',
        instruction_ar: 'في قدر كبيرة، ذوّب مسحوق الملوخية في زيت الزيتون البارد حتى تصبح عجينة ناعمة دون تكتلات.',
      },
      {
        step_number: 2,
        instruction_fr:
          "Mettez sur feu moyen et faites revenir 5 minutes en remuant sans arrêt, puis versez 2 L d'eau chaude progressivement en fouettant.",
        instruction_derja:
          '7ottha 3la nar motawasta w 9alliha 5 d9aye9 w enti t7arrek dima, w ba3d zid 2 litro ma skhoun chwaya b chwaya w enti tkhabbat.',
        instruction_ar:
          'ضع القدر على نار متوسطة وقلّب خمس دقائق دون توقف، ثم أضف لترين من الماء الساخن تدريجياً مع الخفق.',
      },
      {
        step_number: 3,
        instruction_fr:
          "Laissez cuire à feu doux 1 h 30 à demi-couvert, en raclant le fond régulièrement pour éviter que la sauce n'attache.",
        instruction_derja:
          'Khalliha tetayyeb 3la nar hadya sa3a w nos nos mghattya, w 7akk el 9a3 kol chwaya bech ma tetle99ech.',
        instruction_ar: 'اتركها تُطهى على نار هادئة ساعة ونصفاً نصف مغطاة، مع كشط القاع بانتظام حتى لا تلتصق.',
      },
      {
        step_number: 4,
        instruction_fr:
          "Pilez l'ail avec le tabel-karwiya et le sel. Ajoutez à la sauce avec les morceaux de poulet et la tomate concentrée diluée.",
        instruction_derja:
          'Od9 el thoum m3a el tabel wel karwiya wel mel7, w zidhom lel mloukhia m3a 9ta3 el djej wel tmatem ma3jouna mdawba.',
        instruction_ar:
          'ادقّ الثوم مع التابل والكروية والملح، وأضفها إلى الملوخية مع قطع الدجاج والطماطم المعجونة المذوبة.',
      },
      {
        step_number: 5,
        instruction_fr:
          "Poursuivez la cuisson 1 h à feu très doux : la mloukhia est prête quand elle devient noire, brillante, et que l'huile forme une fine couche en surface.",
        instruction_derja:
          'Kammel sa3a o5ra 3la nar hadya barcha: el mloukhia tetayyeb ki tweli ka7la, tlamma3 w el zit yetla3 tab9a rgi9a mel fo9.',
        instruction_ar:
          'واصل الطهي ساعة أخرى على نار هادئة جداً، فالملوخية تنضج عندما تصبح سوداء لامعة ويطفو الزيت طبقة رقيقة على سطحها.',
      },
      {
        step_number: 6,
        instruction_fr: "Servez chaud avec du pain tabouna ou de la baguette, le poulet posé au centre de l'assiette.",
        instruction_derja: 'Sarbiha skhouna bel khobz tabouna walla baguette, w el djej fel wost mta3 el s7an.',
        instruction_ar: 'قدّمها ساخنة مع خبز الطابونة أو الخبز الطويل، والدجاج في وسط الصحن.',
      },
    ],
    chef_tip: {
      fr: "Ne salez la mloukhia qu'en fin de cuisson : elle réduit énormément pendant trois heures et deviendrait vite trop salée.",
      derja: 'Ma tmalla7ch el mloukhia ken fel lekher: tenkos barcha fi tlath swaye3 w tnajjem tweli mel7a.',
      ar: 'لا تملّح الملوخية إلا في آخر الطهي، فهي تنقص كثيراً خلال ثلاث ساعات وقد تصبح شديدة الملوحة.',
    },
    is_published: true,
    is_healthy: false,
  },
  {
    id: 'rec_tn_07_borghol_bel_felfel',
    slug: 'boulgour-aux-poivrons',
    name_fr: 'Boulgour aux poivrons',
    name_derja: 'Borghol bel felfel',
    name_ar: 'برغل بالفلفل',
    description_fr:
      'Un boulgour mijoté dans une sauce rouge aux poivrons, pois chiches et carvi : simple, nourrissant et plein de couleurs.',
    description_derja: 'Borghol yetayyeb f salsa 7amra bel felfel, 7oms w karwiya: sahel, ychabba3 w ya3ti 3la el 3in.',
    description_ar: 'برغل مطهو في صلصة حمراء بالفلفل والحمص والكروية: بسيط ومشبع وزاهي الألوان.',
    image_url: '',
    prep_time_minutes: 15,
    cook_time_minutes: 30,
    base_servings: 4,
    estimated_cost_tnd: 7,
    category: 'plat_principal',
    cuisine_type: 'vegetarienne',
    difficulty: 'facile',
    ingredients: [
      { ingredient_id: 'ing_borghol', quantity_base: 350, unit: 'g', role: 'key' },
      { ingredient_id: 'ing_poivron', quantity_base: 2, unit: 'pièces', role: 'key', substitutes: ['ing_piment'] },
      { ingredient_id: 'ing_piment', quantity_base: 1, unit: 'pièce', is_optional: true, role: 'secondary' },
      { ingredient_id: 'ing_tomate', quantity_base: 2, unit: 'pièces', role: 'secondary' },
      { ingredient_id: 'ing_oignon', quantity_base: 1, unit: 'pièce', role: 'secondary' },
      { ingredient_id: 'ing_pois_chiches', quantity_base: 150, unit: 'g', role: 'secondary' },
      { ingredient_id: 'ing_persil', quantity_base: 0.5, unit: 'botte', is_optional: true, role: 'secondary' },
      { ingredient_id: 'ing_tomate_concentree', quantity_base: 1, unit: 'c.à.s', role: 'staple' },
      { ingredient_id: 'ing_harissa', quantity_base: 1, unit: 'c.à.c', role: 'staple' },
      { ingredient_id: 'ing_ail', quantity_base: 2, unit: 'gousses', role: 'staple' },
      { ingredient_id: 'ing_tabel_karwiya', quantity_base: 1, unit: 'c.à.c', role: 'staple' },
      { ingredient_id: 'ing_huile_olive', quantity_base: 4, unit: 'c.à.s', role: 'staple' },
      { ingredient_id: 'ing_sel_poivre', quantity_base: 1, unit: 'pincée', role: 'staple' },
    ],
    steps: [
      {
        step_number: 1,
        instruction_fr:
          "Rincez le boulgour une fois à l'eau froide et égouttez-le. Coupez les poivrons en lanières, émincez l'oignon et râpez les tomates.",
        instruction_derja:
          'Ghsel el borghol marra bel ma bered w saffih. 9oss el felfel chra2e7, el bsal rgi9 w a7kek el tmatem.',
        instruction_ar: 'اغسل البرغل مرة بالماء البارد وصفّه. قطّع الفلفل شرائح والبصل رقيقاً وابشر الطماطم.',
      },
      {
        step_number: 2,
        instruction_fr:
          "Faites fondre l'oignon dans l'huile 4 minutes, ajoutez les poivrons et le piment, et laissez-les s'attendrir 5 minutes.",
        instruction_derja: 'Ratteb el bsal fel zit 4 d9aye9, zid el felfel w khallih yratteb 5 d9aye9.',
        instruction_ar: 'ليّن البصل في الزيت أربع دقائق، ثم أضف الفلفل واتركه يلين خمس دقائق.',
      },
      {
        step_number: 3,
        instruction_fr:
          "Ajoutez l'ail, la tomate concentrée, l'harissa, le tabel-karwiya et les tomates râpées ; laissez réduire 5 minutes.",
        instruction_derja:
          'Zid el thoum, tmatem ma3jouna, hrisa, tabel w karwiya wel tmatem el m7akka, w khalliha tenkos 5 d9aye9.',
        instruction_ar:
          'أضف الثوم والطماطم المعجونة والهريسة والتابل والكروية والطماطم المبشورة، واترك الصلصة تنقص خمس دقائق.',
      },
      {
        step_number: 4,
        instruction_fr:
          "Versez 70 cl d'eau chaude salée et les pois chiches cuits ; à ébullition, ajoutez le boulgour, couvrez et laissez cuire 15 minutes à feu doux jusqu'à absorption du liquide.",
        instruction_derja:
          'Zid 70 cl ma skhoun bel mel7 wel 7oms tayeb; ki tghli zid el borghol, ghatti w khallih 15 d9i9a 3la nar hadya 7atta yochrob el ma el kol.',
        instruction_ar:
          'أضف سبعين سنتيلتراً من الماء الساخن المملّح والحمص المطهو، وعند الغليان أضف البرغل وغطِّ واتركه 15 دقيقة على نار هادئة حتى يتشرب السائل.',
      },
      {
        step_number: 5,
        instruction_fr:
          'Éteignez le feu, laissez gonfler 5 minutes sous un torchon, puis égrenez à la fourchette et parsemez de persil.',
        instruction_derja:
          'Tafi el nar, ghatti b fouta w khallih yentfekh 5 d9aye9, ba3d farrakou bel forchetta w rouch el ma3dnous.',
        instruction_ar: 'أطفئ النار وغطِّ القدر بمنشفة ليتنفّخ البرغل خمس دقائق، ثم فكّكه بالشوكة ورشّ البقدونس.',
      },
    ],
    chef_tip: {
      fr: 'Choisissez un boulgour gros grain (borghol ghlidh) : il reste détaché dans la sauce, alors que le fin se transforme vite en bouillie.',
      derja: 'Khoudh borghol ghlidh: yob9a 7abba 7abba fel salsa, amma el rgi9 ywalli 3assida fisa3.',
      ar: 'اختر البرغل الخشن لأنه يبقى حبة حبة في الصلصة، أما الناعم فيتحول بسرعة إلى عصيدة.',
    },
    is_published: true,
    is_healthy: true,
  },
  {
    id: 'rec_tn_08_tastira_tunisienne',
    slug: 'tastira-tunisienne',
    name_fr: 'Tastira tunisienne',
    name_derja: 'Tastira tounsia',
    name_ar: 'تسطيرة تونسية',
    description_fr:
      "Des piments et tomates grillés sur la flamme, hachés finement puis liés aux œufs dans l'huile d'olive à l'ail : une entrée fumée et rustique.",
    description_derja:
      'Felfel w tmatem mechwyin 3al nar, m9assin rgi9 w mkhalltin bel 3dham fel zit zitouna bel thoum: ri7et el chwa w ta3m el bled.',
    description_ar:
      'فلفل وطماطم مشويان على اللهب، مفرومان ناعماً ومخلوطان بالبيض في زيت الزيتون بالثوم: مقبلات بنكهة الشواء الريفية.',
    image_url: '',
    prep_time_minutes: 15,
    cook_time_minutes: 25,
    base_servings: 4,
    estimated_cost_tnd: 6,
    category: 'entree',
    cuisine_type: 'vegetarienne',
    difficulty: 'facile',
    ingredients: [
      { ingredient_id: 'ing_piment', quantity_base: 4, unit: 'pièces', role: 'key', substitutes: ['ing_poivron'] },
      { ingredient_id: 'ing_tomate', quantity_base: 3, unit: 'pièces', role: 'key' },
      { ingredient_id: 'ing_oeuf', quantity_base: 4, unit: 'pièces', role: 'key' },
      { ingredient_id: 'ing_ail', quantity_base: 3, unit: 'gousses', role: 'staple' },
      { ingredient_id: 'ing_tabel_karwiya', quantity_base: 0.5, unit: 'c.à.c', role: 'staple' },
      { ingredient_id: 'ing_huile_olive', quantity_base: 3, unit: 'c.à.s', role: 'staple' },
      { ingredient_id: 'ing_sel_poivre', quantity_base: 1, unit: 'pincée', role: 'staple' },
    ],
    steps: [
      {
        step_number: 1,
        instruction_fr:
          "Grillez les piments et les tomates entiers directement sur la flamme du gaz ou sous le gril du four, 10 à 12 minutes en les retournant, jusqu'à ce que la peau noircisse.",
        instruction_derja:
          'Ichwi el felfel wel tmatem kemlin 3la nar el gaz walla ta7t el gril mta3 el four 10 l 12 d9i9a w enti t9allebhom 7atta el 9echra tek7al.',
        instruction_ar:
          'اشوِ الفلفل والطماطم كاملين على لهب الغاز أو تحت شواية الفرن من 10 إلى 12 دقيقة مع التقليب حتى يسودّ القشر.',
      },
      {
        step_number: 2,
        instruction_fr:
          'Enfermez-les 5 minutes dans un sac, pelez-les, retirez les graines des piments, puis hachez le tout finement au couteau.',
        instruction_derja:
          'Sakkerhom 5 d9aye9 f sachet, 9achrhom, na77i zri3et el felfel w 9oss el kol rgi9 bel skina.',
        instruction_ar: 'أغلق عليها كيساً خمس دقائق ثم قشّرها وانزع بذور الفلفل، وافرم الكل ناعماً بالسكين.',
      },
      {
        step_number: 3,
        instruction_fr:
          "Dans une poêle, faites dorer légèrement l'ail écrasé dans l'huile 1 minute, ajoutez le hachis de légumes, le carvi et le sel, et laissez sécher 5 minutes.",
        instruction_derja:
          'F me9la, 7ammer el thoum el marfoukh fel zit d9i9a, zid el khodhra el m9assa, karwiya w mel7, w khalliha tenchef 5 d9aye9.',
        instruction_ar:
          'في مقلاة، حمّر الثوم المهروس في الزيت دقيقة، ثم أضف مفروم الخضار والكروية والملح واتركه يجفّ خمس دقائق.',
      },
      {
        step_number: 4,
        instruction_fr:
          "Cassez les œufs directement dans la poêle et remuez doucement 2 à 3 minutes, juste jusqu'à ce qu'ils soient pris mais encore crémeux. Servez tiède avec du pain.",
        instruction_derja:
          'Faqqes el 3dham fel me9la w 7arrek b chwaya 2 l 3 d9aye9, ghir 7atta yetmasku w yob9aw mrattbin. Sarbiha dafya m3a el khobz.',
        instruction_ar:
          'اكسر البيض مباشرة في المقلاة وحرّك بلطف من دقيقتين إلى ثلاث حتى يتماسك ويبقى طرياً، وقدّمها دافئة مع الخبز.',
      },
    ],
    chef_tip: {
      fr: 'Grillez les légumes la veille et gardez-les avec leur jus au frais : le lendemain la tastira se prépare en 5 minutes et le goût fumé est encore plus marqué.',
      derja:
        'Ichwi el khodhra mel lila w khalliha b mayetha fel frigo: lendemain ta3mel el tastira f 5 d9aye9 w ri7et el chwa tweli a9wa.',
      ar: 'اشوِ الخضار من الليلة السابقة واحفظها بعصيرها في الثلاجة، فتحضّر التسطيرة في خمس دقائق وتصبح نكهة الشواء أقوى.',
    },
    is_published: true,
    is_healthy: true,
  },
  {
    id: 'rec_tn_09_salade_tunisienne_au_thon',
    slug: 'salade-tunisienne-au-thon',
    name_fr: 'Salade tunisienne au thon',
    name_derja: 'Slata tounsia bel thon',
    name_ar: 'سلطة تونسية بالتن',
    description_fr:
      "Tomates, concombre, oignon et piment coupés en tout petits dés, assaisonnés d'huile d'olive, de citron et de menthe séchée, couronnés de thon, d'œufs et d'olives.",
    description_derja:
      'Tmatem, faggous, bsal w felfel m9assin ka3bet sghar barcha, b zit zitouna, 9ares w na3na3 yabes, w mel fo9 thon, 3dham w zaytoun.',
    description_ar:
      'طماطم وخيار وبصل وفلفل مقطعة مكعبات صغيرة جداً، متبّلة بزيت الزيتون والليمون والنعناع الجاف، ومزيّنة بالتن والبيض والزيتون.',
    image_url: '',
    prep_time_minutes: 20,
    cook_time_minutes: 10,
    base_servings: 4,
    estimated_cost_tnd: 11,
    category: 'entree',
    cuisine_type: 'rapide',
    difficulty: 'facile',
    ingredients: [
      { ingredient_id: 'ing_tomate', quantity_base: 4, unit: 'pièces', role: 'key' },
      { ingredient_id: 'ing_concombre', quantity_base: 1, unit: 'pièce', role: 'key' },
      { ingredient_id: 'ing_oignon', quantity_base: 1, unit: 'pièce', role: 'secondary' },
      { ingredient_id: 'ing_piment', quantity_base: 1, unit: 'pièce', role: 'secondary', substitutes: ['ing_poivron'] },
      { ingredient_id: 'ing_thon_boite', quantity_base: 1, unit: 'boîte', role: 'secondary' },
      { ingredient_id: 'ing_oeuf', quantity_base: 2, unit: 'pièces', role: 'secondary' },
      { ingredient_id: 'ing_olives', quantity_base: 60, unit: 'g', role: 'secondary' },
      { ingredient_id: 'ing_citron', quantity_base: 1, unit: 'pièce', role: 'secondary' },
      { ingredient_id: 'ing_pomme', quantity_base: 1, unit: 'pièce', is_optional: true, role: 'secondary' },
      { ingredient_id: 'ing_menthe_sechee', quantity_base: 1, unit: 'c.à.c', role: 'staple' },
      { ingredient_id: 'ing_huile_olive', quantity_base: 4, unit: 'c.à.s', role: 'staple' },
      { ingredient_id: 'ing_sel_poivre', quantity_base: 1, unit: 'pincée', role: 'staple' },
    ],
    steps: [
      {
        step_number: 1,
        instruction_fr:
          "Faites cuire les œufs 10 minutes dans l'eau bouillante, refroidissez-les sous l'eau froide puis écalez-les et coupez-les en quartiers.",
        instruction_derja: 'Sla9 el 3dham 10 d9aye9 fel ma yghli, bardhom ta7t el ma el bered, 9achrhom w 9assemhom 4.',
        instruction_ar: 'اسلق البيض عشر دقائق في الماء المغلي، ثم برّده تحت الماء البارد وقشّره وقسّمه أرباعاً.',
      },
      {
        step_number: 2,
        instruction_fr:
          "Coupez les tomates, le concombre épluché, l'oignon, le piment épépiné et la pomme en dés de 5 mm : la finesse de la coupe fait toute la salade.",
        instruction_derja:
          '9oss el tmatem, el faggous m9acher, el bsal, el felfel bla zri3a wel toffe7a ka3bet 5 mm: el sirr kollou fel 9assan el rgi9.',
        instruction_ar:
          'قطّع الطماطم والخيار المقشّر والبصل والفلفل منزوع البذور والتفاحة مكعبات بحجم نصف سنتيمتر، فدقة التقطيع هي سرّ السلطة.',
      },
      {
        step_number: 3,
        instruction_fr:
          "Juste avant de servir, assaisonnez avec le sel, le jus de citron, l'huile d'olive et la menthe séchée émiettée entre les doigts ; mélangez délicatement.",
        instruction_derja:
          '9bal ma tsarbi bechwaya, fawa7 bel mel7, 3asret el 9ares, zit zitouna wel na3na3 el yabes mfarrak bin swab3ek, w 9allab b chwaya.',
        instruction_ar:
          'قبل التقديم مباشرة، تبّل بالملح وعصير الليمون وزيت الزيتون والنعناع الجاف المفتّت بين الأصابع، وقلّب بلطف.',
      },
      {
        step_number: 4,
        instruction_fr:
          "Dressez dans un plat, disposez le thon égoutté en morceaux au centre, les quartiers d'œufs et les olives tout autour.",
        instruction_derja: '7ott el slata f s7an, w 7ott el thon msaffi fel wost, w el 3dham wel zaytoun dourou.',
        instruction_ar: 'ضع السلطة في صحن، وضع التن المصفّى في الوسط وأرباع البيض والزيتون حوله.',
      },
    ],
    chef_tip: {
      fr: "Salez la salade au tout dernier moment : le sel fait rendre l'eau des tomates et du concombre, et les dés deviennent mous en quelques minutes.",
      derja:
        'Mallah el slata ken fel d9i9a lekhra: el mel7 ykharrej el ma mel tmatem wel faggous w el ka3bet yratbou f d9aye9.',
      ar: 'ملّح السلطة في آخر لحظة فقط، لأن الملح يُخرج ماء الطماطم والخيار فتلين المكعبات في دقائق.',
    },
    is_published: true,
    is_healthy: true,
  },
  {
    id: 'rec_tn_10_salade_de_poulpe',
    slug: 'salade-de-poulpe',
    name_fr: 'Salade de poulpe',
    name_derja: 'Slata 9arnit',
    name_ar: 'سلطة القرنيط',
    description_fr:
      "Du poulpe tendre poché puis coupé en morceaux, mariné au citron, à l'huile d'olive, à l'oignon et au persil : une entrée fraîche des côtes de Sfax et Kerkennah.",
    description_derja:
      '9arnit rteb masmou9 w m9assas, mchermel bel 9ares, zit zitouna, bsal w ma3dnous: slata fresh mta3 sw7el Sfax w 9er9na.',
    description_ar:
      'قرنيط طري مسلوق ومقطّع، متبّل بالليمون وزيت الزيتون والبصل والبقدونس: مقبلات منعشة من سواحل صفاقس وقرقنة.',
    image_url: '',
    prep_time_minutes: 20,
    cook_time_minutes: 50,
    base_servings: 4,
    estimated_cost_tnd: 18,
    category: 'entree',
    cuisine_type: 'traditionnelle',
    difficulty: 'moyen',
    ingredients: [
      { ingredient_id: 'ing_poulpe', quantity_base: 800, unit: 'g', role: 'key', substitutes: ['ing_crevettes'] },
      { ingredient_id: 'ing_oignon', quantity_base: 1, unit: 'pièce', role: 'secondary' },
      {
        ingredient_id: 'ing_persil',
        quantity_base: 1,
        unit: 'botte',
        role: 'secondary',
        substitutes: ['ing_coriandre'],
      },
      { ingredient_id: 'ing_citron', quantity_base: 2, unit: 'pièces', role: 'key' },
      { ingredient_id: 'ing_piment', quantity_base: 1, unit: 'pièce', is_optional: true, role: 'secondary' },
      { ingredient_id: 'ing_olives', quantity_base: 50, unit: 'g', is_optional: true, role: 'secondary' },
      { ingredient_id: 'ing_ail', quantity_base: 1, unit: 'gousse', role: 'staple' },
      { ingredient_id: 'ing_cumin', quantity_base: 0.5, unit: 'c.à.c', role: 'staple' },
      { ingredient_id: 'ing_huile_olive', quantity_base: 5, unit: 'c.à.s', role: 'staple' },
      { ingredient_id: 'ing_sel_poivre', quantity_base: 1, unit: 'pincée', role: 'staple' },
    ],
    steps: [
      {
        step_number: 1,
        instruction_fr:
          "Nettoyez le poulpe (retirez le bec et les yeux), puis plongez-le trois fois dans l'eau bouillante en le ressortant aussitôt pour que les tentacules se recroquevillent.",
        instruction_derja:
          'Ndhaf el 9arnit (na77i el man9ar wel 3inin), w ghattsou fel ma yghli 3 marrat w tala3ou toul bech ri9lih yetlawwew.',
        instruction_ar:
          'نظّف القرنيط بنزع المنقار والعينين، ثم اغمسه في الماء المغلي ثلاث مرات وأخرجه فوراً حتى تلتفّ أذرعه.',
      },
      {
        step_number: 2,
        instruction_fr:
          "Faites-le cuire à petits frémissements, sans sel, 40 à 45 minutes : il est cuit quand la pointe d'un couteau s'enfonce sans résistance à la base d'un tentacule.",
        instruction_derja:
          'Khallih yetayyeb 3la nar hadya bla mel7 40 l 45 d9i9a: yetayyeb ki el skina tod5ol fi ri9lou bla ma tsob 9owwa.',
        instruction_ar:
          'اطهه على نار هادئة دون ملح من 40 إلى 45 دقيقة، وينضج عندما يدخل رأس السكين في قاعدة الذراع دون مقاومة.',
      },
      {
        step_number: 3,
        instruction_fr:
          'Laissez-le tiédir dans son eau de cuisson 15 minutes, égouttez-le puis coupez les tentacules en rondelles de 1 cm.',
        instruction_derja: 'Khallih yebred fi mayet tabkhou 15 d9i9a, saffih w 9oss ri9lih rouwed 1 cm.',
        instruction_ar: 'اتركه يفتر في ماء طهيه ربع ساعة، ثم صفّه وقطّع أذرعه دوائر بسمك سنتيمتر.',
      },
      {
        step_number: 4,
        instruction_fr:
          "Mélangez le poulpe encore tiède avec l'oignon émincé très finement, l'ail pilé, le persil haché, le piment, le jus des citrons, l'huile, le cumin, le sel et le poivre.",
        instruction_derja:
          'Khallat el 9arnit w howa dafi m3a el bsal m9assas rgi9 barcha, el thoum el mad9ou9, el ma3dnous, el felfel, 3asret el 9ares, el zit, el kammoun, el mel7 wel felfel ak7el.',
        instruction_ar:
          'اخلط القرنيط وهو دافئ مع البصل المقطّع رقيقاً جداً والثوم المدقوق والبقدونس المفروم والفلفل وعصير الليمون والزيت والكمون والملح والفلفل الأسود.',
      },
      {
        step_number: 5,
        instruction_fr: "Couvrez et laissez mariner au moins 1 heure au réfrigérateur. Servez frais, garni d'olives.",
        instruction_derja:
          'Ghatti w khalliha tetchermel sa3a 3al a9al fel frigo. Sarbiha bérda w zayyen-ha bel zaytoun.',
        instruction_ar: 'غطِّ السلطة واتركها تتبّل ساعة على الأقل في الثلاجة، ثم قدّمها باردة مزينة بالزيتون.',
      },
    ],
    chef_tip: {
      fr: 'Congelez le poulpe frais 48 heures avant de le cuisiner : le froid casse les fibres et il devient tendre sans avoir besoin de le battre.',
      derja:
        '7ott el 9arnit el fresh fel congélateur 48 sa3a 9bal ma tetayybou: el bard yfarra9 el 3rou9 w yweli rteb bla ma tedharbou.',
      ar: 'جمّد القرنيط الطازج 48 ساعة قبل طهيه، فالبرد يفكّك أليافه ويصبح طرياً دون الحاجة إلى ضربه.',
    },
    is_published: true,
    is_healthy: true,
  },
  {
    id: 'rec_tn_11_ojja_aux_crevettes',
    slug: 'ojja-aux-crevettes',
    name_fr: 'Ojja aux crevettes',
    name_derja: 'Ojja bel 9ambri',
    name_ar: 'عجة بالقمبري',
    description_fr:
      "Des crevettes saisies à l'ail dans une sauce tomate relevée à l'harissa, avec des œufs pochés au jaune coulant : une ojja de bord de mer prête en 25 minutes.",
    description_derja:
      '9ambri m9alli bel thoum f salsa tmatem b hrisa, w 3dham mrayba fo9ha: ojja mta3 b7ar tetayyeb f 25 d9i9a.',
    description_ar: 'قمبري مقلي بالثوم في صلصة طماطم بالهريسة مع بيض بصفار سائل: عجة بحرية جاهزة في خمس وعشرين دقيقة.',
    image_url: '',
    prep_time_minutes: 15,
    cook_time_minutes: 20,
    base_servings: 4,
    estimated_cost_tnd: 18,
    category: 'plat_principal',
    cuisine_type: 'rapide',
    difficulty: 'facile',
    ingredients: [
      { ingredient_id: 'ing_crevettes', quantity_base: 400, unit: 'g', role: 'key' },
      { ingredient_id: 'ing_oeuf', quantity_base: 4, unit: 'pièces', role: 'key' },
      { ingredient_id: 'ing_tomate', quantity_base: 4, unit: 'pièces', role: 'secondary' },
      {
        ingredient_id: 'ing_piment',
        quantity_base: 2,
        unit: 'pièces',
        role: 'secondary',
        substitutes: ['ing_poivron'],
      },
      { ingredient_id: 'ing_persil', quantity_base: 0.25, unit: 'botte', is_optional: true, role: 'secondary' },
      { ingredient_id: 'ing_tomate_concentree', quantity_base: 1, unit: 'c.à.s', role: 'staple' },
      { ingredient_id: 'ing_harissa', quantity_base: 1, unit: 'c.à.c', role: 'staple' },
      { ingredient_id: 'ing_ail', quantity_base: 4, unit: 'gousses', role: 'staple' },
      { ingredient_id: 'ing_tabel_karwiya', quantity_base: 1, unit: 'c.à.c', role: 'staple' },
      { ingredient_id: 'ing_huile_olive', quantity_base: 4, unit: 'c.à.s', role: 'staple' },
      { ingredient_id: 'ing_sel_poivre', quantity_base: 1, unit: 'pincée', role: 'staple' },
    ],
    steps: [
      {
        step_number: 1,
        instruction_fr:
          'Décortiquez les crevettes en gardant éventuellement la queue, retirez le filament noir du dos et séchez-les bien dans un torchon.',
        instruction_derja:
          '9achar el 9ambri (tnajjem tkhalli el dhil), na77i el kheit el ak7el mel dhahr w nachfou mlih b fouta.',
        instruction_ar: 'قشّر القمبري مع ترك الذيل إن شئت، وانزع الخيط الأسود من الظهر وجفّفه جيداً بمنشفة.',
      },
      {
        step_number: 2,
        instruction_fr:
          "Dans une poêle large, saisissez les crevettes 2 minutes à feu vif dans 2 c.à.s d'huile avec la moitié de l'ail ; retirez-les dès qu'elles deviennent roses.",
        instruction_derja:
          'F me9la kbira, 9alli el 9ambri d9i9tin 3la nar 9wiya f zouz mgharef zit m3a nos el thoum, w na77ih awel ma ywalli wardi.',
        instruction_ar:
          'في مقلاة واسعة، اقلِ القمبري دقيقتين على نار قوية في ملعقتين من الزيت مع نصف الثوم، وارفعه بمجرد أن يصبح وردياً.',
      },
      {
        step_number: 3,
        instruction_fr:
          "Dans la même poêle, ajoutez le reste d'huile et d'ail, la tomate concentrée, l'harissa, le tabel-karwiya et les tomates râpées ; laissez réduire 8 minutes avec les piments en lanières.",
        instruction_derja:
          'Fi nafs el me9la, zid ba9iet el zit wel thoum, tmatem ma3jouna, hrisa, tabel w karwiya wel tmatem el m7akka, w khalliha tenkos 8 d9aye9 m3a el felfel chra2e7.',
        instruction_ar:
          'في المقلاة نفسها، أضف بقية الزيت والثوم والطماطم المعجونة والهريسة والتابل والكروية والطماطم المبشورة، واترك الصلصة تنقص ثماني دقائق مع شرائح الفلفل.',
      },
      {
        step_number: 4,
        instruction_fr:
          'Remettez les crevettes dans la sauce, creusez 4 puits et cassez-y les œufs. Couvrez 3 à 4 minutes à feu doux, parsemez de persil et servez dans la poêle.',
        instruction_derja:
          'Raja3 el 9ambri lel salsa, a3mel 4 7firat w faqqes fihom el 3dham. Ghatti 3 l 4 d9aye9 3la nar hadya, rouch el ma3dnous w sarbiha fel me9la.',
        instruction_ar:
          'أعد القمبري إلى الصلصة واصنع أربع حفر واكسر فيها البيض، ثم غطِّ من ثلاث إلى أربع دقائق على نار هادئة، ورشّ البقدونس وقدّمها في المقلاة.',
      },
    ],
    chef_tip: {
      fr: "Faites revenir les têtes et carapaces 3 minutes dans l'huile avant de commencer la sauce, puis retirez-les : elles donnent à l'ojja un goût de mer incomparable.",
      derja:
        '9alli rouss w 9chour el 9ambri 3 d9aye9 fel zit 9bal ma tebda el salsa w ba3d na77ihom: ya3tiw lel ojja ta3m el b7ar el 7a9.',
      ar: 'اقلِ رؤوس القمبري وقشوره ثلاث دقائق في الزيت قبل تحضير الصلصة ثم انزعها، فهي تمنح العجة نكهة بحرية لا مثيل لها.',
    },
    is_published: true,
    is_healthy: false,
  },
  {
    id: 'rec_tn_12_ojja_aux_epinards',
    slug: 'ojja-aux-epinards',
    name_fr: 'Ojja aux épinards',
    name_derja: 'Ojja bel sbena5',
    name_ar: 'عجة بالسبناخ',
    description_fr:
      "Des épinards fondus à l'oignon et à l'ail dans une sauce légèrement pimentée, avec des œufs mollets et des cuillerées de ricotta : une ojja verte, légère et gourmande.",
    description_derja:
      'Sbena5 mratteb bel bsal wel thoum f salsa 7arra chwaya, m3a 3dham mrayba w ricotta: ojja khadhra, khfifa w bnina.',
    description_ar:
      'سبناخ مطهو بالبصل والثوم في صلصة حارة قليلاً، مع بيض بصفار طري وملاعق من الريكوتا: عجة خضراء خفيفة ولذيذة.',
    image_url: '',
    prep_time_minutes: 15,
    cook_time_minutes: 20,
    base_servings: 4,
    estimated_cost_tnd: 10,
    category: 'plat_principal',
    cuisine_type: 'vegetarienne',
    difficulty: 'facile',
    ingredients: [
      { ingredient_id: 'ing_epinards', quantity_base: 2, unit: 'bottes', role: 'key', substitutes: ['ing_blette'] },
      { ingredient_id: 'ing_oeuf', quantity_base: 4, unit: 'pièces', role: 'key' },
      { ingredient_id: 'ing_oignon', quantity_base: 1, unit: 'pièce', role: 'secondary' },
      { ingredient_id: 'ing_ricotta', quantity_base: 1, unit: 'pot', is_optional: true, role: 'secondary' },
      { ingredient_id: 'ing_tomate_concentree', quantity_base: 1, unit: 'c.à.s', role: 'staple' },
      { ingredient_id: 'ing_harissa', quantity_base: 1, unit: 'c.à.c', role: 'staple' },
      { ingredient_id: 'ing_ail', quantity_base: 3, unit: 'gousses', role: 'staple' },
      { ingredient_id: 'ing_tabel_karwiya', quantity_base: 1, unit: 'c.à.c', role: 'staple' },
      { ingredient_id: 'ing_huile_olive', quantity_base: 3, unit: 'c.à.s', role: 'staple' },
      { ingredient_id: 'ing_sel_poivre', quantity_base: 1, unit: 'pincée', role: 'staple' },
    ],
    steps: [
      {
        step_number: 1,
        instruction_fr:
          'Lavez soigneusement les épinards dans plusieurs eaux pour éliminer le sable, retirez les grosses tiges et hachez grossièrement les feuilles.',
        instruction_derja:
          'Ghsel el sbena5 mlih f barcha mwayeh bech yetna77a el raml, na77i el 3rou9 el kbar w 9oss el war9 ghlidh.',
        instruction_ar: 'اغسل السبناخ جيداً في عدة مياه لإزالة الرمل، وانزع السيقان الغليظة وافرم الأوراق فرماً خشناً.',
      },
      {
        step_number: 2,
        instruction_fr:
          "Faites fondre l'oignon émincé dans l'huile 4 minutes, ajoutez l'ail, la tomate concentrée, l'harissa et le tabel-karwiya diluées dans un demi-verre d'eau ; laissez cuire 3 minutes.",
        instruction_derja:
          'Ratteb el bsal el m9assas fel zit 4 d9aye9, zid el thoum, tmatem ma3jouna, hrisa w tabel w karwiya mdawbin f nos kes ma, w khalliha 3 d9aye9.',
        instruction_ar:
          'ليّن البصل المقطّع في الزيت أربع دقائق، ثم أضف الثوم والطماطم المعجونة والهريسة والتابل والكروية مذوبة في نصف كأس ماء، واتركها ثلاث دقائق.',
      },
      {
        step_number: 3,
        instruction_fr:
          "Ajoutez les épinards par poignées en remuant : ils réduisent en 5 minutes. Salez et poursuivez jusqu'à ce que presque toute l'eau se soit évaporée.",
        instruction_derja:
          'Zid el sbena5 9abdha b 9abdha w enti t7arrek: yenkos f 5 d9aye9. Mallah w kammel 7atta el ma ynachef ta9riban el kol.',
        instruction_ar:
          'أضف السبناخ حفنة حفنة مع التحريك، فهو ينقص في خمس دقائق، ثم ملّح وواصل حتى يتبخر الماء تقريباً.',
      },
      {
        step_number: 4,
        instruction_fr:
          "Répartissez la ricotta en petits tas, cassez les œufs entre eux, couvrez et laissez cuire 4 minutes à feu doux jusqu'à ce que les blancs soient pris.",
        instruction_derja:
          'Farra9 el ricotta kwayer sghar, faqqes el 3dham binathom, ghatti w khalliha 4 d9aye9 3la nar hadya 7atta el abyedh yetmasek.',
        instruction_ar:
          'وزّع الريكوتا كتلاً صغيرة واكسر البيض بينها، ثم غطِّ واترك أربع دقائق على نار هادئة حتى يتماسك البياض.',
      },
    ],
    chef_tip: {
      fr: "Pressez bien les épinards s'ils rendent beaucoup d'eau : une ojja trop liquide empêche les œufs de prendre proprement.",
      derja:
        'Ken el sbena5 ykharrej barcha ma, 3asrou mlih: el ojja ki tkoun bel ma barcha el 3dham ma yetmaskouch kif lezem.',
      ar: 'اعصر السبناخ جيداً إذا أخرج ماء كثيراً، فالعجة المائية تمنع البيض من التماسك كما يجب.',
    },
    is_published: true,
    is_healthy: true,
  },
  {
    id: 'rec_tn_13_makarouna_salsa_bel_3alouch',
    slug: 'macaronis-en-sauce-rouge-a-l-agneau',
    name_fr: "Macaronis en sauce rouge à l'agneau",
    name_derja: 'Makarouna salsa bel 3allouch',
    name_ar: 'مقرونة صلصة بلحم العلوش',
    description_fr:
      "Le plat du dimanche par excellence : des morceaux d'agneau mijotés dans une sauce rouge épicée, mélangée aux macaronis jusqu'à ce qu'ils s'en imprègnent.",
    description_derja:
      'Makla mta3 nhar el a7ad: 9ta3 l7am 3allouch tetayyeb f salsa 7amra 7arra, tetkhallat m3a el makarouna 7atta tochrobha.',
    description_ar: 'طبق يوم الأحد بامتياز: قطع لحم العلوش مطهوة في صلصة حمراء حارة تُخلط بالمقرونة حتى تتشرّبها.',
    image_url: '',
    prep_time_minutes: 15,
    cook_time_minutes: 80,
    base_servings: 4,
    estimated_cost_tnd: 29,
    category: 'plat_principal',
    cuisine_type: 'familiale',
    difficulty: 'moyen',
    ingredients: [
      { ingredient_id: 'ing_pates', quantity_base: 500, unit: 'g', role: 'key' },
      { ingredient_id: 'ing_agneau', quantity_base: 500, unit: 'g', role: 'key', substitutes: ['ing_boeuf'] },
      { ingredient_id: 'ing_oignon', quantity_base: 1, unit: 'pièce', role: 'secondary' },
      { ingredient_id: 'ing_tomate', quantity_base: 2, unit: 'pièces', role: 'secondary' },
      { ingredient_id: 'ing_piment', quantity_base: 2, unit: 'pièces', is_optional: true, role: 'secondary' },
      { ingredient_id: 'ing_fromage_rape', quantity_base: 50, unit: 'g', is_optional: true, role: 'secondary' },
      { ingredient_id: 'ing_tomate_concentree', quantity_base: 3, unit: 'c.à.s', role: 'staple' },
      { ingredient_id: 'ing_harissa', quantity_base: 1, unit: 'c.à.s', role: 'staple' },
      { ingredient_id: 'ing_ail', quantity_base: 4, unit: 'gousses', role: 'staple' },
      { ingredient_id: 'ing_tabel_karwiya', quantity_base: 1, unit: 'c.à.c', role: 'staple' },
      { ingredient_id: 'ing_piment_moulu', quantity_base: 1, unit: 'c.à.c', role: 'staple' },
      { ingredient_id: 'ing_curcuma', quantity_base: 0.5, unit: 'c.à.c', role: 'staple' },
      { ingredient_id: 'ing_huile_olive', quantity_base: 5, unit: 'c.à.s', role: 'staple' },
      { ingredient_id: 'ing_sel_poivre', quantity_base: 1, unit: 'pincée', role: 'staple' },
    ],
    steps: [
      {
        step_number: 1,
        instruction_fr:
          "Dans une marmite, faites revenir l'agneau en morceaux avec l'oignon râpé et l'huile 6 minutes, jusqu'à ce que la viande perde sa couleur rosée.",
        instruction_derja:
          'F tanjra, 9alli el l7am morsewet m3a el bsal el m7akek wel zit 6 d9aye9, 7atta el l7am ybaddel lounou.',
        instruction_ar: 'في قدر، حمّر قطع اللحم مع البصل المبشور والزيت ست دقائق حتى يتغيّر لون اللحم.',
      },
      {
        step_number: 2,
        instruction_fr:
          "Ajoutez l'ail pilé, la tomate concentrée, l'harissa, les épices et les tomates râpées ; laissez compoter 5 minutes jusqu'à ce que la sauce fonce et que l'huile se sépare.",
        instruction_derja:
          'Zid el thoum el mad9ou9, tmatem ma3jouna, hrisa, el fowye7 wel tmatem el m7akka, w khalliha tet9alla 5 d9aye9 7atta el salsa tghma9 w el zit yetfar9.',
        instruction_ar:
          'أضف الثوم المدقوق والطماطم المعجونة والهريسة والتوابل والطماطم المبشورة، واتركها تتقلّى خمس دقائق حتى يغمق لون الصلصة وينفصل الزيت.',
      },
      {
        step_number: 3,
        instruction_fr:
          "Mouillez avec 1 L d'eau chaude, ajoutez les piments entiers et laissez mijoter à couvert 50 minutes, jusqu'à ce que l'agneau soit fondant.",
        instruction_derja:
          'Marra9 b litro ma skhoun, zid el felfel kemel w khalliha teghli mghattya 50 d9i9a 7atta el l7am yratteb.',
        instruction_ar:
          'أضف لتراً من الماء الساخن مع الفلفل الكامل، واترك المرق يغلي مغطّى 50 دقيقة حتى ينضج اللحم ويلين.',
      },
      {
        step_number: 4,
        instruction_fr:
          "Faites cuire les macaronis dans 4 L d'eau bouillante salée en retirant 2 minutes avant le temps indiqué sur le paquet, puis égouttez.",
        instruction_derja:
          'Sla9 el makarouna f 4 litro ma yghli bel mel7 w tala3ha d9i9tin 9bal el wa9t el mektoub 3al paquet, w saffiha.',
        instruction_ar:
          'اسلق المقرونة في أربعة لترات من الماء المغلي المملّح وأخرجها قبل دقيقتين من الوقت المكتوب على العلبة، ثم صفّها.',
      },
      {
        step_number: 5,
        instruction_fr:
          "Retirez la viande, versez les pâtes dans la sauce et laissez-les mijoter 3 minutes en remuant pour qu'elles absorbent la sauce. Servez avec la viande et les piments dessus, et un peu de fromage râpé.",
        instruction_derja:
          'Na77i el l7am, sobb el makarouna fel salsa w khalliha 3 d9aye9 w enti t7arrek bech tochrob el salsa. Sarbi bel l7am wel felfel mel fo9 w chwaya fromage.',
        instruction_ar:
          'ارفع اللحم وأفرغ المقرونة في الصلصة، واتركها ثلاث دقائق مع التحريك لتتشرّب الصلصة، ثم قدّمها مع اللحم والفلفل فوقها وقليل من الجبن المبشور.',
      },
    ],
    chef_tip: {
      fr: "Gardez une louche de sauce de côté avant d'y verser les pâtes : vous pourrez la rajouter au moment de servir si les macaronis ont tout bu.",
      derja:
        'Khalli mgharfa salsa 3la jnab 9bal ma tsobb el makarouna: tzidha wa9t tsarbi ken el makarouna chrbet el salsa el kol.',
      ar: 'احتفظ بمغرفة من الصلصة جانباً قبل إضافة المقرونة، لتضيفها عند التقديم إذا تشرّبت المقرونة كل الصلصة.',
    },
    is_published: true,
    is_healthy: false,
  },
  {
    id: 'rec_tn_14_makarouna_bel_sardina',
    slug: 'pates-aux-sardines-fraiches',
    name_fr: 'Pâtes aux sardines fraîches',
    name_derja: 'Makarouna bel sardina',
    name_ar: 'مقرونة بالسردينة',
    description_fr:
      "Des sardines fraîches mijotées quelques minutes dans une sauce tomate à l'ail, au carvi et au piment, enrobant des pâtes : un plat populaire de la côte, économique et savoureux.",
    description_derja:
      'Sardina fresh tetayyeb chwaya f salsa tmatem bel thoum, karwiya w felfel, m3a makarouna: makla cha3biya mta3 el sa7el, rkhisa w bnina.',
    description_ar:
      'سردين طازج يُطهى دقائق في صلصة طماطم بالثوم والكروية والفلفل مع المقرونة: طبق شعبي ساحلي اقتصادي ولذيذ.',
    image_url: '',
    prep_time_minutes: 25,
    cook_time_minutes: 30,
    base_servings: 4,
    estimated_cost_tnd: 13,
    category: 'plat_principal',
    cuisine_type: 'economique',
    difficulty: 'facile',
    ingredients: [
      { ingredient_id: 'ing_pates', quantity_base: 500, unit: 'g', role: 'key' },
      { ingredient_id: 'ing_poisson_frais', quantity_base: 500, unit: 'g', role: 'key' },
      { ingredient_id: 'ing_tomate', quantity_base: 2, unit: 'pièces', role: 'secondary' },
      {
        ingredient_id: 'ing_piment',
        quantity_base: 2,
        unit: 'pièces',
        role: 'secondary',
        substitutes: ['ing_poivron'],
      },
      { ingredient_id: 'ing_persil', quantity_base: 0.5, unit: 'botte', role: 'secondary' },
      { ingredient_id: 'ing_citron', quantity_base: 1, unit: 'pièce', is_optional: true, role: 'secondary' },
      { ingredient_id: 'ing_tomate_concentree', quantity_base: 2, unit: 'c.à.s', role: 'staple' },
      { ingredient_id: 'ing_harissa', quantity_base: 1, unit: 'c.à.c', role: 'staple' },
      { ingredient_id: 'ing_ail', quantity_base: 5, unit: 'gousses', role: 'staple' },
      { ingredient_id: 'ing_tabel_karwiya', quantity_base: 1, unit: 'c.à.c', role: 'staple' },
      { ingredient_id: 'ing_piment_moulu', quantity_base: 1, unit: 'c.à.c', role: 'staple' },
      { ingredient_id: 'ing_huile_olive', quantity_base: 4, unit: 'c.à.s', role: 'staple' },
      { ingredient_id: 'ing_sel_poivre', quantity_base: 1, unit: 'pincée', role: 'staple' },
    ],
    steps: [
      {
        step_number: 1,
        instruction_fr:
          "Étêtez et videz les sardines, ouvrez-les en portefeuille et retirez l'arête centrale. Rincez rapidement et assaisonnez de sel, de carvi et d'un peu d'ail pilé.",
        instruction_derja:
          'Na77i rouss el sardina w ndhafha, 7ellha 3la jnab w na77i el 7assek el kbir. Ghselha bel fisa3 w fawa7ha bel mel7, karwiya w chwaya thoum.',
        instruction_ar:
          'انزع رؤوس السردين وأحشاءه وافتحه كالكتاب وانزع الشوكة الوسطى، ثم اغسله بسرعة وتبّله بالملح والكروية وقليل من الثوم المدقوق.',
      },
      {
        step_number: 2,
        instruction_fr:
          "Faites revenir le reste de l'ail dans l'huile 1 minute, ajoutez la tomate concentrée, l'harissa, le piment moulu et les tomates râpées, puis 50 cl d'eau ; laissez bouillir 10 minutes.",
        instruction_derja:
          '9alli ba9iet el thoum fel zit d9i9a, zid tmatem ma3jouna, hrisa, felfel a7mar wel tmatem el m7akka w nos litro ma, w khalliha teghli 10 d9aye9.',
        instruction_ar:
          'حمّر بقية الثوم في الزيت دقيقة، ثم أضف الطماطم المعجونة والهريسة والفلفل الأحمر المطحون والطماطم المبشورة ونصف لتر من الماء، واتركها تغلي عشر دقائق.',
      },
      {
        step_number: 3,
        instruction_fr:
          'Déposez délicatement les sardines et les piments fendus dans la sauce frémissante, sans remuer, et laissez cuire 8 minutes à feu doux en secouant la casserole.',
        instruction_derja:
          '7ott el sardina wel felfel mchou9 fel salsa b lotf, bla ma t7arrek, w khalliha 8 d9aye9 3la nar hadya w enti tharrek el tanjra bel chwaya.',
        instruction_ar:
          'ضع السردين والفلفل المشقوق في الصلصة بلطف دون تحريك، واتركه ثماني دقائق على نار هادئة مع هزّ القدر بخفة.',
      },
      {
        step_number: 4,
        instruction_fr:
          "Pendant ce temps, faites cuire les pâtes al dente dans une grande quantité d'eau salée et égouttez-les en gardant un verre d'eau de cuisson.",
        instruction_derja:
          'Fi nafs el wa9t, sla9 el makarouna al dente f barcha ma bel mel7 w saffiha w khalli kes men mayetha.',
        instruction_ar:
          'في الأثناء، اسلق المقرونة نصف سلق في كمية كبيرة من الماء المملّح، وصفّها مع الاحتفاظ بكأس من ماء سلقها.',
      },
      {
        step_number: 5,
        instruction_fr:
          "Retirez les sardines avec une écumoire, mélangez les pâtes à la sauce (allongée d'eau de cuisson si besoin), puis servez avec les sardines par-dessus, le persil et un filet de citron.",
        instruction_derja:
          'Tala3 el sardina b ghorbel, khallat el makarouna bel salsa (zid chwaya mayet el makarouna ken lezem), w sarbi bel sardina mel fo9, el ma3dnous w 9tar 9ares.',
        instruction_ar:
          'أخرج السردين بالمصفاة، واخلط المقرونة بالصلصة مع قليل من ماء السلق عند الحاجة، ثم قدّمها والسردين فوقها مع البقدونس وقطرات من الليمون.',
      },
    ],
    chef_tip: {
      fr: "Achetez des sardines à l'œil brillant et au ventre ferme, et cuisinez-les le jour même : c'est un poisson gras qui perd vite sa fraîcheur.",
      derja:
        'Echri sardina 3inha tlamma3 w kerchha sa7i7a, w tayybha nafs el nhar: 7out fih el dhhoun w yfassed fisa3.',
      ar: 'اشترِ سرديناً لامع العينين متماسك البطن واطهه في اليوم نفسه، فهو سمك دهني يفقد طزاجته بسرعة.',
    },
    is_published: true,
    is_healthy: false,
  },
  {
    id: 'rec_tn_15_riz_djerbien_aux_legumes',
    slug: 'riz-djerbien-au-poulet-et-aux-herbes',
    name_fr: 'Riz djerbien au poulet et aux herbes',
    name_derja: 'Rouz jerbi bel djej',
    name_ar: 'روز جربي بالدجاج',
    description_fr:
      "Le célèbre riz de Djerba cuit à la vapeur dans le couscoussier, mêlé de poulet, de blettes et d'une montagne d'herbes fraîches : chaque grain est parfumé et bien détaché.",
    description_derja:
      'El rouz el jerbi el machhour yfawer fel kaskas, mkhallet bel djej, el sel9 w barcha 7chaych fresh: kol 7abba fiha ri7a w wa7adha.',
    description_ar:
      'الروز الجربي الشهير المطهو على البخار في الكسكاس، مخلوطاً بالدجاج والسلق وكثير من الأعشاب الطازجة: كل حبة معطّرة ومنفصلة.',
    image_url: '',
    prep_time_minutes: 30,
    cook_time_minutes: 60,
    base_servings: 4,
    estimated_cost_tnd: 14,
    category: 'plat_principal',
    cuisine_type: 'traditionnelle',
    difficulty: 'moyen',
    ingredients: [
      { ingredient_id: 'ing_riz', quantity_base: 400, unit: 'g', role: 'key' },
      { ingredient_id: 'ing_poulet', quantity_base: 500, unit: 'g', role: 'key', substitutes: ['ing_agneau'] },
      { ingredient_id: 'ing_blette', quantity_base: 1, unit: 'botte', role: 'key', substitutes: ['ing_epinards'] },
      { ingredient_id: 'ing_persil', quantity_base: 1, unit: 'botte', role: 'secondary' },
      { ingredient_id: 'ing_coriandre', quantity_base: 1, unit: 'botte', role: 'secondary' },
      { ingredient_id: 'ing_oignon', quantity_base: 2, unit: 'pièces', role: 'secondary' },
      { ingredient_id: 'ing_pois_chiches', quantity_base: 100, unit: 'g', role: 'secondary' },
      { ingredient_id: 'ing_foie', quantity_base: 150, unit: 'g', is_optional: true, role: 'secondary' },
      { ingredient_id: 'ing_tomate_concentree', quantity_base: 2, unit: 'c.à.s', role: 'staple' },
      { ingredient_id: 'ing_curcuma', quantity_base: 1, unit: 'c.à.c', role: 'staple' },
      { ingredient_id: 'ing_tabel_karwiya', quantity_base: 1, unit: 'c.à.c', role: 'staple' },
      { ingredient_id: 'ing_piment_moulu', quantity_base: 1, unit: 'c.à.c', role: 'staple' },
      { ingredient_id: 'ing_menthe_sechee', quantity_base: 1, unit: 'c.à.c', role: 'staple' },
      { ingredient_id: 'ing_huile_olive', quantity_base: 6, unit: 'c.à.s', role: 'staple' },
      { ingredient_id: 'ing_sel_poivre', quantity_base: 1, unit: 'pincée', role: 'staple' },
    ],
    steps: [
      {
        step_number: 1,
        instruction_fr:
          "Lavez le riz jusqu'à ce que l'eau soit claire et laissez-le égoutter 15 minutes. Désossez le poulet et coupez-le en petits dés de 1,5 cm, comme le foie.",
        instruction_derja:
          'Ghsel el rouz 7atta el ma yesfa w khallih yetsaffa 15 d9i9a. Na77i el 3dham mel djej w 9oss-ou ka3bet sghar 1,5 cm, kif kif el kebda.',
        instruction_ar:
          'اغسل الأرز حتى يصفو الماء واتركه يتصفّى ربع ساعة. انزع العظم من الدجاج وقطّعه مكعبات صغيرة بحجم سنتيمتر ونصف، وكذلك الكبدة.',
      },
      {
        step_number: 2,
        instruction_fr:
          'Hachez finement les blettes, le persil, la coriandre et les oignons. Ils doivent représenter presque le même volume que le riz.',
        instruction_derja:
          '9oss rgi9 el sel9, el ma3dnous, el kosbor el akhdhar wel bsal. Lezem ykounou ta9riban 9add el rouz.',
        instruction_ar: 'افرم السلق والبقدونس والقصبر الأخضر والبصل ناعماً، ويجب أن تكون كميتها تقارب كمية الأرز.',
      },
      {
        step_number: 3,
        instruction_fr:
          "Dans un grand saladier, mélangez à la main le riz, le poulet, le foie, les herbes, les pois chiches cuits, la tomate concentrée, toutes les épices, le sel et l'huile, jusqu'à ce que chaque grain soit enrobé.",
        instruction_derja:
          'F 9as3a kbira, khallat b yeddik el rouz, el djej, el kebda, el 7chaych, el 7oms tayeb, tmatem ma3jouna, el fowye7 el kol, el mel7 wel zit, 7atta kol 7abba tetghatta.',
        instruction_ar:
          'في قصعة كبيرة، اخلط بيديك الأرز والدجاج والكبدة والأعشاب والحمص المطهو والطماطم المعجونة وكل التوابل والملح والزيت حتى تتغطّى كل حبة.',
      },
      {
        step_number: 4,
        instruction_fr:
          "Placez le mélange dans le haut du couscoussier, posé sur une marmite d'eau bouillante, et soudez la jonction avec un ruban de pâte farine-eau ou un torchon humide.",
        instruction_derja:
          '7ott el khalta fel kaskas fo9 tanjra ma yghli, w sakker bin el zouz b 3jina mta3 faryna w ma walla b fouta mbalal.',
        instruction_ar:
          'ضع الخليط في أعلى الكسكاس فوق قدر ماء مغلي، وأحكم الفراغ بينهما بشريط من عجين الفارينة والماء أو بمنشفة مبللة.',
      },
      {
        step_number: 5,
        instruction_fr:
          'Faites cuire à la vapeur 50 à 60 minutes, en retournant le riz délicatement à mi-cuisson : il est prêt lorsque les grains sont tendres et brillants. Servez avec une salade méchouia ou des citrons.',
        instruction_derja:
          'Khallih yfawer 50 l 60 d9i9a, w 9allbou b chwaya f nos el wa9t: yetayyeb ki el 7abba trattab w tlamma3. Sarbih m3a slata mechwiya walla 9ares.',
        instruction_ar:
          'اطهه على البخار من 50 إلى 60 دقيقة مع تقليبه بلطف في منتصف الوقت، وينضج عندما تلين الحبوب وتلمع، ثم قدّمه مع سلطة مشوية أو الليمون.',
      },
    ],
    chef_tip: {
      fr: 'Ne couvrez jamais le couscoussier pendant la cuisson du riz djerbien : la vapeur doit traverser librement, sinon le dessus reste cru et le fond devient collant.',
      derja:
        'Ma tghattich el kaskas w el rouz jerbi yetayyeb: el bokhar lezem yet3adda bel ra7a, w ella el fo9 yob9a nay w el louta tetle99e9.',
      ar: 'لا تغطِّ الكسكاس أثناء طهي الروز الجربي، فالبخار يجب أن يمر بحرية وإلا بقي الأعلى نيئاً وأصبح الأسفل لزجاً.',
    },
    is_published: true,
    is_healthy: true,
  },
  {
    id: 'rec_tn_16_riz_djerbien_aux_fruits_de_m',
    slug: 'riz-djerbien-aux-fruits-de-mer',
    name_fr: 'Riz djerbien aux fruits de mer',
    name_derja: 'Rouz jerbi bel 7out wel 9ambri',
    name_ar: 'روز جربي بثمار البحر',
    description_fr:
      'La version côtière du riz de Djerba : crevettes et poisson en dés cuits à la vapeur avec le riz, les herbes et les épices, pour un plat parfumé et léger.',
    description_derja:
      'El rouz el jerbi mta3 el b7ar: 9ambri w 7out m9assas yfawrou m3a el rouz, el 7chaych wel fowye7, makla fiha ri7a w khfifa.',
    description_ar:
      'النسخة البحرية من الروز الجربي: قمبري وسمك مقطّع يُطهيان على البخار مع الأرز والأعشاب والتوابل، طبق معطّر وخفيف.',
    image_url: '',
    prep_time_minutes: 30,
    cook_time_minutes: 55,
    base_servings: 4,
    estimated_cost_tnd: 23,
    category: 'plat_principal',
    cuisine_type: 'traditionnelle',
    difficulty: 'moyen',
    ingredients: [
      { ingredient_id: 'ing_riz', quantity_base: 400, unit: 'g', role: 'key' },
      { ingredient_id: 'ing_crevettes', quantity_base: 300, unit: 'g', role: 'key' },
      { ingredient_id: 'ing_poisson_frais', quantity_base: 400, unit: 'g', role: 'key' },
      { ingredient_id: 'ing_persil', quantity_base: 1, unit: 'botte', role: 'secondary' },
      { ingredient_id: 'ing_coriandre', quantity_base: 0.5, unit: 'botte', role: 'secondary' },
      {
        ingredient_id: 'ing_blette',
        quantity_base: 0.5,
        unit: 'botte',
        role: 'secondary',
        substitutes: ['ing_epinards'],
      },
      { ingredient_id: 'ing_oignon', quantity_base: 1, unit: 'pièce', role: 'secondary' },
      { ingredient_id: 'ing_citron', quantity_base: 1, unit: 'pièce', role: 'secondary' },
      { ingredient_id: 'ing_tomate_concentree', quantity_base: 2, unit: 'c.à.s', role: 'staple' },
      { ingredient_id: 'ing_ail', quantity_base: 3, unit: 'gousses', role: 'staple' },
      { ingredient_id: 'ing_curcuma', quantity_base: 1, unit: 'c.à.c', role: 'staple' },
      { ingredient_id: 'ing_tabel_karwiya', quantity_base: 1, unit: 'c.à.c', role: 'staple' },
      { ingredient_id: 'ing_piment_moulu', quantity_base: 1, unit: 'c.à.c', role: 'staple' },
      { ingredient_id: 'ing_huile_olive', quantity_base: 6, unit: 'c.à.s', role: 'staple' },
      { ingredient_id: 'ing_sel_poivre', quantity_base: 1, unit: 'pincée', role: 'staple' },
    ],
    steps: [
      {
        step_number: 1,
        instruction_fr:
          'Rincez le riz plusieurs fois et égouttez-le. Décortiquez les crevettes, retirez la peau et les arêtes du poisson et coupez-le en cubes de 2 cm ; arrosez le tout de jus de citron.',
        instruction_derja:
          'Ghsel el rouz barcha marrat w saffih. 9achar el 9ambri, na77i el jeld wel 7assek mel 7out w 9oss-ou ka3bet 2 cm, w rouch 3lihom 3asret 9ares.',
        instruction_ar:
          'اغسل الأرز عدة مرات وصفّه. قشّر القمبري وانزع الجلد والشوك من السمك وقطّعه مكعبات بحجم سنتيمترين، ثم رشّ عليها عصير الليمون.',
      },
      {
        step_number: 2,
        instruction_fr:
          "Hachez finement l'oignon, l'ail, le persil, la coriandre et les blettes, puis mélangez-les au riz avec la tomate concentrée, les épices, le sel et l'huile.",
        instruction_derja:
          '9oss rgi9 el bsal, el thoum, el ma3dnous, el kosbor el akhdhar wel sel9, w khallathom m3a el rouz, tmatem ma3jouna, el fowye7, el mel7 wel zit.',
        instruction_ar:
          'افرم البصل والثوم والبقدونس والقصبر الأخضر والسلق ناعماً، واخلطها مع الأرز والطماطم المعجونة والتوابل والملح والزيت.',
      },
      {
        step_number: 3,
        instruction_fr:
          "Placez le riz assaisonné seul dans le haut du couscoussier et faites-le cuire 30 minutes à la vapeur au-dessus d'une eau bien bouillante.",
        instruction_derja: '7ott el rouz mfawwa7 wa7dou fel kaskas w khallih yfawer 30 d9i9a fo9 ma yghli b 9owwa.',
        instruction_ar: 'ضع الأرز المتبّل وحده في أعلى الكسكاس واطهه على البخار ثلاثين دقيقة فوق ماء يغلي بقوة.',
      },
      {
        step_number: 4,
        instruction_fr:
          "Videz le riz dans un grand plat, incorporez délicatement le poisson et les crevettes, puis remettez le tout sur la vapeur 20 à 25 minutes, jusqu'à ce que les crevettes soient roses et le poisson opaque.",
        instruction_derja:
          'Fragh el rouz f 9as3a, zid el 7out wel 9ambri b lotf, w raja3 el kol lel kaskas 20 l 25 d9i9a 7atta el 9ambri ywalli wardi wel 7out abyedh.',
        instruction_ar:
          'أفرغ الأرز في قصعة وأضف السمك والقمبري بلطف، ثم أعد الكل إلى الكسكاس من 20 إلى 25 دقيقة حتى يصبح القمبري وردياً والسمك أبيض اللون.',
      },
      {
        step_number: 5,
        instruction_fr: "Servez chaud, arrosé d'un filet d'huile d'olive crue et accompagné de quartiers de citron.",
        instruction_derja: 'Sarbih skhoun b 9tar zit zitouna nay w 9ta3 9ares 3al jnab.',
        instruction_ar: 'قدّمه ساخناً مع خيط من زيت الزيتون النيء وقطع الليمون إلى جانبه.',
      },
    ],
    chef_tip: {
      fr: 'Ajoutez toujours les fruits de mer en seconde partie de cuisson : cuits une heure, crevettes et poisson deviendraient secs et caoutchouteux.',
      derja:
        'Zid el 9ambri wel 7out dima fel nos el theni mel tabkha: ken yetayybou sa3a kemla ynachfou w ywalliw kif el kaoutchou.',
      ar: 'أضف ثمار البحر دائماً في النصف الثاني من الطهي، فلو طُهي القمبري والسمك ساعة كاملة لجفّا وأصبحا مطاطيين.',
    },
    is_published: true,
    is_healthy: true,
  },
  {
    id: 'rec_tn_17_couscous_au_poisson',
    slug: 'couscous-au-poisson',
    name_fr: 'Couscous au poisson',
    name_derja: 'Kosksi bel 7out',
    name_ar: 'كسكسي بالحوت',
    description_fr:
      "Le couscous des villes côtières comme Sfax et Mahdia : une semoule fine arrosée d'un bouillon rouge épicé où le poisson cuit doucement avec les légumes.",
    description_derja:
      'Kosksi el mdon el b7arya kima Sfax w el Mahdia: kosksi rgi9 msa99a b mar9a 7amra 7arra yetayyeb fiha el 7out b chwaya m3a el khodhra.',
    description_ar:
      'كسكسي المدن الساحلية كصفاقس والمهدية: كسكسي رقيق مسقي بمرق أحمر حار يُطهى فيه السمك بهدوء مع الخضار.',
    image_url: '',
    prep_time_minutes: 30,
    cook_time_minutes: 75,
    base_servings: 4,
    estimated_cost_tnd: 25,
    category: 'plat_principal',
    cuisine_type: 'traditionnelle',
    difficulty: 'avance',
    ingredients: [
      { ingredient_id: 'ing_semoule_couscous', quantity_base: 500, unit: 'g', role: 'key' },
      { ingredient_id: 'ing_poisson_frais', quantity_base: 800, unit: 'g', role: 'key' },
      { ingredient_id: 'ing_pomme_de_terre', quantity_base: 3, unit: 'pièces', role: 'secondary' },
      { ingredient_id: 'ing_carotte', quantity_base: 2, unit: 'pièces', role: 'secondary' },
      {
        ingredient_id: 'ing_piment',
        quantity_base: 4,
        unit: 'pièces',
        role: 'secondary',
        substitutes: ['ing_poivron'],
      },
      { ingredient_id: 'ing_potiron', quantity_base: 300, unit: 'g', is_optional: true, role: 'secondary' },
      { ingredient_id: 'ing_oignon', quantity_base: 1, unit: 'pièce', role: 'secondary' },
      { ingredient_id: 'ing_tomate', quantity_base: 2, unit: 'pièces', role: 'secondary' },
      { ingredient_id: 'ing_citron', quantity_base: 1, unit: 'pièce', role: 'secondary' },
      { ingredient_id: 'ing_tomate_concentree', quantity_base: 3, unit: 'c.à.s', role: 'staple' },
      { ingredient_id: 'ing_harissa', quantity_base: 1, unit: 'c.à.s', role: 'staple' },
      { ingredient_id: 'ing_ail', quantity_base: 5, unit: 'gousses', role: 'staple' },
      { ingredient_id: 'ing_tabel_karwiya', quantity_base: 2, unit: 'c.à.c', role: 'staple' },
      { ingredient_id: 'ing_curcuma', quantity_base: 1, unit: 'c.à.c', role: 'staple' },
      { ingredient_id: 'ing_huile_olive', quantity_base: 6, unit: 'c.à.s', role: 'staple' },
      { ingredient_id: 'ing_sel_poivre', quantity_base: 1, unit: 'pincée', role: 'staple' },
    ],
    steps: [
      {
        step_number: 1,
        instruction_fr:
          "Coupez le poisson en tranches épaisses et faites-le mariner 30 minutes avec la moitié de l'ail pilé, 1 c.à.c de tabel-karwiya, le jus du citron et du sel.",
        instruction_derja:
          '9oss el 7out tranchet ghlidha w khallih yetchermel 30 d9i9a m3a nos el thoum, mgharfa sghira tabel w karwiya, 3asret 9ares w mel7.',
        instruction_ar:
          'قطّع السمك شرائح سميكة واتركه ينقع ثلاثين دقيقة مع نصف الثوم المدقوق وملعقة صغيرة من التابل والكروية وعصير الليمون والملح.',
      },
      {
        step_number: 2,
        instruction_fr:
          "Dans le bas du couscoussier, faites revenir l'oignon râpé dans l'huile 4 minutes, ajoutez le reste de l'ail, la tomate concentrée, l'harissa, les épices et les tomates râpées ; laissez compoter 5 minutes.",
        instruction_derja:
          'Fi 9a3 el kaskas, 9alli el bsal el m7akek fel zit 4 d9aye9, zid ba9iet el thoum, tmatem ma3jouna, hrisa, el fowye7 wel tmatem el m7akka, w khalliha tet9alla 5 d9aye9.',
        instruction_ar:
          'في أسفل الكسكاس، حمّر البصل المبشور في الزيت أربع دقائق، ثم أضف بقية الثوم والطماطم المعجونة والهريسة والتوابل والطماطم المبشورة، واتركها تتقلّى خمس دقائق.',
      },
      {
        step_number: 3,
        instruction_fr:
          "Versez 2 L d'eau chaude, ajoutez les carottes coupées en deux et portez à ébullition. Pendant ce temps, humectez la semoule avec un verre d'eau salée et 2 c.à.s d'huile, roulez-la entre les paumes et mettez-la à cuire 25 minutes à la vapeur au-dessus du bouillon.",
        instruction_derja:
          'Marra9 b 2 litro ma skhoun, zid el sfennerya m9assma 3la thnin w khalliha teghli. Fi nafs el wa9t, bakhbakh el kosksi b kes ma bel mel7 w 2 mgharef zit, ferrkou bin yeddik w 7ottou yfawer 25 d9i9a fo9 el mar9a.',
        instruction_ar:
          'أضف لترين من الماء الساخن والجزر المقسوم نصفين واتركه يغلي. وفي الأثناء، رطّب الكسكسي بكأس من الماء المملّح وملعقتي زيت، وافركه بين راحتيك وضعه على البخار فوق المرق خمساً وعشرين دقيقة.',
      },
      {
        step_number: 4,
        instruction_fr:
          "Videz la semoule, aérez-la avec un demi-verre d'eau froide pour défaire les grumeaux, puis remettez-la 20 minutes sur la vapeur. En même temps, ajoutez au bouillon les pommes de terre, le potiron et les piments.",
        instruction_derja:
          'Fragh el kosksi, ferrkou b nos kes ma bered bech yetfakk, w raja3ou yfawer 20 d9i9a. Fi nafs el wa9t zid lel mar9a el batata, el 9ra3 a7mar wel felfel.',
        instruction_ar:
          'أفرغ الكسكسي وفكّكه بنصف كأس من الماء البارد، ثم أعده على البخار عشرين دقيقة، وأضف في الوقت نفسه البطاطا والقرع الأحمر والفلفل إلى المرق.',
      },
      {
        step_number: 5,
        instruction_fr:
          "Plongez les tranches de poisson dans le bouillon frémissant pour 12 à 15 minutes seulement, sans remuer, jusqu'à ce que la chair s'effeuille.",
        instruction_derja:
          'Ghattes trancheet el 7out fel mar9a w hiya teghli b chwaya 12 l 15 d9i9a bark, bla ma t7arrek, 7atta el l7am yetfasakh.',
        instruction_ar: 'اغمر شرائح السمك في المرق الذي يغلي بهدوء من 12 إلى 15 دقيقة فقط دون تحريك، حتى يتفتّت لحمها.',
      },
      {
        step_number: 6,
        instruction_fr:
          'Arrosez la semoule de bouillon louche après louche, laissez-la gonfler 10 minutes couverte, puis dressez avec les légumes et le poisson par-dessus.',
        instruction_derja:
          'As9i el kosksi bel mar9a mgharfa b mgharfa, ghattih w khallih yentfekh 10 d9aye9, w ba3d sarbih bel khodhra wel 7out mel fo9.',
        instruction_ar: 'اسقِ الكسكسي بالمرق مغرفة بمغرفة، وغطّه ليتنفّخ عشر دقائق، ثم قدّمه مع الخضار والسمك فوقه.',
      },
    ],
    chef_tip: {
      fr: "Retirez délicatement le poisson du bouillon avant d'arroser la semoule et reposez-le au dernier moment : il restera en belles tranches au lieu de s'émietter.",
      derja:
        'Na77i el 7out mel mar9a b lotf 9bal ma tos9i el kosksi w raja3ou fel lekher: yob9a tranchet mezyena w ma yetfattetch.',
      ar: 'ارفع السمك من المرق بلطف قبل سقي الكسكسي وأعده في الأخير، فيبقى شرائح جميلة بدل أن يتفتّت.',
    },
    is_published: true,
    is_healthy: true,
  },
  {
    id: 'rec_tn_18_couscous_aux_legumes',
    slug: 'couscous-aux-legumes',
    name_fr: 'Couscous aux légumes',
    name_derja: 'Kosksi bel khodhra',
    name_ar: 'كسكسي بالخضرة',
    description_fr:
      "Un couscous généreux et sans viande, où la semoule s'imbibe d'une sauce rouge chargée de pois chiches, potiron, navets, courgettes et carottes.",
    description_derja:
      'Kosksi kerim bla l7am, yochrob salsa 7amra m3abbya bel 7oms, el 9ra3 a7mar, el left, el 9ra3 akhdhar wel sfennerya.',
    description_ar:
      'كسكسي سخي بلا لحم، تتشرّب فيه الحبوب صلصة حمراء غنية بالحمص والقرع الأحمر واللفت والقرع الأخضر والجزر.',
    image_url: '',
    prep_time_minutes: 25,
    cook_time_minutes: 70,
    base_servings: 4,
    estimated_cost_tnd: 11,
    category: 'plat_principal',
    cuisine_type: 'vegetarienne',
    difficulty: 'moyen',
    ingredients: [
      { ingredient_id: 'ing_semoule_couscous', quantity_base: 500, unit: 'g', role: 'key' },
      { ingredient_id: 'ing_pois_chiches', quantity_base: 150, unit: 'g', role: 'secondary' },
      { ingredient_id: 'ing_carotte', quantity_base: 3, unit: 'pièces', role: 'secondary' },
      { ingredient_id: 'ing_courgette', quantity_base: 2, unit: 'pièces', role: 'secondary' },
      { ingredient_id: 'ing_potiron', quantity_base: 400, unit: 'g', role: 'secondary' },
      { ingredient_id: 'ing_navet', quantity_base: 300, unit: 'g', role: 'secondary' },
      { ingredient_id: 'ing_pomme_de_terre', quantity_base: 2, unit: 'pièces', role: 'secondary' },
      {
        ingredient_id: 'ing_piment',
        quantity_base: 3,
        unit: 'pièces',
        role: 'secondary',
        substitutes: ['ing_poivron'],
      },
      { ingredient_id: 'ing_oignon', quantity_base: 1, unit: 'pièce', role: 'secondary' },
      { ingredient_id: 'ing_tomate_concentree', quantity_base: 3, unit: 'c.à.s', role: 'staple' },
      { ingredient_id: 'ing_harissa', quantity_base: 1, unit: 'c.à.s', role: 'staple' },
      { ingredient_id: 'ing_ail', quantity_base: 3, unit: 'gousses', role: 'staple' },
      { ingredient_id: 'ing_tabel_karwiya', quantity_base: 1, unit: 'c.à.c', role: 'staple' },
      { ingredient_id: 'ing_curcuma', quantity_base: 1, unit: 'c.à.c', role: 'staple' },
      { ingredient_id: 'ing_huile_olive', quantity_base: 6, unit: 'c.à.s', role: 'staple' },
      { ingredient_id: 'ing_sel_poivre', quantity_base: 1, unit: 'pincée', role: 'staple' },
    ],
    steps: [
      {
        step_number: 1,
        instruction_fr:
          'La veille, mettez les pois chiches à tremper. Le jour même, épluchez les légumes et coupez-les en gros tronçons : carottes et navets en deux, courgettes en trois, potiron en morceaux de 5 cm.',
        instruction_derja:
          'Mel lila ban9a3 el 7oms. Nhar el tabkha, 9achar el khodhra w 9oss-ha morsewet kbar: el sfennerya wel left 3la thnin, el 9ra3 akhdhar 3la tlatha wel 9ra3 a7mar 9ta3 5 cm.',
        instruction_ar:
          'انقع الحمص من الليلة السابقة. ويوم الطهي، قشّر الخضار وقطّعها قطعاً كبيرة: الجزر واللفت نصفين والقرع الأخضر ثلاثاً والقرع الأحمر قطعاً بحجم خمسة سنتيمترات.',
      },
      {
        step_number: 2,
        instruction_fr:
          "Faites revenir l'oignon haché dans l'huile, ajoutez l'ail, la tomate concentrée, l'harissa, le curcuma et le tabel-karwiya ; versez 2 L d'eau chaude avec les pois chiches, les carottes et les navets, et faites bouillir 25 minutes.",
        instruction_derja:
          '9alli el bsal fel zit, zid el thoum, tmatem ma3jouna, hrisa, korkom w tabel w karwiya; marra9 b 2 litro ma skhoun m3a el 7oms, el sfennerya wel left w khalliha teghli 25 d9i9a.',
        instruction_ar:
          'حمّر البصل المفروم في الزيت، ثم أضف الثوم والطماطم المعجونة والهريسة والكركم والتابل والكروية، وأضف لترين من الماء الساخن مع الحمص والجزر واللفت، واتركه يغلي 25 دقيقة.',
      },
      {
        step_number: 3,
        instruction_fr:
          "Huilez la semoule, mouillez-la d'un verre d'eau salée en frottant entre vos mains, puis posez-la sur la marmite pour une première vapeur de 25 minutes, à compter de l'apparition de la vapeur à la surface.",
        instruction_derja:
          'Zayyet el kosksi, bakhbakhou b kes ma bel mel7 w ferrkou bin yeddik, w 7ottou fo9 el tanjra yfawer 25 d9i9a men wa9t ma yetla3 el bokhar mel fo9.',
        instruction_ar:
          'ادهن الكسكسي بالزيت ورطّبه بكأس من الماء المملّح مع الفرك بين يديك، ثم ضعه فوق القدر لبخار أول مدته 25 دقيقة تُحسب من ظهور البخار على السطح.',
      },
      {
        step_number: 4,
        instruction_fr:
          'Égrenez la semoule, puis ajoutez au bouillon les pommes de terre, le potiron, les courgettes et les piments. Remettez la semoule pour 20 minutes de vapeur supplémentaires.',
        instruction_derja:
          'Farrak el kosksi, w zid lel mar9a el batata, el 9ra3 a7mar, el 9ra3 akhdhar wel felfel. Raja3 el kosksi yfawer 20 d9i9a o5ra.',
        instruction_ar:
          'فكّك الكسكسي، ثم أضف إلى المرق البطاطا والقرع الأحمر والقرع الأخضر والفلفل، وأعد الكسكسي على البخار عشرين دقيقة إضافية.',
      },
      {
        step_number: 5,
        instruction_fr:
          "Arrosez la semoule de sauce bien chaude jusqu'à ce qu'elle soit humide mais pas détrempée, couvrez 10 minutes, puis disposez joliment les légumes et les pois chiches en couronne.",
        instruction_derja:
          'As9i el kosksi bel salsa skhouna 7atta yweli mbalal ama mouch ghar9an, ghattih 10 d9aye9 w ba3d saff el khodhra wel 7oms dourou b tsawer.',
        instruction_ar:
          'اسقِ الكسكسي بالصلصة الساخنة حتى يصبح رطباً دون أن يغرق، وغطّه عشر دقائق، ثم رتّب الخضار والحمص حوله بشكل جميل.',
      },
    ],
    chef_tip: {
      fr: 'Ajoutez le potiron et les courgettes en dernier : ils cuisent deux fois plus vite que les carottes et les navets, et se défont sinon dans la sauce.',
      derja:
        'Zid el 9ra3 a7mar wel 9ra3 akhdhar fel lekher: yetayybou fisa3 9add marrtin 3al sfennerya wel left, w ella yetfaskhou fel salsa.',
      ar: 'أضف القرع الأحمر والقرع الأخضر في الأخير، لأنهما ينضجان أسرع بمرتين من الجزر واللفت وإلا تفتّتا في الصلصة.',
    },
    is_published: true,
    is_healthy: true,
  },
  {
    id: 'rec_tn_19_couscous_au_poulet',
    slug: 'couscous-au-poulet',
    name_fr: 'Couscous au poulet',
    name_derja: 'Kosksi bel djej',
    name_ar: 'كسكسي بالدجاج',
    description_fr:
      'Le couscous familial du vendredi : du poulet doré et mijoté dans une sauce rouge aux pois chiches et légumes, servi sur une semoule légère cuite deux fois à la vapeur.',
    description_derja:
      'Kosksi el 3ayla nhar el jem3a: djej m7ammer yetayyeb f salsa 7amra bel 7oms wel khodhra, fo9 kosksi khfif yfawer marrtin.',
    description_ar:
      'كسكسي العائلة يوم الجمعة: دجاج محمّر مطهو في صلصة حمراء بالحمص والخضار، فوق كسكسي خفيف مطهو على البخار مرتين.',
    image_url: '',
    prep_time_minutes: 25,
    cook_time_minutes: 75,
    base_servings: 4,
    estimated_cost_tnd: 19,
    category: 'plat_principal',
    cuisine_type: 'familiale',
    difficulty: 'moyen',
    ingredients: [
      { ingredient_id: 'ing_semoule_couscous', quantity_base: 500, unit: 'g', role: 'key' },
      { ingredient_id: 'ing_poulet', quantity_base: 1, unit: 'kg', role: 'key' },
      { ingredient_id: 'ing_pois_chiches', quantity_base: 100, unit: 'g', role: 'secondary' },
      { ingredient_id: 'ing_carotte', quantity_base: 2, unit: 'pièces', role: 'secondary' },
      { ingredient_id: 'ing_pomme_de_terre', quantity_base: 3, unit: 'pièces', role: 'secondary' },
      { ingredient_id: 'ing_courgette', quantity_base: 2, unit: 'pièces', role: 'secondary' },
      { ingredient_id: 'ing_navet', quantity_base: 1, unit: 'pièce', is_optional: true, role: 'secondary' },
      {
        ingredient_id: 'ing_piment',
        quantity_base: 4,
        unit: 'pièces',
        role: 'secondary',
        substitutes: ['ing_poivron'],
      },
      { ingredient_id: 'ing_oignon', quantity_base: 1, unit: 'pièce', role: 'secondary' },
      { ingredient_id: 'ing_tomate_concentree', quantity_base: 3, unit: 'c.à.s', role: 'staple' },
      { ingredient_id: 'ing_harissa', quantity_base: 1, unit: 'c.à.s', role: 'staple' },
      { ingredient_id: 'ing_ail', quantity_base: 4, unit: 'gousses', role: 'staple' },
      { ingredient_id: 'ing_tabel_karwiya', quantity_base: 1, unit: 'c.à.c', role: 'staple' },
      { ingredient_id: 'ing_curcuma', quantity_base: 1, unit: 'c.à.c', role: 'staple' },
      { ingredient_id: 'ing_piment_moulu', quantity_base: 1, unit: 'c.à.c', role: 'staple' },
      { ingredient_id: 'ing_huile_olive', quantity_base: 6, unit: 'c.à.s', role: 'staple' },
      { ingredient_id: 'ing_sel_poivre', quantity_base: 1, unit: 'pincée', role: 'staple' },
    ],
    steps: [
      {
        step_number: 1,
        instruction_fr:
          "Découpez le poulet en 8 morceaux et faites-le dorer 8 minutes dans l'huile au fond du couscoussier avec l'oignon haché, en le retournant pour colorer chaque face.",
        instruction_derja:
          '9oss el djej 8 9ta3 w 7ammrou 8 d9aye9 fel zit fi 9a3 el kaskas m3a el bsal el m9assas, w 9allbou bech kol jiha te7mar.',
        instruction_ar:
          'قطّع الدجاج ثماني قطع وحمّره ثماني دقائق في الزيت في أسفل الكسكاس مع البصل المفروم، مع تقليبه ليتحمّر من كل الجهات.',
      },
      {
        step_number: 2,
        instruction_fr:
          "Ajoutez l'ail pilé, la tomate concentrée, l'harissa et toutes les épices, faites revenir 3 minutes, puis mouillez avec 2 L d'eau chaude et ajoutez les pois chiches trempés et les carottes.",
        instruction_derja:
          'Zid el thoum el mad9ou9, tmatem ma3jouna, hrisa wel fowye7 el kol, 9alli 3 d9aye9, w marra9 b 2 litro ma skhoun w zid el 7oms mban9a3 wel sfennerya.',
        instruction_ar:
          'أضف الثوم المدقوق والطماطم المعجونة والهريسة وكل التوابل وقلّب ثلاث دقائق، ثم أضف لترين من الماء الساخن مع الحمص المنقوع والجزر.',
      },
      {
        step_number: 3,
        instruction_fr:
          "Préparez la semoule : arrosez-la de 2 c.à.s d'huile et d'un verre d'eau salée, travaillez-la du bout des doigts pour séparer les grains et faites une première vapeur de 25 minutes au-dessus du bouillon.",
        instruction_derja:
          '7adhher el kosksi: rouch 3lih 2 mgharef zit w kes ma bel mel7, ferrkou b rous swab3ek bech el 7abb yetfar9, w khallih yfawer marra loula 25 d9i9a fo9 el mar9a.',
        instruction_ar:
          'حضّر الكسكسي: رشّ عليه ملعقتي زيت وكأساً من الماء المملّح، وافركه بأطراف أصابعك لتنفصل الحبات، ثم اطهه على البخار مرة أولى 25 دقيقة فوق المرق.',
      },
      {
        step_number: 4,
        instruction_fr:
          "Videz la semoule, aérez-la avec un peu d'eau froide, ajoutez au bouillon les pommes de terre, les courgettes, le navet et les piments, puis remettez la semoule 20 minutes sur la vapeur.",
        instruction_derja:
          'Fragh el kosksi, ferrkou b chwaya ma bered, zid lel mar9a el batata, el 9ra3 akhdhar, el left wel felfel, w raja3 el kosksi yfawer 20 d9i9a.',
        instruction_ar:
          'أفرغ الكسكسي وفكّكه بقليل من الماء البارد، ثم أضف إلى المرق البطاطا والقرع الأخضر واللفت والفلفل، وأعد الكسكسي على البخار عشرين دقيقة.',
      },
      {
        step_number: 5,
        instruction_fr:
          "Mélangez la semoule avec 3 à 4 louches de sauce, couvrez 10 minutes pour qu'elle gonfle, puis présentez-la en dôme, coiffée du poulet, des légumes et des piments.",
        instruction_derja:
          'Khallat el kosksi b 3 l 4 mghaaref salsa, ghattih 10 d9aye9 bech yentfekh, w sarbih 9obba w fo9ha el djej, el khodhra wel felfel.',
        instruction_ar:
          'اخلط الكسكسي بثلاث إلى أربع مغارف من الصلصة، وغطّه عشر دقائق ليتنفّخ، ثم قدّمه على شكل قبّة يعلوها الدجاج والخضار والفلفل.',
      },
    ],
    chef_tip: {
      fr: "Pour un couscous bien rouge et brillant, laissez la tomate concentrée et l'harissa frire dans l'huile jusqu'à ce qu'elles foncent avant d'ajouter l'eau.",
      derja:
        'Bech ykoun el kosksi a7mar w ylamma3, khalli tmatem ma3jouna wel hrisa yet9allaw fel zit 7atta yghma9ou 9bal ma tzid el ma.',
      ar: 'ليكون الكسكسي أحمر لامعاً، اترك الطماطم المعجونة والهريسة تتقلّيان في الزيت حتى يغمق لونهما قبل إضافة الماء.',
    },
    is_published: true,
    is_healthy: false,
  },
  {
    id: 'rec_tn_20_ragout_de_haricots_blancs',
    slug: 'ragout-de-haricots-blancs-au-boeuf',
    name_fr: 'Ragoût de haricots blancs au bœuf',
    name_derja: 'Mar9et loubia',
    name_ar: 'مرقة اللوبيا',
    description_fr:
      "Des haricots blancs fondants mijotés avec du bœuf dans une sauce rouge à l'ail et au paprika : le plat d'hiver qui réchauffe toute la maison.",
    description_derja:
      'Loubia bidha rteba tetayyeb m3a l7am bagri f salsa 7amra bel thoum wel felfel el 7lou: makla mta3 chta tsakhan el dar el kol.',
    description_ar: 'لوبيا بيضاء طرية مطهوة مع لحم البقر في صلصة حمراء بالثوم والفلفل الحلو: طبق شتوي يدفئ البيت كله.',
    image_url: '',
    prep_time_minutes: 15,
    cook_time_minutes: 110,
    base_servings: 4,
    estimated_cost_tnd: 21,
    category: 'plat_principal',
    cuisine_type: 'traditionnelle',
    difficulty: 'facile',
    ingredients: [
      { ingredient_id: 'ing_haricots', quantity_base: 400, unit: 'g', role: 'key' },
      { ingredient_id: 'ing_boeuf', quantity_base: 400, unit: 'g', role: 'key', substitutes: ['ing_agneau'] },
      { ingredient_id: 'ing_oignon', quantity_base: 1, unit: 'pièce', role: 'secondary' },
      { ingredient_id: 'ing_piment', quantity_base: 2, unit: 'pièces', is_optional: true, role: 'secondary' },
      { ingredient_id: 'ing_persil', quantity_base: 0.25, unit: 'botte', is_optional: true, role: 'secondary' },
      { ingredient_id: 'ing_tomate_concentree', quantity_base: 2, unit: 'c.à.s', role: 'staple' },
      { ingredient_id: 'ing_harissa', quantity_base: 1, unit: 'c.à.c', role: 'staple' },
      { ingredient_id: 'ing_ail', quantity_base: 4, unit: 'gousses', role: 'staple' },
      { ingredient_id: 'ing_paprika', quantity_base: 1, unit: 'c.à.c', role: 'staple' },
      { ingredient_id: 'ing_tabel_karwiya', quantity_base: 1, unit: 'c.à.c', role: 'staple' },
      { ingredient_id: 'ing_curcuma', quantity_base: 0.5, unit: 'c.à.c', role: 'staple' },
      { ingredient_id: 'ing_huile_olive', quantity_base: 4, unit: 'c.à.s', role: 'staple' },
      { ingredient_id: 'ing_sel_poivre', quantity_base: 1, unit: 'pincée', role: 'staple' },
    ],
    steps: [
      {
        step_number: 1,
        instruction_fr:
          "La veille, faites tremper les haricots blancs 12 heures dans trois fois leur volume d'eau froide. Le jour même, égouttez-les et rincez-les.",
        instruction_derja:
          'Mel lila, ban9a3 el loubia 12 sa3a f tlatha marrat 9addha ma bered. Nhar el tabkha, saffiha w ghselha.',
        instruction_ar:
          'انقع اللوبيا البيضاء اثنتي عشرة ساعة في ثلاثة أضعاف حجمها من الماء البارد من الليلة السابقة، ثم صفّها واغسلها يوم الطهي.',
      },
      {
        step_number: 2,
        instruction_fr:
          "Faites revenir le bœuf en cubes avec l'oignon haché dans l'huile 6 minutes, puis ajoutez l'ail pilé, la tomate concentrée, l'harissa, le paprika, le curcuma et le tabel-karwiya ; remuez 2 minutes.",
        instruction_derja:
          '9alli el l7am ka3bet m3a el bsal el m9assas fel zit 6 d9aye9, w zid el thoum el mad9ou9, tmatem ma3jouna, hrisa, felfel 7lou, korkom w tabel w karwiya, w 7arrek d9i9tin.',
        instruction_ar:
          'حمّر مكعبات لحم البقر مع البصل المفروم في الزيت ست دقائق، ثم أضف الثوم المدقوق والطماطم المعجونة والهريسة والفلفل الحلو والكركم والتابل والكروية، وقلّب دقيقتين.',
      },
      {
        step_number: 3,
        instruction_fr:
          "Ajoutez les haricots et 1,5 L d'eau chaude, sans saler. Couvrez et laissez mijoter 1 h 30 à feu doux, jusqu'à ce que les haricots s'écrasent facilement entre deux doigts.",
        instruction_derja:
          'Zid el loubia w litro w nos ma skhoun bla mel7. Ghatti w khalliha teghli sa3a w nos 3la nar hadya 7atta el loubia tetfarres bin zouz swab3.',
        instruction_ar:
          'أضف اللوبيا ولتراً ونصف لتر من الماء الساخن دون ملح، وغطِّ واتركها على نار هادئة ساعة ونصفاً حتى تنهرس حبة اللوبيا بين إصبعين.',
      },
      {
        step_number: 4,
        instruction_fr:
          "Salez seulement maintenant, ajoutez les piments entiers et laissez réduire 15 minutes à découvert jusqu'à obtenir une sauce onctueuse.",
        instruction_derja:
          'Tawa ken mallah, zid el felfel kemel w khalliha tenkos 15 d9i9a bla ghta 7atta el mar9a t9atter.',
        instruction_ar: 'ملّح الآن فقط، وأضف الفلفل الكامل واترك المرقة تنقص ربع ساعة دون غطاء حتى تصبح الصلصة كثيفة.',
      },
      {
        step_number: 5,
        instruction_fr: 'Parsemez de persil haché et servez bien chaud avec du pain et quelques olives.',
        instruction_derja: 'Rouch ma3dnous m9assas w sarbiha skhouna barcha m3a el khobz w chwaya zaytoun.',
        instruction_ar: 'رشّ البقدونس المفروم وقدّمها ساخنة جداً مع الخبز وقليل من الزيتون.',
      },
    ],
    chef_tip: {
      fr: 'Ne salez jamais les haricots en début de cuisson : le sel durcit leur peau et ils peuvent rester fermes même après deux heures sur le feu.',
      derja:
        'Ma tmalla7ch el loubia fi bdeyet el tabkha: el mel7 y9assi 9echrt-ha w tnajjem tob9a 7archa 7atta ba3d sa3tin 3al nar.',
      ar: 'لا تملّح اللوبيا في بداية الطهي، فالملح يقسّي قشرتها وقد تبقى صلبة حتى بعد ساعتين على النار.',
    },
    is_published: true,
    is_healthy: true,
  },
  {
    id: 'rec_tn_21_loubia_aux_merguez',
    slug: 'loubia-aux-merguez',
    name_fr: 'Loubia aux merguez',
    name_derja: 'Loubia bel merguez',
    name_ar: 'لوبيا بالمرقاز',
    description_fr:
      "Des haricots blancs fondants mijotés dans une sauce rouge à l'ail et à l'harissa, relevés par des merguez dorées : le plat d'hiver qui réchauffe toute la maison.",
    description_derja:
      'Loubia bayda tetteyeb 3la mahlha f salsa 7amra bel thoum wel hrisa, m3a merguez m7ammra: makla mta3 chta tsakhan el dar el kol.',
    description_ar:
      'فاصولياء بيضاء طرية مطهوة على مهل في صلصة حمراء بالثوم والهريسة مع مرقاز محمّر، طبق شتوي يدفئ البيت كله.',
    image_url: '',
    prep_time_minutes: 15,
    cook_time_minutes: 80,
    base_servings: 4,
    estimated_cost_tnd: 14,
    category: 'plat_principal',
    cuisine_type: 'familiale',
    difficulty: 'facile',
    ingredients: [
      { ingredient_id: 'ing_haricots', quantity_base: 300, unit: 'g', role: 'key' },
      { ingredient_id: 'ing_merguez', quantity_base: 300, unit: 'g', role: 'key' },
      { ingredient_id: 'ing_tomate_concentree', quantity_base: 2, unit: 'c.à.s', role: 'secondary' },
      { ingredient_id: 'ing_oignon', quantity_base: 1, unit: 'pièce', role: 'secondary' },
      { ingredient_id: 'ing_ail', quantity_base: 4, unit: 'gousses', role: 'staple' },
      { ingredient_id: 'ing_harissa', quantity_base: 1, unit: 'c.à.c', role: 'staple' },
      { ingredient_id: 'ing_tabel_karwiya', quantity_base: 1, unit: 'c.à.c', role: 'staple' },
      { ingredient_id: 'ing_piment_moulu', quantity_base: 1, unit: 'c.à.c', role: 'staple' },
      { ingredient_id: 'ing_huile_olive', quantity_base: 4, unit: 'c.à.s', role: 'staple' },
      { ingredient_id: 'ing_sel_poivre', quantity_base: 1, unit: 'pincée', role: 'staple' },
    ],
    steps: [
      {
        step_number: 1,
        instruction_fr:
          "La veille, faites tremper les haricots dans un grand volume d'eau froide pendant 12 heures, puis égouttez-les et rincez-les.",
        instruction_derja: 'Mel lila, n9a3 el loubia f barcha ma bared moddet 12 sa3a, ba3d safiha w ghsalha.',
        instruction_ar:
          'من الليلة السابقة، انقع الفاصولياء في كمية كبيرة من الماء البارد لمدة 12 ساعة، ثم صفّها واغسلها.',
      },
      {
        step_number: 2,
        instruction_fr:
          "Dans une marmite, faites suer l'oignon râpé dans l'huile 5 minutes, puis ajoutez l'ail écrasé, la tomate concentrée, l'harissa, le tabel-karwiya et le piment moulu avec une louche d'eau ; remuez 2 minutes jusqu'à ce que l'huile remonte.",
        instruction_derja:
          'F tanjra, 9alli el basla m7akka f zit moddet 5 d9aye9, ba3d zid el thoum marfoukh, tmatem ma3jouna, hrisa, tabel w karwiya w felfel zina m3a mgharfa ma; 7arrak 2 d9aye9 7atta yetla3 ez-zit.',
        instruction_ar:
          'في قدر، شوّح البصل المبشور في الزيت 5 دقائق، ثم أضف الثوم المهروس والطماطم المعجونة والهريسة والتابل والكروية والفلفل الأحمر المطحون مع مغرفة ماء، وحرّك دقيقتين حتى يطفو الزيت.',
      },
      {
        step_number: 3,
        instruction_fr:
          "Ajoutez les haricots, couvrez de 1,5 L d'eau, portez à ébullition puis laissez mijoter à couvert et à feu doux 60 minutes, jusqu'à ce qu'un haricot s'écrase facilement entre les doigts.",
        instruction_derja:
          'Zid el loubia, ghattiha b litre w nos ma, khalliha tfawwar w ba3d na99es en-nar w ghatti 60 d9i9a, 7atta el 7abba tetfarrak bin swaba3ek.',
        instruction_ar:
          'أضف الفاصولياء وغطّها بلتر ونصف من الماء، اتركها تغلي ثم اخفض النار وغطّ القدر 60 دقيقة حتى تنهرس الحبة بسهولة بين الأصابع.',
      },
      {
        step_number: 4,
        instruction_fr:
          'Pendant ce temps, saisissez les merguez entières 3 minutes dans une poêle sèche, coupez-les en tronçons de 3 cm et ajoutez-les à la marmite pour les 15 dernières minutes.',
        instruction_derja:
          'Fi wa9t-ha, 7ammar el merguez kemla 3 d9aye9 f me9la bla zit, 9osha morsew 3 cm w zidha lel tanjra f e5er 15 d9i9a.',
        instruction_ar:
          'في الأثناء، حمّر المرقاز كاملاً 3 دقائق في مقلاة بلا زيت، ثم قطّعه قطعاً بطول 3 سنتيمترات وأضفه إلى القدر في آخر 15 دقيقة.',
      },
      {
        step_number: 5,
        instruction_fr:
          "Salez seulement en fin de cuisson et laissez réduire à découvert jusqu'à obtenir une sauce épaisse qui nappe la cuillère ; servez bien chaud avec du pain.",
        instruction_derja:
          'Mallah ken fel e5er w khalliha t9atter mekchoufa 7atta tetla3 salsa ghlidha tlas9 fel mgharfa; 9addemha skhouna m3a el khobz.',
        instruction_ar:
          'أضف الملح في نهاية الطهي فقط، واترك المرق يتكثف دون غطاء حتى تصبح الصلصة كثيفة تكسو الملعقة، وقدّمه ساخناً مع الخبز.',
      },
    ],
    chef_tip: {
      fr: "Ne salez jamais les haricots avant qu'ils soient tendres : le sel durcit leur peau et rallonge la cuisson de moitié.",
      derja: 'Ma tmallah-ch el loubia 9bal ma tetteyeb: el mel7 ye9assi 9echretha w ytawwel et-tayba b noss.',
      ar: 'لا تملّح الفاصولياء قبل أن تنضج، فالملح يقسّي قشرتها ويطيل مدة الطهي إلى النصف.',
    },
    is_published: true,
    is_healthy: false,
  },
  {
    id: 'rec_tn_22_soupe_de_lentilles_tunisienn',
    slug: 'soupe-de-lentilles-tunisienne',
    name_fr: 'Soupe de lentilles tunisienne',
    name_derja: 'Chorbet 3des',
    name_ar: 'شربة العدس التونسية',
    description_fr:
      "Une chorba veloutée de lentilles, carottes et céleri parfumée au cumin, à finir d'un trait de citron : réconfortante, nourrissante et très économique.",
    description_derja:
      'Chorba na3ma bel 3des, sfenarya w krafes, ri7t el kamoun fiha, w 9atra 9ares fel e5er: tchabba3 w rkhissa.',
    description_ar:
      'شربة ناعمة بالعدس والجزر والكرفس بنكهة الكمون، تُختم بقطرات من الليمون، مشبعة ودافئة واقتصادية جداً.',
    image_url: '',
    prep_time_minutes: 15,
    cook_time_minutes: 40,
    base_servings: 4,
    estimated_cost_tnd: 5.5,
    category: 'entree',
    cuisine_type: 'economique',
    difficulty: 'facile',
    ingredients: [
      { ingredient_id: 'ing_lentilles', quantity_base: 250, unit: 'g', role: 'key' },
      { ingredient_id: 'ing_carotte', quantity_base: 2, unit: 'pièces', role: 'secondary' },
      { ingredient_id: 'ing_celeri', quantity_base: 0.5, unit: 'botte', role: 'secondary' },
      { ingredient_id: 'ing_oignon', quantity_base: 1, unit: 'pièce', role: 'secondary' },
      { ingredient_id: 'ing_tomate_concentree', quantity_base: 1, unit: 'c.à.s', role: 'staple' },
      { ingredient_id: 'ing_ail', quantity_base: 3, unit: 'gousses', role: 'staple' },
      { ingredient_id: 'ing_cumin', quantity_base: 1, unit: 'c.à.c', role: 'key' },
      { ingredient_id: 'ing_harissa', quantity_base: 1, unit: 'c.à.c', role: 'staple' },
      { ingredient_id: 'ing_huile_olive', quantity_base: 3, unit: 'c.à.s', role: 'staple' },
      { ingredient_id: 'ing_sel_poivre', quantity_base: 1, unit: 'pincée', role: 'staple' },
      {
        ingredient_id: 'ing_citron',
        quantity_base: 1,
        unit: 'pièce',
        is_optional: true,
        role: 'secondary',
        substitutes: ['ing_citron_vert'],
      },
    ],
    steps: [
      {
        step_number: 1,
        instruction_fr:
          "Triez et rincez les lentilles à l'eau froide. Coupez l'oignon, les carottes et le céleri en petits dés.",
        instruction_derja: 'Na99i el 3des w ghaslou bel ma bared. 9oss el basla, es-sfenarya wel krafes k3ab sghar.',
        instruction_ar: 'نقِّ العدس واغسله بالماء البارد، وقطّع البصل والجزر والكرفس مكعبات صغيرة.',
      },
      {
        step_number: 2,
        instruction_fr:
          "Faites revenir les légumes dans l'huile d'olive 5 minutes à feu moyen, puis ajoutez l'ail haché, la tomate concentrée, l'harissa et le cumin et remuez 1 minute.",
        instruction_derja:
          '9alli el khodhra f zit zitouna 5 d9aye9 3la nar motawasta, ba3d zid el thoum m9atta3, tmatem ma3jouna, hrisa wel kamoun w 7arrak d9i9a.',
        instruction_ar:
          'شوّح الخضر في زيت الزيتون 5 دقائق على نار متوسطة، ثم أضف الثوم المفروم والطماطم المعجونة والهريسة والكمون وحرّك دقيقة واحدة.',
      },
      {
        step_number: 3,
        instruction_fr:
          "Versez les lentilles et 1,5 L d'eau, salez légèrement et laissez frémir 30 à 35 minutes à demi-couvert, jusqu'à ce que les lentilles éclatent.",
        instruction_derja:
          'Zid el 3des w litre w nos ma, mallah chwaya w khalliha teghli 30 l 35 d9i9a nos mghattia, 7atta yetfatte9 el 3des.',
        instruction_ar:
          'أضف العدس ولتراً ونصف من الماء، ملّح قليلاً واتركه ينضج على نار هادئة 30 إلى 35 دقيقة بغطاء نصف مفتوح حتى يتفتح العدس.',
      },
      {
        step_number: 4,
        instruction_fr:
          "Mixez la moitié de la soupe et reversez-la dans la marmite pour une texture veloutée avec du croquant ; rallongez d'eau chaude si elle est trop épaisse.",
        instruction_derja:
          'Ra7i noss ech-chorba bel mixeur w rajja3ha lel tanjra bech tetla3 na3ma w fiha 7abbet; ken ghlidha barcha zid ma skhoun.',
        instruction_ar:
          'اخلط نصف الشربة بالخلاط وأعدها إلى القدر لتحصل على قوام ناعم مع حبات كاملة، وأضف ماءً ساخناً إن كانت كثيفة جداً.',
      },
      {
        step_number: 5,
        instruction_fr:
          'Servez fumant avec un quartier de citron et une pincée de cumin cru saupoudrée au dernier moment.',
        instruction_derja: '9addemha tfawwar m3a tarf 9ares w rachet kamoun ni fel e5er.',
        instruction_ar: 'قدّمها ساخنة جداً مع ربع ليمونة ورشة كمون نيء في اللحظة الأخيرة.',
      },
    ],
    chef_tip: {
      fr: "Pressez le citron dans l'assiette, jamais dans la marmite : l'acidité ajoutée en cuisson empêche les lentilles de fondre.",
      derja: '3ossar el 9ares fel sa7n mouch fel tanjra: el 7modha wa9t et-tayba tkhalli el 3des ma yetteyeb-ch.',
      ar: 'اعصر الليمون في الصحن لا في القدر، فالحموضة أثناء الطهي تمنع العدس من النضج.',
    },
    is_published: true,
    is_healthy: true,
  },
  {
    id: 'rec_tn_23_soupe_de_legumes_au_frik',
    slug: 'soupe-de-legumes-au-frik',
    name_fr: 'Soupe de légumes au frik',
    name_derja: 'Chorbet khodhra bel frik',
    name_ar: 'شربة الخضرة بالفريك',
    description_fr:
      'Le blé vert concassé fond doucement avec potiron, carottes et courgette dans un bouillon rouge pimenté, parfumé à la menthe séchée.',
    description_derja:
      'El frik yetteyeb 3la mahlou m3a el 9ra3 el a7mar, es-sfenarya wel 9ra3 el akhdhar f mra9 a7mar 7ar, w ri7t na3na3 yebes.',
    description_ar: 'قمح أخضر مجروش ينضج على مهل مع القرع الأحمر والجزر والكوسة في مرق أحمر حار بنكهة النعناع المجفف.',
    image_url: '',
    prep_time_minutes: 20,
    cook_time_minutes: 45,
    base_servings: 4,
    estimated_cost_tnd: 5.5,
    category: 'entree',
    cuisine_type: 'vegetarienne',
    difficulty: 'facile',
    ingredients: [
      { ingredient_id: 'ing_frik', quantity_base: 120, unit: 'g', role: 'key' },
      { ingredient_id: 'ing_potiron', quantity_base: 300, unit: 'g', role: 'secondary' },
      { ingredient_id: 'ing_carotte', quantity_base: 2, unit: 'pièces', role: 'secondary' },
      { ingredient_id: 'ing_courgette', quantity_base: 1, unit: 'pièce', role: 'secondary' },
      { ingredient_id: 'ing_celeri', quantity_base: 0.5, unit: 'botte', role: 'secondary' },
      { ingredient_id: 'ing_oignon', quantity_base: 1, unit: 'pièce', role: 'secondary' },
      { ingredient_id: 'ing_tomate', quantity_base: 2, unit: 'pièces', role: 'secondary' },
      { ingredient_id: 'ing_tomate_concentree', quantity_base: 1, unit: 'c.à.s', role: 'staple' },
      { ingredient_id: 'ing_harissa', quantity_base: 1, unit: 'c.à.c', role: 'staple' },
      { ingredient_id: 'ing_ail', quantity_base: 2, unit: 'gousses', role: 'staple' },
      { ingredient_id: 'ing_huile_olive', quantity_base: 3, unit: 'c.à.s', role: 'staple' },
      { ingredient_id: 'ing_sel_poivre', quantity_base: 1, unit: 'pincée', role: 'staple' },
      { ingredient_id: 'ing_menthe_sechee', quantity_base: 1, unit: 'c.à.c', is_optional: true, role: 'secondary' },
    ],
    steps: [
      {
        step_number: 1,
        instruction_fr:
          "Coupez l'oignon, le céleri, les carottes, le potiron et la courgette en dés de 1 cm ; râpez les tomates.",
        instruction_derja:
          '9oss el basla, el krafes, es-sfenarya, el 9ra3 el a7mar wel akhdhar k3ab 1 cm; 7okk et-tmatem.',
        instruction_ar: 'قطّع البصل والكرفس والجزر والقرع الأحمر والكوسة مكعبات بحجم سنتيمتر واحد، واِبشر الطماطم.',
      },
      {
        step_number: 2,
        instruction_fr:
          "Faites revenir oignon, céleri et carottes 5 minutes dans l'huile, puis ajoutez les tomates râpées, la tomate concentrée, l'harissa et l'ail écrasé ; laissez cuire 3 minutes.",
        instruction_derja:
          '9alli el basla, el krafes wes-sfenarya 5 d9aye9 fez-zit, ba3d zid et-tmatem el m7akka, tmatem ma3jouna, hrisa wel thoum; khalliha 3 d9aye9.',
        instruction_ar:
          'شوّح البصل والكرفس والجزر 5 دقائق في الزيت، ثم أضف الطماطم المبشورة والطماطم المعجونة والهريسة والثوم المهروس واتركها 3 دقائق.',
      },
      {
        step_number: 3,
        instruction_fr: "Ajoutez le potiron et la courgette, versez 1,8 L d'eau, salez et portez à ébullition.",
        instruction_derja: 'Zid el 9ra3 el a7mar wel akhdhar, sobb litre w 8 ma, mallah w khalliha tfawwar.',
        instruction_ar: 'أضف القرع الأحمر والكوسة، واسكب لتراً وثمانمائة مليلتر من الماء، ملّح واتركها تغلي.',
      },
      {
        step_number: 4,
        instruction_fr:
          'Versez le frik en pluie en remuant sans arrêt, puis laissez frémir 30 minutes à feu doux en raclant souvent le fond : le potiron fond et épaissit la soupe.',
        instruction_derja:
          'Rach el frik chwaya chwaya w enti t7arrak dima, ba3d khallih 30 d9i9a 3la nar hadya w 7akk el 9a3a kol chwaya: el 9ra3 ydoub w ye5thon ech-chorba.',
        instruction_ar:
          'انثر الفريك تدريجياً مع التحريك المستمر، ثم اتركه 30 دقيقة على نار هادئة مع كشط القاع باستمرار، فيذوب القرع ويكثّف الشربة.',
      },
      {
        step_number: 5,
        instruction_fr:
          'Hors du feu, émiettez la menthe séchée entre vos paumes au-dessus de la marmite, rectifiez le sel et servez bien chaud.',
        instruction_derja:
          'Ba3d ma tetfi en-nar, farrak en-na3na3 el yebes bin kfoufek fo9 et-tanjra, dhou9 el mel7 w 9addemha skhouna.',
        instruction_ar: 'بعد إطفاء النار، افرك النعناع المجفف بين كفيك فوق القدر، اضبط الملح وقدّمها ساخنة.',
      },
    ],
    chef_tip: {
      fr: "Si la chorba épaissit trop en refroidissant, détendez-la toujours avec de l'eau bouillante : l'eau froide fait coller le frik en grumeaux.",
      derja: 'Ken ech-chorba ghlodhet ki bardet, zid-ha dima ma ysa99ar: el ma el bared ylassa9 el frik w ya3mel kwer.',
      ar: 'إذا تكثفت الشربة عند البرودة، خفّفها دائماً بماء مغلي، فالماء البارد يجعل الفريك يتكتل.',
    },
    is_published: true,
    is_healthy: true,
  },
  {
    id: 'rec_tn_24_tajine_malsouka_aux_epinards',
    slug: 'tajine-malsouka-aux-epinards',
    name_fr: 'Tajine malsouka aux épinards',
    name_derja: 'Tajine malsouka bel sbanekh',
    name_ar: 'طاجين الملسوقة بالسبناخ',
    description_fr:
      "Un tajine tunisien croustillant : feuilles de malsouka dorées enveloppant une farce moelleuse d'œufs, d'épinards, de ricotta et de fromage.",
    description_derja:
      'Tajine tounsi y9ar9ech: war9 malsouka m7ammer y7ott fi wostou 3dham, sbanekh, ricotta w fromage.',
    description_ar: 'طاجين تونسي مقرمش: أوراق ملسوقة ذهبية تحتضن حشوة طرية من البيض والسبناخ والريكوتا والجبن.',
    image_url: '',
    prep_time_minutes: 25,
    cook_time_minutes: 35,
    base_servings: 4,
    estimated_cost_tnd: 14,
    category: 'entree',
    cuisine_type: 'familiale',
    difficulty: 'moyen',
    ingredients: [
      { ingredient_id: 'ing_malsouka', quantity_base: 6, unit: 'feuilles', role: 'key' },
      { ingredient_id: 'ing_epinards', quantity_base: 2, unit: 'bottes', role: 'key', substitutes: ['ing_blette'] },
      { ingredient_id: 'ing_oeuf', quantity_base: 6, unit: 'pièces', role: 'key' },
      { ingredient_id: 'ing_ricotta', quantity_base: 1, unit: 'pot', role: 'secondary' },
      {
        ingredient_id: 'ing_fromage_rape',
        quantity_base: 100,
        unit: 'g',
        role: 'secondary',
        substitutes: ['ing_parmesan'],
      },
      { ingredient_id: 'ing_oignon', quantity_base: 1, unit: 'pièce', role: 'secondary' },
      { ingredient_id: 'ing_beurre', quantity_base: 30, unit: 'g', role: 'staple' },
      { ingredient_id: 'ing_huile_olive', quantity_base: 2, unit: 'c.à.s', role: 'staple' },
      { ingredient_id: 'ing_sel_poivre', quantity_base: 1, unit: 'pincée', role: 'staple' },
    ],
    steps: [
      {
        step_number: 1,
        instruction_fr:
          "Lavez les épinards, retirez les grosses tiges et faites-les tomber 3 minutes dans une poêle avec l'huile et l'oignon émincé ; égouttez, pressez fort entre vos mains et hachez grossièrement.",
        instruction_derja:
          'Ghsel es-sbanekh, na77i el 3rou9 el ghlodh w tayyebhom 3 d9aye9 f me9la bez-zit wel basla m9assa; safihom, 3osrhom mlih b yeddik w 9atta3hom.',
        instruction_ar:
          'اغسل السبناخ وانزع السيقان الغليظة، ثم اطهه 3 دقائق في مقلاة مع الزيت والبصل المقطع شرائح، صفّه واعصره جيداً بيديك وافرمه فرماً خشناً.',
      },
      {
        step_number: 2,
        instruction_fr:
          'Battez les œufs avec la ricotta, le fromage râpé, le sel et le poivre, puis incorporez les épinards.',
        instruction_derja:
          'Akhbet el 3dham m3a er-ricotta, el fromage, el mel7 wel bzar, ba3d zid es-sbanekh w 9allab.',
        instruction_ar: 'اخفق البيض مع الريكوتا والجبن المبشور والملح والفلفل الأسود، ثم أضف السبناخ وقلّب.',
      },
      {
        step_number: 3,
        instruction_fr:
          'Beurrez un moule rond de 22 cm et tapissez-le de 4 feuilles de malsouka qui se chevauchent et dépassent largement des bords.',
        instruction_derja:
          'Dhan 9aleb mdawer 22 cm bel zebda w ferrech fih 4 war9at malsouka fo9 b3adhhom w yokhrjou mel jnab.',
        instruction_ar:
          'ادهن قالباً دائرياً قطره 22 سنتيمتراً بالزبدة، وافرش فيه 4 أوراق ملسوقة متداخلة تتجاوز الحواف.',
      },
      {
        step_number: 4,
        instruction_fr:
          'Versez la farce, rabattez les feuilles qui dépassent, couvrez avec les 2 dernières feuilles badigeonnées de beurre fondu.',
        instruction_derja:
          'Sobb el 7achwa, rajja3 el war9 el kharej fo9ha, w ghattiha bel zouz war9at el ba9yin madhounin bel zebda dheyba.',
        instruction_ar:
          'اسكب الحشوة، واطوِ الأوراق الزائدة فوقها، ثم غطّها بالورقتين المتبقيتين بعد دهنهما بالزبدة المذابة.',
      },
      {
        step_number: 5,
        instruction_fr:
          "Enfournez à 180 °C pendant 30 à 35 minutes, jusqu'à ce que le dessus soit bien doré et qu'une lame plantée au centre ressorte sèche.",
        instruction_derja:
          'Dakhlou lel four 3la 180 °C moddet 30 l 35 d9i9a, 7atta yet7ammar el fo9 w sekkina f wostou tokhrej nadhifa.',
        instruction_ar: 'أدخله الفرن على 180 درجة لمدة 30 إلى 35 دقيقة حتى يتحمّر سطحه وتخرج السكين من وسطه نظيفة.',
      },
      {
        step_number: 6,
        instruction_fr: 'Laissez reposer 10 minutes avant de démouler et de découper en parts.',
        instruction_derja: 'Khallih yertah 10 d9aye9 9bal ma tna77ih mel 9aleb w t9assmou.',
        instruction_ar: 'اتركه يرتاح 10 دقائق قبل إخراجه من القالب وتقطيعه.',
      },
    ],
    chef_tip: {
      fr: "Pressez les épinards comme une éponge jusqu'à la dernière goutte : la moindre eau restante détrempe la malsouka du fond.",
      derja: '3ossar es-sbanekh kif el sfonja 7atta e5er 9atra: ay ma yo93ed yfassed el malsouka elli louta.',
      ar: 'اعصر السبناخ كالإسفنجة حتى آخر قطرة، فأي ماء متبقٍ يُليّن الملسوقة السفلية.',
    },
    is_published: true,
    is_healthy: false,
  },
  {
    id: 'rec_tn_25_tajine_aux_pommes_de_terre_e',
    slug: 'tajine-aux-pommes-de-terre-et-thon',
    name_fr: 'Tajine aux pommes de terre et thon',
    name_derja: 'Tajine batata bel ton',
    name_ar: 'طاجين البطاطا بالتن',
    description_fr:
      'Le tajine des familles tunisiennes : pommes de terre dorées, thon, persil et fromage pris dans des œufs au curcuma, à manger tiède ou froid.',
    description_derja:
      'Tajine el 3ayla: batata m7ammra, ton, ma3dnous w fromage f 3dham b ker9om, yetkla skhoun walla bared.',
    description_ar: 'طاجين العائلات التونسية: بطاطا محمّرة وتن وبقدونس وجبن في بيض بالكركم، يؤكل دافئاً أو بارداً.',
    image_url: '',
    prep_time_minutes: 20,
    cook_time_minutes: 40,
    base_servings: 4,
    estimated_cost_tnd: 16,
    category: 'entree',
    cuisine_type: 'familiale',
    difficulty: 'facile',
    ingredients: [
      { ingredient_id: 'ing_pomme_de_terre', quantity_base: 500, unit: 'g', role: 'key' },
      { ingredient_id: 'ing_thon_boite', quantity_base: 2, unit: 'boîtes', role: 'key' },
      { ingredient_id: 'ing_oeuf', quantity_base: 6, unit: 'pièces', role: 'key' },
      { ingredient_id: 'ing_fromage_rape', quantity_base: 100, unit: 'g', role: 'secondary' },
      { ingredient_id: 'ing_persil', quantity_base: 0.5, unit: 'botte', role: 'secondary' },
      { ingredient_id: 'ing_oignon', quantity_base: 1, unit: 'pièce', role: 'secondary' },
      { ingredient_id: 'ing_curcuma', quantity_base: 0.5, unit: 'c.à.c', role: 'staple' },
      { ingredient_id: 'ing_huile_olive', quantity_base: 3, unit: 'c.à.s', role: 'staple' },
      { ingredient_id: 'ing_sel_poivre', quantity_base: 1, unit: 'pincée', role: 'staple' },
    ],
    steps: [
      {
        step_number: 1,
        instruction_fr:
          "Coupez les pommes de terre en dés de 1 cm et faites-les dorer à la poêle dans l'huile 12 minutes en remuant, jusqu'à ce qu'elles soient tendres.",
        instruction_derja:
          '9oss el batata k3ab 1 cm w 7ammarha f me9la bez-zit 12 d9i9a w enti t9allab, 7atta tetteyeb.',
        instruction_ar: 'قطّع البطاطا مكعبات بحجم سنتيمتر واحد وحمّرها في مقلاة بالزيت 12 دقيقة مع التقليب حتى تنضج.',
      },
      {
        step_number: 2,
        instruction_fr:
          "Émincez l'oignon et faites-le fondre 4 minutes dans la même poêle avec un peu d'huile du thon.",
        instruction_derja: '9oss el basla rfi3a w tayyebha 4 d9aye9 f nafs el me9la b chwaya zit mta3 el ton.',
        instruction_ar: 'قطّع البصل شرائح رفيعة واطهه 4 دقائق في نفس المقلاة مع قليل من زيت التن.',
      },
      {
        step_number: 3,
        instruction_fr:
          "Dans un saladier, battez les œufs avec le curcuma, le sel, le poivre, le persil haché et le fromage, puis ajoutez le thon émietté, les pommes de terre et l'oignon.",
        instruction_derja:
          'F ga3a, akhbet el 3dham m3a el ker9om, el mel7, el bzar, el ma3dnous m9atta3 wel fromage, ba3d zid el ton mfarrak, el batata wel basla.',
        instruction_ar:
          'في وعاء، اخفق البيض مع الكركم والملح والفلفل الأسود والبقدونس المفروم والجبن، ثم أضف التن المفتت والبطاطا والبصل.',
      },
      {
        step_number: 4,
        instruction_fr:
          "Versez dans un plat huilé de 20 x 30 cm et enfournez à 180 °C pendant 25 minutes, jusqu'à ce que le tajine soit gonflé, doré et ferme au centre.",
        instruction_derja:
          'Sobb f sa7n madhoun 20 3la 30 cm w dakhlou lel four 3la 180 °C 25 d9i9a, 7atta yentfakh w yet7ammar w yechedd f wostou.',
        instruction_ar:
          'اسكب الخليط في صحن مدهون مقاسه 20 في 30 سنتيمتراً وأدخله الفرن على 180 درجة لمدة 25 دقيقة حتى ينتفخ ويتحمر ويتماسك وسطه.',
      },
      {
        step_number: 5,
        instruction_fr: 'Laissez tiédir 10 minutes, découpez en carrés et servez avec une salade ou dans un pain.',
        instruction_derja: 'Khallih yebred chwaya 10 d9aye9, 9assmou mrab3at w 9addmou m3a slata walla f khobza.',
        instruction_ar: 'اتركه يفتر 10 دقائق، قطّعه مربعات وقدّمه مع سلطة أو داخل خبزة.',
      },
    ],
    chef_tip: {
      fr: 'Préparez-le la veille : bien froid, le tajine se tranche net et fait le meilleur casse-croûte du lendemain.',
      derja: 'A3mlou mel lila: ki yebred mlih yet9ass ndhif w ya3mel a7la kaskrout lel ghodwa.',
      ar: 'حضّره من الليلة السابقة، فعندما يبرد جيداً يُقطّع بسهولة ويصبح أطيب شطيرة في الغد.',
    },
    is_published: true,
    is_healthy: false,
  },
  {
    id: 'rec_tn_26_boulettes_de_poisson_a_la_tu',
    slug: 'boulettes-de-poisson-a-la-tunisienne',
    name_fr: 'Boulettes de poisson à la tunisienne',
    name_derja: 'Kefta 7out tounsia',
    name_ar: 'كفتة الحوت التونسية',
    description_fr:
      "Des boulettes de poisson tendres au persil et au cumin, pochées dans une sauce rouge à l'harissa : un classique des tables du Sahel.",
    description_derja:
      'Kefta 7out rtiba bel ma3dnous wel kamoun, tetteyeb f salsa 7amra bel hrisa: makla mta3 es-sa7el.',
    description_ar: 'كفتة حوت طرية بالبقدونس والكمون، تُطهى في صلصة حمراء بالهريسة، طبق كلاسيكي من موائد الساحل.',
    image_url: '',
    prep_time_minutes: 30,
    cook_time_minutes: 30,
    base_servings: 4,
    estimated_cost_tnd: 16.5,
    category: 'plat_principal',
    cuisine_type: 'traditionnelle',
    difficulty: 'moyen',
    ingredients: [
      { ingredient_id: 'ing_poisson_frais', quantity_base: 600, unit: 'g', role: 'key' },
      {
        ingredient_id: 'ing_persil',
        quantity_base: 1,
        unit: 'botte',
        role: 'secondary',
        substitutes: ['ing_coriandre'],
      },
      { ingredient_id: 'ing_oeuf', quantity_base: 1, unit: 'pièce', role: 'secondary' },
      {
        ingredient_id: 'ing_pain_panure',
        quantity_base: 50,
        unit: 'g',
        role: 'secondary',
        substitutes: ['ing_pain_baguette'],
      },
      { ingredient_id: 'ing_oignon', quantity_base: 1, unit: 'pièce', role: 'secondary' },
      { ingredient_id: 'ing_tomate_concentree', quantity_base: 2, unit: 'c.à.s', role: 'secondary' },
      { ingredient_id: 'ing_ail', quantity_base: 4, unit: 'gousses', role: 'staple' },
      { ingredient_id: 'ing_cumin', quantity_base: 1, unit: 'c.à.c', role: 'staple' },
      { ingredient_id: 'ing_harissa', quantity_base: 1, unit: 'c.à.s', role: 'staple' },
      { ingredient_id: 'ing_huile_olive', quantity_base: 4, unit: 'c.à.s', role: 'staple' },
      { ingredient_id: 'ing_sel_poivre', quantity_base: 1, unit: 'pincée', role: 'staple' },
      { ingredient_id: 'ing_citron', quantity_base: 1, unit: 'pièce', is_optional: true, role: 'secondary' },
    ],
    steps: [
      {
        step_number: 1,
        instruction_fr:
          'Retirez la peau et toutes les arêtes du poisson, puis hachez la chair au couteau ou par brèves impulsions au mixeur, sans la réduire en pâte.',
        instruction_derja:
          'Na77i el jeld w kol el chouk mel 7out, ba3d 9atta3 el l7am bel sekkina walla bel mixeur chwaya chwaya, bla ma yowalli 3jina.',
        instruction_ar:
          'انزع الجلد وكل الحسك من السمك، ثم افرم اللحم بالسكين أو بالخلاط على دفعات قصيرة دون أن يصبح عجينة.',
      },
      {
        step_number: 2,
        instruction_fr:
          "Mélangez avec le persil haché, 2 gousses d'ail écrasées, le cumin, l'œuf, la chapelure, le sel et le poivre ; formez des boulettes de la taille d'une noix avec les mains huilées et réservez 15 minutes au frais.",
        instruction_derja:
          'Khaltou m3a el ma3dnous m9atta3, zouz swaba3 thoum, el kamoun, el 3dham, el chapelure, el mel7 wel bzar; a3mel kwer 9ad el gargou3a b yeddik madhounin w 7otthom 15 d9i9a fel frigo.',
        instruction_ar:
          'اخلطه مع البقدونس المفروم وفصّين من الثوم المهروس والكمون والبيضة وفتات الخبز والملح والفلفل، وشكّل كرات بحجم الجوزة بيدين مدهونتين، ثم ضعها 15 دقيقة في الثلاجة.',
      },
      {
        step_number: 3,
        instruction_fr:
          "Pour la sauce, faites revenir l'oignon râpé dans l'huile 4 minutes, ajoutez l'ail restant, la tomate concentrée et l'harissa et faites frire 3 minutes.",
        instruction_derja:
          'Lel salsa, 9alli el basla m7akka fez-zit 4 d9aye9, zid el thoum el ba9i, tmatem ma3jouna wel hrisa w 9allihom 3 d9aye9.',
        instruction_ar:
          'للصلصة، شوّح البصل المبشور في الزيت 4 دقائق، ثم أضف بقية الثوم والطماطم المعجونة والهريسة واقلها 3 دقائق.',
      },
      {
        step_number: 4,
        instruction_fr: "Versez 750 ml d'eau, salez et laissez bouillir 10 minutes.",
        instruction_derja: 'Sobb 750 ml ma, mallah w khalliha teghli 10 d9aye9.',
        instruction_ar: 'اسكب 750 مليلتراً من الماء، ملّح واتركها تغلي 10 دقائق.',
      },
      {
        step_number: 5,
        instruction_fr:
          "Déposez délicatement les boulettes dans la sauce frémissante et laissez cuire 15 à 20 minutes à feu doux, en secouant la marmite plutôt qu'en remuant, jusqu'à ce qu'elles soient fermes et la sauce réduite.",
        instruction_derja:
          '7ott el kwer bechwaya fel salsa w hiya teghli, w khallihom 15 l 20 d9i9a 3la nar hadya; 7arrak et-tanjra mouch bel mgharfa, 7atta yechedou w t9atter es-salsa.',
        instruction_ar:
          'ضع الكرات برفق في الصلصة المغلية واتركها 15 إلى 20 دقيقة على نار هادئة، مع هزّ القدر بدل التحريك بالملعقة، حتى تتماسك وتتكثف الصلصة.',
      },
      {
        step_number: 6,
        instruction_fr: 'Parsemez de persil, servez avec un quartier de citron et du pain pour saucer.',
        instruction_derja: 'Rach chwaya ma3dnous, w 9addemha m3a tarf 9ares w khobz bech tghammes.',
        instruction_ar: 'رشّ قليلاً من البقدونس وقدّمها مع ربع ليمونة وخبز للتغميس.',
      },
    ],
    chef_tip: {
      fr: "Mouillez-vous les mains d'huile entre chaque boulette : elles restent lisses, ne collent pas et ne se défont pas dans la sauce.",
      derja: 'Dhan yeddik bez-zit bin kwira w o5ra: yo93dou mlas, ma ylas9ou-ch w ma yetfarkou-ch fel salsa.',
      ar: 'ادهن يديك بالزيت بين كل كرة وأخرى، فتبقى ملساء لا تلتصق ولا تتفتت في الصلصة.',
    },
    is_published: true,
    is_healthy: true,
  },
  {
    id: 'rec_tn_27_poivrons_farcis_a_la_viande',
    slug: 'poivrons-farcis-a-la-viande',
    name_fr: 'Poivrons farcis à la viande',
    name_derja: 'Felfel ma7chi bel l7am',
    name_ar: 'فلفل محشي باللحم',
    description_fr:
      "Des poivrons garnis de viande hachée, de riz et de persil, mijotés debout dans une sauce tomate relevée jusqu'à devenir fondants.",
    description_derja:
      'Felfel m7achi b l7am mafroum, rouz w ma3dnous, yetteyeb wa9ef f salsa 7amra 7atta yowalli rteb.',
    description_ar: 'فلفل محشو باللحم المفروم والأرز والبقدونس، يُطهى واقفاً في صلصة طماطم حارة حتى يصبح طرياً.',
    image_url: '',
    prep_time_minutes: 30,
    cook_time_minutes: 50,
    base_servings: 4,
    estimated_cost_tnd: 20,
    category: 'plat_principal',
    cuisine_type: 'familiale',
    difficulty: 'moyen',
    ingredients: [
      { ingredient_id: 'ing_poivron', quantity_base: 4, unit: 'pièces', role: 'key', substitutes: ['ing_piment'] },
      {
        ingredient_id: 'ing_viande_hachee',
        quantity_base: 400,
        unit: 'g',
        role: 'key',
        substitutes: ['ing_poulet_hache'],
      },
      { ingredient_id: 'ing_riz', quantity_base: 100, unit: 'g', role: 'secondary' },
      { ingredient_id: 'ing_oignon', quantity_base: 1, unit: 'pièce', role: 'secondary' },
      { ingredient_id: 'ing_persil', quantity_base: 0.5, unit: 'botte', role: 'secondary' },
      { ingredient_id: 'ing_tomate', quantity_base: 2, unit: 'pièces', role: 'secondary' },
      { ingredient_id: 'ing_tomate_concentree', quantity_base: 2, unit: 'c.à.s', role: 'staple' },
      { ingredient_id: 'ing_ail', quantity_base: 3, unit: 'gousses', role: 'staple' },
      { ingredient_id: 'ing_harissa', quantity_base: 1, unit: 'c.à.c', role: 'staple' },
      { ingredient_id: 'ing_tabel_karwiya', quantity_base: 1, unit: 'c.à.c', role: 'staple' },
      { ingredient_id: 'ing_huile_olive', quantity_base: 3, unit: 'c.à.s', role: 'staple' },
      { ingredient_id: 'ing_sel_poivre', quantity_base: 1, unit: 'pincée', role: 'staple' },
    ],
    steps: [
      {
        step_number: 1,
        instruction_fr:
          'Coupez le chapeau des poivrons, retirez les graines et les membranes blanches, et gardez les chapeaux.',
        instruction_derja: '9oss rass el felfel, na77i el zri3a wel 3rou9 el bidh, w khalli er-rousset.',
        instruction_ar: 'اقطع رأس الفلفل وانزع البذور والعروق البيضاء، واحتفظ بالرؤوس.',
      },
      {
        step_number: 2,
        instruction_fr:
          "Rincez le riz et mélangez-le cru avec la viande, l'oignon râpé, le persil haché, une gousse d'ail écrasée, le tabel-karwiya, le sel, le poivre et une cuillère d'huile.",
        instruction_derja:
          'Ghsel er-rouz w khaltou ni m3a el l7am, el basla m7akka, el ma3dnous m9atta3, sba3 thoum marfoukh, tabel w karwiya, mel7, bzar w mgharfa zit.',
        instruction_ar:
          'اغسل الأرز واخلطه نيئاً مع اللحم والبصل المبشور والبقدونس المفروم وفص ثوم مهروس والتابل والكروية والملح والفلفل وملعقة زيت.',
      },
      {
        step_number: 3,
        instruction_fr: 'Farcissez les poivrons aux trois quarts seulement, puis refermez-les avec leurs chapeaux.',
        instruction_derja: 'A7chi el felfel ken 3la thlatha rbou3, w sakkarhom b rousshom.',
        instruction_ar: 'احشُ الفلفل إلى ثلاثة أرباعه فقط، ثم أغلقه برؤوسه.',
      },
      {
        step_number: 4,
        instruction_fr:
          "Dans une marmite large, faites revenir dans l'huile l'ail restant, la tomate concentrée, l'harissa et les tomates râpées 3 minutes, puis versez 500 ml d'eau et portez à ébullition.",
        instruction_derja:
          'F tanjra wes3a, 9alli fez-zit el thoum el ba9i, tmatem ma3jouna, hrisa wet-tmatem m7akka 3 d9aye9, ba3d sobb 500 ml ma w khalliha tfawwar.',
        instruction_ar:
          'في قدر واسع، شوّح في الزيت بقية الثوم والطماطم المعجونة والهريسة والطماطم المبشورة 3 دقائق، ثم اسكب 500 مليلتر من الماء واتركها تغلي.',
      },
      {
        step_number: 5,
        instruction_fr:
          "Placez les poivrons debout et serrés dans la sauce, couvrez et laissez mijoter 45 minutes à feu doux en les arrosant de sauce de temps en temps, jusqu'à ce que le riz soit tendre.",
        instruction_derja:
          'Wa99ef el felfel la9i b3adhou fel salsa, ghatti w khallih 45 d9i9a 3la nar hadya w kol chwaya sobb 3lih mel salsa, 7atta yetteyeb er-rouz.',
        instruction_ar:
          'ضع الفلفل واقفاً ومتلاصقاً في الصلصة، غطّ القدر واتركه 45 دقيقة على نار هادئة مع سكب الصلصة فوقه من حين لآخر حتى ينضج الأرز.',
      },
      {
        step_number: 6,
        instruction_fr: 'Servez chaque poivron nappé de sauce bien réduite.',
        instruction_derja: '9addem kol felfla w sobb 3liha mel salsa el m9attra.',
        instruction_ar: 'قدّم كل فلفلة مغطاة بالصلصة المتكثفة.',
      },
    ],
    chef_tip: {
      fr: "Le riz cru double de volume en cuisant : remplissez aux trois quarts, sinon la farce pousse le chapeau et s'échappe dans la sauce.",
      derja:
        'Er-rouz el ni ykabber el dhe3f ki yetteyeb: e7chi ken thlatha rbou3, w ella el 7achwa tadfa3 er-ras w tokhrej lel salsa.',
      ar: 'الأرز النيء يتضاعف حجمه عند الطهي، فاحشُ ثلاثة أرباع الفلفل فقط وإلا دفعت الحشوة الرأس وخرجت إلى الصلصة.',
    },
    is_published: true,
    is_healthy: false,
  },
  {
    id: 'rec_tn_28_aubergines_farcies',
    slug: 'aubergines-farcies',
    name_fr: 'Aubergines farcies',
    name_derja: 'Bdenjen m7achi',
    name_ar: 'باذنجان محشي',
    description_fr:
      'Des demi-aubergines rôties, garnies de leur chair mêlée à la viande épicée, gratinées au four dans une sauce tomate.',
    description_derja:
      'Bdenjen mechwi m9assam b noss, m7achi b l7amou m5allet m3a l7am b tabel, ytgratina fel four f salsa tmatem.',
    description_ar: 'أنصاف باذنجان مشوية محشوة بلبّها الممزوج باللحم المتبّل، تُحمّر في الفرن مع صلصة الطماطم.',
    image_url: '',
    prep_time_minutes: 25,
    cook_time_minutes: 55,
    base_servings: 4,
    estimated_cost_tnd: 18.5,
    category: 'plat_principal',
    cuisine_type: 'familiale',
    difficulty: 'moyen',
    ingredients: [
      { ingredient_id: 'ing_aubergine', quantity_base: 4, unit: 'pièces', role: 'key' },
      {
        ingredient_id: 'ing_viande_hachee',
        quantity_base: 300,
        unit: 'g',
        role: 'key',
        substitutes: ['ing_poulet_hache'],
      },
      { ingredient_id: 'ing_tomate', quantity_base: 3, unit: 'pièces', role: 'secondary' },
      { ingredient_id: 'ing_oignon', quantity_base: 1, unit: 'pièce', role: 'secondary' },
      { ingredient_id: 'ing_persil', quantity_base: 0.5, unit: 'botte', role: 'secondary' },
      { ingredient_id: 'ing_oeuf', quantity_base: 1, unit: 'pièce', role: 'secondary' },
      { ingredient_id: 'ing_tomate_concentree', quantity_base: 1, unit: 'c.à.s', role: 'staple' },
      { ingredient_id: 'ing_ail', quantity_base: 3, unit: 'gousses', role: 'staple' },
      { ingredient_id: 'ing_tabel_karwiya', quantity_base: 1, unit: 'c.à.c', role: 'staple' },
      { ingredient_id: 'ing_huile_olive', quantity_base: 4, unit: 'c.à.s', role: 'staple' },
      { ingredient_id: 'ing_sel_poivre', quantity_base: 1, unit: 'pincée', role: 'staple' },
      {
        ingredient_id: 'ing_fromage_rape',
        quantity_base: 50,
        unit: 'g',
        is_optional: true,
        role: 'secondary',
        substitutes: ['ing_mozzarella'],
      },
    ],
    steps: [
      {
        step_number: 1,
        instruction_fr:
          "Coupez les aubergines en deux dans la longueur, quadrillez la chair sans percer la peau, badigeonnez d'huile, salez et rôtissez 20 minutes à 200 °C.",
        instruction_derja:
          '9oss el bdenjen b noss bel toul, a3mel khtout fel l7am bla ma t9oss el jeld, dhanou bez-zit, mallah w ichwih 20 d9i9a fel four 3la 200 °C.',
        instruction_ar:
          'اقطع الباذنجان إلى نصفين بالطول، واصنع خطوطاً متقاطعة في اللب دون ثقب القشرة، ثم ادهنه بالزيت وملّحه واشوه 20 دقيقة في الفرن على 200 درجة.',
      },
      {
        step_number: 2,
        instruction_fr: 'Évidez la chair à la cuillère en laissant 1 cm contre la peau, puis hachez-la.',
        instruction_derja: 'Fa99ar el l7am bel mgharfa w khalli 1 cm la9i bel jeld, ba3d 9atta3ou.',
        instruction_ar: 'أفرغ اللب بالملعقة مع ترك سنتيمتر واحد ملاصق للقشرة، ثم افرمه.',
      },
      {
        step_number: 3,
        instruction_fr:
          "Faites dorer la viande avec l'oignon haché et 2 gousses d'ail 8 minutes, ajoutez le tabel-karwiya, la chair d'aubergine et le persil ; hors du feu, liez avec l'œuf battu.",
        instruction_derja:
          '7ammar el l7am m3a el basla m9atta3a w zouz swaba3 thoum 8 d9aye9, zid tabel w karwiya, l7am el bdenjen wel ma3dnous; ba3d ma tetfi en-nar zid el 3dham makhbouta.',
        instruction_ar:
          'حمّر اللحم مع البصل المفروم وفصّين من الثوم 8 دقائق، ثم أضف التابل والكروية ولب الباذنجان والبقدونس، وبعد إطفاء النار اربط الخليط بالبيضة المخفوقة.',
      },
      {
        step_number: 4,
        instruction_fr:
          "Garnissez les demi-aubergines et rangez-les dans un plat ; mélangez les tomates râpées, la tomate concentrée, l'ail restant et 200 ml d'eau et versez autour.",
        instruction_derja:
          'A7chi el bdenjen w saffou f sa7n; khallet et-tmatem m7akka, tmatem ma3jouna, el thoum el ba9i w 200 ml ma w sobbhom dayer bih.',
        instruction_ar:
          'احشُ أنصاف الباذنجان ورتّبها في صحن، ثم اخلط الطماطم المبشورة والطماطم المعجونة وبقية الثوم و200 مليلتر من الماء واسكبها حولها.',
      },
      {
        step_number: 5,
        instruction_fr:
          "Parsemez de fromage et enfournez 25 minutes à 200 °C, jusqu'à ce que la sauce bouillonne et que le dessus soit gratiné.",
        instruction_derja:
          'Rach el fromage w rajja3ha lel four 25 d9i9a 3la 200 °C, 7atta tfawwar es-salsa w yet7ammar el fo9.',
        instruction_ar: 'رشّ الجبن وأعدها إلى الفرن 25 دقيقة على 200 درجة حتى تغلي الصلصة ويتحمّر السطح.',
      },
    ],
    chef_tip: {
      fr: "Quadriller la chair avant de rôtir permet à l'aubergine de cuire à cœur deux fois plus vite tout en buvant moins d'huile.",
      derja: 'Ki tkhatet l7am el bdenjen 9bal ma tichwih, yetteyeb fel 9alb fi noss el wa9t w ma ychrab-ch barcha zit.',
      ar: 'تخطيط لب الباذنجان قبل شيّه يجعله ينضج في قلبه في نصف الوقت ويمتص زيتاً أقل.',
    },
    is_published: true,
    is_healthy: false,
  },
  {
    id: 'rec_tn_29_batata_bel_kamoun',
    slug: 'pommes-de-terre-au-cumin',
    name_fr: 'Pommes de terre au cumin',
    name_derja: 'Batata bel kamoun',
    name_ar: 'بطاطا بالكمون',
    description_fr:
      "Le plat express et économique par excellence : des pommes de terre mijotées dans une sauce rouge à l'ail pilé et au cumin, à saucer avec du pain.",
    description_derja:
      'El makla el sahla w er-rkhissa: batata tetteyeb f salsa 7amra bel thoum mad9ou9 wel kamoun, w tghammes fiha bel khobz.',
    description_ar: 'الطبق السريع والاقتصادي بامتياز: بطاطا مطهوة في صلصة حمراء بالثوم المدقوق والكمون، تُغمّس بالخبز.',
    image_url: '',
    prep_time_minutes: 10,
    cook_time_minutes: 30,
    base_servings: 4,
    estimated_cost_tnd: 6.5,
    category: 'plat_principal',
    cuisine_type: 'economique',
    difficulty: 'facile',
    ingredients: [
      { ingredient_id: 'ing_pomme_de_terre', quantity_base: 1, unit: 'kg', role: 'key' },
      { ingredient_id: 'ing_cumin', quantity_base: 1.5, unit: 'c.à.c', role: 'key' },
      { ingredient_id: 'ing_ail', quantity_base: 5, unit: 'gousses', role: 'staple' },
      { ingredient_id: 'ing_tomate_concentree', quantity_base: 1, unit: 'c.à.s', role: 'staple' },
      { ingredient_id: 'ing_harissa', quantity_base: 1, unit: 'c.à.c', role: 'staple' },
      { ingredient_id: 'ing_paprika', quantity_base: 1, unit: 'c.à.c', role: 'staple' },
      { ingredient_id: 'ing_huile_olive', quantity_base: 4, unit: 'c.à.s', role: 'staple' },
      { ingredient_id: 'ing_sel_poivre', quantity_base: 1, unit: 'pincée', role: 'staple' },
      {
        ingredient_id: 'ing_persil',
        quantity_base: 0.5,
        unit: 'botte',
        is_optional: true,
        role: 'secondary',
        substitutes: ['ing_coriandre'],
      },
    ],
    steps: [
      {
        step_number: 1,
        instruction_fr: 'Épluchez les pommes de terre et coupez-les en gros cubes de 3 cm.',
        instruction_derja: '9achar el batata w 9osha k3ab kbar 3 cm.',
        instruction_ar: 'قشّر البطاطا وقطّعها مكعبات كبيرة بحجم 3 سنتيمترات.',
      },
      {
        step_number: 2,
        instruction_fr:
          "Pilez au mortier l'ail avec le cumin et une pincée de gros sel jusqu'à obtenir une pâte (la dersa).",
        instruction_derja: 'Od9 el thoum fel mehraz m3a el kamoun w rachet mel7 7atta tetla3 dersa.',
        instruction_ar: 'ادقّ الثوم في المهراس مع الكمون ورشة من الملح الخشن حتى تحصل على عجينة الدرسة.',
      },
      {
        step_number: 3,
        instruction_fr:
          "Faites chauffer l'huile, ajoutez la dersa 30 secondes, puis la tomate concentrée, l'harissa, le paprika et un fond d'eau ; laissez frire 2 minutes.",
        instruction_derja:
          'Skhan ez-zit, zid ed-dersa 30 tsenya, ba3d tmatem ma3jouna, hrisa, felfel a7mar 7lou w chwaya ma; khalliha tet9la d9i9tin.',
        instruction_ar:
          'سخّن الزيت وأضف الدرسة 30 ثانية، ثم الطماطم المعجونة والهريسة والفلفل الحلو وقليلاً من الماء، واتركها تُقلى دقيقتين.',
      },
      {
        step_number: 4,
        instruction_fr:
          "Ajoutez les pommes de terre, enrobez-les bien de sauce, versez environ 600 ml d'eau chaude juste à hauteur, couvrez et laissez mijoter 20 à 25 minutes.",
        instruction_derja:
          'Zid el batata w 9allabha mlih fel salsa, sobb 600 ml ma skhoun 9addha, ghatti w khalliha 20 l 25 d9i9a.',
        instruction_ar:
          'أضف البطاطا وقلّبها جيداً في الصلصة، واسكب نحو 600 مليلتر من الماء الساخن بقدر ما يغطيها، ثم غطّ القدر واتركها 20 إلى 25 دقيقة.',
      },
      {
        step_number: 5,
        instruction_fr:
          "Quand la pointe d'un couteau s'enfonce sans résistance et que la sauce nappe les morceaux, parsemez d'une pincée de cumin et de persil haché.",
        instruction_derja:
          'Ki tod5el ras es-sekkina bla mo9awma w tlas9 es-salsa fel batata, rach rachet kamoun w ma3dnous m9atta3.',
        instruction_ar: 'عندما يدخل رأس السكين بسهولة وتكسو الصلصة القطع، رشّ قليلاً من الكمون والبقدونس المفروم.',
      },
    ],
    chef_tip: {
      fr: "Le vrai secret, c'est la dersa au mortier : l'ail écrasé avec le cumin libère bien plus de parfum que de l'ail haché au couteau.",
      derja:
        'Es-sir kollou fel dersa mta3 el mehraz: el thoum mad9ou9 m3a el kamoun yatla3 ri7tou akther barcha mel thoum el m9atta3 bel sekkina.',
      ar: 'السر كله في الدرسة بالمهراس، فالثوم المدقوق مع الكمون يطلق رائحة أقوى بكثير من الثوم المفروم بالسكين.',
    },
    is_published: true,
    is_healthy: true,
  },
  {
    id: 'rec_tn_30_slata_mechouia_aux_ufs',
    slug: 'slata-mechouia-aux-oeufs',
    name_fr: 'Slata mechouia aux œufs',
    name_derja: 'Slata mechouia bel 3dham',
    name_ar: 'سلطة مشوية بالبيض',
    description_fr:
      "Piments et tomates grillés au feu puis pilés à l'ail et au tabel, garnis de thon, d'œufs durs, d'olives et de câpres : la reine des entrées tunisiennes.",
    description_derja:
      'Felfel w tmatem mechwiyin 3al nar w mad9ou9in bel thoum wel tabel, m3a ton, 3dham msalga, zitoun w kabbar: sultanet es-slatat et-tounsia.',
    description_ar:
      'فلفل وطماطم مشوية على النار ثم مدقوقة بالثوم والتابل، مزينة بالتن والبيض المسلوق والزيتون والكبّار، ملكة المقبلات التونسية.',
    image_url: '',
    prep_time_minutes: 20,
    cook_time_minutes: 25,
    base_servings: 4,
    estimated_cost_tnd: 12.5,
    category: 'entree',
    cuisine_type: 'traditionnelle',
    difficulty: 'facile',
    ingredients: [
      { ingredient_id: 'ing_piment', quantity_base: 500, unit: 'g', role: 'key', substitutes: ['ing_poivron'] },
      { ingredient_id: 'ing_tomate', quantity_base: 4, unit: 'pièces', role: 'key' },
      { ingredient_id: 'ing_ail', quantity_base: 3, unit: 'gousses', role: 'staple' },
      { ingredient_id: 'ing_oeuf', quantity_base: 4, unit: 'pièces', role: 'secondary' },
      { ingredient_id: 'ing_thon_boite', quantity_base: 1, unit: 'boîte', role: 'secondary' },
      { ingredient_id: 'ing_citron', quantity_base: 1, unit: 'pièce', role: 'secondary' },
      { ingredient_id: 'ing_tabel_karwiya', quantity_base: 1, unit: 'c.à.c', role: 'staple' },
      { ingredient_id: 'ing_huile_olive', quantity_base: 4, unit: 'c.à.s', role: 'staple' },
      { ingredient_id: 'ing_sel_poivre', quantity_base: 1, unit: 'pincée', role: 'staple' },
      { ingredient_id: 'ing_olives', quantity_base: 50, unit: 'g', is_optional: true, role: 'secondary' },
      { ingredient_id: 'ing_capres', quantity_base: 1, unit: 'c.à.s', is_optional: true, role: 'secondary' },
    ],
    steps: [
      {
        step_number: 1,
        instruction_fr:
          "Grillez les piments, les tomates et les gousses d'ail en chemise directement sur la flamme, au charbon ou sous le gril du four à 220 °C, en les retournant, 15 à 20 minutes jusqu'à ce que la peau soit noircie et cloquée.",
        instruction_derja:
          'Ichwi el felfel, et-tmatem w swaba3 el thoum b 9echrethom 3al nar, 3al fa7m walla fel four 3la 220 °C, w 9allabhom 15 l 20 d9i9a 7atta yet7ar9ou w yetna99ou.',
        instruction_ar:
          'اشوِ الفلفل والطماطم وفصوص الثوم بقشرها على اللهب أو الفحم أو تحت شواية الفرن على 220 درجة، مع التقليب 15 إلى 20 دقيقة حتى تسودّ القشرة وتنتفخ.',
      },
      {
        step_number: 2,
        instruction_fr:
          'Enfermez-les 10 minutes dans un sac ou un saladier couvert, puis pelez-les et épépinez les piments.',
        instruction_derja: '7otthom 10 d9aye9 f sachet walla ga3a mghattia, ba3d 9acharhom w na77i zri3et el felfel.',
        instruction_ar: 'ضعها 10 دقائق في كيس أو وعاء مغطى، ثم قشّرها وانزع بذور الفلفل.',
      },
      {
        step_number: 3,
        instruction_fr:
          "Faites cuire les œufs 10 minutes dans l'eau bouillante, refroidissez-les à l'eau froide et écalez-les.",
        instruction_derja: 'Salle9 el 3dham 10 d9aye9 fel ma ysa99ar, bardhom bel ma bared w 9acharhom.',
        instruction_ar: 'اسلق البيض 10 دقائق في الماء المغلي، ثم برّده بالماء البارد وقشّره.',
      },
      {
        step_number: 4,
        instruction_fr:
          "Hachez finement au couteau ou pilez au mortier les piments, les tomates et l'ail avec le tabel-karwiya, le sel et le jus de citron.",
        instruction_derja:
          '9atta3 bel sekkina rfi3 walla od9 fel mehraz el felfel, et-tmatem wel thoum m3a tabel w karwiya, el mel7 w 3ossir el 9ares.',
        instruction_ar:
          'افرم بالسكين فرماً ناعماً أو ادقّ في المهراس الفلفل والطماطم والثوم مع التابل والكروية والملح وعصير الليمون.',
      },
      {
        step_number: 5,
        instruction_fr:
          "Étalez dans un plat, arrosez d'huile d'olive et garnissez de thon émietté, d'œufs coupés en quartiers, d'olives et de câpres.",
        instruction_derja:
          'Farrech fi sa7n, sobb 3liha zit zitouna w zayyenha b ton mfarrak, 3dham m9assma rbou3, zitoun w kabbar.',
        instruction_ar:
          'افرشها في صحن، واسكب فوقها زيت الزيتون، وزيّنها بالتن المفتت والبيض المقطع أرباعاً والزيتون والكبّار.',
      },
    ],
    chef_tip: {
      fr: 'Bannissez le mixeur : la mechouia doit garder du grain et le goût fumé de la peau brûlée, que seul le couteau ou le mehraz préservent.',
      derja:
        'Ma testa3mel-ch el mixeur: el mechouia lazemha tab9a fiha 7abba w ri7t el 7ar9a, w hedha ma ya3tih ken es-sekkina walla el mehraz.',
      ar: 'لا تستعمل الخلاط، فالمشوية يجب أن تبقى محببة بنكهة الشواء المدخنة، وهذا لا يحفظه إلا السكين أو المهراس.',
    },
    is_published: true,
    is_healthy: true,
  },
  {
    id: 'rec_tn_31_salade_de_carottes_au_cumin',
    slug: 'salade-de-carottes-au-cumin',
    name_fr: 'Salade de carottes au cumin',
    name_derja: 'Slata sfenarya bel kamoun',
    name_ar: 'سلطة الجزر بالكمون',
    description_fr:
      "Des rondelles de carottes juste tendres, marinées tièdes dans l'ail, le cumin, le citron et l'huile d'olive : fraîche, simple et pleine de goût.",
    description_derja:
      'Sfenarya m9assa dwayer mtayba chwaya, tetna9a3 skhouna f thoum, kamoun, 9ares w zit zitouna: slata bechya w bnina.',
    description_ar:
      'حلقات جزر طرية قليلاً، تُتبّل دافئة بالثوم والكمون والليمون وزيت الزيتون، سلطة منعشة وبسيطة ولذيذة.',
    image_url: '',
    prep_time_minutes: 10,
    cook_time_minutes: 12,
    base_servings: 4,
    estimated_cost_tnd: 4.5,
    category: 'entree',
    cuisine_type: 'economique',
    difficulty: 'facile',
    ingredients: [
      { ingredient_id: 'ing_carotte', quantity_base: 750, unit: 'g', role: 'key' },
      { ingredient_id: 'ing_cumin', quantity_base: 1, unit: 'c.à.c', role: 'key' },
      { ingredient_id: 'ing_ail', quantity_base: 2, unit: 'gousses', role: 'staple' },
      {
        ingredient_id: 'ing_citron',
        quantity_base: 1,
        unit: 'pièce',
        role: 'secondary',
        substitutes: ['ing_vinaigre'],
      },
      { ingredient_id: 'ing_huile_olive', quantity_base: 3, unit: 'c.à.s', role: 'staple' },
      { ingredient_id: 'ing_sel_poivre', quantity_base: 1, unit: 'pincée', role: 'staple' },
      { ingredient_id: 'ing_harissa', quantity_base: 1, unit: 'c.à.c', is_optional: true, role: 'staple' },
      { ingredient_id: 'ing_persil', quantity_base: 0.5, unit: 'botte', is_optional: true, role: 'secondary' },
    ],
    steps: [
      {
        step_number: 1,
        instruction_fr: "Épluchez les carottes et coupez-les en rondelles d'un demi-centimètre.",
        instruction_derja: '9achar es-sfenarya w 9osha dwayer noss cm.',
        instruction_ar: 'قشّر الجزر وقطّعه حلقات بسمك نصف سنتيمتر.',
      },
      {
        step_number: 2,
        instruction_fr:
          "Faites-les cuire 10 à 12 minutes dans l'eau bouillante salée : elles doivent être tendres mais encore légèrement fermes. Égouttez.",
        instruction_derja:
          'Tayybha 10 l 12 d9i9a f ma ysa99ar fih mel7: lazem tetteyeb ama tab9a chwaya s7i7a. Safiha.',
        instruction_ar: 'اطهه 10 إلى 12 دقيقة في ماء مغلي مملح، يجب أن يكون طرياً لكن متماسكاً قليلاً، ثم صفّه.',
      },
      {
        step_number: 3,
        instruction_fr:
          "Pendant la cuisson, mélangez l'ail écrasé, le cumin, le jus de citron, l'huile, le sel et l'harissa si vous l'aimez relevée.",
        instruction_derja:
          'Fi wa9t et-tayba, khallet el thoum marfoukh, el kamoun, 3ossir el 9ares, ez-zit, el mel7 wel hrisa ken t7ebbha 7arra.',
        instruction_ar: 'أثناء الطهي، اخلط الثوم المهروس والكمون وعصير الليمون والزيت والملح والهريسة إن أردتها حارة.',
      },
      {
        step_number: 4,
        instruction_fr:
          "Versez l'assaisonnement sur les carottes encore chaudes, mélangez et laissez mariner 30 minutes au frais avant de parsemer de persil haché.",
        instruction_derja:
          'Sobb et-tatbila 3la es-sfenarya w hiya skhouna, 9allab w khalliha 30 d9i9a fel frigo 9bal ma trach el ma3dnous m9atta3.',
        instruction_ar: 'اسكب التتبيلة على الجزر وهو ساخن، قلّب واتركه 30 دقيقة في الثلاجة قبل رشّ البقدونس المفروم.',
      },
    ],
    chef_tip: {
      fr: "Assaisonnez les carottes à la sortie de l'eau : chaudes, elles absorbent l'ail et le cumin jusqu'au cœur, froides elles restent fades.",
      derja:
        'Tabbel es-sfenarya ki tokhrej mel ma: skhouna tochrob el thoum wel kamoun 7atta lel 9alb, bardha tab9a bla mdha9.',
      ar: 'تبّل الجزر فور خروجه من الماء، فهو ساخناً يمتص الثوم والكمون حتى القلب، وبارداً يبقى بلا طعم.',
    },
    is_published: true,
    is_healthy: true,
  },
  {
    id: 'rec_tn_32_brik_au_thon_et_fromage',
    slug: 'brik-au-thon-et-fromage',
    name_fr: 'Brik au thon et fromage',
    name_derja: 'Brik bel ton wel fromage',
    name_ar: 'بريك بالتن والجبن',
    description_fr:
      "La brik croustillante qui ouvre les repas de Ramadan : thon, persil et fromage autour d'un œuf au jaune coulant, frite en quelques secondes.",
    description_derja:
      'El brik el ta9ra9 elli t7ell biha sfra Romdhan: ton, ma3dnous w fromage dayer b 3dha mrayba, tet9la fi thwani.',
    description_ar: 'البريك المقرمش الذي تُفتتح به موائد رمضان: تن وبقدونس وجبن حول بيضة بصفار سائل، يُقلى في ثوانٍ.',
    image_url: '',
    prep_time_minutes: 15,
    cook_time_minutes: 10,
    base_servings: 4,
    estimated_cost_tnd: 10.5,
    category: 'entree',
    cuisine_type: 'traditionnelle',
    difficulty: 'moyen',
    ingredients: [
      { ingredient_id: 'ing_malsouka', quantity_base: 4, unit: 'feuilles', role: 'key' },
      { ingredient_id: 'ing_thon_boite', quantity_base: 1, unit: 'boîte', role: 'key' },
      { ingredient_id: 'ing_oeuf', quantity_base: 4, unit: 'pièces', role: 'key' },
      { ingredient_id: 'ing_fromage_rape', quantity_base: 60, unit: 'g', role: 'secondary' },
      { ingredient_id: 'ing_persil', quantity_base: 0.5, unit: 'botte', role: 'secondary' },
      { ingredient_id: 'ing_oignon', quantity_base: 0.5, unit: 'pièce', is_optional: true, role: 'secondary' },
      {
        ingredient_id: 'ing_huile_vegetale',
        quantity_base: 200,
        unit: 'ml',
        role: 'staple',
        substitutes: ['ing_huile_olive'],
      },
      { ingredient_id: 'ing_sel_poivre', quantity_base: 1, unit: 'pincée', role: 'staple' },
      { ingredient_id: 'ing_capres', quantity_base: 1, unit: 'c.à.c', is_optional: true, role: 'secondary' },
      { ingredient_id: 'ing_citron', quantity_base: 1, unit: 'pièce', is_optional: true, role: 'secondary' },
    ],
    steps: [
      {
        step_number: 1,
        instruction_fr:
          "Mélangez le thon égoutté et émietté avec le persil et l'oignon finement hachés, le fromage râpé, les câpres et une pincée de poivre.",
        instruction_derja:
          'Khallet el ton msaffi w mfarrak m3a el ma3dnous wel basla m9atta3in rfi3, el fromage, el kabbar w rachet bzar.',
        instruction_ar:
          'اخلط التن المصفّى والمفتت مع البقدونس والبصل المفرومين ناعماً والجبن المبشور والكبّار ورشة فلفل أسود.',
      },
      {
        step_number: 2,
        instruction_fr:
          "Chauffez 1,5 cm d'huile dans une poêle à 170 °C : un morceau de feuille doit grésiller et dorer en 10 secondes.",
        instruction_derja: 'Skhan 1,5 cm zit f me9la 3la 170 °C: tarf malsouka lazem ytaktak w yet7ammar f 10 tsenya.',
        instruction_ar:
          'سخّن زيتاً بارتفاع سنتيمتر ونصف في مقلاة على 170 درجة، فيجب أن تطقطق قطعة من الورقة وتتحمّر في 10 ثوانٍ.',
      },
      {
        step_number: 3,
        instruction_fr:
          'Posez une feuille sur une assiette, disposez un quart de la farce en couronne au centre et cassez un œuf au milieu.',
        instruction_derja: '7ott war9a 3la sa7n, 7ott rbo3 el 7achwa kif el 3ach fel wost w faqqes 3dha fi wostha.',
        instruction_ar: 'ضع ورقة على صحن، ورتّب ربع الحشوة على شكل عش في الوسط واكسر بيضة في منتصفها.',
      },
      {
        step_number: 4,
        instruction_fr:
          "Repliez aussitôt en demi-lune, glissez la brik dans l'huile et faites-la frire environ 1 minute par face en l'arrosant, jusqu'à ce qu'elle soit dorée.",
        instruction_derja:
          'Twi el war9a fel 7in kif noss 9mar, zle9 el brik fez-zit w 9alliha d9i9a 3la kol jnab w enti tsobb 3liha zit, 7atta tet7ammar.',
        instruction_ar:
          'اطوِ الورقة فوراً على شكل نصف قمر، وأزلق البريك في الزيت واقلها نحو دقيقة لكل جهة مع سكب الزيت فوقها حتى تتحمّر.',
      },
      {
        step_number: 5,
        instruction_fr: 'Égouttez sur du papier absorbant et servez immédiatement avec un quartier de citron.',
        instruction_derja: 'Safiha 3la war9 nachef w 9addemha fel 7in m3a tarf 9ares.',
        instruction_ar: 'صفّها على ورق ماص وقدّمها فوراً مع ربع ليمونة.',
      },
    ],
    chef_tip: {
      fr: "Garnissez chaque brik à côté de la poêle et pliez-la en une seconde : si l'œuf attend sur la feuille, il la ramollit et elle se déchire en la soulevant.",
      derja:
        'Jahhez kol brik 7dha el me9la w twiha f tsenya: ken el 3dha to93ed fel war9a trattebha w tet9atta3 ki terfa3ha.',
      ar: 'جهّز كل بريكة بجانب المقلاة واطوها في ثانية، فإن بقيت البيضة على الورقة ليّنتها فتتمزق عند رفعها.',
    },
    is_published: true,
    is_healthy: false,
  },
  {
    id: 'rec_tn_33_brik_aux_crevettes',
    slug: 'brik-aux-crevettes',
    name_fr: 'Brik aux crevettes',
    name_derja: 'Brik bel 9ambri',
    name_ar: 'بريك بالقمبري',
    description_fr:
      "Une brik festive garnie de crevettes sautées à l'ail et au persil, avec un œuf fondant au cœur d'une feuille dorée et croustillante.",
    description_derja:
      'Brik mta3 el 3id m7achya b 9ambri m9li bel thoum wel ma3dnous, w 3dha mrayba fi 9alb war9a ta9ra9.',
    description_ar: 'بريك احتفالي محشو بالقمبري المقلي بالثوم والبقدونس، مع بيضة طرية في قلب ورقة ذهبية مقرمشة.',
    image_url: '',
    prep_time_minutes: 20,
    cook_time_minutes: 12,
    base_servings: 4,
    estimated_cost_tnd: 13,
    category: 'entree',
    cuisine_type: 'traditionnelle',
    difficulty: 'moyen',
    ingredients: [
      { ingredient_id: 'ing_malsouka', quantity_base: 4, unit: 'feuilles', role: 'key' },
      { ingredient_id: 'ing_crevettes', quantity_base: 250, unit: 'g', role: 'key' },
      { ingredient_id: 'ing_oeuf', quantity_base: 4, unit: 'pièces', role: 'key' },
      {
        ingredient_id: 'ing_persil',
        quantity_base: 0.5,
        unit: 'botte',
        role: 'secondary',
        substitutes: ['ing_coriandre'],
      },
      { ingredient_id: 'ing_ail', quantity_base: 2, unit: 'gousses', role: 'staple' },
      {
        ingredient_id: 'ing_huile_vegetale',
        quantity_base: 200,
        unit: 'ml',
        role: 'staple',
        substitutes: ['ing_huile_olive'],
      },
      { ingredient_id: 'ing_sel_poivre', quantity_base: 1, unit: 'pincée', role: 'staple' },
      { ingredient_id: 'ing_fromage_rape', quantity_base: 40, unit: 'g', is_optional: true, role: 'secondary' },
      { ingredient_id: 'ing_citron', quantity_base: 1, unit: 'pièce', is_optional: true, role: 'secondary' },
    ],
    steps: [
      {
        step_number: 1,
        instruction_fr: 'Décortiquez les crevettes, retirez le boyau noir et coupez-les en morceaux de 1 cm.',
        instruction_derja: '9achar el 9ambri, na77i el khit el ka7el w 9ossou tro7 1 cm.',
        instruction_ar: 'قشّر القمبري وانزع الخيط الأسود وقطّعه قطعاً بحجم سنتيمتر واحد.',
      },
      {
        step_number: 2,
        instruction_fr:
          "Faites-les sauter 2 minutes dans une cuillère d'huile avec l'ail haché, juste jusqu'à ce qu'elles rosissent, puis égouttez-les soigneusement.",
        instruction_derja:
          '9allihom d9i9tin f mgharfa zit m3a el thoum m9atta3, ken 7atta yetbadel lounhom lel wardi, ba3d safihom mlih.',
        instruction_ar: 'اقلِه دقيقتين في ملعقة زيت مع الثوم المفروم حتى يصبح لونه وردياً فقط، ثم صفّه جيداً.',
      },
      {
        step_number: 3,
        instruction_fr: 'Mélangez les crevettes tièdes avec le persil haché, le fromage, le sel et le poivre.',
        instruction_derja: 'Khallet el 9ambri fater m3a el ma3dnous m9atta3, el fromage, el mel7 wel bzar.',
        instruction_ar: 'اخلط القمبري الفاتر مع البقدونس المفروم والجبن والملح والفلفل الأسود.',
      },
      {
        step_number: 4,
        instruction_fr:
          "Chauffez l'huile de friture à 175 °C. Déposez un quart de la garniture sur une feuille, creusez un puits, cassez-y un œuf et pliez en triangle en rabattant deux côtés.",
        instruction_derja:
          'Skhan zit el 9alya 3la 175 °C. 7ott rbo3 el 7achwa 3la war9a, a3mel 7ofra fel wost, faqqes fiha 3dha w tweha mthallth b zouz jnab.',
        instruction_ar:
          'سخّن زيت القلي على 175 درجة، ثم ضع ربع الحشوة على ورقة واصنع حفرة في الوسط واكسر فيها بيضة واطوِ الورقة على شكل مثلث من جهتين.',
      },
      {
        step_number: 5,
        instruction_fr:
          "Faites frire 1 minute de chaque côté jusqu'à ce que la feuille soit blonde et croustillante, égouttez et servez aussitôt avec du citron.",
        instruction_derja:
          '9alliha d9i9a 3la kol jnab 7atta tetla3 dhahbya w ta9ra9, safiha w 9addemha fel 7in m3a el 9ares.',
        instruction_ar: 'اقلها دقيقة على كل جهة حتى تصبح الورقة ذهبية مقرمشة، ثم صفّها وقدّمها فوراً مع الليمون.',
      },
    ],
    chef_tip: {
      fr: "Égouttez bien le jus rendu par les crevettes avant de garnir : c'est lui qui détrempe la malsouka et la fait éclater dans l'huile.",
      derja:
        'Safi mlih el ma elli yokhrej mel 9ambri 9bal ma te7chi: houwa elli yrattab el malsouka w yfarga3ha fez-zit.',
      ar: 'صفِّ جيداً العصارة التي يخرجها القمبري قبل الحشو، فهي التي تليّن الملسوقة وتجعلها تنفجر في الزيت.',
    },
    is_published: true,
    is_healthy: false,
  },
  {
    id: 'rec_tn_34_makrouna_bel_salsa_vegetarie',
    slug: 'makrouna-a-la-sauce-aux-legumes',
    name_fr: 'Makrouna à la sauce aux légumes',
    name_derja: 'Makrouna bel salsa w el khodhra',
    name_ar: 'مقرونة بصلصة الخضر',
    description_fr:
      "Des pâtes cuites directement dans une sauce rouge tunisienne à l'harissa, avec aubergine, poivron et courgette fondants : généreux et sans viande.",
    description_derja:
      'Makrouna tetteyeb toul fel salsa el 7amra bel hrisa, m3a bdenjen, felfel w 9ra3 rteb: makla tchabba3 w bla l7am.',
    description_ar: 'مقرونة تُطهى مباشرة في صلصة حمراء تونسية بالهريسة مع باذنجان وفلفل وكوسة طرية، طبق سخي بلا لحم.',
    image_url: '',
    prep_time_minutes: 20,
    cook_time_minutes: 35,
    base_servings: 4,
    estimated_cost_tnd: 10,
    category: 'plat_principal',
    cuisine_type: 'vegetarienne',
    difficulty: 'facile',
    ingredients: [
      { ingredient_id: 'ing_pates', quantity_base: 400, unit: 'g', role: 'key' },
      { ingredient_id: 'ing_aubergine', quantity_base: 1, unit: 'pièce', role: 'secondary' },
      { ingredient_id: 'ing_poivron', quantity_base: 1, unit: 'pièce', role: 'secondary', substitutes: ['ing_piment'] },
      { ingredient_id: 'ing_courgette', quantity_base: 1, unit: 'pièce', role: 'secondary' },
      { ingredient_id: 'ing_tomate', quantity_base: 3, unit: 'pièces', role: 'secondary' },
      { ingredient_id: 'ing_oignon', quantity_base: 1, unit: 'pièce', role: 'secondary' },
      { ingredient_id: 'ing_tomate_concentree', quantity_base: 2, unit: 'c.à.s', role: 'secondary' },
      { ingredient_id: 'ing_ail', quantity_base: 4, unit: 'gousses', role: 'staple' },
      { ingredient_id: 'ing_harissa', quantity_base: 1, unit: 'c.à.s', role: 'staple' },
      { ingredient_id: 'ing_tabel_karwiya', quantity_base: 1, unit: 'c.à.c', role: 'staple' },
      { ingredient_id: 'ing_huile_olive', quantity_base: 4, unit: 'c.à.s', role: 'staple' },
      { ingredient_id: 'ing_sel_poivre', quantity_base: 1, unit: 'pincée', role: 'staple' },
      { ingredient_id: 'ing_fromage_rape', quantity_base: 50, unit: 'g', is_optional: true, role: 'secondary' },
    ],
    steps: [
      {
        step_number: 1,
        instruction_fr:
          "Coupez l'aubergine, le poivron et la courgette en dés de 1,5 cm, émincez l'oignon et râpez les tomates.",
        instruction_derja: '9oss el bdenjen, el felfel wel 9ra3 k3ab 1,5 cm, 9oss el basla rfi3a w 7okk et-tmatem.',
        instruction_ar:
          'قطّع الباذنجان والفلفل والكوسة مكعبات بحجم سنتيمتر ونصف، وقطّع البصل شرائح رفيعة، واِبشر الطماطم.',
      },
      {
        step_number: 2,
        instruction_fr: "Faites dorer l'aubergine seule dans 2 cuillères d'huile pendant 6 minutes, puis retirez-la.",
        instruction_derja: '7ammar el bdenjen wa7dou f zouz mgharef zit 6 d9aye9, ba3d na77ih.',
        instruction_ar: 'حمّر الباذنجان وحده في ملعقتين من الزيت 6 دقائق، ثم ارفعه.',
      },
      {
        step_number: 3,
        instruction_fr:
          "Dans la même marmite, faites revenir l'oignon et le poivron 5 minutes avec le reste d'huile, ajoutez l'ail, la tomate concentrée, l'harissa et le tabel-karwiya, puis les tomates râpées, et laissez cuire 5 minutes.",
        instruction_derja:
          'F nafs et-tanjra, 9alli el basla wel felfel 5 d9aye9 bel zit el ba9i, zid el thoum, tmatem ma3jouna, hrisa w tabel w karwiya, ba3d et-tmatem m7akka w khalliha 5 d9aye9.',
        instruction_ar:
          'في نفس القدر، شوّح البصل والفلفل 5 دقائق في بقية الزيت، ثم أضف الثوم والطماطم المعجونة والهريسة والتابل والكروية، ثم الطماطم المبشورة واتركها 5 دقائق.',
      },
      {
        step_number: 4,
        instruction_fr:
          "Remettez l'aubergine avec la courgette, versez 1,2 L d'eau, salez et laissez bouillir 10 minutes.",
        instruction_derja: 'Rajja3 el bdenjen m3a el 9ra3, sobb litre w 200 ml ma, mallah w khalliha teghli 10 d9aye9.',
        instruction_ar: 'أعد الباذنجان مع الكوسة، واسكب لتراً ومائتي مليلتر من الماء، ملّح واتركها تغلي 10 دقائق.',
      },
      {
        step_number: 5,
        instruction_fr:
          "Versez les pâtes directement dans la sauce et faites-les cuire 12 à 14 minutes en remuant souvent, en ajoutant un peu d'eau chaude si besoin, jusqu'à ce qu'elles soient al dente et enrobées.",
        instruction_derja:
          'Zid el makrouna toul fel salsa w tayybha 12 l 14 d9i9a w 7arrak barcha, zid chwaya ma skhoun ken lazem, 7atta tetteyeb w tlas9 fiha es-salsa.',
        instruction_ar:
          'أضف المقرونة مباشرة إلى الصلصة واطهها 12 إلى 14 دقيقة مع التحريك المتكرر، وأضف قليلاً من الماء الساخن عند الحاجة حتى تنضج وتكتسي بالصلصة.',
      },
      {
        step_number: 6,
        instruction_fr: 'Couvrez hors du feu 5 minutes et servez avec du fromage râpé.',
        instruction_derja: 'Ghattiha ba3d ma tetfi en-nar 5 d9aye9 w 9addemha bel fromage.',
        instruction_ar: 'غطّها بعد إطفاء النار 5 دقائق وقدّمها مع الجبن المبشور.',
      },
    ],
    chef_tip: {
      fr: 'Cuire les pâtes dans la sauce à la tunisienne leur fait boire tout le goût, et leur amidon épaissit la salsa sans rien ajouter.',
      derja:
        'Ki ttayyeb el makrouna fel salsa 3la tounsi, tochrob el mdha9 el kol, w en-nacha mte3ha t5athen es-salsa wa7dha.',
      ar: 'طهي المقرونة في الصلصة على الطريقة التونسية يجعلها تمتص كل النكهة، ونشاها يكثّف الصلصة دون إضافة أي شيء.',
    },
    is_published: true,
    is_healthy: true,
  },
  {
    id: 'rec_tn_35_ojja_vegetarienne_aux_pois_c',
    slug: 'ojja-vegetarienne-aux-pois-chiches',
    name_fr: 'Ojja végétarienne aux pois chiches',
    name_derja: 'Ojja bel 7oummos',
    name_ar: 'عجة بالحمص',
    description_fr:
      "Une ojja sans viande mais pleine de caractère : pois chiches fondants dans une sauce tomate pimentée, couronnés d'œufs au jaune coulant.",
    description_derja: 'Ojja bla l7am ama bnina: 7oummos rteb f salsa tmatem 7arra, w fo9ha 3dham mraybin.',
    description_ar: 'عجة بلا لحم لكنها غنية بالنكهة: حمص طري في صلصة طماطم حارة يعلوه بيض بصفار سائل.',
    image_url: '',
    prep_time_minutes: 10,
    cook_time_minutes: 25,
    base_servings: 4,
    estimated_cost_tnd: 8,
    category: 'plat_principal',
    cuisine_type: 'vegetarienne',
    difficulty: 'facile',
    ingredients: [
      { ingredient_id: 'ing_pois_chiches', quantity_base: 300, unit: 'g', role: 'key' },
      { ingredient_id: 'ing_oeuf', quantity_base: 4, unit: 'pièces', role: 'key' },
      { ingredient_id: 'ing_tomate', quantity_base: 4, unit: 'pièces', role: 'secondary' },
      {
        ingredient_id: 'ing_piment',
        quantity_base: 2,
        unit: 'pièces',
        role: 'secondary',
        substitutes: ['ing_poivron'],
      },
      { ingredient_id: 'ing_tomate_concentree', quantity_base: 1, unit: 'c.à.s', role: 'staple' },
      { ingredient_id: 'ing_ail', quantity_base: 4, unit: 'gousses', role: 'staple' },
      { ingredient_id: 'ing_harissa', quantity_base: 1, unit: 'c.à.s', role: 'staple' },
      { ingredient_id: 'ing_tabel_karwiya', quantity_base: 1, unit: 'c.à.c', role: 'staple' },
      { ingredient_id: 'ing_huile_olive', quantity_base: 3, unit: 'c.à.s', role: 'staple' },
      { ingredient_id: 'ing_sel_poivre', quantity_base: 1, unit: 'pincée', role: 'staple' },
      { ingredient_id: 'ing_persil', quantity_base: 0.5, unit: 'botte', is_optional: true, role: 'secondary' },
    ],
    steps: [
      {
        step_number: 1,
        instruction_fr:
          'Utilisez des pois chiches déjà cuits (ou trempés une nuit puis cuits 1 heure), rincés et égouttés.',
        instruction_derja: 'Esta3mel 7oummos mtayeb (walla mna9a3 lila w mtayeb sa3a), maghsoul w msaffi.',
        instruction_ar: 'استعمل حمصاً مطبوخاً مسبقاً (أو منقوعاً ليلة ومطبوخاً ساعة)، مغسولاً ومصفّى.',
      },
      {
        step_number: 2,
        instruction_fr:
          "Dans une poêle large, faites revenir l'ail écrasé, l'harissa, la tomate concentrée et le tabel-karwiya dans l'huile 1 minute.",
        instruction_derja:
          'F me9la wes3a, 9alli el thoum marfoukh, el hrisa, tmatem ma3jouna w tabel w karwiya fez-zit d9i9a.',
        instruction_ar:
          'في مقلاة واسعة، شوّح الثوم المهروس والهريسة والطماطم المعجونة والتابل والكروية في الزيت دقيقة واحدة.',
      },
      {
        step_number: 3,
        instruction_fr:
          'Ajoutez les tomates râpées et les piments coupés en rondelles, puis laissez cuire 5 minutes à feu moyen.',
        instruction_derja: 'Zid et-tmatem m7akka wel felfel m9ass dwayer, w khalliha 5 d9aye9 3la nar motawasta.',
        instruction_ar: 'أضف الطماطم المبشورة والفلفل المقطع حلقات، واتركها 5 دقائق على نار متوسطة.',
      },
      {
        step_number: 4,
        instruction_fr:
          "Incorporez les pois chiches avec 200 ml d'eau, écrasez-en quelques-uns à la fourchette et laissez mijoter 10 minutes pour qu'ils s'imprègnent de sauce.",
        instruction_derja:
          'Zid el 7oummos m3a 200 ml ma, farrak chwaya menou bel forchetta w khallih 10 d9aye9 bech yochrob es-salsa.',
        instruction_ar: 'أضف الحمص مع 200 مليلتر من الماء، واهرس بعض حباته بالشوكة، واتركه 10 دقائق ليتشرب الصلصة.',
      },
      {
        step_number: 5,
        instruction_fr:
          "Creusez 4 puits, cassez-y les œufs, couvrez et laissez cuire 4 minutes à feu doux jusqu'à ce que les blancs soient pris ; parsemez de persil.",
        instruction_derja:
          'A3mel 4 7ofrat, faqqes fihom el 3dham, ghatti w khalliha 4 d9aye9 3la nar hadya 7atta yechedd el abyedh; rach el ma3dnous.',
        instruction_ar:
          'اصنع 4 حفر واكسر فيها البيض، غطّ المقلاة واتركها 4 دقائق على نار هادئة حتى يتماسك البياض، ثم رشّ البقدونس.',
      },
    ],
    chef_tip: {
      fr: "Écraser une poignée de pois chiches dans la sauce lui donne du corps et l'empêche de rester liquide sous les œufs.",
      derja: 'Ki tfarrak 7fna 7oummos fel salsa tet9al w ma to93ed-ch ma ta7t el 3dham.',
      ar: 'هرس حفنة من الحمص في الصلصة يمنحها قواماً ويمنعها من البقاء سائلة تحت البيض.',
    },
    is_published: true,
    is_healthy: true,
  },
  {
    id: 'rec_tn_36_kafteji_au_four',
    slug: 'kafteji-au-four',
    name_fr: 'Kafteji au four',
    name_derja: 'Kafteji fel four',
    name_ar: 'كفتاجي في الفرن',
    description_fr:
      "Tout le goût du kafteji avec beaucoup moins d'huile : légumes rôtis au four puis hachés au couteau avec piments grillés et œufs.",
    description_derja:
      'Mdha9 el kafteji kollou b zit a9al barcha: khodhra mechwiya fel four w m9atta3a bel sekkina m3a felfel mechwi w 3dham.',
    description_ar: 'كل نكهة الكفتاجي بزيت أقل بكثير: خضر محمّرة في الفرن ثم مفرومة بالسكين مع فلفل مشوي وبيض.',
    image_url: '',
    prep_time_minutes: 20,
    cook_time_minutes: 45,
    base_servings: 4,
    estimated_cost_tnd: 9,
    category: 'plat_principal',
    cuisine_type: 'vegetarienne',
    difficulty: 'facile',
    ingredients: [
      { ingredient_id: 'ing_piment', quantity_base: 4, unit: 'pièces', role: 'key', substitutes: ['ing_poivron'] },
      { ingredient_id: 'ing_oeuf', quantity_base: 4, unit: 'pièces', role: 'key' },
      { ingredient_id: 'ing_pomme_de_terre', quantity_base: 500, unit: 'g', role: 'secondary' },
      { ingredient_id: 'ing_courgette', quantity_base: 2, unit: 'pièces', role: 'secondary' },
      { ingredient_id: 'ing_potiron', quantity_base: 250, unit: 'g', role: 'secondary' },
      { ingredient_id: 'ing_aubergine', quantity_base: 1, unit: 'pièce', is_optional: true, role: 'secondary' },
      { ingredient_id: 'ing_tomate', quantity_base: 3, unit: 'pièces', role: 'secondary' },
      { ingredient_id: 'ing_ail', quantity_base: 2, unit: 'gousses', role: 'staple' },
      { ingredient_id: 'ing_tabel_karwiya', quantity_base: 1, unit: 'c.à.c', role: 'staple' },
      { ingredient_id: 'ing_huile_olive', quantity_base: 4, unit: 'c.à.s', role: 'staple' },
      { ingredient_id: 'ing_sel_poivre', quantity_base: 1, unit: 'pincée', role: 'staple' },
    ],
    steps: [
      {
        step_number: 1,
        instruction_fr:
          "Préchauffez le four à 220 °C. Coupez les pommes de terre, les courgettes, le potiron et l'aubergine en cubes de 2 cm.",
        instruction_derja:
          'Skhan el four 3la 220 °C. 9oss el batata, el 9ra3 el akhdhar wel a7mar wel bdenjen k3ab 2 cm.',
        instruction_ar:
          'سخّن الفرن على 220 درجة، وقطّع البطاطا والكوسة والقرع الأحمر والباذنجان مكعبات بحجم سنتيمترين.',
      },
      {
        step_number: 2,
        instruction_fr:
          "Mélangez-les avec 3 cuillères d'huile et du sel, étalez-les en une seule couche sur deux plaques et rôtissez 35 à 40 minutes en les retournant à mi-cuisson.",
        instruction_derja:
          'Khalthom m3a 3 mgharef zit w mel7, farrechhom tab9a wa7da 3la zouz plaket w ichwihom 35 l 40 d9i9a w 9allabhom fel noss.',
        instruction_ar:
          'اخلطها مع 3 ملاعق زيت وملح، وافرشها طبقة واحدة على صينيتين، واشوها 35 إلى 40 دقيقة مع قلبها في المنتصف.',
      },
      {
        step_number: 3,
        instruction_fr:
          "En même temps, rôtissez les piments et les tomates entiers 25 minutes jusqu'à ce que leur peau se boursoufle, puis pelez-les et épépinez les piments.",
        instruction_derja:
          'Fi nafs el wa9t, ichwi el felfel wet-tmatem kemlin 25 d9i9a 7atta yetna99ou, ba3d 9acharhom w na77i zri3et el felfel.',
        instruction_ar:
          'في نفس الوقت، اشوِ الفلفل والطماطم كاملة 25 دقيقة حتى تنتفخ قشرتها، ثم قشّرها وانزع بذور الفلفل.',
      },
      {
        step_number: 4,
        instruction_fr:
          "Faites cuire les œufs au plat dans une cuillère d'huile, jusqu'à ce que les jaunes soient à moitié pris.",
        instruction_derja: 'Tayyeb el 3dham 3youn f mgharfa zit, 7atta yechedd el asfar b noss.',
        instruction_ar: 'اطهُ البيض عيوناً في ملعقة زيت حتى يتماسك الصفار إلى النصف.',
      },
      {
        step_number: 5,
        instruction_fr:
          "Sur une planche, hachez avec deux couteaux les piments, les tomates et l'ail avec le tabel-karwiya, puis ajoutez les légumes rôtis et les œufs et hachez grossièrement le tout ensemble.",
        instruction_derja:
          '3la louha, 9atta3 b zouz skaken el felfel, et-tmatem wel thoum m3a tabel w karwiya, ba3d zid el khodhra el mechwiya wel 3dham w 9atta3 kol chay m3a b3adhou mouch rfi3.',
        instruction_ar:
          'على لوح، افرم بسكينين الفلفل والطماطم والثوم مع التابل والكروية، ثم أضف الخضر المشوية والبيض وافرم الكل معاً فرماً خشناً.',
      },
      {
        step_number: 6,
        instruction_fr: 'Servez tiède avec du pain, ou en sandwich.',
        instruction_derja: '9addmou fater m3a el khobz walla f kaskrout.',
        instruction_ar: 'قدّمه فاتراً مع الخبز أو في شطيرة.',
      },
    ],
    chef_tip: {
      fr: "Ne surchargez jamais les plaques : des légumes entassés cuisent à la vapeur et ne dorent pas, alors qu'une seule couche donne le goût de friture.",
      derja:
        'Ma t3abbi-ch el plaket barcha: el khodhra ki tkoun fo9 b3adhha tetteyeb bel bokhar w ma tet7ammar-ch, tab9a wa7da ta3tik mdha9 el 9alya.',
      ar: 'لا تملأ الصواني أكثر من اللازم، فالخضر المكدسة تُطهى بالبخار ولا تتحمّر، بينما الطبقة الواحدة تعطي طعم القلي.',
    },
    is_published: true,
    is_healthy: true,
  },
  {
    id: 'rec_tn_37_chakchouka_aux_courgettes',
    slug: 'chakchouka-aux-courgettes',
    name_fr: 'Chakchouka aux courgettes',
    name_derja: 'Chakchouka bel 9ra3',
    name_ar: 'شكشوكة بالقرع',
    description_fr:
      "Une chakchouka d'été où les courgettes fondent dans la sauce aux oignons, tomates et piments, avant d'accueillir des œufs pochés.",
    description_derja:
      'Chakchouka mta3 es-sif, el 9ra3 yetteyeb fel salsa bel basla, et-tmatem wel felfel, w fel e5er el 3dham.',
    description_ar: 'شكشوكة صيفية تذوب فيها الكوسة في صلصة البصل والطماطم والفلفل قبل أن يُضاف إليها البيض.',
    image_url: '',
    prep_time_minutes: 15,
    cook_time_minutes: 30,
    base_servings: 4,
    estimated_cost_tnd: 7.5,
    category: 'plat_principal',
    cuisine_type: 'vegetarienne',
    difficulty: 'facile',
    ingredients: [
      { ingredient_id: 'ing_courgette', quantity_base: 3, unit: 'pièces', role: 'key' },
      { ingredient_id: 'ing_oeuf', quantity_base: 4, unit: 'pièces', role: 'key' },
      { ingredient_id: 'ing_tomate', quantity_base: 4, unit: 'pièces', role: 'secondary' },
      { ingredient_id: 'ing_oignon', quantity_base: 1, unit: 'pièce', role: 'secondary' },
      {
        ingredient_id: 'ing_piment',
        quantity_base: 2,
        unit: 'pièces',
        role: 'secondary',
        substitutes: ['ing_poivron'],
      },
      { ingredient_id: 'ing_tomate_concentree', quantity_base: 1, unit: 'c.à.s', role: 'staple' },
      { ingredient_id: 'ing_ail', quantity_base: 3, unit: 'gousses', role: 'staple' },
      { ingredient_id: 'ing_harissa', quantity_base: 1, unit: 'c.à.c', role: 'staple' },
      { ingredient_id: 'ing_tabel_karwiya', quantity_base: 1, unit: 'c.à.c', role: 'staple' },
      { ingredient_id: 'ing_huile_olive', quantity_base: 3, unit: 'c.à.s', role: 'staple' },
      { ingredient_id: 'ing_sel_poivre', quantity_base: 1, unit: 'pincée', role: 'staple' },
    ],
    steps: [
      {
        step_number: 1,
        instruction_fr:
          "Coupez les courgettes en demi-rondelles de 1 cm, émincez l'oignon et les piments et râpez les tomates.",
        instruction_derja: '9oss el 9ra3 noss dwayer 1 cm, 9oss el basla wel felfel rfi3 w 7okk et-tmatem.',
        instruction_ar: 'قطّع الكوسة أنصاف حلقات بسمك سنتيمتر واحد، وقطّع البصل والفلفل شرائح رفيعة، واِبشر الطماطم.',
      },
      {
        step_number: 2,
        instruction_fr:
          "Faites fondre l'oignon dans l'huile 5 minutes jusqu'à ce qu'il soit translucide, puis ajoutez les piments 3 minutes.",
        instruction_derja: 'Tayyeb el basla fez-zit 5 d9aye9 7atta tetla3 chaffafa, ba3d zid el felfel 3 d9aye9.',
        instruction_ar: 'اطهُ البصل في الزيت 5 دقائق حتى يصبح شفافاً، ثم أضف الفلفل 3 دقائق.',
      },
      {
        step_number: 3,
        instruction_fr:
          "Ajoutez l'ail, la tomate concentrée, l'harissa et le tabel-karwiya, puis les tomates râpées et 150 ml d'eau ; laissez réduire 8 minutes.",
        instruction_derja:
          'Zid el thoum, tmatem ma3jouna, hrisa w tabel w karwiya, ba3d et-tmatem m7akka w 150 ml ma; khalliha t9atter 8 d9aye9.',
        instruction_ar:
          'أضف الثوم والطماطم المعجونة والهريسة والتابل والكروية، ثم الطماطم المبشورة و150 مليلتر من الماء، واتركها تتكثف 8 دقائق.',
      },
      {
        step_number: 4,
        instruction_fr:
          'Ajoutez les courgettes, salez, couvrez et laissez cuire 10 minutes : elles doivent être tendres mais garder leur forme.',
        instruction_derja: 'Zid el 9ra3, mallah, ghatti w khallih 10 d9aye9: lazem yetteyeb ama yo93ed s7i7.',
        instruction_ar: 'أضف الكوسة وملّح وغطّ واتركها 10 دقائق، يجب أن تنضج مع الحفاظ على شكلها.',
      },
      {
        step_number: 5,
        instruction_fr:
          'Cassez les œufs un à un sur les légumes, couvrez et laissez cuire 5 minutes à feu doux ; servez dans la poêle avec du pain.',
        instruction_derja:
          'Faqqes el 3dham wa7da wa7da fo9 el khodhra, ghatti w khalliha 5 d9aye9 3la nar hadya; 9addemha fel me9la m3a el khobz.',
        instruction_ar:
          'اكسر البيض واحدة تلو الأخرى فوق الخضر، غطّ واتركها 5 دقائق على نار هادئة، وقدّمها في المقلاة مع الخبز.',
      },
    ],
    chef_tip: {
      fr: "Ajoutez les courgettes seulement quand la sauce a réduit : elles rendent beaucoup d'eau et transformeraient une sauce encore liquide en soupe.",
      derja: 'Zid el 9ra3 ken ki es-salsa t9atter: yokhrej barcha ma, w ken es-salsa mazelet ma tetrja3 chorba.',
      ar: 'لا تضف الكوسة إلا بعد أن تتكثف الصلصة، فهي تُخرج ماءً كثيراً يحوّل الصلصة السائلة إلى شوربة.',
    },
    is_published: true,
    is_healthy: true,
  },
  {
    id: 'rec_tn_38_merguez_grillees_et_salade',
    slug: 'merguez-grillees-et-salade-tunisienne',
    name_fr: 'Merguez grillées et salade tunisienne',
    name_derja: 'Merguez mechwi w slata tounsia',
    name_ar: 'مرقاز مشوي وسلطة تونسية',
    description_fr:
      'Des merguez saisies au gril servies avec une slata tounsia croquante de tomates, concombre, oignon et piment, à la menthe et au citron.',
    description_derja:
      'Merguez mechwi 3al nar m3a slata tounsia fresh: tmatem, fa99ous, basla w felfel, bel na3na3 wel 9ares.',
    description_ar: 'مرقاز مشوي على النار مع سلطة تونسية مقرمشة من الطماطم والخيار والبصل والفلفل بالنعناع والليمون.',
    image_url: '',
    prep_time_minutes: 15,
    cook_time_minutes: 12,
    base_servings: 4,
    estimated_cost_tnd: 22,
    category: 'plat_principal',
    cuisine_type: 'rapide',
    difficulty: 'facile',
    ingredients: [
      { ingredient_id: 'ing_merguez', quantity_base: 600, unit: 'g', role: 'key' },
      { ingredient_id: 'ing_tomate', quantity_base: 3, unit: 'pièces', role: 'secondary' },
      { ingredient_id: 'ing_concombre', quantity_base: 1, unit: 'pièce', role: 'secondary' },
      { ingredient_id: 'ing_oignon', quantity_base: 1, unit: 'pièce', role: 'secondary' },
      { ingredient_id: 'ing_piment', quantity_base: 1, unit: 'pièce', role: 'secondary', substitutes: ['ing_poivron'] },
      { ingredient_id: 'ing_citron', quantity_base: 1, unit: 'pièce', role: 'secondary' },
      { ingredient_id: 'ing_huile_olive', quantity_base: 3, unit: 'c.à.s', role: 'staple' },
      { ingredient_id: 'ing_harissa', quantity_base: 1, unit: 'c.à.s', role: 'staple' },
      { ingredient_id: 'ing_menthe_sechee', quantity_base: 1, unit: 'c.à.c', role: 'staple' },
      { ingredient_id: 'ing_sel_poivre', quantity_base: 1, unit: 'pincée', role: 'staple' },
    ],
    steps: [
      {
        step_number: 1,
        instruction_fr:
          "Coupez les tomates, le concombre, l'oignon et le piment en tout petits dés de 5 mm et laissez-les égoutter dans une passoire.",
        instruction_derja:
          '9oss et-tmatem, el fa99ous, el basla wel felfel k3ab sghar barcha 5 mm w khallihom yetsaffew fi ghorbal.',
        instruction_ar:
          'قطّع الطماطم والخيار والبصل والفلفل مكعبات صغيرة جداً بحجم 5 مليمترات، واتركها تتصفى في مصفاة.',
      },
      {
        step_number: 2,
        instruction_fr: "Faites chauffer un gril, une plancha ou un barbecue jusqu'à ce qu'il soit très chaud.",
        instruction_derja: 'Skhan el grill walla el plancha walla el kanoun 7atta ywalli skhoun barcha.',
        instruction_ar: 'سخّن الشواية أو الصفيحة أو الكانون حتى يصبح ساخناً جداً.',
      },
      {
        step_number: 3,
        instruction_fr:
          "Grillez les merguez sans les piquer pendant 8 à 10 minutes, en les retournant régulièrement, jusqu'à ce qu'elles soient bien colorées partout.",
        instruction_derja:
          'Ichwi el merguez bla ma tetso3hom 8 l 10 d9aye9 w 9allabhom dima, 7atta yet7ammrou mel jihet el kol.',
        instruction_ar: 'اشوِ المرقاز دون وخزه 8 إلى 10 دقائق مع التقليب المنتظم حتى يتحمّر من كل الجهات.',
      },
      {
        step_number: 4,
        instruction_fr:
          "Au dernier moment, assaisonnez la salade de jus de citron, d'huile d'olive, de sel et de menthe séchée émiettée.",
        instruction_derja: 'Fel e5er e5er, tabbel es-slata b 3ossir 9ares, zit zitouna, mel7 w na3na3 yebes mfarrak.',
        instruction_ar: 'في اللحظة الأخيرة، تبّل السلطة بعصير الليمون وزيت الزيتون والملح والنعناع المجفف المفروك.',
      },
      {
        step_number: 5,
        instruction_fr:
          "Servez les merguez brûlantes avec la salade, un peu d'harissa détendue à l'huile d'olive et du pain.",
        instruction_derja: '9addem el merguez skhoun m3a es-slata, chwaya hrisa mkhaltta b zit zitouna w khobz.',
        instruction_ar: 'قدّم المرقاز ساخناً مع السلطة وقليل من الهريسة الممزوجة بزيت الزيتون والخبز.',
      },
    ],
    chef_tip: {
      fr: 'Ne piquez jamais les merguez : percées, elles perdent leur jus épicé sur les braises et deviennent sèches.',
      derja: 'Ma tetso3-ch el merguez: ki tetsa3 ykhrej mennou el ma el 7ar 3al jamr w ywalli yebes.',
      ar: 'لا تخز المرقاز أبداً، فإذا ثُقب فقد عصارته المتبلة على الجمر وأصبح جافاً.',
    },
    is_published: true,
    is_healthy: false,
  },
  {
    id: 'rec_tn_39_poulet_roti_aux_epices_tunis',
    slug: 'poulet-roti-aux-epices-tunisiennes',
    name_fr: 'Poulet rôti aux épices tunisiennes',
    name_derja: 'Djej fel four bel tabel',
    name_ar: 'دجاج في الفرن بالتوابل التونسية',
    description_fr:
      "Des morceaux de poulet marinés à l'ail, au tabel-karwiya, au curcuma et au citron, rôtis sur un lit de pommes de terre qui boivent tout le jus.",
    description_derja:
      'Djej mna9a3 fel thoum, tabel w karwiya, ker9om w 9ares, mechwi fel four fo9 batata tochrob el mra9 el kol.',
    description_ar:
      'قطع دجاج متبّلة بالثوم والتابل والكروية والكركم والليمون، تُشوى في الفرن فوق بطاطا تتشرب كل العصارة.',
    image_url: '',
    prep_time_minutes: 15,
    cook_time_minutes: 60,
    base_servings: 4,
    estimated_cost_tnd: 21,
    category: 'plat_principal',
    cuisine_type: 'familiale',
    difficulty: 'facile',
    ingredients: [
      { ingredient_id: 'ing_poulet', quantity_base: 1.2, unit: 'kg', role: 'key' },
      { ingredient_id: 'ing_citron', quantity_base: 2, unit: 'pièces', role: 'secondary' },
      { ingredient_id: 'ing_pomme_de_terre', quantity_base: 600, unit: 'g', role: 'secondary' },
      { ingredient_id: 'ing_ail', quantity_base: 6, unit: 'gousses', role: 'staple' },
      { ingredient_id: 'ing_tabel_karwiya', quantity_base: 2, unit: 'c.à.c', role: 'staple' },
      { ingredient_id: 'ing_curcuma', quantity_base: 1, unit: 'c.à.c', role: 'staple' },
      { ingredient_id: 'ing_paprika', quantity_base: 1, unit: 'c.à.c', role: 'staple' },
      { ingredient_id: 'ing_harissa', quantity_base: 1, unit: 'c.à.s', role: 'staple' },
      { ingredient_id: 'ing_huile_olive', quantity_base: 4, unit: 'c.à.s', role: 'staple' },
      { ingredient_id: 'ing_sel_poivre', quantity_base: 1, unit: 'pincée', role: 'staple' },
    ],
    steps: [
      {
        step_number: 1,
        instruction_fr:
          "Préparez la marinade : ail écrasé, tabel-karwiya, curcuma, paprika, harissa, jus d'un citron, huile d'olive et sel.",
        instruction_derja:
          'Jahhez et-tatbila: thoum marfoukh, tabel w karwiya, ker9om, felfel a7mar 7lou, hrisa, 3ossir 9ares wa7ed, zit zitouna w mel7.',
        instruction_ar: 'حضّر التتبيلة: ثوم مهروس وتابل وكروية وكركم وفلفل حلو وهريسة وعصير ليمونة وزيت زيتون وملح.',
      },
      {
        step_number: 2,
        instruction_fr:
          'Entaillez les morceaux de poulet, massez-les avec la marinade en la glissant sous la peau et laissez reposer au moins 2 heures au réfrigérateur.',
        instruction_derja:
          'Ochrot 9to3 ed-djej, dalekhom bet-tatbila w dakhelha ta7t el jeld, w khallihom 3al a9al sa3tin fel frigo.',
        instruction_ar:
          'اصنع شقوقاً في قطع الدجاج، ودلّكها بالتتبيلة مع إدخالها تحت الجلد، واتركها ساعتين على الأقل في الثلاجة.',
      },
      {
        step_number: 3,
        instruction_fr:
          "Préchauffez le four à 200 °C. Coupez les pommes de terre en quartiers, étalez-les dans un plat, posez le poulet dessus avec le second citron en quartiers et versez 100 ml d'eau au fond.",
        instruction_derja:
          'Skhan el four 3la 200 °C. 9oss el batata rbou3, farrechha f sa7n, 7ott ed-djej fo9ha m3a el 9ares et-thani m9assam w sobb 100 ml ma fel 9a3a.',
        instruction_ar:
          'سخّن الفرن على 200 درجة، وقطّع البطاطا أرباعاً وافرشها في صحن، وضع الدجاج فوقها مع الليمونة الثانية مقطعة أرباعاً، واسكب 100 مليلتر من الماء في القاع.',
      },
      {
        step_number: 4,
        instruction_fr:
          "Rôtissez 50 à 60 minutes en arrosant de jus toutes les 20 minutes, jusqu'à ce que le jus qui sort de la cuisse piquée soit clair.",
        instruction_derja:
          'Ichwih 50 l 60 d9i9a w sobb 3lih mel mra9 kol 20 d9i9a, 7atta ki tetso3 el fakhdha yokhrej mennha ma safi.',
        instruction_ar: 'اشوِه 50 إلى 60 دقيقة مع سكب العصارة فوقه كل 20 دقيقة، حتى يخرج من الفخذ عند وخزه سائل صافٍ.',
      },
      {
        step_number: 5,
        instruction_fr:
          'Passez 5 minutes sous le gril pour une peau croustillante, puis laissez reposer 5 minutes avant de servir.',
        instruction_derja:
          '7ottou 5 d9aye9 ta7t el grill bech yet9ar9ech el jeld, w khallih yertah 5 d9aye9 9bal ma t9addmou.',
        instruction_ar: 'ضعه 5 دقائق تحت الشواية ليتقرمش الجلد، ثم اتركه يرتاح 5 دقائق قبل التقديم.',
      },
    ],
    chef_tip: {
      fr: "Marinez la veille : une nuit au frais permet au citron et au tabel de pénétrer jusqu'à l'os et rend la chair beaucoup plus tendre.",
      derja:
        'Na99a3 ed-djej mel lila: lila fel frigo tkhalli el 9ares wet-tabel yod5lou 7atta lel 3adhm w el l7am yowalli rteb barcha.',
      ar: 'تبّل الدجاج من الليلة السابقة، فليلة في الثلاجة تجعل الليمون والتابل يصلان إلى العظم وتجعل اللحم أطرى بكثير.',
    },
    is_published: true,
    is_healthy: true,
  },
  {
    id: 'rec_tn_40_ragout_de_pommes_de_terre_au',
    slug: 'ragout-de-pommes-de-terre-au-boeuf',
    name_fr: 'Ragoût de pommes de terre au bœuf',
    name_derja: 'Mar9et batata bel l7am',
    name_ar: 'مرقة البطاطا باللحم',
    description_fr:
      "Une mar9a familiale où le bœuf mijote longuement dans une sauce rouge au tabel avant d'accueillir des pommes de terre qui fondent dans la bouche.",
    description_derja:
      'Mar9a mta3 el dar, el l7am yetteyeb 3la mahlou f salsa 7amra bel tabel, w ba3d tod5el el batata w tdoub fel fom.',
    description_ar: 'مرقة عائلية يُطهى فيها لحم البقر طويلاً في صلصة حمراء بالتابل قبل إضافة بطاطا تذوب في الفم.',
    image_url: '',
    prep_time_minutes: 15,
    cook_time_minutes: 80,
    base_servings: 4,
    estimated_cost_tnd: 24,
    category: 'plat_principal',
    cuisine_type: 'traditionnelle',
    difficulty: 'facile',
    ingredients: [
      { ingredient_id: 'ing_boeuf', quantity_base: 500, unit: 'g', role: 'key', substitutes: ['ing_agneau'] },
      { ingredient_id: 'ing_pomme_de_terre', quantity_base: 800, unit: 'g', role: 'key' },
      { ingredient_id: 'ing_oignon', quantity_base: 1, unit: 'pièce', role: 'secondary' },
      { ingredient_id: 'ing_tomate_concentree', quantity_base: 2, unit: 'c.à.s', role: 'secondary' },
      { ingredient_id: 'ing_ail', quantity_base: 3, unit: 'gousses', role: 'staple' },
      { ingredient_id: 'ing_harissa', quantity_base: 1, unit: 'c.à.c', role: 'staple' },
      { ingredient_id: 'ing_tabel_karwiya', quantity_base: 1, unit: 'c.à.c', role: 'staple' },
      { ingredient_id: 'ing_piment_moulu', quantity_base: 1, unit: 'c.à.c', role: 'staple' },
      { ingredient_id: 'ing_huile_olive', quantity_base: 4, unit: 'c.à.s', role: 'staple' },
      { ingredient_id: 'ing_sel_poivre', quantity_base: 1, unit: 'pincée', role: 'staple' },
      { ingredient_id: 'ing_persil', quantity_base: 0.5, unit: 'botte', is_optional: true, role: 'secondary' },
    ],
    steps: [
      {
        step_number: 1,
        instruction_fr:
          "Coupez le bœuf en cubes de 3 cm et faites-le revenir 8 minutes dans l'huile avec l'oignon râpé, le sel, le tabel-karwiya et le piment moulu, jusqu'à ce que la viande soit saisie.",
        instruction_derja:
          '9oss el l7am k3ab 3 cm w 9allih 8 d9aye9 fez-zit m3a el basla m7akka, el mel7, tabel w karwiya w felfel zina, 7atta yet9ayyed el l7am.',
        instruction_ar:
          'قطّع لحم البقر مكعبات بحجم 3 سنتيمترات وشوّحه 8 دقائق في الزيت مع البصل المبشور والملح والتابل والكروية والفلفل الأحمر المطحون حتى يتحمّر.',
      },
      {
        step_number: 2,
        instruction_fr:
          "Ajoutez l'ail écrasé, la tomate concentrée et l'harissa et faites frire 2 minutes jusqu'à ce que l'huile devienne rouge.",
        instruction_derja: 'Zid el thoum marfoukh, tmatem ma3jouna wel hrisa w 9allihom d9i9tin 7atta yo7mar ez-zit.',
        instruction_ar: 'أضف الثوم المهروس والطماطم المعجونة والهريسة واقلها دقيقتين حتى يحمرّ الزيت.',
      },
      {
        step_number: 3,
        instruction_fr:
          "Versez 1 L d'eau, couvrez et laissez mijoter 50 minutes à feu doux, jusqu'à ce que la viande soit tendre sous la fourchette.",
        instruction_derja:
          'Sobb litre ma, ghatti w khalliha 50 d9i9a 3la nar hadya, 7atta yetteyeb el l7am w tod5lou el forchetta bel sahel.',
        instruction_ar: 'اسكب لتراً من الماء، غطّ القدر واتركه 50 دقيقة على نار هادئة حتى يطرى اللحم تحت الشوكة.',
      },
      {
        step_number: 4,
        instruction_fr:
          "Ajoutez les pommes de terre coupées en quartiers, complétez d'eau à hauteur si nécessaire et poursuivez 20 à 25 minutes.",
        instruction_derja:
          'Zid el batata m9assma rbou3, kammel bel ma 9addha ken lazem w khalliha 20 l 25 d9i9a o5rin.',
        instruction_ar: 'أضف البطاطا المقطعة أرباعاً، وأكمل الماء بقدر ما يغطيها إن لزم، واتركها 20 إلى 25 دقيقة أخرى.',
      },
      {
        step_number: 5,
        instruction_fr:
          "La mar9a est prête quand les pommes de terre sont fondantes, que la sauce a réduit de moitié et qu'un filet d'huile rouge remonte en surface ; parsemez de persil.",
        instruction_derja:
          'El mar9a tetteyeb ki el batata tadhrob, es-salsa t9atter b noss w yetla3 ez-zit el a7mar fo9; rach el ma3dnous.',
        instruction_ar:
          'تكون المرقة جاهزة عندما تطرى البطاطا وتتكثف الصلصة إلى النصف ويطفو الزيت الأحمر على السطح، ثم رشّ البقدونس.',
      },
    ],
    chef_tip: {
      fr: "Ne mettez les pommes de terre qu'une fois la viande tendre : ajoutées trop tôt, elles s'effritent et troublent la sauce bien avant que le bœuf soit cuit.",
      derja:
        'Ma tzid-ch el batata ken ba3d ma yetteyeb el l7am: ken tzidha bekri tetfarrak w t5alli es-salsa 3akra 9bal ma yetteyeb el l7am.',
      ar: 'لا تضف البطاطا إلا بعد أن يطرى اللحم، فإذا أُضيفت مبكراً تفتتت وعكّرت الصلصة قبل نضج اللحم.',
    },
    is_published: true,
    is_healthy: false,
  },
  {
    id: 'rec_tn_41_pates_tunisiennes_aux_fruits',
    slug: 'makarouna-aux-fruits-de-mer',
    name_fr: 'Makarouna aux fruits de mer',
    name_derja: 'Makarouna bel 7out wel crevette',
    name_ar: 'مقرونة بثمار البحر',
    description_fr:
      "Des spaghettis enrobés d'une sauce tomate relevée à la harissa, avec crevettes et morceaux de poisson : le plat du dimanche des villes côtières.",
    description_derja:
      'Spaghetti f salsa 7arra bel hrisa, crevette w 9ta3 7out: makla mta3 el a7ad fel mdon 3la el b7ar.',
    description_ar: 'سباغيتي في صلصة طماطم حارة بالهريسة مع القمبري وقطع السمك، طبق يوم الأحد في المدن الساحلية.',
    image_url: '',
    prep_time_minutes: 25,
    cook_time_minutes: 30,
    base_servings: 4,
    estimated_cost_tnd: 21,
    category: 'plat_principal',
    cuisine_type: 'traditionnelle',
    difficulty: 'moyen',
    ingredients: [
      { ingredient_id: 'ing_pates', quantity_base: 400, unit: 'g', role: 'key' },
      { ingredient_id: 'ing_crevettes', quantity_base: 400, unit: 'g', role: 'key' },
      { ingredient_id: 'ing_poisson_frais', quantity_base: 300, unit: 'g', role: 'secondary' },
      { ingredient_id: 'ing_tomate', quantity_base: 3, unit: 'pièces', role: 'secondary' },
      { ingredient_id: 'ing_tomate_concentree', quantity_base: 2, unit: 'c.à.s', role: 'staple' },
      { ingredient_id: 'ing_ail', quantity_base: 4, unit: 'gousses', role: 'staple' },
      { ingredient_id: 'ing_harissa', quantity_base: 1, unit: 'c.à.s', role: 'staple' },
      { ingredient_id: 'ing_tabel_karwiya', quantity_base: 1, unit: 'c.à.c', role: 'staple' },
      { ingredient_id: 'ing_huile_olive', quantity_base: 5, unit: 'c.à.s', role: 'staple' },
      { ingredient_id: 'ing_sel_poivre', quantity_base: 1, unit: 'pincée', role: 'staple' },
      { ingredient_id: 'ing_persil', quantity_base: 0.5, unit: 'botte', is_optional: true, role: 'secondary' },
    ],
    steps: [
      {
        step_number: 1,
        instruction_fr:
          'Décortiquez les crevettes en gardant les têtes et carapaces. Coupez le poisson en gros cubes sans arêtes et salez-le légèrement.',
        instruction_derja:
          'Na77i 9chour el crevette w khabbi er-rous wel 9chour. 9oss el 7out k3ab kbar bla 7sak w mall7ou chwaya.',
        instruction_ar: 'قشّر القمبري واحتفظ بالرؤوس والقشور، وقطّع السمك مكعبات كبيرة دون حسك ورشّه بقليل من الملح.',
      },
      {
        step_number: 2,
        instruction_fr:
          "Faites revenir têtes et carapaces 3 minutes dans 2 c.à.s d'huile en les écrasant, ajoutez 50 cl d'eau, laissez frémir 10 minutes puis filtrez : c'est votre fumet.",
        instruction_derja:
          '9alli er-rous wel 9chour 3 d9aye9 f zouz mgharef zit w ochtom-hom, zid nos litre ma, khalliha tbaggar 10 d9aye9 w saffiha: hadha el mra9 mta3ek.',
        instruction_ar:
          'حمّر الرؤوس والقشور 3 دقائق في ملعقتين من الزيت مع هرسها، أضف نصف لتر ماء واتركه يغلي بهدوء 10 دقائق ثم صفّه لتحصل على مرق السمك.',
      },
      {
        step_number: 3,
        instruction_fr:
          "Dans une sauteuse, faites chauffer le reste d'huile avec l'ail écrasé, la tomate concentrée, la harissa et le tabel-karwiya pendant 2 minutes, puis ajoutez les tomates râpées et le fumet. Laissez réduire 12 minutes.",
        instruction_derja:
          'F tajine 3amil, sakhan b9iyet ez-zit m3a et-thoum el marfoukh, et-tmatem el ma3jouna, el hrisa wet-tabel w karwiya d9ii9tin, ba3d zid et-tmatem el m7akka wel mra9. Khalliha t9oss 12 d9i9a.',
        instruction_ar:
          'في قدر واسع سخّن باقي الزيت مع الثوم المهروس والطماطم المعجونة والهريسة والتابل والكروية دقيقتين، ثم أضف الطماطم المبشورة والمرق واتركها تتكثف 12 دقيقة.',
      },
      {
        step_number: 4,
        instruction_fr:
          "Plongez les cubes de poisson dans la sauce 5 minutes sans remuer, puis les crevettes 2 minutes seulement, jusqu'à ce qu'elles deviennent roses.",
        instruction_derja:
          'Ghattes 9ta3 el 7out fel salsa 5 d9aye9 bla ma t7arrek, ba3d el crevette d9ii9tin bark 7atta twalli wardiya.',
        instruction_ar: 'ضع قطع السمك في الصلصة 5 دقائق دون تحريك، ثم القمبري دقيقتين فقط حتى يصبح لونه وردياً.',
      },
      {
        step_number: 5,
        instruction_fr:
          'Cuisez les spaghettis 2 minutes de moins que le temps indiqué dans une eau bien salée, égouttez et terminez la cuisson 2 minutes dans la sauce en mélangeant délicatement. Parsemez de persil.',
        instruction_derja:
          'Tayyeb es-spaghetti f ma mal7 d9ii9tin 9bal el wa9t el mektoub, saffih w kammel tayybou d9ii9tin fel salsa b chwaya. Rech ma3dnous.',
        instruction_ar:
          'اطهُ السباغيتي في ماء مملّح دقيقتين أقل من الوقت المكتوب، صفّه وأكمل طهيه دقيقتين في الصلصة مع التقليب بلطف، ثم رشّ البقدونس.',
      },
    ],
    chef_tip: {
      fr: "Le secret du goût marin, c'est le fumet maison fait avec les carapaces : ne les jetez jamais, elles donnent plus de saveur que les crevettes elles-mêmes.",
      derja: 'Sirr ta3m el b7ar howa el mra9 mta3 el 9chour: matlou7hech, fihom ta3m akther mel crevette ro7ha.',
      ar: 'سرّ نكهة البحر هو المرق المحضّر من القشور، لا ترمها أبداً فهي تعطي نكهة أقوى من القمبري نفسه.',
    },
    is_published: true,
    is_healthy: false,
  },
  {
    id: 'rec_tn_42_salade_de_betterave_et_uf',
    slug: 'salade-de-betterave-a-l-oeuf',
    name_fr: "Salade de betterave à l'œuf",
    name_derja: 'Slata bettrave bel 3dham',
    name_ar: 'سلطة البنجر بالبيض',
    description_fr:
      "Des cubes de betterave fondants assaisonnés au cumin et au citron, couronnés d'œufs durs et d'oignon : une entrée colorée de toutes les tables de Ramadan.",
    description_derja:
      'K3ab bettrave m3a kammoun w 9ares, w fo9ha 3dham msalla9 w bsal: slata mlawna ma tghibch 3la mayda Ramdhan.',
    description_ar:
      'مكعبات بنجر طرية متبّلة بالكمون والليمون مع البيض المسلوق والبصل، مقبّلة ملوّنة لا تغيب عن موائد رمضان.',
    image_url: '',
    prep_time_minutes: 15,
    cook_time_minutes: 45,
    base_servings: 4,
    estimated_cost_tnd: 6.5,
    category: 'entree',
    cuisine_type: 'economique',
    difficulty: 'facile',
    ingredients: [
      { ingredient_id: 'ing_betterave', quantity_base: 3, unit: 'pièces', role: 'key' },
      { ingredient_id: 'ing_oeuf', quantity_base: 4, unit: 'pièces', role: 'key' },
      { ingredient_id: 'ing_oignon', quantity_base: 1, unit: 'pièce', role: 'secondary' },
      {
        ingredient_id: 'ing_citron',
        quantity_base: 1,
        unit: 'pièce',
        role: 'secondary',
        substitutes: ['ing_vinaigre'],
      },
      { ingredient_id: 'ing_huile_olive', quantity_base: 3, unit: 'c.à.s', role: 'staple' },
      { ingredient_id: 'ing_cumin', quantity_base: 0.5, unit: 'c.à.c', role: 'staple' },
      { ingredient_id: 'ing_sel_poivre', quantity_base: 1, unit: 'pincée', role: 'staple' },
      { ingredient_id: 'ing_persil', quantity_base: 0.5, unit: 'botte', is_optional: true, role: 'secondary' },
      { ingredient_id: 'ing_olives', quantity_base: 50, unit: 'g', is_optional: true, role: 'secondary' },
    ],
    steps: [
      {
        step_number: 1,
        instruction_fr:
          "Lavez les betteraves sans les éplucher ni couper les racines, couvrez-les d'eau froide et faites-les cuire 40 à 45 minutes : la pointe d'un couteau doit entrer sans résistance.",
        instruction_derja:
          'Ghsel el bettrave bla ma t9acharha wala t9oss jdourha, ghattiha b ma bared w tayyebha 40 l 45 d9i9a: rass es-sekkina lazem yodkhol sahel.',
        instruction_ar:
          'اغسل البنجر دون تقشيره ولا قطع جذوره، غطّه بالماء البارد واطهه 40 إلى 45 دقيقة حتى تدخل السكين بسهولة.',
      },
      {
        step_number: 2,
        instruction_fr:
          "Pendant ce temps, faites cuire les œufs 10 minutes dans l'eau bouillante, puis plongez-les dans l'eau froide avant de les écaler.",
        instruction_derja:
          'F nafs el wa9t, salla9 el 3dham 10 d9aye9 fel ma yeghli, ba3d 7otthom f ma bared 9bal ma t9acharhom.',
        instruction_ar: 'في الأثناء اسلق البيض 10 دقائق في الماء المغلي، ثم ضعه في الماء البارد قبل تقشيره.',
      },
      {
        step_number: 3,
        instruction_fr:
          "Pelez les betteraves tièdes (la peau glisse sous les doigts), coupez-les en dés et émincez l'oignon en fines lamelles.",
        instruction_derja:
          '9achar el bettrave w hiya dafya (el 9char yetna77a bel sbe3), 9ossha k3ab sghar w 9oss el bsal chra2e7 rgay9.',
        instruction_ar: 'قشّر البنجر وهو دافئ فالقشرة تنزلق بالأصابع، وقطّعه مكعبات صغيرة، وقطّع البصل شرائح رقيقة.',
      },
      {
        step_number: 4,
        instruction_fr:
          "Fouettez l'huile d'olive, le jus de citron, le cumin, le sel et le poivre, versez sur les betteraves et l'oignon et laissez mariner 15 minutes.",
        instruction_derja:
          'Khabbet zit zitouna, 3assir el 9ares, el kammoun, el mel7 wel felfel, sebbou 3al bettrave wel bsal w khallih ychrab 15 d9i9a.',
        instruction_ar:
          'اخفق زيت الزيتون وعصير الليمون والكمون والملح والفلفل، واسكبه على البنجر والبصل واتركه يتشرّب 15 دقيقة.',
      },
      {
        step_number: 5,
        instruction_fr:
          "Dressez dans un plat, disposez les œufs coupés en quartiers par-dessus et décorez d'olives et de persil haché.",
        instruction_derja:
          '7ott es-slata f s7an, sayyef el 3dham m9assin rbo3 mel fo9 w zayyen bel zitoun wel ma3dnous el m9assas.',
        instruction_ar: 'ضع السلطة في صحن، ورتّب فوقها البيض المقطّع أرباعاً، وزيّنها بالزيتون والبقدونس المفروم.',
      },
    ],
    chef_tip: {
      fr: "N'ajoutez les œufs qu'au moment de servir : la betterave teinte tout ce qu'elle touche et des œufs roses sont moins appétissants.",
      derja:
        'Zid el 3dham ki tji bech tsserbi bark: el bettrave tsabbegh kol chay, wel 3dham el wardi ma yfat7och en-nafs.',
      ar: 'لا تضف البيض إلا عند التقديم، فالبنجر يصبغ كل ما يلمسه والبيض الوردي أقل إثارة للشهية.',
    },
    is_published: true,
    is_healthy: true,
  },
  {
    id: 'rec_tn_43_tchakchouka_aux_pois_chiches',
    slug: 'tchakchouka-aux-pois-chiches',
    name_fr: 'Tchakchouka aux pois chiches',
    name_derja: 'Chakchouka bel 7oummous',
    name_ar: 'شكشوكة بالحمص',
    description_fr:
      "Poivrons et tomates confits à l'huile d'olive avec des pois chiches fondants et des œufs pochés dans la sauce : un plat complet et pas cher.",
    description_derja:
      'Felfel w tmatem mtayybin f zit zitouna m3a 7oummous rtab w 3dham mtayyba fel salsa: makla kamla w rkhisa.',
    description_ar: 'فلفل وطماطم مطهوة بزيت الزيتون مع حمص طري وبيض مطهو في الصلصة، طبق متكامل واقتصادي.',
    image_url: '',
    prep_time_minutes: 15,
    cook_time_minutes: 30,
    base_servings: 4,
    estimated_cost_tnd: 7.5,
    category: 'plat_principal',
    cuisine_type: 'vegetarienne',
    difficulty: 'facile',
    ingredients: [
      { ingredient_id: 'ing_pois_chiches', quantity_base: 250, unit: 'g', role: 'key' },
      { ingredient_id: 'ing_poivron', quantity_base: 2, unit: 'pièces', role: 'key', substitutes: ['ing_piment'] },
      { ingredient_id: 'ing_tomate', quantity_base: 4, unit: 'pièces', role: 'secondary' },
      { ingredient_id: 'ing_oeuf', quantity_base: 4, unit: 'pièces', role: 'secondary' },
      { ingredient_id: 'ing_oignon', quantity_base: 1, unit: 'pièce', role: 'secondary' },
      { ingredient_id: 'ing_ail', quantity_base: 3, unit: 'gousses', role: 'staple' },
      { ingredient_id: 'ing_tomate_concentree', quantity_base: 1, unit: 'c.à.s', role: 'staple' },
      { ingredient_id: 'ing_harissa', quantity_base: 1, unit: 'c.à.c', role: 'staple' },
      { ingredient_id: 'ing_cumin', quantity_base: 1, unit: 'c.à.c', role: 'staple' },
      { ingredient_id: 'ing_huile_olive', quantity_base: 4, unit: 'c.à.s', role: 'staple' },
      { ingredient_id: 'ing_sel_poivre', quantity_base: 1, unit: 'pincée', role: 'staple' },
    ],
    steps: [
      {
        step_number: 1,
        instruction_fr:
          "Si vous utilisez des pois chiches secs, faites-les tremper la veille puis cuire 45 minutes à l'eau. Avec des pois chiches cuits, rincez-les simplement.",
        instruction_derja:
          'Ken el 7oummous yabes, ghattsou mel lila w tayybou 45 d9i9a fel ma. Ken mtayyeb, ghaslou bark.',
        instruction_ar:
          'إذا استعملت الحمص اليابس فانقعه من الليلة السابقة واطهه 45 دقيقة في الماء، وإن كان مطهواً فاشطفه فقط.',
      },
      {
        step_number: 2,
        instruction_fr:
          "Faites fondre l'oignon émincé dans l'huile 5 minutes, ajoutez les poivrons en lanières et laissez-les s'attendrir 8 minutes à feu moyen.",
        instruction_derja:
          'Tayyeb el bsal el m9assas fel zit 5 d9aye9, zid el felfel m9ass sfayef w khallih yertab 8 d9aye9 3la nar motawasta.',
        instruction_ar: 'ليّن البصل المقطّع في الزيت 5 دقائق، ثم أضف الفلفل شرائح واتركه يطرى 8 دقائق على نار متوسطة.',
      },
      {
        step_number: 3,
        instruction_fr:
          "Incorporez l'ail, la tomate concentrée, la harissa et le cumin, puis les tomates en dés et les pois chiches. Mouillez d'un demi-verre d'eau et laissez compoter 10 minutes.",
        instruction_derja:
          'Zid et-thoum, et-tmatem el ma3jouna, el hrisa wel kammoun, ba3d et-tmatem k3ab wel 7oummous. Zid nos kes ma w khalliha tetsabbek 10 d9aye9.',
        instruction_ar:
          'أضف الثوم والطماطم المعجونة والهريسة والكمون، ثم مكعبات الطماطم والحمص، واسكب نصف كأس ماء واتركها تتسبّك 10 دقائق.',
      },
      {
        step_number: 4,
        instruction_fr:
          'Creusez quatre puits dans la sauce, cassez-y les œufs, salez-les, couvrez et laissez cuire 4 à 5 minutes à feu doux selon la cuisson désirée.',
        instruction_derja:
          'A3mel arba3 7ofar fel salsa, faqqes fihom el 3dham, rech chwaya mel7, ghatti w khalliha 4 wala 5 d9aye9 3la nar hadya.',
        instruction_ar:
          'اصنع أربع حفر في الصلصة واكسر فيها البيض، رشّ الملح، غطِّ واتركه 4 إلى 5 دقائق على نار هادئة حسب النضج المرغوب.',
      },
    ],
    chef_tip: {
      fr: "Écrasez grossièrement une poignée de pois chiches dans la sauce avant d'ajouter les œufs : elle devient plus onctueuse et nappe mieux le pain.",
      derja: 'Ochtom chwaya 7oummous fel salsa 9bal el 3dham: tetkhaththar w tetla99a khir 3al khobz.',
      ar: 'اهرس حفنة من الحمص في الصلصة قبل إضافة البيض، فتصبح أكثر كثافة وتلتصق بالخبز أفضل.',
    },
    is_published: true,
    is_healthy: true,
  },
  {
    id: 'rec_tn_44_riz_aux_legumes_et_pois_chic',
    slug: 'riz-aux-legumes-et-pois-chiches',
    name_fr: 'Riz aux légumes et pois chiches',
    name_derja: 'Rouz bel khodhra wel 7oummous',
    name_ar: 'أرز بالخضار والحمص',
    description_fr:
      'Un riz doré au curcuma, cuit en une seule marmite avec carottes, petits pois, poivron et pois chiches : simple, nourrissant et parfumé.',
    description_derja:
      'Rouz asfar bel 3rou9, mtayyeb f tanjra we7da m3a sfenarya, jelbana, felfel w 7oummous: sahel, ychabba3 w ri7tou tfa77.',
    description_ar: 'أرز ذهبي بالكركم مطهو في قدر واحد مع الجزر والجلبانة والفلفل والحمص، طبق بسيط مشبع وعطر.',
    image_url: '',
    prep_time_minutes: 15,
    cook_time_minutes: 30,
    base_servings: 4,
    estimated_cost_tnd: 6,
    category: 'plat_principal',
    cuisine_type: 'vegetarienne',
    difficulty: 'facile',
    ingredients: [
      { ingredient_id: 'ing_riz', quantity_base: 300, unit: 'g', role: 'key' },
      { ingredient_id: 'ing_pois_chiches', quantity_base: 150, unit: 'g', role: 'key' },
      { ingredient_id: 'ing_carotte', quantity_base: 2, unit: 'pièces', role: 'secondary' },
      { ingredient_id: 'ing_petits_pois', quantity_base: 200, unit: 'g', role: 'secondary' },
      { ingredient_id: 'ing_poivron', quantity_base: 1, unit: 'pièce', role: 'secondary', substitutes: ['ing_piment'] },
      { ingredient_id: 'ing_oignon', quantity_base: 1, unit: 'pièce', role: 'secondary' },
      { ingredient_id: 'ing_tomate_concentree', quantity_base: 1, unit: 'c.à.s', role: 'staple' },
      { ingredient_id: 'ing_curcuma', quantity_base: 1, unit: 'c.à.c', role: 'staple' },
      { ingredient_id: 'ing_huile_olive', quantity_base: 3, unit: 'c.à.s', role: 'staple' },
      { ingredient_id: 'ing_sel_poivre', quantity_base: 1, unit: 'pincée', role: 'staple' },
      { ingredient_id: 'ing_persil', quantity_base: 0.5, unit: 'botte', is_optional: true, role: 'secondary' },
    ],
    steps: [
      {
        step_number: 1,
        instruction_fr:
          "Rincez le riz à l'eau froide jusqu'à ce qu'elle soit claire et laissez-le égoutter. Coupez carottes et poivron en petits dés, hachez l'oignon.",
        instruction_derja:
          'Ghsel er-rouz b ma bared 7atta yesfa el ma w khallih yetsaffa. 9oss es-sfenarya wel felfel k3ab sghar w 9assas el bsal.',
        instruction_ar:
          'اغسل الأرز بالماء البارد حتى يصفو الماء واتركه يتصفّى، وقطّع الجزر والفلفل مكعبات صغيرة وافرم البصل.',
      },
      {
        step_number: 2,
        instruction_fr:
          "Dans une marmite, faites revenir l'oignon 4 minutes dans l'huile, ajoutez carottes et poivron et poursuivez 5 minutes.",
        instruction_derja: 'F tanjra, 9alli el bsal 4 d9aye9 fel zit, zid es-sfenarya wel felfel w kammel 5 d9aye9.',
        instruction_ar: 'في قدر حمّر البصل 4 دقائق في الزيت، ثم أضف الجزر والفلفل وواصل 5 دقائق.',
      },
      {
        step_number: 3,
        instruction_fr:
          'Ajoutez le curcuma et la tomate concentrée, puis le riz : remuez 2 minutes pour que les grains deviennent nacrés et bien enrobés.',
        instruction_derja:
          'Zid el 3rou9 wet-tmatem el ma3jouna, ba3d er-rouz: 7arrek d9ii9tin 7atta el 7abb ywalli chafef w mghatti bel salsa.',
        instruction_ar: 'أضف الكركم والطماطم المعجونة ثم الأرز، وقلّب دقيقتين حتى تصبح الحبوب لامعة ومغلّفة بالصلصة.',
      },
      {
        step_number: 4,
        instruction_fr:
          "Versez 600 ml d'eau bouillante salée, les petits pois et les pois chiches. Couvrez et cuisez 18 minutes à feu très doux, sans ouvrir.",
        instruction_derja:
          'Sobb 600 ml ma yeghli mmalla7, zid el jelbana wel 7oummous. Ghatti w tayyeb 18 d9i9a 3la nar hadya barcha, bla ma t7el el ghta.',
        instruction_ar:
          'اسكب 600 مل من الماء المغلي المملّح، وأضف الجلبانة والحمص، غطِّ واطهه 18 دقيقة على نار هادئة جداً دون فتح الغطاء.',
      },
      {
        step_number: 5,
        instruction_fr:
          'Éteignez le feu et laissez reposer 5 minutes couvert, puis égrainez à la fourchette et parsemez de persil.',
        instruction_derja:
          'Tfi en-nar w khalli er-rouz yertah 5 d9aye9 mghatti, ba3d farrdou bel forchette w rech el ma3dnous.',
        instruction_ar: 'أطفئ النار واترك الأرز يرتاح 5 دقائق مغطى، ثم فكّكه بالشوكة ورشّ البقدونس.',
      },
    ],
    chef_tip: {
      fr: 'Placez un torchon propre sous le couvercle pendant le repos : il absorbe la vapeur et donne un riz aux grains bien séparés.',
      derja: '7ott fouta ndhifa ta7t el ghta wa9t er-ra7a: tochrob el bokhar w er-rouz yokhrej 7abba 7abba.',
      ar: 'ضع منشفة نظيفة تحت الغطاء أثناء الراحة، فهي تمتص البخار وتجعل حبات الأرز منفصلة.',
    },
    is_published: true,
    is_healthy: true,
  },
  {
    id: 'rec_tn_45_poulpe_mijote_a_la_tomate',
    slug: 'poulpe-mijote-a-la-tomate',
    name_fr: 'Poulpe mijoté à la tomate',
    name_derja: 'Karnit bel salsa',
    name_ar: 'قرنيط بصلصة الطماطم',
    description_fr:
      "Le poulpe des îles Kerkennah, mijoté longuement dans une sauce tomate au piment et au carvi jusqu'à devenir fondant comme du beurre.",
    description_derja:
      'Karnit kima ya3mlouh f Kerkna, mtayyeb 3la mahlou f salsa bel felfel wel karwiya 7atta ywalli rteb kima ez-zebda.',
    description_ar: 'القرنيط على طريقة قرقنة، مطهو طويلاً في صلصة طماطم بالفلفل والكروية حتى يصبح طرياً كالزبدة.',
    image_url: '',
    prep_time_minutes: 20,
    cook_time_minutes: 75,
    base_servings: 4,
    estimated_cost_tnd: 22,
    category: 'plat_principal',
    cuisine_type: 'traditionnelle',
    difficulty: 'moyen',
    ingredients: [
      { ingredient_id: 'ing_poulpe', quantity_base: 1, unit: 'kg', role: 'key', substitutes: ['ing_crevettes'] },
      { ingredient_id: 'ing_tomate', quantity_base: 4, unit: 'pièces', role: 'secondary' },
      { ingredient_id: 'ing_tomate_concentree', quantity_base: 2, unit: 'c.à.s', role: 'secondary' },
      { ingredient_id: 'ing_oignon', quantity_base: 2, unit: 'pièces', role: 'secondary' },
      {
        ingredient_id: 'ing_piment',
        quantity_base: 2,
        unit: 'pièces',
        role: 'secondary',
        substitutes: ['ing_poivron'],
      },
      { ingredient_id: 'ing_ail', quantity_base: 5, unit: 'gousses', role: 'staple' },
      { ingredient_id: 'ing_harissa', quantity_base: 1, unit: 'c.à.c', role: 'staple' },
      { ingredient_id: 'ing_tabel_karwiya', quantity_base: 1, unit: 'c.à.c', role: 'staple' },
      { ingredient_id: 'ing_huile_olive', quantity_base: 5, unit: 'c.à.s', role: 'staple' },
      { ingredient_id: 'ing_sel_poivre', quantity_base: 1, unit: 'pincée', role: 'staple' },
      { ingredient_id: 'ing_capres', quantity_base: 1, unit: 'c.à.s', is_optional: true, role: 'secondary' },
    ],
    steps: [
      {
        step_number: 1,
        instruction_fr:
          "Nettoyez le poulpe (retirez le bec et la poche), puis plongez-le 3 fois de suite 5 secondes dans l'eau bouillante pour que les tentacules se recourbent. Faites-le cuire à couvert 30 minutes dans son propre jus, sans eau.",
        instruction_derja:
          'Naddhef el karnit (na77i el man9ar wel kis), ba3d ghattsou 3 marrat 5 thawani fel ma yeghli 7atta yetlawa. Tayybou 30 d9i9a mghatti f mé7 ro7ou, bla ma.',
        instruction_ar:
          'نظّف القرنيط بإزالة المنقار والكيس، ثم اغمسه 3 مرات لخمس ثوانٍ في الماء المغلي حتى تلتف أذرعه، واطهه مغطى 30 دقيقة في عصارته دون ماء.',
      },
      {
        step_number: 2,
        instruction_fr: 'Égouttez-le en gardant le jus rendu et coupez-le en tronçons de 3 cm.',
        instruction_derja: 'Saffih w khabbi el ma elli 3tah, w 9ossou 9ta3 3 cm.',
        instruction_ar: 'صفّه واحتفظ بالعصارة التي أخرجها، ثم قطّعه قطعاً بطول 3 سم.',
      },
      {
        step_number: 3,
        instruction_fr:
          "Faites dorer l'oignon haché 6 minutes dans l'huile, ajoutez l'ail, la tomate concentrée, la harissa et le tabel-karwiya et laissez frire 2 minutes jusqu'à ce que l'huile remonte.",
        instruction_derja:
          '7ammer el bsal el m9assas 6 d9aye9 fel zit, zid et-thoum, et-tmatem el ma3jouna, el hrisa wet-tabel w karwiya w 9alli d9ii9tin 7atta ez-zit yotla3 el fo9.',
        instruction_ar:
          'حمّر البصل المفروم 6 دقائق في الزيت، ثم أضف الثوم والطماطم المعجونة والهريسة والتابل والكروية واقلِها دقيقتين حتى يطفو الزيت.',
      },
      {
        step_number: 4,
        instruction_fr:
          "Ajoutez les tomates râpées, le poulpe et son jus complété d'eau à hauteur. Laissez mijoter 35 à 40 minutes à feu doux, jusqu'à ce que la sauce soit épaisse et le poulpe tendre.",
        instruction_derja:
          'Zid et-tmatem el m7akka, el karnit w mé7ou w kammel bel ma 7atta yghattih. Khallih yetsabbek 35 l 40 d9i9a 3la nar hadya 7atta tet9al es-salsa w yertab el karnit.',
        instruction_ar:
          'أضف الطماطم المبشورة والقرنيط مع عصارته وأكمل بالماء حتى يغمره، واتركه يتسبّك 35 إلى 40 دقيقة على نار هادئة حتى تتكثف الصلصة ويطرى القرنيط.',
      },
      {
        step_number: 5,
        instruction_fr:
          'Dix minutes avant la fin, ajoutez les piments entiers et les câpres rincées. Servez avec du pain ou des pâtes.',
        instruction_derja:
          '10 d9aye9 9bal ma yo7dher, zid el felfel kemel wel kabbar maghsoul. Sarbih bel khobz wala bel makarouna.',
        instruction_ar: 'قبل 10 دقائق من النهاية أضف الفلفل كاملاً والكبّار المغسول، وقدّمه مع الخبز أو المقرونة.',
      },
    ],
    chef_tip: {
      fr: "Un poulpe congelé puis décongelé devient plus tendre qu'un poulpe frais : les cristaux de glace cassent ses fibres. Achetez-le d'avance et mettez-le au congélateur 48 heures.",
      derja:
        'El karnit elli tjammdou w tfakkou yertab akther mel friche: et-tlej ykassar el 3rou9. Echrih bekri w 7ottou fel congélateur 48 sa3a.',
      ar: 'القرنيط المجمّد ثم المذاب يصبح أطرى من الطازج لأن بلورات الجليد تكسّر أليافه، فاشترِه مسبقاً وضعه في المجمّد 48 ساعة.',
    },
    is_published: true,
    is_healthy: true,
  },
  {
    id: 'rec_tn_46_salade_de_concombre_au_yaour',
    slug: 'salade-de-concombre-au-yaourt-et-a-la-menthe',
    name_fr: 'Salade de concombre au yaourt et à la menthe',
    name_derja: 'Slata fa99ous bel yaourt',
    name_ar: 'سلطة الفقوس بالياغورت',
    description_fr:
      "Une salade fraîche de concombre croquant dans un yaourt crémeux à l'ail et à la menthe séchée, parfaite à côté d'une grillade en été.",
    description_derja:
      'Slata bérda mta3 fa99ous m9ar9ech f yaourt bel thoum wel na3na3 el yabsa, behya barcha m3a mechwi fes-sif.',
    description_ar: 'سلطة منعشة من الفقوس المقرمش في ياغورت كريمي بالثوم والنعناع اليابس، مثالية مع المشاوي في الصيف.',
    image_url: '',
    prep_time_minutes: 15,
    cook_time_minutes: 0,
    base_servings: 4,
    estimated_cost_tnd: 5,
    category: 'entree',
    cuisine_type: 'rapide',
    difficulty: 'facile',
    ingredients: [
      { ingredient_id: 'ing_concombre', quantity_base: 600, unit: 'g', role: 'key' },
      { ingredient_id: 'ing_yaourt', quantity_base: 4, unit: 'pots', role: 'key' },
      { ingredient_id: 'ing_menthe_sechee', quantity_base: 1, unit: 'c.à.s', role: 'secondary' },
      { ingredient_id: 'ing_ail', quantity_base: 1, unit: 'gousse', role: 'staple' },
      { ingredient_id: 'ing_citron', quantity_base: 0.5, unit: 'pièce', is_optional: true, role: 'secondary' },
      { ingredient_id: 'ing_huile_olive', quantity_base: 1, unit: 'c.à.s', role: 'staple' },
      { ingredient_id: 'ing_sel_poivre', quantity_base: 1, unit: 'pincée', role: 'staple' },
    ],
    steps: [
      {
        step_number: 1,
        instruction_fr:
          'Épluchez les concombres une bande sur deux, coupez-les en deux dans la longueur et retirez les graines à la petite cuillère.',
        instruction_derja:
          '9achar el fa99ous khatt eh w khatt le, 9ossou 3la thnin bel toul w na77i el 7abb b mgharfa sghira.',
        instruction_ar: 'قشّر الفقوس شريطاً وتجاوز شريطاً، واقسمه طولياً وانزع البذور بملعقة صغيرة.',
      },
      {
        step_number: 2,
        instruction_fr:
          'Coupez-les en petits dés, salez légèrement et laissez dégorger 10 minutes dans une passoire, puis pressez-les doucement.',
        instruction_derja:
          '9ossou k3ab sghar, mall7ou chwaya w khallih fel passoire 10 d9aye9 bech ykharrej mé7ou, ba3d 3assrou b chwaya.',
        instruction_ar: 'قطّعه مكعبات صغيرة، رشّه بقليل من الملح واتركه في المصفاة 10 دقائق ليخرج ماءه، ثم اعصره برفق.',
      },
      {
        step_number: 3,
        instruction_fr:
          "Battez le yaourt avec l'ail râpé très fin, la menthe séchée frottée entre les paumes et quelques gouttes de citron.",
        instruction_derja:
          'Khabbet el yaourt m3a et-thoum m7akk rgii9 barcha, el na3na3 el yabsa mfarka bin kfoufek w chwaya 9tar 9ares.',
        instruction_ar: 'اخفق الياغورت مع الثوم المبشور ناعماً والنعناع اليابس المفروك بين الكفّين وقطرات من الليمون.',
      },
      {
        step_number: 4,
        instruction_fr:
          "Mélangez avec les concombres, réservez 20 minutes au frais et servez avec un filet d'huile d'olive et une pincée de menthe par-dessus.",
        instruction_derja:
          'Khallat-ha m3a el fa99ous, 7ottha 20 d9i9a fel frigo w sarbiha b chwaya zit zitouna w ras9a na3na3 mel fo9.',
        instruction_ar: 'اخلطه مع الفقوس، وضعه 20 دقيقة في الثلاجة، وقدّمه مع رشّة زيت زيتون وقليل من النعناع فوقه.',
      },
    ],
    chef_tip: {
      fr: 'Le dégorgement est indispensable : sans lui, le concombre rend son eau et la salade devient une soupe en quelques minutes.',
      derja: 'Lazem tkharrej ma el fa99ous: ken le, ykhalli mé7ou w es-slata twalli chorba f d9aye9.',
      ar: 'إخراج ماء الفقوس ضروري، وإلا فإنه يطلق ماءه وتتحول السلطة إلى حساء في دقائق.',
    },
    is_published: true,
    is_healthy: true,
  },
  {
    id: 'rec_tn_47_pain_tabouna_maison',
    slug: 'pain-tabouna-maison',
    name_fr: 'Pain tabouna maison',
    name_derja: 'Khobz tabouna',
    name_ar: 'خبز الطابونة',
    description_fr:
      "Le pain des campagnes tunisiennes, à la semoule et à l'huile d'olive, cuit à la poêle ou au four pour retrouver sa croûte dorée et sa mie moelleuse.",
    description_derja:
      'Khobz el 3roubiya bel smid w zit zitouna, mtayyeb fel me9la wala fel forn bech yokhrej 9churtou m7ammra w lebbtou rteba.',
    description_ar: 'خبز الأرياف التونسية بالسميد وزيت الزيتون، يُطهى في المقلاة أو الفرن لقشرة ذهبية ولبّ طري.',
    image_url: '',
    prep_time_minutes: 20,
    cook_time_minutes: 25,
    base_servings: 4,
    estimated_cost_tnd: 2,
    category: 'entree',
    cuisine_type: 'traditionnelle',
    difficulty: 'moyen',
    ingredients: [
      { ingredient_id: 'ing_couscous_fin', quantity_base: 300, unit: 'g', role: 'key' },
      { ingredient_id: 'ing_farine', quantity_base: 200, unit: 'g', role: 'secondary' },
      { ingredient_id: 'ing_levure', quantity_base: 1, unit: 'sachet', role: 'key' },
      { ingredient_id: 'ing_huile_olive', quantity_base: 4, unit: 'c.à.s', role: 'staple' },
      { ingredient_id: 'ing_sucre', quantity_base: 1, unit: 'c.à.c', role: 'staple' },
      { ingredient_id: 'ing_sel_poivre', quantity_base: 1, unit: 'c.à.c', role: 'staple' },
    ],
    steps: [
      {
        step_number: 1,
        instruction_fr:
          "Délayez la levure et le sucre dans 100 ml d'eau tiède et attendez 10 minutes qu'une mousse se forme.",
        instruction_derja: 'Dawweb el khmira wel sokkar f 100 ml ma dafi w osber 10 d9aye9 7atta ta3mel ragwa.',
        instruction_ar: 'أذب الخميرة والسكر في 100 مل من الماء الدافئ وانتظر 10 دقائق حتى تتكوّن رغوة.',
      },
      {
        step_number: 2,
        instruction_fr:
          "Dans une gasaa, mélangez la semoule fine, la farine et le sel, ajoutez 3 c.à.s d'huile et sablez entre les mains, puis la levure et environ 250 ml d'eau tiède.",
        instruction_derja:
          'F 9as3a, khallat es-smid er-rgii9, el farina wel mel7, zid 3 mgharef zit w farek bin yeddik, ba3d el khmira w 9rib 250 ml ma dafi.',
        instruction_ar:
          'في القصعة اخلط السميد الرقيق والطحين والملح، أضف 3 ملاعق زيت وافركها بين اليدين، ثم الخميرة وحوالي 250 مل من الماء الدافئ.',
      },
      {
        step_number: 3,
        instruction_fr:
          "Pétrissez 15 minutes en poussant la pâte avec le talon de la main, jusqu'à ce qu'elle soit lisse et élastique. Couvrez et laissez lever 1 heure au chaud.",
        instruction_derja:
          '3ajjen 15 d9i9a w edfa3 el 3jina b sa9 yeddek 7atta twalli mlassa w tetmatta. Ghattiha w khalliha tetkhammer sa3a f blasa skhouna.',
        instruction_ar:
          'اعجن 15 دقيقة بدفع العجين بباطن الكف حتى يصبح أملس ومطاطياً، ثم غطّه واتركه يتخمّر ساعة في مكان دافئ.',
      },
      {
        step_number: 4,
        instruction_fr:
          "Dégazez, partagez en 2 boules et aplatissez-les en disques de 2 cm d'épaisseur. Piquez la surface à la fourchette, badigeonnez d'huile et laissez gonfler encore 20 minutes.",
        instruction_derja:
          'Ekhrej el 7ass mel 3jina, 9assamha zouz kwer w batta7hom 9ras b 2 cm. Na99ab el wejh bel forchette, edhen bel zit w khallihom yentfkhou 20 d9i9a o5ra.',
        instruction_ar:
          'أخرج الهواء من العجين وقسّمه إلى كرتين وافردهما أقراصاً بسمك 2 سم، ثم اثقب السطح بالشوكة وادهنه بالزيت واتركه ينتفخ 20 دقيقة أخرى.',
      },
      {
        step_number: 5,
        instruction_fr:
          "Cuisez chaque galette dans une poêle en fonte à feu moyen-doux, couverte, 6 à 7 minutes par face, ou au four à 230°C pendant 15 minutes sur une plaque très chaude, jusqu'à ce qu'elle sonne creux.",
        instruction_derja:
          'Tayyeb kol khobza f me9la 7did 3la nar bin el hadya wel motawasta, mghattiya, 6 l 7 d9aye9 kol jiha, wala fel forn 230 daraja 15 d9i9a 3la plaque skhouna barcha, 7atta ki tadh9obha tsamma3 farga.',
        instruction_ar:
          'اطهُ كل قرص في مقلاة حديد على نار متوسطة إلى هادئة مغطاة 6 إلى 7 دقائق لكل جهة، أو في الفرن على 230 درجة 15 دقيقة فوق صفيحة ساخنة جداً حتى يصدر صوتاً أجوف عند النقر.',
      },
    ],
    chef_tip: {
      fr: "Enveloppez la tabouna dans un torchon dès la sortie du feu : la vapeur emprisonnée assouplit la croûte et garde la mie moelleuse jusqu'au repas.",
      derja:
        'Laff et-tabouna f fouta ki tna77iha mel nar: el bokhar yrattab el 9choura w ykhalli el lebba rteba 7atta lel ftour.',
      ar: 'لُفّ الطابونة في منشفة فور إخراجها، فالبخار المحبوس يليّن القشرة ويحافظ على طراوة اللبّ حتى وقت الأكل.',
    },
    is_published: true,
    is_healthy: false,
  },
  {
    id: 'rec_tn_48_assida_zgougou_simplifiee',
    slug: 'assida-zgougou',
    name_fr: 'Assida zgougou',
    name_derja: '3assidet zgougou',
    name_ar: 'عصيدة الزقوقو',
    description_fr:
      "La crème du Mouled : une bouillie veloutée de graines de pin d'Alep, nappée de crème pâtissière à la fleur d'oranger et décorée de fruits secs.",
    description_derja:
      'Ta3m el Mouled: 3assida rteba mta3 zgougou, mghattiya b crème bel ma zhar w mzayna bel fakya el yabsa.',
    description_ar: 'حلوى المولد: عصيدة ناعمة من الزقوقو تُغطّى بكريمة بماء الزهر وتُزيّن بالفواكه الجافة.',
    image_url: '',
    prep_time_minutes: 30,
    cook_time_minutes: 50,
    base_servings: 4,
    estimated_cost_tnd: 19,
    category: 'dessert',
    cuisine_type: 'traditionnelle',
    difficulty: 'avance',
    ingredients: [
      { ingredient_id: 'ing_zgougou', quantity_base: 250, unit: 'g', role: 'key' },
      { ingredient_id: 'ing_farine', quantity_base: 60, unit: 'g', role: 'secondary' },
      { ingredient_id: 'ing_sucre', quantity_base: 180, unit: 'g', role: 'staple' },
      { ingredient_id: 'ing_lait', quantity_base: 500, unit: 'ml', role: 'key' },
      { ingredient_id: 'ing_oeuf', quantity_base: 2, unit: 'pièces', role: 'secondary' },
      { ingredient_id: 'ing_maizena', quantity_base: 2, unit: 'c.à.s', role: 'staple' },
      { ingredient_id: 'ing_fleur_oranger', quantity_base: 1, unit: 'c.à.s', role: 'staple' },
      { ingredient_id: 'ing_fruits_secs', quantity_base: 60, unit: 'g', is_optional: true, role: 'secondary' },
      { ingredient_id: 'ing_amandes', quantity_base: 30, unit: 'g', is_optional: true, role: 'secondary' },
    ],
    steps: [
      {
        step_number: 1,
        instruction_fr:
          "Rincez le zgougou, mixez-le avec 1 litre d'eau 3 minutes, puis passez-le au chinois fin en pressant bien. Ajoutez encore 250 ml d'eau sur le marc, mixez et filtrez une seconde fois.",
        instruction_derja:
          'Ghsel ez-zgougou, a7rekou fel mixeur m3a litre ma 3 d9aye9, ba3d saffih f msaffa rgii9a w 3assar mlee7. Zid 250 ml ma 3al 7ethla, a7rek w saffi marra thanya.',
        instruction_ar:
          'اغسل الزقوقو واطحنه في الخلاط مع لتر من الماء 3 دقائق، ثم صفّه بمصفاة رقيقة مع العصر جيداً، وأضف 250 مل من الماء على الثفل واطحن وصفِّ مرة ثانية.',
      },
      {
        step_number: 2,
        instruction_fr:
          "Délayez la farine et 120 g de sucre dans le jus de zgougou froid, puis faites cuire à feu moyen en remuant sans arrêt avec une cuillère en bois pendant 25 à 30 minutes, jusqu'à une crème épaisse qui nappe la cuillère.",
        instruction_derja:
          'Dawweb el farina w 120 g sokkar f ma ez-zgougou w howa bared, ba3d tayyeb 3la nar motawasta w 7arrek dima b mgharfa 3oud 25 l 30 d9i9a 7atta twalli crème tkhina tghatti el mgharfa.',
        instruction_ar:
          'أذب الطحين و120 غ من السكر في عصير الزقوقو البارد، ثم اطهه على نار متوسطة مع التحريك المستمر بملعقة خشبية 25 إلى 30 دقيقة حتى يصبح كريمة كثيفة تغطي الملعقة.',
      },
      {
        step_number: 3,
        instruction_fr:
          'Versez aussitôt dans 4 verrines en les remplissant aux deux tiers, tapotez pour lisser et laissez tiédir.',
        instruction_derja:
          'Sobbha toul f 4 kisan w3abbi el thoulthin, ad9ob el ka7s chwaya bech yetsawa wejhha w khalliha tebred chwaya.',
        instruction_ar: 'اسكبها فوراً في 4 كؤوس حتى الثلثين، واطرق الكؤوس قليلاً لتسوية السطح واتركها تفتر.',
      },
      {
        step_number: 4,
        instruction_fr:
          "Pour la crème : fouettez les œufs avec le reste du sucre et la maïzena, versez le lait chaud dessus, remettez sur feu doux et remuez 5 minutes jusqu'à épaississement. Parfumez à la fleur d'oranger hors du feu.",
        instruction_derja:
          'Lel crème: khabbet el 3dham m3a b9iyet es-sokkar wel maïzena, sobb fihom el 7lib skhoun, rajja3hom 3la nar hadya w 7arrek 5 d9aye9 7atta tetkhaththar. Ba3d ma tna77iha zid el ma zhar.',
        instruction_ar:
          'للكريمة: اخفق البيض مع باقي السكر والنشاء، اسكب عليه الحليب الساخن، ثم أرجعه على نار هادئة وحرّك 5 دقائق حتى يتكثف، وعطّره بماء الزهر بعيداً عن النار.',
      },
      {
        step_number: 5,
        instruction_fr:
          "Couvrez la assida d'une couche de crème tiède, réfrigérez 3 heures et décorez au dernier moment de fruits secs et d'amandes concassées.",
        instruction_derja:
          'Ghatti el 3assida b ta9a mel crème w hiya dafya, 7ottha 3 swaye3 fel frigo w zayyenha ki tji bech tsserbi bel fakya el yabsa wel louz el mdagdeg.',
        instruction_ar:
          'غطِّ العصيدة بطبقة من الكريمة الدافئة، ضعها 3 ساعات في الثلاجة، وزيّنها عند التقديم بالفواكه الجافة واللوز المجروش.',
      },
    ],
    chef_tip: {
      fr: "Pour une assida sans goût de terre, mettez le zgougou filtré au repos une nuit au frigo et jetez l'eau claire du dessus avant cuisson : le dépôt concentré est le plus fin.",
      derja:
        'Bech el 3assida matjich bel ta3m mta3 et-trab, khalli ma ez-zgougou lila fel frigo w kabb el ma es-safi elli mel fo9 9bal et-tayyib: elli fel 9a3 howa el a7la.',
      ar: 'لعصيدة دون طعم ترابي، اترك عصير الزقوقو ليلة في الثلاجة واسكب الماء الصافي من فوقه قبل الطهي، فالراسب المركّز هو الأنعم.',
    },
    is_published: true,
    is_healthy: false,
  },
  {
    id: 'rec_tn_49_bsissa_aux_dattes',
    slug: 'bsissa-aux-dattes',
    name_fr: 'Bsissa aux dattes',
    name_derja: 'Bsissa bel tmar',
    name_ar: 'بسيسة بالتمر',
    description_fr:
      "Une farine torréfiée aux épices, travaillée à l'huile d'olive et au rob de dattes, roulée en bouchées avec dattes et amandes : l'énergie du petit-déjeuner du Sud.",
    description_derja:
      'Farina m7ammsa bel 3touria, mkhallta b zit zitouna w rob tmar, mkawra m3a tmar w louz: 9owwa el ftour mta3 el jnoub.',
    description_ar: 'دقيق محمّص بالتوابل يُعجن بزيت الزيتون ورب التمر ويُكوّر مع التمر واللوز، طاقة فطور الجنوب.',
    image_url: '',
    prep_time_minutes: 20,
    cook_time_minutes: 15,
    base_servings: 4,
    estimated_cost_tnd: 8,
    category: 'dessert',
    cuisine_type: 'traditionnelle',
    difficulty: 'facile',
    ingredients: [
      {
        ingredient_id: 'ing_farine',
        quantity_base: 200,
        unit: 'g',
        role: 'secondary',
        substitutes: ['ing_couscous_fin'],
      },
      { ingredient_id: 'ing_dattes', quantity_base: 150, unit: 'g', role: 'key' },
      { ingredient_id: 'ing_huile_olive', quantity_base: 5, unit: 'c.à.s', role: 'secondary' },
      { ingredient_id: 'ing_rob_tmar', quantity_base: 3, unit: 'c.à.s', role: 'secondary', substitutes: ['ing_miel'] },
      { ingredient_id: 'ing_amandes', quantity_base: 60, unit: 'g', role: 'secondary' },
      { ingredient_id: 'ing_coriandre_graines', quantity_base: 1, unit: 'c.à.c', role: 'staple' },
      { ingredient_id: 'ing_cannelle', quantity_base: 0.5, unit: 'c.à.c', role: 'staple' },
      { ingredient_id: 'ing_raisins_secs', quantity_base: 40, unit: 'g', is_optional: true, role: 'secondary' },
    ],
    steps: [
      {
        step_number: 1,
        instruction_fr:
          "Torréfiez la farine à sec dans une grande poêle à feu doux 10 à 12 minutes en remuant sans cesse, jusqu'à une couleur noisette et une odeur de biscuit.",
        instruction_derja:
          '7ammes el farina bla zit f me9la kbira 3la nar hadya 10 l 12 d9i9a w 7arrek dima, 7atta twalli lounha boundo9i w ri7tha kif el biskwi.',
        instruction_ar:
          'حمّص الطحين دون زيت في مقلاة كبيرة على نار هادئة 10 إلى 12 دقيقة مع التحريك المستمر حتى يصبح لونه بندقياً ورائحته كالبسكويت.',
      },
      {
        step_number: 2,
        instruction_fr:
          'Grillez les amandes et les graines de coriandre 3 minutes dans la même poêle, puis mixez-les finement et mélangez-les à la farine avec la cannelle.',
        instruction_derja:
          '7ammes el louz w 7abb el tabel 3 d9aye9 f nafs el me9la, ba3d a7rekhom rgii9 w khallathom m3a el farina wel 9rfa.',
        instruction_ar: 'حمّص اللوز وحبوب التابل 3 دقائق في المقلاة نفسها، ثم اطحنها ناعماً واخلطها مع الطحين والقرفة.',
      },
      {
        step_number: 3,
        instruction_fr: 'Dénoyautez les dattes et hachez-les en petits morceaux avec les raisins secs.',
        instruction_derja: 'Na77i el 3dham mel tmar w 9assasou 9ta3 sghar m3a el zbib.',
        instruction_ar: 'انزع نوى التمر وافرمه قطعاً صغيرة مع الزبيب.',
      },
      {
        step_number: 4,
        instruction_fr:
          "Versez l'huile d'olive et le rob sur le mélange de farine, frottez entre les mains jusqu'à une texture de sable humide, puis incorporez les dattes.",
        instruction_derja:
          'Sobb zit zitouna wel rob 3al farina, farek bin yeddik 7atta twalli kif er-ramla el mabloula, ba3d zid et-tmar.',
        instruction_ar:
          'اسكب زيت الزيتون والرب على خليط الطحين، وافركه بين اليدين حتى يصبح كالرمل المبلّل، ثم أضف التمر.',
      },
      {
        step_number: 5,
        instruction_fr:
          "Serrez la pâte dans le creux de la main pour former des boulettes de la taille d'une noix. Servez-les avec un café ou un verre de lben.",
        instruction_derja: 'Ochedd el 3jina f kaffek w a3mel kwirat 9ad el jouza. Sarbihom m3a kahwa wala kes leben.',
        instruction_ar: 'اضغط العجينة في كفّك لتشكيل كرات بحجم الجوزة، وقدّمها مع القهوة أو كأس لبن.',
      },
    ],
    chef_tip: {
      fr: "Torréfiez une grande quantité de farine d'un coup et gardez-la dans un bocal hermétique : elle se conserve deux mois et la bsissa se prépare alors en cinq minutes.",
      derja:
        '7ammes barcha farina marra we7da w khabbiha f bocal msakker: to93ed chahrin, w el bsissa tet3mel f 5 d9aye9.',
      ar: 'حمّص كمية كبيرة من الطحين دفعة واحدة واحفظها في برطمان محكم، فهي تبقى شهرين وتحضّر البسيسة في خمس دقائق.',
    },
    is_published: true,
    is_healthy: false,
  },
  {
    id: 'rec_tn_50_riz_au_lait_a_la_fleur_d_ora',
    slug: 'riz-au-lait-a-la-fleur-d-oranger',
    name_fr: "Riz au lait à la fleur d'oranger",
    name_derja: 'Rouz bel 7lib w ma zhar',
    name_ar: 'أرز بالحليب وماء الزهر',
    description_fr:
      "Un riz crémeux cuit lentement dans le lait, parfumé à la fleur d'oranger et saupoudré de cannelle : le dessert réconfortant des grands-mères.",
    description_derja:
      'Rouz krimi mtayyeb 3la mahlou fel 7lib, bel ma zhar w rechet 9rfa: el 7elw elli yfakkerna bel jaddat.',
    description_ar: 'أرز كريمي مطهو ببطء في الحليب، معطّر بماء الزهر ومرشوش بالقرفة، حلوى الجدّات الدافئة.',
    image_url: '',
    prep_time_minutes: 5,
    cook_time_minutes: 40,
    base_servings: 4,
    estimated_cost_tnd: 4,
    category: 'dessert',
    cuisine_type: 'familiale',
    difficulty: 'facile',
    ingredients: [
      { ingredient_id: 'ing_riz', quantity_base: 150, unit: 'g', role: 'key' },
      { ingredient_id: 'ing_lait', quantity_base: 1, unit: 'L', role: 'key' },
      { ingredient_id: 'ing_sucre', quantity_base: 100, unit: 'g', role: 'staple' },
      { ingredient_id: 'ing_fleur_oranger', quantity_base: 1, unit: 'c.à.s', role: 'secondary' },
      { ingredient_id: 'ing_cannelle', quantity_base: 1, unit: 'c.à.c', role: 'staple' },
      { ingredient_id: 'ing_fruits_secs', quantity_base: 30, unit: 'g', is_optional: true, role: 'secondary' },
    ],
    steps: [
      {
        step_number: 1,
        instruction_fr:
          "Faites blanchir le riz 5 minutes dans l'eau bouillante, puis égouttez-le : cette étape retire l'amidon de surface et évite que le riz attache.",
        instruction_derja:
          'A9leb er-rouz 5 d9aye9 fel ma yeghli w saffih: hakka yet7ammel en-nachaa elli 3lih w ma yetla99ech fel 9a3.',
        instruction_ar: 'اسلق الأرز 5 دقائق في الماء المغلي ثم صفّه، فهذه الخطوة تزيل النشاء السطحي وتمنع التصاقه.',
      },
      {
        step_number: 2,
        instruction_fr:
          "Portez le lait à frémissement, ajoutez le riz et laissez cuire 30 à 35 minutes à feu très doux en remuant toutes les 5 minutes, jusqu'à ce que les grains éclatent sous la dent et que la texture soit crémeuse.",
        instruction_derja:
          'Sakhan el 7lib 7atta ybaggar, zid er-rouz w khallih 30 l 35 d9i9a 3la nar hadya barcha w 7arrek kol 5 d9aye9, 7atta el 7abba tetfarra9 fel fom w ywalli krimi.',
        instruction_ar:
          'سخّن الحليب حتى يبدأ في الغليان، أضف الأرز واتركه 30 إلى 35 دقيقة على نار هادئة جداً مع التحريك كل 5 دقائق حتى تتفتّت الحبات ويصبح القوام كريمياً.',
      },
      {
        step_number: 3,
        instruction_fr:
          "Ajoutez le sucre en fin de cuisson et laissez encore 3 minutes, puis retirez du feu et versez la fleur d'oranger.",
        instruction_derja: 'Zid es-sokkar fel lekher w khallih 3 d9aye9 o5rin, ba3d na77ih mel nar w sobb el ma zhar.',
        instruction_ar: 'أضف السكر في نهاية الطهي واتركه 3 دقائق أخرى، ثم ارفعه عن النار واسكب ماء الزهر.',
      },
      {
        step_number: 4,
        instruction_fr:
          'Répartissez dans des bols, laissez refroidir puis saupoudrez de cannelle et de fruits secs concassés. Se déguste tiède ou bien frais.',
        instruction_derja:
          'Wazza3 fel zlayef, khallih yebred w rech 9rfa w fakya yabsa mdagdga. Yetkla dafi wala bared.',
        instruction_ar: 'وزّعه في أوعية، اتركه يبرد ثم رشّ القرفة والفواكه الجافة المجروشة، ويؤكل دافئاً أو بارداً.',
      },
    ],
    chef_tip: {
      fr: "Ne sucrez jamais au début : le sucre durcit l'enveloppe du grain et le riz ne gonfle plus. Il s'ajoute toujours quand le riz est déjà tendre.",
      derja:
        'Ma t7otch es-sokkar fel lowel: ye9assi 9chirt el 7abba w er-rouz ma yentfakhch. Dima yetzad ki er-rouz yertab.',
      ar: 'لا تضف السكر في البداية فهو يقسّي غلاف الحبة ويمنع الأرز من الانتفاخ، أضفه دائماً بعد أن يطرى الأرز.',
    },
    is_published: true,
    is_healthy: false,
  },
];
