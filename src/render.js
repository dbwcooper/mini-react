// <div id="root">
//   <input id="search" />
//   <a href="/">goto</a>
// </div>

// const element = {
//   type: 'div',
//   props: {
//     id: 'root',
//     children: [{
//       type: 'input',
//       props: {
//         id: 'search'
//       }
//     }, {
//       type: 'a',
//       props: {
//         href: '/',
//         value: "goto"
//       }
//     }]
//   }
// }

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
 * 渲染
 * @param {Element} element
 * @param {HTMLElement} container
 */
const render = (element, container) => {
  const { type, props } = element;
  const dom = type === 'TEXT_ELEMENT' ? document.createTextNode('') : document.createElement(type);
  const isListener = name => name.startsWith('on');
  const isAttrbute = name => !isListener(name) && name !=='children';
  Object.keys(props)
    .filter(isListener)
    .forEach(name => {
      dom.addEventListener(name.toLowerCase().substring(2), props[name]);
    }
  );
  Object.keys(props)
    .filter(isAttrbute)
    .forEach(name => {
      dom.setAttribute(name, props[name]);
    }
  );

  if (props.children.length > 0) {
    props.children.forEach((child) => {
      render(child, dom)
    })
  }
  container.appendChild(dom);
};

export default render;
