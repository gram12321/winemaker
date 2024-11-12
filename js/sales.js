import { inventoryInstance, displayInventory } from './resource.js'; // Import needed functions
import { normalizeLandValue } from './names.js'; // Ensure you import normalizeLandValue
import { addConsoleMessage } from './console.js';
import { addTransaction } from './finance.js';
import { applyPrestigeHit } from './database/loadSidebar.js';
import { saveInventory } from './database/adminFunctions.js';
import { loadWineOrders, saveWineOrders } from './database/adminFunctions.js';


// Modify sellWines function to use landValue from Farmland
export function sellWines(resourceName) {
    const resourceIndex = inventoryInstance.items.findIndex(item => item.resource.name === resourceName && item.state === 'Bottle');

    if (resourceIndex !== -1) {
        const resource = inventoryInstance.items[resourceIndex];

        if (resource.amount > 0) {
            resource.amount -= 1; // Reduce the inventory by 1

            // Obtain the corresponding farmland using the field name
            const farmlands = JSON.parse(localStorage.getItem('ownedFarmlands')) || [];

            // Match the resource field name against the correct property in farmland
            const farmland = farmlands.find(field => field.name === resource.fieldName);

            const landValue = farmland.landvalue;

            const sellingPrice = calculateWinePrice(resource.quality, landValue, resource.fieldPrestige);

            // Add console message to notify user of the sale
            addConsoleMessage(`Sold 1 bottle of ${resource.resource.name}, Vintage ${resource.vintage}, Quality ${resource.quality.toFixed(2)} for €${sellingPrice.toFixed(2)}.`);

            // Log the sale transaction and update the balance
            addTransaction('Income', 'Wine Sale', sellingPrice);

            // Optionally handle prestige effects if used
            const prestigeHit = sellingPrice / 1000;
            applyPrestigeHit(prestigeHit);

            if (resource.amount === 0) {
                // Optionally remove the item if the amount reaches zero
                inventoryInstance.items.splice(resourceIndex, 1);
            }

            saveInventory(); // Save the inventory updates

            // Optionally, refresh the inventory display if your UI supports it
            displayInventory(inventoryInstance, ['winecellar-table-body'], true);
        }
    }
}


// New function to calculate wine price using average moderation
export function calculateWinePrice(quality, landValue, fieldPrestige) {
    const baseValue = 1; // Base value in Euros
    const normalizedLandValue = normalizeLandValue(landValue); // Takes value per acre, and Normalize the land value to 0-1

    // Calculate the average of quality, normalized land value, and field prestige
    let wineValueModifier = (quality * 100 + normalizedLandValue * 100 + fieldPrestige * 100) / 3;

    // Calculate and log the final wine price
    const finalPrice = baseValue * wineValueModifier;
    return finalPrice;
}

export function generateWineOrder() {
    // Load existing wine orders from local storage
    const wineOrders = loadWineOrders();

    // Filter items that are in the "Bottle" state
    const bottledWines = inventoryInstance.items.filter(item => item.state === 'Bottle');
    if (bottledWines.length === 0) {
        addConsoleMessage("A customer want to buy wine, but there is no bottles in the winecellar.");
        return;
    }

    // Define order types with their multipliers for amount and price
    const orderTypes = {
        "Private Order": { amountMultiplier: 1, priceMultiplier: 1 },
        "Engross Order": { amountMultiplier: 10, priceMultiplier: 0.85 }
        // Add other order types here if needed
    };

    // Randomly select one bottled wine
    const randomIndex = Math.floor(Math.random() * bottledWines.length);
    const selectedWine = bottledWines[randomIndex];

    // Obtain the corresponding farmland using the field name
    const farmlands = JSON.parse(localStorage.getItem('ownedFarmlands')) || [];
    const farmland = farmlands.find(field => field.name === selectedWine.fieldName);
    const landValue = farmland.landvalue;

    // Randomly select an order type
    const orderTypeKeys = Object.keys(orderTypes);
    const selectedOrderTypeKey = orderTypeKeys[
        Math.floor(Math.random() * orderTypeKeys.length)
    ];
    const selectedOrderType = orderTypes[selectedOrderTypeKey];

    // Calculate order amount and price with multipliers
    const baseAmount = Math.round((0.5 + Math.random() * 1.5) * (1 + 2 * selectedWine.fieldPrestige));
    const basePrice = (0.5 + Math.random() * 1.5) * calculateWinePrice(selectedWine.quality, landValue, selectedWine.fieldPrestige);

    const newOrder = {
        type: selectedOrderTypeKey,
        resourceName: selectedWine.resource.name,
        fieldName: selectedWine.fieldName,
        vintage: selectedWine.vintage,
        quality: selectedWine.quality,
        amount: baseAmount * selectedOrderType.amountMultiplier,
        wineOrderPrice: basePrice * selectedOrderType.priceMultiplier
    };

    // Add the new order to the wine orders array
    wineOrders.push(newOrder);

    // Log the order creation to the console with the order type
    addConsoleMessage(`Created ${newOrder.type} for ${newOrder.amount} bottles of ${newOrder.resourceName}, Vintage ${newOrder.vintage}, Quality ${newOrder.quality.toFixed(2)}, Price €${newOrder.wineOrderPrice.toFixed(2)}.`);

    // Save the updated list of wine orders back to local storage
    saveWineOrders(wineOrders);
    saveInventory();
}

export function sellOrderWine(orderIndex) {
  const wineOrders = loadWineOrders();

  if (orderIndex >= 0 && orderIndex < wineOrders.length) {
    const order = wineOrders[orderIndex];
    const amount = order.amount;
    const totalSellingPrice = order.wineOrderPrice * amount;

    // Add console message to notify the user of the sale
    addConsoleMessage(`Sold ${amount} bottles of ${order.resourceName}, Vintage ${order.vintage}, Quality ${order.quality.toFixed(2)} for a total of €${totalSellingPrice.toFixed(2)}.`);

    // Log the sale transaction and update the balance
    addTransaction('Income', 'Wine Sale', totalSellingPrice);

    // Optionally handle prestige effects
    const prestigeHit = totalSellingPrice / 1000;
    applyPrestigeHit(prestigeHit);

    // Deduct the quantity from inventory
    const inventoryItems = inventoryInstance.items;
    const resourceIndex = inventoryItems.findIndex(item =>
      item.resource.name === order.resourceName &&
      item.state === 'Bottle' &&
      item.vintage === order.vintage &&
      item.quality === order.quality
    );

    if (resourceIndex !== -1) {
      const resource = inventoryItems[resourceIndex];

      if (resource.amount >= amount) {
        resource.amount -= amount;
        if (resource.amount === 0) {
          // Remove the item if the amount reaches zero
          inventoryItems.splice(resourceIndex, 1);
        }
      } else {
        addConsoleMessage('Insufficient inventory to complete this order.');
        return;
      }
    } else {
      addConsoleMessage('Wine not found in inventory.');
      return;
    }

    // Save the updated inventory
    saveInventory();

    // Remove the sold order from the list
    wineOrders.splice(orderIndex, 1);
    saveWineOrders(wineOrders);

    // Directly remove the row from the table
    const wineOrdersTableBody = document.getElementById('wine-orders-table-body');
    const orderRow = wineOrdersTableBody.children[orderIndex];
    if (orderRow) {
      wineOrdersTableBody.removeChild(orderRow);
    }

    // Refresh the inventory display if your UI supports it
    displayInventory(inventoryInstance, ['winecellar-table-body'], true);

  } else {
    addConsoleMessage('Invalid wine order index.');
  }
}

export function shouldGenerateWineOrder() {
    const companyPrestige = parseFloat(localStorage.getItem('companyPrestige')) || 0;

    let chance;

    if (companyPrestige <= 100) {
        // Use a linear scaling for lower prestige values
        chance = 0.2 + (companyPrestige / 100) * (0.5 - 0.2);
    } else {
        // Use a non-linear curve to handle higher prestige values (Prestige: 0-100 liniar 0=20%, 100=50%,, then 500=0,67, 2000=0,87 5000=0,94. Never gets above 99%.))
        chance = 0.5 + (Math.atan((companyPrestige - 100) / 200) / Math.PI) * (0.99 - 0.5);
    }

    // Ensure that chance never exceeds maxChance
    const finalChance = Math.min(chance, 0.99);

    // Use Math.random() to decide if a wine order should be generated
    return Math.random() < finalChance;
}