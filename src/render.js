
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
  const dom = createDom(fiber, fiber.props)
  if (props.children.length > 0) {
    props.children.forEach((child) => {
      render(child, dom)
    })
  }
  parentRoot.appendChild(dom);
};

export default render;
