// Game Constants
const FPS = 40;
const jump_amount = -10;
const max_fall_speed = +10;
const acceleration = 1;
const pipe_speed = -2;

// Game Variables
let game_mode = 'prestart';
let time_game_last_running;
let bottom_bar_offset = 0;
let pipes = [];
let score = 0;
let highScore = 0;
let lastPipePassed = null;

// DOM Elements
const myCanvas = document.getElementById('myCanvas');
const ctx = myCanvas.getContext('2d');

// Sound Elements
const flapSound = document.getElementById("flapSound");
const hitSound = document.getElementById("hitSound");
const gameOverSound = document.getElementById("gameOverSound");
const backgroundMusic = document.getElementById("backgroundMusic");
const scoreSound = document.getElementById("scoreSound");

// Sprite Class
class MySprite {
  constructor(img_url) {
    this.x = 0;
    this.y = 0;
    this.visible = true;
    this.velocity_x = 0;
    this.velocity_y = 0;
    this.MyImg = new Image();
    this.MyImg.src = img_url || '';
    this.angle = 0;
    this.flipV = false;
    this.flipH = false;
  }

  Do_Frame_Things() {
    ctx.save();
    ctx.translate(this.x + this.MyImg.width / 2, this.y + this.MyImg.height / 2);
    ctx.rotate((this.angle * Math.PI) / 180);
    if (this.flipV) ctx.scale(1, -1);
    if (this.flipH) ctx.scale(-1, 1);
    if (this.visible) {
      ctx.drawImage(this.MyImg, -this.MyImg.width / 2, -this.MyImg.height / 2);
    }
    this.x += this.velocity_x;
    this.y += this.velocity_y;
    ctx.restore();
  }
}

// Game Assets
const pipe_piece = new Image();
pipe_piece.src = 'http://s2js.com/img/etc/flappypipe.png';

const bottom_bar = new Image();
bottom_bar.src = 'http://s2js.com/img/etc/flappybottom.png';

const bird = new MySprite('http://s2js.com/img/etc/flappybird.png');
bird.x = myCanvas.width / 3;
bird.y = myCanvas.height / 2;

// Initialize Game
pipe_piece.onload = add_all_my_pipes;

// Game Functions
function ImagesTouching(a, b) {
  if (!a.visible || !b.visible) return false;
  return !(
    a.x >= b.x + b.MyImg.width ||
    a.x + a.MyImg.width <= b.x ||
    a.y >= b.y + b.MyImg.height ||
    a.y + a.MyImg.height <= b.y
  );
}

function Got_Player_Input(e) {
  switch (game_mode) {
    case 'prestart':
      game_mode = 'running';
      backgroundMusic.play();
      break;
    case 'running':
      bird.velocity_y = jump_amount;
      flapSound.currentTime = 0;
      flapSound.play();
      break;
    case 'over':
      if (new Date() - time_game_last_running > 1000) {
        reset_game();
        game_mode = 'running';
        backgroundMusic.currentTime = 0;
        backgroundMusic.play();
      }
      break;
  }
  e.preventDefault();
}

function vibrateDevice() {
  if ("vibrate" in navigator) {
    navigator.vibrate(200);
  }
}

function make_bird_slow_and_fall() {
  if (bird.velocity_y < max_fall_speed) {
    bird.velocity_y += acceleration;
  }
  if (bird.y > myCanvas.height - bird.MyImg.height || bird.y < -bird.MyImg.height) {
    bird.velocity_y = 0;
    if (game_mode !== 'over') {
      hitSound.play();
      vibrateDevice();
      setTimeout(() => {
        gameOverSound.play();
      }, 300);
    }
    game_mode = 'over';
    backgroundMusic.pause();
  }
}

function add_pipe(x, gapY, gapSize) {
  const top = new MySprite();
  top.MyImg = pipe_piece;
  top.x = x;
  top.y = gapY - pipe_piece.height;
  top.velocity_x = pipe_speed;
  pipes.push(top);

  const bottom = new MySprite();
  bottom.MyImg = pipe_piece;
  bottom.flipV = true;
  bottom.x = x;
  bottom.y = gapY + gapSize;
  bottom.velocity_x = pipe_speed;
  pipes.push(bottom);
}

function make_bird_tilt_appropriately() {
  if (bird.velocity_y < 0) bird.angle = -15;
  else if (bird.angle < 70) bird.angle += 4;
}

function show_the_pipes() {
  pipes.forEach(pipe => pipe.Do_Frame_Things());
}

function check_for_end_game() {
  for (const pipe of pipes) {
    if (ImagesTouching(bird, pipe)) {
      if (game_mode !== 'over') {
        hitSound.play();
        vibrateDevice();
        setTimeout(() => {
          gameOverSound.play();
        }, 300);
        backgroundMusic.pause();
      }
      game_mode = 'over';
    }
  }
}

function check_score() {
  pipes.forEach(pipe => {
    if (pipe.x + pipe.MyImg.width < bird.x && pipe !== lastPipePassed) {
      score += 0.5;
      lastPipePassed = pipe;
      scoreSound.currentTime = 0;
      scoreSound.play();
    }
  });
}

function display_intro_instructions() {
  ctx.font = '25px Pacifico';
  ctx.fillStyle = 'white';
  ctx.strokeStyle = 'black';
  ctx.lineWidth = 2;
  ctx.textAlign = 'center';
  ctx.strokeText('Tap to start!', myCanvas.width / 2, myCanvas.height / 4);
  ctx.fillText('Tap to start!', myCanvas.width / 2, myCanvas.height / 4);
}

function display_game_over() {
  highScore = Math.max(score, highScore);
  ctx.font = '30px Pacifico';
  ctx.fillStyle = 'white';
  ctx.strokeStyle = 'black';
  ctx.lineWidth = 2;
  ctx.textAlign = 'center';
  
  ctx.strokeText('Game Over!', myCanvas.width / 2, 100);
  ctx.fillText('Game Over!', myCanvas.width / 2, 100);
  
  ctx.strokeText(`Score: ${Math.floor(score)}`, myCanvas.width / 2, 150);
  ctx.fillText(`Score: ${Math.floor(score)}`, myCanvas.width / 2, 150);
  
  ctx.strokeText(`High Score: ${Math.floor(highScore)}`, myCanvas.width / 2, 200);
  ctx.fillText(`High Score: ${Math.floor(highScore)}`, myCanvas.width / 2, 200);
  
  ctx.font = '20px Pacifico';
  ctx.strokeText('Tap to play again', myCanvas.width / 2, 300);
  ctx.fillText('Tap to play again', myCanvas.width / 2, 300);
}

function display_bar_running_along_bottom() {
  if (bottom_bar_offset < -23) bottom_bar_offset = 0;
  ctx.drawImage(bottom_bar, bottom_bar_offset, myCanvas.height - bottom_bar.height);
}

function reset_game() {
  bird.y = myCanvas.height / 2;
  bird.angle = 0;
  pipes = [];
  score = 0;
  lastPipePassed = null;
  add_all_my_pipes();
}

function add_all_my_pipes() {
  const positions = [
    [500, 100], [800, 50], [1000, 250], [1200, 150],
    [1600, 100], [1800, 150], [2000, 200], [2200, 250],
    [2400, 30], [2700, 300], [3000, 100], [3300, 250], [3600, 50]
  ];
  for (const [x, y] of positions) add_pipe(x, y, 140);
  const finish_line = new MySprite('http://s2js.com/img/etc/flappyend.png');
  finish_line.x = 3900;
  finish_line.velocity_x = pipe_speed;
  pipes.push(finish_line);
}

function Do_a_Frame() {
  ctx.clearRect(0, 0, myCanvas.width, myCanvas.height);
  bird.Do_Frame_Things();
  display_bar_running_along_bottom();

  switch (game_mode) {
    case 'prestart':
      display_intro_instructions();
      break;
    case 'running':
      time_game_last_running = new Date();
      bottom_bar_offset += pipe_speed;
      show_the_pipes();
      make_bird_tilt_appropriately();
      make_bird_slow_and_fall();
      check_for_end_game();
      check_score();
      break;
    case 'over':
      make_bird_slow_and_fall();
      display_game_over();
      break;
  }
}

// Event Listeners
document.addEventListener('dblclick', function(e) {
  e.preventDefault();
}, { passive: false });

addEventListener('touchstart', Got_Player_Input, { passive: false });
addEventListener('mousedown', Got_Player_Input);
addEventListener('keydown', Got_Player_Input);

// Start Game Loop
setInterval(Do_a_Frame, 1000 / FPS);