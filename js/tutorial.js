// Tutorial messages configuration
const COUNTRY_TUTORIALS = {
  FRANCE: {
    characterName: 'Pierre Latosha',
    defaultImage: '/assets/storypic/pierre.webp',
    welcomeTutorial: {
      id: 'welcome',
      title: 'Welcome to Your Winery!',
      pages: [
        {
          title: 'Welcome to Your Winery!',
          content: 'Welcome to your new winery! As you begin your journey into wine-making, you\'ll be guided by experienced professionals who will help you understand the art and science of wine production.',
          image: '/assets/storypic/camille.webp' // Optional custom image
        },
        {
          title: 'Meeting Pierre',
          content: 'A man in well-worn work clothes approaches you, his weathered face breaking into a warm smile. He speaks with a gentle French accent, his voice carrying years of experience.'
          // No image specified - will use defaultImage
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
    characterName: 'Roberto De Luca',
    defaultImage: '/assets/storypic/roberto.webp',
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
          content: 'A distinguished gentleman approaches, his weathered hands and thoughtful expression speaking to years of experience among the vines. His refined manner carries both warmth and authority as he greets you with a gentle smile.'
        },
        {
          title: 'Roberto\'s Introduction',
          content: '"Buongiorno! I am Roberto De Luca, winemaster and steward of my family\'s traditions. I grew up in these vineyards, learning to appreciate the soil, the vines, and the rhythm of each season. You see, winemaking is not just a process; it\'s an art, a delicate balance of nature and nurture."'
        },
        {
          title: 'Roberto\'s Philosophy',
          content: '"When I taste a wine, I taste the year, the sun, the rain, the soil—all of it in one sip. I find immense joy in crafting each bottle, in watching our grapes turn from fruit to wine, in seeing the smile on someone\'s face when they taste our work."'
        },
        {
          title: 'Roberto\'s Approach',
          content: '"I suppose my approach is traditional; I prefer to listen to the land rather than bend it to my will. It\'s my belief that each vineyard speaks its own language, and my role is simply to bring its voice to life in each bottle. A winemaster, yes, but more than that, I am a caretaker of this land, of its story, and of my family\'s legacy."'
        },
        {
          title: 'Getting Started',
          content: '"Now, let us begin writing your chapter in this grand tradition. Together, we will create wines that honor both innovation and heritage. Sei pronto? Are you ready to discover the voice of your vineyard?"'
        }
      ]
    }
  },
  GERMANY: {
    characterName: 'Johann Weissburg',
    defaultImage: '/assets/storypic/johann.webp',
    welcomeTutorial: {
      id: 'welcome',
      title: 'Welcome to Your Winery!',
      pages: [
        {
          title: 'Welcome to Your Winery!',
          content: 'Welcome to your new winery! As you begin your journey into wine-making, you\'ll be guided by experienced professionals who will help you understand the art and science of wine production.'
        },
        {
          title: 'Meeting Johann',
          content: 'A distinguished figure stands among the vines, his weathered hands resting on an old wooden post. His eyes, sharp and observant, carry decades of wisdom as he studies the steep slopes of the vineyard. When he speaks, his voice is deep and deliberate, carrying both pride and humility.'
        },
        {
          title: 'Johann\'s Introduction',
          content: '"Willkommen! I am Johann Weissburg. Winemaking is not just a craft, it is our legacy. My father, and his father before him, tended these vines along the Mosel, watching the steep slopes turn golden in the autumn sun. Every grape carries the weight of our ancestors."'
        },
        {
          title: 'Johann\'s Philosophy',
          content: '"Some say German wines should be clean and precise—I say they should be full of character, like the land itself. The river, the slate soil, the cool air—all of it sings through our Riesling and Pinot Noir. The vines know what they need, if only we listen carefully enough."'
        },
        {
          title: 'Meeting Lukas',
          content: 'A younger man approaches, his steps energetic but measured. Lukas Weissburg, Johann\'s eldest son, carries a tablet in one hand and a refractometer in the other. His enthusiasm is palpable as he greets you.',
          image: '/assets/storypic/lukas.webp' // Optional custom image
        },
        {
          title: 'Lukas\'s Vision',
          content: '"The world of wine is changing, and we must change with it. While my father tends the traditional ways, I see the potential for innovation. Temperature-controlled tanks, new varietals, global markets—there\'s so much we can explore while honoring our heritage."'
        },
        {
          title: 'Getting Started',
          content: '"Together, we\'ll blend tradition with innovation, creating wines that speak of both our past and our future. Shall we begin this journey into German winemaking? The vines are waiting!"'
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
    
    // Use page-specific image if available, otherwise fall back to default country image
    const imageUrl = page.image || this.countryConfig.defaultImage;
    
    overlay.innerHTML = `
      <div class="tutorial-wrapper">
        <div class="tutorial-image" style="background-image: url('${imageUrl}')"></div>
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
