// const promise = new Promise();

// import render from './render'
// import createElement from './createElement'
const render = (element, container) => {
  console.log("element: ", element);
  console.log("typeof element: ", typeof element);
  console.log("container: ", container);
};
const createElement = (element, props) => {
  console.log("element: ", element);
  console.log("typeof element: ", typeof element);
  console.log("props: ", props);
};

const MiniReact = {
  render,
  createElement
};
const El = () => <div>hello world</div>;
MiniReact.render(<div>hello world</div>, document.getElementById("root"));

function render(props, rootDom) {
  const dom = document.createElement("div");
  Object.keys(props).forEach(key => {
    dom.setAttribute(key, props[key]);
  });
  rootDom.appendChild(dom);
}
