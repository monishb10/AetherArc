import { COMBAT_BALANCE } from './balance';
export type Rarity = 'Common'|'Rare'|'Epic'|'Gold'|'Mythic'|'Legendary'|'Aether';
export type Style = 'ninja'|'sword'|'assassin'|'brawler'|'brute'|'mage'|'monk'|'beam';
export type Element = 'fire'|'water'|'ice'|'forest'|'lightning'|'shadow'|'energy'|'wind'|'sand';
export type Character = {id:string;name:string;anime:string;rarity:Rarity;style:Style;element:Element;skills:string[];ultimate:string;portrait:number;coat:string;hair:string;seed:number;prestige:boolean;special:boolean};
export const RARITIES: Rarity[] = ['Common','Rare','Epic','Gold','Mythic','Legendary','Aether'];
export const RARITY_COLORS:Record<Rarity,string>={Common:'#99a7b8',Rare:'#60b6f0',Epic:'#a489ed',Gold:'#f0c36a',Mythic:'#eb81b6',Legendary:'#f8a553',Aether:'#78e3dc'};
export const ELEMENT_COLORS:Record<Element,string>={fire:'#ff8b42',water:'#55c7f2',ice:'#acebff',forest:'#89e19a',lightning:'#f6dc6a',shadow:'#9b82fa',energy:'#6aded6',wind:'#b9e6bb',sand:'#d6b27e'};
export const STYLE_STATS:Record<Style,{hp:number;atk:number;def:number;speed:number;range:number;rate:number}>={ninja:{hp:1050,atk:53,def:34,speed:300,range:115,rate:.30},sword:{hp:1100,atk:59,def:36,speed:275,range:145,rate:.36},assassin:{hp:940,atk:54,def:29,speed:350,range:105,rate:.25},brawler:{hp:1220,atk:58,def:40,speed:280,range:108,rate:.32},brute:{hp:1430,atk:74,def:49,speed:220,range:130,rate:.46},mage:{hp:940,atk:58,def:29,speed:260,range:115,rate:.36},monk:{hp:1090,atk:49,def:42,speed:305,range:115,rate:.26},beam:{hp:1280,atk:69,def:43,speed:300,range:120,rate:.32}};
export const CHARACTERS:Character[] = [
  {
    "id": "naruto-uzumaki",
    "name": "Naruto Uzumaki",
    "anime": "Naruto",
    "rarity": "Epic",
    "style": "ninja",
    "element": "wind",
    "skills": [
      "Rasengan",
      "Shadow Clone Rush"
    ],
    "ultimate": "Nine-Tails: Tailed Beast Bomb",
    "portrait": 0,
    "coat": "#ef9839",
    "hair": "#e7ce61",
    "seed": 0,
    "prestige": false,
    "special": false
  },
  {
    "id": "sasuke-uchiha",
    "name": "Sasuke Uchiha",
    "anime": "Naruto",
    "rarity": "Epic",
    "style": "assassin",
    "element": "lightning",
    "skills": [
      "Chidori",
      "Flame Control"
    ],
    "ultimate": "Susanoo: Indra’s Arrow",
    "portrait": 1,
    "coat": "#526298",
    "hair": "#1d2535",
    "seed": 1,
    "prestige": false,
    "special": false
  },
  {
    "id": "sakura-haruno",
    "name": "Sakura Haruno",
    "anime": "Naruto",
    "rarity": "Common",
    "style": "brawler",
    "element": "energy",
    "skills": [
      "Cherry Blossom Impact",
      "Chakra Surge"
    ],
    "ultimate": "Strength of a Hundred",
    "portrait": 2,
    "coat": "#ad4b65",
    "hair": "#e794a9",
    "seed": 2,
    "prestige": false,
    "special": false
  },
  {
    "id": "kakashi-hatake",
    "name": "Kakashi Hatake",
    "anime": "Naruto",
    "rarity": "Gold",
    "style": "ninja",
    "element": "lightning",
    "skills": [
      "Lightning Blade",
      "Earth Hound"
    ],
    "ultimate": "Kamui Lightning Cutter",
    "portrait": -1,
    "coat": "#677b5e",
    "hair": "#bac1ce",
    "seed": 3,
    "prestige": false,
    "special": false
  },
  {
    "id": "hinata-hyuga",
    "name": "Hinata Hyuga",
    "anime": "Naruto",
    "rarity": "Rare",
    "style": "monk",
    "element": "energy",
    "skills": [
      "Gentle Fist",
      "Air Palm"
    ],
    "ultimate": "Twin Lion Fists",
    "portrait": -1,
    "coat": "#9299bf",
    "hair": "#29253c",
    "seed": 4,
    "prestige": false,
    "special": false
  },
  {
    "id": "rock-lee",
    "name": "Rock Lee",
    "anime": "Naruto",
    "rarity": "Rare",
    "style": "brawler",
    "element": "wind",
    "skills": [
      "Leaf Hurricane",
      "Front Lotus"
    ],
    "ultimate": "Hidden Lotus",
    "portrait": -1,
    "coat": "#3c8863",
    "hair": "#1e232a",
    "seed": 5,
    "prestige": false,
    "special": false
  },
  {
    "id": "gaara",
    "name": "Gaara",
    "anime": "Naruto",
    "rarity": "Epic",
    "style": "mage",
    "element": "sand",
    "skills": [
      "Sand Coffin",
      "Sand Shield"
    ],
    "ultimate": "Grand Sand Mausoleum",
    "portrait": -1,
    "coat": "#9f4e48",
    "hair": "#b14034",
    "seed": 6,
    "prestige": false,
    "special": false
  },
  {
    "id": "shikamaru-nara",
    "name": "Shikamaru Nara",
    "anime": "Naruto",
    "rarity": "Common",
    "style": "mage",
    "element": "shadow",
    "skills": [
      "Shadow Possession",
      "Shadow Stitch"
    ],
    "ultimate": "Shadow Strangle",
    "portrait": -1,
    "coat": "#586f57",
    "hair": "#202633",
    "seed": 7,
    "prestige": false,
    "special": false
  },
  {
    "id": "neji-hyuga",
    "name": "Neji Hyuga",
    "anime": "Naruto",
    "rarity": "Rare",
    "style": "monk",
    "element": "wind",
    "skills": [
      "Eight Trigrams Palm",
      "Rotation"
    ],
    "ultimate": "Sixty-Four Palms",
    "portrait": -1,
    "coat": "#d3cbc0",
    "hair": "#423834",
    "seed": 8,
    "prestige": false,
    "special": false
  },
  {
    "id": "itachi-uchiha",
    "name": "Itachi Uchiha",
    "anime": "Naruto",
    "rarity": "Mythic",
    "style": "ninja",
    "element": "fire",
    "skills": [
      "Amaterasu",
      "Crow Mirage"
    ],
    "ultimate": "Susanoo: Totsuka Blade",
    "portrait": 13,
    "coat": "#27303e",
    "hair": "#232332",
    "seed": 9,
    "prestige": false,
    "special": true
  },
  {
    "id": "minato-namikaze",
    "name": "Minato Namikaze",
    "anime": "Naruto",
    "rarity": "Mythic",
    "style": "assassin",
    "element": "lightning",
    "skills": [
      "Flying Raijin",
      "Spiraling Flash"
    ],
    "ultimate": "Flying Raijin: Level Two",
    "portrait": -1,
    "coat": "#e7e5d5",
    "hair": "#ebce63",
    "seed": 10,
    "prestige": false,
    "special": true
  },
  {
    "id": "might-guy",
    "name": "Might Guy",
    "anime": "Naruto",
    "rarity": "Legendary",
    "style": "brawler",
    "element": "fire",
    "skills": [
      "Dynamic Entry",
      "Evening Elephant"
    ],
    "ultimate": "Eight Gates: Night Guy",
    "portrait": -1,
    "coat": "#429865",
    "hair": "#24272c",
    "seed": 11,
    "prestige": false,
    "special": true
  },
  {
    "id": "hashirama-senju",
    "name": "Hashirama Senju",
    "anime": "Naruto",
    "rarity": "Legendary",
    "style": "mage",
    "element": "forest",
    "skills": [
      "Wood Dragon",
      "Forest Emergence"
    ],
    "ultimate": "True Several Thousand Hands",
    "portrait": -1,
    "coat": "#9e4543",
    "hair": "#262b2e",
    "seed": 12,
    "prestige": false,
    "special": true
  },
  {
    "id": "madara-uchiha",
    "name": "Madara Uchiha",
    "anime": "Naruto",
    "rarity": "Aether",
    "style": "brute",
    "element": "fire",
    "skills": [
      "Majestic Destroyer",
      "Limbo Strike"
    ],
    "ultimate": "Perfect Susanoo",
    "portrait": -1,
    "coat": "#973e42",
    "hair": "#1c222b",
    "seed": 13,
    "prestige": false,
    "special": true
  },
  {
    "id": "obito-uchiha",
    "name": "Obito Uchiha",
    "anime": "Naruto",
    "rarity": "Gold",
    "style": "ninja",
    "element": "shadow",
    "skills": [
      "Kamui Rift",
      "Fireball"
    ],
    "ultimate": "Ten-Tails Cataclysm",
    "portrait": -1,
    "coat": "#343946",
    "hair": "#313641",
    "seed": 14,
    "prestige": false,
    "special": false
  },
  {
    "id": "monkey-d-luffy",
    "name": "Monkey D. Luffy",
    "anime": "One Piece",
    "rarity": "Epic",
    "style": "brawler",
    "element": "energy",
    "skills": [
      "Gum-Gum Pistol",
      "Red Hawk"
    ],
    "ultimate": "Gear Five: Bajrang Gun",
    "portrait": 3,
    "coat": "#c94248",
    "hair": "#20272f",
    "seed": 15,
    "prestige": false,
    "special": false
  },
  {
    "id": "roronoa-zoro",
    "name": "Roronoa Zoro",
    "anime": "One Piece",
    "rarity": "Epic",
    "style": "sword",
    "element": "forest",
    "skills": [
      "Oni Giri",
      "Lion’s Song"
    ],
    "ultimate": "King of Hell: Three-Sword Dragon",
    "portrait": 4,
    "coat": "#3c7756",
    "hair": "#70a76e",
    "seed": 16,
    "prestige": false,
    "special": false
  },
  {
    "id": "nami",
    "name": "Nami",
    "anime": "One Piece",
    "rarity": "Common",
    "style": "mage",
    "element": "lightning",
    "skills": [
      "Thunderbolt Tempo",
      "Mirage Tempo"
    ],
    "ultimate": "Zeus: Thunder Lance",
    "portrait": -1,
    "coat": "#67a8b3",
    "hair": "#e59e4b",
    "seed": 17,
    "prestige": false,
    "special": false
  },
  {
    "id": "sanji",
    "name": "Sanji",
    "anime": "One Piece",
    "rarity": "Rare",
    "style": "brawler",
    "element": "fire",
    "skills": [
      "Diable Jambe",
      "Sky Walk"
    ],
    "ultimate": "Ifrit Jambe: Boeuf Burst",
    "portrait": -1,
    "coat": "#2e3549",
    "hair": "#e8cc72",
    "seed": 18,
    "prestige": false,
    "special": false
  },
  {
    "id": "usopp",
    "name": "Usopp",
    "anime": "One Piece",
    "rarity": "Common",
    "style": "mage",
    "element": "forest",
    "skills": [
      "Firebird Star",
      "Green Star"
    ],
    "ultimate": "Impact Wolf",
    "portrait": -1,
    "coat": "#b79660",
    "hair": "#4c342e",
    "seed": 19,
    "prestige": false,
    "special": false
  },
  {
    "id": "nico-robin",
    "name": "Nico Robin",
    "anime": "One Piece",
    "rarity": "Rare",
    "style": "monk",
    "element": "shadow",
    "skills": [
      "Clutch",
      "Gigantesco Mano"
    ],
    "ultimate": "Demonio Fleur",
    "portrait": -1,
    "coat": "#684d8f",
    "hair": "#252336",
    "seed": 20,
    "prestige": false,
    "special": false
  },
  {
    "id": "portgas-d-ace",
    "name": "Portgas D. Ace",
    "anime": "One Piece",
    "rarity": "Gold",
    "style": "mage",
    "element": "fire",
    "skills": [
      "Fire Fist",
      "Firefly"
    ],
    "ultimate": "Great Flame Emperor",
    "portrait": -1,
    "coat": "#ca8142",
    "hair": "#272526",
    "seed": 21,
    "prestige": false,
    "special": false
  },
  {
    "id": "trafalgar-law",
    "name": "Trafalgar Law",
    "anime": "One Piece",
    "rarity": "Gold",
    "style": "assassin",
    "element": "energy",
    "skills": [
      "Room: Shambles",
      "Counter Shock"
    ],
    "ultimate": "K-Room: Puncture Wille",
    "portrait": -1,
    "coat": "#d4b456",
    "hair": "#252c34",
    "seed": 22,
    "prestige": false,
    "special": false
  },
  {
    "id": "boa-hancock",
    "name": "Boa Hancock",
    "anime": "One Piece",
    "rarity": "Epic",
    "style": "monk",
    "element": "energy",
    "skills": [
      "Pistol Kiss",
      "Perfume Femur"
    ],
    "ultimate": "Slave Arrow",
    "portrait": -1,
    "coat": "#a84462",
    "hair": "#272337",
    "seed": 23,
    "prestige": false,
    "special": false
  },
  {
    "id": "whitebeard",
    "name": "Whitebeard",
    "anime": "One Piece",
    "rarity": "Legendary",
    "style": "brute",
    "element": "energy",
    "skills": [
      "Seaquake",
      "Bisento Smash"
    ],
    "ultimate": "Heaven and Earth: Worldquake",
    "portrait": -1,
    "coat": "#e0dcce",
    "hair": "#e5ddd0",
    "seed": 24,
    "prestige": false,
    "special": true
  },
  {
    "id": "silvers-rayleigh",
    "name": "Silvers Rayleigh",
    "anime": "One Piece",
    "rarity": "Mythic",
    "style": "sword",
    "element": "lightning",
    "skills": [
      "Dark King’s Slash",
      "Haki Pulse"
    ],
    "ultimate": "Dark King: Conqueror’s Will",
    "portrait": -1,
    "coat": "#bfc3b6",
    "hair": "#d6d7ce",
    "seed": 25,
    "prestige": false,
    "special": true
  },
  {
    "id": "shanks",
    "name": "Shanks",
    "anime": "One Piece",
    "rarity": "Legendary",
    "style": "sword",
    "element": "fire",
    "skills": [
      "Conqueror’s Pressure",
      "Crimson Slash"
    ],
    "ultimate": "Divine Departure",
    "portrait": -1,
    "coat": "#292c37",
    "hair": "#a83d44",
    "seed": 26,
    "prestige": false,
    "special": true
  },
  {
    "id": "dracule-mihawk",
    "name": "Dracule Mihawk",
    "anime": "One Piece",
    "rarity": "Legendary",
    "style": "sword",
    "element": "forest",
    "skills": [
      "Black Blade Arc",
      "Hawk’s Eye"
    ],
    "ultimate": "Yoru: World’s Strongest Slash",
    "portrait": -1,
    "coat": "#563041",
    "hair": "#242530",
    "seed": 27,
    "prestige": false,
    "special": true
  },
  {
    "id": "monkey-d-garp",
    "name": "Monkey D. Garp",
    "anime": "One Piece",
    "rarity": "Mythic",
    "style": "brute",
    "element": "energy",
    "skills": [
      "Galaxy Impact",
      "Blue Hole"
    ],
    "ultimate": "Galaxy Divide",
    "portrait": -1,
    "coat": "#d7d8db",
    "hair": "#b3bdc5",
    "seed": 28,
    "prestige": false,
    "special": true
  },
  {
    "id": "gol-d-roger",
    "name": "Gol D. Roger",
    "anime": "One Piece",
    "rarity": "Aether",
    "style": "sword",
    "element": "fire",
    "skills": [
      "Divine Departure",
      "King’s Presence"
    ],
    "ultimate": "Pirate King: Conqueror’s Clash",
    "portrait": -1,
    "coat": "#b54345",
    "hair": "#232a32",
    "seed": 29,
    "prestige": false,
    "special": true
  },
  {
    "id": "ichigo-kurosaki",
    "name": "Ichigo Kurosaki",
    "anime": "Bleach",
    "rarity": "Epic",
    "style": "sword",
    "element": "shadow",
    "skills": [
      "Getsuga Tensho",
      "Flash Step"
    ],
    "ultimate": "Final Getsuga Tensho: Mugetsu",
    "portrait": 5,
    "coat": "#232a39",
    "hair": "#e39745",
    "seed": 30,
    "prestige": false,
    "special": false
  },
  {
    "id": "rukia-kuchiki",
    "name": "Rukia Kuchiki",
    "anime": "Bleach",
    "rarity": "Rare",
    "style": "sword",
    "element": "ice",
    "skills": [
      "Some no Mai",
      "Tsugi no Mai"
    ],
    "ultimate": "Bankai: Hakka no Togame",
    "portrait": 6,
    "coat": "#28303e",
    "hair": "#252a3a",
    "seed": 31,
    "prestige": false,
    "special": false
  },
  {
    "id": "renji-abarai",
    "name": "Renji Abarai",
    "anime": "Bleach",
    "rarity": "Rare",
    "style": "sword",
    "element": "fire",
    "skills": [
      "Zabimaru",
      "Hikotsu Taiho"
    ],
    "ultimate": "Bankai: Soo Zabimaru",
    "portrait": -1,
    "coat": "#273242",
    "hair": "#a13b49",
    "seed": 32,
    "prestige": false,
    "special": false
  },
  {
    "id": "orihime-inoue",
    "name": "Orihime Inoue",
    "anime": "Bleach",
    "rarity": "Common",
    "style": "mage",
    "element": "energy",
    "skills": [
      "Koten Zanshun",
      "Santen Kesshun"
    ],
    "ultimate": "Shiten Koshun",
    "portrait": -1,
    "coat": "#d8dadf",
    "hair": "#c39153",
    "seed": 33,
    "prestige": false,
    "special": false
  },
  {
    "id": "uryu-ishida",
    "name": "Uryu Ishida",
    "anime": "Bleach",
    "rarity": "Rare",
    "style": "mage",
    "element": "lightning",
    "skills": [
      "Heilig Pfeil",
      "Hirenkyaku"
    ],
    "ultimate": "Licht Regen",
    "portrait": -1,
    "coat": "#dddfe5",
    "hair": "#252838",
    "seed": 34,
    "prestige": false,
    "special": false
  },
  {
    "id": "toshiro-hitsugaya",
    "name": "Toshiro Hitsugaya",
    "anime": "Bleach",
    "rarity": "Gold",
    "style": "sword",
    "element": "ice",
    "skills": [
      "Hyoryu Senbi",
      "Ice Mirror"
    ],
    "ultimate": "Daiguren Hyorinmaru",
    "portrait": -1,
    "coat": "#dde3e6",
    "hair": "#dfe8ef",
    "seed": 35,
    "prestige": false,
    "special": false
  },
  {
    "id": "sosuke-aizen",
    "name": "Sosuke Aizen",
    "anime": "Bleach",
    "rarity": "Aether",
    "style": "mage",
    "element": "shadow",
    "skills": [
      "Kurohitsugi",
      "Kyoka Suigetsu"
    ],
    "ultimate": "Hogyoku: Transcendence",
    "portrait": -1,
    "coat": "#e7e5e0",
    "hair": "#5f3c34",
    "seed": 36,
    "prestige": false,
    "special": true
  },
  {
    "id": "kisuke-urahara",
    "name": "Kisuke Urahara",
    "anime": "Bleach",
    "rarity": "Mythic",
    "style": "sword",
    "element": "fire",
    "skills": [
      "Benihime",
      "Blood Mist Shield"
    ],
    "ultimate": "Kannonbiraki Benihime Aratame",
    "portrait": -1,
    "coat": "#4b6a5f",
    "hair": "#b0a07d",
    "seed": 37,
    "prestige": false,
    "special": true
  },
  {
    "id": "byakuya-kuchiki",
    "name": "Byakuya Kuchiki",
    "anime": "Bleach",
    "rarity": "Mythic",
    "style": "sword",
    "element": "energy",
    "skills": [
      "Senbonzakura",
      "Shunpo"
    ],
    "ultimate": "Senbonzakura Kageyoshi",
    "portrait": -1,
    "coat": "#283243",
    "hair": "#2b2c3c",
    "seed": 38,
    "prestige": false,
    "special": true
  },
  {
    "id": "kenpachi-zaraki",
    "name": "Kenpachi Zaraki",
    "anime": "Bleach",
    "rarity": "Legendary",
    "style": "brute",
    "element": "fire",
    "skills": [
      "Nozarashi",
      "Kendo"
    ],
    "ultimate": "Bankai: Unbound Demon",
    "portrait": -1,
    "coat": "#d4d3c6",
    "hair": "#222c35",
    "seed": 39,
    "prestige": false,
    "special": true
  },
  {
    "id": "yoruichi-shihoin",
    "name": "Yoruichi Shihoin",
    "anime": "Bleach",
    "rarity": "Mythic",
    "style": "assassin",
    "element": "lightning",
    "skills": [
      "Shunko",
      "Flash Goddess"
    ],
    "ultimate": "Thunder God Battle Form",
    "portrait": -1,
    "coat": "#604984",
    "hair": "#745295",
    "seed": 40,
    "prestige": false,
    "special": true
  },
  {
    "id": "ulquiorra-cifer",
    "name": "Ulquiorra Cifer",
    "anime": "Bleach",
    "rarity": "Gold",
    "style": "assassin",
    "element": "forest",
    "skills": [
      "Cero",
      "Sonido"
    ],
    "ultimate": "Lanza del Relampago",
    "portrait": -1,
    "coat": "#e0e4dc",
    "hair": "#28312f",
    "seed": 41,
    "prestige": false,
    "special": false
  },
  {
    "id": "asta",
    "name": "Asta",
    "anime": "Black Clover",
    "rarity": "Epic",
    "style": "brute",
    "element": "shadow",
    "skills": [
      "Demon-Slayer",
      "Black Hurricane"
    ],
    "ultimate": "Black Divider",
    "portrait": 12,
    "coat": "#3c394a",
    "hair": "#b6b3ae",
    "seed": 42,
    "prestige": false,
    "special": false
  },
  {
    "id": "yuno",
    "name": "Yuno",
    "anime": "Black Clover",
    "rarity": "Gold",
    "style": "mage",
    "element": "wind",
    "skills": [
      "Wind Blade",
      "Spirit Dive"
    ],
    "ultimate": "Spirit of Boreas",
    "portrait": -1,
    "coat": "#3f4968",
    "hair": "#242938",
    "seed": 43,
    "prestige": false,
    "special": false
  },
  {
    "id": "yami-sukehiro",
    "name": "Yami Sukehiro",
    "anime": "Black Clover",
    "rarity": "Mythic",
    "style": "sword",
    "element": "shadow",
    "skills": [
      "Dark Cloaked Slash",
      "Black Moon"
    ],
    "ultimate": "Death Thrust: Dimension Slash",
    "portrait": -1,
    "coat": "#464553",
    "hair": "#292d35",
    "seed": 44,
    "prestige": false,
    "special": true
  },
  {
    "id": "julius-novachrono",
    "name": "Julius Novachrono",
    "anime": "Black Clover",
    "rarity": "Legendary",
    "style": "mage",
    "element": "energy",
    "skills": [
      "Chrono Stasis",
      "Time Reversal"
    ],
    "ultimate": "Chrono Anastasis",
    "portrait": -1,
    "coat": "#af9265",
    "hair": "#dfc476",
    "seed": 45,
    "prestige": false,
    "special": true
  },
  {
    "id": "tanjiro-kamado",
    "name": "Tanjiro Kamado",
    "anime": "Demon Slayer",
    "rarity": "Epic",
    "style": "sword",
    "element": "water",
    "skills": [
      "Water Wheel",
      "Flowing Dance"
    ],
    "ultimate": "Hinokami Kagura: Sun Halo Dragon",
    "portrait": 7,
    "coat": "#3d806c",
    "hair": "#623b34",
    "seed": 46,
    "prestige": false,
    "special": false
  },
  {
    "id": "nezuko-kamado",
    "name": "Nezuko Kamado",
    "anime": "Demon Slayer",
    "rarity": "Rare",
    "style": "brawler",
    "element": "fire",
    "skills": [
      "Exploding Blood",
      "Demon Rush"
    ],
    "ultimate": "Blood Demon Art: Crimson Burst",
    "portrait": -1,
    "coat": "#bb7c91",
    "hair": "#29252f",
    "seed": 47,
    "prestige": false,
    "special": false
  },
  {
    "id": "zenitsu-agatsuma",
    "name": "Zenitsu Agatsuma",
    "anime": "Demon Slayer",
    "rarity": "Rare",
    "style": "assassin",
    "element": "lightning",
    "skills": [
      "Thunderclap and Flash",
      "Sixfold"
    ],
    "ultimate": "Flaming Thunder God",
    "portrait": 8,
    "coat": "#e2b458",
    "hair": "#e5be62",
    "seed": 48,
    "prestige": false,
    "special": false
  },
  {
    "id": "inosuke-hashibira",
    "name": "Inosuke Hashibira",
    "anime": "Demon Slayer",
    "rarity": "Rare",
    "style": "sword",
    "element": "wind",
    "skills": [
      "Pierce",
      "Slice and Dice"
    ],
    "ultimate": "Beast Breathing: Spatial Awareness",
    "portrait": -1,
    "coat": "#657a87",
    "hair": "#3d475b",
    "seed": 49,
    "prestige": false,
    "special": false
  },
  {
    "id": "giyu-tomioka",
    "name": "Giyu Tomioka",
    "anime": "Demon Slayer",
    "rarity": "Gold",
    "style": "sword",
    "element": "water",
    "skills": [
      "Water Surface Slash",
      "Whirlpool"
    ],
    "ultimate": "Eleventh Form: Dead Calm",
    "portrait": -1,
    "coat": "#694a52",
    "hair": "#2a303b",
    "seed": 50,
    "prestige": false,
    "special": false
  },
  {
    "id": "shinobu-kocho",
    "name": "Shinobu Kocho",
    "anime": "Demon Slayer",
    "rarity": "Epic",
    "style": "assassin",
    "element": "shadow",
    "skills": [
      "Butterfly Dance",
      "Centipede Zigzag"
    ],
    "ultimate": "Dance of the Dragonfly",
    "portrait": -1,
    "coat": "#cec9e2",
    "hair": "#594b72",
    "seed": 51,
    "prestige": false,
    "special": false
  },
  {
    "id": "tengen-uzui",
    "name": "Tengen Uzui",
    "anime": "Demon Slayer",
    "rarity": "Gold",
    "style": "sword",
    "element": "fire",
    "skills": [
      "String Performance",
      "Roar"
    ],
    "ultimate": "Musical Score: Constant Resounding Slashes",
    "portrait": -1,
    "coat": "#77607a",
    "hair": "#c5cbd2",
    "seed": 52,
    "prestige": false,
    "special": false
  },
  {
    "id": "mitsuri-kanroji",
    "name": "Mitsuri Kanroji",
    "anime": "Demon Slayer",
    "rarity": "Epic",
    "style": "sword",
    "element": "energy",
    "skills": [
      "Shivers of First Love",
      "Love Pangs"
    ],
    "ultimate": "Cat-Legged Winds of Love",
    "portrait": -1,
    "coat": "#d2acc0",
    "hair": "#d59bb6",
    "seed": 53,
    "prestige": false,
    "special": false
  },
  {
    "id": "kyojuro-rengoku",
    "name": "Kyojuro Rengoku",
    "anime": "Demon Slayer",
    "rarity": "Mythic",
    "style": "sword",
    "element": "fire",
    "skills": [
      "Unknowing Fire",
      "Blooming Flame"
    ],
    "ultimate": "Ninth Form: Rengoku",
    "portrait": -1,
    "coat": "#e9d4a7",
    "hair": "#e5ae48",
    "seed": 54,
    "prestige": false,
    "special": true
  },
  {
    "id": "yoriichi-tsugikuni",
    "name": "Yoriichi Tsugikuni",
    "anime": "Demon Slayer",
    "rarity": "Aether",
    "style": "sword",
    "element": "fire",
    "skills": [
      "Clear Blue Sky",
      "Burning Bones"
    ],
    "ultimate": "Sun Breathing: Thirteenth Form",
    "portrait": -1,
    "coat": "#923c47",
    "hair": "#502b34",
    "seed": 55,
    "prestige": false,
    "special": true
  },
  {
    "id": "kokushibo",
    "name": "Kokushibo",
    "anime": "Demon Slayer",
    "rarity": "Legendary",
    "style": "sword",
    "element": "shadow",
    "skills": [
      "Dark Moon",
      "Moonlit Misfortune"
    ],
    "ultimate": "Moon Breathing: Catastrophe",
    "portrait": -1,
    "coat": "#664a72",
    "hair": "#382d39",
    "seed": 56,
    "prestige": false,
    "special": true
  },
  {
    "id": "doma",
    "name": "Doma",
    "anime": "Demon Slayer",
    "rarity": "Mythic",
    "style": "mage",
    "element": "ice",
    "skills": [
      "Frozen Lotus",
      "Wintry Icicles"
    ],
    "ultimate": "Rime: Water Lily Bodhisattva",
    "portrait": -1,
    "coat": "#a75665",
    "hair": "#c8c3a7",
    "seed": 57,
    "prestige": false,
    "special": true
  },
  {
    "id": "yuji-itadori",
    "name": "Yuji Itadori",
    "anime": "Jujutsu Kaisen",
    "rarity": "Rare",
    "style": "brawler",
    "element": "energy",
    "skills": [
      "Divergent Fist",
      "Cursed Rush"
    ],
    "ultimate": "Black Flash",
    "portrait": 10,
    "coat": "#543b55",
    "hair": "#d49091",
    "seed": 58,
    "prestige": false,
    "special": false
  },
  {
    "id": "megumi-fushiguro",
    "name": "Megumi Fushiguro",
    "anime": "Jujutsu Kaisen",
    "rarity": "Rare",
    "style": "mage",
    "element": "shadow",
    "skills": [
      "Divine Dogs",
      "Nue"
    ],
    "ultimate": "Chimera Shadow Garden",
    "portrait": -1,
    "coat": "#293d58",
    "hair": "#252b3c",
    "seed": 59,
    "prestige": false,
    "special": false
  },
  {
    "id": "nobara-kugisaki",
    "name": "Nobara Kugisaki",
    "anime": "Jujutsu Kaisen",
    "rarity": "Common",
    "style": "monk",
    "element": "fire",
    "skills": [
      "Hairpin",
      "Straw Doll"
    ],
    "ultimate": "Resonance",
    "portrait": -1,
    "coat": "#33445d",
    "hair": "#a97b54",
    "seed": 60,
    "prestige": false,
    "special": false
  },
  {
    "id": "satoru-gojo",
    "name": "Satoru Gojo",
    "anime": "Jujutsu Kaisen",
    "rarity": "Legendary",
    "style": "mage",
    "element": "energy",
    "skills": [
      "Cursed Technique: Blue",
      "Reversal: Red"
    ],
    "ultimate": "Hollow Purple",
    "portrait": 9,
    "coat": "#32314e",
    "hair": "#e3eaf5",
    "seed": 61,
    "prestige": false,
    "special": true
  },
  {
    "id": "ryomen-sukuna",
    "name": "Ryomen Sukuna",
    "anime": "Jujutsu Kaisen",
    "rarity": "Gold",
    "style": "assassin",
    "element": "fire",
    "skills": [
      "Dismantle",
      "Cleave"
    ],
    "ultimate": "Malevolent Shrine",
    "portrait": -1,
    "coat": "#784352",
    "hair": "#cc9090",
    "seed": 62,
    "prestige": false,
    "special": false
  },
  {
    "id": "kento-nanami",
    "name": "Kento Nanami",
    "anime": "Jujutsu Kaisen",
    "rarity": "Mythic",
    "style": "sword",
    "element": "energy",
    "skills": [
      "Ratio Technique",
      "Overtime"
    ],
    "ultimate": "Collapse: Seven to Three",
    "portrait": -1,
    "coat": "#c4b693",
    "hair": "#e0c386",
    "seed": 63,
    "prestige": false,
    "special": true
  },
  {
    "id": "toji-fushiguro",
    "name": "Toji Fushiguro",
    "anime": "Jujutsu Kaisen",
    "rarity": "Mythic",
    "style": "assassin",
    "element": "shadow",
    "skills": [
      "Inverted Spear",
      "Heavenly Rush"
    ],
    "ultimate": "Heavenly Restriction: Soul Split",
    "portrait": -1,
    "coat": "#353d43",
    "hair": "#303636",
    "seed": 64,
    "prestige": false,
    "special": true
  },
  {
    "id": "yuta-okkotsu",
    "name": "Yuta Okkotsu",
    "anime": "Jujutsu Kaisen",
    "rarity": "Mythic",
    "style": "sword",
    "element": "energy",
    "skills": [
      "Cursed Speech",
      "Rika’s Strike"
    ],
    "ultimate": "True Love: Pure Love Beam",
    "portrait": -1,
    "coat": "#dedee3",
    "hair": "#2a2d3b",
    "seed": 65,
    "prestige": false,
    "special": true
  },
  {
    "id": "sung-jin-woo",
    "name": "Sung Jin-Woo",
    "anime": "Solo Leveling",
    "rarity": "Gold",
    "style": "assassin",
    "element": "shadow",
    "skills": [
      "Dagger Rush",
      "Ruler’s Authority"
    ],
    "ultimate": "Arise: Army of Shadows",
    "portrait": 11,
    "coat": "#343049",
    "hair": "#252b3d",
    "seed": 66,
    "prestige": false,
    "special": false
  },
  {
    "id": "cha-hae-in",
    "name": "Cha Hae-In",
    "anime": "Solo Leveling",
    "rarity": "Epic",
    "style": "sword",
    "element": "lightning",
    "skills": [
      "Sword Dance",
      "Blade of Light"
    ],
    "ultimate": "Dance of the Sword Saint",
    "portrait": -1,
    "coat": "#b8a28e",
    "hair": "#d7c587",
    "seed": 67,
    "prestige": false,
    "special": false
  },
  {
    "id": "igris",
    "name": "Igris",
    "anime": "Solo Leveling",
    "rarity": "Gold",
    "style": "sword",
    "element": "fire",
    "skills": [
      "Bloodred Slash",
      "Knight’s Charge"
    ],
    "ultimate": "Bloodred Commander",
    "portrait": -1,
    "coat": "#803a46",
    "hair": "#943f46",
    "seed": 68,
    "prestige": false,
    "special": false
  },
  {
    "id": "beru",
    "name": "Beru",
    "anime": "Solo Leveling",
    "rarity": "Mythic",
    "style": "brute",
    "element": "shadow",
    "skills": [
      "Ant King’s Claw",
      "Predator Rush"
    ],
    "ultimate": "King of the Ants",
    "portrait": -1,
    "coat": "#3c465a",
    "hair": "#535879",
    "seed": 69,
    "prestige": false,
    "special": true
  },
  {
    "id": "baek-yoonho",
    "name": "Baek Yoonho",
    "anime": "Solo Leveling",
    "rarity": "Rare",
    "style": "brute",
    "element": "energy",
    "skills": [
      "Beast Claw",
      "White Flame"
    ],
    "ultimate": "White Tiger Transformation",
    "portrait": -1,
    "coat": "#aeb6c7",
    "hair": "#dee0d6",
    "seed": 70,
    "prestige": false,
    "special": false
  },
  {
    "id": "choi-jong-in",
    "name": "Choi Jong-In",
    "anime": "Solo Leveling",
    "rarity": "Rare",
    "style": "mage",
    "element": "fire",
    "skills": [
      "Flame Spear",
      "Fire Prison"
    ],
    "ultimate": "Ultimate Weapon: Inferno",
    "portrait": -1,
    "coat": "#8b584b",
    "hair": "#8b4e32",
    "seed": 71,
    "prestige": false,
    "special": false
  },
  {
    "id": "goku",
    "name": "Goku",
    "anime": "Dragon Ball",
    "rarity": "Aether",
    "style": "beam",
    "element": "energy",
    "skills": [
      "Kamehameha",
      "Instant Transmission"
    ],
    "ultimate": "Ultra Instinct: Supreme Kamehameha",
    "portrait": 14,
    "coat": "#de8241",
    "hair": "#252c3e",
    "seed": 72,
    "prestige": true,
    "special": true
  },
  {
    "id": "vegeta",
    "name": "Vegeta",
    "anime": "Dragon Ball",
    "rarity": "Aether",
    "style": "beam",
    "element": "lightning",
    "skills": [
      "Galick Gun",
      "Big Bang Attack"
    ],
    "ultimate": "Final Flash",
    "portrait": -1,
    "coat": "#45628f",
    "hair": "#242b36",
    "seed": 73,
    "prestige": true,
    "special": true
  },
  {
    "id": "gohan",
    "name": "Gohan",
    "anime": "Dragon Ball",
    "rarity": "Aether",
    "style": "beam",
    "element": "shadow",
    "skills": [
      "Masenko",
      "Burst Rush"
    ],
    "ultimate": "Beast: Special Beam Cannon",
    "portrait": -1,
    "coat": "#6c4a86",
    "hair": "#d9dfed",
    "seed": 74,
    "prestige": true,
    "special": true
  },
  {
    "id": "broly",
    "name": "Broly",
    "anime": "Dragon Ball",
    "rarity": "Aether",
    "style": "brute",
    "element": "forest",
    "skills": [
      "Eraser Cannon",
      "Gigantic Rush"
    ],
    "ultimate": "Legendary Super Saiyan: Gigantic Roar",
    "portrait": -1,
    "coat": "#769d4f",
    "hair": "#263932",
    "seed": 75,
    "prestige": true,
    "special": true
  },
  {
    "id": "frieza",
    "name": "Frieza",
    "anime": "Dragon Ball",
    "rarity": "Aether",
    "style": "beam",
    "element": "shadow",
    "skills": [
      "Death Beam",
      "Death Saucer"
    ],
    "ultimate": "Supernova: Emperor’s End",
    "portrait": -1,
    "coat": "#e1ddea",
    "hair": "#7949a5",
    "seed": 76,
    "prestige": true,
    "special": true
  }
];
export const UNIVERSES=["Naruto", "One Piece", "Bleach", "Black Clover", "Demon Slayer", "Jujutsu Kaisen", "Solo Leveling", "Dragon Ball"];
export const byId=(id:string)=>CHARACTERS.find(c=>c.id===id)!;
export const MAX_LEVEL=30;
export const xpRequired=(level:number)=>Math.round(160+level*80+level*level*8);
export function stats(c:Character,level=1,mastery=0){const base=STYLE_STATS[c.style],m=1+(level-1)*.045+RARITIES.indexOf(c.rarity)*.025+mastery*.025;const hp=Math.round(base.hp*m*COMBAT_BALANCE.healthMultiplier),attack=Math.round(base.atk*m),defense=Math.round(base.def*m);return {hp,attack,defense,power:Math.round(hp*.32+attack*5+defense*3),speed:base.speed+(level-1)*.6,range:base.range,rate:base.rate};}
export const STARTERS=['naruto-uzumaki','ichigo-kurosaki','tanjiro-kamado'];
export type BoxType = 'Normal'|'Rare'|'Epic'|'Gold'|'Mythic'|'Legendary'|'Aether';
export const BOXES:{type:BoxType;color:string;cost:number;rates:number[];phrase:string}[]=[
{type:'Normal',color:'#a9b7cc',cost:350,rates:[55,35,10,0,0,0,0],phrase:'Every legend starts somewhere.'},
{type:'Rare',color:'#60b6f0',cost:700,rates:[0,60,32,8,0,0,0],phrase:'Something extraordinary awaits.'},
{type:'Epic',color:'#a489ed',cost:1300,rates:[0,0,65,25,10,0,0],phrase:'Power beyond the ordinary.'},
{type:'Gold',color:'#f0c36a',cost:2200,rates:[0,0,30,50,17,3,0],phrase:'A golden opportunity.'},
{type:'Mythic',color:'#eb81b6',cost:3600,rates:[0,0,0,30,55,14,1],phrase:'Legends whispered across worlds.'},
{type:'Legendary',color:'#f8a553',cost:6000,rates:[0,0,0,0,40,52,8],phrase:'The ones who changed their worlds.'},
{type:'Aether',color:'#78e3dc',cost:10000,rates:[0,0,0,0,0,65,35],phrase:'The convergence chooses its champion.'}];
export type Arena={id:string;name:string;anime:string;image:string;weather:'leaf'|'rain'|'dust'|'ember'|'ash'|'bubble'|'petal'|'spirit'|'mist'|'wind'|'none'|'star';description:string;wins:number};
const arenaGroups:[string,[string,Arena['weather'],string][]][]=[
 ['Naruto',[
  ['Hidden Leaf Village','leaf','Sunset over the Hokage Monument and the rooftops of Konoha.'],
  ['Valley of the End','rain','Colossal statues stand above a thundering waterfall gorge.'],
  ['Chunin Exam Arena','dust','An open sand ring surrounded by the great stadium walls.'],
  ['Akatsuki Hideout','ember','A sealed stone gate deep inside a firelit cavern.'],
  ['Fourth Great Ninja War Battlefield','ash','Shattered ridges and a scorched battlefield beneath violet skies.']]],
 ['One Piece',[
  ['Marineford','mist','Warships gather beneath the walls of the Marine stronghold.'],
  ['Sabaody','bubble','Giant mangrove roots rise through drifting iridescent bubbles.'],
  ['Enies Lobby','mist','A white stone causeway above an endless ocean waterfall.'],
  ['Wano','petal','A samurai castle, cherry blossoms, and a bridge at golden hour.'],
  ['Onigashima','ember','The horned skull fortress towers over a stormy sea.']]],
 ['Bleach',[
  ['Soul Society','spirit','The white walls of Seireitei rise above a sea of tiled roofs.'],
  ['Karakura Town','rain','Wet city streets beneath power lines and amber lights.'],
  ['Hueco Mundo','dust','Silver dunes and dead quartz trees beneath a crescent moon.'],
  ['Las Noches','spirit','An immense ivory hall of repeating pillars and cold light.'],
  ['Royal Palace','spirit','Golden gates and floating palaces above an ocean of clouds.']]],
 ['Demon Slayer',[
  ['Infinity Castle','ember','Lanterns illuminate a labyrinth of suspended wooden halls.'],
  ['Final Selection','petal','Glowing wisteria shelters a moonlit mountain path.'],
  ['Mugen Train','wind','A steel train roof races through the night beneath a blue moon.'],
  ['Entertainment District','ember','Red balconies and golden lanterns line a vibrant night street.'],
  ['Swordsmith Village','leaf','Mountain cottages, a waterwheel, and the smoke of hidden forges.']]],
 ['Dragon Ball',[
  ['World Martial Arts Tournament','dust','The classic tournament ring under tropical skies.'],
  ['Planet Namek','spirit','Blue trees and still water beneath an alien green sky.'],
  ['Hyperbolic Time Chamber','none','An endless white void, watched over by towering hourglasses.'],
  ['Cell Games Arena','dust','A white tournament ring stands alone in a rocky desert.'],
  ['Tournament of Power','star','A shattered arena hangs in a cosmic void beneath a green pillar.']]]
];
export const ARENAS:Arena[]=arenaGroups.flatMap(([anime,entries])=>entries.map(([name,weather,description])=>{const id=name.toLowerCase().replace(/[^a-z0-9]+/g,'-');return {id,name,anime,image:`/art/arenas/${id}.webp`,weather,description,wins:0};}));
export type Mission={id:string;title:string;description:string;metric:string;target:number;coins:number;box?:BoxType};
export const MISSIONS:Mission[]=[
{id:'first-win',title:'First blood',description:'Win your first battle.',metric:'wins',target:1,coins:200},
{id:'three-wins',title:'Finding your rhythm',description:'Win 3 battles.',metric:'wins',target:3,coins:400,box:'Rare'},
{id:'ninja',title:'The will of fire',description:'Fight 3 times with a Naruto fighter.',metric:'naruto',target:3,coins:350},
{id:'combo',title:'Unbroken flow',description:'Land 10 combos of at least 3 hits.',metric:'combos',target:10,coins:350,box:'Epic'},
{id:'ultimate',title:'Beyond your limits',description:'Land a signature ultimate.',metric:'ultimates',target:1,coins:250},
{id:'level',title:'A little stronger',description:'Earn a character level through combat.',metric:'levelUps',target:1,coins:200},
{id:'boxes',title:'Fate, unsealed',description:'Open 3 boxes.',metric:'opened',target:3,coins:300,box:'Rare'},
{id:'five',title:'A world of possibilities',description:'Collect 5 different fighters.',metric:'owned',target:5,coins:300},
{id:'boss',title:'Giant slayer',description:'Defeat an elite boss.',metric:'bosses',target:1,coins:700,box:'Gold'}];

// Every fighter in the complete roster is supported by the combat engine.
export const PLAYABLE_CHARACTERS=CHARACTERS;
export const isPlayable=(c:Character)=>!!c&&CHARACTERS.some(f=>f.id===c.id);
export const COLLECTION_MILESTONES=[5,10,15,25,50,70,77];
// Retain the previous 23-fighter milestone for already saved claim receipts.
export const MILESTONE_REWARDS:Record<number,BoxType>={5:'Rare',10:'Epic',15:'Legendary',23:'Aether',25:'Legendary',50:'Aether',70:'Aether',77:'Aether'};
