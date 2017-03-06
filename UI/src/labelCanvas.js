var shapes = [];

class Shape {
  constructor(clickable, onClick, ctx, bkgFillStyle, strokeStyle, lineWidth){
    this.clickable = clickable; // boolean. Is this a clickable element?
    this.onClick = onClick; // function to handle click events
    this.ctx = ctx; // HTML canvas context
    this.bkgFillStyle = bkgFillStyle; // ctx for fill style. HTML color as string.
    this.strokeStyle = strokeStyle; // ctx for stroke. HTML color as string.
    this.lineWidth = lineWidth; // ctx for lineWidth. number.
    this.dependentShapes = []
    shapes.push(this)
  }

  render () {
    console.err('Shape.render() is an abstract method.');
  }

  hide () {
    console.err('Shape.hide() is an abstract method.');
  }
  inShape (x, y) {
    console.err('Shape.inShape() is an abstractMethod.');
  }
}

class Box extends Shape {
  constructor(clickable, onClick, ctx, bkgFillStyle, strokeStyle, lineWidth, fontStyle, fontWeight, textAlign, coordinates, bkg, border, text, textHeight, textColor) {
    super(clickable, onClick, ctx, bkgFillStyle, strokeStyle, lineWidth);
    this.fontStyle = fontStyle; // font style as string. sans-serif
    this.fontWeight = fontWeight; // weight as string. bold normal
    this.textAlign = textAlign; // ctx for text alignment. left right center;
    this.c = coordinates; // object with keys x1, y1, x2, y2 and number values.
    this.bkg = bkg; // should background be drawn? bool.
    this.border = border; // object with keys top, left, right, bottom and values bool
    this.text = text; // string to be written
    this.textHeight = textHeight; // integer. e.g. 12
    this.textColor = textColor; // HTML color for ctx
  }

  get font(){
    return this.fontWeight + ' ' + this.textHeight.toString() + 'px ' + this.fontStyle;
  }

  get width(){
    return Math.abs(this.c.x2 - this.c.x1);
  }

  get height(){
    return Math.abs(this.c.y2 - this.c.y1);
  }

  get lines(){
    // return an array of lines that fits the given width, as computed in get width()
    const characters = this.text.split('');
    var lines = [];
    var currentLine = characters[0];

    for (var i = 1; i < characters.length; i++) {
      var char = characters[i];
      var width = this.ctx.measureText(currentLine + char).width;
      if (width < this.width) {
        currentLine += char;
      } else {
        lines.push(currentLine);
        currentLine = char;
      }
    }

    // make sure we don't return an arary [undefined]
    if (currentLine !== undefined && currentLine !== null){
      lines.push(currentLine);
    }
    return lines;
  }

  computeY2(){
    // get the number of lines and infer and set the height of the object
    // this resets the y2 variable.
    // 1.6 is just a ballpark that happens to work
    // there's not much rhyme or reason to it. :/
    this.c.y2 = this.c.y1 + this.lines.length * this.textHeight * 1.5;
  }

  inShape(x, y){
    // is the provided point in the shape? returns bool
    if((this.c.x1 <= x) && (x <= this.c.x2) && (this.c.y1 <= y) && (y <= this.c.y2)){
      return true;
    }
    return false;
  }

  render(){
    // recompute the y2 variable
    if(this.text !== null && this.text !== ''){
      this.computeY2();
    }

    // set canvas variables
    this.ctx.fillStyle = this.bkgFillStyle;
    this.ctx.strokeStyle = this.strokeStyle;
    this.ctx.lineWidth = this.lineWidth;
    this.ctx.font = this.font;

    // render background
    if (this.bkg){
      this.ctx.fillRect(this.c.x1, this.c.y1, this.width, this.height);
    }

    // render text
    this.ctx.fillStyle = this.textColor;
    this.ctx.textAlign = this.textAlign

    var offsetY = this.textHeight; // how much farther down should each line of text go?
    var offsetX = 0; // deals with text align center
    if (this.textAlign.toLowerCase() === 'center'){
      offsetX += this.width/2
    }
    for (var i = 0; i < this.lines.length; i++) {
      var l = this.lines[i];
      this.ctx.fillText(l, this.c.x1 + offsetX, this.c.y1 + offsetY);
      offsetY += this.textHeight;
    }

    // render borders
    this.ctx.beginPath()
    if (this.border.top) {
      this.ctx.moveTo(this.c.x1, this.c.y1);
      this.ctx.lineTo(this.c.x2, this.c.y1);
      this.ctx.stroke();}

    if (this.border.right) {
      this.ctx.moveTo(this.c.x2, this.c.y1);
      this.ctx.lineTo(this.c.x2, this.c.y2);
      this.ctx.stroke();}

    if (this.border.bottom) {
      this.ctx.moveTo(this.c.x2, this.c.y2);
      this.ctx.lineTo(this.c.x1, this.c.y2);
      this.ctx.stroke();}

    if (this.border.left) {
      this.ctx.moveTo(this.c.x1, this.c.y2);
      this.ctx.lineTo(this.c.x1, this.c.y1);
      this.ctx.stroke();}
  }

  hide(){
    this.ctx.fillStyle = 'white'
    var x1 = this.c.x1;
    var y1 = this.c.y1;
    var width = this.width;
    var height = this.height;

    if(this.border.top){
      y1 += -this.lineWidth;
      height += this.lineWidth
    }

    if(this.border.right){
      width += this.lineWidth;
    }

    if(this.border.bottom){
      height += this.lineWidth;
    }

    if(this.border.left){
      x1 += -this.lineWidth;
      width += this.lineWidth;
    }

    this.ctx.fillRect(x1, y1, width, height);
  }
}

class Triangle extends Shape {
  constructor(clickable, onClick, ctx, bkgFillStyle, strokeStyle, lineWidth, coordinates, bkg) {
    super(clickable, onClick, ctx, bkgFillStyle, strokeStyle, lineWidth);
    this.c = coordinates; // object with keys x1 y1 x2 y2, x3 y3 and number values
    this.bkg = bkg; // should the background be drawn? bool.
  }

  inShape(x, y) {
    // is the provided point in the shape? returns bool

    // compute the area of the shape
    const a = this._triangleArea(this.c.x1, this.c.y1, this.c.x2, this.c.y2, this.c.x3, this.c.y3);

    // compute the area of all triangles made by two of the shapes verticies and the point
    const a1 = this._triangleArea(x, y, this.c.x2, this.c.y2, this.c.x3, this.c.y3);
    const a2 = this._triangleArea(this.c.x1, this.c.y1, x, y, this.c.x3, this.c.y3);
    const a3 = this._triangleArea(this.c.x1, this.c.y1, this.c.x2, this.c.y2, x, y);

    // if sum of the smaller triangles equals the area, it's in the shape
    if (a === a1+a2+a3){
      return true;
    }
    return false;
  }

  _triangleArea(x1, y1, x2, y2, x3, y3){
    // the area of the triangle created by the three points
    return Math.abs((x1*(y2-y3) + x2*(y3-y1)+ x3*(y1-y2))/2.0);
  }

  render(){
    this.ctx.fillStyle = this.bkgFillStyle;
    this.ctx.strokeStyle = this.strokeStyle;
    this.ctx.lineWidth = this.lineWidth;

    this.ctx.beginPath();
    this.ctx.moveTo(this.c.x1, this.c.y1);
    this.ctx.lineTo(this.c.x2, this.c.y2);
    this.ctx.lineTo(this.c.x3, this.c.y3);
    this.ctx.lineTo(this.c.x1, this.c.y1);
    this.ctx.lineTo(this.c.x2, this.c.y1); // extra stroke to deal with pointed triangle vertex
    this.ctx.stroke()

    if (this.bkg){
      this.ctx.fill();
    }
  }
}

////////////////////////////////
/////// passing functions //////
////////////////////////////////

// show or hide the edge menu when clicked
// function to be passed to triangle's onClick
var showOrHideMenu = function (shapeClicked){
  // set the toggle
  shapeClicked.toggle = !shapeClicked.toggle;

  if(shapeClicked.toggle === true){
    for (var i = 0; i < shapeClicked.dependentShapes.length; i++) {
      var shapesToShow = shapeClicked.dependentShapes[i];
      shapesToShow.render()
      shapesToShow.clickable = true;
    }
  }
  else{
    console.log('triangle off!');
    for (var j = 0; j < shapeClicked.dependentShapes.length; j++) {
      var shapesToHide = shapeClicked.dependentShapes[j];
      shapesToHide.hide()
      shapesToHide.clickable = false;
    }

  }
}

var requestEdge = function(edge, source){
  var query = 'neighbor_search("'+ source + '", ' + edge + ')'
  console.log(query);
  window.makeRequest(query, window.handleRequestResponse);
  window.updateQueryEdgeType(edge);

  // assuming the request succeeded, the overlay layer will be gone
  document.body.style.cursor = 'default';
}

////////////////////////////////
//// instantiation functions ///
////////////////////////////////


function instantiateBackgroundBox(ctx, x, y){
  const width = 225;
  const height = 200;
  const margin = {top: 15, left: 5, right: 5};
  const border = {top: true, right: true, bottom:true, left: true};
  const coords = {x1: x - width/2, y1: y + margin.top, x2: x + width/2, y2: height + y + margin.top}; // y2 isn't clear yet.
  var bkgrndBox = new Box(false, null, ctx, '#f2f2f2', 'black', 1, 'sans-serif', 'bold', 'center', coords, true, border, '', 12, 'black');
  return bkgrndBox;
}

function instantiateTriangle(ctx, x, y){
  const width = 17;
  const height = 10;
  const coords = {}
  coords.x1 = x;
  coords.y1 = y;
  coords.x2 = coords.x1 + width;
  coords.y2 = coords.y1;
  coords.x3 = (coords.x1 + coords.x2)/2;
  coords.y3 = coords.y1 + height;
  var triangle = new Triangle(true, showOrHideMenu, ctx, 'black', 'black', 0, coords, true);
  return triangle;
}

function instantiateSourceBox(ctx, source, x1, y1, x2, y2){
  if (!y2){ // y2 may not be passed, in which case it's updated later
    y2 = 0;
  }

  const border = {top: false, right: false, bottom: false, left:false};
  const coords = {x1: x1, y1:y1, x2:x2, y2:y2};
  var sourceBox = new Box(false, null, ctx, '#f2f2f2', 'green', 1, 'sans-serif', 'bold', 'center', coords, false, border, source, 12, 'black')
  return sourceBox;
}

function instantiateEdgeBoxes(ctx, source, x1, y1, x2){
  const border = {top: true, right:true, bottom: true, left: true}
  const edges = [
          {text: 'Find similar content', algebra: 'content_sim'},
          {text: 'Find similar context', algebra: 'schema_sim'},
          {text: 'Find PKFK', algebra: 'pkfk'}];

  var edgeBoxes = [];
  for (var i = 0; i < edges.length; i++) {
    var edge = edges[i];
    var coords = {x1: x1, y1: y1, x2: x2, y2: 0};

    const edgeType = edge.algebra;
    let onClick = () => {requestEdge(edgeType, source)};

    var edgeBox = new Box(true, onClick, ctx, 'white', 'black', 1, 'sans-serif', 'normal', 'left', coords, true, border, edge['text'], 12, 'black');
    edgeBox.computeY2();
    y1 = edgeBox.c.y2;
    edgeBoxes.push(edgeBox);
  }

  return edgeBoxes;
}

function instantiateSelectedBoxes(ctx, columnsSelected, x1, y1, x2){
  var selectedBoxes = [];
  for (var k in columnsSelected){
    // for-in guard that react yells about if it's not here
    if (!Object.prototype.hasOwnProperty.call(columnsSelected, k)) {
      break;
    }
    const text = columnsSelected[k]['field_name'];
    const border = {top: true, right: false, bottom: false, left:false};
    const margin = {top: 5, right: 5, bottom: 5, left: 5}
    const coords = {x1: x1, y1:0, x2: x2, y2: 0}; // again, y2 isn't clear yet
    const selectedBox = new Box(true, null, ctx, null, 'black', 1, 'sans-serif', 'normal', 'left', coords, false, border, text, 12, 'black');

    if (selectedBoxes.length === 0){
      selectedBox.c.y1 = y1 + margin.top
    } else{
      selectedBox.c.y1 = selectedBoxes[selectedBoxes.length-1].c.y2;
    }

    selectedBox.computeY2();
    selectedBoxes.push(selectedBox);
  }
  return selectedBoxes;
}

function instantiateFieldsRemainingBoxes(ctx, num, x1, y1, x2, y2){
  if (!y2){ // y2 may not be passed, in which case it's updated later
    y2 = 0;
  }
  const border = {'top': true, 'right': false, 'bottom': false, 'left': false}
  const text = num.toString() + ' more fields...';
  const coords = {x1: x1, y1: y1, x2: x2, y2: 0};

  var fieldsRemainingBox = new Box(false, null, ctx, 'black', 'gray', 1, 'sans-serif', 12, 'left', coords, false, border, text, 12, 'black');
  return fieldsRemainingBox
}

////////////////////////////////
////// rendering function //////
////////////////////////////////

export function renderCanvas(source, columnsSelected, columnsAll, x, y){
  // get the sigma-mouse canvas, clone and modify
  const mouseCanvas = document.getElementsByClassName('sigma-mouse')[0]
  const newCanvas = cloneCanvasAndInsertAbove(mouseCanvas);
  const ctx = newCanvas.getContext('2d');

  // define variables for the background box
  var bkgrndWidth = 225;
  var bkgrndMargin = {top: 15, left: 5, right: 5};

  // create the background box when nodes are clicked
  var bkgrndBox = instantiateBackgroundBox(ctx, x, y);

  // create the triangle
  var triangle = instantiateTriangle(ctx, x + bkgrndWidth/2 + bkgrndMargin.left, y + bkgrndMargin.top);
  triangle.render()

  // create the source title
  const sourceMargin = {top: 5, right: 5, bottom: 5, left: 5};
  const x1_source = bkgrndBox.c.x1 + sourceMargin.left;
  const x2_source = bkgrndBox.c.x2 - sourceMargin.right;
  const y1_source = bkgrndBox.c.y1 + sourceMargin.top;
  var sourceBox = instantiateSourceBox(ctx, source, x1_source, y1_source, x2_source, undefined);
  sourceBox.computeY2();


  // display columns that the user selected
  const x1_selectedBoxes = bkgrndBox.c.x1 + sourceMargin.left;
  const y1_selectedBoxes = sourceBox.c.y2 + sourceMargin.top;
  const x2_selectedBoxes = bkgrndBox.c.x2 - sourceMargin.right;
  var selectedBoxes = instantiateSelectedBoxes(ctx, columnsSelected, x1_selectedBoxes, y1_selectedBoxes, x2_selectedBoxes);


  // unselected fields remaining
  const numUnselected = Object.keys(columnsAll).length - Object.keys(columnsSelected).length;
  const x1_remaining = bkgrndBox.c.x1 + sourceMargin.left;
  const y1_remaining = selectedBoxes[selectedBoxes.length-1].c.y2;
  const x2_remaining = bkgrndBox.c.x2 - sourceMargin.right;
  var fieldsRemainingBox = instantiateFieldsRemainingBoxes(ctx, numUnselected, x1_remaining, y1_remaining, x2_remaining)
  fieldsRemainingBox.computeY2();

  // set background box y2 coordinate
  bkgrndBox.c.y2 = fieldsRemainingBox.c.y2 + 5;

  // instantiate the edgeBoxes
  const x1_edgeBox = bkgrndBox.c.x2 + sourceMargin.right;
  const y1_edgeBox = triangle.c.y3 + sourceMargin.bottom;
  const x2_edgeBox = bkgrndBox.c.x2 + sourceMargin.right + 150;
  const edgeBoxes = instantiateEdgeBoxes(ctx, source, x1_edgeBox, y1_edgeBox, x2_edgeBox);
  triangle.dependentShapes = triangle.dependentShapes.concat(edgeBoxes);


  bkgrndBox.render();
  sourceBox.render();
  for (var i = 0; i < selectedBoxes.length; i++) {
    selectedBoxes[i].render()
  }
  fieldsRemainingBox.render();
}


/////// /////// ///////
// helper functions //
///// /////// ///////

function cloneCanvasAndInsertAbove(oldCanvas){
  const newCanvas = oldCanvas.cloneNode(true);
  newCanvas.className = 'aurum-overlay';
  newCanvas.id = 'aurum-overlay';

  const ctx = newCanvas.getContext('2d');
  const scale = window.devicePixelRatio;
  ctx.scale(scale, scale);
  insertAfter(oldCanvas, newCanvas);
  newCanvas.addEventListener('mousemove', (event)=>handleMousemove(event));
  newCanvas.addEventListener('click', (event)=>handleClick(event));
  return newCanvas;
}

function handleClick(event){
  const x = event.layerX;
  const y = event.layerY;
  var clickInShape = false; // was the click inside of an existing shape?
  for (var i = shapes.length - 1; i >= 0; i--) {
    var shape = shapes[i];
    if(shape.inShape(x, y)){
      clickInShape = true;
    }

    if(shape.clickable && shape.inShape(x, y)){
      shape.onClick(shape);
      clickInShape = true;
      break;
    }
  }
  if(clickInShape !== true){
    removeOverlay();
  }
}

function handleMousemove(event){
  const x = event.layerX;
  const y = event.layerY;
  for (var i = 0; i < shapes.length; i++) {
    if(shapes[i].clickable && shapes[i].inShape(x, y)){
      // condition is entered, but cursor style not changed. Not sure why.
      document.body.style.cursor = 'pointer';
      return;
    }
  }
  document.body.style.cursor = 'default';
}

function insertAfter(referenceNode, newNode) {
    referenceNode.parentNode.insertBefore(newNode, referenceNode.nextSibling);
}

export function removeOverlay(){
    const canvas = document.getElementById('aurum-overlay')
    canvas.parentNode.removeChild(canvas)
}