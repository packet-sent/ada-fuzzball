"use strict";

//Screen settings
var vp_width = 920, vp_height = 690;

//Module aliases
var Engine = Matter.Engine,
    Events = Matter.Events,
    Render = Matter.Render,
    Runner = Matter.Runner,
    Body = Matter.Body,
    Composite = Matter.Composite,
    Composites = Matter.Composites,
    Constraint = Matter.Constraint,
    MouseConstraint = Matter.MouseConstraint,
    Mouse = Matter.Mouse,
    World = Matter.World,
    Bodies = Matter.Bodies,
    Vector = Matter.Vector;

//Enable and configure the matter engine
var world, body, engine;

//Starting/creating the engine
this.engine = Engine.create();
world = engine.world;
body = Body;

var superFuzzMode = false, mouseTrajectoryFlag = false, releaseFlag = false, menuFlag = true;

var pressX, pressY,                                                                                     //Keeps track of the original press x and y position (used for aim)
    skybox, floor, leftBorder, rightBorder, fuzzBall, launcher, launcherBody,                           //Game Engine Objects
    backgroundImg, crateImg, metalImg, presentImg, launcherImg, fuzImg, superFuzzImg, hitSound, backgroundSound;         //Load game assets

var crates = [], metalCrates = [], currentMetalArrangement, currentCrateArrangement, LIMIT_CRATES;      //Crates Data

var fuzzBallsLivesText, announceScoreText, scoreText, powerupText, fuzzBallsLives = 10;                 //Text Data
var present, currentPresentPlace;                                                                       //Present Powerup Data
var randNum;                                                                                            //Random Number (used for map choosing)

//Physics settings for floor and crate
var floorOptions = {
  isStatic: true,
  restitution: 1.10,
  friction: 0.20,
  density: 1,
}
var crateOptions = {
  restitution: 1,
  friction: 0.0475,
  frictionAir: 0.0425,
  density: 1,
}


//Various maps with positions of crates, metal crates and presents.
var crateArrangementArray1 = [[vp_width - 30, vp_height - 88], [vp_width - 90, vp_height - 88], [vp_width - 150, vp_height - 88], [vp_width - 60, vp_height - 148], [vp_width - 120, vp_height - 148], [vp_width - 90, vp_height - 208], [vp_width - 30, vp_height - 360], [vp_width - 90, vp_height - 360], [vp_width - 60, vp_height - 420]],
    metalArrangementArray1 = [[vp_width - 30, vp_height - 300], [vp_width - 90, vp_height - 300], [vp_width - 150, vp_height - 300]];

var crateArrangementArray2 = [[vp_width - 30, vp_height - 88], [vp_width - 30, vp_height - 148], [vp_width - 150, vp_height - 148], [vp_width - 210, vp_height - 88], [vp_width - 270, vp_height - 88], [vp_width - 330, vp_height - 88], [vp_width - 90, vp_height - 208]],
    metalArrangementArray2 = [[vp_width - 90, vp_height - 88], [vp_width - 150, vp_height - 88], [vp_width - 90, vp_height - 148], [vp_width - 390, vp_height - 300]];

var crateArrangementArray3 = [[vp_width - 30, vp_height - 88], [vp_width - 150, vp_height - 88], [vp_width - 90, vp_height - 148], [vp_width - 270, vp_height - 208], [vp_width - 30, vp_height - 360], [vp_width - 150, vp_height - 360]],
    metalArrangementArray3 = [[vp_width - 90, vp_height - 88], [vp_width - 270, vp_height - 88], [vp_width - 270, vp_height - 148], [vp_width - 30, vp_height - 300], [vp_width - 90, vp_height - 300], [vp_width - 150, vp_height - 300], [vp_width - 390, vp_height - 300], [vp_width - 450, vp_height - 300]];

var presentArrangementArray = [[vp_width - 150, vp_height - 360], [vp_width - 390, vp_height - 360], [vp_width - 420, vp_height - 360]]

var maps = [[crateArrangementArray1, metalArrangementArray1], [crateArrangementArray2, metalArrangementArray2], [crateArrangementArray3, metalArrangementArray3]];


//Fuzzball releaser from the constraint with the launcher
function releaseFuzz(xvelocity, yvelocity) {
  launcher.releaseFuzzBall()                                   
  Matter.Body.setVelocity(fuzzBall.body, { x: xvelocity, y: yvelocity });
};

//Random number generator within the range given
function genRandNum(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min) + min);            //The maximum is exclusive and the minimum is inclusive
}

//Loading all assets needed
function preload() { 
  backgroundImg = loadImage("assets/SlamBackground920x690.png");
  crateImg = loadImage("assets/Crate120x120.png");
  metalImg = loadImage("assets/metalbox_thumb.png");
  presentImg = loadImage("assets/present.png");
  launcherImg = loadImage("assets/Launcher146x108.png");
  fuzImg = loadImage("assets/Fuzzball60x60.png");
  superFuzzImg = loadImage("assets/super_fuzz.png");
  hitSound = loadSound("assets/Hit.mp3");
  backgroundSound = loadSound("assets/AmbientLoop.mp3")
}


//Add all objects (fuzzball, launcher & crates) to the screen at the start of the game
function setup(isRestart = false) {
  superFuzzMode = false;                                           //Disables superFuzzMode
  fuzzBallsLives = 10;                                              //Sets default lives left 
  Matter.World.clear(world);                                       //Clears game objects in the world
  Matter.Engine.clear(engine);                                     //Clears game objects in the engine
  crates = [];                                                     //Clears the crates loaded
  metalCrates = [];                                                //Clears the metal crates loaded

  if (isRestart === false) { randNum = genRandNum(0, maps.length) }; //Depending on the flag of the setup function use same map or a new map
  var viewport = createCanvas(vp_width, vp_height);                //Creates and sets the canvas sizing
  viewport.parent("game-viewport");                                //Injects the canvas in the specific ID
  frameRate(60);                                                   //Sets the frame refresh rate which can be reduced to the default 30 for lower performance machines (used 144FPS for debug purposes and noticed no bugs on my machine)

  currentCrateArrangement = maps[randNum][0];                      //Loads crates arrangement from the map based on the random number generated
  currentMetalArrangement = maps[randNum][1];                      //Loads metal crates arrangement from the map based on the random number generated
  currentPresentPlace = presentArrangementArray[randNum];          //Loads present placement from the map based on the random number generated
  LIMIT_CRATES = currentCrateArrangement.length;
  
  //Instantiate all classes into objects
  floor = new c_Ground(vp_width / 2, vp_height - 48, vp_width, 20, floorOptions);
  leftBorder = new c_Ground(vp_width / 2 - 465, vp_height / 2, 20, vp_height, floorOptions);
  rightBorder = new c_Ground(vp_width / 2 + 470, vp_height / 2, 20, vp_height, floorOptions);
  skybox = new c_Ground(vp_width / 2, 5, vp_width, 20, floorOptions);
  present = new c_Crate(currentPresentPlace[0], currentPresentPlace[1], 49, 91, presentImg, crateOptions);
  fuzzBall = new c_Fuzzball(vp_width / 2 - 300, vp_height - 90, 60, fuzImg, superFuzzImg);
  launcher = new c_Launcher(vp_width / 2 - 300, vp_height - 180, fuzzBall.body);
  launcherBody = new c_Ground(vp_width / 2 - 380, vp_height - 90, 100, 105, floorOptions);
  fuzzBallsLivesText = new c_Text(10, 50, "Fuzz Balls - " + fuzzBallsLives, 30);
  scoreText = new c_Text(vp_width / 2 + 300, 50, "Score - ", 30);
  powerupText = new c_PowerupText(10, 80, "SUPERFUZZ", 30);
  announceScoreText = new c_AnnounceScoreText("", 60);

  for (let i = 0; i < LIMIT_CRATES; i++) {                         //Loops & creates crates based on the map level until the maximum of the current level
    crates[i] = new c_Crate(currentCrateArrangement[i][0], currentCrateArrangement[i][1], 60, 60, crateImg, crateOptions);
  }
  for (let i = 0; i < currentMetalArrangement.length; i++) {       //Loops & creates metal crates based on the map level until the maximum of the current level
    metalCrates[i] = new c_Crate(currentMetalArrangement[i][0], currentMetalArrangement[i][1], 60, 60, metalImg, crateOptions);
    metalCrates[i].makeStatic();                                   //Applies static physics property/attribute as metal crates shouldn't be destroyed by the fuzzball
  }
}

//Shows the background image and the launcher image on the game
function paintScene() {
  image(backgroundImg, 0, 0, vp_width, vp_height);
  image(launcherImg, vp_width / 2 - 450, vp_height - 150, 146, 108);
}

//Shows all the paintable objects (crates, metal crates, fuzzball, present powerup)
function paintAssets() {
  for (let i = 0; i < LIMIT_CRATES; i++) {                         //Loops all crates until the maximum of the current level
    crates[i].show();                                              //Shows the crate
  }
  for (let i = 0; i < metalCrates.length; i++) {                   //Loops all metal crates until the maximum of the current level
    metalCrates[i].show();                                         //Shows the metal crate
  }
  present.show();                                                  //Shows the present powerup
  fuzzBall.show();                                                 //Shows the fuzzball
  showLives();                                                     //Shows the remaining fuzzball lives
}

//Draws the game every X times a second depending on what the framerate is selected to
function draw() {
  let menu = document.getElementById("menu");                      //jQuery could have been used but JS was simple enough for just finding the specified element
  if (menuFlag === true) {                                         //Show menu when menu flag is true
    paintScene();
    menu.style = "display:block;";
  } else {
    Matter.Engine.update(engine);                                  //Update engine 
    menu.style = "display:none;";                                  //Hides menu when menu flag is false
    paintScene();                                                  //Paint the background scene
    paintAssets();                                                 //Paint the assets used (crates, metal crates, fuzzball, present powerup)
    updateScore();                                                 //Updates the scores
    fuzzBallStopped();                                             //Checking for the fuzzBall if it has come to a halt
    collision();                                                   //Detects objects colliding using SAT (Separating Axis Theorem) from matterjs
    drawLine();                                                    //Draws a white line indicating where the player is aiming
    checkCrates();                                                 //Checking if every destroyable crate has been destroyed
    fuzzMode();                                                    //Draws that the superfuzz mode has been activated on the cavas
  }
}


//Detects is a powerup has been activated
function fuzzMode() {
  if (superFuzzMode === true) {                                    //Checks if superFuzzMode is true
    powerupText.show();                                            //Show powerup text
  }
}

//Detecting collision and deleting the crate the fuzzball collided with
function collision() {
  for (let i = 0; i < LIMIT_CRATES; i++) {                         //Going through each crate, and checking for collision between the fuzzball and crates using SAT (Separating Axis Theorem) from matterjs
    if (Matter.SAT.collides(fuzzBall.body, crates[i].body).collided) {
      hitSound.play();                                             //Play the sound when a collision is detected
      crates[i].remove()                                           //Remove the hit crate
      crates.splice(i, 1)                                          //Remove the crate from the array
      LIMIT_CRATES = LIMIT_CRATES - 1;                             //Removes the max crates in on the engine by 1 after being removed
      announceScoreText.text = 10;
      announceScoreText.show();                                    //Shows the score with the pop up with the predefined value
    }
  }
  if (Matter.SAT.collides(fuzzBall.body, present.body).collided) { //Checking for collision between the fuzzball and the present using SAT (Separating Axis Theorem) from matterjs
    present.remove();                                              //Remove the present from the engine
    fuzzBall.superFuzz();                                          //Enables the superFuzz properties/attributes (+ change image overlay)
    superFuzzMode = true;                                          //Enables superFuzzMode (which runs the function to show the powerup text)
  }
}

//Checking if the fuzzball has stopped moving or slowed down since being released, and resetting it to its default position with the constraint to the launcher
function fuzzBallStopped() {
  if (abs(fuzzBall.body.velocity.x) < 0.125 && abs(fuzzBall.body.velocity.y) < 0.125 && releaseFlag == true) { //If under X/Y velocity then continue
    launcher.launch.bodyB = fuzzBall.body                                                                  //Reattaches the fuzzball to the launcher
    Matter.Body.setPosition(fuzzBall.body, { x: vp_width / 2 - 300, y: vp_height - 90 })                   //Resets the posion of the fuzzball to the default (no need to remove and create a new fuzzball again)
    releaseFlag = false;                                                                                   //Resets the releaseFlag to false to stop drawing the line on the screen
    if (fuzzBallsLives === 0) {                                                                            //Checks for the fuzzball lives left
      menuFlag = true;                                                                                     //Opens the menu to show the final score of the game
      updateScore("Game Over \n Score : ");
    }
  }
}

//Draw a line from the 1st pressed position to where the mouse is when being dragged whilst pressed
function drawLine() {
  if (releaseFlag === true) {                                                                              //Checks if the fuzzball has been launched already and not in the default position constrained to the launcher
    return;                                                                                                //Returns to not let you run the next if statement even if the mouse is pressed
  }
  if (mouseIsPressed === true) {                                                                           //Checks if the mouse is pressed using p5js
    if (mouseTrajectoryFlag == false) {                                                                    //If the flag is false then continue
      pressX = mouseX;                                                                                     //Saves the values where the 1st press happened to the click vars
      pressY = mouseY;
      mouseTrajectoryFlag = true;                                                                          //Changes the flag to true
    }
    stroke(255);
    strokeWeight(1);
    line(mouseX, mouseY, pressX, pressY);                                                                  //Draws a line from where the mouse is being held now to where it was 1st pressed
    cursor("crosshair");                                                                                   //Draws a crosshair to make aiming easier even with different colours as the crosshair has inverted colours making it easier for players
  }
}

//Runs after the mouse press has been released using p5js
function mouseReleased() {
  if (menuFlag === true || releaseFlag == true) {                                                          //Doesn't let you continue if the menu is open or the fuzzball has been released already
    return;
  }
  mouseTrajectoryFlag = false;                                                                             //Resets the flag so that you can aim again with the next fuzzball later
  let widthLine = mouseX - pressX;
  let heightLine = mouseY - pressY;

  if (widthLine == 0 && heightLine == 0) {                                                                 //Filter values so we don't get dodgy angle calculations
    return
  }
  var angle = Math.atan(heightLine / widthLine)                                                            //Calculate the angle to apply to the fuzzball when releasing it
  var velocityForce = eval(((widthLine) ** 2 + (heightLine ** 2)) ** (1 / 2)) / 10;                        //Calculating the force to apply to the fuzzball based on the length of the line
  if (velocityForce > 20) {                                                                                //Limit the maximum force that can be applied to the fuzzball as we want to make the game to be easily playable
    velocityForce = 20                                                                                     //If going over the max then manually set it
  }
  releaseFuzz(velocityForce * Math.cos(angle), velocityForce * Math.sin(angle))                            //Trigger the release function of the fuzzball velocity on the X axis and Y axis
  releaseFlag = true;                                                                                      //Change the flag to true so you can't try aiming or shooting again
  fuzzBallsLives -= 1;                                                                                     //Removes 1 life from the total lives left of the fuzzballs after its released
}

//Always checing if all the desotroyable crates have been destroyed
function checkCrates() {
  if (crates.length === 0) {                                       //Checks if the crates left are 0, else do nothing
    fuzzBallsLivesText.text = "Fuzz Balls - 0";                    //Changes the text with the lives remaning for the fuzzball to 0
    fuzzBallsLivesText.show();                                     //Shows the new changes
    menuFlag = true;                                               //Opens the menu to show the final score of the game
    updateScore("Congrats! You have won !!! \n Score: ");          //Shows your final score in the game 
  }
}

//Updates the text showing the score
function updateScore(templateScoreText = "Score: ") {
  let score = document.getElementById("score");                    //jQuery could have been used but JS was simple enough for just finding the specified element
  let totalScore = (currentCrateArrangement.length - crates.length) * 10; //Score based on the total crates of the loaded map level minus the crates left and multiplied by 10.
  score.innerText = templateScoreText + totalScore;                //The plain text will contain the following "Score: TOTAL_SCORE"
  scoreText.text = templateScoreText + totalScore;
  scoreText.show();                                                //Shows the new changes to the score
}

//Updates the text with the lives remaining for the fuzzball
function showLives() {
  fuzzBallsLivesText.text = "Fuzz Balls - " + fuzzBallsLives;      //Changes the text with the lives remaning for the fuzzball to 0
  fuzzBallsLivesText.show();                                       //Shows the new changes
}

//Function checking if the "ESC" key has pressed, if yes then turn the menu flag to true
function keyPressed() {
  if (keyCode === 27) {
    backgroundSound.stop();                                       //Stop music when the menu is open
    menuFlag = true
  }
}

//Function is triggered when a user has clicked restart on the menu, which then turn the menu flag to false and run the setup
function start() {
  menuFlag = false;
  backgroundSound.loop();                                         //Loop music when starting
  setup();                                                        //Triggers the setup function which resets the game engine/canvas without the any flags
}

//Function is triggered when a user has clicked restart on the menu, which then turn the menu flag to false and run the setup
function restart() {
  menuFlag = false;
  backgroundSound.loop();                                         //Loop music when restarting
  let restartFlag = true;                                         //Changes the flag to true which can be used in the setup function
  setup(restartFlag);                                             //Triggers the setup function which resets the game engine/canvas with the restart flag being set to true
}

//Function is triggered when a user has clicked close menu, which turns the menu flag to false
function closeMenu() {
  if (fuzzBallsLives === 0 || crates.length === 0) {
    return;
  }
  backgroundSound.loop();                                         //Loop music when closing menu
  menuFlag = false;
}
