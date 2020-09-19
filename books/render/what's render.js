// render func recieve objects of similar structure
const elementObj = {
  type: "div",
  props: {
    id: "hello",
    children: [
      {
        type: "TEXT_ELEMENT",
        props: {
          nodeValue: "hello world"
        }
      }
    ]
  }
};

function render(elementObj = elementObj, root) {
  const { type, props } = elementObj;

  // foreach every element
  //   1. how do it traverse the entire structure?
  //       a. it rely on a new strctural named Fiber.
  //       b. we need to design a mechanism to handle the pause and acceleration of the traverse
  // create  dom and update this dom
  //   1. how do it create a dom
  //      a. what type of the dom should I create
  //    2. how do it update a dom
  //      a. how do it verify that the dom needs to be updated
  //      b. what happens to the dom after the update operation (such as delete a dom)
  // mount doms to root (root.appendChild())

  if (type === "TEXT_ELEMENT") {
    const textDom = document.createTextNode();
    textDom.setAttribute("nodeValue", props.value);
    return textDom;
  } else {
    const dom = document.createElement(type);
    return dom;
  }
  if (type) {
    const dom = document.createTextNode();
    dom.setAttribute("nodeValue", props.value);
    return dom;
  }

  const dom = document.createElement(type);
  Object.keys(props).forEach(key => {
    if (key !== "children") {
      dom.setAttribute(key, key);
    } else {
      props.children.forEach(element => {
        if (type === "TEXT_ELEMENT") {
        }
      });
    }
  });
  dom.setAttribute("value", value);
  root.appendChild(dom);
}
