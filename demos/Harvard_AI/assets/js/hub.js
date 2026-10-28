const translations = {
  es: {
    eyebrow: 'Harvard CS50 AI · Demos interactivas',
    lead: 'Una colección de juegos, puzles y demostraciones que permite ver algoritmos de inteligencia artificial mientras trabajan.',
    intro: "Adaptaciones interactivas de proyectos realizados durante Harvard CS50's Introduction to Artificial Intelligence with Python. Cada demo conserva el concepto del ejercicio original y añade una explicación visual de sus decisiones.",
    scopeTitle: 'Alcance de las demos', scopeCopy: 'Estas demos son reinterpretaciones educativas para navegador, no réplicas completas de los ejercicios. Para funcionar sin backend y mantener una carga rápida, algunas utilizan conjuntos de datos, vocabularios o modelos reducidos. El código original enlazado conserva el alcance del proyecto del curso.',
    originalCode: 'Código original', allDemos: 'Todas las demos', gameLabel: 'Juego', puzzleLabel: 'Puzle', demonstrationLabel: 'Demostración',
    collectionLabel: 'Colección', catalogTitle: 'Juegos, puzles y demostraciones', catalogCopy: 'Doce formas de explorar búsqueda, conocimiento, optimización y aprendizaje.',
    search: 'Búsqueda', searchDescription: 'Explorar estados, grafos y caminos para encontrar la mejor solución.',
    tictactoeDescription: 'Juega contra un agente óptimo y observa cómo valora cada movimiento posible.', gameTrees: 'Árboles de juego', adversarialSearch: 'Búsqueda adversarial', openDemo: 'Abrir demo',
    degreesDescription: 'Conecta dos actores y observa cómo BFS encuentra el camino más corto entre ellos.', breadthFirstSearch: 'Búsqueda en anchura', graphSearch: 'Búsqueda en grafos',
    pagerankDescription: 'Compara el navegante aleatorio con la iteración y observa cómo los enlaces reparten importancia.', randomSurfer: 'Navegante aleatorio', probability: 'Probabilidad',
    knowledge: 'Conocimiento', knowledgeDescription: 'Deducir hechos nuevos a partir de reglas e información parcial.', logicalInference: 'Inferencia lógica',
    minesweeperDescription: 'Sigue la base de conocimiento de un agente mientras identifica casillas seguras y minas.', knowledgeBases: 'Bases de conocimiento', inference: 'Inferencia',
    propositionalLogic: 'Lógica proposicional', knightsDescription: 'Resuelve acertijos de caballeros y mentirosos descartando modelos contradictorios.', modelChecking: 'Comprobación de modelos', symbolicAI: 'IA simbólica',
    probabilisticInference: 'Inferencia probabilística', heredityDescription: 'Modifica la evidencia familiar y observa cómo cambian las probabilidades de genes y rasgos.', jointProbability: 'Probabilidad conjunta', bayesianInference: 'Inferencia bayesiana',
    parserDescription: 'Analiza frases en castellano e inglés y compara sus posibles árboles sintácticos.', syntaxAnalysis: 'Análisis sintáctico', formalGrammar: 'Gramática formal',
    optimization: 'Optimización', optimizationDescription: 'Reducir un espacio de búsqueda mediante restricciones y heurísticas.', crosswordDescription: 'Observa cómo AC-3, MRV, LCV y backtracking construyen un crucigrama válido.', heuristics: 'Heurísticas',
    learning: 'Aprendizaje', learningDescription: 'Mejorar una estrategia a partir de experiencia y recompensas.', nimDescription: 'Entrena un agente por refuerzo y compara cómo cambian los valores de sus acciones.', reinforcementLearning: 'Aprendizaje por refuerzo',
    shoppingDescription: 'Estima si una visita a una tienda online terminará en compra comparándola con visitas similares.', supervisedLearning: 'Aprendizaje supervisado', sensitivitySpecificity: 'Sensibilidad y especificidad',
    trafficDescription: 'Altera señales de tráfico y observa cómo las convoluciones extraen bordes antes de clasificarlas.', convolutionalNetworks: 'Redes convolucionales', computerVision: 'Visión por computador',
    attentionDescription: 'Observa qué palabras considera más importantes un modelo para predecir la palabra que falta en una frase.', transformers: 'Transformers'
  },
  en: {
    eyebrow: 'Harvard CS50 AI · Interactive demos',
    lead: 'A collection of games, puzzles, and demonstrations where you can watch artificial intelligence algorithms at work.',
    intro: "Interactive adaptations of projects completed during Harvard CS50's Introduction to Artificial Intelligence with Python. Each demo preserves the original exercise concept and adds a visual explanation of its decisions.",
    scopeTitle: 'Demo scope', scopeCopy: 'These demos are educational reinterpretations for the browser, not complete replicas of the exercises. To work without a backend and remain quick to load, some use reduced datasets, vocabularies, or models. The linked original code preserves the full scope of the course project.',
    originalCode: 'Original code', allDemos: 'All demos', gameLabel: 'Game', puzzleLabel: 'Puzzle', demonstrationLabel: 'Demonstration',
    collectionLabel: 'Collection', catalogTitle: 'Games, puzzles, and demonstrations', catalogCopy: 'Twelve ways to explore search, knowledge, optimization, and learning.',
    search: 'Search', searchDescription: 'Explore states, graphs, and paths to find the best solution.',
    tictactoeDescription: 'Play against an optimal agent and watch it evaluate every possible move.', gameTrees: 'Game trees', adversarialSearch: 'Adversarial search', openDemo: 'Open demo',
    degreesDescription: 'Connect two performers and watch BFS find the shortest path between them.', breadthFirstSearch: 'Breadth-first search', graphSearch: 'Graph search',
    pagerankDescription: 'Compare the random surfer with iteration and watch links distribute importance.', randomSurfer: 'Random surfer', probability: 'Probability',
    knowledge: 'Knowledge', knowledgeDescription: 'Deduce new facts from rules and partial information.', logicalInference: 'Logical inference',
    minesweeperDescription: "Follow an agent's knowledge base as it identifies safe cells and mines.", knowledgeBases: 'Knowledge bases', inference: 'Inference',
    propositionalLogic: 'Propositional logic', knightsDescription: 'Solve knights and knaves puzzles by eliminating contradictory models.', modelChecking: 'Model checking', symbolicAI: 'Symbolic AI',
    probabilisticInference: 'Probabilistic inference', heredityDescription: 'Change family evidence and watch gene and trait probabilities update.', jointProbability: 'Joint probability', bayesianInference: 'Bayesian inference',
    parserDescription: 'Parse sentences in Spanish and English and compare their possible syntax trees.', syntaxAnalysis: 'Syntax analysis', formalGrammar: 'Formal grammar',
    optimization: 'Optimization', optimizationDescription: 'Reduce a search space with constraints and heuristics.', crosswordDescription: 'Watch AC-3, MRV, LCV, and backtracking build a valid crossword.', heuristics: 'Heuristics',
    learning: 'Learning', learningDescription: 'Improve a strategy through experience and rewards.', nimDescription: 'Train a reinforcement agent and compare how its action values change.', reinforcementLearning: 'Reinforcement learning',
    shoppingDescription: 'Classify shopping sessions and discover which neighbor determines each prediction.', supervisedLearning: 'Supervised learning', sensitivitySpecificity: 'Sensitivity and specificity',
    trafficDescription: 'Alter traffic signs and watch convolutions extract edges before classifying them.', convolutionalNetworks: 'Convolutional networks', computerVision: 'Computer vision',
    attentionDescription: 'See which words a model considers most important when predicting the missing word in a sentence.', transformers: 'Transformers'
  }
};

function setLanguage(language) {
  const lang = translations[language] ? language : 'es';
  document.documentElement.lang = lang;
  document.querySelectorAll('[data-i18n]').forEach((element) => {
    element.textContent = translations[lang][element.dataset.i18n];
  });
  document.querySelectorAll('[data-lang]').forEach((button) => {
    button.setAttribute('aria-pressed', String(button.dataset.lang === lang));
  });
  localStorage.setItem('lang', lang);
}

document.querySelectorAll('[data-lang]').forEach((button) => {
  button.addEventListener('click', () => setLanguage(button.dataset.lang));
});

const storedLanguage = localStorage.getItem('lang');
const browserLanguage = navigator.language.toLowerCase().startsWith('es') ? 'es' : 'en';

setLanguage(storedLanguage || browserLanguage);
