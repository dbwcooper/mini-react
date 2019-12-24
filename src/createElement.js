
/**
 * 
 * @param {string} text 
 * @returns { type, props }
 */
const createTextElement = (text) => {
  return {
    type: 'TEXT_ELEMENT', // use document.createTextNode('') replace createElement
    props: {
      nodeValue: text,
      children: []
    }
  }
}
/**
 * 
 * @param {string} type 
 * @param {object} props 
 * @param  {...object} children 
 * @returns { type, props }
 */
const createElement = (type, props, ...children) => {
  return {
    type,
    props: {
      ...props,
      children: children.map(
        child =>
          typeof child === 'object'
          ? createElement(child)
          : createTextElement(child)
      )
    }
  }
};

/**
 * 
 * @param {object} fiber 
 * @returns HTMLElement
 */
const createDom = (fiber) => {
  const dom = fiber.type === 'TEXT_ELEMENT'
    ? document.createTextNode('')
    : document.createElement(fiber.type);
  // updateDom(fiber, )
  return dom;
}

const updateDom = () => {
  // TODO
}

export default createElement;
