
### 简介

使用linkDOM在 dom 元素之间快速画线，创建流程图也变得轻而易举。<br/>
有时候希望在元素之间连接一些线条，在DOM中实现这个还挺麻烦的，linkDOM能帮我们做这件事。

![image](http://wx2.sinaimg.cn/mw690/b8c46fd3ly1fwn8kokr8hj20ln0dewej.jpg)

### 使用
+ 引入 linkDOM
```HTML
<script src='path/to/linkdom.js'></script>
```
+ 下面是一个连接图的完整创建步骤

```javascript
// 在网页渲染完成之后
var lineContainer = LinkDOM.createLineContainer(); // 创建一个容器，一般情况下你只需要一个，返回一个 CoverView
var boxs = Array.from(document.getElementsByClassName('group-1')); // 获取你要连接的一组元素
var target = document.getElementById('box5'); // 目标元素
var lines = LinkDOM.getLines(boxs,target); // 获取所有要渲染的线条，一般情况下你不需要更改它，它可接收第三个参数：config
var lineCover = lineContainer.paint(lines); // 将线条渲染到容器中 返回一个 CoverView
```

+ 创建一个流程图

```javascript
// 在网页渲染完成之后
var lineContainer = LinkDOM.createLineContainer();
var steps = Array.from(document.getElementsByClassName('steps'))
var ctx = lineContainer.getContext(steps[0],conf);
ctx.linkTo(steps[1])
  .linkTo(steps[2])
  .linkTo(steps[3])
  .linkTo(steps[4]);

```

### LinkDOM

#### 方法介绍
+ getLines
三个参数

1.要连接的一组元素，一个真正的数组，Array[element] <br/>
2.目标元素，它必须是 boxs 中的一个，并且它的位置必须在这一组元素的边界上 <br/>
3.配置参数 详见[config]<br/>

获取 所定义的 需要连接的所有元素的信息，它的返回值直接用在 lineContainer 的 paint 方法中

+ createLineContainer
无参数<br/>
创建一个容器并添加到body中，采用绝对定位，该方法返回一个 view 容器，它拥有 CoverView 的全部方法，另外它自身还有另外几个方法

方法 | 说明
---|---
getContext | 返回一个 ctx 详见[ctx] 在该容器中获取一个上下文，接受一个参数 参数为dom元素 表示上下文的起始元素
paint | 在容器中渲染一组线条 参数 必须是 LinkDOM.getLines 的返回值

+ link
两个参数（你想要连接的连个元素）

### CoverView
CoverView 是一个实现了一些 API 的容器

API | 说明
--- | ---
show | 显示容器
hide | 隐藏容器
hidden | 将容器设为透明
appear | 将容器设置为不透明
fadeIn | 淡入， 接收一个时长参数 单位 毫秒（ms）
fadeOut | 淡出， 接收一个时长参数 单位 毫秒（ms）
destroy | 销毁容器 ，将容器从 文档中移除（待实现）
