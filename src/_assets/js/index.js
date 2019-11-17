var config = {
  type: Phaser.AUTO,
  width: 480,
  height: 480,
  parent: 'apps',
  physics: {
      default: 'arcade',
      arcade: {
          gravity: { y: 500 },
          debug: true
      }
  },
  scene: {
      preload: preload,
      create: create,
      update: update
  }
};

let player;
const PLAYER_WIDTH = 28;
var platforms;
var cursors;
var gameOver = false;
var blocks;

var game = new Phaser.Game(config);
window.game = game;
function preload ()
{

  this.load.spritesheet('sprite', '_assets/images/splite-test.png', { frameWidth: 32, frameHeight: 32 });
  this.load.tilemapTiledJSON('map', '_assets/js/gameMap.json');
}


function create ()
{

  function getBlockPosition(pos){
    return pos*32 + 16;
  }

  const map = this.make.tilemap({ key: 'map' })
  const tileset = map.addTilesetImage('splite-test','sprite')
  const layer = map.createStaticLayer('Tile Layer 1', tileset, 0, 0);
  // layer
  layer.setCollisionBetween(16,18,true,'bloques');
  layer.setScale(1);


  blocks = this.physics.add.group();
  blocks.defaults.setAllowGravity = false;
  blocks.defaults.setAllowRotation = false;
  blocks.defaults.setImmovable = true;

  blocks.create(getBlockPosition(4), getBlockPosition(9), 'sprite', 17);
  for(var i = 0 ; i < blocks.children.entries.length ; i++ )
  {
    blocks.children.entries[i].isBreaking = false;
    blocks.children.entries[i].breakState = 0;
  }

  this.anims.create({
    key: 'blockbreak1',
    frames: this.anims.generateFrameNumbers('sprite', { start: 17, end: 19 }),
    frameRate: 10
  });

  this.input.keyboard.on('keydown_A', function(){
    if(player.makingBlock === false){
      player.makingBlock = true;
      var position = makeBlockPosition(player);
      createBlock(position.mapX, position.mapY)
      setTimeout(function(){
        player.makingBlock = false;
      },200)
    }
  });

  this.input.keyboard.on('keydown_B', function(){
    cursors.up.isDown = true;
  });
  this.input.keyboard.on('keyup_B', function(){
    cursors.up.isDown = false;
  });

  function createBlock(mapX, mapY){
    var obj = checkSamePosition(mapX, mapY)
    var is_tiemap = isTilemapCllition(mapX, mapY, layer)
    if(is_tiemap) return;
    if( obj === true ){
      console.log('createBlock');
      blocks.create(getBlockPosition(mapX), getBlockPosition(mapY), 'sprite', 17);
      var i = blocks.children.entries.length - 1;
      blocks.children.entries[i].isBreaking = false;
      blocks.children.entries[i].breakState = 0;
    }else{
      obj.destroy();
    }
  }
  function positionFitMaps(posX, posY,player){
    var x = (player.goesRight)?
              Math.ceil((posX - 16)/32) :
              Math.floor((posX - 16)/32) ;
    var y = Math.ceil((posY - 16)/32);
    return{
      mapX: x,
      mapY: y
    }
  }

  function makeBlockPosition(player){
    var x = player.x + ((player.goesRight)? PLAYER_WIDTH : - PLAYER_WIDTH) ;
    var y = player.y;
    var position = positionFitMaps(x, y, player)
    return position;
  }

  function checkSamePosition(mapX, mapY){
    var x = getBlockPosition(mapX);
    var y = getBlockPosition(mapY)
    for(var i = 0 ; i < blocks.children.entries.length ; i++ )
    {
      if(blocks.children.entries[i].x === x && blocks.children.entries[i].y === y){
        return blocks.children.entries[i]
      }
    }
    return true;
  }

  function isTilemapCllition(mapX, mapY, layer){
    var line = layer.layer.data;
    for(var i = 0 ; i < line.length ; i++ ){
      var mapBlock = line[i];
      for(var j = 0 ; j < mapBlock.length ; j++ ){
        if(mapBlock[j].x === mapX && mapBlock[j].y === mapY){
          if(mapBlock[j].index === 17){
            return true;
          }
        }
      }
    }
    return false;
  }


  // The player and its settings
  player = this.physics.add.sprite(100, 280, 'sprite');

  player.setBounce(0);
  player.setCollideWorldBounds(true);
  player.body.setSize(PLAYER_WIDTH,32);

  // player = window.player;
  player.goesRight = true;
  player.turning = false;
  player.makingBlock = false;

  //  Our player animations, turning, walking left and walking right.
  this.anims.create({
      key: 'walkLeft',
      frames: this.anims.generateFrameNumbers('sprite', { start: 80, end: 81 }),
      frameRate: 10,
      repeat: -1
  });

  this.anims.create({
      key: 'turn',
      frames: [ { key: 'sprite', frame: 86 } ],
      frameRate: 20
  });

  player.anims.play('turn', true);

  this.anims.create({
      key: 'walkRight',
      frames: this.anims.generateFrameNumbers('sprite', { start: 82, end: 83 }),
      frameRate: 10,
      repeat: -1
  });
  cursors = this.input.keyboard.createCursorKeys();
  this.physics.add.collider(player, layer);
  this.physics.add.collider(blocks, layer);
  this.physics.add.collider(blocks, player, hitBlocks, null, this);

  window.addEventListener('resize',resize);
  window.addEventListener('load',resize)

  function resize(){
    const wrap = document.getElementById('apps');
    const wrapH = wrap.clientHeight;

    wrap.setAttribute('style', 'width: ' + wrapH + 'px;')
    this.console.dir(wrapH)
  }


  const buttonUp = document.getElementById('up')
  const buttonRight = document.getElementById('right')
  const buttonLeft = document.getElementById('left')
  const buttonDown = document.getElementById('down')

  const buttonA = document.getElementById('buttonA')
  const buttonB = document.getElementById('buttonB')

  addTouchMouseButtonEvent(buttonUp,'up')
  addTouchMouseButtonEvent(buttonRight,'right')
  addTouchMouseButtonEvent(buttonLeft,'left')
  addTouchMouseButtonEvent(buttonDown,'down')
  addTouchMouseButtonEvent(buttonB,'up')

  let buttonAflag = false;
  buttonA.addEventListener('touchstart',function(){
    buttonAflag = true;
    if(player.makingBlock === false){
      player.makingBlock = true;
      var position = makeBlockPosition(player);
      createBlock(position.mapX, position.mapY)
      setTimeout(function(){
        player.makingBlock = false;
      },200)
    }
  })

  buttonA.addEventListener('click',function(){
    if(buttonAflag === true){
      buttonAflag = false;
      return;
    }
    if(player.makingBlock === false){
      player.makingBlock = true;
      var position = makeBlockPosition(player);
      createBlock(position.mapX, position.mapY)
      setTimeout(function(){
        player.makingBlock = false;
      },200)
    }
  })


  function addTouchMouseButtonEvent(target,cuesorType){

    target.addEventListener('touchstart',function(){
      cursors[cuesorType].isDown = true;
    })
    target.addEventListener('mousedown',function(){
      cursors[cuesorType].isDown = true;
    })

    target.addEventListener('touchend',function(){
      cursors[cuesorType].isDown = false;
    })
    target.addEventListener('mouseup',function(){
      cursors[cuesorType].isDown = false;
    })

    target.addEventListener('touchcancel',function(){
      cursors[cuesorType].isDown = false;
    })

  }
}

function update ()
{

  if (gameOver) return;

  if (player.body.enable) {
    player.setVelocityX(0);
    if (cursors.left.isDown) {

      if( player.goesRight === true){
        player.turning = true;
        setTimeout(function(){
          player.setFrame(81);
          player.turning = false
        },100);

      }
      player.goesRight = false;

      if(player.turning !== true){
        player.setVelocityX(-90);
        player.anims.play('walkLeft', true);
      }

    } else if (cursors.right.isDown) {
      if( player.goesRight === false){
        player.turning = true;
        setTimeout(function(){
          player.setFrame(83);
          player.turning = false
        },100);

      }

      player.goesRight = true;

      if(player.turning !== true){
        player.body.setVelocityX(90);
        player.anims.play('walkRight', true);
      }

    } else {
      player.anims.stop();
      if (player.goesRight) player.setFrame(83);
      else player.setFrame(81);
    }

    if (cursors.up.isDown && (player.body.onFloor() || player.body.touching.down)) {
      player.body.setVelocityY(-190);
      player.anims.stop();
    }

    if (player.body.velocity.y != 0) {
      if (player.goesRight) player.setFrame(131);
      else player.setFrame(129);
    }
  }
}

function hitBlocks(player, block)
{
  if(block.body.touching.down){
    if(block.isBreaking !== true){
      block.isBreaking = true;
      if(block.breakState === 0){
        block.anims.play('blockbreak1', true);
        block.breakState = 1;
        console.log('blockBreak1')
      }else{
        console.log('blockBreak2')
        block.destroy();
      }

      setTimeout(function(){
        block.isBreaking = false;
      },500)
    }
  }
}



