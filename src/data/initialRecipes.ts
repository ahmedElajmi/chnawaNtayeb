import { Recipe } from '../types';
import { dessertRecipes } from './dessertRecipes';
import { tunisianRecipes } from './tunisianRecipes';
import { internationalRecipes } from './internationalRecipes';

const savoryRecipes: Recipe[] = [
  // 1. OJJA MERGUEZ
  {
    id: 'rec_ojja_merguez',
    slug: 'ojja-merguez',
    name_fr: 'Ojja aux Merguez',
    name_derja: 'Ojja bel Merguez',
    name_ar: 'عجة بالمرقاز',
    description_fr: 'L\'incontournable plat express tunisien : des merguez dorées mijotées dans une sauce tomate pimentée à l\'ail et au carvi, avec des œufs coulants.',
    description_derja: 'El ojja el tounsiya el a7archa bel merguez, tmatem fraiche, thoum, hrisa 3arbi w 3dham mrayba.',
    description_ar: 'العجة التونسية الشهيرة بالمرقاز وصلصة الطماطم الحارة مع الثوم والبيض الطازج.',
    image_url: 'https://images.unsplash.com/photo-1590412200988-a436970781fa?auto=format&fit=crop&w=800&q=80',
    prep_time_minutes: 10,
    cook_time_minutes: 15,
    base_servings: 4,
    estimated_cost_tnd: 12.5,
    category: 'plat_principal',
    cuisine_type: 'rapide',
    difficulty: 'facile',
    ingredients: [
      { ingredient_id: 'ing_oeuf', quantity_base: 4, unit: 'pièces', role: 'key' },
      { ingredient_id: 'ing_merguez', quantity_base: 300, unit: 'g', role: 'key' },
      { ingredient_id: 'ing_tomate', quantity_base: 3, unit: 'pièces', role: 'secondary' },
      { ingredient_id: 'ing_tomate_concentree', quantity_base: 1, unit: 'c.à.s', role: 'secondary' },
      { ingredient_id: 'ing_piment', quantity_base: 2, unit: 'pièces', role: 'secondary' },
      { ingredient_id: 'ing_ail', quantity_base: 4, unit: 'gousses', role: 'staple' },
      { ingredient_id: 'ing_harissa', quantity_base: 1, unit: 'c.à.c', role: 'staple' },
      { ingredient_id: 'ing_huile_olive', quantity_base: 3, unit: 'c.à.s', role: 'staple' },
      { ingredient_id: 'ing_tabel_karwiya', quantity_base: 1, unit: 'c.à.c', role: 'staple' },
      { ingredient_id: 'ing_sel_poivre', quantity_base: 1, unit: 'pincée', role: 'staple' },
    ],
    steps: [
      {
        step_number: 1,
        instruction_fr: 'Coupez les merguez en tronçons et faites-les revenir dans l\'huile d\'olive pendant 3 minutes jusqu\'à légère coloration.',
        instruction_derja: 'Ghaffess el merguez morsewet w 9allih f zit zitouna moddet 3 d9aye9 7atta ye7mar chwaya.',
        instruction_ar: 'قطّع المرقاز وقلّه في زيت الزيتونة لمدة 3 دقائق حتى يتغير لونه.'
      },
      {
        step_number: 2,
        instruction_fr: 'Ajoutez l\'ail écrasé, la tomate concentrée, l\'harissa, le tabel-karwiya et les tomates fraîches coupées en dés avec un demi-verre d\'eau chaude.',
        instruction_derja: 'Zid el thoum el marfoukh, tmatem ma3jouna, el hrisa, tabel w karwiya wel tmatem el k3ab m9assa sghira m3a nos kes ma skhoun.',
        instruction_ar: 'أضف الثوم المهروس، الطماطم المعجونة، الهريسة العربي، التابل والكروية ومكعبات الطماطم الطازجة مع نصف كأس ماء ساخن.'
      },
      {
        step_number: 3,
        instruction_fr: 'Laissez mijoter à feu moyen 8 minutes jusqu\'à ce que la sauce épaississe, puis ajoutez les piments émincés.',
        instruction_derja: 'Khalliha teghli 3la nar motawasta 8 d9aye9 7atta t9atter zit-ha, w zid el felfel el m9ass.',
        instruction_ar: 'اترك الصلصة تغلي على نار متوسطة 8 دقائق حتى تتخثر، ثم أضف شرائح الفلفل.'
      },
      {
        step_number: 4,
        instruction_fr: 'Cassez les œufs sur la sauce, couvrez la poêle et laissez cuire 3 minutes : le blanc doit être pris et le jaune bien coulant.',
        instruction_derja: 'Faqqes el 3dham fo9 el salsa, ghatti el me9la w khalliha 3 d9aye9: el abyedh yetmasek wel asfar yo93ed mrayeb.',
        instruction_ar: 'افقس البيض فوق الصلصة، غطّ المقلاة واتركها 3 دقائق حتى يتماسك البياض ويبقى الصفار سائلاً.'
      }
    ],
    chef_tip: {
      fr: 'Ne battez jamais les œufs dans une vraie ojja ! Laissez les jaunes entiers et dégustez directement dans la poêle avec du pain chaud.',
      derja: 'Mata7rakch el 3dham ! Khalli el asfar mrayeb w ghammes bel khobz el skhoun men 9alb el me9la.',
      ar: 'لا تخلط البيض! اتركه عيوناً واستمتع بالتغميس بالخبز الساخن مباشرة من المقلاة.'
    },
    is_published: true,
    is_healthy: false,
  },

  // 2. KAFTEJI TOUNSI
  {
    id: 'rec_kafteji',
    slug: 'kafteji-tounsi',
    name_fr: 'Kafteji Tunisien Traditionnel',
    name_derja: 'Kafteji Tounsi 7or',
    name_ar: 'كفتاجي تونسي أصيل',
    description_fr: 'Le roi des plats populaires tunisiens : mélange de piments, tomates, courgettes, potiron et pommes de terre frits, concassés au couteau et mélangés à des œufs coulants.',
    description_derja: 'Kafteji el asel: felfel, tmatem, 9ra3 a7mar w akhdhar, batata w 3dham, m9assasin bel skaken m3a zit zitouna.',
    description_ar: 'سيد الأكلات الشعبية التونسية: فلفل، طماطم، قرع أحمر وأخضر، بطاطا وبيض مقلي ومفروم بالسكاكين مع زيت الزيتون.',
    image_url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80',
    prep_time_minutes: 20,
    cook_time_minutes: 25,
    base_servings: 4,
    estimated_cost_tnd: 8.5,
    category: 'plat_principal',
    cuisine_type: 'traditionnelle',
    difficulty: 'facile',
    ingredients: [
      { ingredient_id: 'ing_piment', quantity_base: 4, unit: 'pièces', role: 'key' },
      { ingredient_id: 'ing_tomate', quantity_base: 4, unit: 'pièces', role: 'secondary' },
      { ingredient_id: 'ing_pomme_de_terre', quantity_base: 2, unit: 'pièces', role: 'secondary' },
      { ingredient_id: 'ing_potiron', quantity_base: 250, unit: 'g', role: 'secondary' },
      { ingredient_id: 'ing_courgette', quantity_base: 2, unit: 'pièces', role: 'secondary' },
      { ingredient_id: 'ing_oeuf', quantity_base: 4, unit: 'pièces', role: 'key' },
      { ingredient_id: 'ing_persil', quantity_base: 0.5, unit: 'botte', role: 'secondary' },
      { ingredient_id: 'ing_oignon', quantity_base: 1, unit: 'pièce', is_optional: true, role: 'secondary' },
      { ingredient_id: 'ing_huile_olive', quantity_base: 4, unit: 'c.à.s', role: 'staple' },
      { ingredient_id: 'ing_tabel_karwiya', quantity_base: 1, unit: 'c.à.c', role: 'staple' },
      { ingredient_id: 'ing_sel_poivre', quantity_base: 1, unit: 'pincée', role: 'staple' },
    ],
    steps: [
      {
        step_number: 1,
        instruction_fr: 'Coupez les pommes de terre en frites, le potiron et les courgettes en gros morceaux. Fendez les piments et coupez les tomates en deux.',
        instruction_derja: '9oss el batata frites, el 9ra3 a7mar w akhdhar morsewet, chouff el felfel w 9oss el tmatem 3la thnin.',
        instruction_ar: 'قطّع البطاطا أصابع، والقرع الأحمر والأخضر قطعاً متوسطة، وافتح الفلفل واقسم الطماطم نصفين.'
      },
      {
        step_number: 2,
        instruction_fr: 'Faites frire chaque légume séparément jusqu\'à belle dorure. En fin de cuisson, faites frire les œufs au plat.',
        instruction_derja: 'I9li kol 7aja wa7adha fel zit 7atta te7mar, w fel lekher i9li el 3dham fi nafs el zit.',
        instruction_ar: 'اقلِ كل نوع من الخضار على حدة حتى ينضج ويتحمر، وفي الأخير اقلِ البيض.'
      },
      {
        step_number: 3,
        instruction_fr: 'Dans un grand plat en bois ou un plateau, déposez les légumes et les œufs frits. À l\'aide de deux couteaux croisés, concassez le tout énergiquement.',
        instruction_derja: '7ott el khadhra wel 3dham f s7an kbir, w b zouz skaken a9ra3 el kol m3a b3adh-hom b 9owwa 7atta yetkhalat.',
        instruction_ar: 'في صحن واسع، ضع الخضار المقلية والبيض، وبواسطة سكينين متقاطعين افرم الخليط جيداً.'
      },
      {
        step_number: 4,
        instruction_fr: 'Assaisonnez d\'huile d\'olive, sel, tabel-karwiya, et parsemez d\'oignon cru finement haché et de persil.',
        instruction_derja: 'Fawa7 b zit zitouna, mel7, tabel w karwiya, w rouch mel fo9 chwaya bsal mhafhef w ma3dnous.',
        instruction_ar: 'تبّل بزيت الزيتونة والملح والتابل والكروية، ورشّ فوقه البصل المفروم والمعدنوس.'
      }
    ],
    chef_tip: {
      fr: 'Le vrai kafteji ne se mixe jamais au robot ! L\'utilisation de deux couteaux préserve la texture authentique des légumes.',
      derja: 'El kafteji maya7dherch fel robot ! Lezem bil skaken bech el khadhra to93ed chedda ro7ha w bnina.',
      ar: 'الكفتاجي الحقيقي لا يُفرم في الخلاط الآلي أبداً! فرمه بالسكاكين يمنحه نكهته وقوامه التونسي الأصيل.'
    },
    is_published: true,
    is_healthy: false,
  },

  // 3. MAKAROUNA SALSA BEL DJAJ
  {
    id: 'rec_makarouna_salsa_djaj',
    slug: 'makarouna-salsa-djaj',
    name_fr: 'Makarouna Salsa Tunisienne au Poulet',
    name_derja: 'Ma9rouna Salsa 7arra bel Djaj',
    name_ar: 'مقرونة تونسية حارة بالدجاج',
    description_fr: 'Le plat réconfortant du dimanche tunisien : des pâtes enrobées d\'une sauce tomate rouge intense, parfumée au laurier et à l\'ail, servies avec un piment frit.',
    description_derja: 'El ma9rouna el ma3chou9a f koll dar tounsiya: salsa 7amra zayta, djaj faye7, rand, thoum w felfel me9li.',
    description_ar: 'المقرونة التونسية بالصلصة الحمراء الحارة والدجاج المتبل مع رند وثوم وفلفل مقلي مقرمش.',
    image_url: 'https://images.unsplash.com/photo-1621996346565-e3d5d6281781?auto=format&fit=crop&w=800&q=80',
    prep_time_minutes: 15,
    cook_time_minutes: 35,
    base_servings: 4,
    estimated_cost_tnd: 14.0,
    category: 'plat_principal',
    cuisine_type: 'familiale',
    difficulty: 'facile',
    ingredients: [
      { ingredient_id: 'ing_pates', quantity_base: 1, unit: 'paquet (500g)', role: 'key' },
      { ingredient_id: 'ing_poulet', quantity_base: 500, unit: 'g', role: 'key', substitutes: ['ing_viande_hachee'] },
      { ingredient_id: 'ing_tomate_concentree', quantity_base: 3, unit: 'c.à.s', role: 'secondary' },
      { ingredient_id: 'ing_harissa', quantity_base: 1, unit: 'c.à.s', role: 'staple' },
      { ingredient_id: 'ing_piment', quantity_base: 3, unit: 'pièces', role: 'secondary' },
      { ingredient_id: 'ing_ail', quantity_base: 6, unit: 'gousses', role: 'staple' },
      { ingredient_id: 'ing_huile_olive', quantity_base: 5, unit: 'c.à.s', role: 'staple' },
      { ingredient_id: 'ing_tabel_karwiya', quantity_base: 1.5, unit: 'c.à.c', role: 'staple' },
      { ingredient_id: 'ing_curcuma', quantity_base: 1, unit: 'c.à.c', role: 'staple' },
      { ingredient_id: 'ing_piment_moulu', quantity_base: 1, unit: 'c.à.c', role: 'staple' },
      { ingredient_id: 'ing_sel_poivre', quantity_base: 1, unit: 'pincée', role: 'staple' },
    ],
    steps: [
      {
        step_number: 1,
        instruction_fr: 'Dans une casserole, faites frire les piments dans l\'huile d\'olive puis réservez-les. Dans la même huile, faites dorer les morceaux de poulet.',
        instruction_derja: 'I9li el groun felfel f zit zitouna w na77ihom 3la jnab. Fi nafs el zit, 9alli morsewet el djaj.',
        instruction_ar: 'اقلِ قرون الفلفل في زيت الزيتونة وضعها جانباً. في نفس الزيت، حمّر قطع الدجاج.'
      },
      {
        step_number: 2,
        instruction_fr: 'Ajoutez la tomate concentrée, l\'harissa, le curcuma, le piment rouge moulu et l\'ail écrasé. Laissez revenir 3 minutes en remuant pour retirer l\'acidité.',
        instruction_derja: 'Zid tmatem ma3jouna, el hrisa, korkom, felfel zina wel thoum el mar7i. 9allihom 3 d9aye9 bech tnahi 9rouset el tmatem.',
        instruction_ar: 'أضف الطماطم المعجونة، الهريسة، الكركم، فلفل زينة والثوم المهروس، وقلّ المكونات 3 دقائق لإزالة حموضة الطماطم.'
      },
      {
        step_number: 3,
        instruction_fr: 'Couvrez d\'eau chaude à hauteur (environ 3 verres) et laissez mijoter 25 minutes jusqu\'à ce que la sauce réduise et que l\'huile remonte à la surface.',
        instruction_derja: 'Sobb el ma el skhoun 7atta yetghatta el djaj (késin walla thleta) w khalliha tib 25 d9i9a 7atta t9atter zit-ha.',
        instruction_ar: 'اسكب الماء الساخن حتى يغمر الدجاج واتركها تغلي 25 دقيقة حتى تنضج الصلصة ويطفو الزيت على السطح.'
      },
      {
        step_number: 4,
        instruction_fr: 'Faites cuire les pâtes al dente, égouttez-les et mélangez-les immédiatement avec la sauce brûlante. Servez avec le piment frit sur le dessus.',
        instruction_derja: 'Sammatt el ma9rouna al dente, 9attarha w khallatha fisa3 bel salsa el skhouna. 7ott el felfel el me9li mel fo9 w koll bel chfè.',
        instruction_ar: 'اسلق المقرونة وصَفّها ثم اخلطها فوراً بالصلصة الساخنة وزيّنها بالفلفل المقلي.'
      }
    ],
    chef_tip: {
      fr: 'Le secret réside dans le fait de laisser la sauce "tqater zit-ha" (l\'huile doit remonter à la surface). Ne noyez jamais les pâtes dans l\'eau !',
      derja: 'Esser f salsa lezem "t9atter zit-ha". Matkatharch el ma w zid mgharfa thoum marfoukh f ekher 5 d9aye9.',
      ar: 'سر المقرونة التونسية أن تتخثر الصلصة حتى تطفو قطرات الزيت على السطح. أضف فص ثوم مفروم في آخر 5 دقائق لنكهة قوية.'
    },
    is_published: true,
    is_healthy: false,
  },

  // 4. CHAKCHOUKA BEL BSAL WEL BATATA
  {
    id: 'rec_chakchouka_bsal',
    slug: 'chakchouka-bsal-batata',
    name_fr: 'Chakchouka aux Oignons et Pommes de Terre',
    name_derja: 'Chakchouka bel Bsal wel Batata',
    name_ar: 'شكشوكة بالبصل والبطاطا',
    description_fr: 'Le repas économique par excellence : des oignons fondants, des tranches de pommes de terre mijotées dans une sauce épicée, surmontées d\'œufs pochés.',
    description_derja: 'Maklet el zawwali el bnina: bsal m3assel, batata tayba f salsa 7amra w 3dham mrayba.',
    description_ar: 'أكلة اقتصادية شهية ومغذية: بصل معسل، شرائح بطاطا طرية في صلصة الطماطم والفلفل مع بيض عيون.',
    image_url: 'https://images.unsplash.com/photo-1590412200988-a436970781fa?auto=format&fit=crop&w=800&q=80',
    prep_time_minutes: 10,
    cook_time_minutes: 20,
    base_servings: 4,
    estimated_cost_tnd: 5.5,
    category: 'plat_principal',
    cuisine_type: 'economique',
    difficulty: 'facile',
    ingredients: [
      { ingredient_id: 'ing_oignon', quantity_base: 3, unit: 'pièces', role: 'key' },
      { ingredient_id: 'ing_pomme_de_terre', quantity_base: 3, unit: 'pièces', role: 'secondary' },
      { ingredient_id: 'ing_tomate', quantity_base: 2, unit: 'pièces', role: 'secondary' },
      { ingredient_id: 'ing_tomate_concentree', quantity_base: 1, unit: 'c.à.s', role: 'secondary' },
      { ingredient_id: 'ing_piment', quantity_base: 2, unit: 'pièces', role: 'secondary' },
      { ingredient_id: 'ing_oeuf', quantity_base: 4, unit: 'pièces', role: 'key' },
      { ingredient_id: 'ing_ail', quantity_base: 3, unit: 'gousses', role: 'staple' },
      { ingredient_id: 'ing_harissa', quantity_base: 1, unit: 'c.à.c', role: 'staple' },
      { ingredient_id: 'ing_huile_olive', quantity_base: 3, unit: 'c.à.s', role: 'staple' },
      { ingredient_id: 'ing_tabel_karwiya', quantity_base: 1, unit: 'c.à.c', role: 'staple' },
      { ingredient_id: 'ing_sel_poivre', quantity_base: 1, unit: 'pincée', role: 'staple' },
    ],
    steps: [
      {
        step_number: 1,
        instruction_fr: 'Émincez les oignons en lamelles et coupez les pommes de terre en rondelles d\'un centimètre.',
        instruction_derja: '9oss el bsal jwane7 wel batata rondelle-let samika chwaya.',
        instruction_ar: 'قطّع البصل جوانح والبطاطا دوائر متوسطة السماكة.'
      },
      {
        step_number: 2,
        instruction_fr: 'Faites revenir les oignons dans l\'huile d\'olive jusqu\'à ce qu\'ils deviennent translucides et légèrement dorés.',
        instruction_derja: 'Dhabbal el bsal f zit zitouna 7atta ywali dhabli w ydhahar 7lewtou.',
        instruction_ar: 'ذبّل البصل في زيت الزيتونة حتى يصبح شفافاً ويميل لونه للذهبي.'
      },
      {
        step_number: 3,
        instruction_fr: 'Ajoutez les pommes de terre, la tomate concentrée, l\'harissa, l\'ail, les épices et un verre d\'eau. Couvrez et laissez cuire 12 minutes.',
        instruction_derja: 'Zid el batata, tmatem ma3jouna, hrisa, thoum, fowye7 w kes ma. Ghattiha w khalliha tib 12 d9i9a.',
        instruction_ar: 'أضف البطاطا، الطماطم المعجونة، الهريسة، الثوم والبهارات مع كأس ماء، وغطّها 12 دقيقة حتى تنضج البطاطا.'
      },
      {
        step_number: 4,
        instruction_fr: 'Une fois les pommes de terre tendres, ajoutez les piments coupés et cassez les œufs sur le dessus. Couvrez 3 minutes et servez.',
        instruction_derja: 'Kif toudkhol el batata fel tyoub, zid el felfel w faqqes el 3dham mel fo9. Ghatti 3 d9aye9 w sa77a.',
        instruction_ar: 'عندما تنضج البطاطا، أضف الفلفل وافقس البيض، واتركه مغطى 3 دقائق حتى ينضج البيض.'
      }
    ],
    chef_tip: {
      fr: 'Faites bien caraméliser les oignons au début : c\'est leur sucre naturel qui donnera toute sa saveur douce et réconfortante à la chakchouka.',
      derja: 'Dhabbal el bsal belgdé f zit 9bal matzid el ma, houwa elli ya3ti el banna el ma3ssla mte3ha.',
      ar: 'كرمل البصل جيداً على نار هادئة في البداية؛ سكره الطبيعي يمنح الشكشوكة نكهة لا تُقاوم.'
    },
    is_published: true,
    is_healthy: false,
  },

  // 5. LABLABI TOUNSI
  {
    id: 'rec_lablabi',
    slug: 'lablabi-tounsi',
    name_fr: 'Lablabi Tunisien Traditionnel',
    name_derja: 'Lablabi Tounsi Sa5oun',
    name_ar: 'لبلابي تونسي سخون',
    description_fr: 'Le bol d\'énergie tunisien par excellence en hiver : pois chiches mijotés au cumin sur lit de pain rassis, arrosé d\'huile d\'olive, harissa, œuf mollet et thon.',
    description_derja: 'Kaskas el khobz el cheye7, sobb 3lih 7oms taghli bel kammoun, zit zitouna, hrisa 3arbi, 3adhma mrwaba w chwaya thon.',
    description_ar: 'أشهر أكلة شعبية دافئة: حمص مغلي بالكمون مسكوب فوق خبز يابس مع زيت الزيتون، الهريسة العربي، بيضة مروبة والتن والكمون.',
    image_url: 'https://images.unsplash.com/photo-1541518763669-27fef04b14ea?auto=format&fit=crop&w=800&q=80',
    prep_time_minutes: 10,
    cook_time_minutes: 40,
    base_servings: 4,
    estimated_cost_tnd: 7.0,
    category: 'plat_principal',
    cuisine_type: 'economique',
    difficulty: 'facile',
    ingredients: [
      { ingredient_id: 'ing_pois_chiches', quantity_base: 400, unit: 'g (trempés)', role: 'key' },
      { ingredient_id: 'ing_pain_baguette', quantity_base: 2, unit: 'baguettes rassis', role: 'key' },
      { ingredient_id: 'ing_ail', quantity_base: 5, unit: 'gousses', role: 'staple' },
      { ingredient_id: 'ing_cumin', quantity_base: 2, unit: 'c.à.s', role: 'staple' },
      { ingredient_id: 'ing_harissa', quantity_base: 2, unit: 'c.à.s', role: 'staple' },
      { ingredient_id: 'ing_huile_olive', quantity_base: 6, unit: 'c.à.s', role: 'staple' },
      { ingredient_id: 'ing_oeuf', quantity_base: 4, unit: 'pièces', role: 'secondary' },
      { ingredient_id: 'ing_thon_boite', quantity_base: 1, unit: 'boîte', role: 'secondary' },
      { ingredient_id: 'ing_citron', quantity_base: 2, unit: 'pièces', role: 'secondary' },
      { ingredient_id: 'ing_capres', quantity_base: 2, unit: 'c.à.s', is_optional: true, role: 'staple' },
      { ingredient_id: 'ing_olives', quantity_base: 50, unit: 'g', is_optional: true, role: 'staple' },
      { ingredient_id: 'ing_sel_poivre', quantity_base: 1, unit: 'c.à.c', role: 'staple' },
    ],
    steps: [
      {
        step_number: 1,
        instruction_fr: 'Faites cuire les pois chiches dans une grande casserole d\'eau avec les gousses d\'ail entières et une cuillère à café de cumin jusqu\'à ce qu\'ils soient très tendres.',
        instruction_derja: 'Tayyeb el 7oms f tnjra kbira m3a fssous thoum w mgharfa kammoun 7atta ywali zebdha.',
        instruction_ar: 'اطبخ الحمص في ماء وفير مع فصوص الثوم وملعقة كمون حتى ينضج تماماً ويصبح طرياً جداً.'
      },
      {
        step_number: 2,
        instruction_fr: 'Dans chaque bol individuel, déchirez le pain rassis en petits morceaux avec les mains.',
        instruction_derja: 'F koll sa7fa, fattich el khobz el cheye7 morsewet sghira b yeddik.',
        instruction_ar: 'في كل صحن فردي، فتّت الخبز اليابس إلى قطع صغيرة باليد.'
      },
      {
        step_number: 3,
        instruction_fr: 'Versez les pois chiches brûlants avec leur bouillon parfumé sur le pain pour bien l\'imbiber.',
        instruction_derja: 'Sobb el 7oms el yghli m3a mraq-tou el fey7a fo9 el khobz bech yochrob belgdé.',
        instruction_ar: 'اسكب الحمص الساخن مع مرقه المغلي فوق الخبز حتى يتشرب جيداً.'
      },
      {
        step_number: 4,
        instruction_fr: 'Ajoutez une généreuse cuillère d\'harissa, un œuf mollet ou cru qui cuira dans le bouillon chaud, du cumin, du jus de citron, de l\'huile d\'olive et du thon.',
        instruction_derja: 'Zid mgharfa hrisa arbi, 3adhma mrwaba walla nayya tib fel skhoun, rachet kammoun, 9ares, zit zitouna w chwaya thon.',
        instruction_ar: 'أضف ملعقة هريسة عربي، بيضة، رشة سخية من الكمون، عصير ليمون، زيت زيتون وتن.'
      }
    ],
    chef_tip: {
      fr: 'Mélangez le bol vigoureusement à l\'aide de deux cuillères dès le service pour lier l\'œuf et le bouillon en une crème onctueuse !',
      derja: 'Khallathom b zouz mgharref fisa3 bech el 3adhma tetkhalat m3a el mra9 w ta3mel krema bnina.',
      ar: 'اخلط المكونات في الصحن فوراً بملعقتين ليمتزج البيض مع المرق الساخن في قوام كريمي رائع.'
    },
    is_published: true,
    is_healthy: true,
  },

  // 6. ROUZ JERBI (RIZ DJERBIEN)
  {
    id: 'rec_rouz_jerbi',
    slug: 'rouz-jerbi',
    name_fr: 'Rouz Jerbi (Riz Djerbien à la Vapeur)',
    name_derja: 'Rouz Jerbi Mfawar',
    name_ar: 'أرز جربي مفور بالخضار',
    description_fr: 'La merveille de Djerba : riz cuit à la vapeur avec des blettes, du persil, des petits morceaux de foie et poulet, des petits pois et des épices tunisiennes.',
    description_derja: 'El rouz el jerbi el 3alami: rouz mfawar fel kaskas m3a sel9, ma3dnous, djaj, kebda, jelbana w fé7at djerbiya.',
    description_ar: 'أشهر أطباق جزيرة جربة: أرز مطبوخ على البخار في الكسكاس مع السلق والمعدنوس وقطع الدجاج والكبدة والجلبانة والبهارات.',
    image_url: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=800&q=80',
    prep_time_minutes: 20,
    cook_time_minutes: 40,
    base_servings: 4,
    estimated_cost_tnd: 15.0,
    category: 'plat_principal',
    cuisine_type: 'traditionnelle',
    difficulty: 'moyen',
    ingredients: [
      { ingredient_id: 'ing_riz', quantity_base: 400, unit: 'g', role: 'key' },
      { ingredient_id: 'ing_poulet', quantity_base: 300, unit: 'g', role: 'key', substitutes: ['ing_agneau', 'ing_boeuf'] },
      { ingredient_id: 'ing_foie', quantity_base: 150, unit: 'g', is_optional: true, role: 'secondary' },
      { ingredient_id: 'ing_blette', quantity_base: 1.5, unit: 'bottes', role: 'secondary' },
      { ingredient_id: 'ing_persil', quantity_base: 1, unit: 'botte', role: 'secondary' },
      { ingredient_id: 'ing_oignon', quantity_base: 1, unit: 'pièce', role: 'secondary' },
      { ingredient_id: 'ing_petits_pois', quantity_base: 150, unit: 'g', role: 'secondary' },
      { ingredient_id: 'ing_tomate_concentree', quantity_base: 2, unit: 'c.à.s', role: 'secondary' },
      { ingredient_id: 'ing_harissa', quantity_base: 1, unit: 'c.à.s', role: 'staple' },
      { ingredient_id: 'ing_ail', quantity_base: 5, unit: 'gousses', role: 'staple' },
      { ingredient_id: 'ing_huile_olive', quantity_base: 6, unit: 'c.à.s', role: 'staple' },
      { ingredient_id: 'ing_tabel_karwiya', quantity_base: 2, unit: 'c.à.c', role: 'staple' },
      { ingredient_id: 'ing_curcuma', quantity_base: 1, unit: 'c.à.c', role: 'staple' },
      { ingredient_id: 'ing_piment_moulu', quantity_base: 1, unit: 'c.à.c', role: 'staple' },
      { ingredient_id: 'ing_sel_poivre', quantity_base: 1, unit: 'pincée', role: 'staple' },
    ],
    steps: [
      {
        step_number: 1,
        instruction_fr: 'Hachez finement les blettes, le persil et l\'oignon. Coupez le poulet et le foie en petits dés réguliers.',
        instruction_derja: 'Iffhi el sel9, el ma3dnous wel bsal jwayed. 9oss el djaj wel kebda morsewet sghira.',
        instruction_ar: 'افرم السلق والمعدنوس والبصل فرماً ناعماً، وقطّع الدجاج والكبدة مكعبات صغيرة متساوية.'
      },
      {
        step_number: 2,
        instruction_fr: 'Dans un grand récipient, mélangez le riz rincé et égoutté avec les herbes, les viandes, les petits pois, l\'ail écrasé, la tomate, l\'harissa, toutes les épices et l\'huile d\'olive.',
        instruction_derja: 'Fi shfa kbira, khallat el rouz el makhsoul m3a el khadhra, el l7am, jelbana, thoum, tmatem, hrisa, el fowye7 wel zit.',
        instruction_ar: 'في وعاء كبير، اخلط الأرز المغسول مع الخضار، اللحم، الجلبانة، الثوم، الطماطم، الهريسة، البهارات وزيت الزيتون.'
      },
      {
        step_number: 3,
        instruction_fr: 'Mélangez le tout soigneusement à la main pour que chaque grain de riz soit bien enrobé d\'huile et de marinade rouge.',
        instruction_derja: 'Khallat kol chay b yeddik belgdé bech el ka3bet mta3 el rouz tochrob el fowye7 wel zit el kol.',
        instruction_ar: 'اخلط المكونات جيداً بيدك حتى تتشرب كل حبة أرز التتبيلة الحمراء والزيت.'
      },
      {
        step_number: 4,
        instruction_fr: 'Placez le mélange dans le couscoussier (kaskas) au-dessus d\'une marmite d\'eau bouillante et laissez cuire à la vapeur pendant 35 à 40 minutes en remuant à mi-cuisson.',
        instruction_derja: '7ottou fel kaskas fo9 el me9foul fih ma yghli, w khallih yfawer 35-40 d9i9a, a3mel ta7rika f nos el waqt.',
        instruction_ar: 'ضع الخليط في الكسكاس فوق مقفول ماء يغلي، واتركه يطهى على البخار لمدة 35-40 دقيقة مع تحريكه مرة في المنتصف.'
      }
    ],
    chef_tip: {
      fr: 'Ne tassez pas le riz dans le couscoussier pour que la vapeur circule librement. Vérifiez la cuisson en goûtant un grain de riz et un morceau de foie.',
      derja: 'Matrazez-ch el rouz fel kaskas bech el fowar yet3adda fih belgdé. Dhou9 ka3ba rouz bech tthabbet fel tyoub.',
      ar: 'لا تضغط على الأرز داخل الكسكاس ليتخلله البخار بسهولة. تذوق حبة أرز للتأكد من تمام النضج.'
    },
    is_published: true,
    is_healthy: true,
  },

  // 7. TAJINE TOUNSI
  {
    id: 'rec_tajine_tounsi',
    slug: 'tajine-tounsi-poulet',
    name_fr: 'Tajine Tunisien au Poulet',
    name_derja: 'Tajine Tounsi bel Djaj',
    name_ar: 'طاجين تونسي بالدجاج',
    description_fr: 'Le célèbre gâteau salé tunisien cuit au four : poulet doré aux oignons et curcuma, persil frais, fromage râpé et œufs battus.',
    description_derja: 'El tajine el tounsi el ma3rouf: djaj faye7 bel korkom w tabel, ma3dnous, jben mar7i w barcha 3dham marfoukhin fel four.',
    description_ar: 'أشهر مقبلة في المائدة التونسية: دجاج متبل بالكركم والبصل، معدنوس طازج، جبن مرحي وبيض مخفوق ومخبوز في الفرن.',
    image_url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80',
    prep_time_minutes: 15,
    cook_time_minutes: 30,
    base_servings: 6,
    estimated_cost_tnd: 13.5,
    category: 'plat_principal',
    cuisine_type: 'traditionnelle',
    difficulty: 'facile',
    ingredients: [
      { ingredient_id: 'ing_oeuf', quantity_base: 8, unit: 'pièces', role: 'key' },
      { ingredient_id: 'ing_poulet', quantity_base: 300, unit: 'g (blanc ou cuisse)', role: 'key', substitutes: ['ing_viande_hachee', 'ing_thon_boite'] },
      { ingredient_id: 'ing_persil', quantity_base: 1, unit: 'botte', role: 'secondary' },
      { ingredient_id: 'ing_oignon', quantity_base: 1, unit: 'pièce', role: 'secondary' },
      { ingredient_id: 'ing_fromage_rape', quantity_base: 100, unit: 'g', role: 'secondary' },
      { ingredient_id: 'ing_pomme_de_terre', quantity_base: 1, unit: 'pièce (frite en petits dés)', role: 'secondary' },
      { ingredient_id: 'ing_huile_olive', quantity_base: 3, unit: 'c.à.s', role: 'staple' },
      { ingredient_id: 'ing_curcuma', quantity_base: 1.5, unit: 'c.à.c', role: 'staple' },
      { ingredient_id: 'ing_tabel_karwiya', quantity_base: 1, unit: 'c.à.c', role: 'staple' },
      { ingredient_id: 'ing_sel_poivre', quantity_base: 1, unit: 'pincée', role: 'staple' },
    ],
    steps: [
      {
        step_number: 1,
        instruction_fr: 'Faites revenir les dés de poulet avec l\'oignon émincé, l\'huile d\'olive, le curcuma, le tabel, sel et poivre avec un filet d\'eau jusqu\'à cuisson complète et absorption du jus.',
        instruction_derja: 'Tayyeb el djaj m9ass sghir m3a bsal, zit zitouna, korkom, tabel, mel7 w felfel ak7el 7atta ychih men mou.',
        instruction_ar: 'اطبخ قطع الدجاج مع البصل وزيت الزيتون والكركم والتابل حتى ينضج تماماً ويتشرب مرقه.'
      },
      {
        step_number: 2,
        instruction_fr: 'Dans un saladier, mélangez le poulet refroidi, le persil très finement ciselé, les petits dés de pommes de terre frites et le fromage râpé.',
        instruction_derja: 'F shfa, khallat el djaj ba3d ma yebred, el ma3dnous el mhafhef, el batata el me9liya sghira wel jben.',
        instruction_ar: 'في إناء، اخلط الدجاج بعد أن يبرد مع المعدنوس المفروم، مكعبات البطاطا المقلية والجبن المرحي.'
      },
      {
        step_number: 3,
        instruction_fr: 'Battez les œufs en omelette et incorporez-les à la préparation. La texture doit être fluide mais bien garnie.',
        instruction_derja: 'Ikhfo9 el 3dham w sobbhom fo9 el khalta. Lezem el khalta tkoun jerya chwaya.',
        instruction_ar: 'اخفق البيض جيداً واسكبه فوق الخليط حتى يمتزج بشكل متجانس.'
      },
      {
        step_number: 4,
        instruction_fr: 'Versez dans un plat à gratin huilé et enfournez à 180°C pendant 25 à 30 minutes jusqu\'à ce que la surface soit joliment dorée.',
        instruction_derja: 'Sobb f tba9 madhoun b zit w da5lou lil four 3la 180°C moddet 25-30 d9i9a 7atta ye7mar mel fo9.',
        instruction_ar: 'اسكب الخليط في طبق فرن مدهون بالزيت واخبزه على حرارة 180 درجة مئوية لمدة 25-30 دقيقة حتى يتحمر.'
      }
    ],
    chef_tip: {
      fr: 'Laissez toujours tiédir le tajine 15 minutes avant de le découper en carrés parfaits, sinon il risque de s\'émietter à la coupe !',
      derja: 'Khalli el tajine yedfa 15 d9i9a 9bal mat9ossou, bech el 9asba to93ed chedda ro7ha w mezyana.',
      ar: 'اترك الطاجين يبرد قليلاً لمدة 15 دقيقة قبل تقطيعه إلى مربعات متناسقة كي لا يتفتت.'
    },
    is_published: true,
    is_healthy: false,
  },

  // 8. BRIK À L'ŒUF ET AU THON
  {
    id: 'rec_brik_oeuf_thon',
    slug: 'brik-oeuf-thon',
    name_fr: 'Brik à l\'Œuf et au Thon (Malsouka)',
    name_derja: 'Brik bel 3adhma wel Thon',
    name_ar: 'بريك بالبيض والتن',
    description_fr: 'La reine des entrées croustillantes : feuille de malsouka garnie de persil, oignons, thon, câpres et d\'un œuf coulant, dorée à l\'huile et arrosée de citron.',
    description_derja: 'War9et malsouka m9armcha m3abya ma3dnous, thon, kabbara w 3adhma mrwaba, m3a 3asret 9ares.',
    description_ar: 'سيدة المقبلات التونسية: ورقة ملسوقة مقرمشة محشوة بالمعدنوس والتن والكبار وصفار بيض سائل مع رشة ليمون طازج.',
    image_url: 'https://images.unsplash.com/photo-1541518763669-27fef04b14ea?auto=format&fit=crop&w=800&q=80',
    prep_time_minutes: 10,
    cook_time_minutes: 5,
    base_servings: 4,
    estimated_cost_tnd: 7.5,
    category: 'entree',
    cuisine_type: 'rapide',
    difficulty: 'facile',
    ingredients: [
      { ingredient_id: 'ing_malsouka', quantity_base: 4, unit: 'feuilles', role: 'key' },
      { ingredient_id: 'ing_oeuf', quantity_base: 4, unit: 'pièces', role: 'key' },
      { ingredient_id: 'ing_thon_boite', quantity_base: 1, unit: 'boîte', role: 'secondary', substitutes: ['ing_viande_hachee'] },
      { ingredient_id: 'ing_persil', quantity_base: 0.5, unit: 'botte', role: 'secondary' },
      { ingredient_id: 'ing_oignon', quantity_base: 0.5, unit: 'pièce', role: 'secondary' },
      { ingredient_id: 'ing_capres', quantity_base: 1, unit: 'c.à.s', role: 'staple' },
      { ingredient_id: 'ing_fromage_rape', quantity_base: 50, unit: 'g', is_optional: true, role: 'secondary' },
      { ingredient_id: 'ing_citron', quantity_base: 1, unit: 'pièce', role: 'secondary' },
      { ingredient_id: 'ing_sel_poivre', quantity_base: 1, unit: 'pincée', role: 'staple' },
    ],
    steps: [
      {
        step_number: 1,
        instruction_fr: 'Posez une feuille de malsouka à plat sur une assiette. Disposez un lit de persil et d\'oignon finement ciselés au centre.',
        instruction_derja: '7ott war9et el malsouka 3la s7an mostawi. 7ott chwaya ma3dnous w bsal mhafhefin f el wost.',
        instruction_ar: 'ضع ورقة الملسوقة منبسطة في صحن، وضع في وسطها القليل من المعدنوس والبصل المفرومين.'
      },
      {
        step_number: 2,
        instruction_fr: 'Ajoutez une cuillère de thon émietté, quelques câpres et une pincée de sel et poivre.',
        instruction_derja: 'Zid chwaya thon mfarrak, ka3bet kabbara, rachet mel7 w felfel ak7el.',
        instruction_ar: 'أضف التن، حبات الكبار، ورشة ملح وفلفل أسود.'
      },
      {
        step_number: 3,
        instruction_fr: 'Cassez délicatement un œuf au milieu de la garniture. Repliez la feuille en demi-lune ou en triangle.',
        instruction_derja: 'Faqqes 3adhma f el wost b lotf. Thanni el war9a 3la zouz (triangle walla demi-lune).',
        instruction_ar: 'افقس بيضة بلطف في الوسط، واطوِ ورقة الملسوقة على شكل مثلث أو نصف دائرة.'
      },
      {
        step_number: 4,
        instruction_fr: 'Glissez immédiatement dans une huile bien chaude. Faites dorer 1 minute de chaque côté et servez brûlant avec des quartiers de citron.',
        instruction_derja: 'Zalla9ha fisa3 f zit skhoun. Khalliha te7mar d9i9a men kol chira w sarbiha skhouna m3a 9ares.',
        instruction_ar: 'أنزلها فوراً في زيت ساخن، واتركها تتحمر دقيقة من كل جانب وقدّمها ساخنة مع الليمون.'
      }
    ],
    chef_tip: {
      fr: 'Pour un œuf bien coulant, huilez la poêle très chaude et ne dépassez pas 60 à 90 secondes de friture au total !',
      derja: 'Bech el 3adhma to93ed mrwaba, el zit lezem skhoun belgdé w matkhalihéch akther men d9i9a w nos f el me9la.',
      ar: 'للحصول على صفار بيض سائل، تأكد أن الزيت ساخن جداً ولا تترك البريكة أكثر من دقيقة ونصف في الزيت.'
    },
    is_published: true,
    is_healthy: false,
  },

  // 9. SLATA MECHOUIA
  {
    id: 'rec_slata_mechouia',
    slug: 'slata-mechouia',
    name_fr: 'Salade Méchouia Tunisienne',
    name_derja: 'Slata Méchouia Tounsia',
    name_ar: 'سلاطة مشوية تونسية',
    description_fr: 'L\'icône de la fraîcheur tunisienne : piments, tomates et ail grillés sur la braise ou au four, pilés et assaisonnés d\'huile d\'olive, carvi, thon et œufs durs.',
    description_derja: 'Slata mechouia bel felfel, tmatem w thoum mechwiyin, mad9ou9in fel mehrez m3a tabel w karwiya, zit zitouna w thon.',
    description_ar: 'أشهر سلاطة تونسية: فلفل وطماطم وثوم مشوي ومدقوق في المهراس مع التابل والكروية وزيت الزيتونة والتن والبيض المسلوق.',
    image_url: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=800&q=80',
    prep_time_minutes: 20,
    cook_time_minutes: 15,
    base_servings: 4,
    estimated_cost_tnd: 7.0,
    category: 'entree',
    cuisine_type: 'traditionnelle',
    difficulty: 'facile',
    ingredients: [
      { ingredient_id: 'ing_piment', quantity_base: 6, unit: 'pièces', role: 'key' },
      { ingredient_id: 'ing_tomate', quantity_base: 3, unit: 'pièces', role: 'key' },
      { ingredient_id: 'ing_ail', quantity_base: 5, unit: 'gousses', role: 'staple' },
      { ingredient_id: 'ing_oignon', quantity_base: 1, unit: 'pièce', is_optional: true, role: 'secondary' },
      { ingredient_id: 'ing_huile_olive', quantity_base: 4, unit: 'c.à.s', role: 'staple' },
      { ingredient_id: 'ing_tabel_karwiya', quantity_base: 1, unit: 'c.à.s', role: 'staple' },
      { ingredient_id: 'ing_thon_boite', quantity_base: 1, unit: 'boîte', role: 'secondary' },
      { ingredient_id: 'ing_oeuf', quantity_base: 2, unit: 'pièces (durs)', role: 'secondary' },
      { ingredient_id: 'ing_olives', quantity_base: 50, unit: 'g', is_optional: true, role: 'staple' },
      { ingredient_id: 'ing_sel_poivre', quantity_base: 1, unit: 'pincée', role: 'staple' },
    ],
    steps: [
      {
        step_number: 1,
        instruction_fr: 'Faites griller les piments, tomates, oignon et gousses d\'ail au four sous le gril ou directement sur la flamme jusqu\'à ce que la peau noircisse.',
        instruction_derja: 'Ichwi el felfel, tmatem, bsal wel thoum fel four walla 3la el nar 7atta el 9echra tek7al.',
        instruction_ar: 'اشوِ الفلفل والطماطم والبصل والثوم في الفرن أو فوق النار حتى تحترق القشرة الخارجية.'
      },
      {
        step_number: 2,
        instruction_fr: 'Enfermez les légumes chauds dans un sac propre pendant 5 minutes pour faciliter l\'épluchage, puis retirez délicatement la peau brûlée et les pépins des piments.',
        instruction_derja: '7otthom f sachet 5 d9aye9 bech el 9echra tatla3 fisa3, w na77i el 9chour el ka7la wel zri3a.',
        instruction_ar: 'ضع الخضار في كيس مغلق 5 دقائق ليسهل تقشيرها، ثم أزل القشرة المحترقة وبذور الفلفل.'
      },
      {
        step_number: 3,
        instruction_fr: 'Concassez le tout au couteau ou au pilon (mehrez) sans jamais utiliser de mixeur électrique pour préserver la consistance.',
        instruction_derja: 'Odo9 el khadhra fel mehrez walla 9oss-ha bel skina. Rod belek testa3mel robot!',
        instruction_ar: 'ادق الخضار في المهراس أو افرمها بالسكين وتجنب استعمال الخلاط الكهربائي تماماً.'
      },
      {
        step_number: 4,
        instruction_fr: 'Assaisonnez de sel, carvi moulu et d\'une généreuse dose d\'huile d\'olive. Décorez de thon, d\'olives et de quartiers d\'œufs durs.',
        instruction_derja: 'Fawa7 bel mel7, tabel w karwiya w zit zitouna 7or. Zayyen bel thon, zaytoun w 3dham masmou9a.',
        instruction_ar: 'تبّل بالملح والتابل والكروية وزيت الزيتون البكر، وزيّن بالتن والزيتون والبيض المسلوق.'
      }
    ],
    chef_tip: {
      fr: 'Ne lavez jamais les légumes grillés à l\'eau pour les éplucher : cela enlèverait tout le bon goût de fumé !',
      derja: 'Mata8selch el khadhra el mechwiya bel ma ! Khalli nouwachet el 7ri9 el sghira heya elli ta3ti el banna.',
      ar: 'إياك وغسل الخضار المشوية بالماء أثناء التقشير كي لا تفقد نكهة الشواء المدخنة الأصيلة.'
    },
    is_published: true,
    is_healthy: true,
  },

  // 10. COUSCOUS TOUNSI
  {
    id: 'rec_couscous_allouch',
    slug: 'couscous-tounsi-allouch',
    name_fr: 'Couscous Tunisien à l\'Agneau et aux Légumes',
    name_derja: 'Kosksi Tounsi bel 3allouch wel Khadhra',
    name_ar: 'كسكسي تونسي باللحم والخضار',
    description_fr: 'Le monument culinaire tunisien : semoule fine cuite à la vapeur du bouillon de viande d\'agneau, carottes, navets, courge rouge, pois chiches et piment frit.',
    description_derja: 'El kosksi el tounsi el asel: kosksi mfawar fo9 mra9 el 3allouch, khadhra, 7oms, 9ra3 a7mar w felfel me9li.',
    description_ar: 'سيد الأطباق التونسية: كسكسي مفور فوق مرق لحم العلوش مع الخضار المشكلة، الحمص المنقوع، القرع الأحمر والفلفل المقلي.',
    image_url: 'https://images.unsplash.com/photo-1541518763669-27fef04b14ea?auto=format&fit=crop&w=800&q=80',
    prep_time_minutes: 25,
    cook_time_minutes: 60,
    base_servings: 6,
    estimated_cost_tnd: 28.0,
    category: 'plat_principal',
    cuisine_type: 'traditionnelle',
    difficulty: 'avance',
    ingredients: [
      { ingredient_id: 'ing_semoule_couscous', quantity_base: 500, unit: 'g', role: 'key' },
      { ingredient_id: 'ing_agneau', quantity_base: 500, unit: 'g', role: 'key', substitutes: ['ing_poulet', 'ing_boeuf'] },
      { ingredient_id: 'ing_oignon', quantity_base: 2, unit: 'pièces', role: 'secondary' },
      { ingredient_id: 'ing_tomate_concentree', quantity_base: 3, unit: 'c.à.s', role: 'secondary' },
      { ingredient_id: 'ing_harissa', quantity_base: 1, unit: 'c.à.s', role: 'staple' },
      { ingredient_id: 'ing_carotte', quantity_base: 3, unit: 'pièces', role: 'secondary' },
      { ingredient_id: 'ing_navet', quantity_base: 2, unit: 'pièces', role: 'secondary' },
      { ingredient_id: 'ing_potiron', quantity_base: 300, unit: 'g', role: 'secondary' },
      { ingredient_id: 'ing_pois_chiches', quantity_base: 150, unit: 'g', role: 'secondary' },
      { ingredient_id: 'ing_piment', quantity_base: 4, unit: 'pièces', role: 'secondary' },
      { ingredient_id: 'ing_huile_olive', quantity_base: 6, unit: 'c.à.s', role: 'staple' },
      { ingredient_id: 'ing_tabel_karwiya', quantity_base: 2, unit: 'c.à.c', role: 'staple' },
      { ingredient_id: 'ing_piment_moulu', quantity_base: 1.5, unit: 'c.à.c', role: 'staple' },
      { ingredient_id: 'ing_sel_poivre', quantity_base: 1, unit: 'pincée', role: 'staple' },
    ],
    steps: [
      {
        step_number: 1,
        instruction_fr: 'Dans le bas du couscoussier, faites dorer les morceaux d\'agneau avec les oignons dans l\'huile d\'olive. Ajoutez la tomate concentrée, l\'harissa et les épices.',
        instruction_derja: 'Fi 9a3 el me9foul, 9alli el l7am m3a el bsal f zit zitouna. Zid tmatem ma3jouna, hrisa w fowye7.',
        instruction_ar: 'في المقفول، قلّ قطع اللحم مع البصل في زيت الزيتونة، ثم أضف الطماطم المعجونة والهريسة والبهارات.'
      },
      {
        step_number: 2,
        instruction_fr: 'Mouillez avec 1,5 litre d\'eau chaude. Ajoutez les pois chiches, les carottes et les navets coupés en deux. Portez à ébullition.',
        instruction_derja: 'Marra9 b lytro w nos ma skhoun. Zid el 7oms, el sfennerya wel left m9assasin 3la thnin w khalliha teghli.',
        instruction_ar: 'أضف لتراً ونصف من الماء الساخن، ثم أضف الحمص والجزر واللفت واترك المرق يغلي.'
      },
      {
        step_number: 3,
        instruction_fr: 'Humidifiez la semoule avec un peu d\'eau tiède, du sel et 2 cuillères d\'huile. Placez dans le haut du couscoussier (kaskas) au-dessus du bouillon et faites cuire à la vapeur 25 minutes.',
        instruction_derja: 'Bakhbakh el kosksi b chwaya ma, mel7 w 2 mgharref zit. 7ottou fel kaskas yfawer moddet 25 d9i9a.',
        instruction_ar: 'رشّ الكسكسي بالماء الدافئ والملح وملعقتين من الزيت، وضعه في الكسكاس ليطهى على البخار لمدة 25 دقيقة.'
      },
      {
        step_number: 4,
        instruction_fr: 'Retirez le couscous, égrainez-le, ajoutez le potiron et les piments dans le bouillon pour 15 minutes supplémentaires. Enfin, arrosez la semoule avec la sauce rouge onctueuse, laissez reposer 5 minutes et dressez.',
        instruction_derja: 'Habat el kosksi, 7ellou b mgharfa, zid el 9ra3 a7mar wel felfel fel mra9 15 d9i9a. Ba3d as9i el kosksi bel salsa el 7amra, khallih yochrob 5 d9aye9 w sarbi.',
        instruction_ar: 'أنزل الكسكسي وافتحه بالملعقة، وأضف القرع الأحمر والفلفل للمرق لمدة 15 دقيقة، ثم اسقِ الكسكسي بالمرق الأحمر اللذيذ واتركه يتشرب 5 دقائق قبل التقديم.'
      }
    ],
    chef_tip: {
      fr: 'Pour un couscous parfait, arrosez la semoule avec le bouillon bien rouge et gras sans la noyer, puis couvrez le plat avec un torchon propre pendant 5 minutes avant de décorer.',
      derja: 'Kif tes9i el kosksi, ghattih b mendila ndhifa 5 d9aye9 bech yochrob el mra9 w ywali rtab w m3atar.',
      ar: 'عند سقي الكسكسي، غطّ الصحن بمنديل نظيف لمدة 5 دقائق ليتشرب المرق ويصبح رطباً وطرياً وفواحاً.'
    },
    is_published: true,
    is_healthy: false,
  },

  // 11. CHORBA FRIK
  {
    id: 'rec_chorba_frik',
    slug: 'chorba-frik-tounsia',
    name_fr: 'Chorba Frik Tunisienne (Blé Vert)',
    name_derja: 'Chorba Frik Tounsia bel Djaj',
    name_ar: 'شوربة فريك تونسية بالدجاج',
    description_fr: 'La soupe réconfortante et parfumée de toutes les tables tunisiennes : blé vert concassé mijoté avec du céleri, tomate, ail et morceaux de poulet.',
    description_derja: 'Chorba frik fey7a bel krafes, tmatem, thoum, djaj w 3asret 9ares.',
    description_ar: 'شوربة الفريك التونسية الشهية بحبوب القمح الأخضر المجروش مع الكرفس وصلصة الطماطم وقطع الدجاج والليمون.',
    image_url: 'https://images.unsplash.com/photo-1541518763669-27fef04b14ea?auto=format&fit=crop&w=800&q=80',
    prep_time_minutes: 10,
    cook_time_minutes: 30,
    base_servings: 4,
    estimated_cost_tnd: 9.0,
    category: 'entree',
    cuisine_type: 'traditionnelle',
    difficulty: 'facile',
    ingredients: [
      { ingredient_id: 'ing_frik', quantity_base: 120, unit: 'g', role: 'key' },
      { ingredient_id: 'ing_poulet', quantity_base: 250, unit: 'g', role: 'key', substitutes: ['ing_agneau', 'ing_boeuf'] },
      { ingredient_id: 'ing_celeri', quantity_base: 0.5, unit: 'botte', role: 'secondary' },
      { ingredient_id: 'ing_persil', quantity_base: 0.5, unit: 'botte', role: 'secondary' },
      { ingredient_id: 'ing_oignon', quantity_base: 1, unit: 'pièce', role: 'secondary' },
      { ingredient_id: 'ing_tomate_concentree', quantity_base: 2, unit: 'c.à.s', role: 'secondary' },
      { ingredient_id: 'ing_harissa', quantity_base: 0.5, unit: 'c.à.s', role: 'staple' },
      { ingredient_id: 'ing_ail', quantity_base: 3, unit: 'gousses', role: 'staple' },
      { ingredient_id: 'ing_huile_olive', quantity_base: 3, unit: 'c.à.s', role: 'staple' },
      { ingredient_id: 'ing_tabel_karwiya', quantity_base: 1, unit: 'c.à.c', role: 'staple' },
      { ingredient_id: 'ing_curcuma', quantity_base: 0.5, unit: 'c.à.c', role: 'staple' },
      { ingredient_id: 'ing_citron', quantity_base: 1, unit: 'pièce', role: 'secondary' },
      { ingredient_id: 'ing_sel_poivre', quantity_base: 1, unit: 'pincée', role: 'staple' },
    ],
    steps: [
      {
        step_number: 1,
        instruction_fr: 'Faites revenir les dés de poulet avec l\'oignon haché, l\'huile d\'olive et le céleri émincé pendant 3 minutes.',
        instruction_derja: '9alli morsewet el djaj m3a el bsal, zit zitouna wel krafes el m9ass 3 d9aye9.',
        instruction_ar: 'قلّ قطع الدجاج مع البصل وزيت الزيتون والكرفس المفروم لمدة 3 دقائق.'
      },
      {
        step_number: 2,
        instruction_fr: 'Ajoutez la tomate concentrée, l\'harissa, le curcuma, le tabel et couvrez d\'un litre d\'eau chaude.',
        instruction_derja: 'Zid tmatem ma3jouna, hrisa, korkom, tabel w marra9 b lytro ma skhoun.',
        instruction_ar: 'أضف الطماطم المعجونة، الهريسة، الكركم، التابل واسكب لتراً من الماء الساخن.'
      },
      {
        step_number: 3,
        instruction_fr: 'Rincez le frik à l\'eau claire et versez-le en pluie dans la soupe bouillante. Remuez régulièrement pour éviter qu\'il n\'attache au fond.',
        instruction_derja: 'I8sel el frik belgdé w sobbou f el chorba teghli. 7arrek kol marra bech mayelssa9ch fel 9a3.',
        instruction_ar: 'اغسل الفريك وصبه في الشوربة وهي تغلي، وحرك بانتظام حتى لا يلتصق بالقاع.'
      },
      {
        step_number: 4,
        instruction_fr: 'Laissez mijoter 25 minutes à feu doux jusqu\'à ce que la chorba épaississe. Parsemez de persil frais et servez avec un filet de jus de citron.',
        instruction_derja: 'Khalliha tib 25 d9i9a 3la nar hebya 7atta takhther. Rouch ma3dnous w sobb 3asret 9ares.',
        instruction_ar: 'اتركها تطهى 25 دقيقة على نار هادئة حتى تتخثر، ثم رش المعدنوس الطازج وعصير الليمون.'
      }
    ],
    chef_tip: {
      fr: 'Le céleri frais (krafes) est l\'âme de la chorba frik tunisienne : hachez les feuilles et les tiges très finement.',
      derja: 'El krafes houwa rou7 el chorba frik ! 9ossou jwayed m3a l\'oignon fel bdeya bech ysayeb ri7tou.',
      ar: 'الكرفس الأخضر هو روح الشوربة التونسية: افرم الأوراق والأغصان ناعماً وقلّها في البداية.'
    },
    is_published: true,
    is_healthy: true,
  },

  // 12. KASKROUT TOUNSI / CHAPATI
  {
    id: 'rec_kaskrout_tounsi',
    slug: 'kaskrout-tounsi-express',
    name_fr: 'Sandwich Tunisien Express (Kaskrout Tounsi)',
    name_derja: 'Kaskrout Tounsi 3al Foureur',
    name_ar: 'كسكروت تونسي بالهريسة والتن',
    description_fr: 'Le casse-croûte mythique de la street-food tunisienne : baguette croustillante tartinée d\'harissa délayée à l\'huile d\'olive, salade méchouia, thon, œuf dur, frites et olives.',
    description_derja: 'El kaskrout el tounsi el ma7boub: baguette m9armcha madhouna hrisa b zit zitouna, méchouia, thon, 3adhma masmou9a, batata me9liya w zaytoun.',
    description_ar: 'سندويتش الشارع التونسي الأشهر: خبز باغات مقرمش مدهون بالهريسة وزيت الزيتون مع سلاطة مشوية، تن، بيض مسلوق، بطاطا مقلية وزيتون.',
    image_url: 'https://images.unsplash.com/photo-1509722747041-616f39b57569?auto=format&fit=crop&w=800&q=80',
    prep_time_minutes: 10,
    cook_time_minutes: 5,
    base_servings: 2,
    estimated_cost_tnd: 6.0,
    category: 'plat_principal',
    cuisine_type: 'rapide',
    difficulty: 'facile',
    ingredients: [
      { ingredient_id: 'ing_pain_baguette', quantity_base: 1, unit: 'baguette', role: 'key' },
      { ingredient_id: 'ing_harissa', quantity_base: 1, unit: 'c.à.s', role: 'staple' },
      { ingredient_id: 'ing_huile_olive', quantity_base: 2, unit: 'c.à.s', role: 'staple' },
      { ingredient_id: 'ing_thon_boite', quantity_base: 1, unit: 'boîte', role: 'secondary' },
      { ingredient_id: 'ing_oeuf', quantity_base: 2, unit: 'pièces (durs)', role: 'secondary' },
      { ingredient_id: 'ing_pomme_de_terre', quantity_base: 1, unit: 'pièce (frites)', role: 'secondary' },
      { ingredient_id: 'ing_olives', quantity_base: 30, unit: 'g', role: 'staple' },
      { ingredient_id: 'ing_capres', quantity_base: 1, unit: 'c.à.c', is_optional: true, role: 'staple' },
    ],
    steps: [
      {
        step_number: 1,
        instruction_fr: 'Fendez la baguette en deux dans la longueur.',
        instruction_derja: '7ell el baguette 3la toulha.',
        instruction_ar: 'افتح خبز الباغات طولياً.'
      },
      {
        step_number: 2,
        instruction_fr: 'Délayez l\'harissa avec l\'huile d\'olive et une goutte d\'eau tiède, puis tartinez généreusement la mie de pain.',
        instruction_derja: '7ell el hrisa b chwaya zit zitouna w 9atret ma, w idhen el khobz mel dakhel belgdé.',
        instruction_ar: 'حلّ الهريسة بقليل من زيت الزيتون وادهن باطن الخبز بسخاء.'
      },
      {
        step_number: 3,
        instruction_fr: 'Garnissez avec le thon émietté, les œufs durs coupés en rondelles, quelques frites chaudes, des olives et des câpres.',
        instruction_derja: '3abbi bel thon, el 3dham el masmou9a m9assa rondelle-let, chwaya frites skhouna, zaytoun w kabbara.',
        instruction_ar: 'احشُ الخبز بالتن المفرك ودوائر البيض المسلوق وقليل من البطاطا المقلية والزيتون والكبار.'
      },
      {
        step_number: 4,
        instruction_fr: 'Refermez le sandwich, pressez légèrement et dégustez immédiatement.',
        instruction_derja: 'Saker el kaskrout, erzel 3lih chwaya b yeddik w koll sa77a w bechfè.',
        instruction_ar: 'أغلق السندويتش واضغط عليه برفق واستمتع بطعمه الرائع.'
      }
    ],
    chef_tip: {
      fr: 'Ajoutez une cuillère de salade méchouia dans le sandwich pour l\'authentique goût des kaskrouts de La Marsa ou de Bab Souika.',
      derja: 'Zid mgharfa slata méchouia fel 9alb bech yji kima kaskrout el 7anout el asel.',
      ar: 'أضف ملعقة سلاطة مشوية داخل السندويتش للحصول على النكهة التونسية الأصيلة.'
    },
    is_published: true,
    is_healthy: false,
  },

  // 13. BATATA FEL FOUR
  {
    id: 'rec_batata_four',
    slug: 'batata-fel-four',
    name_fr: 'Pommes de Terre au Four à la Tunisienne',
    name_derja: 'Batata fel Four Mfaw7a',
    name_ar: 'بطاطا في الفرن مفوحة بالكركم',
    description_fr: 'Plat familial ultra-simple et économique : pommes de terre fondantes rôties au four avec oignons, curcuma, romarin, piments et huile d\'olive.',
    description_derja: 'Batata m9assa morsewet kbira fel four m3a bsal, korkom, tabel, zit zitouna w groun felfel.',
    description_ar: 'أكلة عائلية اقتصادية وسريعة: بطاطا مقطعة جوانح كبيرة ومتبلة بالكركم والتابل وزيت الزيتون ومخبوزة في الفرن مع البصل والفلفل.',
    image_url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80',
    prep_time_minutes: 10,
    cook_time_minutes: 35,
    base_servings: 4,
    estimated_cost_tnd: 5.0,
    category: 'plat_principal',
    cuisine_type: 'economique',
    difficulty: 'facile',
    ingredients: [
      { ingredient_id: 'ing_pomme_de_terre', quantity_base: 4, unit: 'pièces', role: 'key' },
      { ingredient_id: 'ing_oignon', quantity_base: 2, unit: 'pièces', role: 'secondary' },
      { ingredient_id: 'ing_piment', quantity_base: 3, unit: 'pièces', role: 'secondary' },
      { ingredient_id: 'ing_ail', quantity_base: 4, unit: 'gousses', role: 'staple' },
      { ingredient_id: 'ing_huile_olive', quantity_base: 5, unit: 'c.à.s', role: 'staple' },
      { ingredient_id: 'ing_curcuma', quantity_base: 1.5, unit: 'c.à.c', role: 'staple' },
      { ingredient_id: 'ing_tabel_karwiya', quantity_base: 1, unit: 'c.à.c', role: 'staple' },
      { ingredient_id: 'ing_sel_poivre', quantity_base: 1, unit: 'pincée', role: 'staple' },
    ],
    steps: [
      {
        step_number: 1,
        instruction_fr: 'Préchauffez le four à 200°C. Épluchez les pommes de terre et coupez-les en gros quartiers.',
        instruction_derja: 'Channal el four 3la 200°C. 9achar el batata w 9oss-ha morsewet kbira.',
        instruction_ar: 'سخن الفرن على حرارة 200 درجة مئوية، وقشر البطاطا وقطعها أرباعاً كبيرة.'
      },
      {
        step_number: 2,
        instruction_fr: 'Dans un grand plat à four, disposez les pommes de terre, les oignons en quartiers, l\'ail écrasé et les piments entiers.',
        instruction_derja: 'F tba9 el four, 7ott el batata, el bsal jwane7, el thoum wel groun felfel.',
        instruction_ar: 'في طبق الفرن، رتب البطاطا، أرباع البصل، الثوم المهروس وقرون الفلفل الكاملة.'
      },
      {
        step_number: 3,
        instruction_fr: 'Arrosez généreusement d\'huile d\'olive, ajoutez le curcuma, le tabel, sel, poivre et un demi-verre d\'eau. Mélangez avec les mains pour bien enrober.',
        instruction_derja: 'Sobb zit zitouna belgdé, zid korkom, tabel, mel7, felfel ak7el w nos kes ma. Khallat b yeddik.',
        instruction_ar: 'اسكب زيت الزيتون وأضف الكركم والتابل والملح ونصف كأس ماء واخلط المكونات بيدك جيداً.'
      },
      {
        step_number: 4,
        instruction_fr: 'Enfournez pendant 35 minutes jusqu\'à ce que les pommes de terre soient fondantes à cœur et croustillantes sur les bords.',
        instruction_derja: 'Tayyebha fel four 35 d9i9a 7atta el batata twali tayba zebdha mel dakhel w m9armcha mel barra.',
        instruction_ar: 'اخبزها لمدة 35 دقيقة حتى تصبح البطاطا طرية كالزبدة من الداخل ومقرمشة ومتحمرة من الخارج.'
      }
    ],
    chef_tip: {
      fr: 'Ajoutez une cuillère de tomate concentrée ou quelques rondelles de tomates si vous préférez une sauce rouge caramélisée.',
      derja: 'Tnejjem tzid mgharfa tmatem ma3jouna m7alloula fel ma ken t7ebha tjik 7amra.',
      ar: 'يمكنك إضافة ملعقة طماطم معجونة مذوبة في الماء إن كنت تفضل لوناً أحمر ونكهة مركزة.'
    },
    is_published: true,
    is_healthy: true,
  },

  // 14. MLOUKHIYA TOUNSIA
  {
    id: 'rec_mloukhiya',
    slug: 'mloukhiya-tounsia',
    name_fr: 'Mloukhiya Tunisienne au Bœuf',
    name_derja: 'Mloukhiya Tounsia bel Begri',
    name_ar: 'ملوخية تونسية باللحم البقري',
    description_fr: 'Le joyau mijoté de la gastronomie tunisienne : poudre de corète délayée dans l\'huile d\'olive et mijotée longuement avec du bœuf fondant, de l\'ail et du laurier.',
    description_derja: 'El mloukhiya el fey7a el msayba zit-ha: ghabret mloukhiya tayba f zit zitouna m3a l7am begri, rand, thoum w tabel.',
    description_ar: 'جوهرة المطبخ التونسي: ملوخية مجففة ومرحية مطبوخة على نار هادئة لساعات في زيت الزيتون مع لحم البقر والرند والثوم.',
    image_url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80',
    prep_time_minutes: 15,
    cook_time_minutes: 120,
    base_servings: 6,
    estimated_cost_tnd: 26.0,
    category: 'plat_principal',
    cuisine_type: 'traditionnelle',
    difficulty: 'moyen',
    ingredients: [
      { ingredient_id: 'ing_mloukhiya_poudre', quantity_base: 100, unit: 'g', role: 'key' },
      { ingredient_id: 'ing_boeuf', quantity_base: 500, unit: 'g', role: 'key' },
      { ingredient_id: 'ing_huile_olive', quantity_base: 150, unit: 'ml', role: 'staple' },
      { ingredient_id: 'ing_ail', quantity_base: 8, unit: 'gousses', role: 'staple' },
      { ingredient_id: 'ing_tabel_karwiya', quantity_base: 2, unit: 'c.à.s', role: 'staple' },
      { ingredient_id: 'ing_harissa', quantity_base: 1, unit: 'c.à.c', role: 'staple' },
      { ingredient_id: 'ing_sel_poivre', quantity_base: 1, unit: 'pincée', role: 'staple' },
    ],
    steps: [
      {
        step_number: 1,
        instruction_fr: 'Dans une grande marmite, mélangez à froid la poudre de mloukhiya avec l\'huile d\'olive jusqu\'à obtenir une pâte lisse.',
        instruction_derja: 'F tnjra kbira, 7ell ghabret el mloukhiya 3al bered m3a zit zitouna 7atta twali pâte malsa.',
        instruction_ar: 'في طنجرة، اخلط مسحوق الملوخية مع زيت الزيتون على البارد حتى يصبح قوامها سائلاً وأملس.'
      },
      {
        step_number: 2,
        instruction_fr: 'Faites chauffer à feu doux en remuant constamment pendant 3 minutes, puis versez 1,5 litre d\'eau bouillante d\'un coup en remuant vivement.',
        instruction_derja: 'Tayyebha 3la nar hebya 3 d9aye9 m3a el ta7rik, ba3d sobb lytro w nos ma yghli marra wa7da w 7arrek fisa3.',
        instruction_ar: 'اطبخها على نار هادئة 3 دقائق مع التحريك المستمر، ثم اسكب لتراً ونصف من الماء المغلي دفعة واحدة وحرك بقوة.'
      },
      {
        step_number: 3,
        instruction_fr: 'Laissez frémir à tout petit feu pendant 1h30. Pendant ce temps, marinez la viande avec l\'ail écrasé, le tabel, sel et poivre.',
        instruction_derja: 'Khalliha teghli 3la nar dhabla se3a w nos. F nafs el waqt fawa7 el l7am bel thoum, tabel, mel7 w felfel ak7el.',
        instruction_ar: 'اتركها تغلي على نار هادئة جداً لمدة ساعة ونصف. في هذه الأثناء تبّل اللحم بالثوم المهروس والتابل والملح.'
      },
      {
        step_number: 4,
        instruction_fr: 'Ajoutez la viande marinée dans la mloukhiya et laissez mijoter encore 45 minutes jusqu\'à ce que la viande soit ultra fondante et que l\'huile d\'olive remonte entièrement à la surface.',
        instruction_derja: 'Zid el l7am fel mloukhiya w khalliha tib 45 d9i9a okhra 7atta el l7am yetferrek w el mloukhiya t9atter zit-ha el kol.',
        instruction_ar: 'أضف اللحم المتبل للملوخية واتركها تطهى 45 دقيقة إضافية حتى يذوب اللحم ويطفو الزيت الصافي بالكامل على السطح.'
      }
    ],
    chef_tip: {
      fr: 'La règle d\'or : la mloukhiya est prête uniquement quand elle "saybet zit-ha" (une couche d\'huile brillante surnage à la surface). Plus elle mijote doucement, meilleure elle est !',
      derja: 'El mloukhiya ma ti7dher ken ma "tsayeb zit-ha" el kol mel fo9. Koll ma tib 3la nar hebya, koll ma tji a3azz.',
      ar: 'علامة نضج الملوخية التونسية الوحيدة أن يطفو زيتها بالكامل على السطح. كلما طبخت على نار هادئة جداً ازدادت عراقة ولذة.'
    },
    is_published: true,
    is_healthy: false,
  },

  // 15. SLATA TOUNSIA
  {
    id: 'rec_slata_tounsia',
    slug: 'slata-tounsia-fraiche',
    name_fr: 'Salade Tunisienne Fraîche (Slata Tounsia)',
    name_derja: 'Slata Tounsia Khadhra',
    name_ar: 'سلاطة تونسية خضراء منعشة',
    description_fr: 'La salade quotidienne rafraîchissante : concombres croquants, tomates, piments doux et oignons coupés en tout petits dés, parfumée à la menthe séchée.',
    description_derja: 'El slata el khadhra el mnawra: feggous, tmatem, felfel w bsal m9assasin sghir barcha, m3a na3ne3 cheye7, 9ares w zit zitouna.',
    description_ar: 'السلطة اليومية المنعشة في كل بيت تونسي: خيار، طماطم، فلفل وبصل مقطعة مكعبات صغيرة جداً مع النعناع المجفف والليمون وزيت الزيتون.',
    image_url: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=800&q=80',
    prep_time_minutes: 10,
    cook_time_minutes: 0,
    base_servings: 4,
    estimated_cost_tnd: 4.5,
    category: 'entree',
    cuisine_type: 'vegetarienne',
    difficulty: 'facile',
    ingredients: [
      { ingredient_id: 'ing_concombre', quantity_base: 2, unit: 'pièces', role: 'key' },
      { ingredient_id: 'ing_tomate', quantity_base: 2, unit: 'pièces', role: 'key' },
      { ingredient_id: 'ing_piment', quantity_base: 1, unit: 'pièce', role: 'secondary' },
      { ingredient_id: 'ing_oignon', quantity_base: 0.5, unit: 'pièce', role: 'secondary' },
      { ingredient_id: 'ing_menthe_sechee', quantity_base: 1, unit: 'c.à.s', role: 'staple' },
      { ingredient_id: 'ing_citron', quantity_base: 1, unit: 'pièce', role: 'secondary' },
      { ingredient_id: 'ing_huile_olive', quantity_base: 3, unit: 'c.à.s', role: 'staple' },
      { ingredient_id: 'ing_thon_boite', quantity_base: 0.5, unit: 'boîte', is_optional: true, role: 'secondary' },
      { ingredient_id: 'ing_oeuf', quantity_base: 1, unit: 'pièce (dur)', is_optional: true, role: 'secondary' },
      { ingredient_id: 'ing_sel_poivre', quantity_base: 1, unit: 'pincée', role: 'staple' },
    ],
    steps: [
      {
        step_number: 1,
        instruction_fr: 'Lavez les concombres, tomates et piments. Coupez tous les légumes en minuscules petits dés de 5 mm.',
        instruction_derja: 'I8sel el feggous, tmatem wel felfel. 9oss el khadhra el kol morsewet sghira barcha.',
        instruction_ar: 'اغسل الخيار والطماطم والفلفل، وقطع جميع الخضار مكعبات صغيرة جداً.'
      },
      {
        step_number: 2,
        instruction_fr: 'Mettez les légumes coupés dans un saladier.',
        instruction_derja: '7ott el khadhra f sa7fa.',
        instruction_ar: 'ضع الخضار في صحن التقديم.'
      },
      {
        step_number: 3,
        instruction_fr: 'Assaisonnez de sel, poivre, jus de citron frais et huile d\'olive.',
        instruction_derja: 'Fawa7 bel mel7, felfel ak7el, 3asret 9ares w zit zitouna.',
        instruction_ar: 'تبل بالملح والفلفل الأسود وعصير الليمون الطازج وزيت الزيتون.'
      },
      {
        step_number: 4,
        instruction_fr: 'Frottez la menthe séchée entre vos paumes pour la réduire en poudre fine sur la salade. Mélangez et décorez d\'un peu de thon.',
        instruction_derja: 'Farrek el na3ne3 el cheye7 bin yeddik fo9 el slata. Khallat w zayyen b chwaya thon.',
        instruction_ar: 'افرك النعناع الجاف بين راحتيك ونثره فوق السلطة، واخلط وزين بقليل من التن.'
      }
    ],
    chef_tip: {
      fr: 'La menthe séchée (na3ne3 cheye7) frottée à la main apporte toute la touche authentique inimitable de la Slata Tounsia !',
      derja: 'El na3ne3 el cheye7 houwa elli ya3ti el banna el tounsia el 7a9a9iya fel slata.',
      ar: 'فرك النعناع المجفف باليد يعطي النكهة التونسية العطرية المنعشة التي تميز هذه السلطة.'
    },
    is_published: true,
    is_healthy: true,
  }
];

export const initialRecipes: Recipe[] = [...savoryRecipes, ...tunisianRecipes, ...internationalRecipes, ...dessertRecipes];
