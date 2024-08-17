/*
Script to harvest a twisting vine field, and compact the result. You might need to adjust const and compactor placement to be able to use it.
V1.0 by arthirob 01/08/2024

Things to improve
*/

// Constant and variable declaration

const p = Player.getPlayer() ;
const lagTick = 4; // Edit this depending on your internet connection
const inv = Player.openInventory();


// Farm border declaration (no border no nation tho')
const xEast = 6546;
const xWest = 6583;
const zNorth = -4447;
const zSouth = -4426;

//Compactor placement declaration
const xFrontCompactor = 6547;
const zFrontCompactor = -4427; // Those two is where you stand. Two blocks away from the compactor is probably the best idea
const xChestCompactor = 6548;
const zChestCompactor = -4425;
const xFurnaceCompactor = 6546;
const zFurnaceCompactor = -4425;

//Misc declaration
const discordGroup = 'FU-Bot';
const farmName = "Vine farm next to portal"
const regrowTime = 8;
const lineCompact = 2; //The number of line you want to make before compating
const foodType = "minecraft:baked_potato"; // Change the food to be whatever you prefer to use !


var currentCompact ; //Track how many line you did since last compact
var plotLeft;
var currentPlot;
var currentTrap;
var effectMap ;
var gotBuff;
var speedPotAvailable;
var compactorOn;
var firstRound;
const startTime = Date.now();

function equipStick() { // Equip a stick in the 9th slot
    listStick = inv.findItem("minecraft:stick");
    if (listStick.length==0) {
        throw("Have a stick in our inventory")
    }
    inv.swapHotbar(listStick[0],8);
}

function checkSpeed() {
    gotBuff = false;
    effectMap = p.getStatusEffects();
    for (let i=0;i<effectMap.length;i++) {
        if (effectMap[i].getId()=="minecraft:speed") {
            gotBuff=true;
        }
    }
    return gotBuff;
}

function refreshSpeed() {
    const potList = inv.findItem("minecraft:potion")
    if (potList.length==0) {
        Chat.log("You are out of speed pots");  
        speedPotAvailable = false;
    } else {
        speedPotAvailable = true;
        inv.swapHotbar(potList[0],7)
        inv.setSelectedHotbarSlotIndex(7);
        KeyBind.keyBind("key.use", true);
        while (!checkSpeed()) {
            Client.waitTick();
        }
        KeyBind.keyBind("key.use", false);
        inv.setSelectedHotbarSlotIndex(0);
        
    }
}

function lookAtCenter(x, z) {// Look at the center of a block
    p.lookAt(x+0.5,p.getY()+0.5, z+0.5);
}

function walkTo(x, z) { // Walk to the center of a block
    lookAtCenter(x,z);
    KeyBind.keyBind("key.forward", true);
    while ((Math.abs(p.getX() - x - 0.5) > 0.2 || Math.abs(p.getZ() - z - 0.5 ) > 0.2)){
        lookAtCenter(x,z);// Allow trajectory correction
        Client.waitTick();
    }
    KeyBind.keyBind("key.forward", false);
    KeyBind.keyBind("key.sneak", false);
    Client.waitTick(lagTick);
    
}

function equiStick() {
    listStick = inv.findItem("minecraft:stick");
    if (listStick.length==0) {
        throw("Have a stick in our inventory")
    }
    inv.swapHotbar(listStick[0],8);
}

function chestFull(inv) {
    const size = inv.getTotalSlots();
    for (let i = 0; i < size - 36; i++) {
         if (inv.getSlot(i).isEmpty()) {
             return false;
         }
    }
    return true;
}

function compact() { //Go to the compactor, put things in the chest and hit the furnace with the stick
    walkTo(xFrontCompactor,zFrontCompactor );
    lookAtCenter(xChestCompactor,zChestCompactor); //Open the chest
    Client.waitTick(lagTick);
    p.interact();
    Client.waitTick(lagTick);

    const inv = Player.openInventory();
    const slots = inv.getSlots('main', 'hotbar', 'offhand');

    // Put the kelp in the chest
    for (const slot of slots) {
        const item = inv.getSlot(slot).getItemId();
        if (item === "minecraft:twisting_vines") {
            while (chestFull(inv)) {
                Client.waitTick(20);//Wait a second if the chest is full
            }
                inv.quick(slot);
        }
    }
    Player.openInventory().close();
    Client.waitTick(lagTick);
    if (!compactorOn) {
        lookAtCenter(xFurnaceCompactor,zFurnaceCompactor);
        inv.setSelectedHotbarSlotIndex(8);
        Client.waitTick(lagTick);
        p.attack();
        Client.waitTick(lagTick);
        inv.setSelectedHotbarSlotIndex(0);
        compactorOn = true
    }
}

function eat() {
    if (p.getFoodLevel()<19) {
        const foodList = inv.findItem(foodType);
        if (foodList.length==0) {
            throw("Out of food")
        }
        inv.swapHotbar(foodList[0],2);
        KeyBind.keyBind("key.use", true);
        inv.setSelectedHotbarSlotIndex(2);
        do {
            Client.waitTick(10);
        } while (p.getFoodLevel()<19)
        KeyBind.keyBind("key.use", false);
        inv.setSelectedHotbarSlotIndex(0);
    }
}

function doingLine() { // Return true if you are still cutting line, false if not
    if (dir==1) {
        return (Math.floor(p.getX())<=(xEast-1))
    } else {
        return (Math.floor(p.getX())>=(xWest+1))
    }
}

function cutLine() { //Cut one lines of kelp
    p.lookAt(0,0)
    KeyBind.keyBind("key.attack", true);
    Client.waitTick();
    if (dir==1) {
        KeyBind.keyBind("key.left", true);
    } else {
        KeyBind.keyBind("key.right", true);
    }
    while (doingLine()) {
        Client.waitTick();
    }
    KeyBind.keyBind("key.attack", false);
    KeyBind.keyBind("key.left", false);
    KeyBind.keyBind("key.right", false);
}

function cutKelp() { //Cut all the kelp
    currentPlot = zNorth;
    plotLeft = true;
    while (plotLeft) {
        dir = 1;
        walkTo(xWest+1,currentPlot)
        cutLine();
        currentPlot+=plotWidth;
        walkTo(xEast,currentPlot);
        walkTo(xEast-1,currentPlot);
        dir = -1 ;
        cutLine();
        currentPlot+=plotWidth;
        if (!checkSpeed()) {
            refreshSpeed();
        }
        eat();
        if (currentPlot>zSouth) {
            plotLeft=false
        } else {
            walkTo(xWest,currentPlot);
        }
    }
}

function harvestTwoLine() {
    Chat.log("Begin harv2");
    KeyBind.keyBind("key.sprint", true);
    walkPreciseTo(xWest-trapMargin,currentTrap);
    p.lookAt(-90,0);
    eat();
    walkPreciseTo(xEast+trapMargin,currentTrap);
    currentTrap+=trapdoorDist;
    walkPreciseTo(xEast+trapMargin,currentTrap);
    walkPreciseTo(xWest-trapMargin,currentTrap);
    currentTrap+=trapdoorDist;
    KeyBind.keyBind("key.sprint", false);
    compact();
}

function harvestKelp() { //Harvest and compact the kelp
    Chat.log("Begin harv all");
    currentTrap = zNorth-trapdoorDist ;
    while (currentTrap<(zSouth+2*trapdoorDist)) {
        harvestTwoLine();
    }
}

function farmMain() {
    cutKelp(); // Cut the kelp
    walkTo(xWest,zNorth); //Go upstairs
    KeyBind.keyBind("key.jump", true);
    Client.waitTick(3);
    KeyBind.keyBind("key.jump", false);
    walkTo(xWest-trapdoorDist,zNorth);
    walkTo(xWest-trapdoorDist,zNorth-trapdoorDist);
    firstRound = true;
    compactorOn = false ;
    while (firstRound||(inv.findItem("minecraft:kelp").length>0)) { //Reharvest until you have kelp left in your inventory
        harvestKelp();
        firstRound = false;
    }
    harvestKelp(); //Do one last turn, just in case !
}

function finishFarm() {
    const farmTime = Math.floor((Date.now()-startTime)/1000);
    Chat.say("/g "+discordGroup+" "+farmName+" is finished to harvest in "+(Math.floor(farmTime/60))+" minutes and "+(farmTime%60)+" seconds. It'll be ready again in "+regrowTime+" hours. Now logging out") 
    Chat.say("/logout")
}

function start() {
    //First check the position
    if ((Math.floor(p.getX()!=xWest))||(Math.floor(p.getZ()!=zNorth))) { // Check if you are inside the farm
        equipStick();
        eat();
        refreshSpeed();
        farmMain();
        finishFarm();
     } else {
        Chat.log("Please, start in the lodestone")
    }
}

start();