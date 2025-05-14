const ctx = myCanvas.getContext('2d');
const FPS = 40;
const jump_amount = -10;
const max_fall_speed = +10;
const acceleration = 1;
const pipe_speed = -2;
let game_mode = 'prestart';
let time_game_last_running;
let bottom_bar_offset = 0;
let pipes = [];

// Load sounds
const flapSound = document.getElementById("flapSound");
const hitSound = document.getElementById("hitSound");

function MySprite(img_url) {
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
MySprite.prototype.Do_Frame_Things = function () {
  ctx.save();
  ctx.translate(this.x + this.MyImg.width / 2, this.y + this.MyImg.height / 2);
  ctx.rotate((this.angle * Math.PI) / 180);
  if (this.flipV) ctx.scale(1, -1);
  if (this.flipH) ctx.scale(-1, 1);
  if (this.visible)
    ctx.drawImage(this.MyImg, -this.MyImg.width / 2, -this.MyImg.height / 2);
  this.x += this.velocity_x;
  this.y += this.velocity_y;
  ctx.restore();
};

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
      break;
    case 'running':
      bird.velocity_y = jump_amount;
      flapSound.play();
      break;
    case 'over':
      if (new Date() - time_game_last_running > 1000) {
        reset_game();
        game_mode = 'running';
      }
      break;
  }
  e.preventDefault();
}

addEventListener('touchstart', Got_Player_Input);
addEventListener('mousedown', Got_Player_Input);
addEventListener('keydown', Got_Player_Input);

function make_bird_slow_and_fall() {
  if (bird.velocity_y < max_fall_speed) {
    bird.velocity_y += acceleration;
  }
  if (bird.y > myCanvas.height - bird.MyImg.height || bird.y < -bird.MyImg.height) {
    bird.velocity_y = 0;
    if (game_mode !== 'over') hitSound.play();
    game_mode = 'over';
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
      if (game_mode !== 'over') hitSound.play();
      game_mode = 'over';
    }
  }
}

function display_intro_instructions() {
  ctx.font = '25px Arial';
  ctx.fillStyle = 'red';
  ctx.textAlign = 'center';
  ctx.fillText('Press, touch or click to start', myCanvas.width / 2, myCanvas.height / 4);
}

function display_game_over() {
  let score = 0;
  pipes.forEach(pipe => { if (pipe.x < bird.x) score += 0.5; });
  ctx.font = '30px Arial';
  ctx.fillStyle = 'red';
  ctx.textAlign = 'center';
  ctx.fillText('Game Over', myCanvas.width / 2, 100);
  ctx.fillText('Score: ' + score, myCanvas.width / 2, 150);
  ctx.font = '20px Arial';
  ctx.fillText('Click, touch, or press to play again', myCanvas.width / 2, 300);
}

function display_bar_running_along_bottom() {
  if (bottom_bar_offset < -23) bottom_bar_offset = 0;
  ctx.drawImage(bottom_bar, bottom_bar_offset, myCanvas.height - bottom_bar.height);
}

function reset_game() {
  bird.y = myCanvas.height / 2;
  bird.angle = 0;
  pipes = [];
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

const pipe_piece = new Image();
pipe_piece.onload = add_all_my_pipes;
pipe_piece.src = 'http://s2js.com/img/etc/flappypipe.png';

const bottom_bar = new Image();
bottom_bar.src = 'http://s2js.com/img/etc/flappybottom.png';

const bird = new MySprite('http://s2js.com/img/etc/flappybird.png');
bird.x = myCanvas.width / 3;
bird.y = myCanvas.height / 2;

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
      break;
    case 'over':
      make_bird_slow_and_fall();
      display_game_over();
      break;
  }
}

setInterval(Do_a_Frame, 1000 / FPS);
