import { Recipe } from '../types';

/**
 * Tunisian desserts (course = 'dessert').
 * Photos are generic placeholders: replace them from the backoffice.
 */
const PLACEHOLDER_IMAGE =
  'https://images.unsplash.com/photo-1509722747041-616f39b57569?auto=format&fit=crop&w=800&q=80';

export const dessertRecipes: Recipe[] = [
  // D1. BAMBALOUNI
  {
    id: 'rec_bambalouni',
    slug: 'bambalouni-sidi-bou-said',
    name_fr: 'Bambalouni (beignets tunisiens)',
    name_derja: 'Bambalouni',
    name_ar: 'بمبالوني',
    description_fr:
      'Le beignet de Sidi Bou Saïd : une pâte levée moelleuse frite en anneau, roulée dans le sucre et servie chaude avec un thé.',
    description_derja:
      'El bambalouni mta3 Sidi Bou Said: 3jina mkhammra, ma9liya f zit, mrammla bel sokkar w tetkla skhouna m3a tey.',
    description_ar: 'كعكة سيدي بوسعيد: عجين مخمّر طري يُقلى على شكل حلقة ويُغمس في السكر ويُقدّم ساخناً مع الشاي.',
    image_url: PLACEHOLDER_IMAGE,
    prep_time_minutes: 25,
    cook_time_minutes: 15,
    base_servings: 6,
    estimated_cost_tnd: 4.0,
    category: 'dessert',
    cuisine_type: 'traditionnelle',
    difficulty: 'moyen',
    ingredients: [
      { ingredient_id: 'ing_farine', quantity_base: 500, unit: 'g', role: 'key' },
      { ingredient_id: 'ing_levure', quantity_base: 1, unit: 'sachet', role: 'key' },
      { ingredient_id: 'ing_sucre', quantity_base: 4, unit: 'c.à.s', role: 'staple' },
      { ingredient_id: 'ing_huile_olive', quantity_base: 1, unit: 'L (friture)', role: 'staple' },
      { ingredient_id: 'ing_sel_poivre', quantity_base: 1, unit: 'pincée', role: 'staple' },
    ],
    steps: [
      {
        step_number: 1,
        instruction_fr:
          "Délayez la levure dans un verre d'eau tiède avec une cuillère de sucre. Laissez mousser 10 minutes.",
        instruction_derja: 'Dawweb el khmira f kés ma sokhn m3a mgharfa sokkar. Khalliha 10 d9aye9 tetkhammer.',
        instruction_ar: 'أذب الخميرة في كأس ماء دافئ مع ملعقة سكر واتركها 10 دقائق حتى تتفاعل.',
      },
      {
        step_number: 2,
        instruction_fr:
          "Mélangez la farine, le sel et la levure, puis ajoutez de l'eau tiède petit à petit. Pétrissez 10 minutes pour obtenir une pâte très souple et collante.",
        instruction_derja:
          'Khallat el farina, el mel7 wel khmira, w zid el ma chwaya b chwaya. 3ajjen 10 d9aye9 7atta twalli 3jina rtiba w tlasse9.',
        instruction_ar:
          'اخلط الطحين والملح والخميرة وأضف الماء الدافئ تدريجياً، واعجن 10 دقائق حتى تحصل على عجين لين ولزج.',
      },
      {
        step_number: 3,
        instruction_fr:
          "Couvrez et laissez lever 1 heure dans un endroit chaud, jusqu'à ce que la pâte double de volume.",
        instruction_derja: 'Ghatti el 3jina w khalliha tetkhammer sa3a f blasa skhouna 7atta todhra3f.',
        instruction_ar: 'غطِّ العجين واتركه يتخمّر ساعة في مكان دافئ حتى يتضاعف حجمه.',
      },
      {
        step_number: 4,
        instruction_fr:
          "Les mains huilées, prenez une boule de pâte, percez le centre avec le pouce et étirez en anneau. Faites frire dans l'huile chaude jusqu'à ce qu'il soit doré des deux côtés.",
        instruction_derja:
          'B yeddik madhounin bel zit, khoudh koura, a9ba bel sba3 fel woust w madd-ha. A9liha fel zit skhoun 7atta t7ammer mel jihtin.',
        instruction_ar:
          'بيدين مدهونتين بالزيت خذ كرة عجين، اثقب وسطها بالإبهام ومدّها على شكل حلقة، ثم اقلها في زيت ساخن حتى تحمرّ من الجهتين.',
      },
      {
        step_number: 5,
        instruction_fr: 'Égouttez sur du papier absorbant et roulez immédiatement dans le sucre. Servez chaud.',
        instruction_derja: 'Na7ihom 3la papier, w rammelhom fel sokkar toul. Kouluhom skhounin.',
        instruction_ar: 'صفِّها على ورق ماص ثم اغمسها فوراً في السكر وقدّمها ساخنة.',
      },
    ],
    chef_tip: {
      fr: "Une pâte bien collante donne des bambalouni légers : n'ajoutez pas trop de farine, huilez plutôt vos mains.",
      derja:
        'Kol ma tkoun el 3jina tlasse9 akthar, kol ma el bambalouni ykhef: ma tzidech farina, adhhen yeddik bel zit.',
      ar: 'كلما كان العجين لزجاً أكثر كان البمبالوني أخف: لا تضف طحيناً زائداً بل ادهن يديك بالزيت.',
    },
    is_published: true,
    is_healthy: false,
  },

  // D2. ASSIDA ZGOUGOU
  {
    id: 'rec_assida_zgougou',
    slug: 'assida-zgougou-mouled',
    name_fr: "Assida Zgougou (crème de pignons d'Alep)",
    name_derja: '3assidet Zgougou',
    name_ar: 'عصيدة الزقوقو',
    description_fr:
      "Le dessert du Mouled : une crème noire de graines de pin d'Alep, nappée d'une crème pâtissière blanche et décorée de fruits secs.",
    description_derja: 'Ma7lia mta3 el Mouled: 3assida ka7la bel zgougou, fo9ha krima bidha w mzayna bel fakia.',
    description_ar: 'حلوى المولد: عصيدة الزقوقو الداكنة مغطاة بكريمة بيضاء ومزينة بالفواكه الجافة.',
    image_url: PLACEHOLDER_IMAGE,
    prep_time_minutes: 30,
    cook_time_minutes: 40,
    base_servings: 6,
    estimated_cost_tnd: 32.0,
    category: 'dessert',
    cuisine_type: 'traditionnelle',
    difficulty: 'avance',
    ingredients: [
      { ingredient_id: 'ing_zgougou', quantity_base: 500, unit: 'g', role: 'key' },
      { ingredient_id: 'ing_maizena', quantity_base: 4, unit: 'c.à.s', role: 'secondary' },
      { ingredient_id: 'ing_farine', quantity_base: 2, unit: 'c.à.s', role: 'secondary' },
      { ingredient_id: 'ing_lait', quantity_base: 1, unit: 'L', role: 'secondary' },
      { ingredient_id: 'ing_oeuf', quantity_base: 2, unit: 'jaunes', role: 'secondary' },
      { ingredient_id: 'ing_fruits_secs', quantity_base: 150, unit: 'g', role: 'secondary' },
      { ingredient_id: 'ing_sucre', quantity_base: 250, unit: 'g', role: 'staple' },
      { ingredient_id: 'ing_fleur_oranger', quantity_base: 1, unit: 'c.à.s', role: 'staple', is_optional: true },
    ],
    steps: [
      {
        step_number: 1,
        instruction_fr:
          "Mixez le zgougou avec un litre d'eau, puis filtrez le jus à travers une passoire fine en pressant bien. Jetez le résidu.",
        instruction_derja:
          'Ra7i el zgougou m3a litre ma, w saffih b ghorbal rqi9 w 3asrou mli7. Erma el 7ajja elli to93od.',
        instruction_ar: 'اطحن الزقوقو مع لتر ماء ثم صفِّ العصير بمصفاة رفيعة مع العصر جيداً وتخلص من البقايا.',
      },
      {
        step_number: 2,
        instruction_fr:
          "Versez le jus dans une casserole avec 150 g de sucre et 2 c.à.s de maïzena. Faites cuire à feu moyen en remuant sans arrêt jusqu'à épaississement (20 à 25 min).",
        instruction_derja:
          'Sobb el 3asir f kasrouna m3a 150 g sokkar w 2 mgharef nacha. Tayybou 3la nar wastaniya w tharrek dima 7atta yethkhan (20 l 25 d9i9a).',
        instruction_ar:
          'اسكب العصير في قدر مع 150 غ سكر وملعقتي نشاء، واطبخه على نار متوسطة مع التحريك المستمر حتى يتماسك (20 إلى 25 دقيقة).',
      },
      {
        step_number: 3,
        instruction_fr: 'Répartissez la crème noire dans des coupes et laissez tiédir.',
        instruction_derja: '9assem el 3assida el ka7la fel kisan w khalliha tebred chwaya.',
        instruction_ar: 'وزّع العصيدة الداكنة في الكؤوس واتركها تبرد قليلاً.',
      },
      {
        step_number: 4,
        instruction_fr:
          "Crème blanche : chauffez le lait avec le reste du sucre, la farine, le reste de maïzena et les jaunes d'œufs délayés. Remuez jusqu'à ce qu'elle nappe la cuillère, parfumez à la fleur d'oranger.",
        instruction_derja:
          'El krima el bidha: sakhan el 7lib m3a b9iyet el sokkar, el farina, b9iyet el nacha wel sfar mdawbin. Tharrek 7atta tethkhan w zid ma zhar.',
        instruction_ar:
          'الكريمة البيضاء: سخّن الحليب مع باقي السكر والطحين وباقي النشاء وصفار البيض المذاب، وحرّك حتى تتماسك ثم عطّرها بماء الزهر.',
      },
      {
        step_number: 5,
        instruction_fr:
          'Nappez chaque coupe de crème blanche, laissez refroidir puis décorez de fruits secs et de dragées.',
        instruction_derja: 'Ghatti kol kés bel krima el bidha, khalliha tebred w zayyen bel fakia wel drajé.',
        instruction_ar: 'غطِّ كل كأس بالكريمة البيضاء واتركها تبرد ثم زينها بالفواكه الجافة والملبس.',
      },
    ],
    chef_tip: {
      fr: 'Ne cessez jamais de remuer la crème de zgougou : elle accroche très vite au fond de la casserole.',
      derja: 'Ma tbattelch tharrek el 3assida: tet9bedh fel 9a3 b sor3a.',
      ar: 'لا تتوقف عن تحريك عصيدة الزقوقو لأنها تلتصق بقاع القدر بسرعة.',
    },
    is_published: true,
    is_healthy: false,
  },

  // D3. MHALBIYA
  {
    id: 'rec_mhalbiya',
    slug: 'mhalbiya-creme-lait',
    name_fr: "Mhalbiya (crème de lait à la fleur d'oranger)",
    name_derja: 'Mhalbiya',
    name_ar: 'محلبية',
    description_fr:
      "Une crème de lait douce et parfumée à la fleur d'oranger, prête en un quart d'heure, à servir bien fraîche avec des pistaches.",
    description_derja: 'Krima 7lib 7lowa w fiha ri7et ma zhar, tet7adher f roub sa3a, tetkla bérda m3a fosto9.',
    description_ar: 'كريمة حليب ناعمة معطرة بماء الزهر، تُحضّر في ربع ساعة وتُقدّم باردة مع الفستق.',
    image_url: PLACEHOLDER_IMAGE,
    prep_time_minutes: 5,
    cook_time_minutes: 15,
    base_servings: 4,
    estimated_cost_tnd: 5.0,
    category: 'dessert',
    cuisine_type: 'familiale',
    difficulty: 'facile',
    ingredients: [
      { ingredient_id: 'ing_lait', quantity_base: 1, unit: 'L', role: 'key' },
      { ingredient_id: 'ing_maizena', quantity_base: 5, unit: 'c.à.s', role: 'key', substitutes: ['ing_farine'] },
      { ingredient_id: 'ing_sucre', quantity_base: 6, unit: 'c.à.s', role: 'staple' },
      { ingredient_id: 'ing_fleur_oranger', quantity_base: 1, unit: 'c.à.s', role: 'staple' },
      { ingredient_id: 'ing_fruits_secs', quantity_base: 30, unit: 'g', role: 'secondary', is_optional: true },
    ],
    steps: [
      {
        step_number: 1,
        instruction_fr: 'Délayez la maïzena dans un verre de lait froid.',
        instruction_derja: 'Dawweb el nacha f kés 7lib bérd.',
        instruction_ar: 'أذب النشاء في كأس حليب بارد.',
      },
      {
        step_number: 2,
        instruction_fr: 'Faites chauffer le reste du lait avec le sucre. Avant ébullition, ajoutez la maïzena délayée.',
        instruction_derja: 'Sakhan b9iyet el 7lib m3a el sokkar. 9bal ma ygli, zid el nacha el mdawba.',
        instruction_ar: 'سخّن باقي الحليب مع السكر، وقبل الغليان أضف النشاء المذاب.',
      },
      {
        step_number: 3,
        instruction_fr:
          "Remuez sans arrêt à feu doux jusqu'à ce que la crème épaississe (5 à 8 min). Hors du feu, ajoutez la fleur d'oranger.",
        instruction_derja: 'Tharrek dima 3la nar hebya 7atta tethkhan (5 l 8 d9aye9). Ba3d ma tna77iha zid ma zhar.',
        instruction_ar:
          'حرّك باستمرار على نار هادئة حتى تتماسك الكريمة (5 إلى 8 دقائق)، ثم أضف ماء الزهر بعد رفعها عن النار.',
      },
      {
        step_number: 4,
        instruction_fr:
          'Versez dans des ramequins, laissez refroidir puis placez 2 heures au réfrigérateur. Décorez de pistaches concassées.',
        instruction_derja: 'Sobbha f kisan sghar, khalliha tebred w 7ottha sa3tin fel frigo. Zayyen b fosto9 m7arres.',
        instruction_ar: 'اسكبها في أكواب صغيرة واتركها تبرد ثم ضعها ساعتين في الثلاجة وزينها بالفستق المجروش.',
      },
    ],
    chef_tip: {
      fr: "Couvrez les ramequins au contact d'un film alimentaire pour éviter qu'une peau ne se forme en refroidissant.",
      derja: 'Ghatti el kisan b film mlas9 fel krima bech ma ta3melch 9echra ki tebred.',
      ar: 'غطِّ الأكواب بغلاف بلاستيكي ملامس للكريمة حتى لا تتكون قشرة عند تبريدها.',
    },
    is_published: true,
    is_healthy: false,
  },

  // D4. SALADE D'ORANGES
  {
    id: 'rec_slata_bordgen',
    slug: 'salade-oranges-cannelle',
    name_fr: "Salade d'oranges à la cannelle et fleur d'oranger",
    name_derja: 'Slatet Bordgen',
    name_ar: 'سلطة البرتقال بالقرفة وماء الزهر',
    description_fr:
      "Le dessert léger de fin de repas : des rondelles d'oranges juteuses, une touche de cannelle, de fleur d'oranger et quelques amandes.",
    description_derja: 'Ma7lia khfifa ba3d el makla: tranchet bordgen, chwaya 9erfa, ma zhar w chwaya louz.',
    description_ar: 'تحلية خفيفة بعد الطعام: شرائح برتقال مع رشة قرفة وماء الزهر وبعض اللوز.',
    image_url: PLACEHOLDER_IMAGE,
    prep_time_minutes: 10,
    cook_time_minutes: 0,
    base_servings: 4,
    estimated_cost_tnd: 4.5,
    category: 'dessert',
    cuisine_type: 'rapide',
    difficulty: 'facile',
    ingredients: [
      { ingredient_id: 'ing_orange', quantity_base: 1, unit: 'kg', role: 'key' },
      { ingredient_id: 'ing_cannelle', quantity_base: 1, unit: 'c.à.c', role: 'staple' },
      { ingredient_id: 'ing_fleur_oranger', quantity_base: 1, unit: 'c.à.s', role: 'staple' },
      { ingredient_id: 'ing_miel', quantity_base: 1, unit: 'c.à.s', role: 'secondary', is_optional: true },
      { ingredient_id: 'ing_fruits_secs', quantity_base: 30, unit: 'g', role: 'secondary', is_optional: true },
    ],
    steps: [
      {
        step_number: 1,
        instruction_fr:
          'Pelez les oranges à vif en retirant toute la peau blanche, puis coupez-les en fines rondelles.',
        instruction_derja: '9echer el bordgen w na77i el 9echra el bidha el kol, ba3d 9osshom tranchet rqi9in.',
        instruction_ar: 'قشّر البرتقال وأزل القشرة البيضاء كلها ثم قطّعه شرائح رقيقة.',
      },
      {
        step_number: 2,
        instruction_fr:
          "Disposez les rondelles sur un plat et arrosez de fleur d'oranger (et d'un filet de miel si vous voulez).",
        instruction_derja: 'Sayyef el tranchet f sa7fa w rach 3lihom ma zhar (w chwaya 3sal ken t7eb).',
        instruction_ar: 'رتّب الشرائح في طبق ورشّ عليها ماء الزهر (وقليلاً من العسل إن أردت).',
      },
      {
        step_number: 3,
        instruction_fr: "Saupoudrez de cannelle, parsemez d'amandes effilées et servez bien frais.",
        instruction_derja: 'Rach el 9erfa, zid el louz el m9atta3 w 9addem-ha bérda.',
        instruction_ar: 'رشّ القرفة وأضف اللوز المقطع وقدّمها باردة.',
      },
    ],
    chef_tip: {
      fr: 'Les oranges maltaises du Cap Bon, de janvier à avril, rendent ce dessert exceptionnel.',
      derja: 'Bordgen el maltaise mta3 el Watan el 9bali, men janvier l avril, ykhalli el slata ma 3andhech kif.',
      ar: 'برتقال المالطي من الوطن القبلي بين جانفي وأفريل يجعل هذه التحلية استثنائية.',
    },
    is_published: true,
    is_healthy: true,
  },
];
