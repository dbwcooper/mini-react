
import { createElement, createDom, updateDom } from './createElement.js'

/**
 * @param {ReactNode} element
 * @param {HTMLElement} parentRoot
 */
const render = (element, parentRoot) => {
  const { type, props } = element;
  const fiber = {
    type,
    props,
    dom: null
  }
  const dom = createDom(fiber, fiber.props);

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
  // ?? ???????? ?? ???

  if (props.children.length > 0) {
    props.children.forEach((child) => {
      render(child, dom)
    })
  }
  parentRoot.appendChild(dom);
};

const workLoop = (deadline) => {
  let shouldYield = false;
  while(!shouldYield) {
    // working
    if (deadline.timeRemaining() > 1) {
      // go on work
      performUnitOfWork()
    } else {
      // waiting for free time 
      shouldYield = true;
    }
  };
  requestIdleCallBack(workLoop)
}
requestIdleCallBack(workLoop)

const performUnitOfWork = (fiber) => {
  // TODO: ????micro work, ?? Fiber ??
  //
}
export default render;
