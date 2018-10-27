var LinkDOM = {
  Tool:{}
};

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

LinkDOM.createLineContainer = function (){
  var linesCon = LinkDOM.Tool.createElement('div',LinkDOM.Tool.DEFAULT.linesContainerCss);
  document.getElementsByTagName('body')[0].appendChild(linesCon);
  var coverView = new LinkDOM.Tool.CoverView(linesCon);
  coverView.paint = function(Elines){
    var doc = LinkDOM.Tool.linesToFragment(Elines);
    var lineCon = doc.firstChild;
    this.dom.appendChild(doc);
    return new LinkDOM.Tool.CoverView(lineCon);
  }
  coverView.link = function(source, target, conf){
    return this.paint(LinkDOM.getLines([source,target], target, conf));
  }
  coverView.getContext = function (source, config){
    return new LinkDOM.Tool.DrawContext(this, source, config);
  }
  return coverView
}


// 获取所有需要绘制的线以及其他信息
LinkDOM.getLines = function(els,target,conf){
  var _this = this;
  conf = conf || {};
  var maxDiameter = 0;
  var points = els.map(function(item) {
    var point = _this.getCenterPointCoor(item);
    maxDiameter = point.diameter > maxDiameter ? point.diameter : maxDiameter;
    return point
  });
  if(typeof conf.bridgeLineSkewing === 'undefined'){
    conf.bridgeLineSkewing = maxDiameter * 0.5 + (maxDiameter > 1000 ? 200 : maxDiameter * 0.2);
  }
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
    diameter: po.width > po.height ? po.width : po.height
  })
}

LinkDOM.getLinesCoor = function(points,Ematrix,targetPoint,conf){
  var _this = this;
  var bridgePoint = {};
  var X = Ematrix.X;
  var Y = Ematrix.Y;
  var edge;
  var unedge;
  var index = {};
  var lines = [];
  // 处理用户未设置但逻辑必需的配置
  conf.lineWidth = conf.lineWidth || LinkDOM.Tool.DEFAULT.lineWidth;
  var skewing = conf.bridgeLineSkewing || LinkDOM.Tool.DEFAULT.bridgeLineSkewing;
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
  if(points.length === 2){
    if(X.length > 1){
       edge = 'x';
       unedge = 'y';
    } else if(Y.length > 1){
      edge = 'y';
      unedge = 'x';   
    }
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
    line.type = 'source'; // 标记为源头发出的线
    line.start[edge] = point[edge];
    line.start[unedge] = point[unedge];
    line.end[edge] = bridgePoint[edge];
    line.end[unedge] = point[unedge];
    line.start[edge] = line.start[edge] 
                       + point.po[edge === 'x' ? 'width' : 'height'] / 2 
                         * (line.start[edge] < line.end[edge] ? 1 : -1)
                       + conf.lineWidth / 2;
    lines.push(line);
  });
  // 补充最后三条线
  // 连接桥梁
  var unedgeArr = Ematrix[unedge.toUpperCase()];
  [0, unedgeArr.length - 1].forEach(function(index){
    var line = new _this.Line();
    line.type = 'middle'; // 标记为中间的桥接线
    line.start[edge] = bridgePoint[edge];
    line.start[unedge] = unedgeArr[index];
    line.end[edge] = bridgePoint[edge];
    line.end[unedge] = bridgePoint[unedge];
    lines.push(line);
  })
  // 指向目标元素
  var line = new _this.Line();
  line.type = 'target'; // 标记指向目标的线
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
  var scrollX = window.pageXOffset;
  var scrollY = window.pageYOffset;
  ['top', 'bottom'].forEach(function(key) {
    rect[key] =  parseInt(scrollY) + parseInt(rect[key]);
  });
  ['left', 'right'].forEach(function(key) {
    rect[key] =  parseInt(scrollX) + parseInt(rect[key]);
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

// LinkDOM.Tool
// 默认配置
LinkDOM.Tool.DEFAULT = {
  lineWidth:2,
  bridgeLineSkewing:50,
  backgroundColor:'#00868B',
  linesContainerCss:[
    'position:absolute',
    'display:block',
    'left:0px',
    'top:0px',
    'width:100%',
    'opacity:1'
  ],
  fadeIn:{
    duration: 300
  }
}

// 静态常量
LinkDOM.Tool.STATIC = {
  arrowLocalMap:{
    arrowStart_x_true:'left:0',
    arrowMiddle_x_true:'left:50%',
    arrowEnd_x_true:'right:0',
    arrowStart_y_true:'top:0',
    arrowMiddle_y_true:'top:50%',
    arrowEnd_y_true:'bottom:0',
    arrowStart_x_false:'right:0',
    arrowMiddle_x_false:'right:50%',
    arrowEnd_x_false:'left:0',
    arrowStart_y_false:'bottom:0',
    arrowMiddle_y_false:'bottom:50%',
    arrowEnd_y_false:'top:0',
  }
}

LinkDOM.Tool._getArrowMainCss = function(lineType,local,line,conf){
  // default
  var lineConfig = conf[lineType] || {}
  var cssArr = [
    'color:'+ (conf.arrowColor || conf.backgroundColor || this.DEFAULT.backgroundColor),
    'position:absolute',
    'border-style:solid',
    'z-index:100'
  ];
  var edge = line.start.x === line.end.x ? 'y' : 'x'; // 边界方向
  var unedge = edge === 'x' ? 'y' : 'x';
  // border
  var borderWidth = [];
  var borderColor = [];
  var arrowConfig = lineConfig[local];
  if(typeof arrowConfig === 'boolean' || !arrowConfig){
    arrowConfig = {};
  }
  var arrowColor = arrowConfig.arrowColor || 'currentcolor'; // 箭头的颜色
  conf.arrowSize = conf.arrowSize || conf.lineWidth;
  var i = 0;
  while(i < 4){
    borderWidth.push(conf.arrowSize + 'px');
    if(this._isLightOnArrowPart(line,i + 1,edge)){
      borderColor.push(arrowColor);
    } else {
      borderColor.push('transparent');
    }
    i++;
  }
  cssArr.push('border-width:' + borderWidth.join(' '));
  cssArr.push('border-color:' + borderColor.join(' '));
  // 箭头位置
  var localCss;
  if(edge === 'x'){
    localCss = this.STATIC.arrowLocalMap[local +'_'+ edge + '_' + (line.end.x - line.start.x > 0)];
  } else {
    localCss = this.STATIC.arrowLocalMap[local +'_'+ edge + '_' + (line.end.y - line.start.y > 0)];
  }
  if(local === 'arrowEnd'&& line.type === 'source'){
    var p = 1;
    if((line.end.x < line.start.x || line.end.y < line.start.y)){
      p = -1;
    }
    localCss = localCss.replace(':0',':' + conf.lineWidth  / 2 * p + 'px');
  }
  cssArr.push(localCss);
  // 计算偏移距离
  p = 1;
  if((line.end.x > line.start.x || line.end.y > line.start.y)){
   p = -1;
  }
  var skew = [
    (conf.arrowSize + conf.lineWidth / 2) + 'px',
    conf.arrowSize * -1  + conf.lineWidth/2 + 'px'
  ];
  if(edge === 'y'){
    skew.reverse();
  }
  cssArr.push('transform:translate('+ skew.join(',') +')');
  return cssArr;
}
// 判断是否是箭头线段的尾部
LinkDOM.Tool._isLightOnArrowPart = function (line,index,edge) {
  if(edge === 'x'){
    if(index === 1 || index === 3){
      return false;
    } else {
      if(index === 4){
        return line.end.x - line.start.x > 0;
      } else {
        return line.start.x - line.end.x > 0;
      }
    }
  }
  if(edge === 'y'){
    if(index === 2 || index === 4){
      return false;
    } else {
      if(index === 1){
        return line.end.y - line.start.y > 0;
      } else {
        return line.start.y - line.end.y > 0;
      }
    }
  }
}
// 创建箭头
LinkDOM.Tool.createArrow = function(lineType,local,line,conf) {
  var val = conf[lineType][local];
  var arrowMainCss = this._getArrowMainCss(lineType,local,line,conf);
  if(typeof val === 'object' && val !== null && val.css){
    Object.keys(val.css).forEach(function(key){
      arrowMainCss.push(key + ':' + val.css[key]);
    })
  }
  return this.createElement(
    'div',
    arrowMainCss, 
    conf[lineType] ? conf[lineType].attr : null
  )
}
// @storm
// 扩展原生  createElement
LinkDOM.Tool.createElement = function(tag,cssArr,attr) {
  var dom = document.createElement(tag);
  if(cssArr){
    dom.style.cssText += cssArr.join(';');
  }
  if(attr && typeof attr === 'object'){
    Object.keys(attr).forEach(function(key){
      dom.setAttribute(key,attr[key]);
    })
  }
  return dom;
}
// 创建line dom元素，放在文档片段中
LinkDOM.Tool.linesToFragment = function(Elines) {
  var _this = this;
  var conf = Elines.conf;
  // 处理用户未配置但是逻辑需要的参数
  conf.lineWidth = conf.lineWidth || this.DEFAULT.lineWidth;
  var doc = document.createDocumentFragment();
  // 考虑线宽引起的偏移量
  var container = this.createElement('div',[
    'opacity:1',
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
LinkDOM.Tool.lineToElement = function(line,conf){
  var _this = this;
  var lineDOM = null; // line dom
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
  lineDOM = this.createElement('div',[
    'position:absolute',
    'background-color:' + this.DEFAULT.backgroundColor,
    'left:' + left + 'px',
    'top:' + top + 'px',
    'width:'+ width + 'px',
    'height:' + height + 'px',
    'z-index:99'
  ]);
  
  ['lineConfig','lastLineConfig'].forEach(function (lineType){
    if (
      (line.type === 'source' && lineType === 'lineConfig') || 
      (lineType === 'lastLineConfig' && line.type === 'target')
    ){ 
      // 根据配置修改线条样式
      if(conf[lineType]){
        // 创建箭头
        ['arrowEnd','arrowMiddle','arrowStart'].forEach(function(key){
          if(conf[lineType][key]){
            lineDOM.appendChild(_this.createArrow(lineType,key,line,conf))
          }
        });
        
        // 将用户自定义的内容添加到线条了
        ['innerHTML'].forEach(function(key){
          if(conf[lineType][key]){
            var t = conf[lineType][key];
            if(typeof t === 'string'){
              _this.textToNodes(t).forEach(function(node){
                lineDOM.appendChild(node);
              });
            }
            if(_this.isDOM(t)){
              lineDOM.appendChild(t)
            }
          }
        })
      }
    }
  })
  return lineDOM
}

// @storm
LinkDOM.Tool.textToNodes = function(text){
  // 检查类型， 要求必须是
  var nodes = [];
  if(typeof text === 'string'){
    var con = document.createElement('div');
    con.innerHTML = text;
    nodes = Array.from(con.childNodes);
  }
  return nodes;
}

// @storm 判断一个对象是否为DOM对象
LinkDOM.Tool.isDOM = ( typeof HTMLElement === 'object' ) ?
  function(obj){
      return obj instanceof HTMLElement;
  } :
  function(obj){
      return obj && typeof obj === 'object' && obj.nodeType === 1 && typeof obj.nodeName === 'string';
  }
  LinkDOM.Tool.merge = function(target, source){
    for(let prop in source){
      if(source.hasOwnProperty(prop) && typeof source[prop] !== 'undefined'){
         target[prop] = source[prop];
      }
    }
  }

  // Interface
  LinkDOM.Tool.CoverView = function (dom){
    if(LinkDOM.Tool.isDOM(dom)){
      this.dom = dom;
      this.style = this.dom.style;
    } else {
      console.error('dom except');
    }
  }
  LinkDOM.Tool.CoverView.prototype.show = function(){
    this.dom.style.setProperty('display','block');
    return this;
  }
  LinkDOM.Tool.CoverView.prototype.hide = function(){
    this.dom.style.setProperty('display','none');
    return this;
  }
  LinkDOM.Tool.CoverView.prototype.hidden = function(){
    this.dom.style.setProperty('opacity',0);
    return this;
  }
  
  LinkDOM.Tool.CoverView.prototype.appear = function(){
    this.dom.style.setProperty('opacity',1);
    return this;
  }

  LinkDOM.Tool.CoverView.prototype.fadeIn = function(dur){
    console.log(this);
    var _this = this;
    dur = dur || this.DEFAULT.fadeIn.duration;
    this.style.setProperty('opacity', 0);
    _this.show();
    setTimeout(function(){
      _this.style.setProperty('transition','all ' + dur/1000 + 's ease-in-out');
      _this.style.setProperty('opacity', 1);
    },0);
    return this;
  }

  LinkDOM.Tool.CoverView.prototype.fadeOut = function(dur){
    var _this = this;
    dur = dur || this.DEFAULT.fadeIn.duration;
    setTimeout(function(){
      _this.style.setProperty('transition','all ' + dur/1000 + 's ease-in-out');
      _this.style.setProperty('opacity', 0);
    },0);
    return this;
  }

  LinkDOM.Tool.DrawContext = function(container, source, config){
    this.$coverViews = [];
    this.$elements = [source];
    this.$container = container;
    this.$config = config || {};
  }
  LinkDOM.Tool.DrawContext.prototype.linkTo = function(target,config){
    config && LinkDOM.Tool.merge(this.$config,config);
    var source = this.$elements.slice(-1)[0];
    var coverView = this.$container.paint(LinkDOM.getLines([source,target],target,this.$config));
    this.$elements.push(target);
    // fadeIn 的优先级高
    if(typeof this.$config.fadeIn === 'number'){
      coverView.fadeIn(this.$config.fadeIn);
    } else if(typeof this.$config.fadeOut === 'number'){
      coverView.fadeOut(this.$config.fadeOut);
    }
    return this;
  }
