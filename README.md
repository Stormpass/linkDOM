# linkDOM
linkDOM做的事情很简单，帮助你把网页上的元素连接起来。它使用起来及其简单，就像这样

```javascript
const boxs = Array.from(document.getElementsByClassName('box'));
const target = document.getElementById('box3');
const lineContainer = LinkDOM.createLineContainer();
const linesAndInfo = LinkDOM.getLinesAndInfo(boxs,target,conf);
const view = lineContainer.paint(linesAndInfo);
```