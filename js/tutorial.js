// Tutorial messages configuration
const COUNTRY_TUTORIALS = {
  FRANCE: {
    characterName: 'Pierre Latosha',
    characterImage: '/assets/storypic/pierre.webp',
    welcomeTutorial: {
      id: 'welcome',
      title: 'Welcome to Your Winery!',
      pages: [
        {
          title: 'Welcome to Your Winery!',
          content: 'Welcome to your new winery! As you begin your journey into wine-making, you\'ll be guided by experienced professionals who will help you understand the art and science of wine production.'
        },
        {
          title: 'Meeting Pierre',
          content: 'A man in well-worn work clothes approaches you, his weathered face breaking into a warm smile. He speaks with a gentle French accent, his voice carrying years of experience.'
        },
        {
          title: 'Pierre\'s Introduction',
          content: '"Bonjour! I am Pierre Latosha, a wine farmer by trade and by heart, from the sun-soaked hills of Bordeaux. My family has tended these vines for generations, each season bringing new lessons and challenges, but the vineyard remains our life\'s work, our heritage."'
        },
        {
          title: 'Pierre\'s Daily Life',
          content: '"I wake before dawn to walk the rows, checking each leaf, every budding grape, to make sure they\'re growing strong. It\'s a simple life, but I wouldn\'t have it any other way. There\'s a rhythm in this work, a calm that settles over you, knowing that each vine holds a piece of history."'
        },
        {
          title: 'Pierre\'s Philosophy',
          content: '"Wine has a way of connecting people, don\'t you think? Every bottle tells a story—of the sun, the soil, and the hands that cared for it. When I pour a glass for someone, I feel like I\'m sharing a little piece of my soul, of our land, with them."'
        },
        {
          title: 'Getting Started',
          content: '"Together, we\'ll create wines that tell our own story. I\'ll guide you through every season, every challenge. Shall we begin this journey into wine-making?"'
        }
      ]
    }
  },
  ITALY: {
    characterName: 'Roberto Conti',
    characterImage: '/assets/storypic/roberto.webp',
    welcomeTutorial: {
      id: 'welcome',
      title: 'Welcome to Your Winery!',
      pages: [
        {
          title: 'Welcome to Your Winery!',
          content: 'Welcome to your new winery! As you begin your journey into wine-making, you\'ll be guided by experienced professionals who will help you understand the art and science of wine production.'
        },
        {
          title: 'Meeting Roberto',
          content: 'A robust man with sun-tanned skin approaches you, his eyes twinkling with Mediterranean warmth. His Italian accent is thick but welcoming as he greets you.'
        },
        {
          title: 'Roberto\'s Introduction',
          content: '"Buongiorno! I am Roberto Conti, born and raised in the rolling hills of Tuscany. For generations, my family has crafted wines that speak of our terra, our beloved land. Each vintage tells the story of our passion and tradition."'
        },
        {
          title: 'Roberto\'s Daily Life',
          content: '"Every morning, before the sun touches our vines, I walk through the vineyard. Each vine is like family to me, each grape a promise of what\'s to come. This is not just work—it\'s a way of life that flows through our veins like the wines we create."'
        },
        {
          title: 'Roberto\'s Philosophy',
          content: '"You see, wine is not just a drink—it\'s the heart of our culture! It brings families together, turns strangers into friends, and makes every meal a celebration. When we share our wine, we share a piece of our history, our joy, our soul."'
        },
        {
          title: 'Getting Started',
          content: '"Now, let us write your chapter in this grand tradition. Together, we will create wines that honor the ancient ways while embracing new possibilities. Sei pronto? Are you ready to begin?"'
        }
      ]
    }
  }
};

// General tutorials that don't change with country
const GENERAL_TUTORIALS = {
  VINEYARD: {
    id: 'vineyard',
    title: 'Vineyard Management',
    content: 'Welcome to your vineyard! Here you can manage your fields, plant vines, and harvest grapes. Monitor ripeness levels carefully to achieve the best quality harvest.',
    page: 'vineyard'
  },
  WINERY: {
    id: 'winery',
    title: 'Winery Operations',
    content: 'Welcome to your winery! Here you can process your harvested grapes into wine. Start by crushing grapes into must, then ferment the must into wine.',
    page: 'winery'
  }
};

class TutorialManager {
  constructor() {
    this.seenTutorials = new Set(JSON.parse(localStorage.getItem('seenTutorials') || '[]'));
    this.tutorialsEnabled = localStorage.getItem('tutorialsEnabled') !== 'false';
    this.currentPage = 0;
    this.activeTutorial = null;
    this.country = (localStorage.getItem('startingCountry') || 'FRANCE').toUpperCase();
    if (!COUNTRY_TUTORIALS[this.country]) {
      this.country = 'FRANCE';
    }
    this.countryConfig = COUNTRY_TUTORIALS[this.country];
    
    console.log('Tutorial Manager initialized with country:', this.country); // Debug line
  }

  init() {
    // Show welcome tutorial if it hasn't been seen
    if (this.shouldShowTutorial('WELCOME')) {
      this.showTutorial('WELCOME');
    }
  }

  shouldShowTutorial(tutorialId) {
    return this.tutorialsEnabled && !this.seenTutorials.has(tutorialId);
  }

  markAsSeen(tutorialId) {
    this.seenTutorials.add(tutorialId);
    localStorage.setItem('seenTutorials', JSON.stringify([...this.seenTutorials]));
  }

  getTutorial(tutorialId) {
    if (tutorialId === 'WELCOME') {
      return this.countryConfig.welcomeTutorial;
    }
    return GENERAL_TUTORIALS[tutorialId];
  }

  showTutorial(tutorialId) {
    if (!this.shouldShowTutorial(tutorialId)) return;

    const tutorial = this.getTutorial(tutorialId);
    if (!tutorial) return;

    this.activeTutorial = tutorialId;
    this.currentPage = 0;
    this.showCurrentPage();
  }

  showCurrentPage() {
    const tutorial = this.getTutorial(this.activeTutorial);
    const page = tutorial.pages ? tutorial.pages[this.currentPage] : tutorial;
    const isLastPage = !tutorial.pages || this.currentPage === tutorial.pages.length - 1;

    const overlay = document.getElementById('tutorialOverlay');
    
    overlay.innerHTML = `
      <div class="tutorial-wrapper">
        <div class="tutorial-image" style="background-image: url('${this.countryConfig.characterImage}')"></div>
        <div id="tutorialContent">
          <h3>${page.title || tutorial.title}</h3>
          <p>${page.content || tutorial.content}</p>
          <div class="tutorial-buttons">
            <button class="btn btn-primary" onclick="tutorialManager.closeTutorial('${this.activeTutorial}')">${isLastPage ? 'Got it!' : 'Next'}</button>
            <button class="btn btn-secondary" onclick="tutorialManager.disableAllTutorials()">Don't show tutorials</button>
          </div>
        </div>
      </div>
    `;
    
    overlay.style.display = 'flex';
  }

  closeTutorial(tutorialId) {
    const tutorial = this.getTutorial(tutorialId);
    if (tutorial.pages && this.currentPage < tutorial.pages.length - 1) {
      this.currentPage++;
      this.showCurrentPage();
    } else {
      this.markAsSeen(tutorialId);
      this.activeTutorial = null;
      this.currentPage = 0;
      document.getElementById('tutorialOverlay').style.display = 'none';
    }
  }

  disableAllTutorials() {
    this.tutorialsEnabled = false;
    localStorage.setItem('tutorialsEnabled', 'false');
    document.getElementById('tutorialOverlay').style.display = 'none';
  }

  enableTutorials() {
    this.tutorialsEnabled = true;
    localStorage.setItem('tutorialsEnabled', 'true');
  }

  resetTutorials() {
    this.seenTutorials.clear();
    localStorage.setItem('seenTutorials', '[]');
    this.enableTutorials();
  }
}

window.tutorialManager = new TutorialManager();
export default window.tutorialManager;
