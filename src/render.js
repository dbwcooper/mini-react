
import { createElement, createDom, updateDom } from './createElement.js'

/**
 * 
 * fiber = {
 *   type,
 *   props,
 *   dom,
 *   parent, // fiber
 *   child, // fiber
 *   sibling,
 *   alternate, // ??fiber ??????????
 *   effectTag,
 * }
 * 
 */

// ????

let wipRoot = {
  dom: null, // ??fiber??? dom
  props: null,
  alternate: null // ??fiber ??? ????? dom
}
let deletions = []; // play a tag to some fiber (need updating)

let nextUnitOfWork = null; // ????????? fiber

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
  const rootFiber = fiber.parent;
  while (!rootFiber.dom) {
    rootFiber = rootFiber.parent;
  }
  const rootDom = rootFiber.dom;
  if (fiber.effectTag === "PLACEMENT" && fiber.dom !== null) {
    commitDeletion(fiber, rootDom)
  } else if(fiber.effectTag === "DELETION"  && fiber.dom !== null) {
    rootDom.removeChild(fiber.dom)
  } else if(fiber.effectTag === "UPDATE" && fiber.dom !== null) {
    updateDom(fiber.dom, fiber.alternate.props, fiber.props)
  }
  commitWork(fiber.child);
  commitWork(fiber.sibling);
}
// xxxxxx
const commitDeletion = (fiber, rootDom) => {
  if (fiber.dom) {
    rootDom.removeChild(fiber.dom)
  } else {
    commitDeletion(fiber, rootDom)
  }
}


const workLoop = (deadline) => {
  let shouldYield = false;
  while(nextUnitOfWork && !shouldYield) {
    nextUnitOfWork = performUnitOfWork(nextUnitOfWork);
    shouldYield = deadline.timeRemaining() > 1; // free time, go on perform unit work
  };
  if (!nextUnitOfWork && wipRoot) {
    commitRoot();
  }
  requestIdleCallBack(workLoop)
}
requestIdleCallBack(workLoop)

const performUnitOfWork = (fiber) => {

  // update fiber
  const isFunctionComponent = fiber.type instanceof Function;
  if (isFunctionComponent) {
    updateFunctionComponent(fiber)
  } else {
    updateHostComponent(fiber)
  };

  // only to find child and update it
  if (fiber.child) {
    return fiber.child;
  }

  // all fiber‘s childs are found, and the search for parent's sibling
  // start with the last child
  let nextFiber = fiber;
  while (nextFiber) {
    if (nextFiber.sibling) {
      return nextFiber.sibling;
    }
    nextFiber = nextFiber.parent;
  }
  if (!fiber.dom) {
    fiber.dom = createDom(fiber);
  }
  // ?? appendChild ? ????fiber ?????fiber ?
  if (fiber.parent) {
    fiber.parent.dom.appendChild(fiber.dom);
  }

  const elements = fiber.props.children;
  let index = 0;
  let childSibling = null; // ?? ??fiber child ???
  // ?? fiber ? children
  while(index < elements.length) {
    const element = elemnts[index];
    const newFiber = {
      type: element.type,
      props: element.props,
      parent: fiber,
      dom: null
    };
    if (index === 0) {
      fiber.child = newFiber;
    } else {
      childSibling.sibling = newFiber;
    }
    childSibling = newFiber;
  }
  index++;
}

// function component , type is function
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

const reconcileChildren = (wipFiber, childElements) => {
  let index = 0;
  let prevSibling = null;
  let oldFiber = wipFiber.alternate ? wipFiber.alternate.child : null;
  // oldFiber !== null, find the last fiber in fiber tree
  while(index < childElements.length || oldFiber !== null) {
    // i guess: 
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
  wipRoot = {
    dom: parentRoot,
    props: {
      children: [element]
    },
    alternate: currentRoot
  }
  deletions = [];
  nextUnitOfWork = wipRoot;

  // split up
  // requestIdleCallBack; 60hz,  1000ms / 60; 16.7ms;
  
  // 1000 micro task;  1: 5ms; 2: 5ms; how to describe ?

  // ????? ????? ? ??? 60hz? ?? 1? 60 ?
  //  ?? gif ?? ?? ??? ???????????
  //  ????????? ??????? UI ??? JS??? ??????? 
  //  UI ??? JS ?? ????????????? JS UI ??????? (?????????????? ????)
  //  ?? window.addEventListener('load', () => {}); ????????????????????????document.getElementById()
  //  16ms ?????? ????

  // ??? ???????? JS????JS??? UI??????????JS ????????????????UI??
  // requestIdleCallBack ???????JS????? ??????? ?????????????????????????js???
  // ???? ?? react ?? 1000?div???? ?????????? ??? ???????????????? render 10?div
  // js?????? 5ms? ??????? 1ms? ??4ms??????? requestIdleCallBack?? deadline?
  //  ????????????????????? dom??render??? 
  //  ??????????deadline < 1 ; ????????????render div
  //  
  // ????????????????????????? ? ????????????????????????????????????????????
  //   ?????????????????????????????????
  //  ??????????????????????????? ???????
  //     ?? ?????????????????????????react ?? Stellr ????
  //     ??????
  //   ?
  // 

  // if (props.children.length > 0) {
  //   props.children.forEach((child) => {
  //     render(child, dom)
  //   })
  // }
  // parentRoot.appendChild(dom);
};

export default render;
