
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
 * @param {Fiber} fiber 
 * @param {object} nextProps 
 * @returns HTMLElement
 */
const createDom = (fiber, nextProps) => {
  const dom = fiber.type === 'TEXT_ELEMENT'
    ? document.createTextNode('')
    : document.createElement(fiber.type);
  
  // update Dom
  updateDom(fiber.dom, {}, nextProps)
  return dom;
}

/*
fiber = {
  type: "",
  props: {
    children: []
  },
  dom: {}, // current dom
  alternate: {}, // prev dom
  parent: {}, // parent fiber
  child: {}, // child fiber
}
*/
/**
 * @param {HTMLElement} dom 
 * @param {HTMLElement} newDom 
 */
const updateDom = (dom, prevProps, nextProps) => {
  const isEvent = key => key.startsWith('on');
  const isProperty = key => !isEvent(key) && key !== 'children';

  // add: isNew
  // delete: isGone
  // update: isUpdated
  const isNew = (prev, next) => (key) => !(key in prev) && (key in next);
  const isGone = (prev, next) => (key) => (key in prev) && !(key in next);
  const isUpdated = (prev, next) => (key) => prev[key] !== next[key];

  // delete property
  Object.keys(prevProps)
    .filter(isGone(prevProps, nextProps))
    .forEach(key => {
    if (isEvent(key)) {
      const event = key.toLowerCase().substr(2);
      dom.removeEventListener(event)
    } else if (isProperty(key)) {
      dom.removeAttribute(key);
    }
  });

  // set new dom property
  Object.keys(nextProps)
    .filter(isNew(prevProps, nextProps))
    .forEach(key => {
      if (isEvent(key)) {
        const event = key.toLowerCase().substr(2);
        dom.addEventListener(event, nextProps[key])
      } else if (isProperty(key)) {
        dom.setAttribute(key, nextProps[key]);
      }
    });

  // update dom property
  Object.keys(nextProps)
    .filter(!isNew(prevProps, nextProps))
    .filter(!isGone(prevProps, nextProps))
    .filter(isUpdated(prevProps, nextProps))
    .forEach(key => {
      if (isEvent(key)) {
        const event = key.toLowerCase().substr(2);
        dom.addEventListener(event, nextProps[key])
      } else if (isProperty(key)) {
        dom.setAttribute(key, nextProps[key]);
      }
    });
}

export {
  createElement as default,
  createDom,
  updateDom,
}
