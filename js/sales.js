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

    // Log the starting parameters and normalized land value
    console.log(`Calculating Wine Price:`);
    console.log(`Quality: ${quality}`);
    console.log(`Land Value: ${landValue}, Normalized Land Value: ${normalizedLandValue.toFixed(2)}`);
    console.log(`Field Prestige: ${fieldPrestige}`);

    // Calculate the average of quality, normalized land value, and field prestige
    let wineValueModifier = (quality * 100 + normalizedLandValue * 100 + fieldPrestige * 100) / 3;

    // Log the wine value modifier after including prestige
    console.log(`Wine Value Modifier: ${wineValueModifier.toFixed(2)}`);

    // Calculate and log the final wine price
    const finalPrice = baseValue * wineValueModifier;
    console.log(`Final Wine Price: €${finalPrice.toFixed(2)}`);

    return finalPrice;
}

export function generateWineOrder() {
    // Load existing wine orders from local storage
    const wineOrders = loadWineOrders();

    // Filter items that are in the "Bottle" state
    const bottledWines = inventoryInstance.items.filter(item => item.state === 'Bottle');
    if (bottledWines.length === 0) {
        addConsoleMessage("No bottled wine available for order.");
        return;
    }

    // Randomly select one bottled wine
    const randomIndex = Math.floor(Math.random() * bottledWines.length);
    const selectedWine = bottledWines[randomIndex];

    // Obtain the corresponding farmland using the field name
    const farmlands = JSON.parse(localStorage.getItem('ownedFarmlands')) || [];
    const farmland = farmlands.find(field => field.name === selectedWine.fieldName);
    const landValue = farmland.landvalue;

    // Create an order for the selected wine
    const newOrder = {
        resourceName: selectedWine.resource.name,
        fieldName: selectedWine.fieldName,
        vintage: selectedWine.vintage,
        quality: selectedWine.quality,
        amount: Math.round((0.5 + (Math.random() * 1.5)) * (1 + 2 * selectedWine.fieldPrestige)),
        wineOrderPrice: (0.5 +(Math.random() * 1.5 )) * calculateWinePrice(selectedWine.quality, landValue, selectedWine.fieldPrestige)
    };

    // Add the new order to the wine orders array
    wineOrders.push(newOrder);

    // Log the order creation to the console
    addConsoleMessage(`Created order for ${newOrder.quantity} bottles of ${newOrder.resourceName}, Vintage ${newOrder.vintage}, Quality ${newOrder.quality.toFixed(2)}, Price €${newOrder.wineOrderPrice.toFixed(2)}.`);

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