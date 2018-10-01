var LinkDOM = {};
var Tool = {};

// @storm 
LinkDOM.Point = function(conf) {
  var _this = this;
  Object.keys(conf).forEach(function(key) {
    _this[key] = conf[key];
  })
}

// @storm
LinkDOM.Line = function(){
  this.start = {};
  this.end = {}
}

LinkDOM.Container = function (){
  this.con = Tool.createElement('div',[
    'position:absolute',
    'display:block',
    'left:0px',
    'top:0px',
    'width:100%'
  ]);

  document.getElementsByTagName('body')[0].appendChild(this.con);
}
LinkDOM.Container.prototype.show = function(){
  this.con.style.setProperty('display','block');
}
LinkDOM.Container.prototype.hide = function(){
  this.con.style.setProperty('display','none');
}
LinkDOM.Container.prototype.paint = function(Elines){
  var doc = Tool.linesToFragment(Elines);
  this.con.appendChild(doc);
  return doc;
}


LinkDOM.createLineContainer = function (){
  return new this.Container();
}
// 获取所有需要绘制的线以及其他信息
LinkDOM.getLinesAndInfo = function(els,target,conf){
  var _this = this;
  conf = conf || {};
  var points = els.map(function(item) {
    return _this.getCenterPointCoor(item);
  })
  // el元素矩阵
  var Ematrix = _this.getPointsMatrix(points);
  var targetPoint = _this.getCenterPointCoor(target);

  var linesAndInfo = _this.getLinesCoor(points,Ematrix, targetPoint, conf);
  return linesAndInfo;
}
// @storm 获取元素中心点坐标
// params 
LinkDOM.getCenterPointCoor = function(el) {
  var po = this._getPagePosition(el);
  return new this.Point({
    x: po.left + po.width / 2,
    y: po.top + po.height / 2,
    light: true, // light on 该点是否被点亮
    lined: false,//该点是否已经北连接
    po: po,
    el: true, // element point
    pre: null, // 上一个节点
  })
}

LinkDOM.getLinesCoor = function(points,Ematrix,targetPoint,conf){
  var _this = this;
  var bridgePoint = {};
  var X = Ematrix.X;
  var Y = Ematrix.Y;
  var edge = '';
  var unedge = '';
  var index = {};
  var lines = [];
  // 处理用户未设置但逻辑必需的配置
  conf.lineWidth = conf.lineWidth || Tool.DEFAULT.lineWidth;
  var skewing = conf.skewing;
  // 获取边界方向
  index['x'] = X.indexOf(targetPoint.x);
  index['y']= Y.indexOf(targetPoint.y);
  if(index['x'] === 0 || index['x'] === X.length - 1){
    edge = 'x';
    unedge = 'y';
  } else if(index['y'] === 0 || index['y'] === Y.length - 1){
    edge = 'y';
    unedge = 'x';
  }
  if(!edge){
    console.error('目标元素未在在边界上');
    return
  }
  // 获取桥线上的一点
  bridgePoint[edge] = targetPoint[edge] + (index[edge] === 0 ? skewing : (-1 * skewing));
  bridgePoint[unedge] = targetPoint[unedge];
  //console.log(bridgePoint);
  // 获取 lines
  points.forEach(function(point){
    if(point.x === targetPoint.x && point.y === targetPoint.y){
      return
    }
    var line = new _this.Line();
    line.start[edge] = point[edge];
    line.start[unedge] = point[unedge];
    line.end[edge] = bridgePoint[edge];
    line.end[unedge] = point[unedge];
    line.start[edge] = line.start[edge] 
                       + point.po[edge === 'x' ? 'width' : 'height'] / 2 
                         * (line.start[edge] < line.end[edge] ? 1 : -1)
                       + conf.lineWidth / 2;;
    lines.push(line);
  });
  // 补充最后三条线
  // 连接桥梁
  var unedgeArr = Ematrix[unedge.toUpperCase()];
  [0, unedgeArr.length - 1].forEach(function(index){
    var line = new _this.Line();
    line.start[edge] = bridgePoint[edge];
    line.start[unedge] = unedgeArr[index];
    line.end[edge] = bridgePoint[edge];
    line.end[unedge] = bridgePoint[unedge];
    lines.push(line);
  })
  // 指向目标元素
  var line = new _this.Line();
  line.type = 'target'; // 标记为目标指向元素
  line.start[edge] = bridgePoint[edge];
  line.start[unedge] = bridgePoint[unedge];
  line.end[edge] = targetPoint[edge];
  line.end[unedge] = targetPoint[unedge];
  line.end[edge] =  line.end[edge] 
                    - targetPoint.po[edge === 'x' ? 'width' : 'height'] / 2
                      * (line.start[edge] < line.end[edge] ? 1 : -1)
                    - conf.lineWidth / 2;
  lines.push(line);
  return {
    lines,
    edge,
    unedge,
    conf,
  }
}

LinkDOM.getPointsMatrix = function (points){
  // console.log(points);
  var _this = this;
  var empty = {};
  // 先获取维度
  var Y = []; // Y的第n个索引代表第n行
  var X = []; // X的第n个索引代表第n列
  points.forEach(function(p){
    if(X.indexOf(p.x) < 0){
      X.push(p.x);
    }
    if(Y.indexOf(p.y) < 0){
      Y.push(p.y);
    }
  })
  X.sort(function(a, b){
    return a - b
  })
  Y.sort(function(a, b){
    return a - b
  })
  var matrix = new Array(Y.length);
  for(var i=0; i< matrix.length; i++){
    t = new Array(X.length);
    for(var j = 0; j < t.length; j++){
      t[j] = null;
    }
    matrix[i] = t;
  }
  points.forEach(function(p){
    var coor = _this._findDimCoor(X,Y,p);
    matrix[coor[0]][coor[1]] = p;
  })
  return {
    matrix,
    X,
    Y
  }
}

// 找到某个点在矩阵中的维度坐标，一维是行，二维是列
LinkDOM._findDimCoor = function(X, Y, p) {
  return [Y.indexOf(p.y), X.indexOf(p.x)];
}
// functions
// @storm 获取元素相对文档的绝对定位
LinkDOM._getPagePosition = function(el) {
  var rect = el.getBoundingClientRect();
  rect = JSON.parse(JSON.stringify(rect));
  var scrollX = window.pageXOffset;
  var scrollY = window.pageYOffset;
  ['top', 'bottom'].forEach(function(key) {
    rect[key] = scrollY + Number(rect[key]);
  });
  ['left', 'right'].forEach(function(key) {
    rect[key] = scrollX + Number(rect[key]);
  })
  return rect;
}

// @storm 获取元素相对文档左上角的坐标
LinkDOM._getAnglePointCoor = function(po) {
  return [
    [po.left, po.top],
    [po.right, po.top],
    [po.right, po.bottom],
    [po.left, po.bottom]
  ]
}

// @storm 获取元素盒子边线中点坐标
// 按索引分别对应 上、右、下、左
LinkDOM._getMiddlePointCoor = function(angleCoor) {
  return angleCoor.map(function(item) {
    return (item[0] + item[1]) / 2
  })
}

// Tool
// 默认配置
Tool.DEFAULT = {
  lineWidth:2,
  background :'background:green',
}

// @storm
Tool.createElement = function(tag,cssArr,attr) {
  var dom = document.createElement(tag);
  // console.log(cssArr);
  if(cssArr){
    dom.style.cssText = cssArr.join(';');
  }
  return dom;
}

Tool.linesToFragment = function(Elines) {
  var _this = this;
  var conf = Elines.conf;
  // 处理用户未配置但是逻辑需要的参数
  conf.lineWidth = conf.lineWidth || this.DEFAULT.lineWidth;
  var doc = document.createDocumentFragment();
  // 考虑线宽引起的偏移量
  var container = this.createElement('div',[
    'transform:translate' 
    + Elines.unedge.toUpperCase() 
    + '(' + conf.lineWidth / 2 * -1 +'px)'
  ]);
  Elines.lines.map(function(line){
    return _this.lineToElement(line,conf);
  }).forEach(function(lineDOM){
    container.appendChild(lineDOM)
  })
  doc.appendChild(container);
  return doc
}

// @storm lineToElement
Tool.lineToElement = function(line,conf){
  // console.log(line)
  var left = line.start.x;
  var top =  line.start.y;
  var width = line.start.x === line.end.x 
              ? conf.lineWidth
              : line.end.x - line.start.x;
  var height = line.start.y === line.end.y
              ? conf.lineWidth
              : line.end.y - line.start.y;
  // 进行调整
  if(width < 0){
    left = left + width + conf.lineWidth;
    width = -1 * width;
  }
  if(height < 0){
    top = top + height + conf.lineWidth;
    height = -1 * height;
  }
  //
  return this.createElement('div',[
    'position:absolute',
    this.DEFAULT.background,
    'left:' + left + 'px',
    'top:' + top + 'px',
    'width:'+ width + 'px',
    'height:' + height + 'px'
  ])
}
