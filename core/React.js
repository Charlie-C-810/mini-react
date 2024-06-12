function createElement(type, props, ...children) {
 return {
  type,
  props: {
   ...props,
   children: children.map((child) => {
    const testNode = typeof child === 'string' || typeof child === 'number';
    return testNode ? createTextNode(child) : child;
   }),
  },
 };
}

function createTextNode(text, ...children) {
 return {
  type: 'TEXT_ELEMENT',
  props: {
   nodeValue: text,
   children,
  },
 };
}

let nextWork = null;
let root = null;
let currentRoot = null;

function render(el, container) {
 nextWork = {
  dom: container,
  props: {
   children: [el],
  },
 };
 root = nextWork;
}

function createDom(fiber) {
 const dom =
  fiber.type == 'TEXT_ELEMENT'
   ? document.createTextNode('')
   : document.createElement(fiber.type);

 return dom;
}

function updateDom(dom, nextProps, prevProps) {
 // 1. old 有  new 没有 删除
 Object.keys(prevProps).forEach(key => {
  if (key !== "children") {
   if (!(key in nextProps)) {
    dom.removeAttribute(key)
   }
  }
 })
 // 2. new 有 old 没有 添加
 // 3. new 有 old 有 修改
 Object.keys(nextProps).forEach(key => {
  if (key !== "children") {
   if (nextProps[key] !== prevProps[key]) {
    if (key.startsWith("on")) {
     const eventType = key.slice(2).toLowerCase()

     dom.removeEventListener(eventType, prevProps[key])

     dom.addEventListener(eventType, nextProps[key])
    } else {
     dom[key] = nextProps[key]
    }
   }
  }
 })
}

function update() {
 root = {
  dom: currentRoot.dom,
  props: currentRoot.props,
  alternate: currentRoot,
 }

 nextWork = root
}

function workLoop(deadline) {
 let shouldRun = false;
 while (nextWork && !shouldRun) {
  nextWork = performWorkOfUnit(nextWork);
  // 当剩余时间小于1的时候，就执行下个任务
  shouldRun = deadline.timeRemaining() < 1;
 }
 if (!nextWork && root) {
  commitRoot();
 }
 requestIdleCallback(workLoop);
}

requestIdleCallback(workLoop);

function performWorkOfUnit(fiber) {
 const isFunctionComponent = typeof fiber.type === 'function';
 if (isFunctionComponent) {
  // 更新函数组件
  updateFunctionComponent(fiber);
 } else {
  // 更新普通节点
  updateHostComponent(fiber);
 }

 // 寻找下一个孩子节点，如果有返回
 if (fiber.child) {
  return fiber.child;
 }
 let nextFiber = fiber;
 while (nextFiber) {
  // 如果有兄弟节点，返回兄弟节点
  if (nextFiber.sibling) {
   return nextFiber.sibling;
  }
  // 否则返回父节点
  nextFiber = nextFiber.parent;
 }
}

function commitRoot() {
 commitWork(root.child);
 currentRoot = root
 root = null;
}
function commitWork(fiber) {
 if (!fiber) return;
 let fiberParent = fiber.parent;
 while (!fiberParent.dom) {
  fiberParent = fiberParent.parent;
 }

 if (fiber.effectTag === "update") {
  updateDom(fiber.dom, fiber.props, fiber.alternate?.props)
 } else if (fiber.effectTag === "placement") {
  if (fiber.dom) {
   fiberParent.dom.append(fiber.dom)
  }
 }
 commitWork(fiber.child);
 commitWork(fiber.sibling);
}

// 遍历子节点创建fiber
function reconcileChildren(fiber, children) {
 let oldFiber = fiber.alternate?.child
 let prevChild = null;
 children.forEach((child, index) => {
  const isSameType = oldFiber && oldFiber.type === child.type
  let newFiber
  if (isSameType) {
   // update
   newFiber = {
    type: child.type,
    props: child.props,
    child: null,
    parent: fiber,
    sibling: null,
    dom: oldFiber.dom,
    effectTag: "update",
    alternate: oldFiber,
   }
  } else {
   newFiber = {
    type: child.type,
    props: child.props,
    child: null,
    parent: fiber,
    sibling: null,
    dom: null,
    effectTag: "placement",
   }
  }

  if (oldFiber) {
   oldFiber = oldFiber.sibling
  }

  if (index === 0) {
   fiber.child = newFiber;
  } else {
   prevChild.sibling = newFiber;
  }
  prevChild = newFiber;
 });
}

function updateFunctionComponent(fiber) {
 const children = [fiber.type(fiber.props)];
 reconcileChildren(fiber, children);
}

function updateHostComponent(fiber) {
 if (!fiber.dom) {
  fiber.dom = createDom(fiber);

  updateDom(fiber.dom, fiber.props, {})
 }
 reconcileChildren(fiber, fiber.props.children);
}

const React = {
 createElement,
 render,
 update
};

export default React;
