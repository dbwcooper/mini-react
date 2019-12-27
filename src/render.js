
import { createDom, updateDom } from './createElement.js'

let wipRoot = {
  dom: null, // ??fiber??? dom
  props: null,
  alternate: null // ??fiber ??? ????? dom
}
let deletions = []; // play a tag for every fiber need deleting, all fibers are in one level, so dont traverse down 

let nextUnitOfWork = null;

let currentRoot = null;
let wipFiber = null; // work in progress fiber

// mount dom tree to root
const commitRoot = () => {
  deletions.forEach(commitWork)
  commitWork(wipRoot.child);
  currentRoot = wipRoot;
  wipRoot = null;
}

const commitWork = (fiber) => {
  if(!fiber) {
    return ;
  }
  const domParentFiber = fiber.parent;
  // find dom's parent
  while (!domParentFiber.dom) {
    // a new function fiber, it's fiber.dom is null, so, it's for nest functions
    domParentFiber = domParentFiber.parent;
  }
  if (
    fiber.effectTag === "PLACEMENT" &&
    fiber.dom != null
  ) {
    domParent.appendChild(fiber.dom)
  } else if (
    fiber.effectTag === "UPDATE" &&
    fiber.dom != null
  ) {
    updateDom(
      fiber.dom,
      fiber.alternate.props,
      fiber.props
    )
  } else if (fiber.effectTag === "DELETION") {
    // only deletions fibers jump here 
    commitDeletion(fiber, domParent);
    return;
  }
  
  commitWork(fiber.child);
  commitWork(fiber.sibling);
}
// 1. remove all dom and dom's childs
const commitDeletion = (fiber, domParent) => {
  if (fiber.dom) {
    domParent.removeChild(fiber.dom)
  } else {
    commitDeletion(fiber.child, domParent)
  }
}


const workLoop = (deadline) => {
  let shouldYield = false;
  while(nextUnitOfWork && !shouldYield) {
    nextUnitOfWork = performUnitOfWork(nextUnitOfWork);
    // 1. free time, go on perform unit work
    shouldYield = deadline.timeRemaining() > 1;// 1ms  50
  };
  if (!nextUnitOfWork && wipRoot) {
    commitRoot();
  }
  requestIdleCallBack(workLoop)
}
requestIdleCallBack(workLoop)


// 1. perform a fiber as a unit work, and return next unit work
// 2. the last fiber must be root fiber, and root fiber dont have parent
const performUnitOfWork = (fiber) => {
  const isFunctionComponent = fiber.type instanceof Function;
  if (isFunctionComponent) {
    updateFunctionComponent(fiber)
  } else {
    updateHostComponent(fiber)
  };
 
  // 1.only to find first child and update it
  if (fiber.child) {
    return fiber.child;
  }

  // 1. all fiber's childs are found, and the search for parent's sibling
  let nextFiber = fiber;
  while (nextFiber) {
    if (nextFiber.sibling) {
      return nextFiber.sibling;
    }
    nextFiber = nextFiber.parent;
  }
}

const updateFunctionComponent = (fiber) => {
  wipFiber = fiber;
  const children = [fiber.type(fiber.props)];
  reconcileChildren(fiber, children);
}

const updateHostComponent = (fiber) => {
  if(!fiber.dom) {
    fiber.dom = createDom(fiber);
  }
  reconcileChildren(fiber, fiber.props.children)
}

// 1. Tag all children of the current fiber
// 2. mark the sibling relationship of the childs
const reconcileChildren = (wipFiber, childElements) => {
  let index = 0;
  let prevSibling = null;
  // prevWipFiber 
  let oldFiber = wipFiber.alternate ? wipFiber.alternate.child : null;
  // oldFiber !== null, find the last fiber in fiber tree
  while(index < childElements.length || oldFiber !== null) {
    // react use key in here to avoid some old dom rebuild
    // use key to find exact sibling fiber, in array fibers;
    const element = childElements[index];

    let newFiber = null;
    const sameType = oldFiber && element && element.type === oldFiber.type; 
    if (sameType) {
      // UPDATE Only
      newFiber = {
        type: oldFiber.type,
        props: element.props,
        dom: oldFiber.dom, // keep old dom 
        parent: wipFiber,
        alternate: oldFiber,
        effectTag: 'UPDATE',
      }
    }
    if (element && !sameType) {
      // NEW
      newFiber = {
        type: element.type,
        props: element.props,
        dom: null, // new dom is null, waiting for create
        parent: wipFiber,
        alternate: null, // no alternate
        effectTag: 'PLACEMENT',
      }
    }
    if (oldFiber && !sameType) {
      // DELETE
      oldFiber.effectTag = "DELETION";
      deletions.push(oldFiber); // set deletions array
    }
    // tips: object is reference type
    if (index === 0) {
      wipFiber.child = newFiber;
    } else if (element) {
      // no element no sibling property in fiber
      prevSibling.sibling = newFiber;
    }
    prevSibling = newFiber;
    index++;
  }
}


/**
 * @param {ReactNode} element
 * @param {HTMLElement} parentRoot
 */
const render = (element, parentRoot) => {
/**
 * 
 * fiber = {
 *   type,  ''
 *   props, // 当前fiber 的 props 对应 element 的props
 *   dom, // 当前fiber 对应 的 页面标签 
 *   parent, // fiber
 *   child, // fiber
 *   sibling, // fiber
 *   alternate, // diff 时需要
 *   effectTag, // 更新时需要给每个fiber 打上标记， 遍历 fiber 完毕之后，会根据每个 fiber 的标记 在真实的 Dom 结构上 做 增删改 的操作
 * }
 * 
 */
  wipRoot = {
    dom: parentRoot,
    props: {
      children: [element]
    },
    alternate: currentRoot // prev fiber tree
  }
  deletions = [];
  nextUnitOfWork = wipRoot;
  // if (props.children.length > 0) {
  //   props.children.forEach((child) => {
  //     render(child, dom)
  //   })
  // }
  // parentRoot.appendChild(dom);
};

export default render;


// 整理下fiber约定的执行顺序
// A -> B > C
//      b   c1
//          c2

// A 为 root， 为第一个渲染的节点， A渲染完毕之后 找到A 的子节点 B
// B 为 A 的儿子，B 渲染完后，继续找B的儿子C
// C 为 B 的儿子，C 渲染完成后，继续找C 的儿子 null
// C 没有儿子，开始找 C 的兄弟，开始渲染 c1
// c1 渲染完成后，找 c1 的儿子，
// c1 没有儿子，找 c1 未被渲染的兄弟 c2
// c2 渲染完成后，找 c2 的儿子
// c2 没有儿子，找 c2 未被渲染的兄弟
// c2 没有未被渲染的兄弟了，找c2 的 叔叔 B
// B 被渲染了， 找B 的兄弟 b
// 渲染b。渲染过程结束。

/**
 * render 函数的本质
 * const childNode = document.body.createElement('div');
 * rootNode.appendChild(childNode);
 * 
 * 结合 element对象的特点，衍生一个新的数据结构 fiber 来控制div是否应该被加入到
 * 整个树的结构之中。简单来说就是 是否被执行 appendChild， 以及dom 的更新操作。
 *
 * 抽离为三个动作，
 * 1. 根据div 结构创建 对应的 js 树 (fiber tree) 结构，(建立 虚拟Dom Tree) ()
 * 2. 从顶部遍历 js 树结构，给每个 div对应的 fiber 打上tag， NEW | UPDATE | DELETE (reconcileChildren)
 * 3. 将 fiber tree 更新到 dom， appendChild(); (commitWork)
 */

 
  // split up
  // requestIdleCallBack; 60hz,  1000ms / 60; 16.7ms;
  
  // 1000 micro task;  1: 5ms; 2: 5ms; how to describe ?

  // 认为感知到页面流畅 30 ~ 60hz, 页面刷新的频率 1s  60次， 16.7ms 一次  [hz](https://www.shuzhiduo.com/A/RnJWw0rYJq/)
  //  一帧做了什么： UI JS 事件线程, 还有其他的工作， [浏览器的 工作原理](https://zhuanlan.zhihu.com/p/47407398)  
  //  UI 与 JS 进程 不能同时执行，一般是JS 执行完成之后 UI 进程开始工作， window.addEventListener('load', () => {}); 很好解释了这一点。
  //  同时执行会有什么问题: 浏览器提供的 APi 无法正常工作 document.getElementById
  //  
  //  假如 一帧的 时间为 16.7ms, 如果在 10ms 内 UI JS 等 进程完成了任务， 那么 说明时间有富余，此时就会执行 requestIdleCallback 里注册的任务。
  // 
