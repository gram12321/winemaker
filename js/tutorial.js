
// Tutorial messages configuration
const TUTORIALS = {
  WELCOME: {
    id: 'welcome',
    title: 'Welcome to Your Winery!',
    content: 'Welcome to your new winery! This tutorial will help you get started with managing your vineyard and wine production.',
    page: 'game'
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
  },
  VINEYARD: {
    id: 'vineyard',
    title: 'Vineyard Management',
    content: 'Here you can manage your vineyards, plant new vines, and monitor their growth.',
    page: 'vineyard'
  },
  WINERY: {
    id: 'winery',
    title: 'Winery Operations',
    content: 'In the winery, you can process your grapes and create different types of wine.',
    page: 'winery'
  }
  // Add more tutorials as needed
};

class TutorialManager {
  constructor() {
    this.seenTutorials = new Set(JSON.parse(localStorage.getItem('seenTutorials') || '[]'));
    this.tutorialsEnabled = localStorage.getItem('tutorialsEnabled') !== 'false';
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

    const overlay = document.getElementById('tutorialOverlay');
    const content = document.getElementById('tutorialContent');
    
    content.innerHTML = `
      <h3>${tutorial.title}</h3>
      <p>${tutorial.content}</p>
      <div class="tutorial-buttons">
        <button class="btn btn-primary" onclick="tutorialManager.closeTutorial('${tutorialId}')">Got it!</button>
        <button class="btn btn-secondary" onclick="tutorialManager.disableAllTutorials()">Don't show tutorials</button>
      </div>
    `;
    
    overlay.style.display = 'flex';
  }

  closeTutorial(tutorialId) {
    this.markAsSeen(tutorialId);
    document.getElementById('tutorialOverlay').style.display = 'none';
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
