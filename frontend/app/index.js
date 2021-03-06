let img;
let button;
let sounds; // sounds

let myFont; //The font we'll use throughout the app

let gameOver = false; //If it's true the game will render the main menu
let gameBeginning = false; //Should be true only before the user starts the game for the first time

let counter = 0;
let soundEnabled = true;
let canMute = true;
let sndMusic;

let touchCurrentX = 0;
let touchStartX = 0;
let usingKeyboard = false;


//===Buttons
let playButton;
let soundButton;


//Declare game objects here like player, enemies etc
let player;
let enemy;

let explode = null;

let enemyWeapons = [];
let weapons = [];

let width;
let height;

let score = 0;
let highScore = 0;
let totalLives = 10;

//===images
//let imgLife;
let imgBackground;
let imgExplosion;
let imgFloor;
let imgFish = [];
let imgWeapon;
let imgWeapon2;

let soundImage;
let muteImage;

let weaponImgs = [];
let ufoImgs = [];

let currentUfoIndex = 0;
let currentRocketIndex = 0;

let allUfos = [];

//===Size stuff
let objSize; //base size modifier of all objects, calculated based on screen size

let gameSize = 22;
let gameWidth;

//Coordinates of left and right sides of the game view
let leftX, rightX;

let isMobile = false;
let touching = false; //Whether the user is currently touching/clicking

let playerY;
let gravity = 0.1;

let gameSpeed = 5;
let ufoDirection = 1;

let rocketSelection = 0;
let rocketCreated =  false;

let currentRocket = null;
let gameStarted = false;

let ufoMode = 0;

//Configurable: number of UFOs, Rockets and Colors
let rocketSpeeds = [12, 15, 18];
let colors = ["black", "blue", "orange"];
let ufoYPositions = [50, 100, 150];

let yPosIndex = 0;

//Variable : to track if user has not launched any rocket toward the UFO  
let ufoPassedCount = 0;
let maxUfoPassCount = 10;

//Variable : total UFO and rockets configuration
let totalUfoTypes = 3;

function preload() {

    //    //===Load Sounds
    if (Koji.config.sounds.backgroundMusic) sndMusic = loadSound(Koji.config.sounds.backgroundMusic);

    //===Load font from google fonts link provided in game settings
    var link = document.createElement('link');
    link.href = Koji.config.strings.fontFamily;
    link.rel = 'stylesheet';
    document.head.appendChild(link);
    myFont = getFontFamily(Koji.config.strings.fontFamily);
    let newStr = myFont.replace("+", " ");
    myFont = newStr;
    //===

}

function setup() {

    width = window.innerWidth;
    height = window.innerHeight;

    let sizeModifier = 0.85;
    if (height > width) {
        sizeModifier = 1;
    }

    //Canvas :  make a full screen canvas
    createCanvas(width, height);

    //Magically determine basic object size depending on size of the screen
   objSize = floor(min(floor(width / gameSize), floor(height / gameSize)) * sizeModifier);

   isMobile = detectMobile();

    //===Get high score data from local storage
    if (localStorage.getItem("highscore")) {
        highScore = localStorage.getItem("highscore");
    }

    loadImages();
    initialize();

   //Image : img = loadImage(Koji.config.images.enemy); // Load the image
    imgBackground = loadImage(Koji.config.images.background);
}


function loadImages(){
    //===Images : Load images for Weapons/rockets
    weaponImgs.push(loadImage(Koji.config.images.weapon));
    weaponImgs.push(loadImage(Koji.config.images.weapon2));
    weaponImgs.push(loadImage(Koji.config.images.weapon3));
    
    //===Images : Load images for UFOs
    ufoImgs.push(loadImage(Koji.config.images.fish1));
    ufoImgs.push(loadImage(Koji.config.images.fish2));    
    ufoImgs.push(loadImage(Koji.config.images.fish3));    

    //===Images : Load image for explosion
    imgExplosion = loadImage(Koji.config.images.explode);

    //Images: Load images for sound
    soundImage = loadImage(Koji.config.images.soundImage);
    muteImage = loadImage(Koji.config.images.muteImage);

}

function initialize(){
    //Initialize the play button for the first time 
    playButton = new PlayButton();
    soundButton = new SoundButton();
    explode = new Collision();
   // playMusic();

}

function createUfo(cnt){

    //Added conditions to create UFO
    //Added limit to 2 : only 2 UFO will fly at a time for now
    
    if(allUfos.length < totalUfoTypes){
        let rand = Math.floor(Math.random() * totalUfoTypes);
        let x;
        let y;
        let dir;

        x = (rand > 1 ? 1 : rand) * (width - 10);
        dir = rand;        
        y = ufoYPositions[dir];
        
        let newUfo = new Ufo(x , y);
        newUfo.img =  ufoImgs[dir];
        newUfo.direction = dir;
        newUfo.color = colors[dir];
        newUfo.render();
        allUfos.push(newUfo);
        ufoPassedCount++;
    }
    else{
        //If 2 UFOs already flying
        let ufoLength = allUfos.length;
        let latestUfo = [];
        for(let j = 0 ; j < ufoLength; j++){
            if(allUfos[j].removable == true){
                currentUfoIndex--;
            }
            else{
                allUfos[j].update();
                allUfos[j].render();
                latestUfo.push(allUfos[j]);
            }
        }
        allUfos = latestUfo;
    }
}

function createRocket(){
    //Create new rocket and initialize to its base position
    currentRocket = new Rocket(width/ 2, height - 85);
    rocketInitialization();
}

function rocketInitialization(){
    //Update the rocket image/type/speed and render it
    currentRocket.img =  weaponImgs[currentRocketIndex];
    currentRocket.type = currentRocketIndex;
    currentRocket.color = colors[currentRocketIndex];
    currentRocket.speed = rocketSpeeds[currentRocketIndex];
    currentRocket.render();
}

function createExplode(x, y, scoreToAdd){
    //Create explosion object when there is a collision and make it visible for some time
    explode = new Collision(x, y);
    explode.img =  imgExplosion;
    explode.render();
    ufoPassedCount = 0;
    score += scoreToAdd;

    setTimeout(function(){
        explode.update();
        explode = null;
    },1000);
}


function handleCurrentRocketIndex(){
        currentRocketIndex++;
        if(currentRocketIndex == totalUfoTypes){
            currentRocketIndex = 0;
        }
        rocketInitialization();
}

//===Handle input
function touchStarted() {

    if (soundButton && soundButton.checkClick()) {
        toggleSound();
        return;
    }

    //if (gameOver && gameBeginning) {
        //Ingame
        touching = true;
        touchStartX = mouseX;
        touchCurrentX = mouseX;
    //}//

    usingKeyboard = false;
}

function touchEnded() {
    touching = false;
}

function keyReleased() {
    //Left and right arrow : to change the rocket type
    if (keyCode == LEFT_ARROW) {
    }

    if (keyCode == RIGHT_ARROW) {
    }

    //UP : to launch the rocket
    if (keyCode == UP_ARROW) {
        currentRocket.launched = true;
    }
}

function init() {
    //Reset all the values to initial state
    gameOver = false;

    score = 0;
    totalLives = 10;
    ufoPassedCount = 0;
    counter = 0;
    gameSpeed = 5;

    gameStarted = true;
    gameBeginning = true;
}

function isCollision(){
    //Usin y position codition with half of height : because it will increase the performance by not checking the rocket with UFO for every y position
    //As we already know that the UFos are flying max at around 175 
    if(currentRocket && currentRocket.pos.y < (height - 2)){
        let ufoCount = allUfos.length;
        for(let i= 0 ; i < ufoCount; i++){
            let min = (width / 2) - 25;
            let max = (width / 2) + 25;

            let minY = allUfos[i].pos.y ;
            let maxY = allUfos[i].pos.y + 35;
            
            //Checking if x position is near by
            if(allUfos[i].pos.x > min && allUfos[i].pos.x < max ){
                
                //Checking if y position is near by
                if(currentRocket.pos.y > minY && currentRocket.pos.y < maxY){
                    let scoreToAdd = 1;
                    //Condition to check if UFO and rocket are of same color to give more score
                    if(currentRocket.color == allUfos[i].color){
                        scoreToAdd = 5;
                    }
                    currentRocket.removable = true;
                    allUfos[i].removable = true;
                    createExplode(currentRocket.pos.x, currentRocket.pos.y, scoreToAdd);
                    return true;

                }
            }
        }
    }
    return false;
} 


function draw() {
    // set the background color from the configuration options
    //  background(Koji.config.colors.backgroundColor);
    if (imgBackground) {
        background(imgBackground);
    } else {
        background(Koji.config.colors.backgroundColor);
    }
  
    counter++;

    //For the first time
    if(!gameBeginning){
         textSize(30);
        fill(Koji.config.colors.textColor);
        textAlign(CENTER);

        // print out our text
        text(Koji.config.strings.content, window.innerWidth / 2, 100);


         // format our text
        textSize(15);
        fill(Koji.config.colors.textColor);
        textAlign(CENTER);

        // print out our text
        text(Koji.config.strings.gameTagLine, window.innerWidth / 2, 125);


        // format our text
        textSize(20);
        fill(Koji.config.colors.textColor);
        textAlign(CENTER);

        // print out our text
        if(highScore){
            text(Koji.config.strings.highScoreLabel + ": " + highScore, width / 2, height  - 30);        
        }

        // format our text
        textSize(16);
        fill(Koji.config.colors.playButtonHoverColor);
        textAlign(CENTER);

        // print out our text
        text(Koji.config.strings.instr1, window.innerWidth / 2, height / 2 - 140);

                // format our text
        textSize(16);
        fill(Koji.config.colors.playButtonHoverColor);
        textAlign(CENTER);

        // print out our text
        text(Koji.config.strings.instr2, window.innerWidth / 2, height / 2 - 100);

                // format our text
        textSize(16);
        fill(Koji.config.colors.playButtonHoverColor);
        textAlign(CENTER);

        // print out our text
        text(Koji.config.strings.instr3, window.innerWidth / 2, height / 2 - 60);

        textSize(16);
        fill(Koji.config.colors.playButtonHoverColor);
        textAlign(CENTER);

        // print out our text
        text(Koji.config.strings.instr4, window.innerWidth / 2, height / 2 - 20);

        textSize(16);
        fill(Koji.config.colors.playButtonHoverColor);
        textAlign(CENTER);

        // print out our text
        text(Koji.config.strings.instr5, window.innerWidth / 2, height / 2 + 15);

        textSize(16);
        fill(Koji.config.colors.playButtonHoverColor);
        textAlign(CENTER);

        // print out our text
        text(Koji.config.strings.instr6, window.innerWidth / 2, height / 2 + 50);

        playButton.update();
        playButton.btn.draw();
    }
    else if(!gameStarted){ //If game over

        // if (localStorage.getItem("highscore")) {
        //     highScore = localStorage.getItem("highscore");
        // }
        // format our text
        textSize(30);
        fill(Koji.config.colors.textColor);
        textAlign(CENTER);

        // print out our text
        text(Koji.config.strings.content, window.innerWidth / 2, 100);


         // format our text
        textSize(15);
        fill(Koji.config.colors.textColor);
        textAlign(CENTER);

        // print out our text
        text(Koji.config.strings.gameTagLine, window.innerWidth / 2, 125);

        // format our text
        textSize(30);
        fill(Koji.config.colors.playButtonColor);
        textAlign(CENTER);

        // print out our text
        text(Koji.config.strings.gameOverText, window.innerWidth / 2, height / 2 - 100);

        // format our text
        textSize(18);
        fill(Koji.config.colors.playButtonColor);
        textAlign(CENTER);

        // print out our text
        text(Koji.config.strings.yourScoreLabel +": " + score, window.innerWidth / 2, height / 2 - 70);

        // format our text
        textSize(20);
        fill(Koji.config.colors.textColor);
        textAlign(CENTER);

        // print out our text
        text(Koji.config.strings.highScoreLabel +": "  + highScore, width / 2, height  - 30);

        playButton.update();
        playButton.btn.draw();

    }else{//Game started

        if(score > 50 && score < 100){
            gameSpeed = 6;
        }
        else if(score > 100 && score < 150){
            gameSpeed = 6.5;
        }
        else if(score > 150 && score < 200){
            gameSpeed = 7;
        }
        else if(score > 200 ){
            gameSpeed = 8;
        }
        else{
            gameSpeed = 5;
        }

        //Check if user has not launched any rocket for {count} and reduce the life 
        if(ufoPassedCount == maxUfoPassCount){
            totalLives--;
            if(totalLives < 1){
                if(score > highScore){
                    highScore = score;
                    localStorage.setItem("highscore", score);
                }
                gameStarted = false;
            }
            ufoPassedCount = 0;
        }


        // format our text
        textSize(20);
        fill(Koji.config.colors.textColor);
        textAlign(CENTER);

        // print out our text
        text(Koji.config.strings.scoreLabel +" "  + score, width - 50, height - 15);

        // format our text
        textSize(20);
        fill(Koji.config.colors.textColor);
        textAlign(CENTER);

        // print out our text
        text(Koji.config.strings.livesLabel +" "  + totalLives , 50, height - 15);

        // format our text
        textSize(20);
        fill(Koji.config.colors.textColor);
        textAlign(CENTER);

        // print out our text
        text("UFO's passed : "  + ufoPassedCount, width / 2, height  - 30);

        createUfo(counter);
        if(!currentRocket){
            createRocket();
            handleCurrentRocketIndex();
        }
        else{
            if(currentRocket.removable ==  true){
                currentRocket = null;
            }
            else{
                //Checking if rocket launched
                if(currentRocket.launched){
                    if(!isCollision()){
                        currentRocket.update();
                        currentRocket.render();
                    }             
                }
                else{
                    currentRocket.render();
                }
            }
        }
    }
    //soundButton.render();
}
