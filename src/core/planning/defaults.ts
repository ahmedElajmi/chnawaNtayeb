import type { DayPlan } from './types';

/** Menu shown to a new user (every meal has a main course). */
export const DEFAULT_WEEKLY_PLAN: DayPlan[] = [
  {
    day_id: 'mon',
    day_name_fr: 'Lundi',
    day_name_derja: 'El Ethnin',
    day_name_ar: 'الإثنين',
    lunch: { plat_id: 'rec_ojja_merguez', entree_id: 'rec_slata_tounsia' },
    dinner: { plat_id: 'rec_kaskrout_tounsi' },
  },
  {
    day_id: 'tue',
    day_name_fr: 'Mardi',
    day_name_derja: 'El Thlatha',
    day_name_ar: 'الثلاثاء',
    lunch: { plat_id: 'rec_chakchouka_bsal' },
    dinner: { plat_id: 'rec_batata_four', entree_id: 'rec_chorba_frik' },
  },
  {
    day_id: 'wed',
    day_name_fr: 'Mercredi',
    day_name_derja: 'El Arba3',
    day_name_ar: 'الأربعاء',
    lunch: { plat_id: 'rec_kafteji' },
    dinner: { plat_id: 'rec_lablabi' },
  },
  {
    day_id: 'thu',
    day_name_fr: 'Jeudi',
    day_name_derja: 'El Khemis',
    day_name_ar: 'الخميس',
    lunch: { plat_id: 'rec_makarouna_salsa_djaj', entree_id: 'rec_brik_oeuf_thon' },
    dinner: { plat_id: 'rec_tajine_tounsi' },
  },
  {
    day_id: 'fri',
    day_name_fr: 'Vendredi',
    day_name_derja: 'El Jom3a',
    day_name_ar: 'الجمعة',
    lunch: { plat_id: 'rec_couscous_allouch', entree_id: 'rec_slata_mechouia', dessert_id: 'rec_slata_bordgen' },
    dinner: { plat_id: 'rec_kaskrout_tounsi' },
  },
  {
    day_id: 'sat',
    day_name_fr: 'Samedi',
    day_name_derja: 'El Sebt',
    day_name_ar: 'السبت',
    lunch: { plat_id: 'rec_rouz_jerbi' },
    dinner: { plat_id: 'rec_ojja_merguez' },
  },
  {
    day_id: 'sun',
    day_name_fr: 'Dimanche',
    day_name_derja: 'El A7ad',
    day_name_ar: 'الأحد',
    lunch: { plat_id: 'rec_mloukhiya', dessert_id: 'rec_mhalbiya' },
    dinner: { plat_id: 'rec_tajine_tounsi' },
  },
];
