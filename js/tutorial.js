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
  UI_INTRO: {
    id: 'ui_intro',
    title: 'Getting Started',
    pages: [
      {
        title: 'Navigation Menu',
        content: 'Okay, I will show you around. To the left of the screen, we can access the most important places. I\'ll show you a few of them now.',
        highlightElement: 'sidebar-wrapper'  // Element ID to highlight
      },
      {
        title: 'Main Office Overview',
        content: 'This is the Main Office Overview. Here is where you can manage your administrative tasks and get an overview of the winery operations.',
        highlightElement: 'main-link'  // Using the existing ID of the land menu item
      },
      {
        title: 'Farmland Overview',
        content: 'This is the Farmland Overview. Here is a list of our current fields. You can buy new fields, plant crops, and manage your land from here. I will tell you more about this the first time you visit this page.',
        highlightElement: 'land-link'  // Using the existing ID of the land menu item
      },
      {
        title: 'Vineyard Management',
        content: 'In the Vineyard section, you\'ll manage your grape vines, from planting to harvesting.',
        highlightElement: 'vineyard-link'
      }
    ]
  },
  MAINOFFICE: {
    title: 'Main Office Overview',
    pages: [
      {
        title: 'Welcome to your Main Office',
        content: 'Welcome to your Main office area! Here you will manage the overall operations of your winery. Mostly this is where you can move time forward one week when you are ready.',
      },
    ]
  },

  FINANCE: {
    title: 'Finance Overview',
    pages: [
      {
        title: 'Welcome to Finance Management',
        content: 'Welcome to your finance management area! Here you can track your income, expenses, and overall financial health. Keeping a close eye on your finances is crucial for the success of your winery. You will see three tabs here "Income/Balance", "Cash Flow", and "Research and Upgrades". I\'ll explain them to you now. ',
      },

      {
        title: 'Income/Balance',
        content: 'The Income Statement section provides a detailed view of your income and expenses over time. You can select to view this by week, season or year. This may be useful to you as the income and expenses may not be distributed evenly across the seasons. You\'ll notice that most of the info here you can click to gain more information. In the balance sheet, you will find information.',
        highlightElement: 'income-balance-link'  // This will highlight the Income/Balance link // NOT WORKING
      },

      {
        title: 'Cash Flow',
        content: 'The Cash Flow section provides a detailed view of your income and expenses. You will be able to see every transaction in and out of the winery here.',
        highlightElement: 'cash-flow-link'  // This will highlight the Cash Flow link // NOT WORKING
      },
      {
        title: 'Research and Upgrades',
        content: 'The Research and Upgrades section allows you to invest in new technologies and upgrades for your winery. This can help you improve efficiency, quality, and overall performance. You will notice that some upgrades are expensive and time consuming. Some upgrades are just for a single field, some are for the whole winery. ',
        highlightElement: 'income-statement-link'  // This will highlight the Income Statement link // NOT WORKING
      }
    ]
  },

  STAFF: {
    title: 'Staff Management',
    pages: [
      {
        title: 'Welcome to Staff Management',
        content: 'Welcome to your staff management area! Here you can hire, train, and manage your winery staff. Your staff has a skill level that represents their overall capabilities. Their skills are divided into five skill types: "Field", "Winery", "Administration", "Sales" and "Building and Maintenance". Like most values in Winemaker, the skills are represented by a value from 0-1. You will find out that the more skilled your worker is with a task type the faster and better he/she will perform it.',
      },

      {
        title: 'About your staff',
        content: 'As you can see the whole family is working here. Some of us you have already met, and here you can see more information about what we are good at. You can also see how much we are paid each week. The wage of the staff will be tied to, but not an exact match to the skill of the worker. You can always click on a member of the staff to see more information about them. Some of your staff will have specializations that will make them better at certain tasks.',
      },
      
      {
        title: 'Hiring Staff',
        content: 'To hire new staff, click the "Hire Staff" button. This will start a "Search for staff" option window. You can set up what kind of staff you are looking for, what skill level, or if you want a candidate with a specific skill. Be wary though, the more specific you search the longer it will take to find candidates, and it will become more expensive.',
        highlightElement: 'hire-staff-btn'  // This will highlight the Hire Staff button // NOT WORKING
      },
      {
        title: 'Team Management',
        content: 'In the team Management section you can control, who is working on what task. We have allready created some teams the way we use to do it around here, but you can create your own teams if you want. You can assign a team to be responsible for a specific task, if so that members of that team will automaticly work the task you specify. You\ll notice that some of us is allready on a team, you may change that if you want. ',
      }
    ]
  },

  FARMLAND: {
    title: 'Farmland Overview',
    pages: [
      {
        title: 'Welcome to Farmland Management',
        content: 'Welcome to your farmland management area! Here you can manage your fields. This is where you will choose which grapes you want to plant. Choose carefully, vines last many years, once planted you can Uproot and plant new vines, but is cost and labor intensive. You can always click your field to get more information, and you can click the grapes to see detailed information, about the grapes characteristics.',
      },
      {
        title: 'Buying New Land',
        content: 'To expand your operation, you\'ll need to acquire more land. Click the "Buy Land" button to see available properties in different regions.',
        highlightElement: 'buy-land-btn'  // This will highlight the Buy Land button
      },
      {
        title: 'Taking care for your vineyards',
        content: 'A good vineyard manager connects with his vineyards and can feel the wellbeeing of them, if you need at little help feeling the vines in the beginning, you can monitor at the Field Health value, there are a number of different things you can do to keep your vineyards healthy. Cleanring, Prunning, Vine replanting, or even soil management.',
        highlightElement: 'action-scetion'  // This will highlight the Buy Land button // NOT WORKING
      },

      {
        title: 'Planting Vines',
        content: 'To plant vines, click on a field and select the "Plant Vines" option. You can then choose the type of grapes to plant. Remember, each grape variety has unique requirements and characteristics, so choose wisely.',
      },  
      {
          title: 'Soil Management',
          content: 'Proper soil management is crucial for healthy vines. There are reaseach and upgrades you can do you improve soil and health. Be carefull what operations you perform though, if you eventually want to aquire a eco-certificaltions.',
          highlightElement: 'soil-management-btn'  // This will highlight the Soil Management button
      },

      {
          title: 'Planting Vines',
          content: 'To plant vines, click on a field and select the "Plant Vines" option. You can then choose the type of grapes to plant. Remember, each grape variety has unique requirements and characteristics, so choose wisely.',
          highlightElement: 'plant-btn'  // This will highlight the Plant Vines button
      }
      
    ]
  },
  
  BUILDINGS: {
    title: 'Building and Maintenance',
    content: 'Welcome to the Winery! Here you can see what buildings we have allready, what we can build and how we can upgrade them. Its important we have enough space in our buildings for the tools we need. For now i would recommand that we check that we have some storage room in the place for the harvest (Harvesting tools in the winery). While its nice to have some tools for crushing and pressing its not a nessesy as we can must the grapes without. However we cannot make any wine out of the must if we do not have somekind of Fermenting Wessel inplace in the Winery . ',
  },

  BUILDINGS: {
    title: 'Building Management',
    pages: [
      {
        title: 'Welcome to Building Management',
        content: 'Welcome to the Winery! Here you can see what buildings we have allready, what we can build and how we can upgrade them. Its important we have enough space in our buildings for the tools we need. For now i would recommand that we check that we have some storage room in the place for the harvest (Harvesting tools in the winery). While its nice to have some tools for crushing and pressing its not a nessesy as we can must the grapes without. However we cannot make any wine out of the must if we do not have somekind of Fermenting Wessel inplace in the Winery.',
      },

      {
        title: 'Building and Maintenance',
        content: 'We should maintaine the buildings well. There is severe drawbacks if we dont maintain them enough. Tools inside the building will take damege (Not implementet), and if the buildings decay to much it will hurt the whole winerys prestige.',
      },

      {
        title: 'Tool Shed',
        content: 'The Tool Shed is where you store your basic farming equipment. Items like tractors, trimmers, and harvest bins are kept here. Each building has slots that can hold tools, small similar tools can share the same slot up, we use weight capacity of the "slot" in the building to desripe how many of a tool that can fit into one spot in the building.',
        highlightElement: 'building-card-toolshed'  // Will need to add this ID to the building card
      },
      {
        title: 'Warehouse',
        content: 'The Warehouse provides storage for larger equipment and temporary grape storage during harvest. You\'ll find forklifts and pallet jacks here. These are general tools that can be used in a multiple of operations in the "Year Wheel of the winery". We also have large storage bins here, used for the harvest. The warehouse has larger slot capacities than the tool shed, and the tools in general are larger here.',
        highlightElement: 'building-card-warehouse'
      },
      {
        title: 'Winery',
        content: 'The Winery is where grape processing happens. This building houses your crushing, pressing, and fermentation equipment. These specialized tools are crucial for wine production. As i mentioned we cannot do the fermentation process without atleast one fermentation wessel',
        highlightElement: 'building-card-winery'
      },
      {
        title: 'Wine Cellar',
        content: 'The Wine Cellar is for aging and storing your finished wines. As you expand, you\'ll need more cellar space to age different varieties and vintages. You can see the value of the wines in the wine cellar in the Finance section. ',
        highlightElement: 'building-card-winecellar'
      },
      {
        title: 'Office',
        content: 'The Office handles administrative tasks. Better office equipment can improve the efficiency of administrative work and marketing efforts.',
        highlightElement: 'building-card-office'
      },
      {
        title: 'Building Management',
        content: 'Click on any building to see its contents and manage tools. You can buy new tools, sell existing ones for 50% of their value, and upgrade buildings to increase their capacity. Each upgrade adds more slots for tools.',
      }
    ]
  },

  VINEYARD: {
    title: 'Vineyard Management',
    content: 'Welcome to your vineyard! Here you can manage your fields, plant vines, and harvest grapes. Monitor ripeness levels carefully to achieve the best quality harvest.',
  },
  WINERY: {
    title: 'Winery Operations',
    content: 'Welcome to your winery! Here you can process your harvested grapes into wine. Start by crushing grapes into must, then ferment the must into wine.',
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
    
    // Add specific class for farmland tutorial
    const extraClass = this.activeTutorial === 'FARMLAND' ? 'tutorial-wrapper-moved' : '';
    
    // Remove previous highlight if exists
    if (this.lastHighlightedElement) {
      this.removeHighlight(this.lastHighlightedElement);
    }
    
    // Use page-specific image if available, otherwise fall back to default country image
    const imageUrl = page.image || this.countryConfig.defaultImage;
    
    // Add highlight to new element if specified
    if (page.highlightElement) {
      this.highlightElement(page.highlightElement);
      this.lastHighlightedElement = page.highlightElement;
    }
    
    const content = `
      <div class="tutorial-wrapper ${extraClass}" >
        <div class="tutorial-image" style="background-image: url('${imageUrl}');"></div> 
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
    
    import('./overlays/overlayUtils.js').then(({ showStandardOverlay, hideOverlay }) => {
      hideOverlay('#tutorialOverlay');
      showStandardOverlay(content, 'tutorial-overlay'); // Pass additional class name
    });
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
      import('./overlays/overlayUtils.js').then(({ hideOverlay }) => {
        hideOverlay('#tutorialOverlay');
        hideOverlay('.standard-overlay');
        
        // Start UI tutorial after welcome tutorial
        if (tutorialId === 'WELCOME') {
          setTimeout(() => {
            this.showTutorial('UI_INTRO');
          }, 500);
        }
      });
    }
  }

  highlightElement(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
      element.style.position = 'relative';
      element.style.zIndex = '2000';
      element.style.boxShadow = '0 0 15px rgba(197, 165, 114, 0.8)';
      element.style.transition = 'all 0.3s ease';
    }
  }

  removeHighlight(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
      element.style.boxShadow = '';
      element.style.zIndex = '';
    }
  }

  disableAllTutorials() {
    this.tutorialsEnabled = false;
    localStorage.setItem('tutorialsEnabled', 'false');
    const tutorialOverlay = document.getElementById('tutorialOverlay');
    if (tutorialOverlay) {
      tutorialOverlay.style.display = 'none';
    }
    import('./overlays/overlayUtils.js').then(({ hideOverlay }) => {
      hideOverlay('#tutorialOverlay');
      hideOverlay('.standard-overlay');
    });
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
