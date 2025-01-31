// Tutorial messages configuration
const TUTORIALS = {
  WELCOME: {
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
    ],
    page: ['game', 'mainoffice']
  },
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

  showTutorial(tutorialId) {
    if (!this.shouldShowTutorial(tutorialId)) return;

    const tutorial = TUTORIALS[tutorialId];
    if (!tutorial) return;

    this.activeTutorial = tutorialId;
    this.currentPage = 0;
    this.showCurrentPage();
  }

  showCurrentPage() {
    const tutorial = TUTORIALS[this.activeTutorial];
    const page = tutorial.pages ? tutorial.pages[this.currentPage] : tutorial;
    const isLastPage = !tutorial.pages || this.currentPage === tutorial.pages.length - 1;

    const overlay = document.getElementById('tutorialOverlay');
    
    overlay.innerHTML = `
      <div class="tutorial-wrapper">
        <div class="tutorial-image"></div>
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
    const tutorial = TUTORIALS[tutorialId];
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
