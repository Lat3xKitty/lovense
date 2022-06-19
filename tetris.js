const canvas = document.getElementById('canvas-tetris');

/**
 * @type {CanvasRenderingContext2D}
 */
const ctx = canvas.getContext('2d');
const width = canvas.width,
   height = canvas.height;
const columns = 10,
  rows = 20;
const blockWidth = width / columns,
  blockHeight = height / rows;
const board = [];

var current,
  currentX,
  currentY,
  holdShape;

var interval = null,
  intervalRender = null;


var GameOver = false;
var isFrozen = false;
var totalRowsDismissed = 0;



var shapes = [
    [ 1, 1, 1, 1 ],   // Long Boy
    [ 1, 1, 1, 0,     // Left Right angle
      1 ],
    [ 1, 1, 1, 0,     // Right Right angle
      0, 0, 1 ],
    [ 1, 1, 0, 0,     // Square
      1, 1 ],
    [ 1, 1, 0, 0,     // Backwards Z
      0, 1, 1 ],
    [ 0, 1, 1, 0,     // Z
      1, 1 ],
    [ 0, 1, 0, 0,     // T
      1, 1, 1 ]
];

var colours = [
  '#1BD1E0',    // Long Boy
  '#E7B336',    // Left Right angle
  '#33A1EB',    // Right Right angle
  '#E6D430',    // Square
  '#E0475C',    // Backwards Z
  '#3ACE5B',    // Z
  '#A763E8'     // T
];

// ====================================================================
// Events for Keys / Swiping (mobile)

$('body').on('keydown', function(e) {
  var keys = {
    37: 'left',
    38: 'rotate',
    39: 'right',
    40: 'down',
    32: 'drop',
    67: 'hold' //c
  }

  if (keys[e.keyCode]) {
    keyPress(keys[e.keyCode]);
    render();
  }
});

$('#canvas-tetris').on('swiped', function(e) {
  if (e.detail.dir === 'left' || e.detail.dir === 'right') {
    keyPress(e.detail.dir);
  }
  if (e.detail.dir === 'down') {
    keyPress('drop');
  }

  render();
});

if (( 'ontouchstart' in window ) || ( navigator.maxTouchPoints > 0 ) || ( navigator.msMaxTouchPoints > 0 )) {
  $('#canvas-tetris').on('click', function(e) {
    keyPress('rotate');
  });

}

function keyPress( key ) {
  switch ( key ) {
    case 'left':    if (isValid(-1))    { --currentX; } break;
    case 'right':   if (isValid(1))     { ++currentX; } break;
    case 'down':    if (isValid(0, 1) ) { ++currentY; } break;
    case 'rotate':
      var rotated = rotateShape(current);
      if (isValid( 0, 0, rotated) ) {
          current = rotated;
      }
      break;
    case 'drop':
      while(isValid(0, 1) ) {
          ++currentY;
      }
      tick();
      break;

    case 'hold':
      if (holdShape) {
        var temp = current;
        current = holdShape;
        holdShape = temp;
        currentX = 5;
        currentY = 0;
      }

      else {
        holdShape = current;
        newShape();
      }
      break;
}
}


$('#tetris-start').on('click', function() {
  newGame();

  this.disabled = true;
})

// ====================================================================
// Initialize the stuff

/**
 * Setup the board
 */
function init() {
  for (let x = 0; x < columns; x++) {
    board[x] = [];
    for (let y = 0; y < rows; y++) {
      board[x][y] = 0;
    }
  }
}

/**
 * Prepare the full board again for a reet
 */
function newGame() {
  clearAllIntervals();
  intervalRender = setInterval( render, 30 );
  init();
  newShape();
  GameOver = false;
  interval = setInterval( tick, 400 );

  totalRowsDismissed = 0;
  $('#tetris-level').text(
    Math.floor( totalRowsDismissed / 10 ) + 1
  );
}

function clearAllIntervals(){
  clearInterval( interval );
  clearInterval( intervalRender );
}


// ====================================================================
// Drawing

function tick() {
  if (isValid(0, 1)) {
    ++currentY;
  }
  else {
    freeze();
    isValid(0, 1);
    checkClearLines();

    if (GameOver) {
      clearAllIntervals();
      return false;
    }

    newShape();
  }
}

function render() {
  ctx.clearRect(0 , 0, width, height);

  // Render Ghost
  for (var yDrop = 0; yDrop < (rows - currentY); ++yDrop) {
    if (!isValid(0, yDrop)) {
      yDrop = yDrop;
      break;
    }
  }

  yDrop -= 1;


  for (var y = 0; y < 4; ++y) {
    for (var x = 0; x < 4; ++x) {
      if ( current[ x ][ y ] ) {
        ctx.strokeStyle = '#aaa';
        ctx.fillStyle = '#aaa';
        ctx.fillRect(
          blockWidth * (currentX + x),
          blockHeight * (currentY + y + yDrop),
          blockWidth - 1 ,
          blockHeight - 1
        );
        ctx.strokeRect(
          blockWidth * (currentX + x),
          blockHeight * (currentY + y + yDrop),
          blockWidth - 1 ,
          blockHeight - 1
        );
      }
    }
  }


  ctx.strokeStyle  = 'black';
  for (var x = 0; x < columns; ++x) {
    for (var y = 0; y < rows; ++y) {
      if (board[x][y]) {
        ctx.fillStyle = colours[board[x][y] - 1];
        ctx.fillRect(
          blockWidth * x,
          blockHeight * y,
          blockWidth,
          blockHeight
        );
        ctx.strokeRect(
          blockWidth * x,
          blockHeight * y,
          blockWidth - 1 ,
          blockHeight - 1
        );
      }
    }
  }

  ctx.fillStyle = 'red';
  ctx.strokeStyle = 'black';
  for (var y = 0; y < 4; ++y) {
    for (var x = 0; x < 4; ++x) {
      if ( current[ x ][ y ] ) {
        ctx.fillStyle = colours[ current[ x ][ y ] - 1 ];

        ctx.fillRect(
          blockWidth * (currentX + x),
          blockHeight * (currentY + y),
          blockWidth - 1 ,
          blockHeight - 1
        );
        ctx.strokeRect(
          blockWidth * (currentX + x),
          blockHeight * (currentY + y),
          blockWidth - 1 ,
          blockHeight - 1
        );
      }
    }
  }
}

function drawBlock(x, y) {
  ctx.fillRect(
    blockWidth * x,
    blockHeight * y,
    blockWidth - 1,
    blockHeight - 1
  );
  ctx.strokeRect(
    blockWidth * x,
    blockHeight * y,
    blockWidth - 1,
    blockHeight - 1
  );
}

/**
 * Create a random shape.
 */
function newShape() {
  var randomIndex = Math.floor( Math.random() * shapes.length );
  var shape = shapes[ randomIndex ]; // maintain index for color filling

  // Full the current with the shape
  current = [];
  for ( var x = 0; x < 4; ++x ) {
    current[ x ] = [];
    for ( var y = 0; y < 4; ++y ) {
      var i = 4 * y + x;
      if ( typeof shape[ i ] != 'undefined' && shape[ i ] ) {
        current[x][y] = randomIndex + 1;
      }
      else {
        current[x][y] = 0;
      }
    }
  }

  // new shape starts to move
  isFrozen = false;
  // position where the shape will evolve
  currentX = 5; // Center
  currentY = 0; // Top
}

function rotateShape(current) {
  var updatedShape = [];
  for ( var x = 0; x < 4; ++x ) {
    updatedShape[ x ] = [];
    for ( var y = 0; y < 4; ++y ) {
      // Flip Indexes & Invert one Axis
      updatedShape[ x ][ y ] = current[ y ][ 3 - x ];
    }
  }

  return updatedShape;
}

// ====================================================================
// Helpers

function isValid( offsetX, offsetY, newCurrent ) {
  offsetX = offsetX || 0;
  offsetY = offsetY || 0;
  offsetX = currentX + offsetX;
  offsetY = currentY + offsetY;
  newCurrent = newCurrent || current;

  for ( var x = 0; x < 4; ++x ) {
    for ( var y = 0; y < 4; ++y ) {
      if ( newCurrent[ x ][ y ] ) {
        if ( typeof board[ x + offsetX ] == 'undefined'
          || typeof board[ x + offsetX ][ y + offsetY ] == 'undefined'
          || board[ x + offsetX ][ y + offsetY ]
          || x + offsetX < 0
          || y + offsetY >= rows
          || x + offsetX >= columns )
        {
          if (offsetY == 1 && isFrozen) {
              GameOver = true; // lose if the current shape is settled at the top most row
              $('#tetris-start').prop('disabled', false);

              for (let i = 0; i < enabledToys.length; i++) {
                const toy = enabledToys[i];

                lovense.sendVibration(toy, 20, 5);
              }
          }
          return false;
        }
      }
    }
  }
  return true;
}
function freeze() {
  for ( var y = 0; y < 4; ++y ) {
    for ( var x = 0; x < 4; ++x ) {
      if ( current[ x ][ y ] ) {
        board[ x + currentX ][ y + currentY ] = current[ x ][ y ];
      }
    }
  }
  isFrozen = true;
}


function checkClearLines() {
  var totalRows = 0;
  for ( var y = rows - 1; y >= 0; --y ) {
    var rowFilled = true;
    for ( var x = 0; x < columns; ++x ) {
      if ( board[ x ][ y ] == 0 ) {
        rowFilled = false;
        break;
      }
    }
    if ( rowFilled ) {
      totalRows++;

      for ( var yy = y; yy > 0; --yy ) {
        for ( var x = 0; x < columns; ++x ) {
          board[ x ][ yy ] = board[ x ][ yy - 1 ];
        }
      }
        ++y;
    }
  }

  if ( totalRows > 0 ) {
    totalRowsDismissed += totalRows;

    var level = Math.floor(totalRowsDismissed / 10) + 1;

    for (let i = 0; i < enabledToys.length; i++) {
      const toy = enabledToys[i];

      // Vibration Level is based upon the Current Level of the Game
      // The Number of rows they just dismissed and 1.5 to make it abit more fun ;)
      var vibrationLevel = level * totalRows * 1.5;
      if (vibrationLevel > 20) { vibrationLevel = 20; }

      lovense.sendVibration(toy, Math.abs(vibrationLevel), 1);
    }


    $('#tetris-level').text(
      Math.floor( totalRowsDismissed / 10 ) + 1
    );
  }

  // Display level
}


// ====================================================================
// Start events

init();