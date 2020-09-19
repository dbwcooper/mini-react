1. 什么是 React -> React 做了什么？
   a. 一个 简单的 render 函数代码

   ```
    const dom = document.createElement('div');
    dom.setAttribute("id", 'start_here');
    const nodeValue = document.createTextNode('start here')
    dom.appendChild(nodeValue);
    document.body.appendChild(dom);
   ```

   b. 抽离动作

   ```
   1. 创建真实dom 节点
   2. 节点赋值 （更新节点）
   3. 挂载节点
   ```

2. 尝试一个简单的 类
