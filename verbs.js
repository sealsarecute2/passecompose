/**
 * Mes Verbes à Moi — 50 Verbes Essentiels (Français 9e année)
 * Base de données des verbes, règles de conjugaison et d'accords.
 */

const SUBJECTS = [
  { label: "Je", pronoun: "Je", avoir: "J'ai", etre: "Je suis", reflEtre: "Je me suis", fem: false, plural: false },
  { label: "Je (f.)", pronoun: "Je", avoir: "J'ai", etre: "Je suis", reflEtre: "Je me suis", fem: true, plural: false },
  { label: "Tu", pronoun: "Tu", avoir: "Tu as", etre: "Tu es", reflEtre: "Tu t'es", fem: false, plural: false },
  { label: "Tu (f.)", pronoun: "Tu", avoir: "Tu as", etre: "Tu es", reflEtre: "Tu t'es", fem: true, plural: false },
  { label: "Il / On", pronoun: "Il", avoir: "Il a", etre: "Il est", reflEtre: "Il s'est", fem: false, plural: false },
  { label: "Elle", pronoun: "Elle", avoir: "Elle a", etre: "Elle est", reflEtre: "Elle s'est", fem: true, plural: false },
  { label: "Nous", pronoun: "Nous", avoir: "Nous avons", etre: "Nous sommes", reflEtre: "Nous nous sommes", fem: false, plural: true },
  { label: "Nous (f.)", pronoun: "Nous", avoir: "Nous avons", etre: "Nous sommes", reflEtre: "Nous nous sommes", fem: true, plural: true },
  { label: "Vous", pronoun: "Vous", avoir: "Vous avez", etre: "Vous êtes", reflEtre: "Vous vous êtes", fem: false, plural: true },
  { label: "Ils", pronoun: "Ils", avoir: "Ils ont", etre: "Ils sont", reflEtre: "Ils se sont", fem: false, plural: true },
  { label: "Elles", pronoun: "Elles", avoir: "Elles ont", etre: "Elles sont", reflEtre: "Elles se sont", fem: true, plural: true }
];

function formatVerbTitle(verb) {
  return verb.starred ? (verb.infinitive + "*") : verb.infinitive;
}

function getAgreedParticiple(verb, fem, plural) {
  if (verb.aux === "avoir") return verb.pp;

  const base = verb.pp;
  if (base === "assis") {
    if (fem && plural) return "assises";
    if (fem && !plural) return "assise";
    return "assis";
  }

  if (fem && plural) {
    return base + "es";
  }
  if (fem && !plural) {
    return base + "e";
  }
  if (!fem && plural) {
    return base.endsWith("s") ? base : base + "s";
  }
  return base;
}

function conjugatePasséComposé(verb, subj) {
  if (verb.impersonal) {
    return "Il a " + verb.pp;
  }
  if (verb.reflexive) {
    const pp = getAgreedParticiple(verb, subj.fem, subj.plural);
    return subj.reflEtre + " " + pp;
  }
  if (verb.aux === "etre") {
    const pp = getAgreedParticiple(verb, subj.fem, subj.plural);
    return subj.etre + " " + pp;
  }
  return subj.avoir + " " + verb.pp;
}

const VERBS = [
  {
    "id": 1,
    "infinitive": "être",
    "english": "to be",
    "aux": "avoir",
    "pp": "été",
    "exFr": "J'ai été très occupé cette semaine avec mes devoirs.",
    "exEn": "I was very busy this week with my homework."
  },
  {
    "id": 2,
    "infinitive": "aller",
    "english": "to go",
    "aux": "etre",
    "pp": "allé",
    "exFr": "Nous sommes allés au festival d'hiver à Québec.",
    "exEn": "We went to the winter carnival in Quebec."
  },
  {
    "id": 3,
    "infinitive": "avoir",
    "english": "to have",
    "aux": "avoir",
    "pp": "eu",
    "exFr": "Tu as eu une excellente note au test de français!",
    "exEn": "You had an excellent grade on the French test!"
  },
  {
    "id": 4,
    "infinitive": "devoir",
    "english": "to have to / must",
    "aux": "avoir",
    "pp": "dû",
    "exFr": "Elle a dû prendre l'autobus scolaire ce matin.",
    "exEn": "She had to take the school bus this morning."
  },
  {
    "id": 5,
    "infinitive": "dire",
    "english": "to say / tell",
    "aux": "avoir",
    "pp": "dit",
    "exFr": "Le professeur a dit de bien réviser le passé composé.",
    "exEn": "The teacher said to review the passé composé well."
  },
  {
    "id": 6,
    "infinitive": "écrire",
    "english": "to write",
    "aux": "avoir",
    "pp": "écrit",
    "exFr": "Ils ont écrit une belle carte pour la fête nationale.",
    "exEn": "They wrote a nice card for Canada Day."
  },
  {
    "id": 7,
    "infinitive": "dormir",
    "english": "to sleep",
    "aux": "avoir",
    "pp": "dormi",
    "exFr": "J'ai dormi pendant tout le trajet en voiture.",
    "exEn": "I slept during the entire car ride."
  },
  {
    "id": 8,
    "infinitive": "faire",
    "english": "to do / make",
    "aux": "avoir",
    "pp": "fait",
    "exFr": "Nous avons fait une longue promenade au parc de la Gatineau.",
    "exEn": "We went on a long walk in Gatineau Park."
  },
  {
    "id": 9,
    "infinitive": "pouvoir",
    "english": "to be able to / can",
    "aux": "avoir",
    "pp": "pu",
    "exFr": "Est-ce que vous avez pu regarder le match de hockey?",
    "exEn": "Were you able to watch the hockey game?"
  },
  {
    "id": 10,
    "infinitive": "prendre",
    "english": "to take / have (food/drink)",
    "aux": "avoir",
    "pp": "pris",
    "exFr": "Mon frère a pris un bon chocolat chaud après avoir patiné.",
    "exEn": "My brother had a nice hot chocolate after skating."
  },
  {
    "id": 11,
    "infinitive": "vouloir",
    "english": "to want",
    "aux": "avoir",
    "pp": "voulu",
    "exFr": "Elles ont voulu essayer la poutine au fromage en grains.",
    "exEn": "They wanted to try the poutine with cheese curds."
  },
  {
    "id": 12,
    "infinitive": "mettre",
    "english": "to put / put on",
    "aux": "avoir",
    "pp": "mis",
    "exFr": "J'ai mis mes bottes d'hiver et ma tuque avant de sortir.",
    "exEn": "I put on my winter boots and my toque before going out."
  },
  {
    "id": 13,
    "infinitive": "partir",
    "english": "to leave",
    "aux": "etre",
    "pp": "parti",
    "exFr": "Le train pour Montréal est parti à huit heures précises.",
    "exEn": "The train for Montreal left at eight o'clock sharp."
  },
  {
    "id": 14,
    "infinitive": "rire",
    "english": "to laugh",
    "aux": "avoir",
    "pp": "ri",
    "exFr": "Nous avons ri aux éclats devant cette comédie québécoise.",
    "exEn": "We laughed out loud watching this comedy."
  },
  {
    "id": 15,
    "infinitive": "ouvrir",
    "english": "to open",
    "aux": "avoir",
    "pp": "ouvert",
    "exFr": "La boulangerie artisanale a ouvert très tôt ce matin.",
    "exEn": "The bakery opened very early this morning."
  },
  {
    "id": 16,
    "infinitive": "sortir",
    "english": "to go out / exit",
    "aux": "etre",
    "pp": "sorti",
    "exFr": "Les élèves sont sortis dans la cour pour la récréation.",
    "exEn": "The students went out to the yard for recess."
  },
  {
    "id": 17,
    "infinitive": "savoir",
    "english": "to know (facts/how to)",
    "aux": "avoir",
    "pp": "su",
    "exFr": "Elle a su répondre à toutes les questions de l'examen.",
    "exEn": "She knew how to answer all the exam questions."
  },
  {
    "id": 18,
    "infinitive": "croire",
    "english": "to believe / think",
    "aux": "avoir",
    "pp": "cru",
    "exFr": "J'ai cru qu'il allait neiger aujourd'hui à Ottawa.",
    "exEn": "I believed that it was going to snow today in Ottawa."
  },
  {
    "id": 19,
    "infinitive": "voir",
    "english": "to see",
    "aux": "avoir",
    "pp": "vu",
    "exFr": "Nous avons vu des bernaches du Canada près du lac Ontario.",
    "exEn": "We saw Canada geese near Lake Ontario."
  },
  {
    "id": 20,
    "infinitive": "pleuvoir",
    "english": "to rain",
    "aux": "avoir",
    "pp": "plu",
    "impersonal": true,
    "exFr": "Il a plu pendant tout notre séjour de camping.",
    "exEn": "It rained throughout our camping trip."
  },
  {
    "id": 21,
    "infinitive": "lire",
    "english": "to read",
    "aux": "avoir",
    "pp": "lu",
    "exFr": "Tu as lu la légende du loup-garou en classe?",
    "exEn": "Did you read the werewolf legend in class?"
  },
  {
    "id": 22,
    "infinitive": "acheter",
    "english": "to buy",
    "aux": "avoir",
    "pp": "acheté",
    "exFr": "Mon père a acheté des bagels frais et du sirop d'érable.",
    "exEn": "My dad bought fresh bagels and maple syrup."
  },
  {
    "id": 23,
    "infinitive": "appeler",
    "english": "to call",
    "aux": "avoir",
    "pp": "appelé",
    "exFr": "J'ai appelé mon ami pour aller patiner au canal Rideau.",
    "exEn": "I called my friend to go skating on the Rideau Canal."
  },
  {
    "id": 24,
    "infinitive": "espérer",
    "english": "to hope",
    "aux": "avoir",
    "pp": "espéré",
    "exFr": "Nous avons espéré avoir une journée de tempête de neige.",
    "exEn": "We hoped to have a snow storm day."
  },
  {
    "id": 25,
    "infinitive": "manger",
    "english": "to eat",
    "aux": "avoir",
    "pp": "mangé",
    "exFr": "Ils ont mangé des crêpes chaudes à la cabane à sucre.",
    "exEn": "They ate warm pancakes at the sugar shack."
  },
  {
    "id": 26,
    "infinitive": "commencer",
    "english": "to begin / start",
    "aux": "avoir",
    "pp": "commencé",
    "exFr": "Le cours de français immersion a commencé à neuf heures.",
    "exEn": "The French immersion class started at nine o'clock."
  },
  {
    "id": 27,
    "infinitive": "recevoir",
    "english": "to receive / get",
    "aux": "avoir",
    "pp": "reçu",
    "exFr": "J'ai reçu une lettre de mon correspondant montréalais.",
    "exEn": "I received a letter from my pen pal from Montreal."
  },
  {
    "id": 28,
    "infinitive": "connaître",
    "english": "to know (people/places)",
    "aux": "avoir",
    "pp": "connu",
    "exFr": "Elle a connu ses meilleurs amis au camp d'été francophone.",
    "exEn": "She met her best friends at the French summer camp."
  },
  {
    "id": 29,
    "infinitive": "courir",
    "english": "to run",
    "aux": "avoir",
    "pp": "couru",
    "exFr": "Lucas a couru cinq kilomètres pour la course Terry Fox.",
    "exEn": "Lucas ran five kilometers for the Terry Fox Run."
  },
  {
    "id": 30,
    "infinitive": "suivre",
    "english": "to follow",
    "aux": "avoir",
    "pp": "suivi",
    "exFr": "Les élèves ont suivi le guide historique dans le Vieux-Québec.",
    "exEn": "The students followed the historical guide in Old Quebec."
  },
  {
    "id": 31,
    "infinitive": "conduire",
    "english": "to drive",
    "aux": "avoir",
    "pp": "conduit",
    "exFr": "Ma mère a conduit prudemment sur la route enneigée.",
    "exEn": "My mother drove cautiously on the snowy road."
  },
  {
    "id": 32,
    "infinitive": "venir",
    "english": "to come",
    "aux": "etre",
    "pp": "venu",
    "exFr": "Mes cousins sont venus célébrer l'Action de grâce avec nous.",
    "exEn": "My cousins came to celebrate Thanksgiving with us."
  },
  {
    "id": 33,
    "infinitive": "boire",
    "english": "to drink",
    "aux": "avoir",
    "pp": "bu",
    "exFr": "Après l'entraînement de soccer, j'ai bu une grande bouteille d'eau.",
    "exEn": "After soccer practice, I drank a large bottle of water."
  },
  {
    "id": 34,
    "infinitive": "vivre",
    "english": "to live",
    "aux": "avoir",
    "pp": "vécu",
    "exFr": "Ses grands-parents ont vécu vingt ans à Halifax.",
    "exEn": "His grandparents lived for twenty years in Halifax."
  },
  {
    "id": 35,
    "infinitive": "servir",
    "english": "to serve",
    "aux": "avoir",
    "pp": "servi",
    "exFr": "Le serveur nous a servi de délicieux croissants chauds.",
    "exEn": "The waiter served us delicious warm croissants."
  },
  {
    "id": 36,
    "infinitive": "s'asseoir",
    "english": "to sit down",
    "aux": "etre",
    "pp": "assis",
    "reflexive": true,
    "exFr": "Les étudiants se sont assis au premier rang de la classe.",
    "exEn": "The students sat down in the front row of the classroom."
  },
  {
    "id": 37,
    "infinitive": "employer",
    "english": "to use / employ",
    "aux": "avoir",
    "pp": "employé",
    "exFr": "L'auteure canadienne a employé des métaphores touchantes.",
    "exEn": "The Canadian author used touching metaphors."
  },
  {
    "id": 38,
    "infinitive": "envoyer",
    "english": "to send",
    "aux": "avoir",
    "pp": "envoyé",
    "exFr": "Tu as envoyé ton devoir de sciences par courriel?",
    "exEn": "Did you send your science homework by email?"
  },
  {
    "id": 39,
    "infinitive": "plaire",
    "english": "to please / to be liked",
    "aux": "avoir",
    "pp": "plu",
    "exFr": "Ce voyage scolaire à Toronto a beaucoup plu à tout le groupe.",
    "exEn": "This school trip to Toronto pleased the whole group very much."
  },
  {
    "id": 40,
    "infinitive": "mourir",
    "english": "to die",
    "aux": "etre",
    "pp": "mort",
    "exFr": "Le héros de cette tragédie historique est mort courageusement.",
    "exEn": "The hero of this historical tragedy died bravely."
  },
  {
    "id": 41,
    "infinitive": "valoir",
    "english": "to be worth",
    "aux": "avoir",
    "pp": "valu",
    "exFr": "Visiter les chutes du Niagara a vraiment valu le détour.",
    "exEn": "Visiting Niagara Falls was truly worth the detour."
  },
  {
    "id": 42,
    "infinitive": "falloir",
    "english": "to be necessary",
    "aux": "avoir",
    "pp": "fallu",
    "impersonal": true,
    "exFr": "Il a fallu déneiger l'entrée avant d'aller à l'école.",
    "exEn": "It was necessary to shovel the driveway before going to school."
  },
  {
    "id": 43,
    "infinitive": "craindre",
    "english": "to fear / be afraid of",
    "aux": "avoir",
    "pp": "craint",
    "starred": true,
    "exFr": "L'enfant a craint les bruits du tonnerre pendant la tempête.",
    "exEn": "The child feared the sound of thunder during the storm."
  },
  {
    "id": 44,
    "infinitive": "résoudre",
    "english": "to solve / resolve",
    "aux": "avoir",
    "pp": "résolu",
    "starred": true,
    "exFr": "Nous avons résolu ce difficile casse-tête de mathématiques.",
    "exEn": "We solved this difficult math puzzle."
  },
  {
    "id": 45,
    "infinitive": "peindre",
    "english": "to paint",
    "aux": "avoir",
    "pp": "peint",
    "exFr": "Le groupe des Sept a peint les magnifiques forêts ontariennes.",
    "exEn": "The Group of Seven painted the magnificent Ontario forests."
  },
  {
    "id": 46,
    "infinitive": "cuire",
    "english": "to cook / bake",
    "aux": "avoir",
    "pp": "cuit",
    "exFr": "Grand-maman a cuit une succulente tourtière pour le souper.",
    "exEn": "Grandma baked a delicious tourtière for dinner."
  },
  {
    "id": 47,
    "infinitive": "se taire",
    "english": "to be quiet / keep silent",
    "aux": "etre",
    "pp": "tu",
    "reflexive": true,
    "starred": true,
    "exFr": "Quand la cloche a sonné, tous les élèves se sont tus.",
    "exEn": "When the bell rang, all the students fell silent."
  },
  {
    "id": 48,
    "infinitive": "cueillir",
    "english": "to pick / gather",
    "aux": "avoir",
    "pp": "cueilli",
    "starred": true,
    "exFr": "Nous avons cueilli des pommes fraîches au verger d'Oka.",
    "exEn": "We picked fresh apples at the orchard in Oka."
  },
  {
    "id": 49,
    "infinitive": "devenir",
    "english": "to become",
    "aux": "etre",
    "pp": "devenu",
    "exFr": "Grâce à ses efforts constants, elle est devenue bilingue.",
    "exEn": "Thanks to her steady efforts, she became bilingual."
  },
  {
    "id": 50,
    "infinitive": "comprendre",
    "english": "to understand",
    "aux": "avoir",
    "pp": "compris",
    "exFr": "Tout le monde a compris la règle des accords au passé composé.",
    "exEn": "Everyone understood the agreement rule in the passé composé."
  }
];

if (typeof window !== "undefined") {
  window.VERBS = VERBS;
  window.SUBJECTS = SUBJECTS;
  window.formatVerbTitle = formatVerbTitle;
  window.getAgreedParticiple = getAgreedParticiple;
  window.conjugatePasséComposé = conjugatePasséComposé;
}
if (typeof module !== "undefined" && module.exports) {
  module.exports = { VERBS, SUBJECTS, formatVerbTitle, getAgreedParticiple, conjugatePasséComposé };
}
