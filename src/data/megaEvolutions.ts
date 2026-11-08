import { MegaFormData, PokemonInstance, PokemonType } from '../types/game';
import { POKEDEX } from './pokedex';

export const MEGA_FORMS: Record<string, MegaFormData> = {
  venusaur_mega: {
    id: 'venusaur_mega',
    baseSpeciesId: 3,
    spriteId: 10033,
    nameTr: 'Mega Venusaur',
    types: ['Grass', 'Poison'],
    baseStats: { hp: 80, atk: 100, def: 123, spa: 122, spd: 120, spe: 80 },
    ability: 'thick_fat',
    requiredItem: 'venusaurite',
    descTr: 'Devasa çiçeğiyle Kalın Katman kazanır; Ateş ve Buz zayıflıklarını nötralize eden ölümsüz bir kale olur!',
  },
  charizard_mega_x: {
    id: 'charizard_mega_x',
    baseSpeciesId: 6,
    spriteId: 10034,
    nameTr: 'Mega Charizard X',
    types: ['Fire', 'Dragon'],
    baseStats: { hp: 78, atk: 130, def: 111, spa: 130, spd: 85, spe: 100 },
    ability: 'tough_claws',
    requiredItem: 'charizardite-x',
    descTr: 'Mavi alevlerle Ateş/Ejder türüne dönüşür! Sert Pençe ile fiziksel saldırıları %30 güçlenir!',
  },
  charizard_mega_y: {
    id: 'charizard_mega_y',
    baseSpeciesId: 6,
    spriteId: 10035,
    nameTr: 'Mega Charizard Y',
    types: ['Fire', 'Flying'],
    baseStats: { hp: 78, atk: 104, def: 78, spa: 159, spd: 115, spe: 100 },
    ability: 'drought',
    requiredItem: 'charizardite-y',
    descTr: 'Sahaya anında yakıcı Güneş (Kuraklık) çağırır ve 159 Özel Saldırı ile her şeyi küle çevirir!',
  },
  blastoise_mega: {
    id: 'blastoise_mega',
    baseSpeciesId: 9,
    spriteId: 10036,
    nameTr: 'Mega Blastoise',
    types: ['Water'],
    baseStats: { hp: 79, atk: 103, def: 120, spa: 135, spd: 115, spe: 78 },
    ability: 'mega_launcher',
    requiredItem: 'blastoisinite',
    descTr: 'Sırtındaki dev top bataryası (Mega Topçu) ile tüm özel saldırılarını %30 güçlendirir!',
  },
  pidgeot_mega: {
    id: 'pidgeot_mega',
    baseSpeciesId: 18,
    spriteId: 10073,
    nameTr: 'Mega Pidgeot',
    types: ['Normal', 'Flying'],
    baseStats: { hp: 83, atk: 80, def: 80, spa: 135, spd: 80, spe: 121 },
    ability: 'aerilate',
    requiredItem: 'pidgeotite',
    descTr: 'Ses hızını aşan kanatlarıyla Gökyüzü Gücü kazanır ve fırtınalar estirir!',
  },
  alakazam_mega: {
    id: 'alakazam_mega',
    baseSpeciesId: 65,
    spriteId: 10037,
    nameTr: 'Mega Alakazam',
    types: ['Psychic'],
    baseStats: { hp: 55, atk: 50, def: 65, spa: 175, spd: 105, spe: 150 },
    ability: 'magic_bounce',
    requiredItem: 'alakazite',
    descTr: 'Havada süzülen 5 kaşığı ve 175 Özel Saldırı / 150 Hız ile durdurulamaz bir psişik bilge!',
  },
  gengar_mega: {
    id: 'gengar_mega',
    baseSpeciesId: 94,
    spriteId: 10038,
    nameTr: 'Mega Gengar',
    types: ['Ghost', 'Poison'],
    baseStats: { hp: 60, atk: 65, def: 80, spa: 170, spd: 95, spe: 130 },
    ability: 'adaptability',
    requiredItem: 'gengarite',
    descTr: 'Gölgeler boyutundan gelen gücüyle STAB hasarını 2.0x seviyesine çıkarır!',
  },
  kangaskhan_mega: {
    id: 'kangaskhan_mega',
    baseSpeciesId: 115,
    spriteId: 10039,
    nameTr: 'Mega Kangaskhan',
    types: ['Normal'],
    baseStats: { hp: 105, atk: 125, def: 100, spa: 60, spd: 100, spe: 100 },
    ability: 'parental_bond',
    requiredItem: 'kangaskhanite',
    descTr: 'Yavrusu keseden çıkıp annesiyle birlikte dövüşür (Ebeveyn Bağı ile %25 ekstra darbe)!',
  },
  gyarados_mega: {
    id: 'gyarados_mega',
    baseSpeciesId: 130,
    spriteId: 10041,
    nameTr: 'Mega Gyarados',
    types: ['Water', 'Dark'],
    baseStats: { hp: 95, atk: 155, def: 109, spa: 70, spd: 130, spe: 81 },
    ability: 'mold_breaker',
    requiredItem: 'gyaradosite',
    descTr: 'Su/Karanlık tipine bürünür ve Kalıp Kıran yeteneğiyle rakiplerin bağışıklıklarını parçalar!',
  },
  aerodactyl_mega: {
    id: 'aerodactyl_mega',
    baseSpeciesId: 142,
    spriteId: 10042,
    nameTr: 'Mega Aerodactyl',
    types: ['Rock', 'Flying'],
    baseStats: { hp: 80, atk: 135, def: 85, spa: 70, spd: 95, spe: 150 },
    ability: 'tough_claws',
    requiredItem: 'aerodactylite',
    descTr: 'Tarih öncesi gerçek formuna kavuşur; 150 Hız ve Sert Pençe ile yıldırım gibi vurur!',
  },
  mewtwo_mega_x: {
    id: 'mewtwo_mega_x',
    baseSpeciesId: 150,
    spriteId: 10043,
    nameTr: 'Mega Mewtwo X',
    types: ['Psychic', 'Fighting'],
    baseStats: { hp: 106, atk: 190, def: 100, spa: 154, spd: 100, spe: 130 },
    ability: 'guts',
    requiredItem: 'mewtwonite-x',
    descTr: 'Psişik/Dövüş formuna evrilerek 190 Fiziksel Saldırı ve 780 Toplam İstatistik sınırına ulaşır!',
  },
  mewtwo_mega_y: {
    id: 'mewtwo_mega_y',
    baseSpeciesId: 150,
    spriteId: 10044,
    nameTr: 'Mega Mewtwo Y',
    types: ['Psychic'],
    baseStats: { hp: 106, atk: 150, def: 70, spa: 194, spd: 120, spe: 140 },
    ability: 'inner_focus',
    requiredItem: 'mewtwonite-y',
    descTr: '194 Özel Saldırı ve 140 Hız ile evrenin en yüksek zihinsel yıkım gücüne ulaşır!',
  },
  ampharos_mega: {
    id: 'ampharos_mega',
    baseSpeciesId: 181,
    spriteId: 10045,
    nameTr: 'Mega Ampharos',
    types: ['Electric', 'Dragon'],
    baseStats: { hp: 90, atk: 95, def: 105, spa: 165, spd: 110, spe: 45 },
    ability: 'mold_breaker',
    requiredItem: 'ampharosite',
    descTr: 'Kadim ejderha kanı uyanır! Elektrik/Ejder tipine kavuşur ve 165 Özel Saldırı kazanır!',
  },
  steelix_mega: {
    id: 'steelix_mega',
    baseSpeciesId: 208,
    spriteId: 10072,
    nameTr: 'Mega Steelix',
    types: ['Steel', 'Ground'],
    baseStats: { hp: 75, atk: 125, def: 230, spa: 55, spd: 95, spe: 30 },
    ability: 'filter',
    requiredItem: 'steelixite',
    descTr: '230 Fiziksel Savunma ve Ağır Zırh Filtresi ile kırılması imkânsız elmas-çelik dev!',
  },
  scizor_mega: {
    id: 'scizor_mega',
    baseSpeciesId: 212,
    spriteId: 10046,
    nameTr: 'Mega Scizor',
    types: ['Bug', 'Steel'],
    baseStats: { hp: 70, atk: 150, def: 140, spa: 65, spd: 100, spe: 75 },
    ability: 'tough_claws',
    requiredItem: 'scizorite',
    descTr: 'Testere kıskaçları ve Sert Pençe yeteneğiyle hem tank hem suikastçı!',
  },
  heracross_mega: {
    id: 'heracross_mega',
    baseSpeciesId: 214,
    spriteId: 10047,
    nameTr: 'Mega Heracross',
    types: ['Bug', 'Fighting'],
    baseStats: { hp: 80, atk: 185, def: 115, spa: 40, spd: 105, spe: 75 },
    ability: 'guts',
    requiredItem: 'heracronite',
    descTr: '185 Fiziksel Saldırı ile tek boynuz darbesiyle dağları yerinden oynatır!',
  },
  houndoom_mega: {
    id: 'houndoom_mega',
    baseSpeciesId: 229,
    spriteId: 10048,
    nameTr: 'Mega Houndoom',
    types: ['Dark', 'Fire'],
    baseStats: { hp: 75, atk: 90, def: 90, spa: 140, spd: 90, spe: 115 },
    ability: 'drought',
    requiredItem: 'houndoominite',
    descTr: 'Cehennem güneşini çağırarak Karanlık ve Ateş hamleleriyle rakipleri kavurur!',
  },
  tyranitar_mega: {
    id: 'tyranitar_mega',
    baseSpeciesId: 248,
    spriteId: 10049,
    nameTr: 'Mega Tyranitar',
    types: ['Rock', 'Dark'],
    baseStats: { hp: 100, atk: 164, def: 150, spa: 95, spd: 120, spe: 71 },
    ability: 'sand_stream',
    requiredItem: 'tyranitarite',
    descTr: '700 Toplam İstatistik ve Kum Fırtınası ile yürüyen bir kıyamet tiranı!',
  },
  sceptile_mega: {
    id: 'sceptile_mega',
    baseSpeciesId: 254,
    spriteId: 10065,
    nameTr: 'Mega Sceptile',
    types: ['Grass', 'Dragon'],
    baseStats: { hp: 70, atk: 110, def: 75, spa: 145, spd: 85, spe: 145 },
    ability: 'adaptability',
    requiredItem: 'sceptilite',
    descTr: 'Çimen/Ejder türüne yükselir; 145 Hız ve 145 Özel Saldırı ile şimşekten hızlı vurur!',
  },
  blaziken_mega: {
    id: 'blaziken_mega',
    baseSpeciesId: 257,
    spriteId: 10050,
    nameTr: 'Mega Blaziken',
    types: ['Fire', 'Fighting'],
    baseStats: { hp: 80, atk: 160, def: 80, spa: 130, spd: 80, spe: 100 },
    ability: 'speed_boost',
    requiredItem: 'blazikenite',
    descTr: 'Hız İvmesi (Speed Boost) her tur hızını katlar; 160 Saldırı ile efsanevi Hoenn savaşçısı!',
  },
  swampert_mega: {
    id: 'swampert_mega',
    baseSpeciesId: 260,
    spriteId: 10064,
    nameTr: 'Mega Swampert',
    types: ['Water', 'Ground'],
    baseStats: { hp: 100, atk: 150, def: 110, spa: 95, spd: 110, spe: 70 },
    ability: 'swift_swim',
    requiredItem: 'swampertite',
    descTr: 'Devasa kollarıyla 150 Saldırıya ulaşır; Yağmur altında Hızı ikiye katlanır!',
  },
  gardevoir_mega: {
    id: 'gardevoir_mega',
    baseSpeciesId: 282,
    spriteId: 10051,
    nameTr: 'Mega Gardevoir',
    types: ['Psychic', 'Fairy'],
    baseStats: { hp: 68, atk: 85, def: 65, spa: 165, spd: 135, spe: 100 },
    ability: 'pixilate',
    requiredItem: 'gardevoirite',
    descTr: 'Peri Gücü (Pixilate) ve 165 Özel Saldırı ile Ejderhaların korkulu rüyası!',
  },
  aggron_mega: {
    id: 'aggron_mega',
    baseSpeciesId: 306,
    spriteId: 10053,
    nameTr: 'Mega Aggron',
    types: ['Steel'],
    baseStats: { hp: 70, atk: 140, def: 230, spa: 60, spd: 80, spe: 50 },
    ability: 'filter',
    requiredItem: 'aggronite',
    descTr: 'Kaya zayıflıklarından kurtulup saf Çelik olur; 230 Savunma + Filtre ile aşılmaz duvar!',
  },
  manectric_mega: {
    id: 'manectric_mega',
    baseSpeciesId: 310,
    spriteId: 10055,
    nameTr: 'Mega Manectric',
    types: ['Electric'],
    baseStats: { hp: 70, atk: 75, def: 80, spa: 135, spd: 80, spe: 135 },
    ability: 'intimidate',
    requiredItem: 'manectite',
    descTr: 'Yıldırım yelesiyle Gözdağı verir ve 135 Hız / 135 Özel Saldırı ile çarpar!',
  },
  altaria_mega: {
    id: 'altaria_mega',
    baseSpeciesId: 334,
    spriteId: 10067,
    nameTr: 'Mega Altaria',
    types: ['Dragon', 'Fairy'],
    baseStats: { hp: 75, atk: 110, def: 110, spa: 110, spd: 105, spe: 80 },
    ability: 'pixilate',
    requiredItem: 'altarianite',
    descTr: 'Benzersiz Ejder/Peri kombinasyonuyla Ejderha saldırılarına bağışıklık kazanır!',
  },
  absol_mega: {
    id: 'absol_mega',
    baseSpeciesId: 359,
    spriteId: 10057,
    nameTr: 'Mega Absol',
    types: ['Dark'],
    baseStats: { hp: 65, atk: 150, def: 60, spa: 115, spd: 60, spe: 115 },
    ability: 'magic_bounce',
    requiredItem: 'absolite',
    descTr: 'Melek kanatları ve Sihirli Ayna ile durum hamlelerini savuşturur!',
  },
  salamence_mega: {
    id: 'salamence_mega',
    baseSpeciesId: 373,
    spriteId: 10089,
    nameTr: 'Mega Salamence',
    types: ['Dragon', 'Flying'],
    baseStats: { hp: 95, atk: 145, def: 130, spa: 120, spd: 90, spe: 120 },
    ability: 'aerilate',
    requiredItem: 'salamencite',
    descTr: 'Hilal kanatları ve Gökyüzü Gücü (Aerilate) ile Normal saldırıları ölümcül Uçan darbelerine dönüştürür!',
  },
  metagross_mega: {
    id: 'metagross_mega',
    baseSpeciesId: 376,
    spriteId: 10076,
    nameTr: 'Mega Metagross',
    types: ['Steel', 'Psychic'],
    baseStats: { hp: 80, atk: 145, def: 150, spa: 105, spd: 110, spe: 110 },
    ability: 'tough_claws',
    requiredItem: 'metagrossite',
    descTr: 'Dört süper bilgisayarın birleşimi! 700 Toplam İstatistik ve Sert Pençe ile mutlak güç!',
  },
  kyogre_primal: {
    id: 'kyogre_primal',
    baseSpeciesId: 382,
    spriteId: 10077,
    nameTr: 'İlkel Kyogre',
    types: ['Water'],
    baseStats: { hp: 100, atk: 150, def: 90, spa: 180, spd: 160, spe: 90 },
    ability: 'primordial_sea',
    requiredItem: 'blue-orb',
    isPrimal: true,
    descTr: 'Mavi Küre ile İlkel Dönüşüm geçirir! İlkel Okyanus çağırır ve 770 toplam güce ulaşır!',
  },
  groudon_primal: {
    id: 'groudon_primal',
    baseSpeciesId: 383,
    spriteId: 10078,
    nameTr: 'İlkel Groudon',
    types: ['Ground', 'Fire'],
    baseStats: { hp: 100, atk: 180, def: 160, spa: 150, spd: 90, spe: 90 },
    ability: 'desolate_land',
    requiredItem: 'red-orb',
    isPrimal: true,
    descTr: 'Kızıl Küre ile İlkel Dönüşüm geçirir! Toprak/Ateş olur, Su saldırılarını buharlaştırır!',
  },
  rayquaza_mega: {
    id: 'rayquaza_mega',
    baseSpeciesId: 384,
    spriteId: 10079,
    nameTr: 'Mega Rayquaza',
    types: ['Dragon', 'Flying'],
    baseStats: { hp: 105, atk: 180, def: 100, spa: 180, spd: 100, spe: 115 },
    ability: 'delta_stream',
    requiredMove: 'dragon_ascent',
    descTr: 'Mega Taşa ihtiyaç duymadan Ejder Yükselişi hamlesiyle Mega Evrimleşir! 780 Toplam Güç!',
  },
};

export const MEGA_FORM_LIST: MegaFormData[] = Object.values(MEGA_FORMS);

export function getMegaFormsForSpecies(speciesId: number): MegaFormData[] {
  return MEGA_FORM_LIST.filter((m) => m.baseSpeciesId === speciesId);
}

export function getAvailableMegaForm(mon: PokemonInstance): MegaFormData | null {
  if (mon.megaFormId) return null; // Already Mega/Primal
  const forms = getMegaFormsForSpecies(mon.speciesId);
  for (const f of forms) {
    if (f.isPrimal) continue; // Primals trigger automatically on entry!
    if (f.requiredItem && mon.heldItem === f.requiredItem) return f;
    if (f.requiredMove && mon.moves.some((mv) => mv.moveId === f.requiredMove)) return f;
  }
  return null;
}

export function getPrimalFormOnEntry(mon: PokemonInstance): MegaFormData | null {
  if (mon.megaFormId) return null;
  const forms = getMegaFormsForSpecies(mon.speciesId);
  for (const f of forms) {
    if (f.isPrimal && f.requiredItem && mon.heldItem === f.requiredItem) {
      return f;
    }
  }
  return null;
}

export function getActiveTypes(mon: PokemonInstance): [PokemonType] | [PokemonType, PokemonType] {
  if (mon.megaFormId && MEGA_FORMS[mon.megaFormId]) {
    return MEGA_FORMS[mon.megaFormId].types;
  }
  return POKEDEX[mon.speciesId].types;
}

export function getActiveSpriteId(mon: PokemonInstance): number {
  if (mon.megaFormId && MEGA_FORMS[mon.megaFormId]) {
    return MEGA_FORMS[mon.megaFormId].spriteId;
  }
  return mon.speciesId;
}

export function getActiveDisplayName(mon: PokemonInstance): string {
  if (mon.megaFormId && MEGA_FORMS[mon.megaFormId]) {
    return mon.nickname ? `${mon.nickname} (Mega)` : MEGA_FORMS[mon.megaFormId].nameTr;
  }
  return mon.nickname || POKEDEX[mon.speciesId].name;
}
