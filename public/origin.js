// CReact 的 createElement 函数接收的对象
const elementObj = {
  type: "h1",
  props: {
    // 一个节点拥有的属性，children为 react 框架嵌套子节点的属性
    title: "hello",
    children: []
  }
};
/******** let's start */

// 生成 类 element 结构转换为 TEXT_ELEMENT 的链式结构
const createElement = (type, props, ...children) => {
  return {
    type,
    props,
    children: children.map(child =>
      typeof child === "object"
        ? createElement(child)
        : createTextElement(child)
    )
  };
};

// 特殊的 element， div span p i... 标签的终极内容输出文本信息, 这里生成一种TEXT_ELEMENT， 特殊input textare br 等暂时不考虑。
function createTextElement(text) {
  return {
    type: "TEXT_ELEMENT",
    props: {
      nodeValue: text, // 特有
      children: []
    }
  };
}

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
 * 整个树的结构之中。简单来说就是 是否被执行 appendChild
 *
 * fiber 数据结构
 * fiber = {
 *   type: 'TEXT_ELEMENT',
 *   props: {
 *    children: [element]
 *   },
 *   child: fiber,
 *   dom,
 *   parent: {
 *     dom
 *   }
 * }
 */

// 利用 element 结构 生成真实的dom节点。
const createDom = fiber => {
  const dom =
    fiber.type === "TEXT_ELEMENT"
      ? document.createTextNode("")
      : document.createElement(fiber.type);

  // Object.keys(element.props)
  //   .filter(key => key !== "children")
  //   .forEach(keyName => {
  //     dom[keyName] = element.props[keyName];
  //   });
  updateDom(dom, {}, fiber.props)
  return dom;
};

let nextUnitOfWork = null;
let wipRoot = null;
let currentRoot = null;
let deletions = null;

const isEvent = key => key.startsWith('on');
const isProperty = key => key !== 'children' && !isEvent(key);
const isNew = (prev, next) => key => (prev[key] !== next[key])
const isGone = (prev, next) => key => !(key in next)

function updateDom(dom, prevProps, nextProps) {

  // Remove old or changed event listeners  
  Object.keys(prevProps)
    .filter(isEvent)
    .filter(
      key =>
        !(key in nextProps) ||
        // prev onClick 与 next onClick 不是同一个onClick， 移除prev onClick
        isNew(prevProps, nextProps)(key)
    )
    .forEach(name => {
      const eventType = name.toLowerCase().substring(2);
      dom.removeEventListener(eventType, prevProps[name])
    });
  
  // Remove old properties
  Object.keys(prevProps)
    .filter(isProperty)
    .filter(isGone)
    .forEach(name => {
      dom[name] = '';
    });
  
  // Set new or changed properties
  Object.keys(nextProps)
    .filter(isProperty)
    .filter(isNew(prevProps, nextProps))
    .forEach(name => {
      dom[name] = nextProps[name];
    });

  // Set new Event
  Object.keys(nextProps)
  .filter(isEvent)
  .filter(isNew(prevProps, nextProps)) // click 的实现不一致 需要重新监听 click 
  .forEach(name => {
    const eventType = name.toLowerCase().substring(2);
    dom.addEventListener(
      eventType,
      nextProps[name]
    )
  })
};

// 没有 nextUnitOfWork 了， 可以递归将render的所有子节点 挂载到root节点上了。
function commitRoot() {
  deletions.forEach(commitWork)
  commitWork(wipRoot.child);
  currentRoot = wipRoot;
  wipRoot = null;
}

function commitDeletion(fiber, domParent) {
  if (fiber.dom) {
    domParent.removeChild(fiber.dom)
  } else {
    commitDeletion(fiber.child, domParent)
  }
}

function commitWork(fiber) {
  if (!fiber) {
    return;
  }
  const domParentFiber = fiber.parent;
  while (!domParentFiber.dom) {
    domParentFiber = domParentFiber.parent;
  };

  const domParent = domParentFiber.dom;

  if (fiber.effectTag === "PLACEMENT" && fiber.dom !== null) {
    commitDeletion(fiber, domParent)
  } else if (fiber.effectTag === "DELETION") {
    domParent.removeChild(fiber.dom);
  } else if (fiber.effectTag === "UPDATE" && fiber.dom !== null) {
    updateDom(
      fiber.dom,
      fiber.alternate.props,
      fiber.props
    );
  }
  commitWork(fiber.child);
  commitWork(fiber.sibling);
}

function render(element, container) {
  wipRoot = {
    dom: container,
    props: {
      children: [element]
    },
    alternate: currentRoot // 记录上一次的 fiber 结构， 用来做 diff
  };
  deletions = [];
  nextUnitOfWork = wipRoot;
}

// 控制 render中的 遍历渲染dom节点，以免页面卡死。
// 使用 window 的回调函数 requestIdCallback
const workLoop = deadline => {
  let shouldYield = false;
  while (nextUnitOfWork && !shouldYield) {
    nextUnitOfWork = performUnitOfWork(nextUnitOfWork);
    // 返回一个当前线程的闲置时间 浮点数值，
    showYield = deadline.timeRemaining() < 1; // 线程跑满了， 应该停止dom 渲染
  }

  if (!nextUnitOfWork && wipRoot) {
    commitRoot();
  }
  requestIdleCallback(workLoop);
};

requestIdleCallback(workLoop);

// fiber 为当前需要 appendChidlren 数据结构，包裹了element
const performUnitOfWork = fiber => {
  
  // if (fiber.parent) {
  // 这个操作会直接呈现在页面上，但是很大可能当前节点不是 dom tree中的最后一个dom，
  // 为了让浏览器上呈现的是一个完整的渲染结果的dom  tree 这里需要做一点处理。
  // 用一个 全局变量来控制，当 dom tree 全部都render完成之后，再一次添加到 root 节点上。
  // fiber.parent.dom.appendChild(fiber.dom);
  // }

  const isFunctionComponent = 
    fiber.type instanceof Function
  if (isFunctionComponent) {
    updateFunctionComponent(fiber)
  } else {
    updateHostComponent(fiber)
  }

  if (fiber.child) {
    return fiber.child;
  }
  let nextFiber = fiber;
  while (nextFiber) {
    if (nextFiber.sibling) {
      return nextFiber.sibling;
    }
    nextFiber = nextFiber.parent;
  }
};

let wipFiber = null;
let hookIndex = null;

function updateFunctionComponent(fiber) {
  wipFiber  = fiber;
  hookIndex = 0;
  wipFiber.hooks = [];
  const children = [fiber.type(fiber.props)];
  reconcileChildren(fiber, children);
}

// create useState hook
function useState(initital) {
  const oldHook = 
    wipFiber.alternate &&
    wipFiber.alternate.hooks &&
    wipFiber.alternate.hooks[hookIndex]

  const hook = {
    state: oldHook ? oldHook.state : initital,
    queue: []
  }

  const actions = oldHook ? oldHook.queue : [];
  actions.forEach(action => {
    hook.state = action(hook.state)
  })

  const setState = action => {
    hook.queue.push(action);
    wipRoot = {
      dom: currentRoot.dom,
      props: currentRoot.props,
      alternate: currentRoot.alternate
    }
    nextUnitOfWork = wipRoot,
    deletions = [];
  }

  wipFiber.hooks.push(hook);
  hookIndex++;
  return [hook.state, setState];
}

function updateHostComponent(fiber) {
  if (!fiber.dom) {
    fiber.dom = createDom(fiber);
  }
  reconcileChildren(fiber, fiber.props.children);
}


function reconcileChildren(wipFiber, childElements) {
  // TODO create new fibers
  let index = 0;
  let oldFiber = wipFiber.alternate && wipFiber.alternate.child;
  let prevSibling = null;
  while (index < childElements.length || oldFiber !== null) {
    const element = childElements[index];
    let newFiber = null;
    const sameType = oldFiber && element && element.type === oldFiber.type;
    if (sameType) {
      // UPDATE element
      newFiber = {
        type: oldFiber.type,
        props: element.props,
        dom: oldFiber.dom,
        parent: wipFiber,
        alternate: oldFiber,
        effectTag: "UPDATE"
      };
    }
    if (element && !sameType) {
      // NEW element
      newFiber = {
        type: element.type,
        props: element.props,
        dom: null,
        parent: wipFiber,
        alternate: null,
        effectTag: "PLACEMENT"
      };
    }

    if (oldFiber && !sameType) {
      // DELETE element
      oldFiber.effectTag = "DELETION",
      deletions.push(oldFiber);
    }

    if (oldFiber) {
      oldFiber = oldFiber.sibling;
    }

    if (index === 0) {
      wipFiber.child = newFiber; // newFiber is child and prevSibling
    } else {
      prevSibling.sibling = newFiber;
    }
    prevSibling = newFiber;
    index++;
  }
}

const CReact = {
  createElement,
  render,
  userState
};

/** @jsx CReact.createElement */
function Counter() {
  const [count, setCount] = CReact.userState(1);
  return (
    <h1 onClick={() => setCount(c => c + 1)}>
      count: {count}
    </h1>
  )
}

const element = <Counter />
const container = document.getElementById('root');
CReact.render(element, container)


