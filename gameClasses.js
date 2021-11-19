"use strict";

//Text class for showing text on top of the canvas (score, lives)
class c_Text {
  constructor(x, y, text, size) {
    this.x = x;
    this.y = y;
    this.text = text;
    this.size = size;
  }
  show() {                                                    //Display the text on canvas with the specified properties/attributes
    stroke(1);
    strokeWeight(2);
    fill(50);
    textSize(this.size);                                      //Font Sizing, as some text might need a smaller/bigger font than others
    text(this.text, this.x, this.y);
  }
}

//Powerup status class for showing the text under fuzzball lives left
class c_PowerupText {
  constructor(x, y, text, size) {
    this.x = x;
    this.y = y;
    this.text = text;
    this.size = size;
  }
  show() {                                                    //Display the text on canvas with the specified properties/attributes
    stroke(1);
    strokeWeight(1);
    fill(40);
    textSize(this.size);                                      //Font Sizing, as some text might need a smaller/bigger font than others
    text(this.text, this.x, this.y);
  }
}

//Text class that will injects HTML code in the specified container to announce the score going up
class c_AnnounceScoreText {
  constructor(text, size) {
    this.scoreContainerElement = document.getElementById('game-score-container'); //jQuery could have been used but JS was simple enough for just finding the specified element
    this.text = text;
    this.size = size;
  }
  show() {                                                     //Display the text as a popup on the screen with the score added then it fades out after a fixed amount of time
    this.h4 = document.createElement('h4');                    //Setting up the HTML to inject into the container specified before
    this.h4.className = 'game-score-announcement';
    this.scoreContainerElement.appendChild(this.h4);
    this.h4.style = 'font-size:' + this.size + 'px;animation:game-score-announce-anim;animation-direction:reverse;animation-duration:0.' + Math.floor(Math.random() * (9 - 5 + 1) + 5) + 's;display:block;'; //CSS Styling to inline, could have just put it as a class but wanted the choice of being able to change font size.
    this.h4.innerText = '+' + this.text;                       //The plain text will contain the following "+ SCORE_NUMBER"
  }
}

//Ground class to create a rectangular block that acts like a floor in the game engine
class c_Ground {
  constructor(x, y, width, height, options) {
    this.options = options;
    this.body = Matter.Bodies.rectangle(x, y, width, height, options); //Matterjs rectangle body creation
    Matter.World.add(world, this.body);                                //Add the object to the engine
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
  }
  body() {
    return this.body;                      //Return the created body
  }
}

//Inherited values from the ground class with extra function for static crate generation and dynamic crates
class c_Crate extends c_Ground {
  constructor(x, y, width, height, img, options) {
    super(x, y, width, height, options)
    this.enabledflag = true;
    this.img = img;
  }
  remove() {
    Matter.World.remove(world, this.body); //Removes the crate from the engine
    this.enabledflag = false;              //Hides the object from being shown in the show() function
  }
  makeStatic() {
    this.body.isStatic = true;             //Sets the crate to be static in the game engine & setting mass and inertia to infinity
  }
  show() {
    const pos = this.body.position;        //Gets the current position and angle of the crate from the engine and use it for when drawing it on the canvas
    const angle = this.body.angle;
    if (this.enabledflag == false) {       //If true it shows the crate along with the properties/attributes applied to it, and if not true trigger the else statement
    }
    else {
      push();
      translate(pos.x, pos.y);
      rotate(angle);
      noStroke();
      fill('white');
      image(this.img, -this.width / 2, -this.height / 2, this.width, this.height);
      pop();
    }
  }
}

//Fuzzball class to create a circle with an overlay of the fuzzball
class c_Fuzzball {
  constructor(x, y, diameter, fuzzBallImg, superFuzzImg) {
    let options = {                        //Physics attributes of the object
      friction: 0.35,
      frictionAir: 0.01,
      density: 0.85,
      restitution: 1,
    }
    let radius = diameter / 2
    this.body = Matter.Bodies.circle(x, y, radius, options); //Matterjs circular body creation
    Matter.World.add(world, this.body);                            //Add the object to the engine
    this.x = x;
    this.y = y;
    this.diameter = diameter;
    this.fuzzBallImg = fuzzBallImg;
    this.currentImg = this.fuzzBallImg;
    this.superFuzzImg = superFuzzImg;
  }
  body() {
    return this.body;                      //Return the created body
  }
  show() {
    const pos = this.body.position;        //Gets the current position and angle of the crate from the engine and use it for when drawing it on the canvas
    const angle = this.body.angle;
    push();
    translate(pos.x, pos.y);
    rotate(angle);
    image(this.currentImg, -35, -35, this.width + 45, this.height + 45);
    pop();
  }
  superFuzz() {                            //Updates the properties of the fuzzball to have better stats to make it easier for the player to hit some crates
    this.body.friction = 0.15;
    this.body.frictionAir = 0.0055;
    this.body.density = 0.65;
    this.body.restitution = 1;
    this.currentImg = this.superFuzzImg;   //Update the image overlay for the fuzzball with the superfuzz one (red fuzzball)
  }
}

//Launcher class to hold the fuzzball until it has been launched by dragging the mouse
class c_Launcher {
  constructor(x, y, body) {
    let options = {                        //Make use of the matterjs' constraint class to hold the fuzzball
      pointA: {
        x: x,
        y: y
      },
      bodyB: body,                         //Attachment of the launcher and the fuzzball
      length: 75,                          //Physics value of the constraint 
      stiffness: 0.05,                     //Physics value of the constraint
      damping: 0.1                         //Physics value of the constraint
    }
    this.launch = Matter.Constraint.create(options); //Creates the constraint with the selected properties/attributes
    Matter.World.add(world, this.launch);            //Adds the constraint to the engine
  }
  releaseFuzzBall() {
    this.launch.bodyB = null;              //Releases the fuzzball that was held by the constraint by removing it from the constraint
  }
}

//Trail class to create a trail or use it for fuzzball movement prediction by using projectile motion
//DISABLED due to performance issues when trying to make a trail on certain browsers/machines
class c_Trail {
	constructor(x, y, width, height) {
		this.body = Matter.Bodies.rectangle(x, y, width, height); //Matterjs rectangle body creation
		Matter.World.add(world, this.body);                       //Add the object to the engine
    this.enabledflag = true;
		this.x = x;                                               //Store the trajectory of the fuzzball for X,Y 
		this.y = y;
		this.width = width;
		this.height = height;
	}
  remove() {
    Matter.World.remove(world, this.body);                    //Removes the crate from the engine
    this.enabledflag = false;                                 //Hides the object from being shown in the show() function
  }
	body() {
		return this.body; //Return the created body
	}
	show() {
    let pos = this.body.position;                             //Gets the current/future position of the crate from the engine
    if (this.enabledflag == false) {                          //If true it shows the crate along with the properties/attributes applied to it, and if not true trigger the else statement
    }
    else {
      rectMode(CENTER);                                       //Attribute for the rectangle drawing to be in the centre rather than left, right, top or bottom
      fill('white');
      rect(pos.x, pos.y, this.width, this.height);            //Draw the rectangle where the present/future fuzzball are when moving.
    }
	}
}
