/*
Script to harvest a square potato field, and compact the result. You might need to adjust const and compactor placement to be able to use it.
V1.3 by arthirob 15/07/2024

Things to improve
*/

// Constant and variable declaration

const p = Player.getPlayer() ;
const inv = Player.openInventory();
const lagTick = 6; // Edit this depending on your internet connection


// Farm border declaration (no border no nation tho')
const xEast = 5776;
const xWest = 5697;
const zNorth = -7158;
const zSouth = -7138;


//Compactor placement declaration
const xFrontCompactor = 5719;
const zFrontCompactor = -7138; // Those two is where you stand. Two blocks away from the compactor is probably the best idea
const xChestCompactor = 5721
const zChestCompactor = -7136
const xFurnaceCompactor = 5718
const zFurnaceCompactor = -7136

var dir ;//The direction you are going. 1 for north, 0 for south
var row ; // The current row you are in
var timeRemaining ; //The time remaining in the farm approximately
var lineFinished; // The boolean to check if a line is finished

const timePerRow = ((zSouth-zNorth)/4.31) + 3 ; // Count the time to harvest a row and the wait ticks
const startTime = Date.now();


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
    Client.waitTick(lagTick);
    
}

function equipTool() { // Function to equip a tool with the fortune effect
    var foundTool = false;
    let i = 9;
    while ((i < 45)&&(!foundTool)){
        if (inv.getSlot(i).hasEnchantment("fortune")) {
            if (inv.getSlot(i).getEnchantment("Fortune").getLevel()==3) {
                inv.swapHotbar(i,0);
                foundTool=true;
            }
        }
        i++;
    }
    if (!foundTool) {
        throw("Have a fortune 3 tool in our inventory")
    }
}

function equiStick() {
    listStick = inv.findItem("minecraft:stick");
    if (listStick.length==0) {
        throw("Have a stick in our inventory")
    }
    inv.swapHotbar(listStick[0],8);
}

function farmLine() { // Farm a line
    walkTo(row, zSouth*dir+zNorth*(1-dir));
    lineFinished=false;
    pitch = 90
    KeyBind.keyBind("key.forward", true);
    while (!lineFinished ) {
        p.lookAt(dir*180, pitch);
        p.interact();
        Client.waitTick();
        if (pitch != 19) {
            pitch += (19 - pitch) / 25
        }
        if (dir==1) {
            if ((Math.floor(p.getZ()) < zNorth + 4)) {
                lineFinished=true;
            }
        } else {
            if ((Math.floor(p.getZ()) > zSouth - 4 )) {
                lineFinished=true;
            }
        }
    }
    KeyBind.keyBind("key.forward", false);
    Client.waitTick(lagTick);
}

function farmTwoLine() { //Farm two line
    farmLine();
    row++;
    dir = 1-dir;
    farmLine();
    row++;
    dir = 1-dir;
}

function compact() { //Go to the compactor, put things in the chest and hit the furnace with the stick
    walkTo(xFrontCompactor,zFrontCompactor );
    lookAtCenter(xChestCompactor,zChestCompactor); //Open the chest
    Client.waitTick(lagTick);
    p.interact();
    Client.waitTick(lagTick);

    const inv = Player.openInventory();
    const slots = inv.getSlots('main', 'hotbar', 'offhand');
    // Put the potatoes in the chest
    for (const slot of slots) {
        const item = inv.getSlot(slot).getItemId();
        if (item === "minecraft:potato" || item === "minecraft:poisonous_potato") {
            inv.quick(slot);
            Client.waitTick();
            
        }
    }
    Player.openInventory().close();
    Client.waitTick(lagTick);
    lookAtCenter(xFurnaceCompactor,zFurnaceCompactor);
    inv.setSelectedHotbarSlotIndex(8);
    Client.waitTick(lagTick);
    p.attack();
    Client.waitTick(lagTick);
    inv.setSelectedHotbarSlotIndex(0);
}
function farmMain() { // Main farming functions
    row = Math.floor(p.getX());
    if (row != xWest) {
        Chat.log("Resuming at "+ (row-xWest)+"th row")
    }
    inv.setSelectedHotbarSlotIndex(0);
    dir=1;
    while (row <= xEast) {
        timeRemaining = Math.floor((xEast-row+1)*timePerRow);//Count the time to harvest the rows and add the time to go to the compactor
        Chat.log((xEast-row+1) +" row remainings");
        Chat.log("Time remaining : "+ Math.floor(timeRemaining/60)+ " minutes and "+(timeRemaining%60)+" seconds");
        farmTwoLine();
        compact();
    }

    const farmTime = Math.floor((Date.now()-startTime)/1000);
    Chat.log("Farm is finished to harvest in "+(Math.floor(farmTime/60))+" minutes and "+(farmTime%60)+" seconds. Now logging out")
    Chat.say("/logout")    
}


function start(){
    currentX = Math.floor(p.getX());
    currentZ = Math.floor(p.getZ());

    //First check the position
    if ((xWest<=currentX)&&(currentX<=xEast)&&(zNorth<=currentZ)&&(currentZ<=zSouth)) { // Check if you are inside the farm
        equipTool();
        equiStick();
        farmMain();
        Chat.log("Job is finished. Now logging logging out.");
        Chat.say("/logout")
     }else {
        Chat.log("You are not in the farm, cannot proceed");
    }
}

start();